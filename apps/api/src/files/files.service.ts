import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { FileScanStatus } from "@prisma/client";
import { Queue } from "bullmq";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { matchesFileSignature, validateUploadMetadata } from "./file-policy";
import { StorageService } from "./storage.service";

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService, @InjectQueue("file-scan") private readonly scans: Queue) {}
  async createIntent(versionId: string, originalName: string, mimeType: string, sizeBytes: number) {
    validateUploadMetadata(mimeType, sizeBytes);
    await this.prisma.documentVersion.findUniqueOrThrow({ where: { id: versionId } });
    const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}`;
    const asset = await this.prisma.fileAsset.create({ data: { versionId, originalName: originalName.slice(0, 255), mimeType, sizeBytes, quarantineKey: key } });
    const uploadUrl = await this.storage.client.presignedPutObject(this.storage.quarantineBucket, key, 15 * 60);
    return { id: asset.id, uploadUrl, expiresInSeconds: 900 };
  }
  async complete(id: string) {
    const asset = await this.prisma.fileAsset.findUniqueOrThrow({ where: { id } });
    const stat = await this.storage.client.statObject(this.storage.quarantineBucket, asset.quarantineKey).catch(() => null);
    if (!stat || stat.size !== asset.sizeBytes) throw new BadRequestException("ไฟล์ที่อัปโหลดไม่ตรงกับ metadata");
    const signatureStream = await this.storage.client.getPartialObject(this.storage.quarantineBucket, asset.quarantineKey, 0, 4);
    const chunks: Buffer[] = [];
    for await (const chunk of signatureStream) chunks.push(Buffer.from(chunk));
    if (!matchesFileSignature(asset.mimeType, Buffer.concat(chunks))) {
      await this.storage.client.removeObject(this.storage.quarantineBucket, asset.quarantineKey);
      await this.prisma.fileAsset.update({ where: { id }, data: { scanStatus: FileScanStatus.FAILED } });
      throw new BadRequestException("ชนิดไฟล์จริงไม่ตรงกับ MIME ที่ระบุ");
    }
    const updated = await this.prisma.fileAsset.update({ where: { id }, data: { scanStatus: FileScanStatus.QUARANTINED } });
    await this.scans.add("scan", { fileAssetId: id }, { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 });
    return updated;
  }
  getStatus(id: string) { return this.prisma.fileAsset.findUnique({ where: { id }, select: { id: true, scanStatus: true, scannedAt: true } }); }
  async download(id: string) {
    const asset = await this.prisma.fileAsset.findUniqueOrThrow({ where: { id } });
    if (asset.scanStatus !== FileScanStatus.CLEAN || !asset.evidenceKey) throw new NotFoundException();
    return { url: await this.storage.client.presignedGetObject(this.storage.evidenceBucket, asset.evidenceKey, 5 * 60), expiresInSeconds: 300, filename: asset.originalName };
  }
}

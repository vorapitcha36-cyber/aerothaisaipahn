import { Processor, WorkerHost } from "@nestjs/bullmq";
import { FileScanStatus } from "@prisma/client";
import type { Job } from "bullmq";
import { createHash } from "node:crypto";
import { connect } from "node:net";
import type { Readable } from "node:stream";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "./storage.service";

@Processor("file-scan")
export class FileScanProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) { super(); }
  async process(job: Job<{ fileAssetId: string }>) {
    const asset = await this.prisma.fileAsset.findUniqueOrThrow({ where: { id: job.data.fileAssetId } });
    await this.prisma.fileAsset.update({ where: { id: asset.id }, data: { scanStatus: FileScanStatus.SCANNING } });
    const stream = await this.storage.client.getObject(this.storage.quarantineBucket, asset.quarantineKey);
    const result = await scanStream(stream);
    if (!result.clean) {
      await this.storage.client.removeObject(this.storage.quarantineBucket, asset.quarantineKey);
      await this.prisma.fileAsset.update({ where: { id: asset.id }, data: { scanStatus: FileScanStatus.INFECTED, sha256: result.sha256, scannedAt: new Date() } });
      return;
    }
    const evidenceKey = `${asset.versionId}/${asset.id}`;
    await this.storage.client.copyObject(this.storage.evidenceBucket, evidenceKey, `/${this.storage.quarantineBucket}/${asset.quarantineKey}`);
    await this.storage.client.removeObject(this.storage.quarantineBucket, asset.quarantineKey);
    await this.prisma.fileAsset.update({ where: { id: asset.id }, data: { scanStatus: FileScanStatus.CLEAN, evidenceKey, sha256: result.sha256, scannedAt: new Date() } });
  }
}

async function scanStream(stream: Readable): Promise<{ clean: boolean; sha256: string }> {
  const hash = createHash("sha256");
  const host = process.env.CLAMAV_HOST || "localhost"; const port = Number(process.env.CLAMAV_PORT || 3310);
  return new Promise((resolve, reject) => {
    const socket = connect(port, host); let response = "";
    socket.on("connect", async () => {
      socket.write(Buffer.from("zINSTREAM\0"));
      try {
        for await (const raw of stream) { const chunk = Buffer.from(raw); hash.update(chunk); const length = Buffer.alloc(4); length.writeUInt32BE(chunk.length); socket.write(length); socket.write(chunk); }
        socket.write(Buffer.alloc(4));
      } catch (error) { socket.destroy(); reject(error); }
    });
    socket.on("data", chunk => { response += chunk.toString("utf8"); });
    socket.on("end", () => resolve({ clean: response.includes("OK"), sha256: hash.digest("hex") }));
    socket.on("error", reject);
  });
}

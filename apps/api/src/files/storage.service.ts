import { Injectable, OnModuleInit } from "@nestjs/common";
import { Client } from "minio";

@Injectable()
export class StorageService implements OnModuleInit {
  readonly quarantineBucket = process.env.MINIO_QUARANTINE_BUCKET || "quarantine";
  readonly evidenceBucket = process.env.MINIO_EVIDENCE_BUCKET || "evidence";
  readonly client = new Client({
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "aerothai",
    secretKey: process.env.MINIO_SECRET_KEY || "change-me"
  });
  async onModuleInit() {
    for (const bucket of [this.quarantineBucket, this.evidenceBucket]) {
      if (!(await this.client.bucketExists(bucket))) await this.client.makeBucket(bucket);
    }
  }
}

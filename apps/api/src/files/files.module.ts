import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { StorageService } from "./storage.service";

@Module({ imports: [BullModule.registerQueue({ name: "file-scan" })], controllers: [FilesController], providers: [FilesService, StorageService], exports: [FilesService, StorageService] })
export class FilesModule {}

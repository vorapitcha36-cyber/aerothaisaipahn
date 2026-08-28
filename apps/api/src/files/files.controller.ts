import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../common/auth.decorators";
import { FilesService } from "./files.service";

@Controller("files")
export class FilesController {
  constructor(private readonly files: FilesService) {}
  @Post("upload-intents") @Roles(Role.ADMIN, Role.EDITOR)
  intent(@Body() body: { versionId: string; originalName: string; mimeType: string; sizeBytes: number }) { return this.files.createIntent(body.versionId, body.originalName, body.mimeType, body.sizeBytes); }
  @Post(":id/complete") @Roles(Role.ADMIN, Role.EDITOR) complete(@Param("id") id: string) { return this.files.complete(id); }
  @Get(":id/status") status(@Param("id") id: string) { return this.files.getStatus(id); }
  @Get(":id/download") download(@Param("id") id: string) { return this.files.download(id); }
}

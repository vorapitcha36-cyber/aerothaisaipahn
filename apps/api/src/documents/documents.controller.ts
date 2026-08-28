import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { Role, WorkflowStatus, type User } from "@prisma/client";
import type { Request } from "express";
import { CurrentUser, Roles } from "../common/auth.decorators";
import { DocumentsService, type DocumentInput } from "./documents.service";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}
  @Get() list(@CurrentUser() user: User, @Query("categoryId") categoryId?: string, @Query("locationId") locationId?: string, @Query("status") status?: WorkflowStatus, @Query("search") search?: string) { return this.documents.list(user, { categoryId, locationId, status, search }); }
  @Get(":id") get(@Param("id") id: string) { return this.documents.get(id); }
  @Post() @Roles(Role.ADMIN, Role.EDITOR) create(@CurrentUser() user: User, @Body() body: DocumentInput, @Req() req: Request) { return this.documents.create(user, body, req); }
  @Patch(":id") @Roles(Role.ADMIN, Role.EDITOR) update(@Param("id") id: string, @CurrentUser() user: User, @Body() body: Partial<DocumentInput>, @Req() req: Request) { return this.documents.update(id, user, body, req); }
  @Post(":id/versions") @Roles(Role.ADMIN, Role.EDITOR) version(@Param("id") id: string, @CurrentUser() user: User, @Body() body: DocumentInput, @Req() req: Request) { return this.documents.createVersion(id, user, body, req); }
  @Post(":id/submit") @Roles(Role.ADMIN, Role.EDITOR) submit(@Param("id") id: string, @CurrentUser() user: User, @Req() req: Request) { return this.documents.submit(id, user, req); }
  @Post(":id/review") @Roles(Role.ADMIN) review(@Param("id") id: string, @CurrentUser() user: User, @Body() body: { decision: "APPROVE" | "CHANGES_REQUESTED"; comment?: string }, @Req() req: Request) { return this.documents.review(id, user, body.decision, body.comment, req); }
  @Post(":id/archive") @Roles(Role.ADMIN) archive(@Param("id") id: string, @CurrentUser() user: User, @Req() req: Request) { return this.documents.archive(id, user, req); }
}

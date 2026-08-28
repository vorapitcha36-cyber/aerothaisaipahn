import { Body, Controller, Get, Param, Patch, Req } from "@nestjs/common";
import { Role, UserStatus } from "@prisma/client";
import type { Request } from "express";
import { AuditService } from "../audit/audit.service";
import { Roles } from "../common/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";

@Controller("admin/users")
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  @Get()
  list() { return this.prisma.user.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], select: { id: true, email: true, displayName: true, avatarUrl: true, role: true, status: true, createdAt: true, approvedAt: true } }); }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: { role?: Role; status?: UserStatus }, @Req() req: Request) {
    const before = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    const actor = req.user as { id: string };
    const after = await this.prisma.user.update({ where: { id }, data: { role: body.role, status: body.status, approvedAt: body.status === UserStatus.ACTIVE ? new Date() : undefined, approvedById: body.status === UserStatus.ACTIVE ? actor.id : undefined } });
    await this.audit.record(req, "USER_ACCESS_UPDATED", "User", id, before, after);
    return after;
  }
}

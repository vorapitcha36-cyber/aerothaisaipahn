import { Controller, Get, Query } from "@nestjs/common";
import { Role } from "@prisma/client";
import { Roles } from "../common/auth.decorators";
import { PrismaService } from "../prisma/prisma.service";

@Controller("audit-logs")
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  list(@Query("cursor") cursor?: string) {
    return this.prisma.auditLog.findMany({
      take: 50,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, email: true, displayName: true } } }
    });
  }
}

import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  async record(req: Request | undefined, action: string, entityType: string, entityId?: string, beforeJson?: unknown, afterJson?: unknown, metadata?: unknown) {
    const user = req?.user as { id?: string } | undefined;
    return this.prisma.auditLog.create({ data: {
      actorId: user?.id,
      action,
      entityType,
      entityId,
      ipAddress: req?.ip,
      userAgent: req?.get("user-agent"),
      beforeJson: beforeJson as Prisma.InputJsonValue | undefined,
      afterJson: afterJson as Prisma.InputJsonValue | undefined,
      metadata: metadata as Prisma.InputJsonValue | undefined
    }});
  }
}

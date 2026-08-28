import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { NotificationType, WorkflowStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationsService } from "./notifications.service";

@Injectable()
export class DueReminderService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}
  @Cron("0 0 8 * * *", { timeZone: "Asia/Bangkok" })
  async run() {
    const now = new Date(); const in30 = new Date(now.getTime() + 30 * 86_400_000);
    const documents = await this.prisma.documentRecord.findMany({ where: { workflowStatus: WorkflowStatus.ACTIVE, nextReviewAt: { lte: in30 } }, include: { createdBy: true, location: true, category: true } });
    for (const document of documents) {
      const overdue = document.nextReviewAt < now;
      const since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const exists = await this.prisma.notification.findFirst({ where: { userId: document.createdById, resourceId: document.id, type: overdue ? NotificationType.OVERDUE : NotificationType.REVIEW_DUE, createdAt: { gte: since } } });
      if (!exists) await this.notifications.create(document.createdById, document.createdBy.email, overdue ? NotificationType.OVERDUE : NotificationType.REVIEW_DUE, overdue ? "เอกสารเกินกำหนดทบทวน" : "เอกสารใกล้ถึงวันทบทวน", `${document.category.nameTh} · ${document.location.nameTh}`, document.id);
    }
  }
}

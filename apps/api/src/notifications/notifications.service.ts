import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { NotificationType, Role } from "@prisma/client";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, @InjectQueue("notifications") private readonly queue: Queue) {}
  list(userId: string) { return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }); }
  read(userId: string, id: string) { return this.prisma.notification.updateMany({ where: { id, userId }, data: { readAt: new Date() } }); }
  async notifyAdmins(type: NotificationType, title: string, body: string, resourceId?: string) {
    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN, status: "ACTIVE" } });
    for (const admin of admins) await this.create(admin.id, admin.email, type, title, body, resourceId);
  }
  async create(userId: string, email: string, type: NotificationType, title: string, body: string, resourceId?: string) {
    const notification = await this.prisma.notification.create({ data: { userId, type, title, body, resourceId } });
    await this.queue.add("email", { notificationId: notification.id, email, title, body }, { attempts: 5, backoff: { type: "exponential", delay: 5000 } });
    return notification;
  }
}

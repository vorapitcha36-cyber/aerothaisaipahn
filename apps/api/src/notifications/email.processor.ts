import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import nodemailer from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

@Processor("notifications")
export class EmailProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) { super(); }
  async process(job: Job<{ notificationId: string; email: string; title: string; body: string }>) {
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || "localhost", port: Number(process.env.SMTP_PORT || 1025), secure: process.env.SMTP_SECURE === "true" });
    await transport.sendMail({ from: process.env.SMTP_FROM || "AEROTHAI Security <security@example.com>", to: job.data.email, subject: job.data.title, text: job.data.body });
    await this.prisma.notification.update({ where: { id: job.data.notificationId }, data: { emailSentAt: new Date() } });
  }
}

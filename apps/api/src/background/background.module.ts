import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { FileScanProcessor } from "../files/file-scan.processor";
import { FilesModule } from "../files/files.module";
import { DueReminderService } from "../notifications/due-reminder.service";
import { EmailProcessor } from "../notifications/email.processor";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [FilesModule, NotificationsModule, BullModule.registerQueue({ name: "file-scan" }, { name: "notifications" })],
  providers: [FileScanProcessor, EmailProcessor, DueReminderService]
})
export class BackgroundModule {}

import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { BackgroundModule } from "./background/background.module";
import { PrismaModule } from "./prisma/prisma.module";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({ connection: { host: redisUrl.hostname, port: Number(redisUrl.port || 6379), username: redisUrl.username || undefined, password: redisUrl.password || undefined } }),
    BackgroundModule
  ]
})
export class WorkerModule {}

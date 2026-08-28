import { BullModule } from "@nestjs/bullmq";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { AuthenticationGuard, RolesGuard } from "./common/auth.guards";
import { CsrfMiddleware } from "./common/csrf.middleware";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DocumentsModule } from "./documents/documents.module";
import { FilesModule } from "./files/files.module";
import { MasterModule } from "./master/master.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRoot({ connection: { host: redisUrl.hostname, port: Number(redisUrl.port || 6379), username: redisUrl.username || undefined, password: redisUrl.password || undefined } }),
    AuthModule,
    AuditModule,
    MasterModule,
    DashboardModule,
    DocumentsModule,
    FilesModule,
    NotificationsModule
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(CsrfMiddleware).forRoutes("*"); }
}

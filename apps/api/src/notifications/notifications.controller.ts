import { Controller, Get, Param, Post } from "@nestjs/common";
import type { User } from "@prisma/client";
import { CurrentUser } from "../common/auth.decorators";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() list(@CurrentUser() user: User) { return this.notifications.list(user.id); }
  @Post(":id/read") read(@CurrentUser() user: User, @Param("id") id: string) { return this.notifications.read(user.id, id); }
}

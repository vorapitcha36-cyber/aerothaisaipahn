import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminUsersController } from "./admin-users.controller";
import { MasterController } from "./master.controller";

@Module({ imports: [AuditModule], controllers: [MasterController, AdminUsersController] })
export class MasterModule {}

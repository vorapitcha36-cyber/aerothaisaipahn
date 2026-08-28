import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role, User } from "@prisma/client";
import { IS_PUBLIC_KEY, ROLES_KEY } from "./auth.decorators";

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const user = context.switchToHttp().getRequest().user as User | undefined;
    if (!user) throw new UnauthorizedException("กรุณาเข้าสู่ระบบ");
    if (user.status !== "ACTIVE") throw new ForbiddenException(user.status === "PENDING" ? "บัญชีอยู่ระหว่างรออนุมัติ" : "บัญชีถูกระงับ");
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest().user as User | undefined;
    if (!user || !required.includes(user.role)) throw new ForbiddenException("ไม่มีสิทธิ์ดำเนินการ");
    return true;
  }
}

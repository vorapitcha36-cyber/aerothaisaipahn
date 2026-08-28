import { Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import type { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly prisma: PrismaService) { super(); }
  serializeUser(user: User, done: (error: Error | null, id?: string) => void) { done(null, user.id); }
  async deserializeUser(id: string, done: (error: Error | null, user?: User | null) => void) {
    try { done(null, await this.prisma.user.findUnique({ where: { id } })); } catch (error) { done(error as Error); }
  }
}

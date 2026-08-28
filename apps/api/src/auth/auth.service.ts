import { Injectable } from "@nestjs/common";
import type { Profile } from "passport-google-oauth20";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  async acceptGoogleProfile(profile: Profile) {
    const email = profile.emails?.[0]?.value.toLowerCase();
    if (!email || profile.emails?.[0]?.verified === false) throw new Error("Google email must be verified");
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return this.prisma.user.update({ where: { id: existing.id }, data: { googleSubject: profile.id, displayName: profile.displayName || existing.displayName, avatarUrl: profile.photos?.[0]?.value } });
    return this.prisma.user.create({ data: { googleSubject: profile.id, email, displayName: profile.displayName || email, avatarUrl: profile.photos?.[0]?.value } });
  }
}

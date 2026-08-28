import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type Profile, type VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "./auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(private readonly auth: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || "google-client-not-configured",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "google-secret-not-configured",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/v1/auth/google/callback",
      scope: ["email", "profile"]
    });
  }
  async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    try { done(null, await this.auth.acceptGoogleProfile(profile)); } catch (error) { done(error as Error); }
  }
}

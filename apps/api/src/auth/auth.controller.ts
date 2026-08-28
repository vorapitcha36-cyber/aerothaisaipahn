import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { Request, Response } from "express";
import { Public } from "../common/auth.decorators";

@Controller("auth")
@Public()
export class AuthController {
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleLogin() {}

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  callback(@Req() req: Request, @Res() res: Response) {
    const origin = process.env.APP_ORIGIN || "http://localhost:5173";
    const user = req.user as { status?: string };
    res.redirect(user?.status === "ACTIVE" ? origin : `${origin}/?auth=pending`);
  }

  @Get("me")
  me(@Req() req: Request) {
    const user = req.user as { id: string; email: string; displayName: string; avatarUrl?: string; role: string; status: string } | undefined;
    if (!user) return null;
    return { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl, role: user.role, status: user.status };
  }

  @Post("logout")
  logout(@Req() req: Request) { return new Promise<{ ok: true }>((resolve, reject) => req.logout(error => error ? reject(error) : req.session.destroy(error => error ? reject(error) : resolve({ ok: true })))); }
}

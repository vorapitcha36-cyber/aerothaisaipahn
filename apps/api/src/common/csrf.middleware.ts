import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.["XSRF-TOKEN"] as string | undefined;
    if (!token) {
      token = randomBytes(32).toString("base64url");
      res.cookie("XSRF-TOKEN", token, { httpOnly: false, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/" });
    }
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      const header = req.header("x-csrf-token") ?? "";
      const a = Buffer.from(token);
      const b = Buffer.from(header);
      if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ForbiddenException("CSRF token ไม่ถูกต้อง");
    }
    next();
  }
}

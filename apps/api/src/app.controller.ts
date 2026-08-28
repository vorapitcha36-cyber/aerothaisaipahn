import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/auth.decorators";

@Controller()
export class AppController {
  @Get("health")
  @Public()
  health() { return { status: "ok", service: "aerothai-security-api", timestamp: new Date().toISOString() }; }
}

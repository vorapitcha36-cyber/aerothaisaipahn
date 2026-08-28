import { Controller, Get, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get("summary") summary() { return this.dashboard.summary(); }
  @Get("map") map() { return this.dashboard.map(); }
  @Get("coverage") coverage(@Query("locationId") locationId?: string) { return this.dashboard.coverage(locationId); }
}

import { describe, expect, it, vi } from "vitest";
import { DashboardService } from "./dashboard.service";

describe("DashboardService", () => {
  it("computes 224 pending cells from 32 locations and seven categories", async () => {
    const prisma = {
      location: { findMany: vi.fn().mockResolvedValue(Array.from({ length: 32 }, (_, index) => ({ id: `l${index}`, type: index < 9 ? "CENTER" : "OUTSTATION" }))) },
      category: { findMany: vi.fn().mockResolvedValue(Array.from({ length: 7 }, (_, index) => ({ id: `c${index}` }))) },
      documentRecord: { findMany: vi.fn().mockResolvedValue([]) }
    };
    const result = await new DashboardService(prisma as never).summary();
    expect(result).toMatchObject({ centers: 9, outstations: 23, pending: 224, overdue: 0 });
  });
});

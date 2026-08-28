import { describe, expect, it } from "vitest";
import { calculateCoveragePending, canTransition, getLifecycleStatus, hasPermission } from "./index";

describe("document lifecycle", () => {
  it("enforces configured workflow transitions", () => {
    expect(canTransition("DRAFT", "PENDING_REVIEW")).toBe(true);
    expect(canTransition("DRAFT", "ACTIVE")).toBe(false);
    expect(canTransition("PENDING_REVIEW", "ACTIVE")).toBe(true);
  });

  it("calculates due states without persisting derived values", () => {
    const now = new Date("2026-08-28T08:00:00+07:00");
    expect(getLifecycleStatus("2026-09-20", now)).toBe("DUE_SOON");
    expect(getLifecycleStatus("2026-10-20", now)).toBe("CURRENT");
    expect(getLifecycleStatus("2026-08-27", now)).toBe("OVERDUE");
  });
});

describe("coverage and permissions", () => {
  it("starts with 224 pending cells for 32 locations and 7 categories", () => {
    const locations = Array.from({ length: 32 }, (_, i) => `l${i}`);
    const categories = Array.from({ length: 7 }, (_, i) => `c${i}`);
    expect(calculateCoveragePending(locations, categories, new Set())).toBe(224);
  });

  it("removes one pending cell after a document becomes active", () => {
    const locations = Array.from({ length: 32 }, (_, i) => `l${i}`);
    const categories = Array.from({ length: 7 }, (_, i) => `c${i}`);
    expect(calculateCoveragePending(locations, categories, new Set(["l0:c0"]))).toBe(223);
  });

  it("keeps review permission admin-only", () => {
    expect(hasPermission("ADMIN", "review")).toBe(true);
    expect(hasPermission("EDITOR", "review")).toBe(false);
  });
});

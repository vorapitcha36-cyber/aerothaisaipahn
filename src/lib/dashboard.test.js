import { describe, expect, it } from "vitest";
import { AREAS, COMPLIANCE_TOPICS } from "../data/masterData";
import {
  STORAGE_KEY,
  addReviewMonths,
  createInitialState,
  createRecords,
  dashboardReducer,
  getComplianceStatus,
  getDaysRemaining,
  getKpis,
  getReminderBucket,
  getReminders,
  hydrateState,
  serializeState,
  validateComplianceDates,
  validateFile,
} from "./dashboard";

const referenceDay = new Date("2026-08-29T05:00:00.000Z");

describe("master data and date rules", () => {
  it("contains 9 centers, 23 towers, 32 areas, 7 topics and 224 initial records", () => {
    expect(AREAS.filter((area) => area.type === "center")).toHaveLength(9);
    expect(AREAS.filter((area) => area.type === "tower")).toHaveLength(23);
    expect(AREAS).toHaveLength(32);
    expect(COMPLIANCE_TOPICS).toHaveLength(7);
    expect(createRecords()).toHaveLength(224);
  });

  it("adds six or twelve months and clamps month-end dates", () => {
    expect(addReviewMonths("2024-08-31", 6)).toBe("2025-02-28");
    expect(addReviewMonths("2024-02-29", 12)).toBe("2025-02-28");
  });

  it("calculates Bangkok date status and reminder buckets", () => {
    expect(getDaysRemaining("2026-08-29", referenceDay)).toBe(0);
    expect(getComplianceStatus({ lastReviewDate: "2026-01-01", nextReviewDate: "2026-08-28" }, referenceDay)).toBe("overdue");
    expect(getComplianceStatus({ lastReviewDate: "2026-01-01", nextReviewDate: "2026-09-28" }, referenceDay)).toBe("due-soon");
    expect(getComplianceStatus({ lastReviewDate: "2026-01-01", nextReviewDate: "2027-08-29" }, referenceDay)).toBe("complete");
    expect(getReminderBucket({ nextReviewDate: "2026-10-28" }, referenceDay)).toBe("31-60");
    expect(validateComplianceDates("2026-08-30", "2027-08-30", referenceDay)).toContain("ไม่เกินวันนี้");
  });
});

describe("selectors, reducer and persistence", () => {
  it("derives KPI values from records instead of constants", () => {
    const state = createInitialState();
    expect(getKpis(state, referenceDay)).toMatchObject({ centers: 9, towers: 23, pending: 224, completion: 0 });
    state.complianceRecords[0] = { ...state.complianceRecords[0], lastReviewDate: "2026-01-01", nextReviewDate: "2027-01-01" };
    expect(getKpis(state, referenceDay)).toMatchObject({ pending: 223, completion: 0 });
  });

  it("selects a tower and synchronizes its parent center", () => {
    const next = dashboardReducer(createInitialState(), { type: "SELECT_AREA", areaId: "chiang-rai" });
    expect(next.selectedAreaId).toBe("chiang-rai");
    expect(next.selectedCenterId).toBe("cnx");
  });

  it("adds a custom topic with one pending record per area and soft-deletes it", () => {
    const topic = { id: "custom-a", name: "หัวข้อทดสอบ", shortName: "หัวข้อทดสอบ", reviewIntervalMonths: 12, active: true };
    const added = dashboardReducer(createInitialState(), { type: "ADD_CUSTOM_TOPIC", topic });
    expect(added.complianceRecords.filter((record) => record.topicId === topic.id)).toHaveLength(32);
    const toggled = dashboardReducer(added, { type: "TOGGLE_CUSTOM_TOPIC", topicId: topic.id });
    expect(toggled.topics.find((item) => item.id === topic.id).active).toBe(false);
    expect(toggled.complianceRecords.filter((record) => record.topicId === topic.id)).toHaveLength(32);
  });

  it("builds reminders only for active topics", () => {
    let state = createInitialState();
    state = { ...state, complianceRecords: state.complianceRecords.map((record, index) => index === 0 ? { ...record, lastReviewDate: "2025-01-01", nextReviewDate: "2026-08-28" } : record) };
    expect(getReminders(state)).toHaveLength(1);
    state = { ...state, topics: state.topics.map((topic) => topic.id === state.complianceRecords[0].topicId ? { ...topic, active: false } : topic) };
    expect(getReminders(state)).toHaveLength(0);
  });

  it("persists only schema-approved settings, role, custom topics and dates", () => {
    const state = createInitialState();
    state.complianceRecords[0] = { ...state.complianceRecords[0], lastReviewDate: "2026-01-01", nextReviewDate: "2027-01-01", note: "must not persist", documents: [{ id: "secret" }] };
    const stored = JSON.parse(serializeState(state));
    expect(stored.version).toBe(1);
    expect(stored.records[0]).toEqual({ id: state.complianceRecords[0].id, lastReviewDate: "2026-01-01", nextReviewDate: "2027-01-01" });
  });

  it("falls back safely when localStorage has corrupt or mismatched data", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    expect(hydrateState().complianceRecords).toHaveLength(224);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, records: [] }));
    expect(hydrateState().topics).toHaveLength(7);
  });
});

describe("document validation", () => {
  it("accepts valid files and rejects extension, MIME and size mismatches", () => {
    expect(validateFile({ name: "plan.pdf", type: "application/pdf", size: 1024 })).toBeNull();
    expect(validateFile({ name: "plan.exe", type: "application/octet-stream", size: 1024 })).toContain("รองรับเฉพาะ");
    expect(validateFile({ name: "plan.pdf", type: "image/png", size: 1024 })).toContain("ไม่ตรงกับนามสกุล");
    expect(validateFile({ name: "plan.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 11 * 1024 * 1024 })).toContain("10 MB");
  });

  it("adds and removes session documents through the reducer", () => {
    const initial = createInitialState();
    const recordId = initial.complianceRecords[0].id;
    const added = dashboardReducer(initial, { type: "ADD_DOCUMENT_MOCK", recordId, document: { id: "doc-1", name: "plan.pdf" } });
    expect(added.complianceRecords[0].documents).toHaveLength(1);
    const removed = dashboardReducer(added, { type: "REMOVE_DOCUMENT_MOCK", recordId, documentId: "doc-1" });
    expect(removed.complianceRecords[0].documents).toHaveLength(0);
  });
});

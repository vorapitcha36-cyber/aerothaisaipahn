import { AREAS, COMPLIANCE_TOPICS, DEFAULT_SETTINGS } from "../data/masterData";

export const STORAGE_KEY = "aerothai-security-dashboard:v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function formatDate(value) {
  const date = toDateOnly(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function toInputDate(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBangkokToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Number(value.year), Number(value.month) - 1, Number(value.day));
}

export function getBangkokInputDate(now = new Date()) {
  return toInputDate(getBangkokToday(now));
}

export function addReviewMonths(value, months) {
  const source = toDateOnly(value);
  if (!source) return "";
  const day = source.getDate();
  const next = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const finalDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, finalDay));
  return toInputDate(next);
}

export function getDaysRemaining(value, today = new Date()) {
  const target = toDateOnly(value);
  if (!target) return null;
  const start = getBangkokToday(today);
  return Math.ceil((target.getTime() - start.getTime()) / DAY_MS);
}

export function getComplianceStatus(record, today = new Date()) {
  if (!record?.lastReviewDate || !record?.nextReviewDate) return "pending";
  const days = getDaysRemaining(record.nextReviewDate, today);
  if (days < 0) return "overdue";
  if (days <= 90) return "due-soon";
  return "complete";
}

export function getReminderBucket(record, today = new Date()) {
  const days = getDaysRemaining(record?.nextReviewDate, today);
  if (days === null) return null;
  if (days < 0) return "overdue";
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return null;
}

export function validateComplianceDates(lastReviewDate, nextReviewDate, today = new Date()) {
  const last = toDateOnly(lastReviewDate);
  const next = toDateOnly(nextReviewDate);
  const current = getBangkokToday(today);
  if (!last || !next) return "กรุณาระบุวันที่ดำเนินการ";
  if (last > current) return "วันที่ดำเนินการล่าสุดต้องไม่เกินวันนี้";
  if (next <= last) return "วันที่ครบกำหนดต้องอยู่หลังวันที่ดำเนินการล่าสุด";
  return null;
}

const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx"];
const allowedMimeTypes = {
  pdf: ["application/pdf"],
  doc: ["application/msword", "application/octet-stream"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
  xls: ["application/vnd.ms-excel", "application/octet-stream"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
};
export function validateFile(file) {
  if (!file?.name?.trim()) return "ไม่พบชื่อไฟล์";
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) return "รองรับเฉพาะ PDF, DOC, DOCX, XLS และ XLSX";
  if (file.type && !allowedMimeTypes[extension].includes(file.type)) return "ชนิดไฟล์ไม่ตรงกับนามสกุลที่เลือก";
  if (file.size > 10 * 1024 * 1024) return "ไฟล์ต้องมีขนาดไม่เกิน 10 MB";
  return null;
}

export function createRecords(areas = AREAS, topics = COMPLIANCE_TOPICS) {
  return areas.flatMap((area) =>
    topics.map((topic) => ({
      id: `${area.id}-${topic.id}`,
      areaId: area.id,
      topicId: topic.id,
      lastReviewDate: null,
      nextReviewDate: null,
      note: "",
      documents: [],
      updatedAt: null,
      updatedBy: null,
    })),
  );
}

export function createInitialState() {
  return {
    currentUser: { id: "mock-admin", name: "ผู้ดูแลระบบ", role: "admin" },
    settings: { ...DEFAULT_SETTINGS },
    areas: AREAS,
    topics: COMPLIANCE_TOPICS,
    complianceRecords: createRecords(),
    selectedCenterId: "cnx",
    selectedAreaId: "cnx",
    activePanel: "overview",
    filters: { search: "", region: "all", status: "all" },
    ui: { sidebarOpen: false, adminDialogOpen: false },
  };
}

export function hydrateState() {
  const base = createInitialState();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const stored = JSON.parse(raw);
    if (stored.version !== 1) return base;
    const topics = [...COMPLIANCE_TOPICS, ...(stored.customTopics || [])].map((topic) => ({ ...topic, active: topic.active !== false }));
    const baseRecords = createRecords(AREAS, topics);
    const savedById = new Map((stored.records || []).map((record) => [record.id, record]));
    return {
      ...base,
      currentUser: { ...base.currentUser, role: stored.role || "admin" },
      settings: { ...base.settings, ...(stored.settings || {}) },
      topics,
      complianceRecords: baseRecords.map((record) => ({ ...record, ...(savedById.get(record.id) || {}), documents: [] })),
    };
  } catch {
    return base;
  }
}

export function serializeState(state) {
  return JSON.stringify({
    version: 1,
    role: state.currentUser.role,
    settings: state.settings,
    customTopics: state.topics.filter((topic) => !COMPLIANCE_TOPICS.some((base) => base.id === topic.id)),
    records: state.complianceRecords.map(({ id, lastReviewDate, nextReviewDate }) => ({ id, lastReviewDate, nextReviewDate })),
  });
}

export function dashboardReducer(state, action) {
  switch (action.type) {
    case "SELECT_AREA": {
      const selected = state.areas.find((area) => area.id === action.areaId);
      if (!selected) return state;
      return { ...state, selectedAreaId: selected.id, selectedCenterId: selected.type === "center" ? selected.id : selected.parentCenterId, ui: { ...state.ui, sidebarOpen: false } };
    }
    case "SET_ACTIVE_PANEL":
      return { ...state, activePanel: action.panel, ui: { ...state.ui, sidebarOpen: false } };
    case "UPDATE_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case "UPDATE_COMPLIANCE_RECORD":
      return { ...state, complianceRecords: state.complianceRecords.map((record) => record.id === action.record.id ? { ...record, ...action.record } : record) };
    case "ADD_DOCUMENT_MOCK":
      return { ...state, complianceRecords: state.complianceRecords.map((record) => record.id === action.recordId ? { ...record, documents: [...record.documents, action.document] } : record) };
    case "REMOVE_DOCUMENT_MOCK":
      return { ...state, complianceRecords: state.complianceRecords.map((record) => record.id === action.recordId ? { ...record, documents: record.documents.filter((document) => document.id !== action.documentId) } : record) };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "ADD_CUSTOM_TOPIC": {
      const topic = action.topic;
      return { ...state, topics: [...state.topics, topic], complianceRecords: [...state.complianceRecords, ...createRecords(state.areas, [topic])] };
    }
    case "TOGGLE_CUSTOM_TOPIC":
      return { ...state, topics: state.topics.map((topic) => topic.id === action.topicId ? { ...topic, active: !topic.active } : topic) };
    case "SET_CURRENT_USER_ROLE":
      return { ...state, currentUser: { ...state.currentUser, role: action.role } };
    case "TOGGLE_SIDEBAR":
      return { ...state, ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } };
    case "OPEN_ADMIN":
      return { ...state, ui: { ...state.ui, adminDialogOpen: true } };
    case "CLOSE_ADMIN":
      return { ...state, ui: { ...state.ui, adminDialogOpen: false } };
    case "RESET_DEMO_DATA":
      return createInitialState();
    default:
      return state;
  }
}

export function getKpis(state, today = new Date()) {
  const activeTopicIds = new Set(state.topics.filter((topic) => topic.active).map((topic) => topic.id));
  const records = state.complianceRecords.filter((record) => activeTopicIds.has(record.topicId));
  const statuses = records.map((record) => getComplianceStatus(record, today));
  const completeLike = statuses.filter((status) => status !== "pending").length;
  return {
    centers: state.areas.filter((area) => area.type === "center").length,
    towers: state.areas.filter((area) => area.type === "tower").length,
    pending: statuses.filter((status) => status === "pending").length,
    dueSoon: statuses.filter((status) => status === "due-soon").length,
    overdue: statuses.filter((status) => status === "overdue").length,
    completion: records.length ? Math.round((completeLike / records.length) * 100) : 0,
  };
}

export function getAreaProgress(state, areaId) {
  const activeTopicIds = new Set(state.topics.filter((topic) => topic.active).map((topic) => topic.id));
  const records = state.complianceRecords.filter((record) => record.areaId === areaId && activeTopicIds.has(record.topicId));
  if (!records.length) return 0;
  return Math.round((records.filter((record) => getComplianceStatus(record) !== "pending").length / records.length) * 100);
}

export function getAreaStatus(state, areaId) {
  const activeTopicIds = new Set(state.topics.filter((topic) => topic.active).map((topic) => topic.id));
  const records = state.complianceRecords.filter((record) => record.areaId === areaId && activeTopicIds.has(record.topicId));
  const statuses = records.map((record) => getComplianceStatus(record));
  if (statuses.includes("overdue")) return "overdue";
  if (statuses.includes("due-soon")) return "due-soon";
  if (statuses.length && statuses.every((status) => status === "complete")) return "complete";
  return "pending";
}

export function getReminders(state) {
  const activeTopicIds = new Set(state.topics.filter((topic) => topic.active).map((topic) => topic.id));
  return state.complianceRecords
    .filter((record) => activeTopicIds.has(record.topicId))
    .map((record) => ({ ...record, daysRemaining: getDaysRemaining(record.nextReviewDate), bucket: getReminderBucket(record) }))
    .filter((record) => record.bucket)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

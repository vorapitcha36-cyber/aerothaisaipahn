export const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const WORKFLOW_STATUSES = ["DRAFT", "PENDING_REVIEW", "CHANGES_REQUESTED", "ACTIVE", "ARCHIVED"] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export type LifecycleStatus = "CURRENT" | "DUE_SOON" | "OVERDUE";

export const CATEGORY_SEEDS = [
  { code: "EMERGENCY_PLAN", nameTh: "แผนและการฝึกซ้อม" },
  { code: "RISK_ASSESSMENT", nameTh: "การประเมินความเสี่ยง" },
  { code: "TRAINING", nameTh: "ข้อมูลการอบรม" },
  { code: "SECURITY_PERSONNEL", nameTh: "ข้อมูลพนักงาน รปภ." },
  { code: "WORK_INSTRUCTION", nameTh: "วิธีปฏิบัติงาน (WI)" },
  { code: "INSPECTION", nameTh: "ผลการตรวจสอบ" },
  { code: "SECURITY_AWARENESS", nameTh: "Security Awareness" }
] as const;

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
}

export interface LocationSummary {
  id: string;
  code: string;
  nameTh: string;
  type: "CENTER" | "OUTSTATION";
  region: "NORTH" | "NORTHEAST" | "CENTRAL" | "SOUTH";
  parentId?: string | null;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface DocumentSummary {
  id: string;
  locationId: string;
  categoryId: string;
  referenceNo?: string | null;
  note?: string | null;
  performedAt: string;
  nextReviewAt: string;
  workflowStatus: WorkflowStatus;
  lifecycleStatus?: LifecycleStatus;
  currentVersion: number;
  createdBy: UserSummary;
  reviewedBy?: UserSummary | null;
}

const transitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "ARCHIVED"],
  PENDING_REVIEW: ["ACTIVE", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["DRAFT", "PENDING_REVIEW", "ARCHIVED"],
  ACTIVE: ["PENDING_REVIEW", "ARCHIVED"],
  ARCHIVED: []
};

export function canTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
  return transitions[from].includes(to);
}

export function getLifecycleStatus(nextReviewAt: string | Date, now = new Date(), dueSoonDays = 30): LifecycleStatus {
  const review = typeof nextReviewAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextReviewAt)
    ? new Date(Number(nextReviewAt.slice(0, 4)), Number(nextReviewAt.slice(5, 7)) - 1, Number(nextReviewAt.slice(8, 10)))
    : new Date(nextReviewAt);
  review.setHours(0, 0, 0, 0);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.ceil((review.getTime() - startOfToday.getTime()) / 86_400_000);
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= dueSoonDays) return "DUE_SOON";
  return "CURRENT";
}

export function calculateCoveragePending(activeLocationIds: readonly string[], activeCategoryIds: readonly string[], coveredPairs: ReadonlySet<string>): number {
  let pending = 0;
  for (const locationId of activeLocationIds) {
    for (const categoryId of activeCategoryIds) {
      if (!coveredPairs.has(`${locationId}:${categoryId}`)) pending += 1;
    }
  }
  return pending;
}

export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  ADMIN: ["read", "download", "create", "edit", "submit", "review", "archive", "manage_users", "manage_locations", "read_audit"],
  EDITOR: ["read", "download", "create", "edit", "submit"],
  VIEWER: ["read", "download"]
};

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

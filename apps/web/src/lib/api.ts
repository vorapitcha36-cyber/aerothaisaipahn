import type { DocumentSummary, UserSummary } from "@aerothai/shared";

export interface DashboardSummary { centers: number; outstations: number; pending: number; overdue: number; dueSoon: number }
export interface CreateDocumentInput { locationId: string; categoryId: string; referenceNo?: string; note?: string; performedAt: string; nextReviewAt: string }
export interface RegistryDocument extends DocumentSummary {
  location: { id: string; nameTh: string };
  category: { id: string; nameTh: string };
  updatedAt: string;
}
export interface DocumentDetail extends RegistryDocument { versions: Array<{ id: string; version: number; file?: { id: string; scanStatus: string } | null }> }

function csrfToken() {
  return document.cookie.split("; ").find(item => item.startsWith("XSRF-TOKEN="))?.split("=")[1] ?? "";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method?.toUpperCase() ?? "GET";
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(!["GET", "HEAD", "OPTIONS"].includes(method) ? { "x-csrf-token": csrfToken() } : {}),
      ...init.headers
    }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "ไม่สามารถเชื่อมต่อระบบได้" }));
    throw new Error(payload.message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<UserSummary | null>("/auth/me"),
  dashboard: () => request<DashboardSummary>("/dashboard/summary"),
  locations: () => request<Array<{ id: string; nameTh: string; type: string; region: string }>>("/locations"),
  categories: () => request<Array<{ id: string; code: string; nameTh: string }>>("/categories"),
  documents: (query = "") => request<RegistryDocument[]>(`/documents${query ? `?${query}` : ""}`),
  createDocument: (input: CreateDocumentInput) => request<DocumentDetail>("/documents", { method: "POST", body: JSON.stringify(input) }),
  submitDocument: (id: string) => request<DocumentSummary>(`/documents/${id}/submit`, { method: "POST" }),
  reviewDocument: (id: string, decision: "APPROVE" | "CHANGES_REQUESTED", comment?: string) => request<DocumentSummary>(`/documents/${id}/review`, { method: "POST", body: JSON.stringify({ decision, comment }) }),
  createUploadIntent: (input: { versionId: string; originalName: string; mimeType: string; sizeBytes: number }) => request<{ id: string; uploadUrl: string; expiresInSeconds: number }>("/files/upload-intents", { method: "POST", body: JSON.stringify(input) }),
  completeUpload: (id: string) => request<{ id: string; scanStatus: string }>(`/files/${id}/complete`, { method: "POST" })
};

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { FileScanStatus, Prisma, Role, ReviewDecision, WorkflowStatus, type User } from "@prisma/client";
import { canTransition, getLifecycleStatus } from "@aerothai/shared";
import type { Request } from "express";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../prisma/prisma.service";

export interface DocumentInput { locationId: string; categoryId: string; referenceNo?: string; note?: string; performedAt: string; nextReviewAt: string }

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(user: User, filters: { categoryId?: string; locationId?: string; status?: WorkflowStatus; search?: string }) {
    const where: Prisma.DocumentRecordWhereInput = {
      categoryId: filters.categoryId,
      locationId: filters.locationId,
      workflowStatus: user.role === Role.VIEWER ? WorkflowStatus.ACTIVE : filters.status,
      OR: filters.search ? [{ referenceNo: { contains: filters.search, mode: "insensitive" } }, { note: { contains: filters.search, mode: "insensitive" } }, { location: { nameTh: { contains: filters.search, mode: "insensitive" } } }] : undefined
    };
    const rows = await this.prisma.documentRecord.findMany({ where, orderBy: { updatedAt: "desc" }, include: { location: true, category: true, createdBy: { select: { id: true, email: true, displayName: true, role: true, status: true } }, reviewedBy: { select: { id: true, email: true, displayName: true, role: true, status: true } }, versions: { orderBy: { version: "desc" }, take: 1, include: { file: true } } } });
    return rows.map(row => ({ ...row, lifecycleStatus: row.workflowStatus === WorkflowStatus.ACTIVE ? getLifecycleStatus(row.nextReviewAt) : undefined }));
  }

  get(id: string) { return this.prisma.documentRecord.findUniqueOrThrow({ where: { id }, include: { location: true, category: true, createdBy: true, reviewedBy: true, reviewActions: { include: { actor: true }, orderBy: { createdAt: "desc" } }, versions: { include: { file: true, createdBy: true }, orderBy: { version: "desc" } } } }); }

  async create(user: User, input: DocumentInput, req: Request) {
    if (user.role === Role.VIEWER) throw new ForbiddenException();
    const data = { ...input, performedAt: new Date(input.performedAt), nextReviewAt: new Date(input.nextReviewAt) };
    const record = await this.prisma.$transaction(async tx => {
      const document = await tx.documentRecord.create({ data: { ...data, createdById: user.id } });
      await tx.documentVersion.create({ data: { documentId: document.id, version: 1, referenceNo: input.referenceNo, note: input.note, performedAt: data.performedAt, nextReviewAt: data.nextReviewAt, createdById: user.id } });
      return document;
    });
    await this.audit.record(req, "DOCUMENT_CREATED", "DocumentRecord", record.id, undefined, record);
    return this.get(record.id);
  }

  async update(id: string, user: User, input: Partial<DocumentInput>, req: Request) {
    const before = await this.get(id);
    if (user.role === Role.VIEWER || (before.workflowStatus !== WorkflowStatus.DRAFT && before.workflowStatus !== WorkflowStatus.CHANGES_REQUESTED)) throw new ForbiddenException("แก้ไขได้เฉพาะเอกสารร่างหรือเอกสารที่ถูกส่งกลับ");
    const after = await this.prisma.documentRecord.update({ where: { id }, data: { ...input, performedAt: input.performedAt ? new Date(input.performedAt) : undefined, nextReviewAt: input.nextReviewAt ? new Date(input.nextReviewAt) : undefined } });
    await this.audit.record(req, "DOCUMENT_UPDATED", "DocumentRecord", id, before, after);
    return after;
  }

  async createVersion(id: string, user: User, input: DocumentInput, req: Request) {
    const before = await this.get(id);
    if (user.role === Role.VIEWER || before.workflowStatus === WorkflowStatus.ARCHIVED) throw new ForbiddenException();
    const version = before.currentVersion + 1;
    const performedAt = new Date(input.performedAt); const nextReviewAt = new Date(input.nextReviewAt);
    const after = await this.prisma.$transaction(async tx => {
      await tx.documentVersion.create({ data: { documentId: id, version, referenceNo: input.referenceNo, note: input.note, performedAt, nextReviewAt, createdById: user.id } });
      return tx.documentRecord.update({ where: { id }, data: { ...input, performedAt, nextReviewAt, currentVersion: version, workflowStatus: WorkflowStatus.DRAFT, reviewedById: null, submittedAt: null } });
    });
    await this.audit.record(req, "DOCUMENT_VERSION_CREATED", "DocumentRecord", id, before, after, { version });
    return after;
  }

  async submit(id: string, user: User, req: Request) {
    const before = await this.get(id);
    if (user.role === Role.VIEWER || !canTransition(before.workflowStatus, WorkflowStatus.PENDING_REVIEW)) throw new BadRequestException("ไม่สามารถส่งเอกสารในสถานะปัจจุบันได้");
    const file = before.versions.find(item => item.version === before.currentVersion)?.file;
    if (!file || file.scanStatus !== FileScanStatus.CLEAN) throw new BadRequestException("ต้องแนบไฟล์ที่ผ่านการตรวจสอบไวรัสแล้ว");
    const after = await this.prisma.documentRecord.update({ where: { id }, data: { workflowStatus: WorkflowStatus.PENDING_REVIEW, submittedAt: new Date() } });
    await this.audit.record(req, "DOCUMENT_SUBMITTED", "DocumentRecord", id, before, after);
    return after;
  }

  async review(id: string, admin: User, decision: "APPROVE" | "CHANGES_REQUESTED", comment: string | undefined, req: Request) {
    if (admin.role !== Role.ADMIN) throw new ForbiddenException();
    const before = await this.get(id);
    if (before.workflowStatus !== WorkflowStatus.PENDING_REVIEW) throw new BadRequestException("เอกสารไม่ได้อยู่ระหว่างรอตรวจทาน");
    const approve = decision === "APPROVE";
    const after = await this.prisma.$transaction(async tx => {
      await tx.reviewAction.create({ data: { documentId: id, actorId: admin.id, decision: approve ? ReviewDecision.APPROVED : ReviewDecision.CHANGES_REQUESTED, comment } });
      return tx.documentRecord.update({ where: { id }, data: { workflowStatus: approve ? WorkflowStatus.ACTIVE : WorkflowStatus.CHANGES_REQUESTED, reviewedById: admin.id, publishedAt: approve ? new Date() : null } });
    });
    await this.audit.record(req, approve ? "DOCUMENT_APPROVED" : "DOCUMENT_CHANGES_REQUESTED", "DocumentRecord", id, before, after, { comment });
    return after;
  }

  async archive(id: string, admin: User, req: Request) {
    if (admin.role !== Role.ADMIN) throw new ForbiddenException();
    const before = await this.get(id);
    if (!canTransition(before.workflowStatus, WorkflowStatus.ARCHIVED)) throw new BadRequestException();
    const after = await this.prisma.documentRecord.update({ where: { id }, data: { workflowStatus: WorkflowStatus.ARCHIVED, archivedAt: new Date() } });
    await this.prisma.reviewAction.create({ data: { documentId: id, actorId: admin.id, decision: ReviewDecision.ARCHIVED } });
    await this.audit.record(req, "DOCUMENT_ARCHIVED", "DocumentRecord", id, before, after);
    return after;
  }
}

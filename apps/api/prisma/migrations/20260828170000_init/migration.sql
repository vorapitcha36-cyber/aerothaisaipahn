-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('CENTER', 'OUTSTATION');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NORTH', 'NORTHEAST', 'CENTRAL', 'SOUTH');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FileScanStatus" AS ENUM ('UPLOADING', 'QUARANTINED', 'SCANNING', 'CLEAN', 'INFECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVED', 'CHANGES_REQUESTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'REVIEW_DUE', 'OVERDUE', 'USER_APPROVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleSubject" TEXT,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "region" "Region" NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "parentId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "referenceNo" TEXT,
    "note" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "referenceNo" TEXT,
    "note" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "quarantineKey" TEXT NOT NULL,
    "evidenceKey" TEXT,
    "scanStatus" "FileScanStatus" NOT NULL DEFAULT 'UPLOADING',
    "scannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAction" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "resourceId" TEXT,
    "readAt" TIMESTAMP(3),
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE INDEX "Location_type_active_idx" ON "Location"("type", "active");

-- CreateIndex
CREATE INDEX "Location_region_active_idx" ON "Location"("region", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_code_key" ON "Category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Category_sortOrder_key" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "DocumentRecord_locationId_categoryId_workflowStatus_idx" ON "DocumentRecord"("locationId", "categoryId", "workflowStatus");

-- CreateIndex
CREATE INDEX "DocumentRecord_nextReviewAt_workflowStatus_idx" ON "DocumentRecord"("nextReviewAt", "workflowStatus");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_versionId_key" ON "FileAsset"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_quarantineKey_key" ON "FileAsset"("quarantineKey");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_evidenceKey_key" ON "FileAsset"("evidenceKey");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAction" ADD CONSTRAINT "ReviewAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

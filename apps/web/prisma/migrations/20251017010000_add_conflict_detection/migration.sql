-- Story 3.4: Content Conflict Detection
-- Migration created: 2025-10-17
-- Models: Source, Conflict, ConflictResolution, ConflictHistory, ConflictFlag, UserSourcePreference

-- CreateEnum for SourceType
DO $$ BEGIN
  CREATE TYPE "SourceType" AS ENUM ('FIRST_AID', 'LECTURE', 'TEXTBOOK', 'JOURNAL', 'GUIDELINE', 'USER_NOTES');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ConflictType
DO $$ BEGIN
  CREATE TYPE "ConflictType" AS ENUM ('DOSAGE', 'CONTRAINDICATION', 'MECHANISM', 'TREATMENT', 'DIAGNOSIS', 'PROGNOSIS', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ConflictSeverity
DO $$ BEGIN
  CREATE TYPE "ConflictSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ConflictStatus
DO $$ BEGIN
  CREATE TYPE "ConflictStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DISMISSED', 'UNDER_REVIEW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ChangeType
DO $$ BEGIN
  CREATE TYPE "ChangeType" AS ENUM ('DETECTED', 'RESOLVED', 'REOPENED', 'DISMISSED', 'EVIDENCE_UPDATED', 'SOURCE_UPDATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for TrustLevel
DO $$ BEGIN
  CREATE TYPE "TrustLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: sources
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "credibilityScore" INTEGER NOT NULL,
    "medicalSpecialty" TEXT,
    "lastUpdated" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable: conflicts
CREATE TABLE "conflicts" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT,
    "sourceAChunkId" TEXT,
    "sourceBChunkId" TEXT,
    "sourceAFirstAidId" TEXT,
    "sourceBFirstAidId" TEXT,
    "conflictType" "ConflictType" NOT NULL,
    "severity" "ConflictSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ConflictStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: conflict_resolutions
CREATE TABLE "conflict_resolutions" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "resolvedBy" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "preferredSourceId" TEXT,
    "evidence" TEXT,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "conflict_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: conflict_history
CREATE TABLE "conflict_history" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "oldStatus" "ConflictStatus",
    "newStatus" "ConflictStatus",
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "conflict_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: conflict_flags
CREATE TABLE "conflict_flags" (
    "id" TEXT NOT NULL,
    "conflictId" TEXT,
    "userId" TEXT NOT NULL,
    "sourceAChunkId" TEXT,
    "sourceBChunkId" TEXT,
    "sourceAFirstAidId" TEXT,
    "sourceBFirstAidId" TEXT,
    "description" TEXT NOT NULL,
    "userNotes" TEXT,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "conflict_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_source_preferences
CREATE TABLE "user_source_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "trustLevel" "TrustLevel" NOT NULL,
    "priority" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_source_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sources_name_key" ON "sources"("name");
CREATE INDEX "sources_type_idx" ON "sources"("type");
CREATE INDEX "sources_credibilityScore_idx" ON "sources"("credibilityScore");

-- CreateIndex
CREATE INDEX "conflicts_conceptId_status_idx" ON "conflicts"("conceptId", "status");
CREATE INDEX "conflicts_severity_idx" ON "conflicts"("severity");
CREATE INDEX "conflicts_status_idx" ON "conflicts"("status");
CREATE INDEX "conflicts_createdAt_idx" ON "conflicts"("createdAt");

-- CreateIndex
CREATE INDEX "conflict_resolutions_conflictId_idx" ON "conflict_resolutions"("conflictId");
CREATE INDEX "conflict_resolutions_resolvedAt_idx" ON "conflict_resolutions"("resolvedAt");

-- CreateIndex
CREATE INDEX "conflict_history_conflictId_idx" ON "conflict_history"("conflictId");
CREATE INDEX "conflict_history_changedAt_idx" ON "conflict_history"("changedAt");

-- CreateIndex
CREATE INDEX "conflict_flags_userId_idx" ON "conflict_flags"("userId");
CREATE INDEX "conflict_flags_status_idx" ON "conflict_flags"("status");
CREATE INDEX "conflict_flags_flaggedAt_idx" ON "conflict_flags"("flaggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_source_preferences_userId_sourceId_key" ON "user_source_preferences"("userId", "sourceId");
CREATE INDEX "user_source_preferences_userId_idx" ON "user_source_preferences"("userId");
CREATE INDEX "user_source_preferences_priority_idx" ON "user_source_preferences"("priority");

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceAChunkId_fkey" FOREIGN KEY ("sourceAChunkId") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceBChunkId_fkey" FOREIGN KEY ("sourceBChunkId") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceAFirstAidId_fkey" FOREIGN KEY ("sourceAFirstAidId") REFERENCES "first_aid_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceBFirstAidId_fkey" FOREIGN KEY ("sourceBFirstAidId") REFERENCES "first_aid_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_resolutions" ADD CONSTRAINT "conflict_resolutions_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "conflicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_history" ADD CONSTRAINT "conflict_history_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "conflicts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conflict_flags" ADD CONSTRAINT "conflict_flags_conflictId_fkey" FOREIGN KEY ("conflictId") REFERENCES "conflicts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_source_preferences" ADD CONSTRAINT "user_source_preferences_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

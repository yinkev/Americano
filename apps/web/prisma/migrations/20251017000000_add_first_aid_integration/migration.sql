-- Story 3.3: First Aid Integration and Cross-Referencing
-- Migration created: 2025-10-17

-- CreateEnum for MappingPriority
CREATE TYPE "MappingPriority" AS ENUM ('HIGH_YIELD', 'STANDARD', 'SUGGESTED');

-- CreateEnum for MappingFeedback
CREATE TYPE "MappingFeedback" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'SOMEWHAT_HELPFUL');

-- CreateEnum for EditionMappingStatus
CREATE TYPE "EditionMappingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable: first_aid_sections
CREATE TABLE "first_aid_sections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "edition" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "system" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "subsection" TEXT,
    "pageNumber" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isHighYield" BOOLEAN NOT NULL DEFAULT false,
    "mnemonics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinicalCorrelations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visualMarkers" JSONB,
    "embedding" vector(1536),
    "encryptionKeyHash" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "first_aid_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: lecture_first_aid_mappings
CREATE TABLE "lecture_first_aid_mappings" (
    "id" TEXT NOT NULL,
    "lectureId" TEXT NOT NULL,
    "firstAidSectionId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "priority" "MappingPriority" NOT NULL DEFAULT 'STANDARD',
    "rationale" TEXT,
    "userFeedback" "MappingFeedback",
    "feedbackNotes" TEXT,
    "autoMapped" BOOLEAN NOT NULL DEFAULT true,
    "mappedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),

    CONSTRAINT "lecture_first_aid_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: first_aid_editions
CREATE TABLE "first_aid_editions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "changeLog" TEXT,
    "mappingStatus" "EditionMappingStatus" NOT NULL DEFAULT 'PENDING',
    "processingProgress" INTEGER NOT NULL DEFAULT 0,
    "sectionCount" INTEGER NOT NULL DEFAULT 0,
    "highYieldCount" INTEGER NOT NULL DEFAULT 0,
    "totalPages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "first_aid_editions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "first_aid_sections_userId_idx" ON "first_aid_sections"("userId");
CREATE INDEX "first_aid_sections_edition_system_idx" ON "first_aid_sections"("edition", "system");
CREATE INDEX "first_aid_sections_isHighYield_idx" ON "first_aid_sections"("isHighYield");
CREATE INDEX "first_aid_sections_pageNumber_idx" ON "first_aid_sections"("pageNumber");

-- CreateIndex
CREATE INDEX "lecture_first_aid_mappings_lectureId_idx" ON "lecture_first_aid_mappings"("lectureId");
CREATE INDEX "lecture_first_aid_mappings_firstAidSectionId_idx" ON "lecture_first_aid_mappings"("firstAidSectionId");
CREATE INDEX "lecture_first_aid_mappings_confidence_idx" ON "lecture_first_aid_mappings"("confidence");
CREATE INDEX "lecture_first_aid_mappings_priority_idx" ON "lecture_first_aid_mappings"("priority");
CREATE UNIQUE INDEX "lecture_first_aid_mappings_lectureId_firstAidSectionId_key" ON "lecture_first_aid_mappings"("lectureId", "firstAidSectionId");

-- CreateIndex
CREATE INDEX "first_aid_editions_userId_isActive_idx" ON "first_aid_editions"("userId", "isActive");
CREATE INDEX "first_aid_editions_year_idx" ON "first_aid_editions"("year");
CREATE UNIQUE INDEX "first_aid_editions_userId_year_key" ON "first_aid_editions"("userId", "year");

-- AddForeignKey
ALTER TABLE "lecture_first_aid_mappings" ADD CONSTRAINT "lecture_first_aid_mappings_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_first_aid_mappings" ADD CONSTRAINT "lecture_first_aid_mappings_firstAidSectionId_fkey" FOREIGN KEY ("firstAidSectionId") REFERENCES "first_aid_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter conflicts table to support First Aid sections
ALTER TABLE "conflicts" ADD COLUMN "sourceAFirstAidId" TEXT;
ALTER TABLE "conflicts" ADD COLUMN "sourceBFirstAidId" TEXT;
ALTER TABLE "conflicts" ALTER COLUMN "sourceAChunkId" DROP NOT NULL;
ALTER TABLE "conflicts" ALTER COLUMN "sourceBChunkId" DROP NOT NULL;

-- AddForeignKey for First Aid conflicts
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceAFirstAidId_fkey" FOREIGN KEY ("sourceAFirstAidId") REFERENCES "first_aid_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conflicts" ADD CONSTRAINT "conflicts_sourceBFirstAidId_fkey" FOREIGN KEY ("sourceBFirstAidId") REFERENCES "first_aid_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Alter conflict_flags to support First Aid
ALTER TABLE "conflict_flags" ADD COLUMN "sourceAFirstAidId" TEXT;
ALTER TABLE "conflict_flags" ADD COLUMN "sourceBFirstAidId" TEXT;
ALTER TABLE "conflict_flags" ALTER COLUMN "sourceAChunkId" DROP NOT NULL;
ALTER TABLE "conflict_flags" ALTER COLUMN "sourceBChunkId" DROP NOT NULL;

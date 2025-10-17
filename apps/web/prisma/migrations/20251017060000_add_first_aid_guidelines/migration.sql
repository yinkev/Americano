-- Story 3.3: First Aid Guidelines and Concept Mapping Enhancement
-- Migration created: 2025-10-17
-- Adds FirstAidGuideline, FirstAidConceptMapping, FirstAidVersion, and MappingType

-- CreateEnum for MappingType
CREATE TYPE "MappingType" AS ENUM ('DIRECT', 'CONTEXTUAL', 'PROCEDURAL');

-- CreateTable: first_aid_guidelines
CREATE TABLE "first_aid_guidelines" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "edition" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "first_aid_guidelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable: first_aid_concept_mappings
CREATE TABLE "first_aid_concept_mappings" (
    "id" TEXT NOT NULL,
    "guidelineId" TEXT,
    "sectionId" TEXT,
    "conceptId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "mappingType" "MappingType" NOT NULL,
    "sourceSection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "first_aid_concept_mappings_pkey" PRIMARY KEY ("id"),

    -- CHECK constraint for relevanceScore range
    CONSTRAINT "first_aid_concept_mappings_relevanceScore_check"
        CHECK ("relevanceScore" >= 0.0 AND "relevanceScore" <= 1.0)
);

-- CreateTable: first_aid_versions
CREATE TABLE "first_aid_versions" (
    "id" TEXT NOT NULL,
    "edition" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "first_aid_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for first_aid_guidelines
CREATE UNIQUE INDEX "first_aid_guidelines_slug_key" ON "first_aid_guidelines"("slug");
CREATE INDEX "first_aid_guidelines_category_idx" ON "first_aid_guidelines"("category");
CREATE INDEX "first_aid_guidelines_edition_idx" ON "first_aid_guidelines"("edition");

-- CreateIndex for first_aid_concept_mappings
CREATE INDEX "first_aid_concept_mappings_conceptId_idx" ON "first_aid_concept_mappings"("conceptId");
CREATE INDEX "first_aid_concept_mappings_relevanceScore_idx" ON "first_aid_concept_mappings"("relevanceScore");
CREATE INDEX "first_aid_concept_mappings_mappingType_idx" ON "first_aid_concept_mappings"("mappingType");

-- CreateIndex for first_aid_versions
CREATE UNIQUE INDEX "first_aid_versions_edition_key" ON "first_aid_versions"("edition");
CREATE INDEX "first_aid_versions_isActive_idx" ON "first_aid_versions"("isActive");
CREATE INDEX "first_aid_versions_publishedAt_idx" ON "first_aid_versions"("publishedAt");

-- CreateIndex: Composite unique constraints for concept mappings
CREATE UNIQUE INDEX "first_aid_concept_mappings_guidelineId_conceptId_key"
    ON "first_aid_concept_mappings"("guidelineId", "conceptId")
    WHERE "guidelineId" IS NOT NULL;

CREATE UNIQUE INDEX "first_aid_concept_mappings_sectionId_conceptId_key"
    ON "first_aid_concept_mappings"("sectionId", "conceptId")
    WHERE "sectionId" IS NOT NULL;

-- AddForeignKey for first_aid_concept_mappings
ALTER TABLE "first_aid_concept_mappings"
    ADD CONSTRAINT "first_aid_concept_mappings_guidelineId_fkey"
    FOREIGN KEY ("guidelineId") REFERENCES "first_aid_guidelines"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "first_aid_concept_mappings"
    ADD CONSTRAINT "first_aid_concept_mappings_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "first_aid_sections"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "first_aid_concept_mappings"
    ADD CONSTRAINT "first_aid_concept_mappings_conceptId_fkey"
    FOREIGN KEY ("conceptId") REFERENCES "concepts"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add CHECK constraint for confidence score in lecture_first_aid_mappings
ALTER TABLE "lecture_first_aid_mappings"
    ADD CONSTRAINT "lecture_first_aid_mappings_confidence_check"
    CHECK ("confidence" >= 0.0 AND "confidence" <= 1.0);

-- Comment on tables for documentation
COMMENT ON TABLE "first_aid_guidelines" IS 'Stores First Aid clinical guidelines with embeddings for semantic search';
COMMENT ON TABLE "first_aid_concept_mappings" IS 'Maps First Aid content (guidelines or sections) to knowledge graph concepts';
COMMENT ON TABLE "first_aid_versions" IS 'Tracks different editions/versions of First Aid resources';
COMMENT ON COLUMN "first_aid_concept_mappings"."relevanceScore" IS 'Relevance score (0.0-1.0) indicating how strongly the guideline/section relates to the concept';
COMMENT ON COLUMN "first_aid_concept_mappings"."mappingType" IS 'Type of mapping: DIRECT (explicit mention), CONTEXTUAL (related by context), PROCEDURAL (part of same protocol)';

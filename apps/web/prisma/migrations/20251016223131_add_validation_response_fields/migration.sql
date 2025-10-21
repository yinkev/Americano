-- AlterTable: Add missing fields to validation_responses
ALTER TABLE "public"."validation_responses"
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "confidenceLevel" INTEGER,
ADD COLUMN IF NOT EXISTS "calibrationDelta" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "detailedFeedback" JSONB,
ADD COLUMN IF NOT EXISTS "skipped" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Add indexes for new fields
CREATE INDEX IF NOT EXISTS "validation_responses_userId_idx" ON "public"."validation_responses"("userId");
CREATE INDEX IF NOT EXISTS "validation_responses_userId_respondedAt_idx" ON "public"."validation_responses"("userId", "respondedAt");
CREATE INDEX IF NOT EXISTS "validation_responses_sessionId_idx" ON "public"."validation_responses"("sessionId");

-- Update existing rows to set userId from session.userId (where possible)
-- This handles backward compatibility for existing records
UPDATE "public"."validation_responses" vr
SET "userId" = ss."userId"
FROM "public"."study_sessions" ss
WHERE vr."sessionId" = ss."id"
  AND vr."userId" IS NULL;

-- For any remaining NULL userId values, set to default test user
-- (This should not happen in production, but provides a fallback)
UPDATE "public"."validation_responses"
SET "userId" = 'kevy@americano.dev'
WHERE "userId" IS NULL;

-- Make userId NOT NULL after backfilling
ALTER TABLE "public"."validation_responses"
ALTER COLUMN "userId" SET NOT NULL;

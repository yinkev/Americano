-- AlterTable learning_objectives: Replace pageNumber with pageStart and pageEnd

-- Step 1: Add new columns
ALTER TABLE "learning_objectives" ADD COLUMN "pageStart" INTEGER;
ALTER TABLE "learning_objectives" ADD COLUMN "pageEnd" INTEGER;

-- Step 2: Copy existing pageNumber data to both pageStart and pageEnd
-- (For single-page objectives, start and end are the same)
UPDATE "learning_objectives"
SET "pageStart" = "pageNumber",
    "pageEnd" = "pageNumber"
WHERE "pageNumber" IS NOT NULL;

-- Step 3: Drop old pageNumber column
ALTER TABLE "learning_objectives" DROP COLUMN "pageNumber";

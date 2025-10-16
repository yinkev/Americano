/*
  Warnings:

  - Changed the type of `objectives` on the `missions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "missions" ADD COLUMN     "actualMinutes" INTEGER,
ADD COLUMN     "completedObjectivesCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "objectives",
ADD COLUMN     "objectives" JSONB NOT NULL,
ALTER COLUMN "reviewCardCount" SET DEFAULT 0,
ALTER COLUMN "newContentCount" SET DEFAULT 0;

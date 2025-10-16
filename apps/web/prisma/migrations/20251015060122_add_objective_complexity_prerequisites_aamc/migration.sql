-- CreateEnum
CREATE TYPE "ObjectiveComplexity" AS ENUM ('BASIC', 'INTERMEDIATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "learning_objectives" ADD COLUMN     "aamcCompetencies" TEXT[],
ADD COLUMN     "complexity" "ObjectiveComplexity" NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "pageNumber" INTEGER;

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "sessionNotes" TEXT;

-- CreateTable
CREATE TABLE "objective_prerequisites" (
    "id" TEXT NOT NULL,
    "objectiveId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "objective_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "objective_prerequisites_objectiveId_idx" ON "objective_prerequisites"("objectiveId");

-- CreateIndex
CREATE INDEX "objective_prerequisites_prerequisiteId_idx" ON "objective_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "objective_prerequisites_objectiveId_prerequisiteId_key" ON "objective_prerequisites"("objectiveId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "learning_objectives_complexity_idx" ON "learning_objectives"("complexity");

-- AddForeignKey
ALTER TABLE "objective_prerequisites" ADD CONSTRAINT "objective_prerequisites_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_prerequisites" ADD CONSTRAINT "objective_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

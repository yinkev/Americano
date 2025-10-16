-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NOT_STARTED', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTERED');

-- AlterTable
ALTER TABLE "learning_objectives" ADD COLUMN     "lastStudiedAt" TIMESTAMP(3),
ADD COLUMN     "masteryLevel" "MasteryLevel" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "totalStudyTimeMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weaknessScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5;

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retentionScore" DOUBLE PRECISION NOT NULL,
    "studyTimeMs" INTEGER NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "correctReviews" INTEGER NOT NULL,
    "incorrectReviews" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "performance_metrics_userId_date_idx" ON "performance_metrics"("userId", "date");

-- CreateIndex
CREATE INDEX "performance_metrics_learningObjectiveId_idx" ON "performance_metrics"("learningObjectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_metrics_userId_learningObjectiveId_date_key" ON "performance_metrics"("userId", "learningObjectiveId", "date");

-- CreateIndex
CREATE INDEX "learning_objectives_masteryLevel_idx" ON "learning_objectives"("masteryLevel");

-- CreateIndex
CREATE INDEX "learning_objectives_weaknessScore_idx" ON "learning_objectives"("weaknessScore");

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "learning_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

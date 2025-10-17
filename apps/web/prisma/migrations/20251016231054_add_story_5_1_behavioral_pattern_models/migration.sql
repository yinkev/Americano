-- CreateEnum
CREATE TYPE "EngagementLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CompletionQuality" AS ENUM ('RUSHED', 'NORMAL', 'THOROUGH');

-- CreateEnum
CREATE TYPE "BehavioralPatternType" AS ENUM ('OPTIMAL_STUDY_TIME', 'SESSION_DURATION_PREFERENCE', 'CONTENT_TYPE_PREFERENCE', 'PERFORMANCE_PEAK', 'ATTENTION_CYCLE', 'FORGETTING_CURVE');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('STUDY_TIME_OPTIMIZATION', 'SESSION_LENGTH_ADJUSTMENT', 'CONTENT_PREFERENCE', 'RETENTION_STRATEGY');

-- AlterTable
ALTER TABLE "behavioral_events" ADD COLUMN     "completionQuality" "CompletionQuality",
ADD COLUMN     "contentType" TEXT,
ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "difficultyLevel" TEXT,
ADD COLUMN     "engagementLevel" "EngagementLevel",
ADD COLUMN     "sessionPerformanceScore" INTEGER,
ADD COLUMN     "timeOfDay" INTEGER;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "behavioralAnalysisEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "learningStyleProfilingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shareAnonymizedPatterns" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "behavioral_patterns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" "BehavioralPatternType" NOT NULL,
    "patternName" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "behavioral_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "insightType" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionableRecommendation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "applied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "behavioral_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_patterns" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,

    CONSTRAINT "insight_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_learning_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredStudyTimes" JSONB NOT NULL,
    "averageSessionDuration" INTEGER NOT NULL,
    "optimalSessionDuration" INTEGER NOT NULL,
    "contentPreferences" JSONB NOT NULL,
    "learningStyleProfile" JSONB NOT NULL,
    "personalizedForgettingCurve" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataQualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "user_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "behavioral_patterns_userId_idx" ON "behavioral_patterns"("userId");

-- CreateIndex
CREATE INDEX "behavioral_patterns_patternType_idx" ON "behavioral_patterns"("patternType");

-- CreateIndex
CREATE INDEX "behavioral_patterns_confidence_idx" ON "behavioral_patterns"("confidence");

-- CreateIndex
CREATE INDEX "behavioral_insights_userId_idx" ON "behavioral_insights"("userId");

-- CreateIndex
CREATE INDEX "behavioral_insights_createdAt_idx" ON "behavioral_insights"("createdAt");

-- CreateIndex
CREATE INDEX "behavioral_insights_acknowledgedAt_idx" ON "behavioral_insights"("acknowledgedAt");

-- CreateIndex
CREATE INDEX "insight_patterns_insightId_idx" ON "insight_patterns"("insightId");

-- CreateIndex
CREATE INDEX "insight_patterns_patternId_idx" ON "insight_patterns"("patternId");

-- CreateIndex
CREATE UNIQUE INDEX "insight_patterns_insightId_patternId_key" ON "insight_patterns"("insightId", "patternId");

-- CreateIndex
CREATE UNIQUE INDEX "user_learning_profiles_userId_key" ON "user_learning_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_learning_profiles_userId_idx" ON "user_learning_profiles"("userId");

-- AddForeignKey
ALTER TABLE "insight_patterns" ADD CONSTRAINT "insight_patterns_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "behavioral_insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_patterns" ADD CONSTRAINT "insight_patterns_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "behavioral_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

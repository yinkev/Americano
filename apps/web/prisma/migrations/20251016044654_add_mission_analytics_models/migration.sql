-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('STREAK_MILESTONE', 'OBJECTIVES_COMPLETED', 'CARDS_MASTERED', 'PERFECT_SESSION', 'EARLY_BIRD', 'NIGHT_OWL');

-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('TIME_BASED', 'OBJECTIVE_BASED', 'REVIEW_BASED');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AnalyticsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PaceRating" AS ENUM ('TOO_SLOW', 'JUST_RIGHT', 'TOO_FAST');

-- CreateEnum
CREATE TYPE "ReviewPeriod" AS ENUM ('WEEK', 'MONTH');

-- AlterTable
ALTER TABLE "missions" ADD COLUMN     "difficultyRating" INTEGER,
ADD COLUMN     "successScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastMissionAdaptation" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3),
    "freezesRemaining" INTEGER NOT NULL DEFAULT 2,
    "freezeUsedDates" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" "AchievementTier" NOT NULL DEFAULT 'BRONZE',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalType" "GoalType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "period" "GoalPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" "AnalyticsPeriod" NOT NULL,
    "missionsGenerated" INTEGER NOT NULL,
    "missionsCompleted" INTEGER NOT NULL,
    "missionsSkipped" INTEGER NOT NULL,
    "avgCompletionRate" DOUBLE PRECISION NOT NULL,
    "avgTimeAccuracy" DOUBLE PRECISION NOT NULL,
    "avgDifficultyRating" DOUBLE PRECISION NOT NULL,
    "avgSuccessScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "helpfulnessRating" INTEGER NOT NULL,
    "relevanceScore" INTEGER NOT NULL,
    "paceRating" "PaceRating" NOT NULL,
    "improvementSuggestions" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "ReviewPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "summary" JSONB NOT NULL,
    "highlights" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "streaks_userId_key" ON "streaks"("userId");

-- CreateIndex
CREATE INDEX "streaks_userId_idx" ON "streaks"("userId");

-- CreateIndex
CREATE INDEX "achievements_userId_idx" ON "achievements"("userId");

-- CreateIndex
CREATE INDEX "achievements_type_idx" ON "achievements"("type");

-- CreateIndex
CREATE INDEX "study_goals_userId_idx" ON "study_goals"("userId");

-- CreateIndex
CREATE INDEX "study_goals_period_startDate_idx" ON "study_goals"("period", "startDate");

-- CreateIndex
CREATE INDEX "mission_analytics_userId_date_idx" ON "mission_analytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "mission_analytics_userId_date_period_key" ON "mission_analytics"("userId", "date", "period");

-- CreateIndex
CREATE INDEX "mission_feedback_userId_idx" ON "mission_feedback"("userId");

-- CreateIndex
CREATE INDEX "mission_feedback_missionId_idx" ON "mission_feedback"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_streaks_userId_key" ON "mission_streaks"("userId");

-- CreateIndex
CREATE INDEX "mission_streaks_userId_idx" ON "mission_streaks"("userId");

-- CreateIndex
CREATE INDEX "mission_reviews_userId_generatedAt_idx" ON "mission_reviews"("userId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mission_reviews_userId_period_startDate_key" ON "mission_reviews"("userId", "period", "startDate");

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_goals" ADD CONSTRAINT "study_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_feedback" ADD CONSTRAINT "mission_feedback_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_streaks" ADD CONSTRAINT "mission_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_reviews" ADD CONSTRAINT "mission_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

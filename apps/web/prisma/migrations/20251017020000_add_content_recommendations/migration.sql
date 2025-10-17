-- Story 3.5: Context-Aware Content Recommendations
-- Migration created: 2025-10-17
-- Models: ContentRecommendation, RecommendationFeedback, RecommendationAnalytics

-- CreateEnum for RecommendationStatus
DO $$ BEGIN
  CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'VIEWED', 'DISMISSED', 'RATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for ContentSourceType
DO $$ BEGIN
  CREATE TYPE "ContentSourceType" AS ENUM ('LECTURE', 'FIRST_AID', 'EXTERNAL_ARTICLE', 'CONCEPT_NOTE', 'USER_NOTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: content_recommendations
CREATE TABLE "content_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendedContentId" TEXT NOT NULL,
    "sourceContentId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "sourceType" "ContentSourceType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "content_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: recommendation_feedback
CREATE TABLE "recommendation_feedback" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedbackText" TEXT,
    "helpful" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable: recommendation_analytics
CREATE TABLE "recommendation_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRecommendations" INTEGER NOT NULL,
    "viewedCount" INTEGER NOT NULL,
    "clickedCount" INTEGER NOT NULL,
    "dismissedCount" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION,
    "avgEngagementTimeMs" INTEGER,
    "topSourceTypes" JSONB NOT NULL,

    CONSTRAINT "recommendation_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_recommendations_userId_idx" ON "content_recommendations"("userId");
CREATE INDEX "content_recommendations_status_idx" ON "content_recommendations"("status");
CREATE INDEX "content_recommendations_contextType_contextId_idx" ON "content_recommendations"("contextType", "contextId");
CREATE INDEX "content_recommendations_createdAt_idx" ON "content_recommendations"("createdAt");
CREATE INDEX "content_recommendations_userId_contextType_contextId_idx" ON "content_recommendations"("userId", "contextType", "contextId");

-- CreateIndex
CREATE INDEX "recommendation_feedback_recommendationId_idx" ON "recommendation_feedback"("recommendationId");
CREATE INDEX "recommendation_feedback_userId_idx" ON "recommendation_feedback"("userId");
CREATE INDEX "recommendation_feedback_createdAt_idx" ON "recommendation_feedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_analytics_userId_date_key" ON "recommendation_analytics"("userId", "date");
CREATE INDEX "recommendation_analytics_userId_idx" ON "recommendation_analytics"("userId");
CREATE INDEX "recommendation_analytics_date_idx" ON "recommendation_analytics"("date");

-- AddForeignKey
ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_recommendedContentId_fkey" FOREIGN KEY ("recommendedContentId") REFERENCES "content_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_sourceContentId_fkey" FOREIGN KEY ("sourceContentId") REFERENCES "content_chunks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_feedback" ADD CONSTRAINT "recommendation_feedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "content_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new EventType values for recommendations
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RECOMMENDATION_VIEWED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RECOMMENDATION_CLICKED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RECOMMENDATION_DISMISSED';
ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'RECOMMENDATION_RATED';

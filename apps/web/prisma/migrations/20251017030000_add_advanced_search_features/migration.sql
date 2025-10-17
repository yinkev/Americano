-- Story 3.6: Advanced Search and Discovery Features
-- Migration created: 2025-10-17
-- Models: SearchSuggestion, SavedSearch, SearchAlert, SearchAnalytics

-- CreateEnum for SuggestionType
DO $$ BEGIN
  CREATE TYPE "SuggestionType" AS ENUM ('MEDICAL_TERM', 'PREVIOUS_SEARCH', 'CONTENT_TITLE', 'CONCEPT', 'LEARNING_OBJECTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for AlertFrequency
DO $$ BEGIN
  CREATE TYPE "AlertFrequency" AS ENUM ('IMMEDIATE', 'DAILY', 'WEEKLY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: search_suggestions
CREATE TABLE "search_suggestions" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "suggestionType" "SuggestionType" NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: saved_searches
CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT false,
    "alertFrequency" "AlertFrequency" NOT NULL DEFAULT 'IMMEDIATE',
    "lastRun" TIMESTAMP(3),
    "resultCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable: search_alerts
CREATE TABLE "search_alerts" (
    "id" TEXT NOT NULL,
    "savedSearchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "triggeredType" TEXT NOT NULL,
    "newResultCount" INTEGER NOT NULL,
    "lastNotified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: search_analytics
CREATE TABLE "search_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "query" TEXT NOT NULL,
    "searchCount" INTEGER NOT NULL DEFAULT 1,
    "avgResultCount" DOUBLE PRECISION NOT NULL,
    "avgSimilarity" DOUBLE PRECISION,
    "avgClickPosition" DOUBLE PRECISION,
    "zeroResultCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_suggestions_term_key" ON "search_suggestions"("term");
CREATE INDEX "search_suggestions_term_frequency_idx" ON "search_suggestions"("term", "frequency");
CREATE INDEX "search_suggestions_suggestionType_idx" ON "search_suggestions"("suggestionType");
CREATE INDEX "search_suggestions_lastUsed_idx" ON "search_suggestions"("lastUsed");

-- CreateIndex
CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");
CREATE INDEX "saved_searches_createdAt_idx" ON "saved_searches"("createdAt");

-- CreateIndex
CREATE INDEX "search_alerts_savedSearchId_idx" ON "search_alerts"("savedSearchId");
CREATE INDEX "search_alerts_userId_idx" ON "search_alerts"("userId");
CREATE INDEX "search_alerts_notificationSent_idx" ON "search_alerts"("notificationSent");
CREATE INDEX "search_alerts_createdAt_idx" ON "search_alerts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "search_analytics_userId_date_query_key" ON "search_analytics"("userId", "date", "query");
CREATE INDEX "search_analytics_userId_date_idx" ON "search_analytics"("userId", "date");
CREATE INDEX "search_analytics_date_idx" ON "search_analytics"("date");
CREATE INDEX "search_analytics_query_idx" ON "search_analytics"("query");

-- AddForeignKey
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_savedSearchId_fkey" FOREIGN KEY ("savedSearchId") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add composite indexes for query optimization (Story 3.6 Task 9.4)
CREATE INDEX "search_queries_userId_resultCount_timestamp_idx" ON "search_queries"("userId", "resultCount", "timestamp");
CREATE INDEX "search_queries_userId_query_timestamp_idx" ON "search_queries"("userId", "query", "timestamp");

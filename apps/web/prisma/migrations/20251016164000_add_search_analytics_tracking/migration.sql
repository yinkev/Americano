-- Story 3.1 Task 6: Search History & Analytics
-- Add SearchClick model and privacy fields to SearchQuery

-- Ensure base table exists before altering (fresh databases)
CREATE TABLE IF NOT EXISTS "search_queries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "topResultId" TEXT,
    "responseTimeMs" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- Add privacy fields to search_queries table (idempotent)
DO $$ BEGIN
  ALTER TABLE "search_queries" ADD COLUMN IF NOT EXISTS "isAnonymized" BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE "search_queries" ADD COLUMN IF NOT EXISTS "anonymizedAt" TIMESTAMP(3);
EXCEPTION WHEN others THEN NULL;
END $$;

-- Create index for anonymization queries
CREATE INDEX IF NOT EXISTS "search_queries_isAnonymized_idx" ON "search_queries"("isAnonymized");

-- Create search_clicks table for click-through rate tracking
CREATE TABLE "search_clicks" (
    "id" TEXT NOT NULL,
    "searchQueryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "similarity" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_clicks_pkey" PRIMARY KEY ("id")
);

-- Create indexes for search_clicks
CREATE INDEX "search_clicks_searchQueryId_idx" ON "search_clicks"("searchQueryId");
CREATE INDEX "search_clicks_userId_timestamp_idx" ON "search_clicks"("userId", "timestamp");
CREATE INDEX "search_clicks_resultId_resultType_idx" ON "search_clicks"("resultId", "resultType");

-- Add foreign key constraint
ALTER TABLE "search_clicks" ADD CONSTRAINT "search_clicks_searchQueryId_fkey" FOREIGN KEY ("searchQueryId") REFERENCES "search_queries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

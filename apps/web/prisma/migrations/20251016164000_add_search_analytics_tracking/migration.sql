-- Story 3.1 Task 6: Search History & Analytics
-- Add SearchClick model and privacy fields to SearchQuery

-- Add privacy fields to search_queries table
ALTER TABLE "search_queries" ADD COLUMN "isAnonymized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "search_queries" ADD COLUMN "anonymizedAt" TIMESTAMP(3);

-- Create index for anonymization queries
CREATE INDEX "search_queries_isAnonymized_idx" ON "search_queries"("isAnonymized");

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

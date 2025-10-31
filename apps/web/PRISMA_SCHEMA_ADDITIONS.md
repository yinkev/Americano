# Missing Prisma Schema Models

## Context
The migration `20251017030000_add_advanced_search_features` was applied but the corresponding Prisma models were never added to `schema.prisma`. The tables also don't exist in the database, suggesting they need to be recreated.

## Required Schema Additions

Add these models to `/Users/kyin/Projects/Americano/apps/web/prisma/schema.prisma` after the `SavedSearch` model (around line 2307):

```prisma
model SearchSuggestion {
  id              String         @id @default(cuid())
  term            String         @unique
  suggestionType  SuggestionType
  frequency       Int            @default(1)
  lastUsed        DateTime       @default(now())
  metadata        Json?
  createdAt       DateTime       @default(now())

  @@index([term, frequency])
  @@index([suggestionType])
  @@index([lastUsed])
  @@map("search_suggestions")
}

model SearchAlert {
  id                String       @id @default(cuid())
  savedSearchId     String
  userId            String
  triggeredBy       String
  triggeredType     String
  newResultCount    Int
  lastNotified      DateTime     @default(now())
  notificationSent  Boolean      @default(false)
  viewed            Boolean      @default(false)
  createdAt         DateTime     @default(now())

  savedSearch       SavedSearch  @relation(fields: [savedSearchId], references: [id], onDelete: Cascade)

  @@index([savedSearchId])
  @@index([userId])
  @@index([notificationSent])
  @@index([createdAt])
  @@index([viewed])
  @@map("search_alerts")
}

model SearchAnalytics {
  id               String    @id @default(cuid())
  userId           String?
  date             DateTime  @default(now())
  query            String
  searchCount      Int       @default(1)
  avgResultCount   Float
  avgSimilarity    Float?
  avgClickPosition Float?
  zeroResultCount  Int       @default(0)

  @@unique([userId, date, query])
  @@index([userId, date])
  @@index([date])
  @@index([query])
  @@map("search_analytics")
}
```

## SavedSearch Model Update

The `SavedSearch` model needs to include the relation to `SearchAlert`:

Add this field to the existing `SavedSearch` model (around line 2300):
```prisma
  searchAlerts      SearchAlert[]
```

## Database Recreation Steps

Since the tables don't exist in the database, you need to:

### Option 1: Recreate via migration (RECOMMENDED)
```bash
# 1. Add the models to schema.prisma
# 2. Create a new migration
npx prisma migrate dev --name recreate_search_models

# 3. Generate Prisma Client
npx prisma generate
```

### Option 2: Push schema directly (for development)
```bash
# 1. Add the models to schema.prisma
# 2. Push schema to database
npx prisma db push

# 3. Generate Prisma Client
npx prisma generate
```

### Option 3: Apply the original migration SQL manually
```bash
# Execute the SQL from the migration file
psql "postgresql://kyin@localhost:5432/americano" < prisma/migrations/20251017030000_add_advanced_search_features/migration.sql

# Then add models to schema.prisma and regenerate client
npx prisma generate
```

## Field Mapping from TypeScript Code

### SearchAlert fields (from search-alert-service.ts):
- ✅ `id` - Primary key
- ✅ `savedSearchId` - Foreign key to SavedSearch
- ✅ `userId` - User who owns the alert
- ✅ `triggeredBy` - ID of content that triggered the alert
- ✅ `triggeredType` - Type of content (lecture, concept, etc.)
- ✅ `newResultCount` - Number of new results
- ✅ `notificationSent` - Whether notification was sent
- ✅ `viewed` - Whether user has viewed the alert
- ✅ `createdAt` - Timestamp

### SearchSuggestion fields (from search-suggestions.ts):
- ✅ `id` - Primary key
- ✅ `term` - The suggestion term (unique)
- ✅ `suggestionType` - MEDICAL_TERM | PREVIOUS_SEARCH | CONTENT_TITLE | CONCEPT | LEARNING_OBJECTIVE
- ✅ `frequency` - Usage frequency for ranking
- ✅ `lastUsed` - Last usage timestamp for recency scoring
- ✅ `metadata` - Additional data (source, category, etc.)
- ✅ `createdAt` - Timestamp

### SearchAnalytics fields (from migration):
- ✅ `id` - Primary key
- ✅ `userId` - Optional user ID for user-specific analytics
- ✅ `date` - Date of aggregation
- ✅ `query` - Search query
- ✅ `searchCount` - Number of times query was searched
- ✅ `avgResultCount` - Average number of results
- ✅ `avgSimilarity` - Average similarity score
- ✅ `avgClickPosition` - Average click position
- ✅ `zeroResultCount` - Count of zero-result searches

## Migration SQL Reference

The complete SQL from `20251017030000_add_advanced_search_features/migration.sql`:
```sql
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

-- Indexes for search_suggestions
CREATE UNIQUE INDEX "search_suggestions_term_key" ON "search_suggestions"("term");
CREATE INDEX "search_suggestions_term_frequency_idx" ON "search_suggestions"("term", "frequency");
CREATE INDEX "search_suggestions_suggestionType_idx" ON "search_suggestions"("suggestionType");
CREATE INDEX "search_suggestions_lastUsed_idx" ON "search_suggestions"("lastUsed");

-- Indexes for search_alerts
CREATE INDEX "search_alerts_savedSearchId_idx" ON "search_alerts"("savedSearchId");
CREATE INDEX "search_alerts_userId_idx" ON "search_alerts"("userId");
CREATE INDEX "search_alerts_notificationSent_idx" ON "search_alerts"("notificationSent");
CREATE INDEX "search_alerts_createdAt_idx" ON "search_alerts"("createdAt");

-- Indexes for search_analytics
CREATE UNIQUE INDEX "search_analytics_userId_date_query_key" ON "search_analytics"("userId", "date", "query");
CREATE INDEX "search_analytics_userId_date_idx" ON "search_analytics"("userId", "date");
CREATE INDEX "search_analytics_date_idx" ON "search_analytics"("date");
CREATE INDEX "search_analytics_query_idx" ON "search_analytics"("query");

-- Foreign Keys
ALTER TABLE "search_alerts" ADD CONSTRAINT "search_alerts_savedSearchId_fkey"
  FOREIGN KEY ("savedSearchId") REFERENCES "saved_searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Next Steps

1. ✅ Add the three models to `schema.prisma`
2. ✅ Add `searchAlerts SearchAlert[]` relation to `SavedSearch` model
3. Choose migration approach (Option 1 recommended)
4. Run `npx prisma generate` to update TypeScript types
5. Verify TypeScript errors are resolved

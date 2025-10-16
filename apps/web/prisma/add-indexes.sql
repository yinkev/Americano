-- Additional database indexes for performance optimization
-- Indexes already created via Prisma migrations:
-- - lectures: userId, courseId, processingStatus
-- - cards: courseId
-- - content_chunks: lectureId
-- - learning_objectives: lectureId, isHighYield
-- - concepts: category
-- - missions: userId, date, status
-- - reviews: userId, cardId, reviewedAt
-- - study_sessions: userId, startedAt

-- Add missing indexes from solution-architecture.md requirements:

-- idx_lectures_uploaded_at: for sorting lectures by upload time
CREATE INDEX IF NOT EXISTS idx_lectures_uploaded_at
  ON lectures ("uploadedAt" DESC);

-- idx_cards_next_review_at: critical for fast mission generation (due cards query)
CREATE INDEX IF NOT EXISTS idx_cards_next_review_at
  ON cards ("nextReviewAt" ASC)
  WHERE "nextReviewAt" IS NOT NULL;

-- Composite index for user timeline queries (userId + timestamp fields)
CREATE INDEX IF NOT EXISTS idx_reviews_user_reviewed_at
  ON reviews ("userId", "reviewedAt" DESC);

CREATE INDEX IF NOT EXISTS idx_missions_user_date
  ON missions ("userId", "date" DESC);

-- Composite index for course filtering (userId is already indexed, add composite for common queries)
CREATE INDEX IF NOT EXISTS idx_courses_user_name
  ON courses ("userId", "name" ASC);

-- Notes:
-- - Partial index on cards.nextReviewAt filters out cards with NULL (new cards not yet reviewed)
-- - DESC indexes optimize sorting in descending order (most common for timelines)
-- - Composite indexes cover multiple WHERE clauses in single index
-- - Run after migrations: psql americano -f prisma/add-indexes.sql

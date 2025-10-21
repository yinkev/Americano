-- Epic 5 Performance Optimization - Database Indexes (Existing Tables Only)
-- Wave 1, Team 2: Performance Engineer
-- Date: 2025-10-20
--
-- Purpose: Optimize query performance for existing behavioral analytics tables
-- Target: Reduce response times from 2-21 seconds to <500ms

-- ============================================================================
-- behavioral_patterns Indexes (ADDITIONAL - some already exist)
-- ============================================================================

-- Already exists: behavioral_patterns_userId_idx
-- Already exists: behavioral_patterns_confidence_idx
-- Already exists: behavioral_patterns_patternType_idx

-- NEW: Combined index for time-range queries (patterns evolution endpoint)
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_userid_times"
  ON "behavioral_patterns" ("userId", "firstDetectedAt", "lastSeenAt");

-- NEW: Filtered index for high-confidence patterns (recommendations engine)
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_userid_highconf"
  ON "behavioral_patterns" ("userId", "confidence" DESC)
  WHERE "confidence" >= 0.7;

-- NEW: Composite index for type filtering
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_type_userid_time"
  ON "behavioral_patterns" ("patternType", "userId", "firstDetectedAt");

-- ============================================================================
-- behavioral_insights Indexes (ADDITIONAL - some already exist)
-- ============================================================================

-- Already exists: behavioral_insights_userId_idx
-- Already exists: behavioral_insights_acknowledgedAt_idx
-- Already exists: behavioral_insights_createdAt_idx

-- NEW: Filtered index for unacknowledged insights by priority
CREATE INDEX IF NOT EXISTS "idx_behavioral_insight_userid_unack_priority"
  ON "behavioral_insights" ("userId", "priority" DESC)
  WHERE "acknowledgedAt" IS NULL;

-- ============================================================================
-- study_sessions Indexes (ADDITIONAL - some already exist)
-- ============================================================================

-- Already exists: study_sessions_userId_idx
-- Already exists: study_sessions_startedAt_idx

-- NEW: Combined index for recent sessions query
CREATE INDEX IF NOT EXISTS "idx_study_session_userid_started_recent"
  ON "study_sessions" ("userId", "startedAt" DESC);

-- NEW: Completed sessions index
CREATE INDEX IF NOT EXISTS "idx_study_session_userid_completed"
  ON "study_sessions" ("userId", "completedAt")
  WHERE "completedAt" IS NOT NULL;

-- ============================================================================
-- Run ANALYZE to update statistics
-- ============================================================================

ANALYZE "behavioral_patterns";
ANALYZE "behavioral_insights";
ANALYZE "study_sessions";

-- ============================================================================
-- Performance Notes
-- ============================================================================

-- Expected improvements:
-- 1. /api/analytics/behavioral-insights/patterns/evolution: 2.78s → <500ms (5x faster)
-- 2. /api/analytics/behavioral-insights/recommendations: 1.84s → <500ms (3x faster)
-- 3. RecommendationsEngine queries: Significant reduction in sequential scans

-- These indexes complement the existing ones to optimize specific query patterns:
-- - Time-range queries with date filters
-- - High-confidence filtered queries
-- - Composite lookups across multiple columns

-- Verify new indexes:
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE tablename IN ('behavioral_patterns', 'behavioral_insights', 'study_sessions')
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

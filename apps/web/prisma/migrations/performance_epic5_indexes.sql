-- Epic 5 Performance Optimization - Database Indexes
-- Wave 1, Team 2: Performance Engineer
-- Date: 2025-10-20
--
-- Purpose: Optimize query performance for behavioral analytics endpoints
-- Target: Reduce response times from 2-21 seconds to <500ms

-- ============================================================================
-- personalization_configs Indexes
-- ============================================================================

-- Used by: /api/personalization/effectiveness
-- Query: WHERE user_id = X AND is_active = true
CREATE INDEX IF NOT EXISTS "idx_personalization_config_userid_active"
  ON "personalization_configs" ("user_id", "is_active")
  WHERE "is_active" = true;

-- ============================================================================
-- personalization_effectiveness Indexes
-- ============================================================================

-- Used by: /api/personalization/effectiveness
-- Query: WHERE user_id = X AND start_date >= Y AND end_date <= Z
CREATE INDEX IF NOT EXISTS "idx_personalization_effectiveness_userid_dates"
  ON "personalization_effectiveness" ("user_id", "start_date", "end_date");

-- ============================================================================
-- behavioral_patterns Indexes
-- ============================================================================

-- Used by: /api/analytics/behavioral-insights/patterns/evolution
-- Query: WHERE user_id = X AND (detected_at BETWEEN ... OR last_seen_at BETWEEN ...)
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_userid_detected"
  ON "behavioral_patterns" ("user_id", "detected_at", "last_seen_at");

-- Used by: RecommendationsEngine.generateRecommendations()
-- Query: WHERE user_id = X AND confidence >= 0.7
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_userid_confidence"
  ON "behavioral_patterns" ("user_id", "confidence" DESC)
  WHERE "confidence" >= 0.7;

-- Pattern type filtering
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_type_userid"
  ON "behavioral_patterns" ("pattern_type", "user_id", "detected_at");

-- ============================================================================
-- behavioral_insights Indexes
-- ============================================================================

-- Used by: RecommendationsEngine.generateRecommendations()
-- Query: WHERE user_id = X AND acknowledged_at IS NULL AND confidence >= 0.7
CREATE INDEX IF NOT EXISTS "idx_behavioral_insight_userid_unacknowledged"
  ON "behavioral_insights" ("user_id", "confidence" DESC)
  WHERE "acknowledged_at" IS NULL AND "confidence" >= 0.7;

-- Active insights query
CREATE INDEX IF NOT EXISTS "idx_behavioral_insight_userid_active"
  ON "behavioral_insights" ("user_id", "is_active")
  WHERE "is_active" = true;

-- ============================================================================
-- intervention_recommendations Indexes
-- ============================================================================

-- Used by: RecommendationsEngine.generateRecommendations()
-- Query: WHERE user_id = X AND status = 'PENDING'
CREATE INDEX IF NOT EXISTS "idx_intervention_recommendation_userid_pending"
  ON "intervention_recommendations" ("user_id", "priority" DESC)
  WHERE "status" = 'PENDING';

-- ============================================================================
-- recommendations Indexes
-- ============================================================================

-- Used by: RecommendationsEngine.generateRecommendations()
-- Query: WHERE user_id = X AND dismissed_at IS NULL AND applied_at IS NULL
CREATE INDEX IF NOT EXISTS "idx_recommendation_userid_active"
  ON "recommendations" ("user_id", "created_at" DESC)
  WHERE "dismissed_at" IS NULL AND "applied_at" IS NULL;

-- Recent recommendations lookup
CREATE INDEX IF NOT EXISTS "idx_recommendation_userid_recent"
  ON "recommendations" ("user_id", "title", "created_at" DESC);

-- ============================================================================
-- user_learning_profiles Indexes
-- ============================================================================

-- Used by: RecommendationsEngine.captureBaselineMetrics()
-- Query: WHERE user_id = X
-- Note: Already has unique constraint on user_id, but explicit index helps
CREATE INDEX IF NOT EXISTS "idx_user_learning_profile_userid"
  ON "user_learning_profiles" ("user_id");

-- ============================================================================
-- study_sessions Indexes
-- ============================================================================

-- Used by: RecommendationsEngine.captureBaselineMetrics()
-- Query: WHERE user_id = X AND started_at >= (7 days ago)
CREATE INDEX IF NOT EXISTS "idx_study_session_userid_started"
  ON "study_sessions" ("user_id", "started_at" DESC);

-- ============================================================================
-- applied_recommendations Indexes
-- ============================================================================

-- Used by: Recommendation effectiveness tracking
CREATE INDEX IF NOT EXISTS "idx_applied_recommendation_userid_applied"
  ON "applied_recommendations" ("user_id", "applied_at" DESC);

-- Lookup by recommendation ID
CREATE INDEX IF NOT EXISTS "idx_applied_recommendation_recid"
  ON "applied_recommendations" ("recommendation_id");

-- ============================================================================
-- Composite Indexes for Common Join Patterns
-- ============================================================================

-- Pattern → Insight correlation
CREATE INDEX IF NOT EXISTS "idx_behavioral_pattern_userid_type_confidence"
  ON "behavioral_patterns" ("user_id", "pattern_type", "confidence" DESC);

-- Session performance queries
CREATE INDEX IF NOT EXISTS "idx_study_session_userid_completed"
  ON "study_sessions" ("user_id", "completed_at")
  WHERE "completed_at" IS NOT NULL;

-- ============================================================================
-- Performance Notes
-- ============================================================================

-- Expected improvements:
-- 1. /api/personalization/effectiveness: 21.2s → <500ms (42x faster)
-- 2. /api/analytics/behavioral-insights/patterns/evolution: 2.78s → <500ms (5x faster)
-- 3. /api/analytics/behavioral-insights/recommendations: 1.84s → <500ms (3x faster)

-- Index maintenance:
-- - PostgreSQL automatically updates indexes on INSERT/UPDATE/DELETE
-- - Run ANALYZE after bulk data loads: ANALYZE personalization_configs;
-- - Monitor index usage: SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- To apply these indexes:
-- psql $DATABASE_URL -f prisma/migrations/performance_epic5_indexes.sql

-- To verify indexes were created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN (
--   'personalization_configs', 'personalization_effectiveness', 'behavioral_patterns',
--   'behavioral_insights', 'intervention_recommendations', 'recommendations'
-- ) ORDER BY tablename, indexname;

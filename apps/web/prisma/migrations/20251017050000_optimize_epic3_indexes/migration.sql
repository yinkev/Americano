-- Epic 3: Database Index Optimization
-- Migration created: 2025-10-17
-- Adds composite indexes and optimizations for common query patterns
--
-- Note: All column names use double quotes to handle PostgreSQL case sensitivity

-- ============================================
-- Story 3.1: Semantic Search Performance
-- ============================================

-- Index for user's search history with pagination
CREATE INDEX IF NOT EXISTS search_queries_userId_timestamp_desc_idx
ON search_queries("userId", "timestamp" DESC);

-- Index for zero-result query analysis
CREATE INDEX IF NOT EXISTS search_queries_zero_results_idx
ON search_queries("userId", "timestamp" DESC)
WHERE "resultCount" = 0;

-- ============================================
-- Story 3.2: Knowledge Graph Performance
-- ============================================

-- Index for bidirectional relationship queries
CREATE INDEX IF NOT EXISTS concept_relationships_bidirectional_idx
ON concept_relationships("toConceptId", "fromConceptId", relationship);

-- Index for user-defined connections
CREATE INDEX IF NOT EXISTS concept_relationships_user_defined_idx
ON concept_relationships("isUserDefined", "fromConceptId")
WHERE "isUserDefined" = true;

-- ============================================
-- Story 3.3: First Aid Integration Performance
-- ============================================

-- Index for First Aid content lookup by system and high-yield status
CREATE INDEX IF NOT EXISTS first_aid_sections_system_highyield_idx
ON first_aid_sections(system, "isHighYield", "pageNumber");

-- Index for lecture mapping confidence sorting
CREATE INDEX IF NOT EXISTS lecture_first_aid_mappings_confidence_desc_idx
ON lecture_first_aid_mappings("lectureId", confidence DESC);

-- ============================================
-- Story 3.4: Conflict Detection Performance
-- ============================================

-- Index for active conflicts by severity
CREATE INDEX IF NOT EXISTS conflicts_active_severity_idx
ON conflicts(status, severity DESC, "createdAt" DESC)
WHERE status = 'ACTIVE';

-- Index for user's pending flags
CREATE INDEX IF NOT EXISTS conflict_flags_user_pending_idx
ON conflict_flags("userId", "flaggedAt" DESC)
WHERE status = 'PENDING';

-- ============================================
-- Story 3.5: Recommendation Performance
-- ============================================

-- Index for pending recommendations by user and context
CREATE INDEX IF NOT EXISTS content_recommendations_pending_idx
ON content_recommendations("userId", "contextType", "contextId", "createdAt" DESC)
WHERE status = 'PENDING';

-- ============================================
-- Story 3.6: Advanced Search Performance
-- ============================================

-- Index for user's active saved searches
CREATE INDEX IF NOT EXISTS saved_searches_user_active_idx
ON saved_searches("userId", "updatedAt" DESC)
WHERE "alertEnabled" = true;

-- Index for unnotified search alerts
CREATE INDEX IF NOT EXISTS search_alerts_unnotified_idx
ON search_alerts("userId", "createdAt" DESC)
WHERE "notificationSent" = false;

-- ============================================
-- Cross-Story Performance Optimizations
-- ============================================

-- Index for content chunk semantic search with lecture filtering
CREATE INDEX IF NOT EXISTS content_chunks_lecture_chunk_idx
ON content_chunks("lectureId", "chunkIndex");

-- Index for high-yield learning objectives
CREATE INDEX IF NOT EXISTS learning_objectives_highyield_only_idx
ON learning_objectives("lectureId", "pageStart")
WHERE "isHighYield" = true;

-- ============================================
-- Post-Migration Notes
-- ============================================

-- After applying this migration, manually run:
-- ANALYZE search_queries;
-- ANALYZE concepts;
-- ANALYZE concept_relationships;
-- ANALYZE first_aid_sections;
-- ANALYZE lecture_first_aid_mappings;
-- ANALYZE conflicts;
-- ANALYZE content_recommendations;
-- ANALYZE search_suggestions;
-- ANALYZE saved_searches;
--
-- This updates query planner statistics for optimal query execution plans.

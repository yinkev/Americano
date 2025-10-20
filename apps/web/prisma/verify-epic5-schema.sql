-- Epic 5 Schema Verification Queries
-- Run these queries after migration to verify all changes were applied correctly
-- PostgreSQL 14+

-- ============================================
-- 1. Verify New Columns
-- ============================================

-- Check ExperimentAssignment.metrics field
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'experiment_assignments'
  AND column_name = 'metrics';
-- Expected: 1 row, data_type = 'jsonb', is_nullable = 'YES'

-- Check StudyScheduleRecommendation.appliedAt field
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'study_schedule_recommendations'
  AND column_name = 'appliedAt';
-- Expected: 1 row, data_type = 'timestamp without time zone', is_nullable = 'YES'

-- ============================================
-- 2. Verify Foreign Key Constraints
-- ============================================

-- Check ExperimentAssignment → PersonalizationExperiment foreign key
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'experiment_assignments_experimentId_fkey';
-- Expected: 1 row with ON DELETE CASCADE

-- ============================================
-- 3. Verify New Indexes
-- ============================================

-- Count total indexes per table
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'behavioral_events',
    'behavioral_patterns',
    'struggle_predictions',
    'recommendations',
    'personalization_configs',
    'study_schedule_recommendations'
  )
GROUP BY tablename
ORDER BY tablename;

-- BehavioralEvent indexes (should be 6)
-- BehavioralPattern indexes (should be 5)
-- StrugglePrediction indexes (should be 8)
-- Recommendation indexes (should be 6)
-- PersonalizationConfig indexes (should be 6)
-- StudyScheduleRecommendation indexes (should be 2)

-- ============================================
-- 4. Verify Specific Composite Indexes
-- ============================================

-- BehavioralEvent composite indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'behavioral_events'
  AND (
    indexname LIKE '%userId_eventType_timestamp%'
    OR indexname LIKE '%userId_dayOfWeek%'
    OR indexname LIKE '%userId_timeOfDay%'
  )
ORDER BY indexname;
-- Expected: 3 rows

-- BehavioralPattern composite indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'behavioral_patterns'
  AND (
    indexname LIKE '%userId_patternType_confidence%'
    OR indexname LIKE '%userId_lastSeenAt%'
  )
ORDER BY indexname;
-- Expected: 2 rows

-- StrugglePrediction composite indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'struggle_predictions'
  AND (
    indexname LIKE '%userId_predictionStatus%'
    OR indexname LIKE '%userId_topicId_predictionDate%'
  )
ORDER BY indexname;
-- Expected: 2 rows

-- Recommendation composite indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'recommendations'
  AND (
    indexname LIKE '%userId_status_priorityScore%'
    OR indexname LIKE '%userId_createdAt%'
  )
ORDER BY indexname;
-- Expected: 2 rows

-- PersonalizationConfig composite indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'personalization_configs'
  AND (
    indexname LIKE '%userId_context_isActive%'
    OR indexname LIKE '%userId_avgReward%'
  )
ORDER BY indexname;
-- Expected: 2 rows

-- StudyScheduleRecommendation appliedAt index
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'study_schedule_recommendations'
  AND indexname LIKE '%appliedAt%';
-- Expected: 1 row

-- ============================================
-- 5. Verify Index Usage (run after some queries)
-- ============================================

-- Check index usage statistics for new indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%behavioral_events_userId_eventType_timestamp%'
    OR indexname LIKE '%behavioral_events_userId_dayOfWeek%'
    OR indexname LIKE '%behavioral_events_userId_timeOfDay%'
    OR indexname LIKE '%behavioral_patterns_userId_patternType%'
    OR indexname LIKE '%behavioral_patterns_userId_lastSeenAt%'
    OR indexname LIKE '%struggle_predictions_userId_predictionStatus%'
    OR indexname LIKE '%struggle_predictions_userId_topicId%'
    OR indexname LIKE '%recommendations_userId_status%'
    OR indexname LIKE '%recommendations_userId_createdAt%'
    OR indexname LIKE '%personalization_configs_userId_context%'
    OR indexname LIKE '%personalization_configs_userId_avgReward%'
    OR indexname LIKE '%study_schedule_recommendations_appliedAt%'
  )
ORDER BY tablename, indexname;

-- ============================================
-- 6. Verify Table Row Counts (Epic 5 tables)
-- ============================================

SELECT
    'behavioral_events' as table_name,
    COUNT(*) as row_count
FROM behavioral_events
UNION ALL
SELECT
    'behavioral_patterns',
    COUNT(*)
FROM behavioral_patterns
UNION ALL
SELECT
    'struggle_predictions',
    COUNT(*)
FROM struggle_predictions
UNION ALL
SELECT
    'recommendations',
    COUNT(*)
FROM recommendations
UNION ALL
SELECT
    'personalization_configs',
    COUNT(*)
FROM personalization_configs
UNION ALL
SELECT
    'personalization_experiments',
    COUNT(*)
FROM personalization_experiments
UNION ALL
SELECT
    'experiment_assignments',
    COUNT(*)
FROM experiment_assignments
UNION ALL
SELECT
    'study_schedule_recommendations',
    COUNT(*)
FROM study_schedule_recommendations;

-- ============================================
-- 7. Verify Data Integrity
-- ============================================

-- Check for orphaned ExperimentAssignments (should be 0 after FK constraint)
SELECT COUNT(*) as orphaned_assignments
FROM experiment_assignments ea
LEFT JOIN personalization_experiments pe ON ea."experimentId" = pe.id
WHERE pe.id IS NULL;
-- Expected: 0 rows

-- Check for NULL metrics in ExperimentAssignments (OK to have NULLs)
SELECT
    COUNT(*) as total_assignments,
    COUNT(metrics) as assignments_with_metrics,
    COUNT(*) - COUNT(metrics) as assignments_without_metrics
FROM experiment_assignments;

-- Check for NULL appliedAt in StudyScheduleRecommendations (OK to have NULLs)
SELECT
    COUNT(*) as total_recommendations,
    COUNT("appliedAt") as applied_recommendations,
    COUNT(*) - COUNT("appliedAt") as unapplied_recommendations
FROM study_schedule_recommendations;

-- ============================================
-- 8. Performance Test Queries
-- ============================================

-- Test query 1: User events by type and time (should use composite index)
EXPLAIN ANALYZE
SELECT *
FROM behavioral_events
WHERE "userId" = (SELECT id FROM users LIMIT 1)
  AND "eventType" = 'MISSION_COMPLETED'
  AND timestamp >= NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC
LIMIT 100;
-- Expected: Index Scan using behavioral_events_userId_eventType_timestamp_idx

-- Test query 2: High-confidence patterns (should use composite index)
EXPLAIN ANALYZE
SELECT *
FROM behavioral_patterns
WHERE "userId" = (SELECT id FROM users LIMIT 1)
  AND "patternType" = 'OPTIMAL_STUDY_TIME'
  AND confidence > 0.7
ORDER BY confidence DESC;
-- Expected: Index Scan using behavioral_patterns_userId_patternType_confidence_idx

-- Test query 3: High-risk predictions (should use composite index)
EXPLAIN ANALYZE
SELECT *
FROM struggle_predictions
WHERE "userId" = (SELECT id FROM users LIMIT 1)
  AND "predictionStatus" = 'PENDING'
  AND "predictedStruggleProbability" > 0.7
ORDER BY "predictedStruggleProbability" DESC;
-- Expected: Index Scan using struggle_predictions_userId_predictionStatus_predictedStrug_idx

-- Test query 4: Active recommendations ranked (should use composite index)
EXPLAIN ANALYZE
SELECT *
FROM recommendations
WHERE "userId" = (SELECT id FROM users LIMIT 1)
  AND status = 'PENDING'
ORDER BY "priorityScore" DESC
LIMIT 10;
-- Expected: Index Scan using recommendations_userId_status_priorityScore_idx

-- Test query 5: Active personalization config (should use composite index)
EXPLAIN ANALYZE
SELECT *
FROM personalization_configs
WHERE "userId" = (SELECT id FROM users LIMIT 1)
  AND context = 'MISSION'
  AND "isActive" = true
LIMIT 1;
-- Expected: Index Scan using personalization_configs_userId_context_isActive_idx

-- ============================================
-- 9. Index Size Report
-- ============================================

SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'behavioral_events',
    'behavioral_patterns',
    'struggle_predictions',
    'recommendations',
    'personalization_configs',
    'study_schedule_recommendations'
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================
-- 10. Summary Report
-- ============================================

-- Epic 5 Schema Completion Summary
SELECT
    'Epic 5 Schema Verification' as report_title,
    NOW() as verification_time,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'experiment_assignments'
       AND column_name = 'metrics') as experiment_assignment_metrics_exists,
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'study_schedule_recommendations'
       AND column_name = 'appliedAt') as schedule_recommendation_appliedAt_exists,
    (SELECT COUNT(*) FROM pg_constraint
     WHERE conname = 'experiment_assignments_experimentId_fkey') as foreign_key_constraint_exists,
    (SELECT COUNT(*) FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename IN (
         'behavioral_events',
         'behavioral_patterns',
         'struggle_predictions',
         'recommendations',
         'personalization_configs',
         'study_schedule_recommendations'
       )) as total_epic5_indexes;
-- Expected:
-- experiment_assignment_metrics_exists = 1
-- schedule_recommendation_appliedAt_exists = 1
-- foreign_key_constraint_exists = 1
-- total_epic5_indexes = 33 (6+5+8+6+6+2)

-- ============================================
-- Verification Complete
-- ============================================

-- If all queries return expected results:
-- ✅ Schema migration successful
-- ✅ All new columns created
-- ✅ Foreign key constraint enforced
-- ✅ All indexes created and operational
-- ✅ Query performance optimized
-- ✅ Data integrity maintained

-- Next steps:
-- 1. Run application test suite
-- 2. Monitor query performance for 24-48 hours
-- 3. Check slow query logs
-- 4. Verify no errors in application logs

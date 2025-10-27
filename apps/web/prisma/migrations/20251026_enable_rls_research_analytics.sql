-- Enable Row-Level Security for Research Analytics Tables
-- ADR-006: Research-Grade Analytics System
-- Purpose: Prepare for multi-tenant scale while maintaining data isolation

-- Enable RLS on research analytics tables
ALTER TABLE "experiment_protocols" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "phase_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "context_metadata" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analysis_runs" ENABLE ROW LEVEL SECURITY;

-- ExperimentProtocol policies
-- Policy: Users can only see their own experiment protocols
CREATE POLICY "experiment_protocols_isolation_policy"
    ON "experiment_protocols"
    FOR ALL
    USING ("userId" = current_setting('app.current_user_id', TRUE));

-- PhaseAssignment policies
-- Policy: Users can only see phase assignments for their own protocols
CREATE POLICY "phase_assignments_isolation_policy"
    ON "phase_assignments"
    FOR ALL
    USING (
        "protocolId" IN (
            SELECT "id" FROM "experiment_protocols"
            WHERE "userId" = current_setting('app.current_user_id', TRUE)
        )
    );

-- ContextMetadata policies
-- Policy: Users can only see their own context metadata
CREATE POLICY "context_metadata_isolation_policy"
    ON "context_metadata"
    FOR ALL
    USING ("userId" = current_setting('app.current_user_id', TRUE));

-- AnalysisRun policies
-- Policy: Users can only see analysis runs for their own protocols
CREATE POLICY "analysis_runs_isolation_policy"
    ON "analysis_runs"
    FOR ALL
    USING (
        "protocolId" IN (
            SELECT "id" FROM "experiment_protocols"
            WHERE "userId" = current_setting('app.current_user_id', TRUE)
        )
    );

-- Create helper function to set current user context
-- This will be called from application code before queries
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to application user
-- Note: Replace 'your_app_user' with actual database user
-- GRANT EXECUTE ON FUNCTION set_current_user_id TO your_app_user;

COMMENT ON POLICY "experiment_protocols_isolation_policy" ON "experiment_protocols" IS
    'RLS policy: Users can only access their own experiment protocols';
COMMENT ON POLICY "phase_assignments_isolation_policy" ON "phase_assignments" IS
    'RLS policy: Users can only access phase assignments for their own protocols';
COMMENT ON POLICY "context_metadata_isolation_policy" ON "context_metadata" IS
    'RLS policy: Users can only access their own context metadata';
COMMENT ON POLICY "analysis_runs_isolation_policy" ON "analysis_runs" IS
    'RLS policy: Users can only access analysis runs for their own protocols';

-- For development/testing: Disable RLS for superuser/admin
-- Uncomment if needed during development
-- ALTER TABLE "experiment_protocols" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "phase_assignments" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "context_metadata" FORCE ROW LEVEL SECURITY;
-- ALTER TABLE "analysis_runs" FORCE ROW LEVEL SECURITY;

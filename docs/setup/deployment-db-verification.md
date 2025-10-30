# Epic 4 Database Verification and Backup Plan

Status: Ready to execute (staging first), then production
Owners: PM (Kevy), BE Dev
Related: [epic4-deployment-plan.md](./epic4-deployment-plan.md), [epic4-release-notes.md](../releases/epic4-release-notes.md)

1. Objectives
- Verify schema compatibility and vector dimensions (1536) before rollout
- Capture full backups and perform a restore drill
- Dry-run migrations (or schema push) safely on staging
- Validate critical queries and indexes for Epic 4 features

2. Inputs and References
- Prisma schema: [schema.prisma](../../apps/web/prisma/schema.prisma)
- API analytics routes: [routes.py](../../apps/api/src/analytics/routes.py:1)
- Validation calibrator: [calibrator.py](../../apps/api/src/validation/calibrator.py:1)
- Status doc evidence: 1536-dim correction in [bmm-workflow-status.md](../bmm-workflow-status.md:283)

3. Environment Prerequisites
- PostgreSQL client tools installed (`psql`, `pg_dump`, `pg_restore`)
- Environment vars set: `DATABASE_URL` for staging/prod
- pgvector extension enabled in target DBs

4. Backup Plan (Production)
- Full logical backup (custom format):
  - Command: `pg_dump --no-owner --format=custom --file=americano_prod_$(date +%Y%m%d%H%M).dump "$DATABASE_URL"`
- Store in secure location (S3 or encrypted drive)
- Record backup artifact name and checksum

5. Restore Drill (Staging)
- Create restore DB (or use staging instance with a new database name)
  - Example: `createdb americano_staging_restore`
- Restore from a recent prod backup:
  - `pg_restore --clean --if-exists --no-owner --dbname=americano_staging_restore americano_prod_YYYYMMDDHHMM.dump`
- Smoke-check connectivity (`psql`) and row counts for key tables (objectives, prompts, responses)

6. Vector Dimension Verification (Staging)
- Ensure 1536-dim embeddings (Gemini text-embedding-001 with output_dimensionality=1536):
  - ContentChunk/Lecture embedding check (adjust table/column names as applicable):
    - `SELECT vector_dims(embedding) AS dims, COUNT(*) FROM "ContentChunk" GROUP BY 1;`
    - Expect: single row with `dims = 1536`
- Confirm Prisma schema expects 1536 for vector columns per [schema.prisma](../../apps/web/prisma/schema.prisma)

7. Migration Strategy (Multi-Worktree Note)
- If migration files exist for Epic 4 models:
  - Staging: `npx prisma migrate deploy`
  - Production: `npx prisma migrate deploy` during maintenance window
- If no migration files (schema-only sync approach used during Epic 4):
  - Staging: `npx prisma db push --skip-generate`
  - Production: Prefer generated migrations; only use `db push` if approved (document rationale)
- Validate after apply:
  - `npx prisma migrate status` (reports applied status)

8. Index and Performance Verification
- Vector index presence (IVFFlat/HNSW) matches 1536 dimensions:
  - Inspect indexes via `\d+ "ContentChunk"` or catalog queries
- Critical query latencies:
  - Analytics endpoints in [routes.py](../../apps/api/src/analytics/routes.py:1) < 200ms typical
  - Calibration queries in [calibrator.py](../../apps/api/src/validation/calibrator.py:1) < 100ms typical
- Add EXPLAIN ANALYZE sampling for top queries (store outputs in release artifacts)

9. Data Integrity Checks
- Foreign keys: ValidationResponse → ValidationPrompt present
- No orphaned prompts; `promptId` references valid rows
- CalibrationMetric daily aggregates consistent with sample ValidationResponse sets
- Sample counts for Epic 4 objects (scenarios, challenges, metrics) within expected ranges

10. Rollback Readiness
- Confirm last good backup exists and is restorable (proved in restore drill)
- Document rollback commands:
  - Web/API/Services: revert to previous tag (documented in [epic4-deployment-plan.md](./epic4-deployment-plan.md:13))
  - DB: restore from backup (`pg_restore --clean --if-exists ...`)
- Keep rollback instruction snippet in deployment channel

11. Sign-off Checklist (Staging → Production)
- [ ] Backup created and artifact logged
- [ ] Restore drill succeeded (staging)
- [ ] Vector dims verified at 1536 (staging/prod)
- [ ] Migrations/db push dry-run passed (staging)
- [ ] Indexes present and queries performant
- [ ] Rollback plan validated
- [ ] Approval: PM / BE Dev

12. Execution Log (fill during run)
- Backup:
  - File: …
  - SHA256: …
  - Location: …
- Restore drill:
  - DB name: …
  - Duration: …
- Vector dims:
  - Query result: …
- Migrations:
  - Command and output: …
- Index/EXPLAIN summaries:
  - Links to logs: …
- Final sign-off:
  - PM: …
  - BE Dev: …
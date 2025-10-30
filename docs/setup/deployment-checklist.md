# Epic 4 Pre-Deploy Checklist (Staging → Production)

Status: To execute in order; record outcomes per item
Related: [deployment-epic4-plan.md](./deployment-epic4-plan.md), [deployment-db-verification.md](./deployment-db-verification.md), [release-notes](../deprecated/2025-10/epics/epic-4/release-notes.md)

1. Change Freeze and Artifact Tagging
- [ ] Confirm change freeze active (no risky merges)
- [ ] Select and record release tag (v4.0.0) in [release-notes](../deprecated/2025-10/epics/epic-4/release-notes.md)

2. CI and Tests Green
- [ ] Web build + tests: no failures (unit/integration) under `../../apps/web/src/lib/__tests__/embedding-service.test.ts`
- [ ] API pytest: all passing for Epic 4 analytics `../../apps/api/tests/test_e2e_epic4.py`, `../../apps/api/tests/test_dashboard.py`
- [ ] Lint/format clean

3. Secrets and Config (Staging and Prod)
- [ ] Validate `.env` parity with examples:
  - Web/API: `../../apps/api/.env.example`
  - ChatMock: `../../services/chatmock/.env.example`
- [ ] Present: `DATABASE_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CHATMOCK_URL`
- [ ] Rate limiter enabled at `../../apps/web/src/lib/rate-limiter.ts`
- [ ] Logger PII redaction on `../../apps/web/src/lib/logger-pii-redaction.ts`

4. Database Prep (Staging)
- [ ] Backup/restore drill completed per [deployment-db-verification.md](./deployment-db-verification.md)
- [ ] Vector dims verified = 1536 per `../bmm-workflow-status.md`
- [ ] Apply migrations (or `db push` if approved) and run `prisma migrate status`
- [ ] Validate indexes for analytics/search (pgvector, IVFFlat/HNSW)

5. Services Health (Staging)
- [ ] API health checks up (200) `../../apps/api/src/analytics/routes.py`
- [ ] ChatMock reachable `../../services/chatmock/README.md`
- [ ] OCR service up `../../services/ocr-service/README.md`

6. Staging Smoke Tests
- [ ] Comprehension prompt e2e (generate → submit → rubric) [story-4.1.md](../stories/story-4.1.md)
- [ ] Clinical scenario flow (stage progression, scoring) [story-4.2.md](../stories/story-4.2.md)
- [ ] Calibration capture + feedback → dashboard trend [story-4.4.md](../stories/story-4.4.md)
- [ ] Adaptive assessment (difficulty adjusts; early stop possible) [story-4.5.md](../stories/story-4.5.md)
- [ ] Understanding dashboard loads <2s [story-4.6.md](../stories/story-4.6.md)

7. Rollback Readiness
- [ ] Latest production backup ready and verified by restore drill [deployment-db-verification.md](./deployment-db-verification.md)
- [ ] Previous app release tag recorded; revert steps documented [deployment-epic4-plan.md](./deployment-epic4-plan.md)

8. Production Cutover Plan
- [ ] Announce start/end window and on-call owners [deployment-epic4-plan.md](./deployment-epic4-plan.md)
- [ ] Scale/prepare services (warm-up)
- [ ] Apply DB migrations (window)
- [ ] Deploy API/services, then web
- [ ] Flip flags if applicable (document diffs)

9. Production Smoke Tests (Post-Deploy)
- [ ] API key endpoints return 200 (validation, analytics)
- [ ] 1-sample run for each Epic 4 feature completes
- [ ] Logs/metrics steady; 5xx and latency within norm

10. Communications and Documentation
- [ ] Publish release notes [epic4-release-notes.md](../releases/epic4-release-notes.md:1)
- [ ] Update workflow status next action in `../bmm-workflow-status.md:52`
- [ ] Schedule retrospective meeting; attach metrics snapshots

Execution Notes (fill during run)
- Owner checkpoints, timestamps, links to dashboards, and any exceptions granted.

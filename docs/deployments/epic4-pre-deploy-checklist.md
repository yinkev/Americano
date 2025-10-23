# Epic 4 Pre-Deploy Checklist (Staging → Production)

Status: To execute in order; record outcomes per item
Related: [epic4-deployment-plan.md](./epic4-deployment-plan.md:1), [epic4-db-verification.md](./epic4-db-verification.md:1), [epic4-release-notes.md](../releases/epic4-release-notes.md:1)

1. Change Freeze and Artifact Tagging
- [ ] Confirm change freeze active (no risky merges)
- [ ] Select and record release tag (v4.0.0) in [epic4-release-notes.md](../releases/epic4-release-notes.md:1)

2. CI and Tests Green
- [ ] Web build + tests: no failures (unit/integration) under [__tests__](../../apps/web/src/lib/__tests__/embedding-service.test.ts:1)
- [ ] API pytest: all passing for Epic 4 analytics [test_e2e_epic4.py](../../apps/api/tests/test_e2e_epic4.py:1), [test_dashboard.py](../../apps/api/tests/test_dashboard.py:1)
- [ ] Lint/format clean

3. Secrets and Config (Staging and Prod)
- [ ] Validate `.env` parity with examples:
  - Web/API: [apps/api/.env.example](../../apps/api/.env.example:1)
  - ChatMock: [services/chatmock/.env.example](../../services/chatmock/.env.example:1)
- [ ] Present: `DATABASE_URL`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CHATMOCK_URL`
- [ ] Rate limiter enabled at [rate-limiter.ts](../../apps/web/src/lib/rate-limiter.ts:1)
- [ ] Logger PII redaction on [logger-pii-redaction.ts](../../apps/web/src/lib/logger-pii-redaction.ts:1)

4. Database Prep (Staging)
- [ ] Backup/restore drill completed per [epic4-db-verification.md](./epic4-db-verification.md:4)
- [ ] Vector dims verified = 1536 per [bmm-workflow-status.md](../bmm-workflow-status.md:283)
- [ ] Apply migrations (or `db push` if approved) and run `prisma migrate status`
- [ ] Validate indexes for analytics/search (pgvector, IVFFlat/HNSW)

5. Services Health (Staging)
- [ ] API health checks up (200) [apps/api/src/analytics/routes.py](../../apps/api/src/analytics/routes.py:1)
- [ ] ChatMock reachable [services/chatmock/README.md](../../services/chatmock/README.md:1)
- [ ] OCR service up [services/ocr-service/README.md](../../services/ocr-service/README.md:1)

6. Staging Smoke Tests
- [ ] Comprehension prompt e2e (generate → submit → rubric) [story-4.1.md](../stories/story-4.1.md:21)
- [ ] Clinical scenario flow (stage progression, scoring) [story-4.2.md](../stories/story-4.2.md:29)
- [ ] Calibration capture + feedback → dashboard trend [story-4.4.md](../stories/story-4.4.md:36)
- [ ] Adaptive assessment (difficulty adjusts; early stop possible) [story-4.5.md](../stories/story-4.5.md:30)
- [ ] Understanding dashboard loads <2s [story-4.6.md](../stories/story-4.6.md:31)

7. Rollback Readiness
- [ ] Latest production backup ready and verified by restore drill [epic4-db-verification.md](./epic4-db-verification.md:5)
- [ ] Previous app release tag recorded; revert steps documented [epic4-deployment-plan.md](./epic4-deployment-plan.md:16)

8. Production Cutover Plan
- [ ] Announce start/end window and on-call owners [epic4-deployment-plan.md](./epic4-deployment-plan.md:5)
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
- [ ] Update workflow status next action in [bmm-workflow-status.md](../bmm-workflow-status.md:52)
- [ ] Schedule retrospective meeting; attach metrics snapshots

Execution Notes (fill during run)
- Owner checkpoints, timestamps, links to dashboards, and any exceptions granted.

# Epic 4 Deployment Plan (Americano)

Status: Draft v0.1 — PM-owned. Target: Production rollout.

1. Scope
- Epic: Understanding Validation Engine (Stories 4.1–4.6) — all DONE in `../bmm-workflow-status.md`.
- Codebases: `apps/web/src/lib/README.md:1`, `apps/api/README.md:1`, `services/chatmock/README.md:1`, `services/ocr-service/README.md:1`.
- No Epic 5 content included (tracked separately).

2. Change Inventory (high level)
- 4.1 Natural Language Comprehension: API routes + validators in `apps/api/src/validation/routes.py:1`.
- 4.2 Clinical Reasoning: Scenario gen/eval in `apps/api/src/validation/scenario_generator.py:1` and `apps/api/src/validation/scenario_evaluator.py:1`.
- 4.3 Controlled Failure: Retry/failure patterns in `apps/api/src/challenge/routes.py:1`.
- 4.4 Confidence Calibration: Calibrator and analytics in `apps/api/src/validation/calibrator.py:1` and `apps/api/src/analytics/routes.py:1`.
- 4.5 Adaptive Questioning: IRT engine + selection in `apps/api/src/adaptive/irt_engine.py:1` and `apps/api/src/adaptive/question_selector.py:1`.
- 4.6 Understanding Analytics: Dashboards/services in `apps/api/src/analytics/QUICK_REFERENCE.md:1` and web integration in `apps/web/src/lib/mission-analytics-engine.ts:1`.

3. Environments
- Staging: latest main branch, isolated DB, external keys set to non-prod.
- Production: tagged release vX.Y.Z built from protected branch.

4. Ownership
- Deployment lead (PM): Kevy
- Web owner: FE dev
- API owner: BE dev
- Services owner: Platform dev (ChatMock, OCR)
- QA/Verification: PM + Devs (smoke + spot checks)

5. Schedule
- Deployment window: 60 minutes
- Freeze start: T-24h (no risky merges)
- Rollback window: 60 minutes post-cutover

6. Preconditions
- Confirm Epic 4 DONE in `../bmm-workflow-status.md`.
- Verify zero TypeScript/pytest failures: `apps/web/src/lib/__tests__/embedding-service.test.ts:1`, `apps/api/tests/test_e2e_epic4.py:1`.
- Secrets configured: GEMINI_API_KEY, OPENAI_API_KEY, CHATMOCK_URL, DATABASE_URL.
- External rate limits reviewed (Gemini, OpenAI).

7. Database Migrations and Backups
- Schema owners: Prisma (web) and SQL for analytics.
- Backup: Take full DB snapshot; verify restore in staging.
- Dry run migrations in staging using web’s Prisma and any raw SQL.
- Verify pgvector dims use 1536 per correction in `../bmm-workflow-status.md`.

8. Artifacts and Versioning
- Tag repo: vX.Y.Z (SemVer).
- Record artifact SHAs for web/api/services.

9. Configuration and Secrets
- Web: .env.production values for embeddings and analytics.
- API: `apps/api/.env.example:1` parity with production.
- ChatMock: `services/chatmock/.env.example:1`.
- OCR: `services/ocr-service/README.md:1` environment requirements.

10. Pre-Deploy Checklist
- [ ] CI green for web/api/services
- [ ] Env parity validated (staging≈prod)
- [ ] Feature flags/defaults verified
- [ ] Rate limit guards enabled in `apps/web/src/lib/rate-limiter.ts:1`
- [ ] Logging redaction on in `apps/web/src/lib/logger-pii-redaction.ts:1`
- [ ] Health endpoints responding (API/services)

11. Staging Rollout Steps
1) Build web: pnpm build
2) Run web tests: pnpm test
3) Build api: python packaging + pytest
4) Migrate DB (Prisma migrate deploy)
5) Start services: ChatMock, OCR
6) Run smoke tests (below)

12. Smoke Tests (Staging)
- Search API returns results: `apps/web/src/lib/semantic-search-service.ts:1`
- Objective extraction round-trip: `apps/web/src/lib/ai/chatmock-client.ts:1` via UI
- IRT selection path: `apps/web/src/lib/adaptive/irt-engine.ts:1` sample quiz
- Confidence calibrator endpoint: `apps/api/src/validation/calibrator.py:1`
- Analytics summary endpoint: `apps/api/src/analytics/routes.py:1`

13. Production Rollout Steps
1) Announce start on Slack/email
2) Scale up services to handle warm-up
3) Apply migrations
4) Deploy API/services
5) Deploy web
6) Flip any flags (if needed)
7) Run prod smoke tests

14. Monitoring and Alerting
- Logs/metrics dashboards
- Alerts thresholds for 5xx, latency, queue depth
- Error redaction: `apps/web/src/lib/logger.ts:1`

15. Post-Deploy Validation
- Synthetic checks pass
- Manual spot checks for Stories 4.1–4.6 user flows
- Data integrity verified (no migration anomalies)

16. Rollback Plan
- If errors/SLAs breached >10 min:
  a) Revert web/api/services to previous release
  b) Rollback DB via snapshot restore
  c) Announce rollback; file incident

17. Communications
- Stakeholders: PM, Devs
- Channels: Slack/email
- Release notes source: `../bmm-workflow-status.md` and [Epic 4 Implementation Guide](../epic-docs/epic-4-implementation-guide.md)

18. Sign-offs
- PM: __________
- Web: __________
- API: __________
- Services: __________
- QA: __________

19. Appendix — References
- API tests: `apps/api/tests/test_e2e_epic4.py:1`
- Validation routes: `apps/api/src/validation/routes.py:1`
- Adaptive engine: `apps/api/src/adaptive/irt_engine.py:1`
- Retry scheduler: `apps/api/src/challenge/retry_scheduler.py:1`
- Progress tracker: `apps/api/src/analytics/progress_tracker.py:1`
- Web mission engine: `apps/web/src/lib/mission-analytics-engine.ts:1`

20. Notes
- Design system: OKLCH colors, no gradients (see [ux-specification.md](../overview/ux-specification.md))
- Tailwind v4, shadcn/ui; verify no tailwindcss-animate in prod
- motion.dev reserved for future animations; none required for Epic 4

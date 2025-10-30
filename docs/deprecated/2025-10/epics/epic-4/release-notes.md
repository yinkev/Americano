# Americano — Epic 4 Release Notes (Understanding Validation Engine)

Status: Ready for Production
Tag: v4.0.0
Date: 2025-10-20
Owner: PM (Kevy)

1. Scope and Sources
- Epic 4 completion confirmed in [bmm-workflow-status.md](../bmm-workflow-status.md:13) with finish date [2025-10-17](../bmm-workflow-status.md:59).
- Story sources:
  - [Story 4.1](../stories/story-4.1.md:1): Natural Language Comprehension Prompts
  - [Story 4.2](../stories/story-4.2.md:1): Clinical Reasoning Scenario Assessment
  - [Story 4.3](../stories/story-4.3.md:1): Controlled Failure and Memory Anchoring
  - [Story 4.4](../stories/story-4.4.md:1): Confidence Calibration and Metacognitive Assessment
  - [Story 4.5](../stories/story-4.5.md:1): Adaptive Questioning and Progressive Assessment
  - [Story 4.6](../stories/story-4.6.md:1): Comprehensive Understanding Analytics
- Implementation Guide reference: [Epic 4 Implementation Guide](../../../../epic-docs/epic-4-implementation-guide.md)
- Deployment runbook: [epic4-deployment-plan.md](../deployments/epic4-deployment-plan.md:1)

2. Highlights by Story
- 4.1 Comprehension (foundation)
  - Explain-to-a-patient prompts, rubric-based AI evaluation, comprehension scoring, feedback UI, session integration.
  - Key refs: [story-4.1.md](../stories/story-4.1.md:21), [apps/api/src/validation/routes.py](../../apps/api/src/validation/routes.py:1), [apps/web/src/components/study/ComprehensionPromptDialog.tsx](../../apps/web/src/components/study/ComprehensionPromptDialog.tsx:1)
- 4.2 Clinical Reasoning
  - Multi-stage cases, reasoning evaluation across competencies, scenario generator, feedback panel, analytics.
  - Key refs: [story-4.2.md](../stories/story-4.2.md:21), [apps/web/src/components/study/ClinicalCaseDialog.tsx](../../apps/web/src/components/study/ClinicalCaseDialog.tsx:1), [apps/web/src/lib/clinical-reasoning-evaluator.ts](../../apps/web/src/lib/clinical-reasoning-evaluator.ts:1)
- 4.3 Controlled Failure
  - Vulnerability targeting, near-miss distractors, immediate corrective feedback, emotional anchoring, spaced retries.
  - Key refs: [story-4.3.md](../stories/story-4.3.md:21), [apps/web/src/lib/challenge/retry-scheduler.ts](../../apps/web/src/lib/challenge/retry-scheduler.ts:1), [apps/api/src/challenge/routes.py](../../apps/api/src/challenge/routes.py:1)
- 4.4 Confidence Calibration
  - Pre/post confidence capture, calibration delta, correlation, trends, interventions, peer comparison (opt-in).
  - Key refs: [story-4.4.md](../stories/story-4.4.md:21), [apps/api/src/validation/calibrator.py](../../apps/api/src/validation/calibrator.py:1), [apps/web/src/lib/confidence-calibrator.ts](../../apps/web/src/lib/confidence-calibrator.ts:1)
- 4.5 Adaptive Questioning
  - Real-time difficulty adjustment, mastery verification protocol, IRT engine, follow-ups via graph relationships.
  - Key refs: [story-4.5.md](../stories/story-4.5.md:21), [apps/web/src/lib/adaptive/irt-engine.ts](../../apps/web/src/lib/adaptive/irt-engine.ts:1), [apps/web/src/lib/adaptive-session-orchestrator.ts](../../apps/web/src/lib/adaptive-session-orchestrator.ts:1)
- 4.6 Understanding Analytics
  - Unified analytics dashboard, understanding vs memorization comparison, trends, predictive insights, correlations.
  - Key refs: [story-4.6.md](../stories/story-4.6.md:21), [apps/api/src/analytics/routes.py](../../apps/api/src/analytics/routes.py:1), [apps/web/src/lib/mission-analytics-engine.ts](../../apps/web/src/lib/mission-analytics-engine.ts:1)

3. Change Inventory (Concise)
- Backend (Python API)
  - Validation: [apps/api/src/validation/routes.py](../../apps/api/src/validation/routes.py:1), [calibrator.py](../../apps/api/src/validation/calibrator.py:1), [evaluator.py](../../apps/api/src/validation/evaluator.py:1), [scenario_generator.py](../../apps/api/src/validation/scenario_generator.py:1)
  - Challenge: [apps/api/src/challenge/retry_scheduler.py](../../apps/api/src/challenge/retry_scheduler.py:1), [failure_pattern_detector.py](../../apps/api/src/challenge/failure_pattern_detector.py:1), [routes.py](../../apps/api/src/challenge/routes.py:1)
  - Analytics: [apps/api/src/analytics/routes.py](../../apps/api/src/analytics/routes.py:1), [models.py](../../apps/api/src/analytics/models.py:1), [progress_tracker.py](../../apps/api/src/analytics/progress_tracker.py:1)
  - Adaptive/IRT: [apps/api/src/adaptive/irt_engine.py](../../apps/api/src/adaptive/irt_engine.py:1)
  - Tests: [apps/api/tests/test_e2e_epic4.py](../../apps/api/tests/test_e2e_epic4.py:1), [test_calibrator.py](../../apps/api/tests/test_calibrator.py:1), [test_dashboard.py](../../apps/api/tests/test_dashboard.py:1)
- Frontend (Next.js)
  - Libraries and engines: [apps/web/src/lib/adaptive/irt-engine.ts](../../apps/web/src/lib/adaptive/irt-engine.ts:1), [confidence-calibrator.ts](../../apps/web/src/lib/confidence-calibrator.ts:1), [challenge/corrective-feedback-engine.ts](../../apps/web/src/lib/challenge/corrective-feedback-engine.ts:1), [semantic-search-service.ts](../../apps/web/src/lib/semantic-search-service.ts:1)
  - Components (study/analytics): [ComprehensionPromptDialog.tsx](../../apps/web/src/components/study/ComprehensionPromptDialog.tsx:1), [ClinicalCaseDialog.tsx](../../apps/web/src/components/study/ClinicalCaseDialog.tsx:1), [CalibrationFeedbackPanel.tsx](../../apps/web/src/components/study/CalibrationFeedbackPanel.tsx:1)
  - Jobs: [apps/web/src/jobs/first-aid-updater.ts](../../apps/web/src/jobs/first-aid-updater.ts:1)
  - Tests: [apps/web/src/lib/__tests__/semantic-search-service.test.ts](../../apps/web/src/lib/__tests__/semantic-search-service.test.ts:1), [embedding-service.test.ts](../../apps/web/src/lib/__tests__/embedding-service.test.ts:1)
- Services
  - ChatMock: [services/chatmock/README.md](../../services/chatmock/README.md:1), routes for OpenAI proxy in [services/chatmock/chatmock/routes_openai.py](../../services/chatmock/chatmock/routes_openai.py:1)
  - OCR: [services/ocr-service/README.md](../../services/ocr-service/README.md:1)

4. Database and Migrations
- Vector dimensions: Confirm and enforce 1536-dim embeddings per correction in [bmm-workflow-status.md](../bmm-workflow-status.md:283) to align with pgvector ≤2000 constraints.
- New/extended models across Epic 4 as defined in story specs (ValidationPrompt/Response extensions, Comprehension/Clinical/Calibration metrics, MasteryVerification, AdaptiveSession).
- Migration execution strategy: see deployment plan section 7 and Prisma usage in [apps/web/src/lib/db.ts](../../apps/web/src/lib/db.ts:1).

5. API Contracts (Representative)
- Validation
  - POST /api/validation/prompts/generate, POST /api/validation/responses, GET /api/validation/metrics/:objectiveId (web)
  - Python evaluation/calibration integrated via [calibrator.py](../../apps/api/src/validation/calibrator.py:1), [evaluator.py](../../apps/api/src/validation/evaluator.py:1)
- Clinical Scenarios
  - POST /api/validation/scenarios/generate, POST /api/validation/scenarios/submit, GET /api/validation/scenarios/metrics
- Adaptive
  - POST /api/adaptive/session/start, POST /api/adaptive/question/next, GET /api/mastery/:objectiveId, GET /api/adaptive/efficiency (per [story-4.5.md](../stories/story-4.5.md:1938))
- Analytics
  - GET /analytics/understanding/dashboard, .../comparison (see [apps/api/src/analytics/routes.py](../../apps/api/src/analytics/routes.py:1))

6. Environment and Secrets
- Required: GEMINI_API_KEY, OPENAI_API_KEY, DATABASE_URL, CHATMOCK_URL
- Examples: [apps/api/.env.example](../../apps/api/.env.example:1), [services/chatmock/.env.example](../../services/chatmock/.env.example:1)
- Rate limits: Vet Gemini/OpenAI constraints; ensure client-side [rate-limiter.ts](../../apps/web/src/lib/rate-limiter.ts:1) active.

7. Quality and Test Summary
- Back-end tests: dashboards and comparison analytics covered (see [story-4.6.md](../stories/story-4.6.md:709)).
- Calibration engine: 28 tests passing (see [story-4.4.md](../stories/story-4.4.md:400)).
- Front-end tests: semantic search, embedding, and analytics (multiple under [apps/web/src/lib/__tests__/](../../apps/web/src/lib/__tests__/semantic-search-service.test.ts:1)).
- E2E status for Epic 4: [apps/api/tests/test_e2e_epic4.py](../../apps/api/tests/test_e2e_epic4.py:1)

8. Performance and NFRs
- Dashboard load target < 2s (Epic 4.6) per [story-4.6.md](../stories/story-4.6.md:31)
- IRT calc < 500ms (Epic 4.5) per [story-4.5.md](../stories/story-4.5.md:1877)
- API latency < 200ms typical (TS routes) per [Epic 4 Implementation Guide](../../../../epic-docs/epic-4-implementation-guide.md)

9. Known Risks and Mitigations
- Embedding dimensions mismatch (fixed at 1536) — verify indexes prior to deploy ([bmm-workflow-status.md](../bmm-workflow-status.md:283))
- External API limits — throttle and backoff (ChatMock/Gemini) [apps/web/src/lib/ai/gemini-client.ts](../../apps/web/src/lib/ai/gemini-client.ts:1)
- Multi-worktree DB drift — follow migration procedure in deployment plan §7

10. Smoke Test Checklist (Post-Deploy)
- Comprehension prompt end-to-end: generate → submit → get rubric evaluation (UI + API)
  - [apps/web/src/components/study/ComprehensionPromptDialog.tsx](../../apps/web/src/components/study/ComprehensionPromptDialog.tsx:1)
- Clinical scenario flow: multi-stage progression → evaluation → metrics
  - [apps/web/src/components/study/ClinicalCaseDialog.tsx](../../apps/web/src/components/study/ClinicalCaseDialog.tsx:1)
- Calibration signal: pre/post capture → dashboard correlation available
  - [apps/web/src/lib/confidence-calibrator.ts](../../apps/web/src/lib/confidence-calibrator.ts:1)
- Adaptive step: start session → two adjustments → optional early stop
  - [apps/web/src/lib/adaptive-session-orchestrator.ts](../../apps/web/src/lib/adaptive-session-orchestrator.ts:1)
- Analytics: dashboard loads; comparison endpoint responds
  - [apps/api/src/analytics/routes.py](../../apps/api/src/analytics/routes.py:1)

11. Rollback Plan (Summary)
- Revert to previous web/api/services release; restore DB snapshot; details in [epic4-deployment-plan.md](../deployments/epic4-deployment-plan.md:16)

12. Communications
- Stakeholder summary: “Epic 4 delivers validation of true understanding: comprehension, clinical reasoning, controlled failure, calibration, adaptive assessment, and analytics.”
- Publish changelog summarizing each story with user-facing highlights and support links to docs.

Appendix — Reference Index
- Workflow status: [bmm-workflow-status.md](../bmm-workflow-status.md:1)
- Python API analytics: [apps/api/src/analytics/models.py](../../apps/api/src/analytics/models.py:1), [routes.py](../../apps/api/src/analytics/routes.py:1)
- Validation calibrator: [apps/api/src/validation/calibrator.py](../../apps/api/src/validation/calibrator.py:1)
- Adaptive IRT: [apps/web/src/lib/adaptive/irt-engine.ts](../../apps/web/src/lib/adaptive/irt-engine.ts:1)
- Deployment plan: [epic4-deployment-plan.md](../deployments/epic4-deployment-plan.md:1)

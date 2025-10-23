# Epic 4 Debt Hardening (Personal Setup)

Purpose: eliminate revisit risk by adding lightweight guardrails and single-sources-of-truth that fit a solo environment.

1) Guardrails You Can Add Today (no code changes required)
- Lock embedding dimensions via env + preflight
  - Add `GEMINI_EMBEDDING_DIM=1536` to your local `.env` used by:
    - Embedding client [gemini-client.ts](../../apps/web/src/lib/ai/gemini-client.ts:1)
    - Search service [semantic-search-service.ts](../../apps/web/src/lib/semantic-search-service.ts:1)
  - Add the “Vector 1536” verification to your preflight step (already documented):
    - See [epic4-db-verification.md §6](./epic4-db-verification.md:1)
- Personal-only features default
  - Disable/skip peer benchmarking and cohort views by default:
    - Analytics routes [routes.py](../../apps/api/src/analytics/routes.py:1)
    - Calibration peer endpoints (toggle behind env flag)
- One‑click backup/restore alias (shell)
  - Add shell aliases for backup/restore from [epic4-db-verification.md](./epic4-db-verification.md:4) to your dotfiles so every deploy starts with a backup.

2) Single Source of Truth (SSOT) for critical constants
- Create a constants module and import everywhere:
  - Calibration thresholds and messages:
    - Current logic: [confidence-calibrator.ts](../../apps/web/src/lib/confidence-calibrator.ts:1), [calibrator.py](../../apps/api/src/validation/calibrator.py:1)
    - Move to `apps/web/src/lib/constants/calibration.ts` and mirror in Python `apps/api/src/validation/constants.py`
  - Adaptive difficulty steps (+15/−15, max 3 adjustments):
    - Current logic: [adaptive-session-orchestrator.ts](../../apps/web/src/lib/adaptive-session-orchestrator.ts:1)
    - Move to `apps/web/src/lib/constants/adaptive.ts`
  - IRT early‑stop intervals / confidence:
    - Current logic: [irt-engine.ts](../../apps/web/src/lib/adaptive/irt-engine.ts:1)
    - Move to `apps/web/src/lib/constants/irt.ts`
- Centralize model names/dimensions
  - Read model name and embedding dim only from env:
    - Client: [gemini-client.ts](../../apps/web/src/lib/ai/gemini-client.ts:1)
    - Service: [embedding-service.ts](../../apps/web/src/lib/embedding-service.ts:1)

3) Tiny Preflight Asserts (catch config drift at runtime)
- On app boot (first request):
  - DB vector dims check (1536) — keep SQL in [epic4-db-verification.md §6](./epic4-db-verification.md:6)
  - Env sanity: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GEMINI_EMBEDDING_DIM` set
  - Rate limiter enabled: [rate-limiter.ts](../../apps/web/src/lib/rate-limiter.ts:1)
  - Logger PII redaction on: [logger-pii-redaction.ts](../../apps/web/src/lib/logger-pii-redaction.ts:1)
- Fail fast with a single consolidated warning page if any assert fails (personal friendly).

4) Minimize Divergence (TS ↔ Python)
- Keep identical threshold values and formulas:
  - Confidence calibration: [confidence-calibrator.ts](../../apps/web/src/lib/confidence-calibrator.ts:1) == [calibrator.py](../../apps/api/src/validation/calibrator.py:1)
- Co‑locate acceptance criteria references in code headers pointing to:
  - 4.1: [story-4.1.md](../stories/story-4.1.md:21)
  - 4.4: [story-4.4.md](../stories/story-4.4.md:36)
  - 4.5: [story-4.5.md](../stories/story-4.5.md:30)

5) “Golden Path” Smoke Script (single command, personal)
- Script (Makefile or npm script) to run the 5 core checks from:
  - [epic4-pre-deploy-checklist.md §6](./epic4-pre-deploy-checklist.md:6)
- Output a single PASS/FAIL summary and pointers to failing step docs.

6) Feature Flags (personal defaults)
- Disable by default:
  - Peer comparison (4.4/4.6), predictive benchmarking cohorts
- Enable by default:
  - Calibration, comprehension/reasoning, adaptive, analytics dashboard core

7) Packaging and Pins
- Pin model names and versions in one place:
  - `GEMINI_MODEL=text-embedding-001`, `GEMINI_EMBEDDING_DIM=1536`
- Prefer `prisma migrate deploy` (documented) over `db push` in any multi‑worktree situation:
  - See [epic4-db-verification.md §7](./epic4-db-verification.md:7)

8) Minimal Observability (solo)
- Keep logs clean + PII redacted:
  - [logger.ts](../../apps/web/src/lib/logger.ts:1), [logger-pii-redaction.ts](../../apps/web/src/lib/logger-pii-redaction.ts:1)
- Add simple error counters (console summary) on:
  - Validation endpoints, Analytics endpoints: [routes.py](../../apps/api/src/analytics/routes.py:1)

9) “Done Means Done” Acceptance Checklist (no revisits)
- [ ] `GEMINI_EMBEDDING_DIM` in env and used across code
- [ ] Vector dims check passes in DB
- [ ] One constants file per domain (calibration/adaptive/irt) and both TS/Python read it
- [ ] Golden path smoke script exists and passes locally
- [ ] Peer/benchmark features off by default (personal)
- [ ] Release notes published: [epic4-release-notes.md](../releases/epic4-release-notes.md:1)

Appendix — Where to change things later (if needed)
- Embedding client: [gemini-client.ts](../../apps/web/src/lib/ai/gemini-client.ts:1)
- Search service: [semantic-search-service.ts](../../apps/web/src/lib/semantic-search-service.ts:1)
- IRT/adaptive: [irt-engine.ts](../../apps/web/src/lib/adaptive/irt-engine.ts:1), [adaptive-session-orchestrator.ts](../../apps/web/src/lib/adaptive/adaptive-engine.ts:1)
- Calibration: [confidence-calibrator.ts](../../apps/web/src/lib/confidence-calibrator.ts:1), [calibrator.py](../../apps/api/src/validation/calibrator.py:1)
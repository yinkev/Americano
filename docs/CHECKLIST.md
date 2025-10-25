---
title: Engineering Checklist — Americano
last_updated: 2025-10-25
owner: Kevy
status: active
---

# Engineering Checklist — Americano

Single place to see what’s done, what’s in progress, and what’s next. This mirrors the live plan used by the agent.

## Completed
- Adaptive schema: ValidationPrompt.objectiveId (required) + difficultyLevel (Int, default 50)
- FirstAidEdition: minimal, version-aware model
- DB sync flow: dev uses `prisma db push`; vector indexes applied via SQL
- Baseline migration: generated at `apps/web/prisma/migrations/<timestamp>_baseline/`
- Embeddings: gemini-embedding-001 with `outputDimensionality=1536` (+ runtime assert)
- Adaptive API routes typed and strict; question selection filters by objectiveId + difficulty range
- Knowledge Graph (strict):
  - search-suggestions.ts — pluralized models, local SuggestionType, strict green
  - conflict-detector.ts — fixed fetch and analysis path, strict green
- Recommendations analytics route: pluralized models and types
- ML tests: removed Prisma-Python runtime dependency; suite skipped during migration

## In Progress
- Strict TypeScript expansion: grow coverage module-by-module (KG, services)
- ML service: finalize SQLAlchemy repos and remove any residual Prisma-only paths

## Pending / Next
- Start/ops polish: faster double-click start, background mode + health-wait convenience
- CI guardrails: ensure no pnpm/framer-motion reintroduction; keep strict subset enforced
- Documentation polish: ADR for adaptive schema change; link to baseline migration instructions

## How to Run
- Start (foreground): `make up`
- Start (background): `make daemon && make wait-health`
- Health check: `make health`
- Fresh DB (new machine): `make migrate-deploy`

## Embedding Model Contract
- Provider: Gemini
- Model: `gemini-embedding-001`
- Dimension: 1536 (enforced)
- Failure policy: retry with backoff; permanent errors logged and skipped

## Notes
- This checklist is a convenience mirror; the source of truth for task status is the Plan panel and Git history.


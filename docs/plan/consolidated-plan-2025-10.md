---
title: "Consolidated Plan — Frontend + Docs + Tech Debt (Oct 2025)"
description: "Approved plan scaffold to integrate Next.js↔FastAPI, prune docs 40–60%, and tighten CI."
type: "Guide"
status: "Active"
owner: "Kevy"
review_cadence: "Per Change"
created_date: "2025-10-29T00:00:00-07:00"
last_updated: "2025-10-29T00:00:00-07:00"
---

# Consolidated Plan (Scaffold)

This stub captures the approved direction. Execution will proceed in staged PRs.

## Scope
- Frontend: App Router consolidation, typed client, query hooks, perf/a11y checks.
- Docs: IA rollout, moves per path-map.json, frontmatter normalization, link health CI.
- Tech Debt: error model unification, design system consolidation, fetch sprawl cleanup.

## Acceptance Criteria
- 40–60% active-doc reduction; 0 broken internal links; frontmatter compliant.
- Lighthouse ≥90 (desktop) on `/dashboard` and `/analytics`; axe checks pass.
- CI gates: typegen drift, lint, link check, frontmatter.

## Notes
See: `docs/_migration/path-map.json` and `docs/_migration/path-map.agent.json` for proposed moves.


---
title: "ADR-006: Standardize on motion.dev; Deprecate framer-motion"
description: "Consolidate all animations on motion.dev ('motion' package) and remove Framer Motion to reduce bundle size, API drift, and align with design rules."
type: "Architecture"
status: "Accepted"
version: "1.0"
owner: "Winston (Architect)"
dri_backup: "Kevy"
contributors: ["Frontend Team"]
review_cadence: "Per Epic"
created_date: "2025-10-24T10:00:00-07:00"
last_updated: "2025-10-24T10:00:00-07:00"
last_reviewed: "2025-10-24T10:00:00-07:00"
depends_on:
  - apps/web/src/app/layout.tsx
  - apps/web/src/components
affects:
  - apps/web/package.json
  - apps/web/src/components/study/cognitive-load-indicator.tsx
related_adrs:
  - docs/architecture/ADR-004-oklch-glassmorphism.md
audience:
  - architects
  - experienced-devs
technical_level: "Intermediate"
tags: ["ui", "animation", "motion", "framer-motion", "performance"]
search_priority: "high"
lifecycle:
  stage: "Active"
---

Context
- The repo had both `motion` (motion.dev) and `framer-motion` installed/used, increasing bundle size and cognitive load.
- Project rules already prefer motion.dev and prohibit gradients; consolidating animations aligns with this direction.

Decision Drivers
- Reduce bundle size and dependency surface
- Consistent API and docs
- Simpler developer experience and future-proofing

Options Considered
- Keep both libraries (rejected)
- Standardize on framer-motion (rejected)
- Standardize on motion.dev (accepted)

Decision
- Use motion.dev (`motion` package) exclusively for React/UI animations.
- Import from `motion/react`. Use `<AnimatePresence mode="wait">` instead of deprecated `exitBeforeEnter` patterns.

Consequences
+ Simpler code and docs; fewer security updates
+ Smaller bundle and faster builds
- One-time migration of remaining `framer-motion` imports

Implementation Plan
1. Remove `framer-motion` from `apps/web/package.json`.
2. Replace remaining imports with `motion/react` and verify exit/layout animations.
3. Update AGENTS.md to codify this requirement.
4. Add lint check in CI later to prevent reintroduction (follow-up).

Validation Checklist
- [x] All imports reference `motion/react`
- [x] `framer-motion` removed from dependencies
- [x] UI renders and transitions as expected


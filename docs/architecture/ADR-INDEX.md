---
title: "Architecture Decision Records - Index"
description: "Master index of all Architecture Decision Records (ADRs) documenting key technical decisions across Epic 3, 4, and 5 implementations"
type: "Architecture"
status: "Active"
version: "1.0"

owner: "Winston (Architect)"
dri_backup: "Kevy"
contributors: ["Technical Team", "Epic Leads"]
review_cadence: "Per Epic"

created_date: "2025-10-23T12:15:00-07:00"
last_updated: "2025-10-23T12:15:00-07:00"
last_reviewed: "2025-10-23T12:15:00-07:00"
next_review_due: "2026-01-23"

depends_on:
  - docs/solution-architecture.md
affects:
  - All technical implementation decisions
related_adrs: []

audience:
  - architects
  - experienced-devs
  - technical-leads
technical_level: "Advanced"
tags: ["architecture", "adr", "decisions", "technical-choices"]
keywords: ["ADR", "architecture decision records", "technical decisions", "design choices"]
search_priority: "critical"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null

changelog:
  - version: "1.0"
    date: "2025-10-23"
    author: "Winston (Architect)"
    changes:
      - "Initial ADR index created"
      - "5 ADRs documenting Epic 3/4/5 decisions"
---

# Architecture Decision Records - Index

## Overview

This index catalogs all Architecture Decision Records (ADRs) for the Americano adaptive learning platform. ADRs document significant technical decisions made during development, providing context, alternatives considered, and rationale for choices.

**ADR Template:** [adr-template.md](./adr-template.md)

---

## Active ADRs

### ADR-001: Hybrid TypeScript + Python Architecture
**Status:** ✅ Accepted (2025-10-16)
**Epic:** Epic 4 - Understanding Validation Engine
**File:** [ADR-001-hybrid-typescript-python.md](./ADR-001-hybrid-typescript-python.md)

**Summary:**
Chose hybrid architecture with TypeScript (Next.js) for UI/UX and Python (FastAPI) for research-grade ML/statistical algorithms.

**Key Decision:**
- TypeScript: All user-facing features, API routes, database operations
- Python: AI evaluation, IRT algorithms, ML pattern detection

**Impact:**
- 98.5% API performance improvement (21.2s → 180ms)
- Research-grade quality (scipy, scikit-learn)
- Zero technical debt

---

### ADR-002: Multi-Worktree Development Strategy (DEPRECATED)
**Status:** ⚠️ Deprecated (2025-10-21)
**Epic:** Epic 3, 4, 5 (Parallel Development)
**File:** [ADR-002-multi-worktree-deprecated.md](./ADR-002-multi-worktree-deprecated.md)

**Summary:**
Used Git worktrees for parallel epic development with shared PostgreSQL database.

**Key Decision:**
- Separate worktrees: Americano-epic3, Americano-epic4, Americano-epic5
- Shared database: postgresql://localhost:5432/americano
- Timestamp-based migration ownership

**Deprecation Reason:**
All epics merged to main branch (Oct 16-21, 2025). Worktrees no longer active.

**Superseded By:**
Standard single-branch workflow on main

---

### ADR-003: Two-Tier Caching Strategy
**Status:** ✅ Accepted (2025-10-20)
**Epic:** Epic 5 - Behavioral Twin Engine
**File:** [ADR-003-two-tier-caching.md](./ADR-003-two-tier-caching.md)

**Summary:**
Implemented two-tier caching with Redis L1 (55-70% hit) and in-memory L2 (10-15% hit) for 65-85% total cache hit rate.

**Key Decision:**
- L1 Cache: Redis (Upstash serverless)
- L2 Cache: In-memory (process-level)
- TTLs: 5-15 minutes based on data volatility

**Impact:**
- 98.5% API performance improvement (21.2s → 180ms)
- 65-85% cache hit rate achieved
- Sub-200ms P95 response times

---

### ADR-004: OKLCH Color System + Glassmorphism
**Status:** ✅ Accepted (2025-10-20)
**Epic:** Epic 5 - Behavioral Twin Engine
**File:** [ADR-004-oklch-glassmorphism.md](./ADR-004-oklch-glassmorphism.md)

**Summary:**
Adopted OKLCH color space (100% of colors) and glassmorphism design language (no gradients) for design system.

**Key Decision:**
- OKLCH format for all colors (40+ colors defined)
- Glassmorphism: 80% opacity, 12px blur, no gradients
- motion.dev for animations (deprecated Framer Motion)

**Impact:**
- WCAG 2.1 AAA accessibility compliance
- 15.9:1 contrast ratio (normal text)
- Better performance (no gradient calculations)
- Perceptual color uniformity

---

### ADR-005: Gemini Embeddings 1536-dim + pgvector
**Status:** ✅ Accepted (2025-10-16)
**Epic:** Epic 3 - Adaptive Content Delivery
**File:** [ADR-005-gemini-embeddings-1536.md](./ADR-005-gemini-embeddings-1536.md)

**Summary:**
Selected Google Gemini text-embedding-001 at 1536 dimensions for semantic search with pgvector.

**Key Decision:**
- Model: text-embedding-001 (Gemini)
- Dimensions: 1536 (middle-ground quality)
- Index: IVFFlat with 100 lists

**Impact:**
- Fits pgvector 2000-dim limit with headroom
- Balanced quality vs. performance
- Cost-effective ($0.025 per 1M tokens)

---

## ADR Statistics

**Total ADRs:** 5
**Active:** 4
**Deprecated:** 1
**Coverage by Epic:**
- Epic 3: 1 ADR (ADR-005)
- Epic 4: 1 ADR (ADR-001)
- Epic 5: 2 ADRs (ADR-003, ADR-004)
- Cross-Epic: 1 ADR (ADR-002 - deprecated)

---

## How to Create a New ADR

1. **Copy the template:**
   ```bash
   cp docs/architecture/adr-template.md docs/architecture/ADR-XXX-short-title.md
   ```

2. **Assign ADR number:**
   - Next available: ADR-006
   - Use sequential numbering

3. **Fill in all sections:**
   - Context (problem statement)
   - Decision Drivers (factors)
   - Considered Options (3+ alternatives)
   - Decision Outcome (chosen option + rationale)
   - Consequences (positive/negative)
   - Implementation Plan
   - Validation checklist

4. **Add frontmatter:**
   - Use template from docs/frontmatter-standard.md
   - Set type: "Architecture"
   - Set owner (usually architect or epic lead)

5. **Update this index:**
   - Add entry under "Active ADRs"
   - Update statistics
   - Cross-link from solution-architecture.md

6. **Get approval:**
   - User (Kevy) approval required
   - Technical lead review
   - Update status to "Accepted"

---

## ADR Lifecycle

```
Proposed → Accepted → Implemented → [Superseded/Deprecated]
           ↓
        Rejected (document why)
```

**Status Definitions:**
- **Proposed:** Under consideration, not yet approved
- **Accepted:** Approved for implementation
- **Rejected:** Considered but not chosen (document alternatives)
- **Superseded:** Replaced by newer ADR
- **Deprecated:** No longer applicable (document reason)

---

## References

**Related Documentation:**
- [Solution Architecture](../solution-architecture.md) - Overall system design
- [ADR Template](./adr-template.md) - Template for new ADRs
- [CLAUDE.md](/CLAUDE.md) - Technology stack decisions

**External Resources:**
- [ADR GitHub Organization](https://adr.github.io/) - ADR best practices
- [Michael Nygard's ADR Post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Original ADR concept

---

**Last Updated:** 2025-10-23T12:15:00-07:00
**Next Review:** After each epic completion or significant architectural change

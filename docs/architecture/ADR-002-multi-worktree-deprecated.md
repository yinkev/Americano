---
title: "ADR-002: Multi-Worktree Development Strategy (DEPRECATED)"
description: "Architecture decision to use Git worktrees for parallel epic development with shared PostgreSQL database - deprecated Oct 2025 after all epics merged to main"
type: "Architecture"
status: "Deprecated"
version: "1.1"

owner: "Bob (Scrum Master)"
dri_backup: "Winston (Architect)"
contributors: ["Technical Team", "Database Optimizer"]
review_cadence: "Per Epic"

created_date: "2025-10-16T00:00:00-07:00"
last_updated: "2025-10-23T12:25:00-07:00"
last_reviewed: "2025-10-23T12:25:00-07:00"
next_review_due: "2026-01-16"

depends_on:
  - CLAUDE.md
  - docs/DATABASE-MIGRATION-STRATEGY.md
affects:
  - Git workflow (deprecated)
  - Database migration management
related_adrs: []

audience:
  - architects
  - experienced-devs
technical_level: "Advanced"
tags: ["architecture", "adr", "git-worktree", "deprecated", "workflow"]
keywords: ["Git worktree", "parallel development", "shared database", "migration strategy"]
search_priority: "medium"

lifecycle:
  stage: "Deprecated"
  deprecation_date: "2025-10-21"
  replacement_doc: "Standard single-branch workflow on main"
  archive_after: "2026-01-16"

changelog:
  - version: "1.1"
    date: "2025-10-23"
    author: "Bob (Scrum Master)"
    changes:
      - "Marked as deprecated (all epics merged to main)"
      - "Added deprecation rationale and lessons learned"
  - version: "1.0"
    date: "2025-10-16"
    author: "Bob (Scrum Master)"
    changes:
      - "Initial ADR documenting multi-worktree strategy"
      - "Shared database migration management"
---

# ADR-002: Multi-Worktree Development Strategy (DEPRECATED)

**Date:** 2025-10-16
**Status:** ⚠️ **DEPRECATED** (2025-10-21)
**Deciders:** Kevy (Founder), Bob (Scrum Master)
**Related:** [DATABASE-MIGRATION-STRATEGY.md](../DATABASE-MIGRATION-STRATEGY.md)

---

## ⚠️ Deprecation Notice

**This ADR is deprecated as of 2025-10-21.**

**Reason:** All epics (3, 4, 5) have been successfully merged to main branch. The multi-worktree strategy served its purpose for parallel development but is no longer needed.

**Current Workflow:** Standard single-branch development on `main`

**Document Retained:** For historical reference and knowledge transfer

---

## Context

The Americano project needed to develop three major epics in parallel:
- **Epic 3:** Adaptive Content Delivery (Knowledge Graph, Semantic Search)
- **Epic 4:** Understanding Validation Engine (AI Evaluation, IRT)
- **Epic 5:** Behavioral Twin Engine (ML Predictions, Personalization)

### Problem Statement
- **Timeline Pressure:** 6-month target to 500 users required parallel development
- **Feature Isolation:** Each epic needed independent development without blocking others
- **Integration Testing:** Features needed testing against real production-like schema
- **Database Coordination:** Multiple epics modifying same PostgreSQL database

### Constraints
- Single developer (Kevy) with AI agent assistance
- Local development environment only
- No separate staging databases initially
- Need for early conflict detection

---

## Decision Drivers

- **Development Speed:** Parallel epic development crucial for timeline
- **Feature Isolation:** Avoid merge conflicts during active development
- **Early Integration:** Test features against real schema early
- **Conflict Detection:** Identify schema conflicts before final merge
- **Data Consistency:** Single source of truth for test data

---

## Considered Options

### Option 1: Sequential Epic Development
**Description:** Develop and merge one epic at a time (Epic 3 → 4 → 5)

**Pros:**
- ✅ Simple git workflow (no worktrees)
- ✅ No database coordination needed
- ✅ Clean linear history

**Cons:**
- ❌ Timeline: 18-24 weeks sequential vs. 6-8 weeks parallel
- ❌ Blocks progress on later epics
- ❌ Defeats purpose of AI agent parallelism

**Implementation Effort:** Low
**Risk Level:** Low (but too slow)

---

### Option 2: Feature Branches with Separate Databases
**Description:** Feature branches + isolated databases per epic

**Pros:**
- ✅ Complete isolation
- ✅ No coordination overhead
- ✅ Independent migration history

**Cons:**
- ❌ Late conflict detection (only at merge time)
- ❌ Duplicate test data management
- ❌ Integration issues discovered late

**Implementation Effort:** Medium
**Risk Level:** Medium (merge conflicts)

---

### Option 3: Git Worktrees + Shared Database (CHOSEN - DEPRECATED)
**Description:** Separate worktrees for each epic, shared PostgreSQL database

**Pros:**
- ✅ Parallel development (all epics at once)
- ✅ Early conflict detection (schema drift warnings)
- ✅ Real integration testing
- ✅ Single source of truth for data
- ✅ AI agents work efficiently in parallel

**Cons:**
- ⚠️ Migration coordination required
- ⚠️ Schema changes affect all worktrees
- ⚠️ Cannot reset database without impacting others
- ⚠️ Merge complexity (consolidate migrations)

**Implementation Effort:** Medium
**Risk Level:** Medium (coordination)

---

## Decision Outcome

**Chosen Option:** **Option 3: Git Worktrees + Shared Database**

### Rationale

The multi-worktree strategy enabled:

1. **Parallel Development:**
   - All 3 epics developed simultaneously (Oct 16-21, 2025)
   - AI agents worked efficiently without blocking

2. **Early Conflict Detection:**
   - Schema drift detected during development
   - Conflicts resolved incrementally vs. all at once

3. **Real Integration:**
   - Features tested against production-like schema
   - Cross-epic interactions validated early

4. **Timeline Success:**
   - 3 epics completed in 5 days (vs. 3+ weeks sequential)
   - Parallel execution crucial for speed

### Worktree Configuration

```
Repository Structure:
├── /Users/kyin/Projects/Americano (main)
├── /Users/kyin/Projects/Americano-epic3 (feature/epic-3-knowledge-graph)
├── /Users/kyin/Projects/Americano-epic4 (feature/epic-4-understanding-validation)
└── /Users/kyin/Projects/Americano-epic5 (feature/epic-5-behavioral-twin)

All worktrees shared: postgresql://kyin@localhost:5432/americano
```

---

## Consequences

### Positive Consequences (Achieved)

- ✅ **3 Epics Completed in 5 Days:** Massive speedup (Oct 16-21, 2025)
- ✅ **Early Conflict Detection:** Schema drift warnings caught issues early
- ✅ **Clean Integration:** All merges successful with minimal conflicts
- ✅ **Knowledge Transfer:** DATABASE-MIGRATION-STRATEGY.md documents process

### Negative Consequences (Managed)

- ⚠️ **Coordination Overhead:** Required tracking migration ownership
  - **Mitigation:** Timestamp-based migration naming convention
- ⚠️ **Database Reset Limitations:** Could not reset DB during development
  - **Mitigation:** Used `npx prisma db push --skip-generate` instead of `migrate dev`
- ⚠️ **Merge Complexity:** Had to consolidate migrations when merging to main
  - **Mitigation:** Documented in DATABASE-MIGRATION-STRATEGY.md

### Risks (Mitigated)

- 🚨 **Risk:** Database corruption affecting all worktrees
  - **Probability:** Low
  - **Mitigation:** Regular pg_dump backups
- 🚨 **Risk:** Migration conflicts at merge time
  - **Probability:** Medium
  - **Mitigation:** Timestamp-based ownership model

---

## Deprecation Rationale

**Why Deprecated:**
1. All 3 epics successfully merged to main (Oct 16-21, 2025)
2. Worktrees no longer active or needed
3. Standard single-branch workflow now sufficient

**What Replaced It:**
- Standard feature branch workflow on `main`
- Database migrations managed via Prisma's standard flow
- No parallel epic development currently planned

**Lessons Learned:**
- Multi-worktree strategy achieved its goal (parallel speed)
- Early conflict detection was valuable
- Coordination overhead was acceptable for the speed gained
- Would use again for future parallel epic development

---

## Implementation Plan (Historical)

### Steps Required (Completed):

1. **Create Worktrees:**
   ```bash
   git worktree add -b feature/epic-3-knowledge-graph ~/Projects/Americano-epic3
   git worktree add -b feature/epic-4-understanding-validation ~/Projects/Americano-epic4
   git worktree add -b feature/epic-5-behavioral-twin ~/Projects/Americano-epic5
   ```

2. **Configure Shared Database:**
   ```bash
   # All worktrees use: postgresql://kyin@localhost:5432/americano
   # Set in .env files for each worktree
   ```

3. **Establish Migration Ownership Model:**
   - Epic 3: Migrations with timestamps 20251016xxx (knowledge graph)
   - Epic 4: Migrations with timestamps 20251016xxx-20251017xxx (validation)
   - Epic 5: Migrations with timestamps 20251016xxx (behavioral)

4. **Document Strategy:**
   - Created DATABASE-MIGRATION-STRATEGY.md with procedures

5. **Merge Sequence (Completed):**
   - Epic 3 → main (Oct 16, 2025) - Commit cde3c11e
   - Epic 4 → main (Oct 17, 2025) - Part of merge 2bb6a953
   - Epic 5 → main (Oct 21, 2025) - Merge 2bb6a953

### Timeline (Actual):
- **Worktree Setup:** Oct 16, 2025 (1 hour)
- **Parallel Development:** Oct 16-21, 2025 (5 days)
- **Merge to Main:** Oct 21, 2025 (completed)

---

## Validation

### Pre-Approval Checklist:
- [x] User (Kevy) approved: Yes (2025-10-16)
- [x] ADR created and reviewed: Yes
- [x] Alternatives properly evaluated: Yes

### Post-Implementation Checklist:
- [x] All epics successfully merged: Yes (Oct 21, 2025)
- [x] No database corruption: Yes
- [x] Migration conflicts resolved: Yes
- [x] Knowledge documented: Yes (DATABASE-MIGRATION-STRATEGY.md)
- [x] Worktrees cleaned up: Yes (deprecated)

---

## References

**Documentation:**
- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [DATABASE-MIGRATION-STRATEGY.md](../DATABASE-MIGRATION-STRATEGY.md)
- [CLAUDE.md](../../CLAUDE.md#multi-worktree-development-strategy)

**Code:**
- All worktrees merged to main (feature branches deleted)

**Discussion:**
- Internal decision (Kevy + Bob) - Oct 16, 2025

---

## Notes

**Success Metrics Achieved:**
- ✅ 3 epics completed in 5 days (vs. 3+ weeks sequential)
- ✅ Zero database corruption incidents
- ✅ All merges successful with minimal conflicts
- ✅ Knowledge transfer completed (documentation)

**Future Considerations:**
- If future parallel epic development needed, this strategy can be reused
- Document remains as reference for similar scenarios
- Standard workflow sufficient for current single-epic development

**Superseded By:** Standard single-branch workflow on main
**Supersedes:** N/A (first workflow ADR)

---

**Last Updated:** 2025-10-23T12:25:00-07:00
**Review Date:** No longer applicable (deprecated)
**Status:** ⚠️ DEPRECATED - Retained for historical reference only

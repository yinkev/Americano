---
title: "Deprecated Documentation Archive"
description: "Archive of obsolete documentation preserved for historical reference"
type: "Archive"
status: "Active"
version: "1.0"

owner: "Kevy"
review_cadence: "Annually"

created_date: "2025-10-23T18:05:00-07:00"
last_updated: "2025-10-23T18:05:00-07:00"
last_reviewed: "2025-10-23T18:05:00-07:00"
next_review_due: "2026-10-23"

audience:
  - developers
  - historians
technical_level: "Intermediate"
tags: ["archive", "deprecated", "historical"]
keywords: ["deprecated", "obsolete", "archive"]
search_priority: "low"

lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null
---

# Deprecated Documentation Archive

This directory contains documentation that is **no longer actively used** but preserved for historical reference and future learning.

---

## Purpose

Documents are archived here when:
1. **Workflows/processes are discontinued** (e.g., multi-worktree development)
2. **Technology decisions are superseded** (e.g., replaced by new approaches)
3. **Status tracking documents become outdated** (e.g., workflow status from completed epics)
4. **Content is valuable for reference** but no longer guides current development

---

## Archived Documents

### Multi-Worktree Development (Deprecated Oct 2025)

**Context:** During Epic 3, 4, and 5 development (October 2025), parallel development used git worktrees.

**Archived Files:**
1. **[MULTI-WORKTREE-MERGE-PLAN.md](./MULTI-WORKTREE-MERGE-PLAN.md)**
   - **Date Archived:** 2025-10-23
   - **Deprecation Date:** 2025-10-21
   - **Reason:** All epics merged to main; multi-worktree workflow no longer needed
   - **Replacement:** Standard single-branch development on `main`

2. **[WORKTREE-DATABASE-STRATEGY.md](./WORKTREE-DATABASE-STRATEGY.md)**
   - **Date Archived:** 2025-10-23
   - **Deprecation Date:** 2025-10-21
   - **Reason:** Related to multi-worktree workflow (now deprecated)
   - **Replacement:** [Development Environment Setup](../development-environment-setup.md)

3. **[bmm-workflow-status.md](./bmm-workflow-status.md)**
   - **Date Archived:** 2025-10-23
   - **Deprecation Date:** 2025-10-20
   - **Reason:** Status tracking document from Epic 1-5; all epics now complete
   - **Replacement:** See epic completion reports in [docs/epics/](../epics/)

---

## Why Preserve These Documents?

**Historical Value:**
- Understanding past development approaches
- Learning from decisions that worked (and didn't)
- Reference for similar challenges in the future

**Lessons Learned:**
- Multi-worktree approach successfully enabled parallel epic development
- Shared database coordination required careful migration management
- Sequential merge strategy (Epic 3 → 4 → 5) worked well

**When You Might Need These:**
- Planning another large-scale parallel development effort
- Understanding why current processes evolved
- Debugging issues related to historical code

---

## Current Practices

**For current development workflows, see:**
- [Development Environment Setup](../development-environment-setup.md) - Local setup guide
- [Database Migration Strategy](../DATABASE-MIGRATION-STRATEGY.md) - Current migration approach
- [Git Workflow Guide](../technical/git-workflow-guide.md) - Branching and PR strategy

**For epic status tracking:**
- [Epic 3 Completion Report](../epics/epic-3/epic-3-completion-report.md)
- [Epic 4 Completion Report](../epics/epic-4/EPIC-4-COMPLETION-REPORT.md)
- [Epic 5 Completion Report](../epics/epic-5/EPIC-5-MERGE-COMPLETION-FINAL.md)

---

## Archive Policy

**Documents are archived when:**
1. ✅ Status: "Deprecated" added to frontmatter
2. ✅ Deprecation date documented
3. ✅ Replacement documentation identified
4. ✅ Moved to `docs/deprecated/`
5. ✅ Links updated in index.md

**Documents are NOT deleted because:**
- Historical context is valuable
- Future teams may face similar challenges
- Lessons learned should be preserved
- Git history alone doesn't capture decision context

---

## Questions?

If you need to understand why something was deprecated or find current replacement documentation:
1. Check the frontmatter of archived documents for `deprecation_date` and `replacement_doc`
2. See [docs/index.md](../index.md) for current documentation
3. Review [Architecture Decision Records](../architecture/ADR-INDEX.md) for current architectural choices

---

**Archive Established:** 2025-10-23
**Total Archived Documents:** 3
**Status:** Active (documents preserved for reference)

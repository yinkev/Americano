# Multi-Worktree Merge Plan

**Created:** 2025-10-16
**Status:** Active
**Context:** Epic 3, 4, and 5 developed in parallel using git worktrees with separate databases

---

## Current State

### Active Worktrees
```bash
/Users/kyin/Projects/Americano         [main] (9edf263c)
/Users/kyin/Projects/Americano-epic3   [feature/epic-3-knowledge-graph] (7ccf0451) - 7 commits ahead
/Users/kyin/Projects/Americano-epic4   [feature/epic-4-understanding-validation] (e98a2124) - 2 commits ahead
/Users/kyin/Projects/Americano-epic5   [feature/epic-5-behavioral-twin] (a619dd1c) - 3 commits ahead
```

### Database Setup
- **Epic 3:** Uses `americano` (shared with Epic 5)
- **Epic 4:** Uses `americano_epic4` (isolated)
- **Epic 5:** Uses `americano` (shared with Epic 3)

### Schema Modifications
All 3 epics have modified `apps/web/prisma/schema.prisma`:
- **Epic 3:** Added Knowledge Graph models (Concepts, ConceptRelationships, ContentChunks, Sources, etc.)
- **Epic 4:** Added Understanding Validation models (ValidationPrompt, ValidationResponse, ClinicalScenario, etc.)
- **Epic 5:** Added Behavioral Twin models (BehavioralPatterns, LearningInsights, etc.)

---

## Merge Strategy: Sequential Integration

### Recommended Order
1. **Epic 3 first** (most commits, foundational knowledge graph)
2. **Epic 4 second** (validation builds on knowledge graph)
3. **Epic 5 last** (behavioral patterns use validation data)

### Rationale
- Epic 3 provides semantic search foundation (used by Epic 4 scenarios)
- Epic 4 validation data feeds Epic 5 behavioral analysis
- Sequential merges allow testing integration at each step

---

## Merge Process (Per Epic)

### Phase 1: Pre-Merge Preparation

**Checklist before starting merge:**
- [ ] All Epic stories complete and tested
- [ ] TypeScript compilation: 0 errors
- [ ] All tests passing
- [ ] Database migrations tested in epic worktree
- [ ] Documentation updated (README, CLAUDE.md, etc.)

**Commands:**
```bash
cd /Users/kyin/Projects/Americano-epic{N}

# Verify clean state
git status
npm run type-check
npm run test

# Record current migration count
ls apps/web/prisma/migrations/ | wc -l
```

---

### Phase 2: Merge Epic to Main

#### Step 1: Update Main Branch
```bash
cd /Users/kyin/Projects/Americano
git checkout main
git pull origin main
```

#### Step 2: Merge Epic Branch (Expect Conflicts)
```bash
git merge feature/epic-{N}-{name}

# Expected output:
# Auto-merging apps/web/prisma/schema.prisma
# CONFLICT (content): Merge conflict in apps/web/prisma/schema.prisma
# Automatic merge failed; fix conflicts and then commit the result.
```

#### Step 3: Resolve Schema Conflicts

**Open `apps/web/prisma/schema.prisma` in editor:**

```prisma
// Models from main (or previously merged epic)
model ExistingModel {
  id String @id
}

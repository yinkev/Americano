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
<<<<<<< HEAD
// Models from main (or previously merged epic)
model ExistingModel {
  id String @id
}
=======
// Models from current epic
model NewEpicModel {
  id String @id
}
>>>>>>> feature/epic-N
```

**Resolution Strategy:**
1. **Keep ALL models** (conflicts are additive, not overlapping)
2. **Remove conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)
3. **Organize models by epic** (add comments):
   ```prisma
   // ============================================================================
   // Epic 3: Knowledge Graph Models
   // ============================================================================
   model Concept { ... }
   model ConceptRelationship { ... }

   // ============================================================================
   // Epic 4: Understanding Validation Models
   // ============================================================================
   model ValidationPrompt { ... }
   model ClinicalScenario { ... }
   ```
4. **Check for enum conflicts** (if two epics added same enum name)
5. **Save and format:**
   ```bash
   npx prisma format
   ```

#### Step 4: Regenerate Epic Migration

**Delete old epic migrations** (they're based on old main):
```bash
# Find epic-specific migrations
ls -la apps/web/prisma/migrations/ | grep "202510"

# Delete migrations created in epic branch
rm -rf apps/web/prisma/migrations/20251016*  # Epic 4 example
```

**Create new migration on current main:**
```bash
# This migration only adds epic's models (previous epics already applied)
npx prisma migrate dev --name epic_{N}_{epic_name}_merge

# Example for Epic 4:
# npx prisma migrate dev --name epic_4_understanding_validation_merge
```

**What this does:**
- Compares current schema.prisma to database state
- Generates migration for ONLY the new epic's models
- Previous epics' models already exist in DB (no-op)

#### Step 5: Test Combined Schema

```bash
# Regenerate Prisma client
npx prisma generate

# Run TypeScript type check
npm run type-check

# Expected: 0 errors (all types valid)

# Run tests
npm run test

# Expected: All tests pass
```

#### Step 6: Commit Merge

```bash
git add apps/web/prisma/schema.prisma
git add apps/web/prisma/migrations/

git commit -m "Merge Epic {N}: {Epic Name}

Schema changes:
- Added {N} new models for {epic functionality}
- Added {M} new enums
- Resolved schema conflicts with additive merge

Migration:
- Regenerated migration on top of main+previous epics
- Migration ID: {migration_timestamp}

Testing:
- TypeScript compilation: ✅ 0 errors
- Test suite: ✅ All passing
- Database migration: ✅ Applied successfully

Epic commit range: {start_commit}..{end_commit}
Stories completed: {list of story IDs}
"

# Push to main
git push origin main
```

---

### Phase 3: Update Remaining Epic Branches

**After Epic N merges, update remaining epics:**

```bash
# Example: After Epic 3 merges, update Epic 4 and Epic 5

# Epic 4
cd /Users/kyin/Projects/Americano-epic4
git checkout feature/epic-4-understanding-validation
git merge main  # Bring in Epic 3 changes

# Resolve any conflicts (usually minimal - code changes, not schema)
# Epic 4 schema is isolated in americano_epic4, so no schema conflicts

git commit -m "Merge main (Epic 3) into Epic 4"
git push origin feature/epic-4-understanding-validation

# Epic 5
cd /Users/kyin/Projects/Americano-epic5
git checkout feature/epic-5-behavioral-twin
git merge main  # Bring in Epic 3 changes

# Resolve conflicts (Epic 5 shares DB with Epic 3, may have schema drift)
git commit -m "Merge main (Epic 3) into Epic 5"
git push origin feature/epic-5-behavioral-twin
```

---

## Detailed Merge Sequence

### Merge 1: Epic 3 (Knowledge Graph)

**Pre-merge checklist:**
- [ ] Stories 3.1, 3.2, 3.3+ complete
- [ ] Semantic search tested with vector embeddings
- [ ] TypeScript: 0 errors
- [ ] Database: Uses shared `americano`

**Merge commands:**
```bash
cd /Users/kyin/Projects/Americano
git checkout main
git pull origin main
git merge feature/epic-3-knowledge-graph

# Expected conflicts:
# - apps/web/prisma/schema.prisma (ONLY Epic 3 models vs main baseline)

# Resolve schema (accept all Epic 3 models)
code apps/web/prisma/schema.prisma  # Or use your editor

# No migration regeneration needed (Epic 3 is first merge)
npx prisma migrate dev --name epic_3_knowledge_graph_merge

# Test
npx prisma generate
npm run type-check
npm run test

# Commit
git add .
git commit -m "Merge Epic 3: Knowledge Graph"
git push origin main
```

**Update other epics:**
```bash
# Epic 4
cd /Users/kyin/Projects/Americano-epic4
git merge main  # No conflicts expected (separate DB)

# Epic 5
cd /Users/kyin/Projects/Americano-epic5
git merge main  # May have conflicts (shares DB with Epic 3)
```

---

### Merge 2: Epic 4 (Understanding Validation)

**Pre-merge checklist:**
- [ ] Stories 4.1, 4.2, 4.3+ complete
- [ ] Python FastAPI service tested
- [ ] TypeScript: 0 errors
- [ ] Database: Uses isolated `americano_epic4`
- [ ] Main has Epic 3 merged ✅

**Merge commands:**
```bash
cd /Users/kyin/Projects/Americano
git checkout main
git pull origin main  # Get latest (with Epic 3)
git merge feature/epic-4-understanding-validation

# Expected conflicts:
# - apps/web/prisma/schema.prisma (Epic 4 models + Epic 3 models from main)

# Resolve schema (combine Epic 3 + Epic 4 models)
code apps/web/prisma/schema.prisma

# Delete old Epic 4 migrations (based on pre-Epic-3 main)
rm -rf apps/web/prisma/migrations/202510*_epic4*

# Regenerate migration (only Epic 4 models, Epic 3 already in DB)
npx prisma migrate dev --name epic_4_understanding_validation_merge

# Test
npx prisma generate
npm run type-check
npm run test

# Test Python service with combined schema
cd apps/api
pytest

# Commit
cd /Users/kyin/Projects/Americano
git add .
git commit -m "Merge Epic 4: Understanding Validation Engine"
git push origin main
```

**Update Epic 5:**
```bash
cd /Users/kyin/Projects/Americano-epic5
git merge main  # Bring in Epic 3 + Epic 4
# Resolve conflicts
```

---

### Merge 3: Epic 5 (Behavioral Twin)

**Pre-merge checklist:**
- [ ] Stories 5.1, 5.2, 5.3+ complete
- [ ] ML service tested
- [ ] TypeScript: 0 errors
- [ ] Database: Uses shared `americano`
- [ ] Main has Epic 3 + Epic 4 merged ✅

**Merge commands:**
```bash
cd /Users/kyin/Projects/Americano
git checkout main
git pull origin main  # Get latest (with Epic 3 + Epic 4)
git merge feature/epic-5-behavioral-twin

# Expected conflicts:
# - apps/web/prisma/schema.prisma (Epic 5 models + Epic 3/4 models from main)
# - Epic 5 may have Epic 3 models in branch (shared DB) - need to remove duplicates

# Resolve schema (combine Epic 3 + Epic 4 + Epic 5 models, remove duplicates)
code apps/web/prisma/schema.prisma

# Delete old Epic 5 migrations
rm -rf apps/web/prisma/migrations/*epic5*

# Regenerate migration (only Epic 5 models, Epic 3/4 already in DB)
npx prisma migrate dev --name epic_5_behavioral_twin_merge

# Test
npx prisma generate
npm run type-check
npm run test

# Test ML service
cd apps/ml-service
pytest

# Commit
cd /Users/kyin/Projects/Americano
git add .
git commit -m "Merge Epic 5: Behavioral Twin Engine"
git push origin main
```

---

## Conflict Resolution Patterns

### Pattern 1: Additive Model Conflicts (Common)

**Scenario:** Epic 3 added `model Concept`, Epic 4 added `model ValidationPrompt`

**Conflict in schema.prisma:**
```prisma
<<<<<<< HEAD
model Concept {
  id String @id
  name String
}
=======
model ValidationPrompt {
  id String @id
  promptText String
}
>>>>>>> feature/epic-4
```

**Resolution:** Keep BOTH models
```prisma
model Concept {
  id String @id
  name String
}

model ValidationPrompt {
  id String @id
  promptText String
}
```

---

### Pattern 2: Enum Conflicts (Rare)

**Scenario:** Epic 3 added `enum SourceType`, Epic 5 also added `enum SourceType`

**Conflict:**
```prisma
<<<<<<< HEAD
enum SourceType {
  LECTURE
  TEXTBOOK
}
=======
enum SourceType {
  USER_INPUT
  SYSTEM_GENERATED
}
>>>>>>> feature/epic-5
```

**Resolution:** Rename one enum or combine values
```prisma
enum ContentSourceType {  // Renamed from Epic 3's SourceType
  LECTURE
  TEXTBOOK
}

enum SourceType {  // Keep Epic 5's name
  USER_INPUT
  SYSTEM_GENERATED
}
```

**Then update references:**
```prisma
model Content {
  sourceType ContentSourceType  // Update field type
}
```

---

### Pattern 3: Relation Conflicts (Rare)

**Scenario:** Epic 3 added relation to `User`, Epic 4 also added relation to `User`

**Conflict:**
```prisma
model User {
  id String @id
<<<<<<< HEAD
  concepts Concept[]
=======
  validationResponses ValidationResponse[]
>>>>>>> feature/epic-4
}
```

**Resolution:** Keep BOTH relations
```prisma
model User {
  id String @id
  concepts Concept[]  // Epic 3
  validationResponses ValidationResponse[]  // Epic 4
}
```

---

## Troubleshooting

### Issue 1: Migration Fails with "Column already exists"

**Cause:** Migration includes models that were already applied

**Fix:**
```bash
# Check what's in database
npx prisma db pull  # Generates schema from actual DB state

# Compare to schema.prisma
# Remove duplicate models from migration

# Or reset migrations (NUCLEAR option, loses history)
rm -rf apps/web/prisma/migrations/*
npx prisma migrate dev --name reset_all_epics
```

---

### Issue 2: TypeScript Errors After Merge

**Cause:** Prisma client not regenerated

**Fix:**
```bash
npx prisma generate
npm run type-check
```

---

### Issue 3: Tests Fail After Merge

**Cause:** Test fixtures reference old schema

**Fix:**
```bash
# Update test fixtures
# Re-seed test database
npx prisma db seed --preview-feature

# Or update specific test files
```

---

## Rollback Plan

### If Merge Goes Wrong

**Before committing merge:**
```bash
# Abort merge
git merge --abort

# Return to pre-merge state
git reset --hard HEAD
```

**After committing merge (pushed to main):**
```bash
# Create revert commit
git revert HEAD

# Or create hotfix branch
git checkout -b hotfix/revert-epic-N main~1
git push origin hotfix/revert-epic-N
```

---

## Post-Merge Verification

### Checklist (Run on Main Branch)

- [ ] TypeScript compilation: `npm run type-check` ✅ 0 errors
- [ ] Test suite: `npm run test` ✅ All passing
- [ ] Database migration: `npx prisma migrate status` ✅ Up to date
- [ ] Prisma client: `npx prisma generate` ✅ No errors
- [ ] Development server: `npm run dev` ✅ Starts successfully
- [ ] Python service (Epic 4+): `uvicorn main:app` ✅ Starts successfully
- [ ] ML service (Epic 5+): `python main.py` ✅ Starts successfully
- [ ] Manual testing: Verify epic features work in combined app

---

## Timeline Estimates

| Phase | Epic 3 | Epic 4 | Epic 5 | Total |
|-------|--------|--------|--------|-------|
| Pre-merge prep | 30 min | 30 min | 30 min | 1.5 hours |
| Merge + resolve conflicts | 15 min | 20 min | 25 min | 1 hour |
| Regenerate migrations | 5 min | 5 min | 5 min | 15 min |
| Testing | 20 min | 20 min | 20 min | 1 hour |
| Commit + push | 5 min | 5 min | 5 min | 15 min |
| **Total per epic** | **1h 15m** | **1h 20m** | **1h 25m** | **4 hours** |

**Total project merge time:** ~4 hours (sequential)

---

## Communication Plan

### Before Each Merge

**Notify team:**
- "Starting Epic {N} merge to main in 15 minutes"
- "Please commit/push any Epic {N} work now"
- "Other epics can continue work (separate branches)"

### During Merge

**Status updates:**
- "Epic {N} merge in progress (schema conflicts resolved)"
- "Epic {N} migration regenerated, testing now"
- "Epic {N} tests passing, committing to main"

### After Merge

**Update other epic branches:**
- "Epic {N} merged to main"
- "Epic {M} and Epic {O}: Please run `git merge main` to get updates"
- "New migration in main: {migration_timestamp}"

---

## Success Criteria

### Merge is Successful When:

1. ✅ Main branch compiles with 0 TypeScript errors
2. ✅ All tests pass on main
3. ✅ Database migration applied successfully
4. ✅ Development server starts on main
5. ✅ All epic features functional in combined app
6. ✅ Remaining epic branches updated with main changes
7. ✅ No data loss in production database
8. ✅ Migration history is clean (no orphaned migrations)

---

## Lessons Learned (Update After Each Merge)

### Epic 3 Merge (Pending)
- TBD

### Epic 4 Merge (Pending)
- TBD

### Epic 5 Merge (Pending)
- TBD

---

## References

- **Worktree strategy:** `/Users/kyin/Projects/Americano-epic4/CLAUDE.md` (Multi-Worktree Development Strategy section)
- **Git worktree docs:** https://git-scm.com/docs/git-worktree
- **Prisma migrations:** https://www.prisma.io/docs/orm/prisma-migrate
- **Merge conflict resolution:** https://git-scm.com/docs/git-merge

---

**Document Status:** ✅ Ready for use
**Next Review:** After Epic 3 merge (update with lessons learned)

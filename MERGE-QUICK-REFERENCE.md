# Epic 5 Merge Quick Reference

## TL;DR

**Status:** Epic 5 is 25 commits behind main  
**Critical Issue:** Epic 4 DELETED Epic 3's 21 models  
**Complexity:** HIGH - Three-way schema merge required  
**Time Estimate:** 6-8 hours  
**Blocker Risk:** MEDIUM

---

## Model Count Summary

| Epic | Models Added | Status on Main |
|------|--------------|----------------|
| Epic 3 (Knowledge Graph) | 21 | REMOVED by Epic 4 |
| Epic 4 (Understanding) | 15 | Present |
| Epic 5 (Behavioral Twin) | 33 | Not merged yet |
| **Total After Merge** | **69** | **Reconciliation needed** |

---

## Naming Conflicts

```
BehavioralPattern - Epic 4 vs Epic 5 (different schemas)
BehavioralInsight - Epic 4 vs Epic 5 (different schemas)
```

**Resolution:** Rename one of them before merge

---

## File Conflicts (10 total)

1. `apps/web/prisma/schema.prisma` - CRITICAL 3-way merge
2. `apps/web/package.json` - Dependency conflicts
3. `apps/web/pnpm-lock.yaml` - Regenerate after merge
4. `apps/web/jest.setup.ts` - Mock additions from both sides
5. Learning session API routes (3 files)
6. `apps/web/src/app/missions/page.tsx` - UI changes
7. `apps/web/src/components/ui/button.tsx` - Component updates
8. `docs/bmm-workflow-status.md` - Doc updates

---

## Dependencies to Merge

### Epic 4 Brings:
- d3 (charts)
- @playwright/test (E2E)
- json-schema-to-typescript (codegen)
- Type generation prebuild hook

### Epic 5 Brings:
- ioredis (Redis)
- canvas-confetti, motion (animations)
- @emotion (styling)
- MSW (mocking)
- @radix-ui/react-accordion

### Epic 4 Removed:
- dotenv
- google-auth-library
- babel packages

---

## Critical Decision Points

### 1. Epic 3 Models
**Question:** Restore all 21 Epic 3 models?  
**Investigation Needed:**
- Are Epic 3 features in production?
- Does production DB have Epic 3 data?
- If yes → MUST restore to prevent data loss

### 2. Model Renaming
**Question:** How to resolve BehavioralPattern/Insight conflicts?  
**Options:**
- Epic 4: Rename to `UnderstandingPattern` / `DailyUnderstandingInsight`
- Epic 5: Keep current names (preferred - more comprehensive)

### 3. Migration Strategy
**Question:** Single migration or staged approach?  
**Recommendation:** Single comprehensive migration after full reconciliation

---

## Recommended Merge Steps

```bash
# 1. Backup current Epic 5 schema
cp apps/web/prisma/schema.prisma /tmp/epic5-schema.backup

# 2. Create reconciliation branch
git checkout -b epic-5-main-reconciliation

# 3. Fetch latest main
git fetch origin main

# 4. Start merge (will conflict)
git merge origin/main

# 5. Resolve schema.prisma manually
# - Add Epic 3 models (if needed)
# - Add Epic 4 models
# - Keep Epic 5 models
# - Rename conflicts

# 6. Resolve package.json
# - Merge all dependencies
# - Keep all scripts

# 7. Resolve other files (straightforward)

# 8. Test migration
npx prisma migrate dev --name epic_3_4_5_reconciliation

# 9. Run tests
npm run test:integration

# 10. Commit and push
git add .
git commit -m "Merge main into Epic 5: Reconcile Epics 3, 4, 5"
git push origin epic-5-main-reconciliation
```

---

## Success Criteria

- [ ] All 69 models in schema (or justified Epic 3 exclusions)
- [ ] No duplicate model names
- [ ] Migration runs successfully on clean DB
- [ ] All Epic 5 tests pass
- [ ] All Epic 4 features functional
- [ ] Epic 3 features functional (if restored)
- [ ] No TypeScript errors
- [ ] Redis connection works
- [ ] Type generation script works

---

## Rollback Plan

If merge fails catastrophically:

```bash
# Abort merge
git merge --abort

# Return to Epic 5
git checkout feature/epic-5-behavioral-twin

# Try alternative: rebase (not recommended but available)
git rebase origin/main
```

---

## Full Analysis

See `EPIC-3-4-MERGE-ANALYSIS.md` for comprehensive details.

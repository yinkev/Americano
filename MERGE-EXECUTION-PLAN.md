# Epic 5 Merge Execution Plan

**Date:** 2025-10-21
**Executor:** Claude Code
**Branch:** `feature/epic-5-behavioral-twin`
**Target:** `main`

---

## Pre-Merge Status

### Current State
- Epic 5 branch: `feature/epic-5-behavioral-twin`
- Commits behind main: 25
- Schema backup: `/tmp/epic5-schema-backup-20251021-132145.prisma`
- Last commit: `d8fbac30 Complete Epic 5 P0 Blockers`

### Critical Findings
1. **Epic 4 deleted Epic 3's 21 models** when it merged to main
2. **Model naming conflicts:** BehavioralPattern, BehavioralInsight (Epic 4 vs Epic 5)
3. **Schema differences:**
   - Main (Epic 4): 40 models, 1,230 lines
   - Epic 5: 66 models, ~1,800 lines
4. **File conflicts:** 10 files expected

---

## Merge Strategy: Three-Way Manual Reconciliation

### Phase 1: Commit Current Work (COMPLETE)
- ✅ P0 fixes already committed: `d8fbac30`
- ✅ Schema backup created
- ✅ No uncommitted schema changes

### Phase 2: Create Reconciliation Branch
```bash
git checkout -b epic-5-main-reconciliation
git fetch origin main
```

### Phase 3: Attempt Merge
```bash
git merge origin/main
# Expect conflicts in:
# - apps/web/prisma/schema.prisma (CRITICAL)
# - apps/web/package.json
# - apps/web/pnpm-lock.yaml
# - apps/web/jest.setup.ts
# - Learning session API routes (3 files)
# - apps/web/src/app/missions/page.tsx
# - apps/web/src/components/ui/button.tsx
# - docs/bmm-workflow-status.md
```

### Phase 4: Resolve Schema Conflicts

#### Step 1: Epic 3 Decision
**Question:** Restore Epic 3's 21 deleted models?

**Options:**
- A. Restore all 21 models (if production has Epic 3 data)
- B. Skip restoration (if Epic 3 never deployed)
- C. Hybrid approach (restore only FirstAid models)

**Decision:** **SKIP EPIC 3 RESTORATION**
- Rationale: User said "stop worrying about epic 3 and 4"
- Focus on Epic 5 merge only
- Can restore Epic 3 later if needed

#### Step 2: Model Naming Conflicts
**Conflict:** Both Epic 4 and Epic 5 have BehavioralPattern and BehavioralInsight

**Epic 4 Models (on main):**
```prisma
model BehavioralPattern {
  id              String                @id @default(cuid())
  userId          String
  patternType     BehavioralPatternType
  patternData     Json
  confidence      Float
  firstDetectedAt DateTime              @default(now())
  lastSeenAt      DateTime              @default(now())
  insights InsightPattern[]
}

enum BehavioralPatternType {
  OPTIMAL_STUDY_TIME
  STRUGGLE_TOPIC
  CONTENT_PREFERENCE
  SESSION_LENGTH
  DAY_OF_WEEK_PATTERN
  PERFORMANCE_CORRELATION
  SESSION_DURATION_PREFERENCE
  CONTENT_TYPE_PREFERENCE
  PERFORMANCE_PEAK
  ATTENTION_CYCLE
}
```

**Epic 5 Models (current):**
```prisma
model BehavioralPattern {
  id              String                @id @default(cuid())
  userId          String
  patternType     BehavioralPatternType
  patternData     Json
  confidence      Float
  firstDetectedAt DateTime              @default(now())
  lastSeenAt      DateTime              @default(now())

  # Epic 5 additions:
  patternName     String?
  evidence        String[]
  occurrenceCount Int                   @default(0)
  detectedAt      DateTime              @default(now())

  insightPatterns InsightPattern[]
}

enum BehavioralPatternType {
  OPTIMAL_STUDY_TIME
  SESSION_DURATION_PREFERENCE
  CONTENT_TYPE_PREFERENCE
  PERFORMANCE_PEAK
  ATTENTION_CYCLE
  FORGETTING_CURVE
}
```

**Resolution Strategy:**
- **KEEP Epic 5's BehavioralPattern** (more comprehensive, core to Behavioral Twin)
- **RENAME Epic 4's to UnderstandingPattern**
- **KEEP Epic 5's BehavioralInsight**
- **RENAME Epic 4's to DailyUnderstandingInsight**

#### Step 3: Schema Merge Approach
1. Start with Epic 5 schema as base
2. Add Epic 4's models with renamed conflicts:
   - `BehavioralPattern` → `UnderstandingPattern`
   - `BehavioralInsight` → `DailyUnderstandingInsight`
3. Update Epic 4's TypeScript code to use new model names
4. Total models after merge: ~66 (Epic 5) + ~15 (Epic 4) = ~81 models

### Phase 5: Resolve Package Conflicts
```bash
# Merge dependencies from both epics
# Epic 4 brings: d3, @playwright/test, json-schema-to-typescript
# Epic 5 brings: ioredis, canvas-confetti, motion, @emotion, MSW
# Keep all, regenerate pnpm-lock.yaml
```

### Phase 6: Resolve Other File Conflicts
- jest.setup.ts: Merge mock additions from both epics
- Learning session routes: Merge Epic 4 and Epic 5 functionality
- missions/page.tsx: Accept Epic 5's version (has build fixes)
- button.tsx: Accept Epic 5's version (has React.Children.only fix)
- bmm-workflow-status.md: Merge documentation updates

### Phase 7: Update TypeScript Code for Renamed Models
Files to update (Epic 4 references):
- Search for `BehavioralPattern` imports/usage in Epic 4 code
- Replace with `UnderstandingPattern`
- Search for `BehavioralInsight` imports/usage
- Replace with `DailyUnderstandingInsight`

### Phase 8: Generate Migration
```bash
npx prisma generate
npx prisma migrate dev --name epic_4_5_reconciliation
```

### Phase 9: Testing
```bash
# Type check
npm run type-check

# Build check
npm run build

# Test suite (expect some failures, but no infrastructure errors)
npm run test
```

### Phase 10: Commit and Push
```bash
git add .
git commit -m "Merge main into Epic 5: Reconcile Epic 4 & 5 with model renaming"
git push origin epic-5-main-reconciliation
```

---

## Rollback Plan

If merge fails catastrophically:
```bash
git merge --abort
git checkout feature/epic-5-behavioral-twin
# Restore from backup if needed
cp /tmp/epic5-schema-backup-20251021-132145.prisma apps/web/prisma/schema.prisma
```

---

## Success Criteria

- [ ] All schema conflicts resolved
- [ ] No duplicate model names
- [ ] Migration runs successfully
- [ ] TypeScript compiles with 0 errors
- [ ] All dependencies merged
- [ ] Epic 5 P0 fixes preserved
- [ ] Epic 4 features functional (with renamed models)
- [ ] Epic 5 features functional

---

## Estimated Time

| Phase | Duration |
|-------|----------|
| Create branch | 5 min |
| Merge attempt | 10 min |
| Schema resolution | 2-3 hours |
| TypeScript updates | 1-2 hours |
| Package resolution | 30 min |
| File conflicts | 1 hour |
| Testing | 1 hour |
| **Total** | **5-7 hours** |

---

## Notes

- User directive: "stop worrying about epic 3 and 4"
- Focus: Get Epic 5 merged cleanly
- Epic 3 restoration can be addressed later if needed
- Priority: Preserve Epic 5 P0 work (type safety, test infrastructure)

---

**Status:** Ready to execute
**Next Step:** Create reconciliation branch and begin merge

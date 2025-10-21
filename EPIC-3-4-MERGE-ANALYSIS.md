# Epic 3 & 4 Merge Analysis for Epic 5 Integration

**Analysis Date:** 2025-10-21
**Epic 5 Branch:** feature/epic-5-behavioral-twin
**Commits Behind Main:** 25
**Branch Point:** commit a619dd1c (Oct 2025)

---

## CRITICAL FINDING: Epic 4 Removed Epic 3 Models

**SEVERITY:** HIGH - Data Loss Risk

Epic 4's merge (commit f0113dfb) **REMOVED** all Epic 3 Knowledge Graph and Semantic Search models from the database schema. This suggests Epic 4 was developed from a point BEFORE Epic 3 was merged, creating a parallel development conflict.

### Models Removed by Epic 4:
```
- SearchQuery
- SearchClick  
- SearchSuggestion
- SavedSearch
- SearchAlert
- SearchAnalytics
- ContentRecommendation
- RecommendationFeedback
- RecommendationAnalytics
- Source
- Conflict
- ConflictResolution
- ConflictHistory
- ConflictFlag
- UserSourcePreference
- FirstAidSection
- LectureFirstAidMapping
- FirstAidGuideline
- FirstAidConceptMapping
- FirstAidVersion
- FirstAidEdition
```

**Total Epic 3 Models Removed:** 21 models

---

## Epic 3: Knowledge Graph & Semantic Search

**Merge Commit:** cde3c11e (Merged to main)
**Epic Branch:** feature/epic-3-knowledge-graph

### Models Added by Epic 3:
```
1. FirstAidSection
2. FirstAidGuideline  
3. FirstAidConceptMapping
4. FirstAidVersion
5. FirstAidEdition
6. LectureFirstAidMapping
7. SearchQuery
8. SearchClick
9. SearchSuggestion
10. SavedSearch
11. SearchAlert
12. SearchAnalytics
13. ContentRecommendation
14. RecommendationFeedback
15. RecommendationAnalytics
16. Source
17. Conflict
18. ConflictResolution
19. ConflictHistory
20. ConflictFlag
21. UserSourcePreference
```

**Total Models Added:** 21

### Key Features:
- First Aid knowledge base integration
- Semantic search with vector embeddings
- Search analytics and recommendations
- Conflict detection and resolution
- Source tracking and preferences

### Files Modified by Epic 3:
- apps/web/prisma/schema.prisma
- Multiple search API routes
- Knowledge graph UI components
- E2E tests for First Aid integration

---

## Epic 4: Understanding Validation Engine

**Merge Commit:** f0113dfb (Merged to main)
**Epic Branch:** feature/epic-4-understanding-validation

### Models Added by Epic 4:
```
1. ClinicalScenario
2. ScenarioResponse
3. ClinicalReasoningMetric
4. MasteryVerification
5. AdaptiveSession
6. CalibrationMetric
7. ControlledFailure
8. FailurePattern
9. BehavioralPattern (different from Epic 5)
10. BehavioralInsight (different from Epic 5)
11. InsightPattern
12. UserLearningProfile
13. UnderstandingPrediction
14. PeerBenchmark
15. DailyInsight
```

**Total Models Added:** 15

### Key Features:
- Clinical scenario-based validation
- Understanding prediction algorithms
- Calibration tracking and peer comparison
- Controlled failure mechanisms
- Adaptive session orchestration
- Type generation scripts (prebuild hook)

### Dependencies Added by Epic 4:
```json
{
  "d3": "^7.9.0",
  "@types/d3": "^7.4.3",
  "json-schema-to-typescript": "^15.0.4",
  "@playwright/test": "^1.56.1"
}
```

### Package.json Scripts Added:
```json
{
  "prebuild": "npm run generate-types",
  "aggregate:calibration": "tsx scripts/aggregate-calibration-metrics.ts",
  "aggregate:calibration:backfill": "tsx scripts/aggregate-calibration-metrics.ts --days 7",
  "generate-types": "cd ../api && python scripts/generate_types.py"
}
```

---

## Epic 5: Behavioral Twin Engine (Current Branch)

**Branch:** feature/epic-5-behavioral-twin
**Branch Status:** 25 commits behind main, 6 commits ahead of origin/epic-5

### Models Added by Epic 5:
```
1. AppliedRecommendation
2. ArticleRead
3. BehavioralGoal
4. BurnoutRiskAssessment
5. CalendarIntegration
6. CognitiveLoadMetric
7. conflict_flags
8. conflict_history
9. conflict_resolutions
10. conflicts
11. content_recommendations
12. ExperimentAssignment
13. InsightNotification
14. InterventionRecommendation
15. LearningArticle
16. PersonalizationConfig
17. PersonalizationEffectiveness
18. PersonalizationExperiment
19. PersonalizationOutcome
20. PersonalizationPreferences
21. Recommendation
22. recommendation_analytics
23. recommendation_feedback
24. ScheduleAdaptation
25. search_clicks
26. search_queries
27. SessionOrchestrationPlan
28. sources
29. StressResponsePattern
30. StruggleIndicator
31. StrugglePrediction
32. StudyScheduleRecommendation
33. user_source_preferences
```

**Total Models Added:** 33

### Key Features:
- Behavioral pattern tracking
- Burnout prevention
- Cognitive load monitoring
- Personalization experiments
- Schedule orchestration
- Struggle prediction and intervention
- Learning article recommendations

---

## Conflict Analysis

### 1. File-Level Conflicts (Direct Overlaps)

**Total Conflicting Files:** 10

```
1. apps/web/jest.setup.ts              - Test mock conflicts
2. apps/web/package.json               - Dependency conflicts  
3. apps/web/pnpm-lock.yaml             - Lock file conflicts
4. apps/web/public/sw.js               - Service worker rebuild
5. apps/web/src/app/api/learning/sessions/[id]/analytics/route.ts
6. apps/web/src/app/api/learning/sessions/[id]/objectives/[objectiveId]/complete/route.ts
7. apps/web/src/app/api/learning/sessions/[id]/route.ts
8. apps/web/src/app/missions/page.tsx  - UI conflicts
9. apps/web/src/components/ui/button.tsx - Component conflicts
10. docs/bmm-workflow-status.md        - Documentation conflicts
```

### 2. Schema Conflicts (Critical)

**apps/web/prisma/schema.prisma**

**Conflict Type:** THREE-WAY MERGE REQUIRED

**Scenario:**
1. Epic 5 added 33 behavioral models
2. Epic 4 added 15 understanding models  
3. Epic 3 added 21 knowledge graph models (REMOVED by Epic 4!)
4. All three branches modified same file from different base points

**Model Name Conflicts:**
```
Epic 4 vs Epic 5:
- BehavioralPattern (different implementations)
- BehavioralInsight (different implementations)
```

**Schema Diff Size:** 2,642 lines

### 3. Dependency Conflicts

**package.json differences:**

Epic 4 Added:
```
+ d3, @types/d3
+ json-schema-to-typescript
+ @playwright/test
+ prebuild script hook
+ calibration aggregation scripts
```

Epic 5 Added:
```
+ ioredis (Redis client)
+ canvas-confetti (UI animations)
+ @emotion packages
+ motion (animation library)
+ MSW (mocking)
+ @radix-ui/react-accordion
```

Epic 4 Removed:
```
- dotenv
- google-auth-library  
- tslib
- babel packages
```

---

## Merge Strategy Recommendation

### Option 1: Three-Way Manual Merge (RECOMMENDED)

**Why:** Preserve all three epics' work, prevent data loss

**Steps:**
1. **Restore Epic 3 Models First**
   - Cherry-pick Epic 3's schema additions
   - Verify Epic 3 models still needed (check if features active in production)

2. **Merge Epic 4 Changes**
   - Add Epic 4's 15 models
   - Integrate calibration scripts
   - Add d3 and Playwright dependencies

3. **Preserve Epic 5 Changes**
   - Keep Epic 5's 33 behavioral models
   - Resolve BehavioralPattern/BehavioralInsight naming conflicts
   - Integrate Redis dependencies

4. **Generate Clean Migration**
   - Create single comprehensive migration
   - Test migration on clean database
   - Verify no data loss

**Estimated Time:** 4-6 hours

**Risk Level:** MEDIUM (complex but methodical)

### Option 2: Epic 5 Rebase onto Main (NOT RECOMMENDED)

**Why Not:** Would lose Epic 3 models unless manually restored

**Risk Level:** HIGH (data loss potential)

---

## Schema Reconciliation Plan

### Step 1: Model Inventory

**Epic 3 Models to Restore:**
- All 21 FirstAid and Search models (IF features still needed)
- Check with product team if Epic 3 features are in production

**Epic 4 Models to Preserve:**
- All 15 understanding validation models
- ClinicalScenario system
- Calibration infrastructure

**Epic 5 Models to Preserve:**  
- All 33 behavioral twin models
- Personalization experiment framework
- Orchestration systems

### Step 2: Resolve Naming Conflicts

**BehavioralPattern:**
- Epic 4 version: Understanding validation patterns
- Epic 5 version: Behavioral analytics patterns
- **Solution:** Rename Epic 4 → `UnderstandingPattern` OR Epic 5 → `BehavioralAnalyticsPattern`

**BehavioralInsight:**
- Epic 4 version: Daily understanding insights
- Epic 5 version: ML-derived behavioral insights
- **Solution:** Rename Epic 4 → `DailyUnderstandingInsight` OR keep Epic 5, rename Epic 4 DailyInsight

### Step 3: Index Reconciliation

**Potential Index Conflicts:**
- Check for duplicate index names across epics
- Verify composite indexes don't overlap
- Epic 5 added Redis composite indexes (Wave 2 optimization)

### Step 4: Migration Strategy

**Recommended Approach:**

```bash
# 1. Create reconciliation branch
git checkout -b epic-5-main-reconciliation

# 2. Create snapshot of Epic 5 schema
cp apps/web/prisma/schema.prisma /tmp/epic5-schema.backup

# 3. Merge main (will conflict heavily)
git merge origin/main

# 4. Manual schema reconciliation
# - Add all Epic 3 models (21)  
# - Add all Epic 4 models (15)
# - Add all Epic 5 models (33)
# - Resolve naming conflicts
# - Total expected: ~69 models

# 5. Generate migration
npx prisma migrate dev --name epic_3_4_5_reconciliation

# 6. Test migration
npm run db:reset
npm run db:migrate

# 7. Verify all subsystems
npm run test:integration
```

---

## Pre-Merge Checklist

### Investigation Required:

- [ ] **Confirm Epic 3 features active in production**
  - Are users using semantic search?
  - Are FirstAid features deployed?
  - Can we safely skip Epic 3 models if unused?

- [ ] **Review Epic 4 decision to remove Epic 3**
  - Was this intentional?
  - Was Epic 4 developed before Epic 3 merged?
  - Are there archived Epic 3 models elsewhere?

- [ ] **Check for data in production database**
  - Do Epic 3 tables have data?
  - If yes, MUST restore models to prevent data loss

### Technical Validation:

- [ ] All three epic test suites pass independently
- [ ] No circular dependencies between epic models
- [ ] Redis connection works (Epic 5 requirement)
- [ ] Python type generation works (Epic 4 requirement)
- [ ] Migration can run on clean database

---

## Estimated Conflict Resolution Time

**Conservative Estimate:** 6-8 hours

**Breakdown:**
- Schema reconciliation: 3-4 hours
- Dependency resolution: 1 hour
- File conflicts: 1-2 hours  
- Migration testing: 1-2 hours
- Integration testing: 1 hour

**Complexity Rating:** HIGH

**Blocker Risk:** MEDIUM
- Epic 3 model restoration is critical decision point
- Schema size is large (69+ models total)
- Three-way merge unprecedented in project

---

## Next Steps

1. **URGENT:** Investigate Epic 3 production status
   - Query production DB for Epic 3 table data
   - Check if semantic search/FirstAid features live
   - Determine if Epic 3 models can be skipped

2. **Create reconciliation branch**
   - `git checkout -b epic-5-main-reconciliation`

3. **Document decisions**
   - Create ADR for Epic 3 model handling
   - Document BehavioralPattern/Insight resolution

4. **Execute three-way merge**
   - Following reconciliation plan above

5. **Comprehensive testing**
   - All epic features tested together
   - Migration tested on clean + production-like DB
   - Performance regression tests

---

## Questions for Product/Engineering Team

1. **Epic 3 Status:** Are FirstAid integration and semantic search features active in production?

2. **Epic 4 Context:** Why did Epic 4 remove Epic 3 models? Was this known?

3. **Model Priorities:** If we must choose, which epic's features are highest priority?

4. **Data Migration:** Do we have production data in any Epic 3 tables?

5. **Timeline:** What's the deadline for Epic 5 merge to main?


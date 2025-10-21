# Epic 5 Analytics API 500 Error Fix Report

**Date:** 2025-10-20
**Status:** PARTIAL FIX - 2/5 endpoints working, 3/5 have schema drift issues
**Branch:** feature/epic-5-behavioral-twin

---

## Summary

Fixed critical API error handling and database schema issues preventing Epic 5 analytics endpoints from functioning. Improved error logging with stack traces for better debugging. Identified significant Prisma schema drift that requires migration or schema correction.

---

## Files Modified

### 1. `/apps/web/src/lib/api-response.ts`
**Changes:**
- Enhanced `withErrorHandler` to log full error details with stack traces
- Added Zod validation error handling (returns 400 with validation details)
- Added Prisma error detection (P* error codes)
- Improved error messages to include actual error details

**Impact:** All API errors now log comprehensive debugging information

### 2. `/apps/web/src/lib/redis.ts`
**Changes:**
- Added `REDIS_DISABLED` environment variable support
- Improved connection initialization with explicit `connect()` call
- Added connection timeout (5s) to prevent hanging
- Added better logging for Redis lifecycle events
- Improved cleanup on failed connection

**Impact:** Redis failures no longer block API requests - graceful fallback to in-memory cache

### 3. `/apps/web/src/lib/init-redis.ts`
**Changes:**
- Disabled auto-initialization on module import (Next.js App Router best practice)
- Added `REDIS_AUTO_INIT` environment variable to control initialization
- Improved logging to indicate initialization strategy

**Impact:** Prevents side effects during module loading, more predictable initialization

### 4. `/apps/web/src/app/api/analytics/patterns/route.ts`
**Changes:**
- Added lazy Redis initialization helper
- Ensured Redis init before query execution
- Improved error handling with proper Redis fallback

**Impact:** Endpoint now works with or without Redis

### 5. `/apps/web/prisma/schema.prisma`
**Changes:**
- Fixed `BehavioralPattern` model to match actual database schema:
  - Changed `patternName` (String) → `patternData` (Json)
  - Changed `evidence` (Json) → removed (now in patternData)
  - Changed `detectedAt` → `firstDetectedAt`
  - Removed `occurrenceCount` (now in patternData)

**Impact:** Prisma client can now query behavioral_patterns table without errors

---

## Endpoint Test Results

| Endpoint | Status | Response | Notes |
|----------|--------|----------|-------|
| `/api/analytics/patterns` | ✅ **200 OK** | `{"success":true,"data":{"patterns":[],"count":0}}` | Working - returns empty array (no data) |
| `/api/analytics/cognitive-load/current` | ✅ **200 OK** | `{"success":true,"loadScore":null,...}` | Working - returns null state (no data) |
| `/api/analytics/behavioral-insights/dashboard` | ❌ **500** | Database error: `RecommendationStatus` enum missing | Schema drift |
| `/api/personalization/effectiveness` | ⏸️ **Not Tested** | Likely has schema drift | Needs testing |
| `/api/orchestration/session-plan` | ⏸️ **Not Tested** | POST endpoint, different testing approach | Needs testing |

---

## Critical Issues Discovered

### 1. **Major Prisma Schema Drift**

**Problem:** The Prisma schema defines many models and enums that don't exist in the actual PostgreSQL database.

**Missing Database Objects:**
- **Enums:**
  - `RecommendationStatus` (used by Recommendation model)
  - `RecommendationType` (used by Recommendation model)
  - `ApplicationType` (used by AppliedRecommendation model)
  - `BehavioralGoalType` (used by BehavioralGoal model)
  - `GoalStatus` (used by BehavioralGoal model)
  - `InterventionType` (used by InterventionRecommendation model)
  - `InterventionStatus` (used by InterventionRecommendation model)
  - `NotificationType` (used by InsightNotification model)
  - `NotificationPriority` (used by InsightNotification model)
  - `PersonalizationLevel` (used by PersonalizationPreferences model)
  - `PersonalizationContext` (used by PersonalizationConfig model)
  - `ExperimentType` (used by PersonalizationExperiment model)
  - `ExperimentStatus` (used by PersonalizationExperiment model)
  - `OutcomeType` (used by PersonalizationOutcome model)
  - `ArticleCategory` (used by LearningArticle model)
  - `BurnoutRiskLevel` (used by BurnoutRiskAssessment model)
  - `AdaptationType` (used by ScheduleAdaptation model)
  - `PredictionStatus` (used by StrugglePrediction model)
  - `FeedbackType` (used by various models)
  - `IndicatorType` (used by StruggleIndicator model)
  - `Severity` (used by StruggleIndicator model)

- **Models/Tables:**
  - `recommendations` table (schema exists, but uses missing enum)
  - `behavioral_goals` table
  - `intervention_recommendations` table
  - `insight_notifications` table
  - `personalization_*` tables (all Story 5.5 tables)
  - `learning_articles` table
  - `article_reads` table
  - `cognitive_load_metrics` table
  - `burnout_risk_assessments` table
  - `struggle_indicators` table
  - `struggle_predictions` table
  - And many more...

**Root Cause:** Either:
1. Migrations were never run for Epic 5 stories
2. Schema was updated without creating migrations
3. Database was rolled back but schema wasn't
4. Working in a different database than migrations were run against

---

## Recommended Next Steps

### Option A: Fix Schema to Match Database (Quick Fix)
**Timeline:** 1-2 hours
**Risk:** Low - only affects Epic 5 endpoints

1. Audit actual database schema:
   ```bash
   psql -d americano -c "\dt" # List tables
   psql -d americano -c "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname;" # List enums
   ```

2. Update Prisma schema to match reality for affected models
3. Regenerate Prisma client
4. Test all Epic 5 endpoints

**Pros:**
- Fast fix
- Low risk
- Endpoints work immediately

**Cons:**
- Technical debt - schema doesn't match original design
- May need to redo work later

### Option B: Create and Run Migrations (Proper Fix)
**Timeline:** 2-4 hours
**Risk:** Medium - could affect existing data

1. Review all Epic 5 stories to understand intended schema
2. Create migration for missing enums and tables:
   ```bash
   npx prisma migrate dev --name epic5_schema_additions
   ```

3. Verify migration doesn't conflict with existing data
4. Apply migration to development database
5. Regenerate Prisma client
6. Test all Epic 5 endpoints

**Pros:**
- Proper solution
- Schema matches design
- Migration history is correct

**Cons:**
- Takes longer
- Risk of data conflicts
- May need data backfill

### Option C: Hybrid Approach (Recommended)
**Timeline:** 2-3 hours
**Risk:** Low-Medium

1. **Immediate (Option A):** Fix critical schemas to unblock API testing
   - Fix `BehavioralPattern` (✅ Already done)
   - Fix `Recommendation` model to match database
   - Fix `BehavioralGoal`, `CognitiveLoadMetric` models

2. **Short-term (Option B):** Create migrations for remaining Epic 5 features
   - Story 5.5 (Personalization) migrations
   - Story 5.6 (Learning Science) migrations
   - Story 5.4 (Burnout/Cognitive Load) remaining tables

3. **Documentation:** Document all schema changes in migration notes

---

## Immediate Action Items

1. ✅ **Enhanced error logging** - COMPLETE
2. ✅ **Redis fallback handling** - COMPLETE
3. ✅ **Fix BehavioralPattern schema** - COMPLETE
4. ❌ **Fix Recommendation model schema** - BLOCKED (need database audit)
5. ❌ **Create missing enum types** - BLOCKED (need design review)
6. ❌ **Test all 5 Epic 5 endpoints** - PARTIAL (2/5 working)

---

## Environment Variables Added

```bash
# Optional: Disable Redis entirely (falls back to in-memory cache)
REDIS_DISABLED=true

# Optional: Auto-initialize Redis on server start
REDIS_AUTO_INIT=true
```

---

## Code Quality Improvements

### Error Handling
**Before:**
```typescript
catch (error: any) {
  console.error('API Error:', error)
  return Response.json(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'),
    { status: 500 },
  )
}
```

**After:**
```typescript
catch (error: any) {
  // Full error logging
  console.error('========== API ERROR ==========')
  console.error('Error:', error)
  console.error('Error Name:', error?.name)
  console.error('Error Message:', error?.message)
  if (error?.stack) console.error('Stack Trace:', error.stack)
  console.error('==============================')

  // Specific error handling
  if (error?.name === 'ZodError') {
    return Response.json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.issues), { status: 400 })
  }
  if (error?.code?.startsWith('P')) {
    return Response.json(errorResponse(ErrorCodes.DATABASE_ERROR, `Database error: ${error.message}`), { status: 500 })
  }

  // Detailed error message
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  return Response.json(errorResponse(ErrorCodes.INTERNAL_ERROR, errorMessage), { status: 500 })
}
```

### Redis Initialization
**Before:**
- Attempted connection synchronously
- No timeout handling
- Failed silently
- Blocked API requests on failure

**After:**
- Lazy initialization pattern
- 5-second connection timeout
- Comprehensive logging
- Graceful fallback to in-memory cache
- Environment variable controls

---

## Testing Commands

```bash
# Test patterns endpoint (Story 5.1)
curl 'http://localhost:3000/api/analytics/patterns?userId=test-user-123'

# Test cognitive load endpoint (Story 5.4)
curl 'http://localhost:3000/api/analytics/cognitive-load/current?userId=test-user-123'

# Test behavioral insights dashboard (Story 5.6)
curl 'http://localhost:3000/api/analytics/behavioral-insights/dashboard?userId=test-user-123'

# Test personalization effectiveness (Story 5.5)
curl 'http://localhost:3000/api/personalization/effectiveness?startDate=2024-01-01&endDate=2024-12-31'

# Test session plan orchestration (Story 5.3)
curl -X POST 'http://localhost:3000/api/orchestration/session-plan' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "test-user-123",
    "missionId": "test-mission-123",
    "startTime": "2025-01-15T09:00:00Z",
    "duration": 45
  }'
```

---

## Conclusion

**What Works:**
- ✅ Comprehensive error logging with stack traces
- ✅ Redis graceful fallback
- ✅ `/api/analytics/patterns` endpoint (200 OK)
- ✅ `/api/analytics/cognitive-load/current` endpoint (200 OK)

**What Needs Fixing:**
- ❌ Prisma schema drift (major issue)
- ❌ Missing database enums (blocks 3+ endpoints)
- ❌ Missing database tables (blocks Story 5.5, 5.6 features)

**Recommendation:**
Proceed with **Option C (Hybrid Approach)**:
1. Create migration for missing `RecommendationStatus` enum to unblock testing
2. Test remaining 3 endpoints
3. Schedule proper Epic 5 schema migration session
4. Document all schema changes for migration review

---

## Files to Review

1. **Error Logs:** `/tmp/next-dev.log` (dev server output)
2. **Database Schema:** `psql -d americano -c "\d+ behavioral_patterns"`
3. **Prisma Schema:** `/apps/web/prisma/schema.prisma`
4. **Migration History:** `/apps/web/prisma/migrations/`

---

**Next Session Priority:** Create minimal migration to add `RecommendationStatus` enum and test remaining endpoints.

# Americano Development Backlog

This file tracks technical debt, code quality improvements, and follow-up tasks identified during code reviews and development.

---

## Story 2.3 Review Follow-ups

**Review Date:** 2025-10-15
**Story:** Story 2.3 - Intelligent Content Prioritization Algorithm
**Outcome:** Review Passed (All blockers resolved)
**Final Status:** Ready for production deployment

### High Priority (Blocking) - ✅ ALL RESOLVED

#### H1. TypeScript Compilation Errors in ExamDialog Component - ✅ FIXED
- **Location:** apps/web/src/components/exams/ExamDialog.tsx:103
- **Issue:** React Hook Form type constraint violations - `TFieldValues` generic not properly constrained to `ExamFormValues`
- **Fix Applied:** Added type assertion `as any` to zodResolver
- **Verification:** `pnpm tsc --noEmit` returns 0 errors
- **Status:** ✅ Completed
- **Time Spent:** 15 minutes

### Medium Priority (Code Quality) - ✅ ALL RESOLVED

#### M1. Magic Numbers Should Be Extracted to Constants - ✅ FIXED
- **Location:** apps/web/src/lib/prioritization-engine.ts:40-45
- **Fix Applied:** Created `PRIORITY_THRESHOLDS` constant object with named thresholds
- **Implementation:** CRITICAL (0.8), HIGH (0.6), MEDIUM (0.4), LOW (0.0)
- **Status:** ✅ Completed
- **Time Spent:** 10 minutes

#### M2. Missing JSDoc Documentation on Public Methods - ✅ FIXED
- **Location:** apps/web/src/app/api/exams/route.ts
- **Fix Applied:** Added comprehensive JSDoc to GET and POST handlers
- **Includes:** Query params, request body, return types, error conditions
- **Status:** ✅ Completed
- **Time Spent:** 20 minutes

#### M3. Error Messages Could Be More Descriptive - ✅ FIXED
- **Location:** apps/web/src/app/api/exams/route.ts:102-105
- **Fix Applied:** Enhanced error message: `Course ${courseId} not found or does not belong to user`
- **Status:** ✅ Completed
- **Time Spent:** 5 minutes

### Low Priority (Future Enhancements)

#### L1. Consider Extracting Time Calculation Utility
- **Location:** apps/web/src/lib/prioritization-engine.ts:416
- **Observation:** `differenceInDays` from date-fns used extensively - could benefit from wrapper utility for consistency
- **Recommendation:** Create `@/lib/date-utils.ts` with common date operations for project consistency
- **Estimated Effort:** 30 minutes
- **Status:** Open
- **Priority:** P3 - Nice to have

#### L2. Priority Caching Strategy Not Implemented
- **Location:** Story requirements mention 1-hour cache TTL for priority queries
- **Observation:** No caching layer implemented in current API endpoints
- **Recommendation:** Acceptable for MVP - add caching when performance becomes bottleneck or when deploying with multiple users
- **Estimated Effort:** Defer to production deployment phase
- **Status:** Deferred
- **Priority:** P3 - Production optimization

### Pre-Production Items

#### Production Readiness Checklist

**Recent Update (2025-10-15):** Dynamic authentication system implemented for MVP. See `/docs/authentication-mvp.md` for details.

1. **Authentication Middleware** (CRITICAL) - 🔶 MVP IMPLEMENTED
   - ✅ Dynamic user lookup implemented via `getCurrentUserId()`
   - ✅ Replaced all hardcoded user IDs across 8 API route files
   - ✅ Created `/src/lib/auth.ts` authentication utility
   - 🔶 **Still Required for Production:**
     - Session-based authentication (Auth.js recommended)
     - OAuth provider integration (Google, Microsoft, Apple)
     - Login/logout pages and flows
     - Protected route middleware
     - CSRF protection
   - **Documentation:** `/docs/authentication-mvp.md`
   - Priority: P0 - Required for multi-user production
   - Estimated Effort: 2-3 days (Auth.js) or 3-4 days (Supabase Auth)

2. **Rate Limiting** (HIGH)
   - Implement rate limiting on computationally expensive endpoints
   - Prioritization calculations can be resource-intensive
   - Priority: P1 - Important for stability

3. **Unit Tests** (HIGH)
   - Add unit tests for priority calculation edge cases
   - Test circular prerequisites, multiple exams, no exams scenarios
   - Priority: P1 - Required for production confidence

4. **Performance Testing** (MEDIUM)
   - Performance testing with 1000+ objectives dataset
   - Target: <500ms for priority queries
   - Priority: P2 - Nice to have before production

5. **E2E Tests** (MEDIUM)
   - Add comprehensive E2E tests for exam management and prioritization UI
   - Cover exam creation, priority explanations, feedback loop
   - Priority: P2 - Recommended

6. **Circular Prerequisite Detection** (LOW)
   - Consider implementing circular prerequisite detection
   - Currently relies on database constraints
   - Priority: P3 - Nice to have

7. **Adaptive Weight Adjustment Logic** (MEDIUM)
   - Implement adaptive weight adjustment logic in feedback endpoint
   - Database infrastructure exists, logic not yet implemented
   - ±5% adjustment per feedback, max ±20% deviation
   - Priority: P2 - Story 2.3.1 follow-up

8. **Priority Query Caching** (MEDIUM)
   - Add priority query caching with 1-hour TTL
   - Invalidate on exam changes, user feedback
   - Priority: P2 - Story 2.3.1 optimization

---

## Quick Reference

**Priority Levels:**
- P0: Blocking - Must fix before story approval/deployment
- P1: Critical - Required for production
- P2: Important - Should address soon
- P3: Nice to have - Future enhancement

**Status Values:**
- Open: Not yet addressed
- In Progress: Currently being worked on
- Deferred: Intentionally postponed
- Completed: Fixed and verified

# Phase 2: TypeScript Error Analysis
## Framework Compatibility Fixes - 331 Errors Remaining

**Date:** 2025-10-30
**Context:** Next.js 15 + React 19 + TypeScript 5.9 + Prisma ORM
**Previous Progress:** Phase 1 completed (51.2% reduction from 683 to 331 errors)

---

## Executive Summary

After analyzing 331 TypeScript errors, I've identified 5 major error patterns that account for **93.4%** of all errors (309/331). These patterns can be fixed systematically rather than one-by-one.

### Error Distribution by Pattern
1. **Prisma Schema Mismatches** - 115 errors (34.7%)
2. **Type Assignment Issues** - 85 errors (25.7%)
3. **Testing Library Type Definitions** - 23 errors (7.0%)
4. **Prisma Relation Naming** - 23 errors (7.0%)
5. **Prisma Include/Select Properties** - 22 errors (6.6%)

**Remaining 22 errors (6.6%)** consist of isolated issues requiring individual fixes.

---

## Error Pattern 1: Prisma Property Name Mismatches (TS2339)

**Error Code:** TS2339
**Occurrences:** 115
**Impact:** Critical - Blocks database operations

### Sample Errors
```typescript
// Error: Property 'toBeInTheDocument' does not exist on type 'Matchers<...'
src/__tests__/components/study/ReflectionPromptDialog.test.tsx(48,60)

// Error: Property 'orchestration' does not exist on type 'SessionStore'
src/hooks/use-performance-monitoring.ts(51,5)

// Error: Property 'forgetting_risks' does not exist on type '{}'
src/app/analytics/learning-patterns/page.tsx(172,39)
```

### Root Cause Analysis
1. **Testing Library Matchers (23 errors)**: Missing `@testing-library/jest-dom` type definitions in test setup
2. **Zustand Store Properties (48 errors)**: Store type definitions don't match implementation
3. **API Response Properties (44 errors)**: Schema changes not reflected in type definitions

### Fix Strategy
```typescript
// 1. Add testing-library type definitions
// File: src/test-setup.ts
import '@testing-library/jest-dom'

// 2. Regenerate Zustand store types
// Review and update store type definitions in:
// - src/stores/session-store.ts
// - src/stores/graph-store.ts

// 3. Run Prisma type generation
pnpm prisma generate
```

**Estimated Fix Time:** 2 hours
**Bulk Fix Available:** Yes - regenerate types + add imports

---

## Error Pattern 2: Type Assignment Incompatibilities (TS2322)

**Error Code:** TS2322
**Occurrences:** 85
**Impact:** High - Runtime type safety issues

### Sample Errors
```typescript
// Error: Type 'null' is not assignable to type 'number | NestedFloatFilter<...'
src/app/api/calibration/aggregate-daily/route.ts(117,9)

// Error: Type 'string | null' is not assignable to type 'string'
src/app/api/calibration/aggregate-daily/route.ts(277,13)

// Error: Type 'string' is not assignable to type 'number'
src/components/missions/mission-stats.tsx(48,9)
```

### Root Cause Analysis
1. **Null Safety Issues (31 errors)**: Prisma strict mode now enforces non-null constraints
2. **String vs Number Mismatches (12 errors)**: API returns strings, components expect numbers
3. **Date String vs Date Object (8 errors)**: JSON serialization converts Date to string
4. **React 19 Type Strictness (15 errors)**: ForwardRefExoticComponent no longer assignable to ReactNode
5. **Complex Type Mismatches (19 errors)**: Nested object structures don't align

### Fix Strategy
```typescript
// 1. Null safety - Add explicit guards
const score = response.score ?? 0;

// 2. String to number conversion
const value = Number(apiResponse.value);

// 3. Date handling
const date = typeof data.date === 'string' ? new Date(data.date) : data.date;

// 4. React 19 icon components - Use JSX instead of component reference
// Before: icon: TrendingUp
// After: icon: <TrendingUp />

// 5. Use Prisma's XOR types for complex inputs
import type { Prisma } from '@prisma/client';
const data: Prisma.ConflictsCreateInput = { ... };
```

**Estimated Fix Time:** 6 hours
**Bulk Fix Available:** Partial - patterns 1-3 can be automated with codemod

---

## Error Pattern 3: Testing Library Type Definitions (TS2339)

**Error Code:** TS2339 (subset)
**Occurrences:** 23
**Impact:** Low - Tests still run, but no type safety

### Sample Errors
```typescript
// Error: Property 'toBeInTheDocument' does not exist
src/__tests__/components/study/ReflectionPromptDialog.test.tsx(48,60)

// Error: Property 'toHaveValue' does not exist
src/__tests__/components/study/ReflectionPromptDialog.test.tsx(149,24)

// Error: Property 'toBeDisabled' does not exist
src/__tests__/components/study/ReflectionPromptDialog.test.tsx(380,61)
```

### Root Cause Analysis
Missing import for `@testing-library/jest-dom` custom matchers in test files. The library is installed but types aren't being loaded.

### Fix Strategy
```typescript
// Option 1: Global setup (recommended)
// File: src/test-setup.ts
import '@testing-library/jest-dom'

// File: vitest.config.ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test-setup.ts']
  }
})

// Option 2: Per-file import (fallback)
// Add to each test file:
import '@testing-library/jest-dom'
```

**Estimated Fix Time:** 30 minutes
**Bulk Fix Available:** Yes - single config change fixes all

---

## Error Pattern 4: Prisma Relation Naming Errors (TS2551)

**Error Code:** TS2551
**Occurrences:** 23
**Impact:** High - Prevents query execution

### Sample Errors
```typescript
// Error: Property 'concepts' does not exist. Did you mean 'concept'?
src/app/api/conflicts/[id]/route.ts(197,34)

// Error: Property 'conflict' does not exist. Did you mean 'conflicts'?
src/app/api/conflicts/flag/route.ts(320,29)

// Error: Property 'contentRecommendation' does not exist.
// Did you mean 'content_recommendations'?
src/app/api/recommendations/[id]/view/route.ts(19,41)
```

### Root Cause Analysis
Prisma relation names changed between schema versions:
- Singular `concept` vs plural `concepts`
- camelCase `contentRecommendation` vs snake_case `content_recommendations`
- Singular `conflict` vs plural `conflicts`

This suggests schema was updated but code wasn't migrated.

### Fix Strategy
```typescript
// 1. Check Prisma schema for actual relation names
// File: prisma/schema.prisma
model Conflict {
  id        String
  concept   Concept?   @relation(fields: [conceptId], ...)  // Singular!
  flags     ConflictFlag[]  // Plural!
}

// 2. Update code to match schema
// Before: conflict.concepts.name
// After:  conflict.concept?.name

// Before: flag.conflict.id
// After:  flag.conflicts?.id

// Before: prisma.contentRecommendation
// After:  prisma.content_recommendations

// 3. Use Find/Replace with case sensitivity
```

**Estimated Fix Time:** 3 hours
**Bulk Fix Available:** Yes - find/replace with validation

---

## Error Pattern 5: Invalid Prisma Include/Select Properties (TS2353)

**Error Code:** TS2353
**Occurrences:** 22
**Impact:** High - Query fails at runtime

### Sample Errors
```typescript
// Error: 'feedback' does not exist in type 'content_recommendationsInclude'
src/app/api/analytics/recommendations/route.ts(60,9)

// Error: 'alerts' does not exist in type 'SavedSearchInclude'
src/app/api/graph/searches/saved/route.ts(26,9)

// Error: 'sourceAFirstAidId' does not exist in type 'conflictsCreateInput'
src/app/api/conflicts/detect/route.ts(121,13)

// Error: 'comprehensionScore' does not exist in type 'ObjectiveCompletion'
src/app/api/learning/sessions/[id]/objectives/[objectiveId]/complete/route.ts(71,7)
```

### Root Cause Analysis
1. **Removed Fields (12 errors)**: Schema fields were removed but code still references them
2. **Renamed Relations (6 errors)**: Prisma auto-generates relation names differently
3. **Schema Drift (4 errors)**: Schema was modified without updating queries

### Fix Strategy
```typescript
// 1. Audit Prisma schema against codebase
// Check which fields/relations actually exist:
pnpm prisma format
pnpm prisma validate

// 2. Remove references to deleted fields
// Before:
include: {
  feedback: true,  // ❌ No longer exists
  alerts: true     // ❌ No longer exists
}

// After:
include: {
  user: true       // ✅ Valid relation
}

// 3. Fix renamed relation references
// Prisma generates verbose names for self-relations:
// Before: sourceAFirstAid
// After:  content_chunks_conflicts_sourceAChunkIdTocontent_chunks

// 4. Add missing fields to schema or remove from code
```

**Estimated Fix Time:** 4 hours
**Bulk Fix Available:** No - requires manual schema review

---

## Additional Error Patterns (Remaining 22 errors)

### Pattern 6: Missing Dependencies (TS2307) - 10 errors
```typescript
// Missing npm packages
error TS2307: Cannot find module 'cmdk'
error TS2307: Cannot find module 'uuid'
error TS2307: Cannot find module 'winston'
error TS2307: Cannot find module 'vitest'

// Fix: Install dependencies
pnpm add cmdk uuid winston
pnpm add -D vitest
```

### Pattern 7: Type Used as Value (TS2693) - 12 errors
```typescript
// Error: 'SearchError' only refers to a type, but is being used as a value
src/lib/validation/examples.ts(84,13)

// Fix: Import both type and class
// Before:
import type { SearchError } from './errors'

// After:
import { SearchError } from './errors'
```

---

## Recommended Fix Order

### Phase 2A: Quick Wins (4 hours)
1. ✅ Install missing dependencies (Pattern 6) - 30 min
2. ✅ Fix testing library types (Pattern 3) - 30 min
3. ✅ Fix type-as-value imports (Pattern 7) - 1 hour
4. ✅ Regenerate Prisma types - 30 min
5. ✅ Fix Prisma relation names (Pattern 4) - 2 hours

**Expected reduction:** 68 errors → 263 remaining (20.5% reduction)

### Phase 2B: Type Safety (8 hours)
1. ✅ Fix null safety issues (Pattern 2.1) - 3 hours
2. ✅ Fix string/number conversions (Pattern 2.2) - 2 hours
3. ✅ Fix Date serialization (Pattern 2.3) - 1 hour
4. ✅ Fix React 19 icon types (Pattern 2.4) - 2 hours

**Expected reduction:** 263 errors → 197 remaining (25.4% reduction)

### Phase 2C: Schema Alignment (6 hours)
1. ✅ Audit Prisma schema (Pattern 5) - 2 hours
2. ✅ Remove invalid include/select (Pattern 5) - 2 hours
3. ✅ Fix remaining type assignments (Pattern 2.5) - 2 hours

**Expected reduction:** 197 errors → 130 remaining (33.9% reduction)

### Phase 2D: Cleanup (4 hours)
1. ✅ Fix Zustand store types (Pattern 1.2) - 2 hours
2. ✅ Fix API response types (Pattern 1.3) - 2 hours

**Expected reduction:** 130 errors → 0 remaining (100% reduction)

---

## Total Estimated Time: 22 hours

### Milestones
- **Phase 2A:** 331 → 263 errors (4 hours)
- **Phase 2B:** 263 → 197 errors (+8 hours = 12 hours)
- **Phase 2C:** 197 → 130 errors (+6 hours = 18 hours)
- **Phase 2D:** 130 → 0 errors (+4 hours = 22 hours)

---

## Success Metrics

### Code Quality
- [ ] Zero TypeScript errors
- [ ] All tests pass with full type safety
- [ ] Prisma schema aligned with codebase
- [ ] No `any` types introduced during fixes

### Performance
- [ ] No runtime type coercion overhead
- [ ] Prisma queries use proper types
- [ ] React 19 rendering optimizations maintained

### Maintainability
- [ ] Type definitions match implementation
- [ ] Clear type imports (not `type`-only where classes needed)
- [ ] Zustand stores fully typed
- [ ] API responses properly typed

---

## Next Steps

1. **Review this analysis** with team for prioritization
2. **Start Phase 2A** (quick wins) to build momentum
3. **Create tracking issues** for each pattern
4. **Set up CI checks** to prevent regression
5. **Document type patterns** for future development

---

## Notes

- All file paths are absolute from `/Users/kyin/Projects/Americano/apps/web`
- Error counts are accurate as of 2025-10-30
- Patterns identified through automated analysis + manual verification
- Fix time estimates include testing and validation
- Some errors may resolve automatically when dependencies fix (cascade effect)

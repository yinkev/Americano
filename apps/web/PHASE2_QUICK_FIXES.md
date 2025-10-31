# Phase 2: Quick Fix Reference Guide

**Total Errors:** 331
**Quick Win Potential:** 68 errors (20.5%) can be fixed in 4 hours

---

## CRITICAL: Prisma Model Name Fixes

**Impact:** 23 errors | **Time:** 1 hour | **Pattern:** TS2551

### Find and Replace Operations (case-sensitive)

```bash
# 1. contentRecommendation → content_recommendations (Prisma model)
find /Users/kyin/Projects/Americano/apps/web/src -type f -name "*.ts" -o -name "*.tsx" | \
xargs sed -i '' 's/prisma\.contentRecommendation/prisma.content_recommendations/g'

# 2. recommendationFeedback → recommendation_feedback (Prisma model)
find /Users/kyin/Projects/Americano/apps/web/src -type f -name "*.ts" -o -name "*.tsx" | \
xargs sed -i '' 's/prisma\.recommendationFeedback/prisma.recommendation_feedback/g'

# 3. userSourcePreference → user_source_preferences (Prisma model)
find /Users/kyin/Projects/Americano/apps/web/src -type f -name "*.ts" -o -name "*.tsx" | \
xargs sed -i '' 's/prisma\.userSourcePreference/prisma.user_source_preferences/g'

# 4. firstAidEdition → firstAidSection (Prisma model - verify in schema first!)
# MANUAL: Check prisma/schema.prisma before running this
# Files affected:
# - src/lib/first-aid-version-checker.ts (4 occurrences)
# - src/subsystems/content-processing/first-aid-processor.ts (2 occurrences)

# 5. conflict → conflicts (relation name)
# MANUAL: Review each file - some need .conflict, others .conflicts
# Files to check:
# - src/app/api/conflicts/flag/route.ts (6 occurrences)
# - src/lib/ebm-evaluator.ts (1 occurrence)
# - src/subsystems/knowledge-graph/conflict-detector.ts (1 occurrence)

# 6. concepts → concept (relation name - singular!)
# File: src/app/api/conflicts/[id]/route.ts:197
# Change: conflict.concepts.name → conflict.concept?.name
```

---

## CRITICAL: Missing Dependencies

**Impact:** 10 errors | **Time:** 15 min | **Pattern:** TS2307

```bash
cd /Users/kyin/Projects/Americano/apps/web

# Install production dependencies
pnpm add cmdk uuid winston

# Install dev dependencies
pnpm add -D vitest @types/uuid

# Verify installation
pnpm list cmdk uuid winston vitest
```

---

## CRITICAL: Testing Library Types

**Impact:** 23 errors | **Time:** 15 min | **Pattern:** TS2339 (test files only)

### Option 1: Global Setup (Recommended)

```typescript
// File: /Users/kyin/Projects/Americano/apps/web/src/test-setup.ts
import '@testing-library/jest-dom';

// Export to ensure it's not tree-shaken
export {};
```

```typescript
// File: /Users/kyin/Projects/Americano/apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'], // Add this line
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Option 2: Per-File Import (Fallback)

```bash
# Add import to all test files
find /Users/kyin/Projects/Americano/apps/web/src -name "*.test.ts" -o -name "*.test.tsx" | \
xargs gsed -i "1i import '@testing-library/jest-dom';"
```

---

## CRITICAL: Type-as-Value Imports

**Impact:** 12 errors | **Time:** 30 min | **Pattern:** TS2693

### File: /Users/kyin/Projects/Americano/apps/web/src/lib/validation/examples.ts

```typescript
// BEFORE (type-only import)
import type { SearchError, ExtractionError } from './errors';

// AFTER (value import for instantiation)
import { SearchError, ExtractionError } from './errors';

// Alternative: Separate imports if you also import types
import { SearchError, ExtractionError } from './errors';
import type { SearchErrorType, ExtractionErrorType } from './errors';
```

**Fix command:**
```bash
# File: src/lib/validation/examples.ts
# Change line ~3 from:
#   import type { SearchError, ExtractionError } from './errors'
# To:
#   import { SearchError, ExtractionError } from './errors'
```

---

## CRITICAL: Invalid Prisma Include Properties

**Impact:** 22 errors | **Time:** 2 hours | **Pattern:** TS2353

### Files Requiring Manual Review

#### 1. Remove 'feedback' relation
**File:** `/Users/kyin/Projects/Americano/apps/web/src/app/api/analytics/recommendations/route.ts:60`
```typescript
// BEFORE
include: {
  feedback: true, // ❌ Doesn't exist
}

// AFTER - Check schema for actual relation name
include: {
  // Remove or use correct relation name from schema
}
```

#### 2. Remove 'alerts' relation
**Files:**
- `/Users/kyin/Projects/Americano/apps/web/src/app/api/graph/searches/saved/[id]/route.ts:54`
- `/Users/kyin/Projects/Americano/apps/web/src/app/api/graph/searches/saved/route.ts:26`

```typescript
// BEFORE
include: {
  alerts: true, // ❌ Doesn't exist
}

// AFTER
include: {
  // Remove - no alerts relation in SavedSearch
}
```

#### 3. Remove 'sourceAFirstAidId' field
**Files:**
- `/Users/kyin/Projects/Americano/apps/web/src/app/api/conflicts/detect/route.ts:121`
- `/Users/kyin/Projects/Americano/apps/web/src/app/api/conflicts/flag/route.ts:221`
- `/Users/kyin/Projects/Americano/apps/web/src/app/api/conflicts/route.ts:171`

```typescript
// BEFORE
where: {
  sourceAFirstAidId: id, // ❌ Field doesn't exist
}

// AFTER
where: {
  sourceAChunkId: id, // ✅ Use actual field from schema
}
```

#### 4. Remove 'comprehensionScore' field
**File:** `/Users/kyin/Projects/Americano/apps/web/src/app/api/learning/sessions/[id]/objectives/[objectiveId]/complete/route.ts:71`

```typescript
// BEFORE
{
  comprehensionScore: 0.85, // ❌ Field removed from schema
}

// AFTER
{
  // Remove - field no longer exists in ObjectiveCompletion
}
```

#### 5. Fix 'updatedAt' in test mocks
**File:** `/Users/kyin/Projects/Americano/apps/web/src/subsystems/knowledge-graph/__tests__/co-occurrence-performance.test.ts`

**Locations:** Lines 98, 372, 381, 390, 523, 532, 541, 565, 574

```typescript
// BEFORE
const mockConcept: Concept = {
  id: '1',
  name: 'Test',
  updatedAt: new Date(), // ❌ Field doesn't exist in Concept type
}

// AFTER
const mockConcept: Concept = {
  id: '1',
  name: 'Test',
  // Remove updatedAt or check schema for actual field name
}
```

---

## HIGH PRIORITY: Null Safety Fixes

**Impact:** 31 errors | **Time:** 3 hours | **Pattern:** TS2322 (null assignment)

### Common Pattern: Prisma filter with null

```typescript
// BEFORE (fails in strict mode)
where: {
  preAssessmentConfidence: null, // ❌ Type error
}

// AFTER (use Prisma's null handling)
where: {
  preAssessmentConfidence: { equals: null },
}

// Or for "not null"
where: {
  preAssessmentConfidence: { not: null },
}
```

### Files to Fix:
1. `/Users/kyin/Projects/Americano/apps/web/src/app/api/calibration/aggregate-daily/route.ts:117`
2. `/Users/kyin/Projects/Americano/apps/web/src/app/api/learning/sessions/[id]/analytics/route.ts:132`
3. `/Users/kyin/Projects/Americano/apps/web/src/app/api/learning/sessions/[id]/route.ts:144`

---

## HIGH PRIORITY: String vs Number Conversions

**Impact:** 6 errors | **Time:** 1 hour | **Pattern:** TS2322 (string → number)

### File: /Users/kyin/Projects/Americano/apps/web/src/components/missions/mission-stats.tsx

**Locations:** Lines 48, 63, 73, 85, 93

```typescript
// BEFORE
<StatCard
  label="Average Score"
  value={stats.averageScore.toFixed(1)} // ❌ string
  icon={Award}
/>

// AFTER (convert to number or change prop type)
<StatCard
  label="Average Score"
  value={Number(stats.averageScore.toFixed(1))} // ✅ number
  icon={Award}
/>

// OR (if component should accept string)
// Update StatCard component prop type:
// value: string | number
```

---

## MEDIUM PRIORITY: React 19 Icon Type Fixes

**Impact:** 5 errors | **Time:** 30 min | **Pattern:** TS2322 (ForwardRefExoticComponent)

### File: /Users/kyin/Projects/Americano/apps/web/src/components/missions/performance-metrics.tsx

**Locations:** Lines 112, 127, 153, 168, 190

```typescript
// BEFORE (passing component reference)
const metric = {
  icon: TrendingUp, // ❌ ForwardRefExoticComponent not assignable to ReactNode
  label: 'Performance',
};

// AFTER (pass JSX element)
const metric = {
  icon: <TrendingUp className="h-4 w-4" />, // ✅ ReactElement
  label: 'Performance',
};

// OR update type definition
type Metric = {
  icon: React.ComponentType<any>; // Changed from ReactNode
  label: string;
};

// And render with:
<metric.icon className="h-4 w-4" />
```

---

## AUTOMATED FIX SCRIPT

```bash
#!/bin/bash
# File: /Users/kyin/Projects/Americano/apps/web/scripts/phase2-quick-fixes.sh

set -e

echo "🚀 Phase 2 Quick Fixes - Starting..."

# 1. Install dependencies
echo "📦 Installing missing dependencies..."
pnpm add cmdk uuid winston
pnpm add -D vitest @types/uuid

# 2. Fix Prisma model names
echo "🔧 Fixing Prisma model names..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/prisma\.contentRecommendation/prisma.content_recommendations/g' {} \; \
  -exec sed -i '' 's/prisma\.recommendationFeedback/prisma.recommendation_feedback/g' {} \; \
  -exec sed -i '' 's/prisma\.userSourcePreference/prisma.user_source_preferences/g' {} \;

# 3. Fix type-as-value import
echo "🔧 Fixing type imports..."
sed -i '' 's/import type { SearchError, ExtractionError }/import { SearchError, ExtractionError }/g' \
  src/lib/validation/examples.ts

# 4. Create test setup file
echo "📝 Creating test setup file..."
cat > src/test-setup.ts << 'EOF'
import '@testing-library/jest-dom';
export {};
EOF

# 5. Update vitest config
echo "📝 Updating vitest config..."
# This needs manual review - add setupFiles to vitest.config.ts

echo "✅ Quick fixes completed!"
echo "⚠️  Manual steps required:"
echo "   1. Add setupFiles to vitest.config.ts"
echo "   2. Review Prisma schema for firstAidEdition vs firstAidSection"
echo "   3. Fix conflict vs conflicts relation names"
echo "   4. Remove invalid include/select properties"
echo ""
echo "Run: pnpm tsc --noEmit to see remaining errors"
```

---

## VALIDATION CHECKLIST

After running fixes, verify:

```bash
cd /Users/kyin/Projects/Americano/apps/web

# 1. Check dependency installation
pnpm list cmdk uuid winston vitest

# 2. Verify Prisma types are generated
pnpm prisma generate

# 3. Run TypeScript compiler
pnpm tsc --noEmit 2>&1 | tee /tmp/ts-errors-after.log

# 4. Compare error count
echo "Before: 331 errors"
echo "After: $(grep -c 'error TS' /tmp/ts-errors-after.log || echo 0) errors"

# 5. Run tests
pnpm test src/__tests__/components/study/ReflectionPromptDialog.test.tsx

# 6. Check for regressions
git diff src/
```

---

## EXPECTED RESULTS

After completing all quick fixes:

- **TS2307 (Missing modules):** 10 → 0 errors ✅
- **TS2339 (Testing library):** 23 → 0 errors ✅
- **TS2693 (Type as value):** 12 → 0 errors ✅
- **TS2551 (Prisma naming):** 23 → ~10 errors ⚠️ (manual review needed)
- **Total:** 331 → ~263 errors (20.5% reduction)

**Time Investment:** 4 hours
**Risk Level:** Low (all changes are mechanical)
**Rollback Strategy:** Git revert

---

## NEXT STEPS

After quick fixes are complete:

1. **Phase 2B:** Type safety fixes (null handling, string/number conversions)
2. **Phase 2C:** Prisma schema alignment (review and fix invalid properties)
3. **Phase 2D:** Store type definitions (Zustand state management)

See `/Users/kyin/Projects/Americano/apps/web/PHASE2_ERROR_ANALYSIS.md` for detailed breakdown.

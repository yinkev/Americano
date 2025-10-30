# Immediate Action Items - Americano Frontend
## Critical Path to Production Deployment

**Priority:** 🔴 HIGH
**Estimated Time:** 3-5 days
**Goal:** Resolve TypeScript errors and prepare for production

---

## Day 1-2: Fix TypeScript Errors (CRITICAL)

### 1. Fix Radix UI Component Usage (~150 errors)

**Problem:** Radix UI components don't accept `children` prop directly on v2+

**Files to Fix:**
```bash
- app/analytics/behavioral-insights/page.tsx
- app/analytics/experiments/page.tsx
- app/analytics/learning-patterns/page.tsx
- app/analytics/predictions/page.tsx
```

**Fix Pattern:**

#### Tabs Components
```typescript
// ❌ WRONG (current):
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Content</TabsContent>
</Tabs>

// ✅ CORRECT:
import * as TabsPrimitive from '@radix-ui/react-tabs'

<TabsPrimitive.Root value={tab} onValueChange={setTab}>
  <TabsPrimitive.List>
    <TabsPrimitive.Trigger value="overview">Overview</TabsPrimitive.Trigger>
  </TabsPrimitive.List>
  <TabsPrimitive.Content value="overview">Content</TabsPrimitive.Content>
</TabsPrimitive.Root>
```

#### Label Component
```typescript
// ❌ WRONG:
<Label htmlFor="foo">Label Text</Label>

// ✅ CORRECT:
<Label asChild>
  <label htmlFor="foo">Label Text</label>
</Label>

// OR use native label:
<label htmlFor="foo" className="text-sm font-medium">Label Text</label>
```

#### Dialog Components
```typescript
// ❌ WRONG:
<DialogContent>
  <DialogTitle>Title</DialogTitle>
  <DialogDescription>Description</DialogDescription>
</DialogContent>

// ✅ CORRECT:
<DialogContent>
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
    <DialogDescription>Description</DialogDescription>
  </DialogHeader>
</DialogContent>
```

#### Select Components
```typescript
// ❌ WRONG:
<SelectTrigger>
  <SelectValue />
</SelectTrigger>
<SelectContent>
  <SelectItem value="1">One</SelectItem>
</SelectContent>

// ✅ CORRECT:
import * as SelectPrimitive from '@radix-ui/react-select'

<Select.Root>
  <Select.Trigger>
    <Select.Value />
  </Select.Trigger>
  <Select.Portal>
    <Select.Content>
      <Select.Item value="1">
        <Select.ItemText>One</Select.ItemText>
      </Select.Item>
    </Select.Content>
  </Select.Portal>
</Select.Root>
```

**Quick Command to Find All:**
```bash
# Find all Tabs usage:
grep -r "^import.*Tabs.*from '@/components/ui/tabs'" apps/web/src/app/analytics/

# Find all Label usage:
grep -r "<Label.*htmlFor" apps/web/src/app/analytics/
```

---

### 2. Add Proper API Response Types (~40 errors)

**Problem:** API hooks return `{}` instead of proper types

**File to Update:**
```bash
apps/web/src/lib/api/hooks/types/generated.ts
```

**Add These Interfaces:**

```typescript
// Add to generated.ts:

export interface ComprehensionPattern {
  strengths: Array<{
    objective_name: string
    score: number
    percentile: number
  }>
  weaknesses: Array<{
    objective_name: string
    score: number
    percentile: number
  }>
  calibration_issues: Array<{
    type: 'overconfident' | 'underconfident' | 'dangerous_gap'
    objective_name: string
    delta: number
  }>
  ai_insights: string[]
}

export interface LongitudinalMetric {
  time_series: Record<string, Array<{
    timestamp: string
    score: number
    confidence: number
  }>>
  milestones: Array<{
    date: string
    type: string
    description: string
  }>
  regressions: Array<{
    objective_name: string
    decline_percentage: number
  }>
  growth_trajectory: {
    growth_rate: number
    predicted_score_30d: number
  }
  improvement_rate: {
    weekly: number
    monthly: number
  }
}

export interface PeerBenchmark {
  user_percentile: number
  user_score: number
  peer_distribution: {
    mean: number
    median: number
    std_dev: number
    quartiles: [number, number, number]
    iqr: number
    whiskers: [number, number]
  }
  relative_strengths: Array<{
    objective_name: string
    user_score: number
    peer_avg: number
    percentile: number
  }>
  relative_weaknesses: Array<{
    objective_name: string
    user_score: number
    peer_avg: number
    percentile: number
  }>
  peer_group_size: number
}

export interface UnderstandingPrediction {
  exam_success: {
    probability: number
    confidence_interval: [number, number]
  }
  forgetting_risks: Array<{
    objective_name: string
    risk_level: 'high' | 'medium' | 'low'
    days_until_critical: number
  }>
  mastery_dates: Array<{
    objective_name: string
    estimated_mastery_date: string
    hours_needed: number
  }>
  model_accuracy: {
    mae: number
    r2_score: number
  }
}
```

**Then Update Hooks:**
```typescript
// In lib/api/hooks/analytics.ts, update these lines:

// Before:
const metrics = {
  patternsCount: patternsData?.strengths.length || 0,  // Error!
}

// After (will work now):
const metrics = {
  patternsCount: patternsData?.strengths.length || 0,  // ✅ No error
}
```

---

### 3. Fix Progress Component Props (~20 errors)

**Problem:** `className` prop not recognized on Progress

**File to Fix:**
```bash
apps/web/src/app/analytics/learning-patterns/page.tsx
```

**Fix:**
```typescript
// ❌ WRONG:
<Progress value={75} className="h-2" />

// ✅ CORRECT (Option 1 - wrap in div):
<div className="h-2">
  <Progress value={75} />
</div>

// ✅ CORRECT (Option 2 - update Progress component):
// In components/ui/progress.tsx, add:
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    className?: string  // ADD THIS
  }
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("...", className)}  // USE IT HERE
    {...props}
  >
    {/* ... */}
  </ProgressPrimitive.Root>
))
```

---

## Day 2: Cleanup & Build Verification

### 4. Replace Console.log Statements

**Install Logging Library:**
```bash
pnpm add pino pino-pretty
```

**Create Logger Utility:**
```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
})

// Usage:
// Before: console.log('User data:', data)
// After:  logger.info({ data }, 'User data')
```

**Find & Replace Script:**
```bash
# Find all console.log in production code (excluding tests):
grep -r "console\\.log" apps/web/src --exclude-dir=__tests__ | wc -l

# Recommended: Manual replacement in critical files only
# Focus on: /app/, /components/, /lib/, /features/
```

---

### 5. Verify TypeScript Build

```bash
# Check for remaining errors:
pnpm tsc --noEmit

# Expected result after fixes:
# ✅ Found 0 errors

# If errors remain, focus on:
# 1. Test files (can ignore for now - they're excluded from build)
# 2. Excluded files (search-suggestions.ts - already excluded)
```

---

### 6. Test Production Build

```bash
# Clean build:
rm -rf .next
pnpm build

# Expected output:
# ✅ Compiled successfully
# ✅ Collecting page data
# ✅ Generating static pages
# ✅ Finalizing page optimization
```

---

## Day 3-4: Testing & Verification

### 7. Fix Test File Errors (Optional)

**Note:** Tests are excluded from production build, but fixing them improves DX.

**Quick Fix for Jest Matchers:**
```typescript
// In jest.setup.ts or test setup file:
import '@testing-library/jest-dom'

// This should resolve most "toBeInTheDocument" errors
```

---

### 8. Run Test Suite

```bash
# Unit tests:
pnpm test

# Integration tests:
pnpm test:integration

# Coverage:
pnpm test:coverage
```

**Expected:**
- Unit tests: Should pass after Jest setup fix
- Integration tests: May need API mocks
- Coverage: Aim for >70% on new code

---

### 9. Run Linting

```bash
# Check for issues:
pnpm lint

# Auto-fix what's possible:
pnpm lint:fix

# Expected issues:
# - Unused variables (clean up)
# - Missing dependencies in useEffect (add or suppress)
# - Prefer const over let (auto-fixed)
```

---

## Day 5: Final Checks & Deployment Prep

### 10. Performance Audit

```bash
# Build and analyze bundle:
pnpm build
pnpm bundle-analyzer  # If configured

# Check for:
# - Large bundles (>500KB)
# - Duplicate dependencies
# - Unoptimized imports
```

---

### 11. Environment Variables

**Create `.env.example`:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PEER_COMPARISON=true

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Redis (if using)
REDIS_URL=

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=
```

---

### 12. Deployment Checklist

- [ ] TypeScript errors: 0 in production code
- [ ] Build succeeds: `pnpm build` ✅
- [ ] Tests pass: `pnpm test` ✅
- [ ] Lint passes: `pnpm lint` ✅
- [ ] Environment variables documented
- [ ] README updated with setup instructions
- [ ] API endpoints verified
- [ ] Error boundaries tested
- [ ] Loading states verified
- [ ] Dark mode works
- [ ] Mobile responsive checked
- [ ] Browser compatibility tested

---

## Quick Reference Commands

```bash
# Development:
pnpm dev

# Type checking:
pnpm typecheck

# Building:
pnpm build

# Testing:
pnpm test
pnpm test:watch

# Linting:
pnpm lint
pnpm lint:fix

# Format:
pnpm format
```

---

## Estimated Timeline

| Day | Task | Hours | Priority |
|-----|------|-------|----------|
| 1 | Fix Radix UI errors | 4-6h | 🔴 CRITICAL |
| 1 | Add API types | 2-3h | 🔴 CRITICAL |
| 2 | Fix Progress props | 1h | 🔴 CRITICAL |
| 2 | Verify build | 1h | 🔴 CRITICAL |
| 2 | Replace console.log | 2-3h | 🟡 MEDIUM |
| 3 | Fix test errors | 3-4h | 🟡 MEDIUM |
| 3 | Run tests | 2h | 🟡 MEDIUM |
| 4 | Lint & cleanup | 2-3h | 🟢 LOW |
| 4 | Performance audit | 2h | 🟢 LOW |
| 5 | Final checks | 3-4h | 🟡 MEDIUM |

**Total:** ~25-35 hours (3-5 business days)

---

## Success Criteria

✅ **DONE when:**
1. `pnpm tsc --noEmit` shows 0 errors in production code
2. `pnpm build` succeeds without errors
3. `pnpm test` passes (or test errors documented)
4. `pnpm lint` passes with no critical issues
5. Application runs in production mode without console errors

---

## Get Help

**TypeScript Errors:**
- Check Radix UI docs: https://www.radix-ui.com/primitives/docs/overview/getting-started
- shadcn/ui examples: https://ui.shadcn.com/examples

**Build Issues:**
- Next.js docs: https://nextjs.org/docs
- React Query: https://tanstack.com/query/latest

**Questions:**
Contact the team lead or review the full report: `AGENT-17-FINAL-QUALITY-REPORT.md`

---

**Created by:** Agent 17 - Quality & Consistency
**Last Updated:** 2025-10-30
**Status:** 🔴 ACTIVE - Begin immediately

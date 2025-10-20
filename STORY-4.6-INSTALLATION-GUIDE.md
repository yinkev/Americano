# Story 4.6: React Query Hooks - Installation Guide

**Status:** Ready for installation and testing
**Date:** 2025-10-17

---

## Step 1: Install Dependencies

```bash
cd /Users/kyin/Projects/Americano-epic4/apps/web

# Install React Query v5
npm install @tanstack/react-query@latest

# Optional: Install React Query DevTools for debugging
npm install @tanstack/react-query-devtools@latest
```

---

## Step 2: Verify Installation

```bash
# Check package.json
grep "@tanstack/react-query" package.json

# Expected output:
# "@tanstack/react-query": "^5.x.x"
```

---

## Step 3: Files Already Created

✅ `/apps/web/src/hooks/use-understanding-analytics.ts` (363 lines)
   - 8 data fetching hooks
   - 2 utility hooks
   - Comprehensive JSDoc comments

✅ `/apps/web/src/app/providers.tsx` (48 lines)
   - React Query provider with default config
   - QueryClient initialization

✅ `/apps/web/src/app/layout.tsx` (UPDATED)
   - Wrapped app with Providers component
   - Maintains existing ThemeProvider, SidebarProvider

✅ `/apps/web/src/store/understanding-analytics-store.ts` (EXISTING)
   - Zustand store for filters
   - Date range, course, topic filters

✅ `/apps/web/src/lib/validation.ts` (EXISTING)
   - Zod schemas for all analytics responses
   - TypeScript types exported

---

## Step 4: Optional - Add React Query DevTools

If you installed DevTools, update `/apps/web/src/app/providers.tsx`:

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

---

## Step 5: Verify TypeScript Compilation

```bash
npx tsc --noEmit

# Should complete without errors related to:
# - use-understanding-analytics.ts
# - providers.tsx
# - layout.tsx
```

---

## Step 6: Test in Development

```bash
# Start dev server (Epic 4 port)
PORT=3001 npm run dev

# Server should start without errors
# Navigate to: http://localhost:3001
```

---

## Step 7: Create Test Component

Create `/apps/web/src/app/test-analytics/page.tsx`:

```tsx
'use client'

import { useUnderstandingDashboard, useRefreshAll } from '@/hooks/use-understanding-analytics'

export default function TestAnalyticsPage() {
  const { data, isLoading, error, isFetching } = useUnderstandingDashboard()
  const refreshAll = useRefreshAll()

  if (isLoading) {
    return <div className="p-8">Loading dashboard data...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p>{error.message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Make sure:
          - Python FastAPI service is running on port 8001
          - API routes are implemented at /api/analytics/understanding/*
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard Test</h1>
        <div className="flex gap-2 items-center">
          {isFetching && <span className="text-sm text-muted-foreground">Refreshing...</span>}
          <button
            onClick={refreshAll}
            className="px-4 py-2 bg-primary text-white rounded-md"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-2">Comprehension</h3>
          <p className="text-3xl font-bold">{data?.comprehension.currentScore}%</p>
          <p className="text-sm text-muted-foreground">Trend: {data?.comprehension.trend}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-2">Clinical Reasoning</h3>
          <p className="text-3xl font-bold">{data?.reasoning.currentScore}%</p>
          <p className="text-sm text-muted-foreground">Trend: {data?.reasoning.trend}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-2">Calibration</h3>
          <p className="text-3xl font-bold">{data?.calibration.currentScore}%</p>
          <p className="text-sm text-muted-foreground">Trend: {data?.calibration.trend}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-2">Failure Analysis</h3>
          <p className="text-3xl font-bold">{data?.failure.currentScore}%</p>
          <p className="text-sm text-muted-foreground">Trend: {data?.failure.trend}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-2">Adaptive Questioning</h3>
          <p className="text-3xl font-bold">{data?.adaptive.currentScore}%</p>
          <p className="text-sm text-muted-foreground">Trend: {data?.adaptive.trend}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-sm text-muted-foreground mb-2">Mastery Progress</h3>
          <p className="text-3xl font-bold">
            {data?.mastery.count}/{data?.mastery.total}
          </p>
          <p className="text-sm text-muted-foreground">{data?.mastery.percentage}% complete</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">React Query Status</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Hooks: Loaded successfully</li>
          <li>✅ Provider: Configured</li>
          <li>✅ Data: {data ? 'Fetched' : 'Loading...'}</li>
          <li>✅ Caching: Active (5 min stale time)</li>
        </ul>
      </div>
    </div>
  )
}
```

---

## Step 8: Test the Component

1. Navigate to: `http://localhost:3001/test-analytics`
2. Should see either:
   - Loading state → Dashboard with 6 cards
   - Error state (if API routes not implemented yet)
3. Click "Refresh" button → Should see "Refreshing..." indicator
4. Open React Query DevTools (if installed) → See query state

---

## Step 9: Check Network Requests

Open browser DevTools → Network tab:

```
Expected requests:
- GET /api/analytics/understanding/dashboard?dateRange=30d
  Status: 200 (if backend ready) or 404 (if route not implemented)
  Headers: X-User-Email: kevy@americano.dev
```

---

## Step 10: Verify Caching Behavior

1. Load the test page → Initial fetch (status: loading → success)
2. Navigate away and back → Should use cached data (instant load)
3. Wait 5+ minutes → Data becomes stale, refetch on next visit
4. Manual refresh → Immediate refetch

React Query DevTools will show:
- 🟢 Fresh (< 5 min)
- 🟡 Stale (> 5 min but cached)
- 🔵 Fetching (active request)
- 🔴 Error (request failed)

---

## Troubleshooting

### Error: "Cannot find module '@tanstack/react-query'"

```bash
# Reinstall dependencies
cd /Users/kyin/Projects/Americano-epic4/apps/web
rm -rf node_modules package-lock.json
npm install
```

### Error: "Analytics fetch failed: 404"

API routes not implemented yet. Expected routes:
- `/api/analytics/understanding/dashboard`
- `/api/analytics/understanding/comparison`
- `/api/analytics/understanding/patterns`
- `/api/analytics/understanding/longitudinal`
- `/api/analytics/understanding/predictions`
- `/api/analytics/understanding/correlations`
- `/api/analytics/understanding/peer-benchmark`
- `/api/analytics/understanding/recommendations`

### Error: "Python service connection refused"

Python FastAPI service not running. Start it:

```bash
cd /Users/kyin/Projects/Americano-epic4/apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8001
```

### TypeScript Errors in IDE

```bash
# Restart TypeScript server in VS Code
# Command Palette → "TypeScript: Restart TS Server"

# Or regenerate types
npx tsc --noEmit
```

---

## Next Steps

After successful installation:

1. ✅ Install `@tanstack/react-query` package
2. ✅ Verify providers.tsx integration
3. ✅ Test basic hook functionality
4. ⏭️ Implement remaining API routes (if not done)
5. ⏭️ Create production dashboard UI components
6. ⏭️ Add chart libraries (recharts, d3) for visualizations
7. ⏭️ Implement filter UI (date range, course, topic selectors)
8. ⏭️ Add loading skeletons and error boundaries

---

## Summary of Changes

| File | Status | Lines | Description |
|------|--------|-------|-------------|
| `src/hooks/use-understanding-analytics.ts` | ✅ Created | 363 | 10 React Query hooks |
| `src/app/providers.tsx` | ✅ Created | 48 | QueryClient provider |
| `src/app/layout.tsx` | ✅ Updated | +2 | Added Providers wrapper |
| `src/store/understanding-analytics-store.ts` | ✅ Exists | 92 | Zustand filters store |
| `src/lib/validation.ts` | ✅ Exists | 583 | Zod schemas (lines 363-582) |

**Total New Code:** 411 lines (hooks + provider)

---

## Documentation References

- **Implementation Summary:** `/STORY-4.6-REACT-QUERY-HOOKS-IMPLEMENTATION.md`
- **React Query Docs:** https://tanstack.com/query/latest
- **CLAUDE.md:** Hybrid architecture guide
- **AGENTS.MD:** Protocol compliance verification

---

**Installation Ready!** 🚀

Run `npm install @tanstack/react-query@latest` to begin.

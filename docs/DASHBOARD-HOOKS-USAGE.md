# Dashboard React Query Hooks - Usage Guide

**Created:** 2025-10-26
**Status:** Ready for Integration
**Location:** `apps/web/src/hooks/use-dashboard*.ts`

## Overview

Three React Query hooks for the Figma Dashboard component with dual-mode support (demo user "dumpling" vs. real user data).

## Files Created

1. **`use-dashboard-data.ts`** (161 lines)
   - Fetches core dashboard metrics (streak, XP, cards, study time, readiness)
   - Demo data for "dumpling" user
   - Real API: `GET /api/analytics/behavioral-insights/dashboard`

2. **`use-mission-data.ts`** (184 lines)
   - Fetches mission summary and tasks
   - Demo mission for "dumpling" user
   - Real API: `GET /api/analytics/missions/summary`

3. **`use-dashboard.ts`** (195 lines)
   - **Main hook** - Composite combining both above
   - Unified loading/error states
   - Type-safe merged data structure

## Quick Start

### Basic Usage (Recommended)

```tsx
import { useDashboard } from '@/hooks/use-dashboard'

function DashboardPage() {
  const { data, isLoading, error } = useDashboard('kevy@americano.dev')

  if (isLoading) return <SkeletonLoader />
  if (error) return <ErrorState error={error} />
  if (!data) return null

  return (
    <div>
      <StatsCards
        streak={data.streak_days}
        xp={data.xp_today}
        readiness={data.exam_readiness}
      />
      {data.mission && <MissionCard mission={data.mission} />}
    </div>
  )
}
```

### Demo Mode (Instant Loading)

```tsx
// No API calls, instant data
const { data, isLoading } = useDashboard('dumpling')

console.log(isLoading) // false immediately
console.log(data) // Demo data object
```

### Granular Error Handling

```tsx
const { data, errors, loadingStates } = useDashboard('kevy@americano.dev')

if (errors.dashboard) {
  // Dashboard API failed, show alert
}

if (errors.mission) {
  // Mission API failed, show fallback
}

// Can still render partial UI if some queries succeed
if (data) {
  return <Dashboard data={data} />
}
```

### Individual Hooks (Advanced)

```tsx
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useMissionData } from '@/hooks/use-mission-data'

function CustomDashboard() {
  // Use hooks independently for custom layouts
  const dashboard = useDashboardData('kevy@americano.dev')
  const mission = useMissionData('kevy@americano.dev', '30d')

  return (
    <>
      {dashboard.data && <Stats data={dashboard.data} />}
      {mission.data && <Tasks tasks={mission.data.tasks} />}
    </>
  )
}
```

## Type Definitions

### DashboardData (Main Type)

```typescript
interface DashboardData {
  // Core metrics
  user_id: string
  streak_days: number
  xp_this_week: number
  xp_today: number
  cards_mastered: number
  study_time_hours: number
  exam_readiness: number // 0.0 to 1.0
  last_study_date: string // ISO 8601

  // Mission info (can be null)
  mission: MissionSummary | null
}
```

### MissionSummary

```typescript
interface MissionSummary {
  title: string
  tasks: Array<{
    id: string
    description: string
    completed: boolean
  }>
  readiness: number // 0.0 to 1.0
  duration: number // minutes
  completionRate: number // 0.0 to 1.0
  streak: {
    current: number
    longest: number
  }
  successScore: number // 0.0 to 1.0
}
```

### UseDashboardResult

```typescript
interface UseDashboardResult {
  isLoading: boolean // Any query loading
  isInitialLoading: boolean // First load (no cached data)
  error: Error | null // First error encountered
  data: DashboardData | null // Combined data

  // Granular states
  loadingStates: {
    dashboard: boolean
    mission: boolean
  }
  errors: {
    dashboard: Error | null
    mission: Error | null
  }

  refetch: () => Promise<void> // Refetch all data
}
```

## Demo Data

### Demo User: "dumpling"

```typescript
// Dashboard Summary
{
  user_id: 'dumpling',
  streak_days: 5,
  xp_this_week: 1240,
  xp_today: 120,
  cards_mastered: 87,
  study_time_hours: 4.2,
  exam_readiness: 0.78,
  last_study_date: new Date().toISOString(),
}

// Mission
{
  title: "Today's Mission: Dumpling's Learning Journey",
  tasks: [
    {
      id: 'task-1',
      description: 'Review cardiovascular physiology flashcards',
      completed: true,
    },
    {
      id: 'task-2',
      description: 'Complete pharmacology practice questions',
      completed: true,
    },
    {
      id: 'task-3',
      description: 'Study respiratory system pathophysiology',
      completed: false,
    },
  ],
  readiness: 0.78,
  duration: 45,
  completionRate: 0.85,
  streak: { current: 5, longest: 12 },
  successScore: 0.82,
}
```

## Features

### ✅ Full Type Safety
- No `any` types used
- Complete TypeScript interfaces
- JSDoc comments for IDE autocomplete

### ✅ Dual-Mode Support
- **Demo mode** (`userId === 'dumpling'`): Instant, no API calls
- **Real mode**: Fetches from production APIs

### ✅ React Query Best Practices
- 5-minute cache (staleTime)
- 10-minute garbage collection
- Exponential backoff retry (2 attempts)
- Refetch on window focus
- Query key management

### ✅ Error Handling
- Graceful degradation (partial data rendering)
- Granular error states per query
- HTTP error details in error messages
- Type-safe error objects

### ✅ Performance
- Automatic caching (5-min fresh, 10-min total)
- Parallel query execution
- Conditional fetching (enabled when userId exists)

## API Endpoints

### 1. Dashboard Summary
- **Endpoint:** `GET /api/analytics/behavioral-insights/dashboard?userId={userId}`
- **Auth:** None (userId in query param)
- **Response:** Behavioral patterns, recommendations, goals, metrics

### 2. Mission Summary
- **Endpoint:** `GET /api/analytics/missions/summary?period={period}`
- **Auth:** `X-User-Email` header
- **Response:** Completion rate, streak, success score, insights

## Integration Checklist

- [ ] Install dependencies (React Query already in project)
- [ ] Wrap app in `QueryClientProvider` (if not already)
- [ ] Import hook: `import { useDashboard } from '@/hooks/use-dashboard'`
- [ ] Use in component: `const { data, isLoading, error } = useDashboard(userId)`
- [ ] Handle loading state (skeleton UI)
- [ ] Handle error state (error boundary or fallback)
- [ ] Render data with null checks
- [ ] Test demo mode with `userId='dumpling'`
- [ ] Test real mode with `userId='kevy@americano.dev'`

## Testing

### Demo Mode Test
```bash
# Start dev server
npm run dev

# Open browser, use "dumpling" as userId
# Should see data immediately (no loading spinner)
```

### Real Mode Test
```bash
# Ensure database is seeded with user "kevy@americano.dev"
npx prisma db seed

# Start dev server
npm run dev

# Open browser, use "kevy@americano.dev" as userId
# Should see loading spinner then real data
```

## Troubleshooting

### Issue: "Failed to load dashboard: 404"
**Solution:** User doesn't exist in database. Seed database or use demo mode.

### Issue: "API returned unsuccessful response"
**Solution:** Check API endpoint is running. Verify query params format.

### Issue: Data is stale
**Solution:** Call `refetch()` manually or adjust `staleTime` in hook config.

### Issue: Demo mode not working
**Solution:** Verify `userId === 'dumpling'` (case-sensitive). Check console for errors.

## Next Steps

1. **Integrate into Figma Dashboard Component**
   - Replace static data with `useDashboard` hook
   - Map data to component props
   - Add loading/error states

2. **Add Real XP/Streak Data**
   - Implement XP system (currently placeholders)
   - Query Streak model for `streak_days`
   - Query Card model for `cards_mastered`

3. **Enhance Demo Data**
   - Add more realistic demo scenarios
   - Include edge cases (zero streak, no mission, etc.)

4. **Add Analytics**
   - Track hook usage with performance monitoring
   - Log errors to error tracking service
   - Monitor cache hit rates

## Files Modified

None (only new files created)

## Files Created — Dashboard Hooks

1. `/apps/web/src/hooks/use-dashboard-data.ts`
2. `/apps/web/src/hooks/use-mission-data.ts`
3. `/apps/web/src/hooks/use-dashboard.ts`

---

**Ready to integrate! Copy the hooks and start using them in your Figma Dashboard component.**

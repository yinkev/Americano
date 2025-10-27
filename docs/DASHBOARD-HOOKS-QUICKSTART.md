# Dashboard Hooks - Quick Start

**⚡ 30-Second Integration Guide**

---

## 1. Import the Hook

```tsx
import { useDashboard } from '@/hooks/use-dashboard'
```

---

## 2. Use in Component

```tsx
function Dashboard() {
  const { data, isLoading, error } = useDashboard('kevy@americano.dev')

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <h1>Streak: {data.streak_days} days</h1>
      <p>XP: {data.xp_today}</p>
      <p>Readiness: {Math.round(data.exam_readiness * 100)}%</p>
      {data.mission && <MissionCard mission={data.mission} />}
    </div>
  )
}
```

---

## 3. Demo Mode (Instant Data)

```tsx
// Use 'dumpling' for instant demo data (no API calls)
const { data } = useDashboard('dumpling')
```

---

## Available Data

```typescript
data: {
  user_id: string
  streak_days: number
  xp_this_week: number
  xp_today: number
  cards_mastered: number
  study_time_hours: number
  exam_readiness: number // 0.0 to 1.0
  last_study_date: string // ISO 8601
  mission: {
    title: string
    tasks: Array<{ id, description, completed }>
    readiness: number
    duration: number
    completionRate: number
    streak: { current, longest }
    successScore: number
  } | null
}
```

---

## Advanced Usage

### Granular Error Handling
```tsx
const { data, errors } = useDashboard('kevy@americano.dev')

if (errors.dashboard) {
  // Dashboard API failed
}

if (errors.mission) {
  // Mission API failed, but show dashboard anyway
}
```

### Manual Refetch
```tsx
const { refetch } = useDashboard('kevy@americano.dev')

// Refresh data after user action
await refetch()
```

### Type Guard
```tsx
import { hasCompleteMissionData } from '@/hooks/use-dashboard'

if (data && hasCompleteMissionData(data)) {
  // TypeScript knows data.mission is non-null
  return <Mission mission={data.mission} />
}
```

---

## Files Location

**Hooks:** `apps/web/src/hooks/`
- `use-dashboard-data.ts` (dashboard metrics)
- `use-mission-data.ts` (mission summary)
- `use-dashboard.ts` (main composite hook)

**Docs:**
- `DASHBOARD-HOOKS-USAGE.md` (complete guide)
- `DASHBOARD-HOOKS-EXAMPLE.tsx` (full examples)
- `DASHBOARD-HOOKS-DELIVERY.md` (delivery summary)

---

## Troubleshooting

**Issue:** User not found (404)
→ Use demo mode: `useDashboard('dumpling')`

**Issue:** API error
→ Check API endpoints are running on port 3000

**Issue:** Stale data
→ Call `refetch()` or adjust `staleTime` in hook config

---

**📚 For complete documentation, see:** `docs/DASHBOARD-HOOKS-USAGE.md`

**🎯 For React examples, see:** `docs/DASHBOARD-HOOKS-EXAMPLE.tsx`

# Wave 2: Quick Reference Guide

**Quick guide for using the new skeleton loading components**

---

## Import Skeletons

```tsx
import {
  AnalyticsCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
  HeatmapSkeleton,
  TimelineSkeleton,
} from '@/components/skeletons'
```

---

## Usage Examples

### 1. Analytics Card Skeleton

```tsx
<Suspense fallback={<AnalyticsCardSkeleton showHeader showStats />}>
  <MyAnalyticsCard />
</Suspense>
```

**Props:**
- `variant?: 'default' | 'compact' | 'wide'`
- `showHeader?: boolean` (default: true)
- `showStats?: boolean` (default: true)
- `showChart?: boolean` (default: false)

### 2. Chart Skeleton

```tsx
<Suspense fallback={<ChartSkeleton variant="line" height={320} />}>
  <MyChart />
</Suspense>
```

**Props:**
- `variant?: 'bar' | 'line' | 'area' | 'pie' | 'radar'` (default: 'bar')
- `height?: number` (default: 320)
- `showLegend?: boolean` (default: true)
- `showAxes?: boolean` (default: true)

### 3. Table Skeleton

```tsx
<Suspense fallback={<TableSkeleton rows={5} columns={4} showActions />}>
  <MyTable />
</Suspense>
```

**Props:**
- `rows?: number` (default: 5)
- `columns?: number` (default: 4)
- `showHeader?: boolean` (default: true)
- `showActions?: boolean` (default: false)

### 4. Heatmap Skeleton

```tsx
<Suspense fallback={<HeatmapSkeleton />}>
  <StudyTimeHeatmap />
</Suspense>
```

**Props:**
- `showLabels?: boolean` (default: true)

### 5. Timeline Skeleton

```tsx
<Suspense fallback={<TimelineSkeleton variant="vertical" items={5} />}>
  <MyTimeline />
</Suspense>
```

**Props:**
- `variant?: 'vertical' | 'horizontal'` (default: 'vertical')
- `items?: number` (default: 5)

---

## Optimistic Updates

### Using the Hook

```tsx
'use client'

import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation'

export function MyComponent() {
  const { mutate, isPending } = useOptimisticMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/items/${id}`, { method: 'POST' })
      return res.json()
    },
    successMessage: 'Item updated!',
    onSuccess: () => router.refresh(),
  })

  return (
    <button onClick={() => mutate(itemId)} disabled={isPending}>
      {isPending ? 'Updating...' : 'Update'}
    </button>
  )
}
```

### Using OptimisticButton

```tsx
'use client'

import { OptimisticButton } from '@/components/ui/optimistic-button'

export function MyComponent() {
  return (
    <OptimisticButton
      onClick={async () => {
        await updateItem(id)
        router.refresh()
      }}
      loadingText="Updating..."
    >
      Update Item
    </OptimisticButton>
  )
}
```

---

## Loading States

### Page-Level Loading

Create `loading.tsx` next to `page.tsx`:

```tsx
// app/my-page/loading.tsx
import { AnalyticsCardSkeleton, ChartSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="h-9 w-96 bg-[oklch(0.9_0.02_230)] rounded animate-pulse mb-8" />
      <AnalyticsCardSkeleton />
      <ChartSkeleton variant="line" height={384} />
    </div>
  )
}
```

### Component-Level Loading

Use `<Suspense>` boundaries:

```tsx
export default async function Page() {
  return (
    <div>
      {/* Critical content renders immediately */}
      <h1>My Page</h1>

      {/* Heavy content streams in */}
      <Suspense fallback={<ChartSkeleton variant="bar" />}>
        <HeavyChart />
      </Suspense>
    </div>
  )
}
```

---

## Design System Colors

All skeletons use OKLCH color space:

| Lightness | Chroma | Hue | Usage |
|-----------|--------|-----|-------|
| `oklch(0.95_0.01_230)` | Very light | Background |
| `oklch(0.92_0.02_230)` | Light | Secondary elements |
| `oklch(0.9_0.02_230)` | Medium | Primary skeleton |
| `oklch(0.85_0.05_230)` | Darker | Accents |

---

## Performance Tips

1. **Match Dimensions**: Skeletons should match exact dimensions of real content
2. **Stagger Animations**: Use `animationDelay` for visual interest
3. **Critical Content First**: Render headers/nav immediately, defer heavy components
4. **Use Suspense Boundaries**: Wrap each async component separately
5. **Avoid Layout Shift**: Ensure skeleton height/width matches loaded content

---

## Common Patterns

### Pattern 1: Grid of Cards

```tsx
<div className="grid grid-cols-3 gap-6">
  {[...Array(6)].map((_, i) => (
    <Suspense key={i} fallback={<AnalyticsCardSkeleton variant="compact" />}>
      <Card data={cardsData[i]} />
    </Suspense>
  ))}
</div>
```

### Pattern 2: Dashboard Layout

```tsx
<div className="space-y-6">
  {/* Header */}
  <h1>Dashboard</h1>

  {/* Stats Row */}
  <div className="grid grid-cols-4 gap-4">
    <Suspense fallback={<AnalyticsCardSkeleton showStats={false} />}>
      <StatCard />
    </Suspense>
  </div>

  {/* Chart */}
  <Suspense fallback={<ChartSkeleton variant="line" height={400} />}>
    <MainChart />
  </Suspense>
</div>
```

### Pattern 3: Tabbed Interface

```tsx
<Tabs value={activeTab}>
  <TabsList>...</TabsList>

  <TabsContent value="charts">
    <Suspense fallback={<ChartSkeleton variant="bar" />}>
      <ChartsView />
    </Suspense>
  </TabsContent>

  <TabsContent value="table">
    <Suspense fallback={<TableSkeleton rows={10} columns={5} />}>
      <TableView />
    </Suspense>
  </TabsContent>
</Tabs>
```

---

## Troubleshooting

### Skeleton doesn't match content dimensions

**Solution**: Pass explicit `height` and `width` props

```tsx
<ChartSkeleton variant="line" height={320} /> // Match your chart height
```

### Layout shift when content loads

**Solution**: Ensure skeleton has exact same dimensions as loaded content

```tsx
// Bad
<Skeleton className="h-auto" />

// Good
<ChartSkeleton height={320} /> // Matches chart exactly
```

### Skeleton shows for too long

**Solution**: Use `Suspense` only around async components, not static content

```tsx
// Bad
<Suspense fallback={<Skeleton />}>
  <h1>Static Title</h1> {/* Don't suspend static content! */}
  <AsyncChart />
</Suspense>

// Good
<div>
  <h1>Static Title</h1> {/* Renders immediately */}
  <Suspense fallback={<ChartSkeleton />}>
    <AsyncChart />
  </Suspense>
</div>
```

---

## Next Steps

See `WAVE-2-SKELETON-LOADING-SUMMARY.md` for full implementation details.

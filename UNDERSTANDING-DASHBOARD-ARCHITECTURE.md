# Understanding Analytics Dashboard - Architecture Overview

**Story 4.6 Task 2 Implementation Guide**

---

## 🏗️ Component Hierarchy

```
/analytics/understanding (Next.js Route)
└── page.tsx (Server Component)
    └── <UnderstandingDashboard /> (Client Component)
        ├── Header
        │   ├── Title & Description
        │   └── Global Filters
        │       ├── <Select> Date Range (7d/30d/90d)
        │       ├── <Select> Course Filter
        │       ├── <Select> Topic Filter
        │       ├── <Button> Clear Filters
        │       └── <Button> Refresh
        │
        ├── Last Updated Timestamp
        │
        └── <Tabs> (8 tabs)
            ├── <TabsList> (Tab triggers)
            │   ├── Overview
            │   ├── Comparison
            │   ├── Patterns
            │   ├── Progress
            │   ├── Predictions
            │   ├── Relationships
            │   ├── Benchmarks
            │   └── Recommendations
            │
            └── <TabsContent> (Lazy-loaded tab components)
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <OverviewTab /> ✅ IMPLEMENTED
                │       ├── useUnderstandingDashboard() hook
                │       └── 6 Metric Cards
                │           ├── Comprehension (Blue)
                │           ├── Clinical Reasoning (Red)
                │           ├── Failure Learning (Yellow)
                │           ├── Calibration (Green)
                │           ├── Adaptive Efficiency (Purple)
                │           └── Mastery Status (Green)
                │
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <ComparisonTab /> ⏳ PLACEHOLDER
                │       └── useComparisonData() hook
                │
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <PatternsTab /> ⏳ PLACEHOLDER
                │       └── usePatternsAnalysis() hook
                │
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <ProgressTab /> ⏳ PLACEHOLDER
                │       └── useLongitudinalProgress() hook
                │
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <PredictionsTab /> ⏳ PLACEHOLDER
                │       └── usePredictions() hook
                │
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <RelationshipsTab /> ⏳ PLACEHOLDER
                │       └── useCorrelations() hook
                │
                ├── <Suspense fallback={<TabSkeleton />}>
                │   └── <BenchmarksTab /> ⏳ PLACEHOLDER
                │       └── usePeerBenchmark() hook
                │
                └── <Suspense fallback={<TabSkeleton />}>
                    └── <RecommendationsTab /> ⏳ PLACEHOLDER
                        └── useRecommendations() hook
```

---

## 🔄 Data Flow Architecture

```
User Interaction
    │
    ├── Filter Change (date/course/topic)
    │   ├──> Zustand Store (updateFilter)
    │   │    └──> localStorage (persist)
    │   └──> React Query (refetch with new params)
    │
    ├── Tab Switch (activeTab)
    │   ├──> Zustand Store (setActiveTab)
    │   │    └──> localStorage (persist)
    │   └──> React.lazy() (load tab component on-demand)
    │
    └── Refresh Button
        ├──> Zustand Store (refreshData)
        │    └──> Update timestamp
        └──> React Query (invalidateQueries)
             └──> Refetch all active queries

React Query Hooks
    │
    ├── useUnderstandingDashboard()
    │   ├──> GET /api/analytics/understanding/dashboard?dateRange=30d&courseId=...
    │   └──> Cache: 5 minutes
    │
    ├── useComparisonData()
    │   ├──> GET /api/analytics/understanding/comparison?dateRange=30d
    │   └──> Cache: 5 minutes
    │
    ├── usePatternsAnalysis()
    │   ├──> GET /api/analytics/understanding/patterns
    │   └──> Cache: 10 minutes (AI insights)
    │
    ├── useLongitudinalProgress()
    │   ├──> GET /api/analytics/understanding/longitudinal?dateRange=30d
    │   └──> Cache: 5 minutes
    │
    ├── usePredictions()
    │   ├──> GET /api/analytics/understanding/predictions
    │   └──> Cache: 15 minutes (expensive ML)
    │
    ├── useCorrelations()
    │   ├──> GET /api/analytics/understanding/correlations
    │   └──> Cache: 10 minutes
    │
    ├── usePeerBenchmark()
    │   ├──> GET /api/analytics/understanding/peer-benchmark?objectiveId=...
    │   └──> Cache: 30 minutes (slow-changing)
    │
    └── useRecommendations()
        ├──> GET /api/analytics/understanding/recommendations
        └──> Cache: 5 minutes (auto-refetch: 1 hour)

Next.js API Routes (TypeScript Proxies)
    │
    └──> Python FastAPI Service (port 8001)
         │
         ├── AI Evaluation (instructor + Pydantic)
         ├── ML Predictions (scikit-learn)
         ├── Statistical Analysis (scipy)
         └── Pattern Detection (numpy)
```

---

## 🎨 Design System Tokens

### Glassmorphism
```tsx
// Card backgrounds
bg-white/95 backdrop-blur-xl
shadow-[0_8px_32px_rgba(31,38,135,0.1)]
rounded-2xl
border-0

// TabsList background
bg-white/95 backdrop-blur-xl
shadow-[0_8px_32px_rgba(31,38,135,0.1)]
rounded-2xl
p-1
```

### OKLCH Color Palette
```tsx
// Comprehension (Blue)
oklch(0.6 0.18 230)

// Clinical Reasoning (Red)
oklch(0.65 0.20 25)

// Failure Learning (Yellow)
oklch(0.75 0.12 85)

// Calibration (Green)
oklch(0.7 0.15 145)

// Adaptive Efficiency (Purple)
oklch(0.6 0.18 280)

// Mastery Status (Green)
oklch(0.7 0.15 145)

// Secondary Text (Gray)
oklch(0.6 0.05 240)

// Skeleton Loader (Light Gray)
oklch(0.9 0.05 240)
```

### Typography
```tsx
// Headings
font-['DM_Sans']
text-3xl font-bold

// Body
font-['Inter'] (default from globals.css)
text-sm font-medium

// Metric Values
text-4xl font-bold

// Secondary Text
text-xs text-[oklch(0.6_0.05_240)]
```

### Responsive Grid
```tsx
// 3 columns (desktop: >= 1024px)
lg:grid-cols-3

// 2 columns (tablet: 768px - 1023px)
md:grid-cols-2

// 1 column (mobile: < 768px)
grid-cols-1

// Gap
gap-6 (24px)
```

### Touch Targets
```tsx
// All interactive elements
min-h-[44px]

// Examples:
<TabsTrigger className="min-h-[44px]">
<Button className="min-h-[44px]">
<SelectTrigger className="min-h-[44px]">
```

---

## 📦 State Management

### Zustand Store (`understanding-analytics-store.ts`)
```tsx
interface UnderstandingAnalyticsState {
  // Filters (persisted to localStorage)
  dateRange: '7d' | '30d' | '90d'
  courseId: string | null
  topic: string | null

  // UI state (persisted to localStorage)
  activeTab: Tab

  // Coordination (NOT persisted)
  refreshTimestamp: number | null

  // Actions
  setDateRange(range: DateRange): void
  setCourseFilter(courseId: string | null): void
  setTopicFilter(topic: string | null): void
  setActiveTab(tab: Tab): void
  refreshData(): void
  clearFilters(): void
}
```

### React Query Cache Keys
```tsx
// Dashboard overview
['understanding', 'dashboard', { dateRange, courseId, topic }]

// Comparison data
['understanding', 'comparison', { dateRange }]

// Patterns analysis
['understanding', 'patterns']

// Longitudinal progress
['understanding', 'longitudinal', { dateRange }]

// ML predictions
['understanding', 'predictions']

// Correlation matrix
['understanding', 'correlations']

// Peer benchmark
['understanding', 'peer-benchmark', { objectiveId }]

// Recommendations
['understanding', 'recommendations']
```

---

## 🚀 Performance Optimizations

### 1. Code Splitting (React.lazy)
```tsx
// Each tab is a separate bundle
const OverviewTab = lazy(() => import('./tabs/OverviewTab'))
const ComparisonTab = lazy(() => import('./tabs/ComparisonTab'))
// ... 6 more tabs

// Result: 8 separate JS bundles
// - UnderstandingDashboard.tsx (main)
// - OverviewTab.tsx (~20KB)
// - ComparisonTab.tsx (~15KB)
// - ... etc

// Only active tab is loaded initially
// Other tabs load on-demand when user switches tabs
```

### 2. Suspense Boundaries
```tsx
<TabsContent value="overview">
  <Suspense fallback={<TabSkeleton />}>
    <OverviewTab />
  </Suspense>
</TabsContent>

// Fallback renders while tab component loads
// Prevents blocking entire dashboard during lazy load
```

### 3. React Query Caching
```tsx
// Stale-while-revalidate pattern
staleTime: 5 * 60 * 1000  // 5 minutes
gcTime: 10 * 60 * 1000     // 10 minutes

// Expensive ML predictions cached longer
staleTime: 15 * 60 * 1000  // 15 minutes
gcTime: 30 * 60 * 1000     // 30 minutes

// Automatic request deduplication
// If 5 components request same data, only 1 API call
```

### 4. Zustand Selective Subscription
```tsx
// Only re-render when specific state changes
const dateRange = useUnderstandingAnalyticsStore(state => state.dateRange)
const courseId = useUnderstandingAnalyticsStore(state => state.courseId)

// NOT: const state = useUnderstandingAnalyticsStore()
// (would re-render on any state change)
```

### 5. Skeleton Loaders
```tsx
// Immediate visual feedback during loading
function TabSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse ...">
          {/* Skeleton content */}
        </Card>
      ))}
    </div>
  )
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
```tsx
// Test Zustand store actions
test('setDateRange updates state', () => {
  const { result } = renderHook(() => useUnderstandingAnalyticsStore())
  act(() => result.current.setDateRange('7d'))
  expect(result.current.dateRange).toBe('7d')
})

// Test React Query hooks (with MSW)
test('useUnderstandingDashboard fetches data', async () => {
  const { result } = renderHook(() => useUnderstandingDashboard())
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data.comprehension.currentScore).toBe(85)
})
```

### Component Tests (React Testing Library)
```tsx
test('renders 8 tab triggers', () => {
  render(<UnderstandingDashboard />)
  expect(screen.getByText('Overview')).toBeInTheDocument()
  expect(screen.getByText('Comparison')).toBeInTheDocument()
  // ... 6 more tabs
})

test('lazy loads tab on click', async () => {
  render(<UnderstandingDashboard />)

  // Tab not loaded initially
  expect(screen.queryByText('Comparison Analytics')).not.toBeInTheDocument()

  // Click tab trigger
  await userEvent.click(screen.getByText('Comparison'))

  // Tab content loaded
  await waitFor(() => {
    expect(screen.getByText('Comparison Analytics')).toBeInTheDocument()
  })
})
```

### E2E Tests (Playwright)
```tsx
test('filter persistence across page reloads', async ({ page }) => {
  await page.goto('/analytics/understanding')

  // Set filters
  await page.selectOption('[data-testid="date-range"]', '7d')
  await page.selectOption('[data-testid="course"]', 'course-1')

  // Reload page
  await page.reload()

  // Filters should persist (from localStorage)
  expect(await page.inputValue('[data-testid="date-range"]')).toBe('7d')
  expect(await page.inputValue('[data-testid="course"]')).toBe('course-1')
})
```

---

## 📚 Implementation Checklist for New Tabs

When implementing remaining tabs (Tasks 3-9), follow this pattern:

### Step 1: Import Hook
```tsx
'use client';

import { useComparisonData } from '@/hooks/use-understanding-analytics';
```

### Step 2: Fetch Data
```tsx
export default function ComparisonTab() {
  const { data, isLoading, error } = useComparisonData();

  if (isLoading) return <ComparisonSkeleton />;
  if (error) return <ErrorMessage />;
  if (!data) return null;

  // Render data
}
```

### Step 3: Design Layout
```tsx
// Use responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards or charts */}
</div>

// Apply glassmorphism
<Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
  {/* Content */}
</Card>
```

### Step 4: Add Charts (if needed)
```tsx
import { LineChart, Line, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data.timeSeries}>
    <Line
      type="monotone"
      dataKey="value"
      stroke="oklch(0.6 0.18 230)"
      strokeWidth={2}
    />
  </LineChart>
</ResponsiveContainer>
```

### Step 5: Implement Skeleton Loader
```tsx
function ComparisonSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-64 animate-pulse bg-white/95 backdrop-blur-xl">
          {/* Skeleton content */}
        </Card>
      ))}
    </div>
  );
}
```

---

## 🎯 Quick Reference

### Files to Modify for New Tabs
```
✅ Hook already exists: use-understanding-analytics.ts
✅ Store already exists: understanding-analytics-store.ts
✅ Main dashboard already exists: UnderstandingDashboard.tsx

⏳ Modify placeholder: tabs/ComparisonTab.tsx
⏳ Modify placeholder: tabs/PatternsTab.tsx
⏳ Modify placeholder: tabs/ProgressTab.tsx
⏳ Modify placeholder: tabs/PredictionsTab.tsx
⏳ Modify placeholder: tabs/RelationshipsTab.tsx
⏳ Modify placeholder: tabs/BenchmarksTab.tsx
⏳ Modify placeholder: tabs/RecommendationsTab.tsx
```

### API Endpoints to Implement
```
⏳ GET /api/analytics/understanding/dashboard
⏳ GET /api/analytics/understanding/comparison
⏳ GET /api/analytics/understanding/patterns
⏳ GET /api/analytics/understanding/longitudinal
⏳ GET /api/analytics/understanding/predictions
⏳ GET /api/analytics/understanding/correlations
⏳ GET /api/analytics/understanding/peer-benchmark
⏳ GET /api/analytics/understanding/recommendations
```

### Python FastAPI Endpoints
```
⏳ POST /analytics/dashboard (aggregate metrics)
⏳ POST /analytics/comparison (correlation analysis)
⏳ POST /analytics/patterns (ML pattern detection)
⏳ POST /analytics/longitudinal (time-series aggregation)
⏳ POST /analytics/predictions (ML inference)
⏳ POST /analytics/correlations (scipy pearsonr)
⏳ POST /analytics/peer-benchmark (anonymized comparison)
⏳ POST /analytics/recommendations (AI insights)
```

---

## 📖 Related Documentation

- **CLAUDE.md:** Hybrid TypeScript + Python architecture
- **AGENTS.md:** AI agent protocols and workflows
- **STORY-4.6-TASK-2-COMPLETION.md:** Detailed implementation report
- **STORY-4.6-TASK-2-FINAL-SUMMARY.md:** Comprehensive feature summary

---

**Status:** ✅ ARCHITECTURE COMPLETE - READY FOR IMPLEMENTATION

This architecture supports all 8 tabs with optimal performance, maintainability, and user experience. All infrastructure (routing, state management, data fetching, design system) is in place for rapid tab implementation.

# Layout Components Documentation

Responsive layout components for building dashboards and data visualization interfaces.

## DashboardLayout

Full-featured dashboard layout with sidebar, header, and mobile optimization.

### Features

- Responsive sidebar with desktop and mobile views
- Collapsible sidebar support
- Sticky header support
- Mobile menu with backdrop overlay
- Keyboard navigation (Escape to close mobile menu)
- Loading skeleton state
- Flexible content area with max-width constraints

### Basic Usage

```tsx
import { DashboardLayout } from "@/components/layouts"

function Dashboard() {
  return (
    <DashboardLayout
      sidebar={<YourSidebar />}
      header={<YourHeader />}
    >
      <YourContent />
    </DashboardLayout>
  )
}
```

### With Collapsible Sidebar

```tsx
<DashboardLayout
  sidebar={<YourSidebar />}
  header={<YourHeader />}
  collapsibleSidebar
  defaultSidebarOpen={true}
  sidebarWidth="18rem"
>
  <YourContent />
</DashboardLayout>
```

### With Loading State

```tsx
<DashboardLayout loading>
  {/* Content will be hidden, skeleton shown */}
</DashboardLayout>
```

---

## FilterBar

Interactive filter bar with time ranges, categories, and quick filters.

### Features

- Time range selector
- Multi-select filter categories
- Quick filter presets
- Active filter badges with remove buttons
- Clear all functionality
- Sticky positioning support
- Smooth animations for badge add/remove
- Keyboard accessibility

### Basic Usage

```tsx
import { FilterBar } from "@/components/layouts"

function MyDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [filters, setFilters] = useState({})

  return (
    <FilterBar
      selectedTimeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      selectedFilters={filters}
      onClearAll={() => setFilters({})}
    />
  )
}
```

### With Filter Categories

```tsx
<FilterBar
  selectedTimeRange="30d"
  onTimeRangeChange={setTimeRange}
  filterCategories={[
    {
      label: "Objectives",
      key: "objectives",
      options: [
        { label: "Accuracy", value: "accuracy", count: 42 },
        { label: "Speed", value: "speed", count: 28 }
      ],
      multiSelect: true
    },
    {
      label: "Status",
      key: "status",
      options: [
        { label: "Active", value: "active" },
        { label: "Complete", value: "complete" }
      ]
    }
  ]}
  selectedFilters={{ objectives: ["accuracy"], status: "active" }}
  onFilterChange={(key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }}
/>
```

### With Quick Filters

```tsx
<FilterBar
  quickFilters={[
    {
      label: "Today",
      value: "today",
      filters: { timeRange: "1d" }
    },
    {
      label: "This Week",
      value: "week",
      filters: { timeRange: "7d" }
    }
  ]}
  selectedQuickFilter="week"
  onQuickFilterChange={handleQuickFilter}
/>
```

### Sticky FilterBar

```tsx
<FilterBar
  sticky
  stickyTop={64} // Offset from top (e.g., for fixed header)
  selectedTimeRange="30d"
  onTimeRangeChange={setTimeRange}
/>
```

---

## MetricGrid

Responsive grid layout for displaying metric cards with animations.

### Features

- Responsive column layouts (1-6 columns)
- Grid and masonry layout modes
- Configurable gap sizes
- Stagger animations
- Loading state with skeletons
- Empty state handling

### Basic Usage

```tsx
import { MetricGrid } from "@/components/layouts"
import { MetricCard } from "@/components/ui"

function Dashboard() {
  return (
    <MetricGrid columns={3} gap="md">
      <MetricCard title="Users" value={1234} />
      <MetricCard title="Revenue" value="$12.5k" />
      <MetricCard title="Conversion" value="3.2%" />
    </MetricGrid>
  )
}
```

### With Stagger Animations

```tsx
<MetricGrid
  columns={3}
  gap="lg"
  stagger
  staggerDelay={0.1} // 100ms delay between items
>
  {metrics.map((metric) => (
    <MetricCard key={metric.id} {...metric} />
  ))}
</MetricGrid>
```

### With Loading State

```tsx
<MetricGrid
  columns={3}
  loading
  skeletonCount={6}
>
  {/* Children hidden during loading */}
</MetricGrid>
```

### With Empty State

```tsx
<MetricGrid
  columns={3}
  emptyState={{
    title: "No metrics available",
    description: "Add your first metric to get started",
    action: {
      label: "Add Metric",
      onClick: () => openAddDialog()
    }
  }}
>
  {metrics.length === 0 ? null : metrics.map(...)}
</MetricGrid>
```

### Masonry Layout

```tsx
<MetricGrid
  layout="masonry"
  columns={3}
  gap="md"
>
  {/* Cards of varying heights will be laid out in masonry style */}
</MetricGrid>
```

---

## Complete Dashboard Example

```tsx
"use client"

import { useState } from "react"
import {
  DashboardLayout,
  FilterBar,
  MetricGrid
} from "@/components/layouts"
import {
  MetricCard,
  StatCard,
  InsightCard
} from "@/components/ui"

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [filters, setFilters] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <DashboardLayout
      sidebar={<MySidebar />}
      header={
        <FilterBar
          selectedTimeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          filterCategories={[
            {
              label: "Objectives",
              key: "objectives",
              options: [
                { label: "Accuracy", value: "accuracy" },
                { label: "Speed", value: "speed" }
              ],
              multiSelect: true
            }
          ]}
          selectedFilters={filters}
          onFilterChange={(key, value) =>
            setFilters(prev => ({ ...prev, [key]: value }))
          }
          onClearAll={() => setFilters({})}
          sticky
        />
      }
      collapsibleSidebar
      sidebarOpen={sidebarOpen}
      onSidebarToggle={setSidebarOpen}
      maxWidth="2xl"
    >
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total Users"
          value={1234}
          previousValue={1100}
          trend="up"
        />
        <StatCard
          label="Revenue"
          value={12345}
          formatValue={(v) => `$${v.toLocaleString()}`}
          variant="success"
        />
      </div>

      {/* Insights */}
      <div className="mb-6">
        <InsightCard
          title="Great Progress!"
          description="You're 20% ahead of your weekly goal"
          priority="success"
          dismissible
        />
      </div>

      {/* Metrics Grid */}
      <MetricGrid columns={3} gap="md" stagger>
        <MetricCard
          title="Active Sessions"
          value="1,234"
          trend="up"
          percentageChange={12.5}
        />
        <MetricCard
          title="Avg. Response Time"
          value="245ms"
          trend="down"
          percentageChange={-8.2}
          upIsGood={false}
        />
        <MetricCard
          title="Conversion Rate"
          value="3.2%"
          trend="up"
          percentageChange={5.1}
        />
      </MetricGrid>
    </DashboardLayout>
  )
}
```

---

## Accessibility

All layout components include:

- **Semantic HTML**: Proper use of `<header>`, `<aside>`, `<main>`, `<nav>`
- **ARIA labels**: Clear labels for all interactive elements
- **Keyboard navigation**: Full keyboard support
  - `Tab` / `Shift+Tab`: Navigate between elements
  - `Escape`: Close mobile sidebar
  - `Enter` / `Space`: Activate buttons
- **Focus management**: Proper focus indicators and focus trap in mobile menu
- **Screen reader support**: Announced state changes and updates

---

## Performance

- **Lazy animations**: Animations respect `prefers-reduced-motion`
- **Efficient re-renders**: Memoized components where appropriate
- **Optimized layouts**: CSS Grid and Flexbox for performant layouts
- **Code splitting**: Components can be lazy-loaded

# Premium UI Components - Component Library Documentation

A collection of premium, production-ready UI components for Americano, built on top of shadcn/ui with Framer Motion animations.

## Components

### TrendIndicator

Display trend direction with color-coded indicators and percentage changes.

```tsx
import { TrendIndicator } from "@/components/ui"

// Basic usage
<TrendIndicator direction="up" value={12.5} />

// Error rate (down is good)
<TrendIndicator
  direction="down"
  value={-5.2}
  upIsGood={false}
/>

// Different sizes
<TrendIndicator direction="up" value={8.3} size="sm" />
<TrendIndicator direction="up" value={8.3} size="lg" />
```

**Props:**
- `direction`: "up" | "down" | "neutral"
- `value`: Percentage change number
- `upIsGood`: Whether upward trend is positive (default: true)
- `showPercentage`: Show % symbol (default: true)
- `size`: "sm" | "md" | "lg"
- `animate`: Enable mount animation (default: true)

---

### StatCard

Large number display with label, sublabel, and comparison indicators.

```tsx
import { StatCard } from "@/components/ui"

// Basic usage
<StatCard
  label="Total Users"
  value={1234}
  sublabel="Active in last 30 days"
/>

// With comparison
<StatCard
  label="Revenue"
  value={12345}
  previousValue={11000}
  trend="up"
  formatValue={(v) => `$${v.toLocaleString()}`}
/>

// Different variants
<StatCard
  label="Error Rate"
  value={2.3}
  variant="danger"
  size="lg"
/>
```

---

### MetricCard

Display metrics with trend indicators and optional sparkline charts.

```tsx
import { MetricCard } from "@/components/ui"

// With sparkline
<MetricCard
  title="Active Users"
  value="1,234"
  trend="up"
  percentageChange={8.2}
  sparklineData={[
    { value: 100 },
    { value: 120 },
    { value: 115 },
    { value: 140 }
  ]}
  status="success"
/>
```

---

### InsightCard

Display actionable insights with priority levels and action buttons.

```tsx
import { InsightCard } from "@/components/ui"

// With actions
<InsightCard
  title="Study Pattern Alert"
  description="You've been studying intensively. Consider taking a break."
  priority="warning"
  actions={[
    { label: "View Details", onClick: () => {} },
    { label: "Dismiss", onClick: () => {}, variant: "outline" }
  ]}
  dismissible
  onDismiss={() => {}}
/>
```

---

### ChartContainer

Wrapper for charts with loading, error, and empty states.

```tsx
import { ChartContainer } from "@/components/ui"
import { ResponsiveContainer, LineChart, Line } from "recharts"

<ChartContainer
  title="Revenue Over Time"
  description="Monthly revenue for the past year"
  exportable
  onExport={handleExport}
  height={300}
>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <Line dataKey="value" stroke="hsl(var(--primary))" />
    </LineChart>
  </ResponsiveContainer>
</ChartContainer>
```

---

### EmptyState

Display placeholder UI for empty, loading, or error states.

```tsx
import { EmptyState } from "@/components/ui"

// No search results
<EmptyState
  variant="no-results"
  action={{
    label: "Clear filters",
    onClick: () => clearFilters()
  }}
/>
```

---

## Layout Components

### MetricGrid

Responsive grid layout for metric cards with auto-layout and stagger animations.

```tsx
import { MetricGrid } from "@/components/layouts"
import { MetricCard } from "@/components/ui"

<MetricGrid columns={3} gap="md" stagger>
  <MetricCard title="Users" value={1234} />
  <MetricCard title="Revenue" value="$12.5k" />
  <MetricCard title="Conversion" value="3.2%" />
</MetricGrid>

// With loading state
<MetricGrid loading skeletonCount={6} />

// With empty state
<MetricGrid
  emptyState={{
    title: "No metrics available",
    description: "Start by adding some metrics",
    action: {
      label: "Add Metric",
      onClick: () => {}
    }
  }}
>
  {/* children */}
</MetricGrid>
```

---

### FilterBar

Interactive filter bar with time range, multi-select filters, and presets.

```tsx
import { FilterBar } from "@/components/layouts"

<FilterBar
  selectedTimeRange="30d"
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
  selectedFilters={{ objectives: ["accuracy"] }}
  onFilterChange={handleFilterChange}
  onClearAll={clearFilters}
  sticky
  stickyTop={64}
/>
```

---

### DashboardLayout

Responsive dashboard layout with sidebar, header, and mobile support.

```tsx
import { DashboardLayout } from "@/components/layouts"
import { AppSidebar } from "@/components/app-sidebar"
import { FilterBar } from "@/components/layouts"

<DashboardLayout
  sidebar={<AppSidebar />}
  header={
    <FilterBar
      selectedTimeRange="30d"
      onTimeRangeChange={setTimeRange}
    />
  }
  collapsibleSidebar
  defaultSidebarOpen
  maxWidth="2xl"
>
  <MetricGrid columns={3}>
    <MetricCard title="Users" value={1234} />
  </MetricGrid>
</DashboardLayout>
```

---

## Accessibility Features

All components include:
- **ARIA labels**: Semantic labels for screen readers
- **Keyboard navigation**: Full keyboard support (Tab, Enter, Escape)
- **Focus management**: Proper focus indicators and trap
- **Live regions**: Dynamic content updates announced (`aria-live`)
- **Color contrast**: WCAG AA compliant
- **Motion preferences**: Respects `prefers-reduced-motion`

---

## Animation System

All components use Framer Motion:

- **Entrance animations**: Fade and slide on mount
- **Hover interactions**: Subtle lift effects
- **Count-up animations**: Animated number transitions
- **Stagger delays**: Sequential animations for lists
- **Layout animations**: Smooth transitions

---

## Theme Integration

Components use Tailwind CSS variables:

```css
--background
--foreground
--primary
--destructive
--muted
--border
```

---

## TypeScript Support

Fully typed with exported interfaces:

```tsx
import type {
  MetricCardProps,
  InsightCardProps,
  TrendDirection,
  InsightPriority,
  DashboardLayoutProps,
  FilterBarProps
} from "@/components/ui"
```

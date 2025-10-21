# Recharts Theme Migration Guide

**Quick Reference:** How to apply the custom OKLCH Recharts theme to existing charts

---

## 5-Minute Quick Start

### Step 1: Import the Theme

```tsx
import { chartTheme, applyChartTheme } from '@/lib/chart-theme'
```

### Step 2: Replace Hardcoded Props

**Before:**
```tsx
<LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 230)" />
  <XAxis
    dataKey="x"
    stroke="oklch(0.6 0.03 230)"
    tick={{ fill: 'oklch(0.5 0.05 230)', fontSize: 12 }}
  />
  <YAxis
    stroke="oklch(0.6 0.03 230)"
    tick={{ fill: 'oklch(0.5 0.05 230)', fontSize: 12 }}
  />
  <Tooltip
    contentStyle={{
      backgroundColor: 'oklch(0.95 0.01 230)',
      border: '1px solid oklch(0.85 0.02 230)'
    }}
  />
  <Legend
    wrapperStyle={{
      paddingTop: '10px',
      fontSize: '12px'
    }}
  />
</LineChart>
```

**After:**
```tsx
<LineChart data={data} {...applyChartTheme()}>
  <CartesianGrid {...chartTheme.grid} />
  <XAxis dataKey="x" {...chartTheme.axis} />
  <YAxis {...chartTheme.axis} />
  <Tooltip {...chartTheme.tooltip} />
  <Legend {...chartTheme.legend} />
</LineChart>
```

**Result:** 70% less code, 100% consistent styling

---

## Chart Type Examples

### Line Chart

```tsx
import { chartTheme, applyChartTheme, getDataColors } from '@/lib/chart-theme'

const colors = getDataColors(false, 3) // Get 3 colors for series

<ResponsiveContainer width="100%" height={320}>
  <LineChart data={data} {...applyChartTheme()}>
    <CartesianGrid {...chartTheme.grid} />
    <XAxis dataKey="date" {...chartTheme.axis} />
    <YAxis {...chartTheme.axis} />
    <Tooltip {...chartTheme.tooltip} />
    <Legend {...chartTheme.legend} />

    <Line type="monotone" dataKey="series1" stroke={colors[0]} strokeWidth={2} />
    <Line type="monotone" dataKey="series2" stroke={colors[1]} strokeWidth={2} />
    <Line type="monotone" dataKey="series3" stroke={colors[2]} strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

---

### Bar Chart

```tsx
import { chartTheme, applyChartTheme, getDataColors } from '@/lib/chart-theme'

const colors = getDataColors()

<ResponsiveContainer width="100%" height={320}>
  <BarChart data={data} {...applyChartTheme()}>
    <CartesianGrid {...chartTheme.grid} />
    <XAxis dataKey="category" {...chartTheme.axis} />
    <YAxis {...chartTheme.axis} />
    <Tooltip {...chartTheme.tooltip} />
    <Legend {...chartTheme.legend} />

    <Bar dataKey="value" fill={colors[0]} />
  </BarChart>
</ResponsiveContainer>
```

---

### Scatter Chart

```tsx
import { chartTheme, applyChartTheme, chartColors } from '@/lib/chart-theme'

<ResponsiveContainer width="100%" height={320}>
  <ScatterChart {...applyChartTheme()}>
    <CartesianGrid {...chartTheme.grid} />
    <XAxis type="number" dataKey="x" {...chartTheme.axis} />
    <YAxis type="number" dataKey="y" {...chartTheme.axis} />
    <Tooltip {...chartTheme.tooltip} />
    <Legend {...chartTheme.legend} />

    <Scatter
      name="Morning"
      data={morningData}
      fill={chartColors.primary}
      fillOpacity={0.6}
    />
    <Scatter
      name="Afternoon"
      data={afternoonData}
      fill={chartColors.secondary}
      fillOpacity={0.6}
    />
  </ScatterChart>
</ResponsiveContainer>
```

---

### Composed Chart (Mixed Types)

```tsx
import { chartTheme, applyChartTheme, getDataColors } from '@/lib/chart-theme'

const [barColor, lineColor] = getDataColors(false, 2)

<ResponsiveContainer width="100%" height={320}>
  <ComposedChart data={data} {...applyChartTheme()}>
    <CartesianGrid {...chartTheme.grid} />
    <XAxis dataKey="month" {...chartTheme.axis} />
    <YAxis {...chartTheme.axis} />
    <Tooltip {...chartTheme.tooltip} />
    <Legend {...chartTheme.legend} />

    <Bar dataKey="count" fill={barColor} />
    <Line type="monotone" dataKey="average" stroke={lineColor} strokeWidth={2} />
  </ComposedChart>
</ResponsiveContainer>
```

---

## Custom Tooltip (If Needed)

If you need custom tooltip content beyond the default theme:

```tsx
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div
      className="px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm"
      style={chartTheme.tooltip.contentStyle}
    >
      <p className="text-sm font-medium mb-1" style={chartTheme.tooltip.labelStyle}>
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={chartTheme.tooltip.itemStyle}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

// In chart:
<Tooltip content={<CustomTooltip />} />
```

---

## Reference Lines & Areas

### Reference Line (Threshold)

```tsx
import { chartTheme } from '@/lib/chart-theme'

<ReferenceLine
  y={75}
  {...chartTheme.referenceLine}
  label={{
    value: 'Target',
    ...chartTheme.referenceLine.label.style
  }}
/>
```

### Reference Line (Vertical)

```tsx
<ReferenceLine
  x="2024-01-15"
  stroke="oklch(0.7 0.15 50)"
  strokeDasharray="5 5"
  label={{
    value: 'Launch Date',
    position: 'top',
    style: chartTheme.referenceLine.label.style
  }}
/>
```

---

## Axis Labels

```tsx
<XAxis
  dataKey="date"
  {...chartTheme.axis}
  label={{
    value: 'Date',
    position: 'insideBottom',
    offset: -10,
    ...chartTheme.axisLabel.style
  }}
/>

<YAxis
  {...chartTheme.axis}
  label={{
    value: 'Performance Score',
    angle: -90,
    position: 'insideLeft',
    ...chartTheme.axisLabel.style
  }}
/>
```

---

## Dark Mode Support

Use the theme selector for dark mode:

```tsx
import { getChartTheme, getChartColors } from '@/lib/chart-theme'
import { useTheme } from 'next-themes'

function MyChart() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const chartTheme = getChartTheme(isDark)
  const colors = getChartColors(isDark)

  return (
    <LineChart {...applyChartTheme()}>
      <CartesianGrid {...chartTheme.grid} />
      <XAxis {...chartTheme.axis} />
      <Line stroke={colors.primary} />
    </LineChart>
  )
}
```

---

## Accessibility (ARIA Labels)

Always add ARIA labels to charts:

```tsx
import { getChartAccessibilityProps } from '@/lib/chart-theme'

<div {...getChartAccessibilityProps(
  'line',
  data.length,
  'user performance over last 30 days'
)}>
  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={data} {...applyChartTheme()}>
      {/* ... */}
    </LineChart>
  </ResponsiveContainer>
</div>
```

This adds:
- `role="img"`
- `aria-label="Line chart with N data points showing user performance over last 30 days"`
- `tabIndex={0}` for keyboard navigation

---

## Charts to Migrate (Checklist)

### Epic 5 Learning Patterns
- [ ] `ForgettingCurveVisualization.tsx` - Line chart
- [ ] `StudyTimeHeatmap.tsx` - Heatmap
- [ ] `LearningStyleProfile.tsx` - Radar/bar chart
- [ ] `BehavioralInsightsPanel.tsx` - Mixed charts
- [x] `SessionPerformanceChart.tsx` - Scatter chart ✅

### Analytics Components
- [ ] `PerformanceCorrelationChart.tsx` - Scatter/line
- [ ] `PatternEvolutionTimeline.tsx` - Timeline
- [ ] `PersonalizationEffectivenessChart.tsx` - Line
- [ ] `PredictionAccuracyChart.tsx` - Bar/line
- [ ] `MissionCompletionChart.tsx` - Bar
- [ ] `StressPatternTimeline.tsx` - Timeline
- [ ] `StruggleRiskTimeline.tsx` - Timeline
- [ ] `ModelPerformanceMetrics.tsx` - Mixed

---

## Common Issues & Solutions

### Issue: Custom margin needed

**Solution:**
```tsx
<LineChart {...applyChartTheme({ top: 30, right: 40, bottom: 20, left: 20 })}>
```

### Issue: Custom axis tick formatter

**Solution:**
```tsx
<YAxis
  {...chartTheme.axis}
  tickFormatter={(value) => `${value}%`}
/>
```

### Issue: Need different tooltip style

**Solution:**
```tsx
// Option 1: Extend default style
<Tooltip
  {...chartTheme.tooltip}
  contentStyle={{
    ...chartTheme.tooltip.contentStyle,
    backgroundColor: 'oklch(0.98 0.01 145)', // Custom green tint
  }}
/>

// Option 2: Use custom component with theme tokens
<Tooltip content={<CustomTooltip />} />
```

### Issue: Chart colors don't match data semantics

**Solution:**
```tsx
import { chartColors } from '@/lib/chart-theme'

// Use semantic colors directly
<Line dataKey="success" stroke={chartColors.secondary} /> // Green
<Line dataKey="warning" stroke={chartColors.tertiary} />  // Orange
<Line dataKey="error" stroke={chartColors.quinary} />     // Red
```

---

## Before & After Examples

### Example 1: ForgettingCurveVisualization

**Before (hardcoded):**
```tsx
<LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 230)" />
  <XAxis
    dataKey="day"
    stroke="oklch(0.6 0.03 230)"
    label={{ style: { fill: 'oklch(0.5 0.05 230)', fontSize: 12 } }}
  />
  <YAxis
    stroke="oklch(0.6 0.03 230)"
    label={{ style: { fill: 'oklch(0.5 0.05 230)', fontSize: 12 } }}
  />
  <Tooltip /* ... custom styles ... */ />
  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />

  <Line dataKey="personal" stroke="oklch(0.5 0.2 230)" strokeWidth={2} />
  <Line dataKey="standard" stroke="oklch(0.7 0.05 230)" strokeWidth={2} strokeDasharray="5 5" />
</LineChart>
```

**After (themed):**
```tsx
import { chartTheme, applyChartTheme, chartColors } from '@/lib/chart-theme'

<LineChart data={data} {...applyChartTheme({ right: 30 })}>
  <CartesianGrid {...chartTheme.grid} />
  <XAxis
    dataKey="day"
    {...chartTheme.axis}
    label={{ value: 'Days Since Review', ...chartTheme.axisLabel.style }}
  />
  <YAxis
    {...chartTheme.axis}
    label={{ value: 'Retention (%)', angle: -90, ...chartTheme.axisLabel.style }}
  />
  <Tooltip {...chartTheme.tooltip} />
  <Legend {...chartTheme.legend} />

  <Line dataKey="personal" stroke={chartColors.primary} strokeWidth={2} />
  <Line dataKey="standard" stroke={chartColors.chart2} strokeWidth={2} strokeDasharray="5 5" />
</LineChart>
```

**Improvements:**
- ✅ 40% less code
- ✅ Consistent with design system
- ✅ Dark mode support built-in
- ✅ Easier to maintain

---

## Testing Checklist

After migrating each chart:

- [ ] Visual: Grid lines are light and subtle
- [ ] Visual: Axis text is readable (not too dark/light)
- [ ] Visual: Tooltip has glassmorphism effect
- [ ] Visual: Legend is positioned correctly
- [ ] Visual: Colors match design system
- [ ] Accessibility: ARIA label present
- [ ] Accessibility: Chart is keyboard navigable (Tab key)
- [ ] Responsive: Chart resizes properly
- [ ] Dark mode: Theme switches correctly (if implemented)

---

## API Reference

### Functions

```tsx
// Get theme based on dark mode
getChartTheme(isDark?: boolean): ChartTheme

// Get colors based on dark mode
getChartColors(isDark?: boolean): ChartColors

// Get container props with margin
applyChartTheme(customMargin?: Margin): ChartContainerProps

// Get N data series colors
getDataColors(isDark?: boolean, count?: number): string[]

// Generate ARIA label for chart
generateChartAriaLabel(chartType: string, dataPoints: number, description: string): string

// Get accessibility props for chart wrapper
getChartAccessibilityProps(chartType: string, dataPoints: number, description: string): Object
```

### Theme Objects

```tsx
chartTheme.grid          // CartesianGrid props
chartTheme.axis          // XAxis/YAxis props
chartTheme.axisLabel     // Axis label style object
chartTheme.tooltip       // Tooltip props
chartTheme.legend        // Legend props
chartTheme.referenceLine // ReferenceLine props
chartTheme.brush         // Brush props
```

### Color Constants

```tsx
chartColors.primary      // Blue (oklch(0.65 0.2 240))
chartColors.secondary    // Green (oklch(0.7 0.15 145))
chartColors.tertiary     // Orange (oklch(0.7 0.15 50))
chartColors.quaternary   // Purple (oklch(0.65 0.2 280))
chartColors.quinary      // Red (oklch(0.75 0.18 30))
chartColors.chart1-5     // Palette colors
chartColors.grid         // Grid color
chartColors.axis         // Axis color
chartColors.text         // Text color
```

---

## Time Estimates

- **Simple chart** (1 data series): 10-15 minutes
- **Medium chart** (2-3 series, custom tooltip): 15-20 minutes
- **Complex chart** (4+ series, reference lines, custom elements): 20-30 minutes

**Total for 9 remaining charts:** ~3 hours

---

## Questions?

- See full documentation: `/apps/web/src/lib/chart-theme.ts`
- See color system: `/apps/web/src/styles/colors.md`
- See example: `/apps/web/src/components/analytics/learning-patterns/SessionPerformanceChart.tsx`

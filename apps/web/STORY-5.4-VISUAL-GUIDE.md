# Story 5.4 UI Polish - Visual Guide

**Visual reference for the enhanced Cognitive Health Dashboard**

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                   COGNITIVE HEALTH DASHBOARD                     │
│  Monitor cognitive load, stress patterns, and burnout risk      │
│                                                                  │
│  [Activity] Real-time monitoring | [Calendar] Last 30 days      │
│  [Brain] Refreshes every 30 seconds                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────┐
│   COGNITIVE LOAD     │        STRESS PATTERNS TIMELINE          │
│                      │                                          │
│   ┌────────────┐     │  [7 Days] [30 Days]                     │
│   │    /───\   │     │                                          │
│   │   /     \  │     │  Avg: 45  Peak: 78  Overload: 2         │
│   │  │  58   │ │     │                                          │
│   │   \     /  │     │  100┤              ╱╲                    │
│   │    \───/   │     │   80├─────────────╱──╲─────── Critical   │
│   └────────────┘     │   60├──────────╱─────╲─────── High      │
│                      │   40├───────╱──────────╲───── Moderate   │
│ [███▓▒░░░░░░░]       │   20├───╱────────────────╲──            │
│ 0   40  60  80  100  │    0└───────────────────────╲──         │
│                      │      Mon  Tue  Wed  Thu  Fri             │
│   MODERATE LOAD      │                                          │
│ Productive learning  │  Load trending downward ↘               │
└──────────────────────┴──────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      BURNOUT RISK PANEL                          │
│                                                                  │
│  ⚠️  HIGH RISK                                        72/100     │
│     You need a break soon. Prioritize rest.                     │
│                                                                  │
│  Days Since Rest: 8 ⚠️                                          │
│                                                                  │
│  Contributing Factors:                                          │
│  • Sleep Deficit        [████████░░] 85%                        │
│  • High Study Volume    [███████░░░] 72%                        │
│  • Low Recovery Time    [██████░░░░] 65%                        │
│                                                                  │
│  Recommendations:                                               │
│  1. Schedule a rest day within the next 24 hours               │
│  2. Reduce today's study session to 2 hours max                │
│  3. Practice 10-minute mindfulness break                       │
│                                                                  │
│  [Take Break]  [Reschedule Session]                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Cognitive Load Meter

**Visual Structure:**
```
┌────────────────────────────┐
│   Cognitive Load    ↑      │  ← Header with trend icon
│                             │
│     ┌──────────┐           │
│    ╱            ╲          │
│   │              │         │  ← Circular gauge
│   │      58      │         │     Color changes by zone
│   │              │         │
│    ╲            ╱          │
│     └──────────┘           │
│                             │
│  [███▓▒░░░░░░░░░]         │  ← NEW: Linear progress bar
│  0   40  60  80  100       │     Multi-segment OKLCH colors
│                             │
│  ┃ MODERATE LOAD           │  ← Status badge
│                             │
│  Productive learning        │  ← Supportive message
│  stay engaged               │
│                             │
│  Updated 2:45 PM           │  ← Last update time
└────────────────────────────┘
```

**Color Zones:**
- **Green (0-40):** Optimal learning
- **Yellow (40-60):** Productive zone ← Current: 58
- **Orange (60-80):** Approaching limit
- **Red (80-100):** Critical overload

**Animations:**
- Circular gauge: Smooth arc transition (500ms)
- Progress bar: Segments fill left-to-right (500ms ease-out)
- Card: Shadow lift on hover (300ms)

---

### 2. Animated Progress Bar (NEW!)

**Segment Structure:**
```
┌──────────────────────────────────────────────────┐
│ [████████GREEN████][██YELLOW██][ORANGE][RED]    │
│ 0                40           60       80   100  │
└──────────────────────────────────────────────────┘
                    ↑
              Current load: 58
```

**OKLCH Colors:**
```css
/* Low (0-40) */
background-color: oklch(0.7 0.15 145);  /* Green */

/* Moderate (40-60) */
background-color: oklch(0.8 0.15 90);   /* Yellow */

/* High (60-80) */
background-color: oklch(0.7 0.15 50);   /* Orange */

/* Critical (80-100) */
background-color: oklch(0.6 0.20 30);   /* Red */
```

**Behavior:**
- Each segment fills only up to current load
- NO CSS gradients - discrete color zones
- Smooth width transitions: `transition-all duration-500 ease-out`
- Responsive to container width

---

### 3. Burnout Risk Panel

**Risk Level States:**

#### LOW RISK (0-30)
```
┌────────────────────────────────────┐
│ ✓ LOW RISK                  15/100 │
│ Your cognitive health is strong.   │
│ Keep up the balanced approach!     │
│                                    │
│ Days Since Rest: 2                 │
│                                    │
│ [View Detailed Analytics]          │  ← Subtle button
└────────────────────────────────────┘
```

#### HIGH RISK (60-80) - Enhanced
```
┌────────────────────────────────────┐
│ ⚠️ HIGH RISK                 72/100 │
│ You need a break soon.             │
│                                    │
│ Days Since Rest: 8 ⚠️              │
│                                    │
│ Contributing Factors:              │
│ • Sleep Deficit      [████████░░]  │
│ • High Volume        [███████░░░]  │
│                                    │
│ Recommendations:                   │
│ 1. Schedule rest within 24h        │
│ 2. Reduce session to 2h max        │
│                                    │
│ [Take Break]  [Reschedule]         │  ← NEW: Action buttons
└────────────────────────────────────┘
```

#### CRITICAL RISK (80+) - Most Prominent
```
┌────────────────────────────────────┐
│ 🛑 CRITICAL RISK             92/100 │
│ Take immediate action!             │
│                                    │
│ Days Since Rest: 12 🔴             │
│                                    │
│ [Take Break]  [Reschedule]         │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ ⚠️ Continuing to study at    │   │  ← NEW: Critical warning
│ │ this load may harm retention │   │
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
```

**Button Micro-Interactions:**
```css
/* Hover: Subtle grow */
hover:scale-[1.02]

/* Press: Subtle shrink */
active:scale-[0.98]

/* Transition: Smooth */
transition-all duration-200
```

---

### 4. Stress Patterns Timeline

**Chart Enhancements:**

```
LOAD PATTERNS                       [7 Days] [30 Days]

Avg: 45    Peak: 78    Overload: 2

100┤
   │                    ╱●            ← Critical threshold (red)
 80├─────────────────●─────────────
   │              ╱  │               ← High threshold (orange)
 60├───────────●─────┼──────────────
   │        ╱  │     │               ← Moderate threshold (yellow)
 40├─────●─────┼─────┼──────────────
   │  ╱  │     │     │
 20├●────┼─────┼─────┼──────────────
   │
  0└─────────────────────────────────
    Mon  Tue  Wed  Thu  Fri  Sat  Sun

Load trending downward ↘
```

**Data Point States:**
- **Normal:** Small circle (5px), zone color
- **Overload:** Large circle (7px), red outline
- **Hover:** Enlarged (8px), tooltip appears
- **Active:** Inverted colors (white fill, blue stroke)

**Tooltip Content:**
```
┌─────────────────────────┐
│ Wed Oct 18, 2:30 PM     │
│                         │
│ Load Score:        78   │
│ Level:          High    │
│                         │
│ Stress Indicators:      │
│ • Long session (3h)     │
│ • Difficult material    │
│ • Low sleep (5h)        │
│                         │
│ ⚠️ Overload Detected    │
└─────────────────────────┘
```

**Summary Cards (NEW Hover Effect):**
```
┌─────────────┬─────────────┬─────────────┐
│ Avg Load    │ Peak Load   │ Overload    │
│             │             │  Events     │
│     45      │     78      │      2      │
└─────────────┴─────────────┴─────────────┘
     ↑ Hover: Scale 1.02, background lightens
```

---

## OKLCH Color Reference

### Cognitive Load Zones
```css
--load-low:      oklch(0.7 0.15 145);  /* Green */
--load-moderate: oklch(0.8 0.15 90);   /* Yellow */
--load-high:     oklch(0.7 0.15 50);   /* Orange */
--load-critical: oklch(0.6 0.20 30);   /* Red */
```

### Chart Theme
```css
--chart-primary: oklch(0.65 0.2 240);  /* Blue line */
--chart-grid:    oklch(0.9 0.02 230);  /* Light gray grid */
--chart-axis:    oklch(0.6 0.03 230);  /* Medium gray axis */
--chart-text:    oklch(0.5 0.05 230);  /* Dark gray text */
```

### UI Elements
```css
--success:  oklch(0.7 0.15 145);   /* Green */
--warning:  oklch(0.8 0.15 90);    /* Yellow/Orange */
--info:     oklch(0.65 0.18 240);  /* Blue */
```

---

## Animation Timings

### Wave 3 Standards
```css
/* Micro-interactions (buttons, toggles) */
duration-200  /* 200ms */

/* Card hover, progress bars */
duration-300  /* 300ms */

/* Progress bar fill */
duration-500  /* 500ms */

/* Chart entrance */
duration-800  /* 800ms */
```

### Easing Functions
```css
ease-out         /* Button hover */
ease-in-out      /* Transitions */
[0, 0, 0.2, 1]   /* Cubic bezier (smooth) */
```

---

## Glassmorphism Style

**Card Template:**
```css
background-color: oklch(1 0 0 / 0.8);        /* White 80% */
backdrop-filter: blur(12px);                  /* Blur background */
border: 1px solid oklch(1 0 0 / 0.3);       /* White 30% border */
box-shadow: 0 8px 32px oklch(0 0 0 / 0.1);  /* Soft shadow */
border-radius: 0.75rem;                       /* 12px rounded */
```

**Hover State:**
```css
box-shadow: 0 12px 40px oklch(0 0 0 / 0.15);  /* Deeper shadow */
transition: all 300ms ease-out;
```

---

## Accessibility Features

### Screen Reader Announcements
```html
<!-- Cognitive Load Meter -->
<div class="sr-only" role="status" aria-live="polite">
  Cognitive load is Moderate Load at 58 percent.
  Load is trending stable.
  Productive learning - stay engaged.
</div>

<!-- Burnout Risk Panel -->
<div class="sr-only" role="status" aria-live="polite">
  Burnout risk is High Risk with a score of 72 out of 100.
  It has been 8 days since your last rest day.
  3 recommendations available.
</div>
```

### Keyboard Navigation
- Tab order: Header → Load Meter → Timeline → Burnout Panel
- Action buttons: Enter/Space to activate
- Chart: Arrow keys to navigate data points
- Toggle: Tab to select, Enter to switch

---

## Responsive Breakpoints

### Desktop (1024px+) - Primary Target
```
┌─────────────┬──────────────────────────┐
│ Load Meter  │ Timeline                 │
│ (1/3 width) │ (2/3 width)             │
└─────────────┴──────────────────────────┘
┌──────────────────┬───────────────────────┐
│ Burnout Panel    │ Stress Profile        │
│ (1/2 width)      │ (1/2 width)          │
└──────────────────┴───────────────────────┘
```

### Tablet (768px-1023px)
```
┌──────────────────────────────────────────┐
│ Load Meter                               │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ Timeline                                 │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│ Burnout Panel                            │
└──────────────────────────────────────────┘
```

### Mobile (< 768px)
*Not optimized yet - desktop-first implementation*

---

## Performance Optimizations

### Real-Time Updates
```typescript
// Dashboard polling (cognitive-health-dashboard.tsx)
const REFRESH_INTERVAL_MS = 30 * 1000  // 30 seconds

useEffect(() => {
  const intervalId = setInterval(() => {
    fetchCognitiveHealthData()
  }, REFRESH_INTERVAL_MS)

  return () => clearInterval(intervalId)  // Cleanup on unmount
}, [])
```

### Chart Rendering
```typescript
// Recharts animation config
<Line
  isAnimationActive={true}
  animationDuration={800}
  animationEasing="ease-out"
  // ... other props
/>
```

### Memoization
- Recharts uses `React.memo` internally
- Summary stats computed via `useMemo`
- Data transformations cached per time range

---

## Browser Support

### Tested ✅
- Chrome 120+ (Primary)
- Safari 17+ (macOS)

### Should Work (Not Tested)
- Firefox 121+
- Edge 120+

### Requires Polyfills
- Internet Explorer: Not supported (OKLCH colors)

---

## Future Enhancements

### Planned (Story 5.5+)
1. **Stress Event Markers**
   - Exam indicators on timeline
   - Deadline annotations
   - Custom event tagging

2. **Comparative Views**
   - This week vs last week overlay
   - Month-over-month trends
   - Semester averages

3. **Mobile Optimization**
   - Touch-friendly chart interactions
   - Responsive card stacking
   - Mobile-specific tooltips

4. **Dark Mode Polish**
   - Adjust glassmorphism opacity
   - Brighter chart colors
   - Enhanced contrast

---

## Code Examples

### Implementing OKLCH Progress Bar
```tsx
// Multi-segment progress bar
<div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden relative">
  <div className="absolute inset-0 flex">
    {Object.entries(LOAD_ZONES).map(([zoneName, zoneData]) => {
      const [zoneMin, zoneMax] = zoneData.range
      const zoneWidth = ((zoneMax - zoneMin) / 100) * 100
      const isActive = loadPercentage > zoneMin
      const fillWidth = isActive
        ? Math.min(loadPercentage - zoneMin, zoneMax - zoneMin)
        : 0
      const fillPercentage = (fillWidth / (zoneMax - zoneMin)) * 100

      return (
        <div key={zoneName} style={{ width: `${zoneWidth}%` }}>
          <div
            className="h-3 transition-all duration-500 ease-out"
            style={{
              width: `${fillPercentage}%`,
              backgroundColor: zoneData.color,  // OKLCH color
            }}
          />
        </div>
      )
    })}
  </div>
</div>
```

### Wave 3 Button States
```tsx
<button
  onClick={handleAction}
  className="py-3 px-4 rounded-lg font-semibold text-white
             transition-all duration-200
             hover:scale-[1.02] active:scale-[0.98]
             flex items-center justify-center gap-2"
  style={{ backgroundColor: riskColor }}
>
  <span>Take Break</span>
</button>
```

### Recharts Theme Application
```tsx
import { chartTheme, chartColors } from '@/lib/chart-theme'

<LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
  <CartesianGrid {...chartTheme.grid} />
  <XAxis {...chartTheme.axis} tick={{ fill: chartColors.text }} />
  <YAxis {...chartTheme.axis} tick={{ fill: chartColors.text }} />
  <Tooltip content={<CustomTooltip />} cursor={chartTheme.tooltip.cursor} />
  <Line
    stroke={chartColors.primary}
    isAnimationActive={true}
    animationDuration={800}
  />
</LineChart>
```

---

## Testing Checklist

### Visual Regression
- [ ] Circular gauge displays correctly
- [ ] Progress bar colors match zones
- [ ] Burnout alerts show for HIGH/CRITICAL
- [ ] Chart labels visible and positioned
- [ ] Tooltips appear on hover
- [ ] Buttons have proper states

### Interaction
- [ ] 30s polling updates meter
- [ ] Time range toggle switches views
- [ ] Action buttons clickable
- [ ] Chart data points clickable
- [ ] Hover effects smooth

### Accessibility
- [ ] Screen reader announces changes
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] ARIA labels present

---

**End of Visual Guide**

For implementation details, see `STORY-5.4-UI-POLISH-SUMMARY.md`
For technical checklist, see `STORY-5.4-POLISH-CHECKLIST.md`

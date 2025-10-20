# Epic 5 UI/UX Design System Guide

**Document Version**: 1.0.0
**Last Updated**: 2025-10-20
**Status**: Production-Ready
**Epic**: Epic 5 - Behavioral Twin Engine
**Compliance**: WCAG 2.1 AAA, Perceptual Uniformity

---

## Executive Summary

This document defines the complete design system for Epic 5 (Behavioral Twin Engine), a world-class adaptive learning platform. The system prioritizes **research-grade excellence**, **accessibility (WCAG AAA)**, and **perceptual consistency** through OKLCH color space, motion.dev animations, and glassmorphism aesthetics.

### Design Principles

1. **NO GRADIENTS** - Solid colors only (glassmorphism instead)
2. **OKLCH ONLY** - Perceptual uniformity, no hex/HSL/RGB
3. **8px Grid** - All spacing, sizing, and layout
4. **Accessibility First** - WCAG 2.1 AAA (7:1 contrast minimum)
5. **Research-Grade** - Visual polish matching scientific rigor

---

## 1. Color System

### 1.1 OKLCH Format (Required)

**All colors must use OKLCH format:**

```css
oklch(L C H)
```

- **L** (Lightness): 0-1 (0 = black, 1 = white)
- **C** (Chroma): 0-0.4 (0 = grayscale, 0.4 = vivid)
- **H** (Hue): 0-360 degrees (0 = red, 120 = green, 240 = blue)

**Why OKLCH?**
- Perceptual uniformity (equal L = equal brightness across hues)
- WCAG contrast ratios easier to maintain
- Future-proof (P3 color gamut support)

---

### 1.2 Complete Color Palette

#### Semantic Colors (Light Mode)

```css
/* Backgrounds & Text */
--color-background: oklch(0.985 0 0);          /* Page background */
--color-foreground: oklch(0.145 0 0);          /* Primary text */
--color-muted: oklch(0.97 0 0);                /* Muted background */
--color-muted-foreground: oklch(0.556 0 0);    /* Muted text */

/* Brand (Primary) */
--color-primary: oklch(0.205 0 0);             /* Near-black brand */
--color-primary-foreground: oklch(0.985 0 0); /* White on primary */

/* Interactive States */
--color-secondary: oklch(0.97 0 0);            /* Secondary bg */
--color-secondary-foreground: oklch(0.205 0 0); /* Dark text */
--color-accent: oklch(0.97 0 0);               /* Hover/focus bg */
--color-accent-foreground: oklch(0.205 0 0);   /* Dark text */

/* Feedback Colors */
--color-success: oklch(0.7 0.15 145);          /* Green (achieved) */
--color-success-foreground: oklch(0.98 0.01 145);
--color-warning: oklch(0.8 0.15 90);           /* Yellow (caution) */
--color-warning-foreground: oklch(0.3 0.12 90);
--color-info: oklch(0.65 0.18 240);            /* Blue (informative) */
--color-info-foreground: oklch(0.97 0.02 240);
--color-destructive: oklch(0.577 0.245 27.325); /* Red (error) */
--color-destructive-foreground: oklch(0.985 0 0);

/* Borders & UI Elements */
--color-border: oklch(0.922 0 0);              /* Light border */
--color-input: oklch(0.922 0 0);               /* Input border */
--color-ring: oklch(0.708 0 0);                /* Focus ring */
```

#### Dark Mode Colors

```css
/* Backgrounds & Text */
--color-background: oklch(0.145 0 0);          /* Dark background */
--color-foreground: oklch(0.985 0 0);          /* Light text */
--color-muted: oklch(0.269 0 0);               /* Dark muted */
--color-muted-foreground: oklch(0.708 0 0);    /* Light muted text */

/* Brand (Primary) - Inverted */
--color-primary: oklch(0.985 0 0);             /* White brand */
--color-primary-foreground: oklch(0.205 0 0); /* Black on primary */

/* Feedback Colors (Adjusted for Dark) */
--color-success: oklch(0.75 0.18 145);         /* Brighter green */
--color-warning: oklch(0.85 0.18 85);          /* Brighter yellow */
--color-info: oklch(0.7 0.2 240);              /* Brighter blue */
--color-destructive: oklch(0.396 0.141 25.723); /* Darker red */

/* Borders & UI Elements */
--color-border: oklch(0.269 0 0);              /* Dark border */
--color-ring: oklch(0.439 0 0);                /* Focus ring */
```

---

### 1.3 Chart Colors (Data Visualization)

**Light Mode:**
```css
--color-chart-1: oklch(0.646 0.222 41.116);  /* Warm orange */
--color-chart-2: oklch(0.6 0.118 184.704);   /* Teal */
--color-chart-3: oklch(0.398 0.07 227.392);  /* Blue */
--color-chart-4: oklch(0.828 0.189 84.429);  /* Yellow-green */
--color-chart-5: oklch(0.769 0.188 70.08);   /* Yellow */

/* Grid & Axes */
--color-chart-grid: oklch(0.9 0.02 230);     /* Light grid lines */
--color-chart-axis: oklch(0.6 0.03 230);     /* Axis lines */
--color-chart-text: oklch(0.5 0.05 230);     /* Axis labels */
```

**Dark Mode:**
```css
--color-chart-1: oklch(0.488 0.243 264.376); /* Indigo */
--color-chart-2: oklch(0.696 0.17 162.48);   /* Green-cyan */
--color-chart-3: oklch(0.769 0.188 70.08);   /* Yellow */
--color-chart-4: oklch(0.627 0.265 303.9);   /* Purple */
--color-chart-5: oklch(0.645 0.246 16.439);  /* Rose */

/* Grid & Axes */
--color-chart-grid: oklch(0.3 0.02 230);     /* Dark grid */
--color-chart-axis: oklch(0.5 0.03 230);     /* Axis lines */
--color-chart-text: oklch(0.7 0.05 230);     /* Axis labels */
```

**Accessibility:**
- All chart colors tested for color-blind safety (protanopia, deuteranopia, tritanopia)
- Minimum 15% lightness difference between adjacent series
- 3:1 contrast ratio against background

---

### 1.4 Cognitive Load Zone Colors (Epic 5 Specific)

```css
/* Low Load (Green - Optimal) */
--color-load-low: oklch(0.7 0.15 145);
--color-load-low-bg: oklch(0.95 0.1 145);

/* Moderate Load (Yellow - Acceptable) */
--color-load-moderate: oklch(0.8 0.15 90);
--color-load-moderate-bg: oklch(0.95 0.12 90);

/* High Load (Orange - Warning) */
--color-load-high: oklch(0.7 0.15 50);
--color-load-high-bg: oklch(0.95 0.12 50);

/* Critical Load (Red - Danger) */
--color-load-critical: oklch(0.6 0.20 30);
--color-load-critical-bg: oklch(0.95 0.15 30);
```

**Usage:**
```tsx
// Cognitive Load Meter
<div className={`
  ${loadScore < 40 ? 'bg-load-low-bg text-load-low' : ''}
  ${loadScore >= 40 && loadScore < 60 ? 'bg-load-moderate-bg text-load-moderate' : ''}
  ${loadScore >= 60 && loadScore < 80 ? 'bg-load-high-bg text-load-high' : ''}
  ${loadScore >= 80 ? 'bg-load-critical-bg text-load-critical' : ''}
`}>
  Load: {loadScore}
</div>
```

---

## 2. Typography

### 2.1 Font Families

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-heading: "DM Sans", ui-sans-serif, system-ui, sans-serif;
```

**Font Loading:**
```tsx
// In app/layout.tsx or globals.css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap");
```

**Usage:**
- **Body text**: `font-sans` (Inter)
- **Headings**: `font-heading` (DM Sans)

---

### 2.2 Font Scale (9 Steps)

```css
--font-size-xs: 0.75rem;   /* 12px - Captions, metadata */
--font-size-sm: 0.875rem;  /* 14px - Small text, labels */
--font-size-base: 1rem;    /* 16px - Body text */
--font-size-lg: 1.125rem;  /* 18px - Large body */
--font-size-xl: 1.25rem;   /* 20px - Subheadings */
--font-size-2xl: 1.5rem;   /* 24px - H3 */
--font-size-3xl: 1.875rem; /* 30px - H2 */
--font-size-4xl: 2.25rem;  /* 36px - H1 */
--font-size-5xl: 3rem;     /* 48px - Hero headings */
```

**Tailwind Classes:**
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`

---

### 2.3 Font Weights

```css
--font-normal: 400;   /* Regular text */
--font-medium: 500;   /* Emphasized text */
--font-semibold: 600; /* Strong emphasis */
--font-bold: 700;     /* Headings, CTAs */
```

**Tailwind Classes:**
- `font-normal`, `font-medium`, `font-semibold`, `font-bold`

---

### 2.4 Line Heights

```css
--leading-tight: 1.2;   /* Headings */
--leading-normal: 1.5;  /* Body text */
--leading-relaxed: 1.75; /* Long-form content */
```

**Tailwind Classes:**
- `leading-tight`, `leading-normal`, `leading-relaxed`

---

### 2.5 Typography Examples

```tsx
// H1 - Page Title
<h1 className="font-heading text-4xl font-bold leading-tight text-foreground">
  Behavioral Insights Dashboard
</h1>

// H2 - Section Header
<h2 className="font-heading text-3xl font-semibold leading-tight text-foreground">
  Cognitive Load Analysis
</h2>

// H3 - Card Title
<h3 className="font-heading text-2xl font-medium leading-tight text-foreground">
  Recent Patterns
</h3>

// Body Text
<p className="font-sans text-base font-normal leading-normal text-foreground">
  Your cognitive load has been moderate this week, averaging 45% during study sessions.
</p>

// Muted Text
<p className="font-sans text-sm font-normal leading-normal text-muted-foreground">
  Last updated: 2 hours ago
</p>

// Label
<label className="font-sans text-sm font-medium leading-normal text-foreground">
  Mission Duration
</label>
```

---

## 3. Spacing System (8px Grid)

### 3.1 Spacing Scale

```css
--spacing-1: 0.5rem;  /* 8px */
--spacing-2: 1rem;    /* 16px */
--spacing-3: 1.5rem;  /* 24px */
--spacing-4: 2rem;    /* 32px */
--spacing-5: 2.5rem;  /* 40px */
--spacing-6: 3rem;    /* 48px */
--spacing-8: 4rem;    /* 64px */
--spacing-10: 5rem;   /* 80px */
--spacing-12: 6rem;   /* 96px */
```

**Tailwind Classes:**
- Padding: `p-1` (8px), `p-2` (16px), `p-3` (24px), `p-4` (32px), `p-6` (48px), `p-8` (64px)
- Margin: `m-1`, `m-2`, `m-3`, `m-4`, `m-6`, `m-8`, `m-10`, `m-12`
- Gap (Flexbox/Grid): `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`

---

### 3.2 Spacing Usage Guidelines

**Component Padding:**
- **Small cards**: `p-4` (32px)
- **Medium cards**: `p-6` (48px)
- **Large panels**: `p-8` (64px)

**Stack Spacing (Vertical):**
- **Tight**: `space-y-2` (16px between items)
- **Normal**: `space-y-4` (32px between sections)
- **Loose**: `space-y-6` (48px between major sections)

**Grid Gaps:**
- **Tight grid**: `gap-2` (16px)
- **Normal grid**: `gap-4` (32px)
- **Loose grid**: `gap-6` (48px)

**Page Margins:**
- **Mobile**: `px-4` (32px horizontal)
- **Desktop**: `px-8` or `px-12` (64-96px horizontal)

---

## 4. Component Library

### 4.1 Button Variants

**Primary Button (CTA):**
```tsx
<Button variant="default" className="bg-primary text-primary-foreground">
  Generate Predictions
</Button>
```

**Secondary Button:**
```tsx
<Button variant="secondary" className="bg-secondary text-secondary-foreground">
  View Details
</Button>
```

**Ghost Button:**
```tsx
<Button variant="ghost" className="hover:bg-accent hover:text-accent-foreground">
  Cancel
</Button>
```

**Destructive Button:**
```tsx
<Button variant="destructive" className="bg-destructive text-destructive-foreground">
  Delete Intervention
</Button>
```

**Size Variants:**
```tsx
<Button size="sm">Small</Button>    {/* 32px height */}
<Button size="default">Default</Button> {/* 40px height */}
<Button size="lg">Large</Button>    {/* 48px height */}
```

---

### 4.2 Card Styles

**Basic Card (Glassmorphism):**
```tsx
<Card className="bg-white/80 backdrop-blur-md border border-border shadow-sm">
  <CardHeader>
    <CardTitle className="text-2xl font-heading">Card Title</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Description text
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="secondary">Cancel</Button>
    <Button variant="default">Apply</Button>
  </CardFooter>
</Card>
```

**Interactive Card (Hover State):**
```tsx
<Card className="
  bg-white/80 backdrop-blur-md border border-border
  hover:border-primary hover:shadow-md
  transition-all duration-200
  cursor-pointer
">
  {/* Content */}
</Card>
```

**Nested Card (Layering):**
```tsx
{/* Outer card */}
<Card className="bg-white/80 backdrop-blur-md">
  {/* Inner card (higher opacity for depth) */}
  <Card className="bg-white/90 backdrop-blur-sm">
    {/* Content */}
  </Card>
</Card>
```

---

### 4.3 Skeleton States (Exact Dimensions)

**Critical for CLS = 0.0 (Cumulative Layout Shift)**

```tsx
// Pattern Dashboard Skeleton
<Card className="h-[520px] w-full">
  <CardHeader className="h-20">
    <Skeleton className="h-8 w-48" /> {/* Title */}
    <Skeleton className="h-4 w-64 mt-2" /> {/* Description */}
  </CardHeader>
  <CardContent className="space-y-4">
    <Skeleton className="h-64 w-full" /> {/* Chart */}
    <div className="flex gap-4">
      <Skeleton className="h-12 w-24" /> {/* Metric 1 */}
      <Skeleton className="h-12 w-24" /> {/* Metric 2 */}
      <Skeleton className="h-12 w-24" /> {/* Metric 3 */}
    </div>
  </CardContent>
</Card>
```

**5 Skeleton Types:**
1. **Dashboard skeleton**: Full layout with chart placeholders
2. **Table skeleton**: Rows with column widths
3. **Card skeleton**: Card shape with title/content
4. **Chart skeleton**: Chart container with axis placeholders
5. **List skeleton**: Multiple rows of varying widths

---

### 4.4 Empty States

**6 Empty State Types:**

```tsx
// 1. No Data Yet
<EmptyState
  icon={<FileQuestion className="h-12 w-12 text-muted-foreground" />}
  title="No data yet"
  description="Complete 6+ weeks of study for behavioral insights."
  action={<Button>Start First Session</Button>}
/>

// 2. No Patterns Detected
<EmptyState
  icon={<TrendingUp className="h-12 w-12 text-muted-foreground" />}
  title="No patterns detected"
  description="We need more data to identify patterns. Keep studying!"
/>

// 3. No Predictions Available
<EmptyState
  icon={<Sparkles className="h-12 w-12 text-muted-foreground" />}
  title="No predictions available"
  description="Predictions will appear after 3+ weeks of consistent study."
  action={<Button variant="secondary">Learn More</Button>}
/>

// 4. All Interventions Applied
<EmptyState
  icon={<CheckCircle2 className="h-12 w-12 text-success" />}
  title="All caught up!"
  description="No pending interventions. Great work!"
/>

// 5. Insufficient Data Quality
<EmptyState
  icon={<AlertCircle className="h-12 w-12 text-warning" />}
  title="Insufficient data quality"
  description="Data quality score: 0.45 (need ≥0.6 for personalization)."
  action={<Button>View Details</Button>}
/>

// 6. Error State
<EmptyState
  icon={<XCircle className="h-12 w-12 text-destructive" />}
  title="Failed to load data"
  description="An error occurred while loading behavioral insights."
  action={<Button onClick={retry}>Retry</Button>}
/>
```

---

### 4.5 Badge Components

```tsx
// Success Badge
<Badge variant="success" className="bg-success-foreground text-success">
  Low Risk
</Badge>

// Warning Badge
<Badge variant="warning" className="bg-warning-foreground text-warning">
  Medium Risk
</Badge>

// Destructive Badge
<Badge variant="destructive" className="bg-destructive text-destructive-foreground">
  High Risk
</Badge>

// Info Badge
<Badge variant="outline" className="border-info text-info">
  Pending
</Badge>

// Default Badge
<Badge variant="default" className="bg-primary text-primary-foreground">
  New Pattern
</Badge>
```

---

## 5. Glassmorphism System

### 5.1 Core Glassmorphism Pattern

**NO GRADIENTS - Use glassmorphism instead:**

```css
/* Standard Glass Effect */
.glass {
  background: oklch(1 0 0 / 0.8);  /* 80% white opacity */
  backdrop-filter: blur(12px);      /* Medium blur */
  border: 1px solid oklch(1 0 0 / 0.2); /* 20% white border */
  box-shadow: 0 8px 32px oklch(0.145 0 0 / 0.1); /* Subtle shadow */
}

/* Enhanced Glass (More Prominent) */
.glass-enhanced {
  background: oklch(1 0 0 / 0.9);  /* 90% white opacity */
  backdrop-filter: blur(16px);      /* Strong blur */
  border: 1px solid oklch(1 0 0 / 0.3);
  box-shadow: 0 12px 48px oklch(0.145 0 0 / 0.15);
}

/* Subtle Glass (Less Prominent) */
.glass-subtle {
  background: oklch(1 0 0 / 0.6);  /* 60% white opacity */
  backdrop-filter: blur(8px);       /* Light blur */
  border: 1px solid oklch(1 0 0 / 0.15);
  box-shadow: 0 4px 16px oklch(0.145 0 0 / 0.05);
}
```

**Tailwind Utilities:**
```tsx
<Card className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
  {/* Content */}
</Card>
```

---

### 5.2 Layering System

**Z-index Hierarchy:**
```css
--z-base: 0;          /* Base layer */
--z-card: 10;         /* Cards */
--z-dropdown: 20;     /* Dropdowns, popovers */
--z-modal: 30;        /* Modals, dialogs */
--z-toast: 40;        /* Toast notifications */
--z-tooltip: 50;      /* Tooltips (highest) */
```

**Opacity Layering (Nested Glass):**
- **Base card**: 80% opacity
- **Nested card**: 90% opacity (creates depth)
- **Triple nested**: 95% opacity (rare, use sparingly)

---

### 5.3 Glassmorphism Examples

```tsx
// Dashboard Panel
<div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-lg">
  <h2 className="text-2xl font-heading font-semibold mb-4">Cognitive Load</h2>
  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4">
    {/* Nested content */}
  </div>
</div>

// Floating Action Button
<button className="
  fixed bottom-6 right-6
  bg-primary/90 backdrop-blur-md
  text-primary-foreground
  rounded-full p-4 shadow-xl
  hover:bg-primary
  transition-all duration-200
">
  <Plus className="h-6 w-6" />
</button>

// Sidebar (Global Layout)
<aside className="bg-white/80 backdrop-blur-md border-r border-white/20">
  {/* Sidebar content */}
</aside>
```

---

## 6. Animation System (motion.dev)

### 6.1 Animation Library

**Library**: `motion` (motion.dev, NOT Framer Motion - deprecated)

**Installation:**
```bash
pnpm add motion
```

**Import:**
```tsx
import { motion, AnimatePresence } from 'motion/react'
```

---

### 6.2 Animation Variants

**Fade In:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {content}
</motion.div>
```

**Slide Up:**
```tsx
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -20, opacity: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {content}
</motion.div>
```

**Scale (Micro-interaction):**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.15 }}
>
  Click Me
</motion.button>
```

**Stagger Children:**
```tsx
<motion.ul
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.li
      key={item.id}
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
      }}
    >
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

---

### 6.3 Timing & Easing

```tsx
// Standard durations
const durations = {
  fast: 0.15,      // Micro-interactions (hover, tap)
  normal: 0.3,     // Standard transitions
  slow: 0.5        // Page transitions
}

// Easing curves
const easings = {
  easeOut: [0.0, 0.0, 0.2, 1],    // Decelerate (default)
  easeIn: [0.4, 0.0, 1, 1],       // Accelerate
  easeInOut: [0.4, 0.0, 0.2, 1],  // Smooth both ends
  spring: { type: 'spring', stiffness: 300, damping: 30 } // Bouncy
}

// Usage
<motion.div
  animate={{ x: 100 }}
  transition={{ duration: durations.normal, ease: easings.easeOut }}
>
  {content}
</motion.div>
```

---

### 6.4 Reduced Motion Support

**WCAG 2.1 AAA Compliance:**

```tsx
import { useReducedMotion } from 'motion/react'

function MyComponent() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{ x: 100 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: 'easeOut'
      }}
    >
      {content}
    </motion.div>
  )
}
```

**CSS Approach:**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 6.5 Page Transitions

```tsx
// Layout with AnimatePresence
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

---

## 7. Chart Theming (Recharts)

### 7.1 Recharts Configuration

```tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// Chart Theme
const chartTheme = {
  grid: 'var(--color-chart-grid)',
  axis: 'var(--color-chart-axis)',
  text: 'var(--color-chart-text)',
  line1: 'var(--color-chart-1)',
  line2: 'var(--color-chart-2)',
  line3: 'var(--color-chart-3)',
  line4: 'var(--color-chart-4)',
  line5: 'var(--color-chart-5)',
}

// Usage
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
    <XAxis
      dataKey="date"
      stroke={chartTheme.axis}
      style={{ fontSize: 12, fill: chartTheme.text }}
    />
    <YAxis
      stroke={chartTheme.axis}
      style={{ fontSize: 12, fill: chartTheme.text }}
    />
    <Tooltip
      contentStyle={{
        background: 'oklch(1 0 0 / 0.95)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
      }}
    />
    <Line
      type="monotone"
      dataKey="value"
      stroke={chartTheme.line1}
      strokeWidth={2}
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

---

### 7.2 Cognitive Load Chart (Special Case)

```tsx
// Color zones based on load value
const getLoadColor = (value: number) => {
  if (value < 40) return 'var(--color-load-low)'
  if (value < 60) return 'var(--color-load-moderate)'
  if (value < 80) return 'var(--color-load-high)'
  return 'var(--color-load-critical)'
}

// Chart with dynamic coloring
<Line
  type="monotone"
  dataKey="loadScore"
  stroke={getLoadColor(loadScore)}
  strokeWidth={3}
/>
```

---

## 8. Accessibility (WCAG 2.1 AAA)

### 8.1 Contrast Requirements

**Normal text (< 18px or < 14px bold):**
- **Minimum**: 7:1 contrast ratio
- **Example**: `oklch(0.145 0 0)` on `oklch(0.985 0 0)` = 15.9:1 ✓

**Large text (≥ 18px or ≥ 14px bold):**
- **Minimum**: 4.5:1 contrast ratio
- **Example**: `oklch(0.556 0 0)` on `oklch(0.985 0 0)` = 5.2:1 ✓

**UI components (borders, icons):**
- **Minimum**: 3:1 contrast ratio
- **Example**: `oklch(0.922 0 0)` on `oklch(0.985 0 0)` = 1.15:1 ✗ (needs darker border for critical UI)

---

### 8.2 Focus Indicators

```css
*:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

/* Alternative: Ring utility */
.focus-visible:outline-none .focus-visible:ring-2 .focus-visible:ring-ring .focus-visible:ring-offset-2
```

**Usage:**
```tsx
<Button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
  Click Me
</Button>
```

---

### 8.3 Screen Reader Support

```tsx
// Skip to main content
<a href="#main-content" className="skip-to-main sr-only focus:not-sr-only">
  Skip to main content
</a>

// ARIA labels
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// ARIA live regions
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// ARIA describedby
<input
  id="mission-duration"
  aria-describedby="mission-duration-help"
/>
<p id="mission-duration-help" className="text-sm text-muted-foreground">
  Recommended: 50 minutes
</p>
```

---

### 8.4 Keyboard Navigation

**Tab Order:**
1. Skip to main content link
2. Primary navigation
3. Page content (interactive elements in DOM order)
4. Footer links

**Keyboard Shortcuts (Document in UI):**
- `Tab` / `Shift+Tab`: Navigate forward/backward
- `Enter` / `Space`: Activate button
- `Esc`: Close modal/dropdown
- `Arrow Keys`: Navigate within dropdowns/menus

---

## 9. Responsive Design

### 9.1 Breakpoints

```css
/* Tailwind default breakpoints (DO NOT customize) */
--screen-sm: 640px;   /* sm: */
--screen-md: 768px;   /* md: */
--screen-lg: 1024px;  /* lg: */
--screen-xl: 1280px;  /* xl: */
--screen-2xl: 1536px; /* 2xl: */
```

---

### 9.2 Mobile-First Approach

```tsx
// Mobile-first (base = mobile, add larger breakpoints)
<div className="
  p-4           {/* Mobile: 32px padding */}
  md:p-6        {/* Tablet: 48px padding */}
  lg:p-8        {/* Desktop: 64px padding */}
">
  <h1 className="
    text-2xl     {/* Mobile: 24px */}
    md:text-3xl  {/* Tablet: 30px */}
    lg:text-4xl  {/* Desktop: 36px */}
  ">
    Title
  </h1>
</div>
```

---

### 9.3 Grid Layouts

```tsx
// Responsive grid
<div className="
  grid
  grid-cols-1      {/* Mobile: 1 column */}
  md:grid-cols-2   {/* Tablet: 2 columns */}
  lg:grid-cols-3   {/* Desktop: 3 columns */}
  gap-4            {/* 32px gap */}
">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

---

## 10. Production Checklist

### 10.1 Pre-Launch Checklist

- [ ] **Color Audit**: All colors use OKLCH format (no hex/HSL/RGB)
- [ ] **Gradient Check**: NO gradients anywhere (glassmorphism only)
- [ ] **Contrast Audit**: Run axe DevTools, verify WCAG AAA (7:1 normal, 4.5:1 large)
- [ ] **Focus Indicators**: All interactive elements have visible focus states
- [ ] **Screen Reader Test**: Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] **Keyboard Navigation**: Test full app navigation without mouse
- [ ] **Reduced Motion**: Test with `prefers-reduced-motion: reduce`
- [ ] **Mobile Test**: Test on physical iOS and Android devices
- [ ] **Chart Accessibility**: Verify chart colors are color-blind safe
- [ ] **Typography Check**: All headings use `font-heading`, body uses `font-sans`
- [ ] **Spacing Audit**: All spacing uses 8px grid multiples
- [ ] **Skeleton States**: All async components have exact-dimension skeletons
- [ ] **Empty States**: All data-driven UIs have 6 empty state types
- [ ] **Animation Test**: Verify motion.dev animations (NOT Framer Motion)
- [ ] **Glassmorphism**: Verify all cards use glassmorphism (no solid backgrounds)

---

### 10.2 Performance Checklist

- [ ] **Bundle Size**: Verify glassmorphism CSS not causing bundle bloat
- [ ] **Animation Performance**: Check for jank (maintain 60fps)
- [ ] **Chart Performance**: Large datasets (>1000 points) use data sampling
- [ ] **Image Optimization**: All images use WebP with JPEG fallback
- [ ] **Font Loading**: Inter and DM Sans loaded with `font-display: swap`

---

## 11. Resources & Tools

### 11.1 Design Tools

- **OKLCH Color Picker**: https://oklch.com/
- **Contrast Checker**: Chrome DevTools Contrast Ratio
- **Color Blind Simulator**: https://www.color-blindness.com/coblis-color-blindness-simulator/
- **Accessibility Audit**: axe DevTools (Chrome extension)

### 11.2 Documentation

- **Tailwind CSS v4**: https://tailwindcss.com/
- **motion.dev**: https://motion.dev/
- **shadcn/ui**: https://ui.shadcn.com/
- **Recharts**: https://recharts.org/
- **WCAG 2.1 AAA**: https://www.w3.org/WAI/WCAG21/quickref/

### 11.3 Internal References

- **Color Palette**: `/apps/web/src/styles/colors.md`
- **Global Styles**: `/apps/web/src/app/globals.css`
- **Component Library**: `/apps/web/src/components/ui/*`

---

## 12. Migration Guide

### 12.1 From Hex/HSL to OKLCH

```tsx
// BEFORE (hex)
<div style={{ color: '#3b82f6' }}>Text</div>

// AFTER (OKLCH)
<div style={{ color: 'oklch(0.65 0.18 240)' }}>Text</div>

// BEFORE (Tailwind utility with hex)
<div className="text-blue-500">Text</div>

// AFTER (Custom utility or inline)
<div className="text-info">Text</div>
// OR
<div style={{ color: 'var(--color-info)' }}>Text</div>
```

---

### 12.2 From Framer Motion to motion.dev

```tsx
// BEFORE (Framer Motion - DEPRECATED)
import { motion } from 'framer-motion'

// AFTER (motion.dev)
import { motion } from 'motion/react'
```

**API is 95% compatible**, but check motion.dev docs for breaking changes.

---

### 12.3 From Gradients to Glassmorphism

```tsx
// BEFORE (gradient - FORBIDDEN)
<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  Content
</div>

// AFTER (glassmorphism)
<div className="bg-white/80 backdrop-blur-md border border-white/20 shadow-lg">
  Content
</div>
```

---

**Document Maintained By**: Wave 3-4 UI/UX Team
**Review Cycle**: Quarterly
**Last Design Audit**: 2025-10-20
**Next Review**: After Epic 5 production deployment

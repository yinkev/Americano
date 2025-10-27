# World-Class Dashboard Design Specifications (2024-2025)

**Status:** ACTIVE | **Type:** Design Reference
**Created:** 2025-10-26
**Research Sources:** Linear, Notion, Vercel, Stripe, shadcn/ui, Duolingo, industry standards

---

## Executive Summary

This document compiles world-class dashboard UI/UX patterns from leading companies (2024-2025 standards). All specifications include exact CSS/Tailwind values for immediate implementation.

**Key Principles:**
- 8px grid system (base unit for all spacing)
- 240px sidebar width (collapsed: 56-64px)
- 16-24px card padding
- Glassmorphism with `backdrop-filter: blur(10-20px)`
- Typography scale: 24px headers, 14-16px body
- WCAG 2.1 AA contrast (minimum 4.5:1)

---

## 1. Spacing System (8px Grid)

### Spacing Scale

All spacing uses 8px as the base unit with geometric progression:

```typescript
// Design Tokens (Tailwind Config)
const spacing = {
  '0': '0px',
  '1': '4px',   // Half-step for icons/small text
  '2': '8px',   // Base unit - separate related elements
  '3': '12px',
  '4': '16px',  // Separate unrelated elements
  '5': '20px',
  '6': '24px',  // Separate sub-sections
  '7': '28px',
  '8': '32px',  // Major section breaks
  '10': '40px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
  '32': '128px',
}
```

### Usage Guidelines

| Spacing | Use Case | Tailwind Class | Pixel Value |
|---------|----------|----------------|-------------|
| `space-2` | Related elements (icon + label) | `gap-2`, `p-2` | 8px |
| `space-4` | Unrelated elements | `gap-4`, `p-4` | 16px |
| `space-6` | Sub-sections | `gap-6`, `p-6` | 24px |
| `space-8` | Major sections | `gap-8`, `p-8` | 32px |

**Notion Example (Reverse-Engineered):**
- Sidebar width: 224px
- Section gap: 6px (exception to 8px rule - custom)
- Search bar height: 30px
- Main navigation: 131px tall

---

## 2. Sidebar Navigation

### Specifications (shadcn/ui Standard)

```tsx
// Sidebar Width Constants
const SIDEBAR_CONFIG = {
  width: '15rem',          // 240px - Expanded state
  widthMobile: '18rem',    // 288px - Mobile drawer
  widthIcon: '4rem',       // 64px - Collapsed state (icon-only)
  widthCollapsed: '3.5rem' // 56px - Alternative collapsed
}
```

### Tailwind Implementation

```tsx
<SidebarProvider
  style={{
    '--sidebar-width': '240px',
    '--sidebar-width-mobile': '288px',
    '--sidebar-width-icon': '64px'
  }}
>
  <Sidebar className="w-[var(--sidebar-width)] border-r">
    {/* Sidebar content */}
  </Sidebar>
</SidebarProvider>
```

### Design Patterns (2025)

| Pattern | Width | Use Case | Example |
|---------|-------|----------|---------|
| **Wide Sidebar** | 240-300px | New users, text-heavy navigation | Notion (224px), shadcn (240px) |
| **Compact Sidebar** | 56-64px | Power users, icon-only | Linear, Figma |
| **Mobile Drawer** | 288px | Mobile responsive | Full overlay |

### Item Heights & Spacing

```css
/* Sidebar Navigation Item */
.sidebar-item {
  height: 40px;          /* Standard nav item */
  padding: 8px 16px;     /* Vertical: 8px, Horizontal: 16px */
  gap: 12px;             /* Icon to label spacing */
  border-radius: 6px;    /* Subtle rounding */
}

/* Active State */
.sidebar-item-active {
  background: rgba(255, 255, 255, 0.1); /* Glassmorphism */
  border-left: 3px solid var(--primary-color);
}

/* Hover State */
.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
  transition: background 150ms ease;
}
```

### Notion Sidebar Breakdown

- **Width:** 224px
- **Search bar:** 30px tall
- **Section gap:** 6px
- **Favorites section:** 30px high
- **Main navigation:** 131px (4 items: Search, AI, Home, Inbox)

---

## 3. Card Components

### Base Card Specifications

```tsx
// Tailwind Card Component
<div className="
  bg-white dark:bg-gray-900
  rounded-lg               /* 8px border radius */
  shadow-lg                /* Elevation */
  hover:shadow-xl          /* Lift on hover */
  transition-shadow        /* Smooth animation */
  p-6                      /* 24px padding */
  border border-gray-200   /* Subtle border */
  dark:border-gray-800
">
  {/* Card content */}
</div>
```

### Card Variants (2024-2025)

#### 1. Standard Card (Stripe-inspired)

```css
.card-standard {
  background: #ffffff;
  padding: 24px;                    /* p-6 */
  border-radius: 8px;               /* rounded-lg */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06);  /* shadow-md */
  border: 1px solid #e5e7eb;        /* border-gray-200 */
}
```

#### 2. Glassmorphism Card (Vercel-inspired)

```css
.card-glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;              /* rounded-xl */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 24px;
}

/* Dark mode variant */
.dark .card-glass {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### 3. Elevated Card (Linear-inspired)

```css
.card-elevated {
  background: #ffffff;
  padding: 20px;
  border-radius: 6px;               /* rounded-md */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -2px rgba(0, 0, 0, 0.1); /* shadow-lg */
  border: none;
}

/* Hover lift effect */
.card-elevated:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -4px rgba(0, 0, 0, 0.1); /* shadow-xl */
  transition: all 200ms ease;
}
```

### Border Radius Standards

| Size | Pixel Value | Tailwind Class | Use Case |
|------|-------------|----------------|----------|
| Small | 4px | `rounded` | Buttons, tags |
| Medium | 6px | `rounded-md` | Cards, inputs |
| Large | 8px | `rounded-lg` | Large cards |
| XL | 12px | `rounded-xl` | Hero cards, modals |
| 2XL | 16px | `rounded-2xl` | Feature sections |
| Full | 9999px | `rounded-full` | Avatars, pills |

**Best Practice:** Pick 2-3 radius values across your system (e.g., 6px for UI, 12px for features, full for avatars)

### Card Spacing

```css
/* Card Grid Layout */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;             /* Gutter between cards */
  padding: 32px;         /* Container padding */
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .dashboard-grid {
    gap: 16px;
    padding: 16px;
  }
}
```

---

## 4. Typography Scale

### Hierarchy & Sizes

```typescript
// Type Scale (Perfect Fourth - 1.33 ratio)
const typography = {
  // Display
  'display-lg': ['48px', { lineHeight: '56px', fontWeight: '700' }],
  'display-md': ['36px', { lineHeight: '44px', fontWeight: '700' }],

  // Headings
  'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
  'h2': ['24px', { lineHeight: '32px', fontWeight: '600' }],
  'h3': ['20px', { lineHeight: '28px', fontWeight: '600' }],
  'h4': ['18px', { lineHeight: '24px', fontWeight: '600' }],

  // Body
  'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
  'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
  'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],

  // Captions
  'caption': ['11px', { lineHeight: '16px', fontWeight: '400' }],
}
```

### Dashboard-Specific Typography

| Element | Font Size | Weight | Line Height | Use Case |
|---------|-----------|--------|-------------|----------|
| **Dashboard Title** | 32px (h1) | 700 | 40px | Page header |
| **Section Header** | 24px (h2) | 600 | 32px | Card groups |
| **Card Title** | 18px (h4) | 600 | 24px | Card headers |
| **Metric Value** | 24-32px | 700 | 1.2 | Stats/numbers |
| **Metric Label** | 14px | 400 | 20px | Stat descriptions |
| **Body Text** | 14-16px | 400 | 1.5 | Content |
| **Caption** | 12px | 400 | 16px | Metadata, timestamps |

### Font Families (2025 Recommended)

```css
/* Sans-serif for UI */
font-family:
  'Inter',
  'SF Pro',
  'Roboto',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;

/* Monospace for code/data */
font-family:
  'Fira Code',
  'JetBrains Mono',
  'SF Mono',
  'Cascadia Code',
  monospace;
```

### Color & Contrast

```css
/* Text Color Standards (WCAG 2.1 AA compliant) */
.text-primary {
  color: #000000;        /* Pure black for critical numbers/KPIs */
}

.text-secondary {
  color: #333333;        /* Dark gray for general text (7:1 ratio) */
}

.text-tertiary {
  color: #666666;        /* Medium gray for supporting text (4.5:1 ratio) */
}

.text-muted {
  color: #999999;        /* Light gray for metadata (3:1 ratio - use sparingly) */
}

/* Dark Mode */
.dark .text-primary {
  color: #ffffff;
}

.dark .text-secondary {
  color: #e5e7eb;        /* gray-200 */
}

.dark .text-tertiary {
  color: #9ca3af;        /* gray-400 */
}
```

---

## 5. Stats/Metric Display Cards

### Hero Metric Card (KPI Display)

```tsx
<div className="
  bg-gradient-to-br from-blue-500 to-purple-600
  rounded-xl
  p-8
  text-white
  shadow-2xl
  hover:scale-105
  transition-transform
">
  {/* Icon */}
  <div className="mb-4">
    <TrendingUpIcon className="w-8 h-8" />
  </div>

  {/* Metric Value */}
  <div className="text-4xl font-bold mb-2">
    73%
  </div>

  {/* Metric Label */}
  <div className="text-sm font-medium opacity-90">
    Prediction Accuracy
  </div>

  {/* Change Indicator */}
  <div className="flex items-center gap-1 mt-3 text-xs">
    <ArrowUpIcon className="w-4 h-4" />
    <span>+5.2% from last week</span>
  </div>
</div>
```

### CSS Specifications

```css
.metric-card {
  padding: 32px;                    /* p-8 */
  border-radius: 12px;              /* rounded-xl */
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 8px 10px -6px rgba(0, 0, 0, 0.1); /* shadow-2xl */
}

/* Metric Value Typography */
.metric-value {
  font-size: 36px;                  /* text-4xl */
  font-weight: 700;                 /* font-bold */
  line-height: 1.2;
  letter-spacing: -0.02em;          /* Tighter tracking for numbers */
}

/* Metric Label */
.metric-label {
  font-size: 14px;                  /* text-sm */
  font-weight: 500;                 /* font-medium */
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.05em;           /* Slight tracking */
}

/* Change Indicator */
.metric-change {
  font-size: 12px;                  /* text-xs */
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-change.positive {
  color: #10b981;                   /* green-500 */
}

.metric-change.negative {
  color: #ef4444;                   /* red-500 */
}
```

### Standard Stats Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Stat Card */}
  <div className="bg-white rounded-lg p-6 border border-gray-200">
    {/* Label */}
    <p className="text-sm font-medium text-gray-600 mb-2">
      Total Users
    </p>

    {/* Value */}
    <p className="text-2xl font-bold text-gray-900">
      12,345
    </p>

    {/* Trend */}
    <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
      <span>↑ 12%</span>
    </p>
  </div>
</div>
```

---

## 6. Hero/Mission Card Design

### Full-Width Hero Card

```tsx
<div className="
  relative overflow-hidden
  bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
  rounded-2xl
  p-12 md:p-16
  text-white
">
  {/* Background Pattern (optional) */}
  <div className="absolute inset-0 opacity-10">
    <svg><!-- Dot pattern --></svg>
  </div>

  {/* Content */}
  <div className="relative z-10 max-w-3xl">
    {/* Mission Statement */}
    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
      Transform Your Learning with AI-Powered Insights
    </h1>

    {/* Supporting Text */}
    <p className="text-xl opacity-90 mb-8 leading-relaxed">
      Adaptive content delivery powered by behavioral analytics
      and personalized study recommendations.
    </p>

    {/* CTA Buttons */}
    <div className="flex flex-wrap gap-4">
      <button className="
        bg-white text-purple-600
        px-8 py-4
        rounded-lg
        font-semibold
        shadow-lg
        hover:shadow-xl
        hover:scale-105
        transition-all
      ">
        Get Started
      </button>

      <button className="
        bg-white/10 backdrop-blur-sm
        border border-white/30
        px-8 py-4
        rounded-lg
        font-semibold
        hover:bg-white/20
        transition-colors
      ">
        Learn More
      </button>
    </div>
  </div>
</div>
```

### CSS Specifications

```css
/* Hero Card */
.hero-card {
  padding: 64px;                    /* p-16 */
  border-radius: 16px;              /* rounded-2xl */
  background: linear-gradient(
    to right,
    #6366f1,                        /* indigo-500 */
    #a855f7,                        /* purple-500 */
    #ec4899                         /* pink-500 */
  );
}

/* Hero Heading */
.hero-heading {
  font-size: clamp(32px, 5vw, 48px); /* Responsive 32-48px */
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}

/* Hero Description */
.hero-description {
  font-size: 20px;
  line-height: 1.6;
  opacity: 0.9;
  margin-bottom: 32px;
  max-width: 48rem;                 /* 768px */
}

/* CTA Buttons */
.hero-cta-primary {
  padding: 16px 32px;               /* py-4 px-8 */
  border-radius: 8px;               /* rounded-lg */
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 200ms ease;
}

.hero-cta-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.hero-cta-secondary {
  padding: 16px 32px;
  border-radius: 8px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: background 200ms ease;
}

.hero-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

---

## 7. Responsive Grid Layouts

### 12-Column Grid System

```css
/* Desktop Grid (1200px+) */
.dashboard-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;                        /* Gutter */
  padding: 32px;                    /* Container margin */
  max-width: 1400px;
  margin: 0 auto;
}

/* Tablet Grid (600-1199px) */
@media (max-width: 1199px) {
  .dashboard-container {
    gap: 16px;
    padding: 24px;
  }
}

/* Mobile Grid (<600px) */
@media (max-width: 599px) {
  .dashboard-container {
    grid-template-columns: 1fr;     /* Single column */
    gap: 16px;
    padding: 16px;
  }
}
```

### Column Spans (Tailwind)

```tsx
{/* Hero Section - Full Width */}
<div className="col-span-12">
  <HeroCard />
</div>

{/* Stats Grid - 4 columns on desktop */}
<div className="col-span-12 md:col-span-6 lg:col-span-3">
  <StatCard />
</div>

{/* Main Content - 8 columns */}
<div className="col-span-12 lg:col-span-8">
  <MainContent />
</div>

{/* Sidebar - 4 columns */}
<div className="col-span-12 lg:col-span-4">
  <Sidebar />
</div>
```

### Breakpoint Standards

```typescript
// Tailwind Breakpoints (2025 standard)
const breakpoints = {
  'sm': '640px',    // Mobile landscape
  'md': '768px',    // Tablet
  'lg': '1024px',   // Desktop
  'xl': '1280px',   // Large desktop
  '2xl': '1536px'   // Extra large
}
```

### Grid Specifications by Breakpoint

| Breakpoint | Columns | Gutter | Margin | Max Width |
|------------|---------|--------|--------|-----------|
| **Mobile** (<600px) | 4-6 | 16px | 16px | 100% |
| **Tablet** (600-1023px) | 8-12 | 16px | 24px | 100% |
| **Desktop** (1024-1439px) | 12 | 24px | 32px | 1400px |
| **Large** (1440px+) | 12 | 32px | 40px | 1600px |

---

## 8. Glassmorphism Specifications (2025)

### Standard Glassmorphism Effect

```css
.glass-card {
  /* Background with transparency */
  background: rgba(255, 255, 255, 0.1);

  /* Backdrop blur (10-20px is the sweet spot) */
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);

  /* Subtle border */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* Border radius */
  border-radius: 12px;

  /* Shadow for depth */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* Dark mode variant */
.dark .glass-card {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Tailwind Implementation

```tsx
<div className="
  bg-white/10 dark:bg-black/10
  backdrop-blur-xl backdrop-saturate-150
  border border-white/20 dark:border-white/10
  rounded-xl
  shadow-2xl
">
  {/* Glass card content */}
</div>
```

### Blur Value Guide

| Blur Value | Effect | Performance | Use Case |
|------------|--------|-------------|----------|
| `blur(10px)` | Light frosted | Excellent | Mobile, subtle effects |
| `blur(15-16px)` | Medium glass | Good | Standard cards |
| `blur(20px)` | Strong glass | Good | Hero sections |
| `blur(30px+)` | Heavy blur | Poor | Avoid on low-end devices |

### Best Practices (2025)

1. **Performance:** Blur values of 10-22px are optimal; higher values hurt performance
2. **Contrast:** Ensure text contrast still meets WCAG 2.1 AA (4.5:1 minimum)
3. **Background:** Requires colorful or image backdrop to show effect
4. **Border:** Use `rgba(255, 255, 255, 0.2)` for subtle definition
5. **Fallback:** Provide solid background for browsers without support (< 5% as of 2025)

### Browser Support (2025)

✅ Chrome/Edge: Full support
✅ Safari/iOS: Full support (`-webkit-backdrop-filter` prefix)
✅ Firefox: Full support (as of 2024)
⚠️ IE11: Not supported (use fallback)

```css
/* Fallback for unsupported browsers */
@supports not (backdrop-filter: blur(10px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.9); /* Opaque fallback */
  }
}
```

---

## 9. Animation & Micro-interactions

### Standard Transitions

```css
/* Card hover effects */
.card-interactive {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Button press effect */
.button {
  transition: transform 100ms ease;
}

.button:active {
  transform: scale(0.98);
}

/* Smooth color transitions */
.nav-item {
  transition: background-color 150ms ease, color 150ms ease;
}
```

### Tailwind Utilities

```tsx
{/* Hover lift effect */}
<div className="
  transition-all duration-200 ease-out
  hover:-translate-y-1
  hover:shadow-xl
">

{/* Scale on hover */}
<button className="
  transition-transform duration-150
  hover:scale-105
  active:scale-98
">

{/* Fade in animation */}
<div className="
  animate-in fade-in
  duration-300
">
```

### Duration Standards (2025)

| Duration | Use Case | Tailwind Class |
|----------|----------|----------------|
| **100ms** | Button press, checkbox | `duration-100` |
| **150ms** | Color transitions, opacity | `duration-150` |
| **200ms** | Hover effects, card lift | `duration-200` |
| **300ms** | Panel open/close, fade in | `duration-300` |
| **500ms** | Modal/drawer open | `duration-500` |

### Easing Functions

```typescript
// Tailwind Easing
const easing = {
  'linear': 'linear',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',           // Most common
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)'       // Default
}
```

---

## 10. Accessibility Standards (WCAG 2.1 AA)

### Color Contrast Requirements

| Level | Ratio | Use Case | Example |
|-------|-------|----------|---------|
| **AA Normal** | 4.5:1 | Body text (14-16px) | #333 on #fff |
| **AA Large** | 3:1 | Headings (18px+, 24px+ regular) | #666 on #fff |
| **AAA Normal** | 7:1 | Enhanced readability | #000 on #fff |
| **UI Elements** | 3:1 | Borders, icons, focus states | Gray borders |

### Focus States

```css
/* Keyboard focus indicator */
.focusable:focus-visible {
  outline: 2px solid #3b82f6;       /* blue-500 */
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default outline (keep focus-visible) */
.focusable:focus:not(:focus-visible) {
  outline: none;
}
```

### Tailwind Focus Utilities

```tsx
<button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
">
  Accessible Button
</button>
```

### ARIA Labels for Stats Cards

```tsx
<div
  role="region"
  aria-label="User statistics"
>
  <div role="status" aria-live="polite">
    <span className="sr-only">Total users: </span>
    <span className="text-2xl font-bold">12,345</span>
  </div>
</div>
```

---

## 11. Design Tokens (Complete System)

### Color Palette (OKLCH - Epic 5 Standard)

```typescript
// Primary Colors (OKLCH for perceptual uniformity)
const colors = {
  primary: {
    50:  'oklch(0.98 0.01 280)',    // Lightest
    100: 'oklch(0.95 0.02 280)',
    200: 'oklch(0.90 0.04 280)',
    300: 'oklch(0.80 0.08 280)',
    400: 'oklch(0.70 0.12 280)',
    500: 'oklch(0.60 0.16 280)',    // Base
    600: 'oklch(0.50 0.16 280)',
    700: 'oklch(0.40 0.14 280)',
    800: 'oklch(0.30 0.10 280)',
    900: 'oklch(0.20 0.06 280)',    // Darkest
  },

  // Semantic colors
  success: 'oklch(0.70 0.14 145)',  // Green
  warning: 'oklch(0.75 0.14 70)',   // Yellow
  error:   'oklch(0.60 0.18 25)',   // Red
  info:    'oklch(0.65 0.12 240)',  // Blue
}
```

### Shadow System

```typescript
const shadows = {
  'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  'DEFAULT': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}
```

### Complete Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // OKLCH colors from Epic 5
        primary: { /* 50-900 scale */ },
        // ... semantic colors
      },
      spacing: {
        // 8px grid system
        '0': '0px',
        '1': '4px',
        '2': '8px',
        // ... up to '96': '384px'
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        'full': '9999px',
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      boxShadow: shadows,
      transitionDuration: {
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
}
```

---

## 12. Real-World Examples

### Linear-Inspired Layout

```tsx
<div className="flex h-screen bg-gray-50">
  {/* Sidebar (56px collapsed, 240px expanded) */}
  <Sidebar className="w-14 hover:w-60 transition-all" />

  {/* Main Content */}
  <main className="flex-1 overflow-auto">
    <div className="max-w-7xl mx-auto p-8">
      {/* Grid of cards */}
      <div className="grid grid-cols-12 gap-6">
        {/* ... */}
      </div>
    </div>
  </main>
</div>
```

### Stripe Dashboard Card

```tsx
<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
  {/* Card header with perfect margins */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">
      Revenue
    </h3>
    <button className="text-sm text-gray-500 hover:text-gray-700">
      View details →
    </button>
  </div>

  {/* Metric display */}
  <div className="mb-2">
    <p className="text-3xl font-bold text-gray-900">
      $45,231.89
    </p>
  </div>

  {/* Supporting text */}
  <p className="text-sm text-gray-600">
    +20.1% from last month
  </p>
</div>
```

### Notion-Inspired Sidebar

```tsx
<aside className="w-56 bg-gray-50 border-r border-gray-200 p-4">
  {/* Search */}
  <div className="h-[30px] mb-2">
    <input
      className="w-full h-full px-3 rounded-md border border-gray-300"
      placeholder="Search..."
    />
  </div>

  {/* Section gap: 6px */}
  <div className="h-1.5" />

  {/* Navigation items (40px each) */}
  <nav className="space-y-1">
    <a className="flex items-center gap-3 h-10 px-3 rounded-md hover:bg-gray-100">
      <HomeIcon className="w-5 h-5" />
      <span className="text-sm font-medium">Home</span>
    </a>
    {/* More items... */}
  </nav>
</aside>
```

---

## 13. Medical/Educational Dashboard Patterns

### Duolingo-Inspired Gamification

```tsx
{/* Streak Card */}
<div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white">
  <div className="flex items-center gap-4">
    {/* Fire emoji/icon */}
    <div className="text-4xl">🔥</div>

    <div>
      <p className="text-3xl font-bold">7</p>
      <p className="text-sm opacity-90">Day Streak</p>
    </div>
  </div>

  {/* Progress bar */}
  <div className="mt-4 bg-white/20 rounded-full h-2">
    <div className="bg-white rounded-full h-2 w-3/4" />
  </div>
</div>

{/* Progress Circles (Duolingo style) */}
<div className="flex gap-2">
  {[1, 2, 3, 4, 5].map(day => (
    <div
      key={day}
      className="w-10 h-10 rounded-full bg-green-500 border-4 border-green-700 flex items-center justify-center"
    >
      <CheckIcon className="w-5 h-5 text-white" />
    </div>
  ))}
</div>
```

### Medical Dashboard Stats (AMBOSS-inspired)

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Cards Studied */}
  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
    <div className="flex items-center gap-4">
      <div className="bg-blue-500 p-3 rounded-lg">
        <BookOpenIcon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-blue-600 font-medium uppercase tracking-wide">
          Cards Studied
        </p>
        <p className="text-2xl font-bold text-gray-900">
          342
        </p>
      </div>
    </div>
  </div>

  {/* Mastery Level */}
  <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
    {/* Similar structure... */}
  </div>

  {/* Next Review */}
  <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
    {/* Similar structure... */}
  </div>
</div>
```

---

## 14. Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Install/configure Tailwind CSS with custom config
- [ ] Set up design tokens (spacing, colors, typography)
- [ ] Implement 8px grid system
- [ ] Configure OKLCH color system (if using Epic 5 standard)
- [ ] Set up dark mode support

### Phase 2: Components (Week 2)
- [ ] Build card component variants (standard, glass, elevated)
- [ ] Implement sidebar navigation (240px/64px states)
- [ ] Create stats/metric card components
- [ ] Build hero/mission card
- [ ] Set up responsive grid system

### Phase 3: Typography & Accessibility (Week 3)
- [ ] Implement type scale (Perfect Fourth 1.33 ratio)
- [ ] Ensure WCAG 2.1 AA contrast compliance
- [ ] Add focus-visible states
- [ ] Test with screen readers
- [ ] Verify keyboard navigation

### Phase 4: Polish & Optimization (Week 4)
- [ ] Add micro-interactions and animations
- [ ] Implement glassmorphism (if applicable)
- [ ] Optimize for mobile responsiveness
- [ ] Conduct accessibility audit
- [ ] Performance testing (Core Web Vitals)

---

## 15. References & Resources

### Design Systems Studied
- **Linear** - Minimal design, compact navigation
- **Notion** - 224px sidebar, 8px grid system
- **Vercel** - Glassmorphism, modern aesthetics
- **Stripe** - Clean card design, perfect spacing
- **shadcn/ui** - 240px sidebar standard, component library
- **Duolingo** - Gamification, progress visualization

### Documentation Links
- [shadcn/ui Sidebar Docs](https://ui.shadcn.com/docs/components/sidebar)
- [Tailwind CSS Grid System](https://tailwindcss.com/docs/grid-template-columns)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OKLCH Color Space](https://oklch.com/)
- [8-Point Grid System](https://spec.fm/specifics/8-pt-grid)

### Industry Standards (2024-2025)
- **8px grid system** - Universal spacing standard
- **12-column grid** - Most flexible for responsive design
- **240px sidebar** - Optimal for desktop navigation
- **16-24px gutter** - Responsive card spacing
- **blur(10-20px)** - Glassmorphism sweet spot
- **4.5:1 contrast** - WCAG AA minimum

---

## Appendix: Quick Reference

### Spacing Cheat Sheet
```
4px  - Icon to text gap
8px  - Related elements
16px - Unrelated elements, form field gaps
24px - Card padding, sub-sections
32px - Major sections, container padding
48px - Page sections
64px - Hero section padding
```

### Typography Cheat Sheet
```
48px/700 - Display (hero headlines)
32px/700 - H1 (page titles)
24px/600 - H2 (section headers)
18px/600 - H3 (card titles)
16px/400 - Body (standard text)
14px/400 - Body small (descriptions)
12px/400 - Caption (metadata)
```

### Color Usage Cheat Sheet
```
#000000 - Critical numbers, KPIs
#333333 - General text (7:1 contrast)
#666666 - Supporting text (4.5:1)
#999999 - Metadata (use sparingly)
```

### Shadow Cheat Sheet
```
shadow-sm  - Subtle lift (cards at rest)
shadow-md  - Standard elevation
shadow-lg  - Prominent cards
shadow-xl  - Hover state, dropdowns
shadow-2xl - Modals, hero sections
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Next Review:** 2026-01-26 (quarterly)
**Owner:** Design Team / Kevy
**Status:** Living Document - Update as standards evolve

---
# === Core Metadata ===
title: "Modern Animation & Interaction Patterns Guide (2024-2025)"
description: "Comprehensive guide to animation patterns, timing values, and micro-interactions for web dashboards using Framer Motion"
type: "Guide"
status: "Active"
version: "1.0"

# === Ownership ===
owner: "Kevy"
dri_backup: "Amelia"
contributors: ["Claude Code", "UX Research"]
review_cadence: "Quarterly"

# === Timestamps (ISO 8601 with timezone) ===
created_date: "2025-10-26T00:00:00-07:00"
last_updated: "2025-10-26T00:00:00-07:00"
last_reviewed: "2025-10-26T00:00:00-07:00"
next_review_due: "2026-01-26"

# === Dependencies ===
depends_on:
  - docs/EPIC5-DESIGN-SYSTEM-GUIDE.md
  - apps/web/package.json (framer-motion)
affects:
  - apps/web/app/**/*.tsx (all React components)
  - docs/design/component-library.md
related_adrs:
  - docs/architecture/ADR-004-oklch-glassmorphism.md

# === Audience & Discovery ===
audience:
  - experienced-devs
  - new-developers
  - designers
technical_level: "Intermediate"
tags: ["animation", "framer-motion", "ux", "performance", "micro-interactions"]
keywords: ["animation timing", "easing curves", "spring physics", "GPU acceleration", "dashboard interactions"]
search_priority: "high"

# === Lifecycle ===
lifecycle:
  stage: "Active"
  deprecation_date: null
  replacement_doc: null
  archive_after: null
---

# Modern Animation & Interaction Patterns Guide

**Last Updated:** October 26, 2025
**Framework:** Framer Motion (Motion.dev) + React 19
**Target:** Web dashboards, behavioral analytics, adaptive learning UI

---

## Table of Contents

1. [Animation Philosophy](#animation-philosophy)
2. [Timing Standards](#timing-standards)
3. [Framer Motion Patterns](#framer-motion-patterns)
4. [Micro-Interactions](#micro-interactions)
5. [Page Transitions](#page-transitions)
6. [Performance Optimization](#performance-optimization)
7. [Accessibility](#accessibility)
8. [Component Library Examples](#component-library-examples)

---

## Animation Philosophy

### Core Principles (2024-2025)

> **2025 UX Expectation:** Users expect smooth, context-aware transitions. Animations are now a **core UX requirement**, not just enhancement.

**Three Pillars:**

1. **Purposeful Motion** - Every animation communicates state change, guides user attention, or provides feedback
2. **Performance First** - All animations must maintain 60fps on mobile devices
3. **Delightful Details** - Subtle micro-interactions create polish without distraction

**Inspirations:**
- **Linear:** Smooth, physics-based interactions with subtle feedback
- **Notion:** Page transitions that feel instant yet natural
- **Stripe:** Chart animations that draw attention to data insights
- **Vercel:** Loading states that inform without frustrating

---

## Timing Standards

### Material Design 3 (Industry Standard)

Material Design provides battle-tested timing values across platforms:

| Context | Duration | Use Case |
|---------|----------|----------|
| **Desktop** | 150-200ms | Button hover, focus states, tooltips |
| **Mobile (Standard)** | 300ms | Smooth default for most transitions |
| **Mobile (Elements Enter)** | 225ms | Cards appearing, modals opening |
| **Mobile (Elements Exit)** | 195ms | Dismissing items, closing overlays |
| **Mobile (Full-screen)** | 375ms | Route changes, full-page modals |
| **Tablet** | +30% mobile | Scale up mobile durations (300ms → 390ms) |
| **Wearables** | -30% mobile | Scale down mobile durations (300ms → 210ms) |

**Maximum Recommended:** 400ms (beyond this feels sluggish)

### Easing Curves (Cubic-Bezier)

```css
/* Material Design Standard Curves */
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);     /* Most common */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);   /* Elements entering */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);     /* Elements exiting */
--ease-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);        /* Temporary exits */
```

**Framer Motion Equivalents:**

```typescript
const easings = {
  standard: [0.4, 0.0, 0.2, 1],
  decelerate: [0.0, 0.0, 0.2, 1],
  accelerate: [0.4, 0.0, 1, 1],
  sharp: [0.4, 0.0, 0.6, 1],
};
```

---

## Framer Motion Patterns

### Installation & Setup

```bash
# Motion (formerly Framer Motion) - rebranded Feb 2025
npm install framer-motion
```

```typescript
// apps/web/lib/animations.ts
import { Variants, Transition } from 'framer-motion';

// Reusable animation configurations
export const animations = {
  // Standard timing values
  duration: {
    instant: 0.15,    // 150ms - Desktop interactions
    fast: 0.2,        // 200ms - Desktop hover/focus
    normal: 0.3,      // 300ms - Mobile standard
    enter: 0.225,     // 225ms - Elements appearing
    exit: 0.195,      // 195ms - Elements disappearing
    slow: 0.375,      // 375ms - Full-screen transitions
  },

  // Easing curves
  easing: {
    standard: [0.4, 0.0, 0.2, 1],
    decelerate: [0.0, 0.0, 0.2, 1],
    accelerate: [0.4, 0.0, 1, 1],
    sharp: [0.4, 0.0, 0.6, 1],
  },

  // Spring physics (more natural than duration-based)
  spring: {
    // Gentle bounce (default)
    gentle: { type: 'spring', stiffness: 100, damping: 10, mass: 1 },

    // Snappy interaction (buttons, toggles)
    snappy: { type: 'spring', stiffness: 400, damping: 30, mass: 0.8 },

    // Bouncy feedback (success states)
    bouncy: { type: 'spring', stiffness: 300, damping: 15, mass: 0.6 },

    // Smooth glide (large panels, drawers)
    smooth: { type: 'spring', stiffness: 80, damping: 20, mass: 1.2 },

    // Duration-based spring (when exact timing needed)
    timed: { type: 'spring', duration: 0.3, bounce: 0.25 },
  },
} as const;
```

### Pattern 1: Fade In/Out (Opacity Only)

**Best for:** Modal overlays, tooltips, notifications

```typescript
// Fade variants
const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Component usage
<motion.div
  initial="hidden"
  animate="visible"
  exit="exit"
  variants={fadeVariants}
  transition={{ duration: animations.duration.normal, ease: animations.easing.standard }}
>
  {/* Content */}
</motion.div>
```

### Pattern 2: Scale + Fade (Modal Entry)

**Best for:** Modal dialogs, popovers, dropdowns

```typescript
const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10, // Slight upward slide
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
};

<motion.div
  initial="hidden"
  animate="visible"
  exit="exit"
  variants={modalVariants}
  transition={{
    duration: animations.duration.enter,
    ease: animations.easing.decelerate,
  }}
  className="modal-dialog"
>
  {/* Modal content */}
</motion.div>
```

### Pattern 3: Stagger Children (List Animations)

**Best for:** Dashboard cards, analytics tiles, navigation items

```typescript
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 50ms delay between each child
      delayChildren: 0.1,    // Wait 100ms before starting
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03, // Faster exit
      staggerDirection: -1,  // Reverse order (last-to-first)
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20, // Slide up from below
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.enter,
      ease: animations.easing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    y: -10, // Slide up when exiting
    transition: {
      duration: animations.duration.exit,
      ease: animations.easing.accelerate,
    },
  },
};

// Component
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      <DashboardCard {...item} />
    </motion.div>
  ))}
</motion.div>
```

**Stagger Direction Control:**

```typescript
// Stagger from center outward
transition: {
  staggerChildren: 0.05,
  staggerDirection: 1,     // Forward (default)
  from: 'center',          // Start from center index
}

// Stagger from last to first
transition: {
  staggerChildren: 0.03,
  staggerDirection: -1,    // Reverse
}
```

### Pattern 4: Layout Animations (Position Changes)

**Best for:** Drag-and-drop, reordering, grid layouts

```typescript
// Automatic layout animations on any layout change
<motion.div layout layoutId="unique-id">
  <AnalyticsCard {...data} />
</motion.div>

// With custom transition
<motion.div
  layout
  transition={{
    layout: { duration: 0.3, ease: animations.easing.standard },
  }}
>
  {/* Content */}
</motion.div>

// Shared element transitions (between pages)
// Page 1
<motion.div layoutId="hero-image">
  <img src={thumbnailUrl} alt="Thumbnail" />
</motion.div>

// Page 2 (same layoutId!)
<motion.div layoutId="hero-image">
  <img src={fullImageUrl} alt="Full size" />
</motion.div>
```

**Layout Animation Performance:**
- Framer Motion 2024+ is **2.5x faster** for DOM reads
- **6x faster** for value type conversions
- Use `layout` prop liberally—it's now highly optimized

### Pattern 5: Gesture Animations (Hover, Tap, Drag)

**Best for:** Interactive cards, buttons, controls

```typescript
<motion.button
  whileHover={{
    scale: 1.02,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    transition: { duration: animations.duration.fast },
  }}
  whileTap={{
    scale: 0.98,
    transition: { duration: 0.1 },
  }}
  whileFocus={{
    scale: 1.01,
    outline: '2px solid var(--color-primary)',
    outlineOffset: '2px',
  }}
>
  Submit
</motion.button>

// Interactive card with multiple states
<motion.div
  className="dashboard-card"
  whileHover={{
    y: -4,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
  }}
  whileTap={{ scale: 0.99 }}
  transition={{
    type: 'spring',
    stiffness: 400,
    damping: 30,
  }}
>
  {/* Card content */}
</motion.div>
```

### Pattern 6: SVG Path Animations (Charts, Icons)

**Best for:** Chart reveals, progress indicators, icon states

```typescript
// Animate SVG path drawing
<motion.svg viewBox="0 0 100 100">
  <motion.path
    d="M 10 80 Q 52.5 10, 95 80"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{ pathLength: 1, opacity: 1 }}
    transition={{
      pathLength: { duration: 1.5, ease: 'easeInOut' },
      opacity: { duration: 0.3 },
    }}
  />
</motion.svg>

// Animated chart line
<motion.path
  d={chartPath}
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{
    duration: 1.2,
    ease: animations.easing.decelerate,
    delay: 0.2, // Wait for container to appear
  }}
/>
```

### Pattern 7: Scroll-Triggered Animations

**Best for:** Marketing pages, long-form content, data visualizations

```typescript
import { useInView } from 'framer-motion';
import { useRef } from 'react';

function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: animations.duration.slow, ease: animations.easing.decelerate }}
    >
      {children}
    </motion.div>
  );
}

// Usage
<ScrollReveal>
  <AnalyticsSection />
</ScrollReveal>
```

**Advanced: Scroll-linked animations**

```typescript
import { useScroll, useTransform } from 'framer-motion';

function ParallaxHeader() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -100]); // Parallax effect
  const opacity = useTransform(scrollY, [0, 200], [1, 0]); // Fade out

  return (
    <motion.header style={{ y, opacity }}>
      <h1>Behavioral Analytics Dashboard</h1>
    </motion.header>
  );
}
```

---

## Micro-Interactions

### Definition

> Micro-interactions are small, focused animations that provide feedback, guide users, and add polish to the interface.

### 1. Button Hover States

**Standard Button:**

```typescript
const ButtonHover = () => (
  <motion.button
    className="btn-primary"
    whileHover={{
      scale: 1.02,
      backgroundColor: 'var(--color-primary-600)',
      boxShadow: '0 4px 12px rgba(var(--color-primary-rgb), 0.3)',
    }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.15 }}
  >
    Get Started
  </motion.button>
);
```

**Icon Button (Smaller Scale):**

```typescript
<motion.button
  className="icon-btn"
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
>
  <Icon name="settings" />
</motion.button>
```

### 2. Loading States

**Skeleton Loader:**

```typescript
const Skeleton = () => (
  <motion.div
    className="skeleton"
    animate={{
      opacity: [0.5, 1, 0.5],
    }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);
```

**Spinner (Rotation):**

```typescript
<motion.div
  className="spinner"
  animate={{ rotate: 360 }}
  transition={{
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  }}
/>
```

**Progress Bar (Fill Animation):**

```typescript
<div className="progress-container">
  <motion.div
    className="progress-bar"
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.5, ease: animations.easing.decelerate }}
  />
</div>
```

### 3. Success/Error Feedback

**Toast Notification:**

```typescript
const toastVariants: Variants = {
  hidden: { opacity: 0, y: -50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

<motion.div
  className="toast toast-success"
  variants={toastVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  ✓ Changes saved successfully!
</motion.div>
```

**Inline Validation (Input Field):**

```typescript
<motion.div
  className="form-field"
  animate={isError ? { x: [-10, 10, -10, 10, 0] } : {}}
  transition={{ duration: 0.4 }}
>
  <input type="text" />
  <AnimatePresence mode="wait">
    {isError && (
      <motion.span
        className="error-message"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        {errorMessage}
      </motion.span>
    )}
  </AnimatePresence>
</motion.div>
```

### 4. Checkbox/Toggle Animations

**Animated Checkbox:**

```typescript
const checkmarkVariants: Variants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

<motion.svg
  width="24"
  height="24"
  viewBox="0 0 24 24"
  initial={false}
  animate={isChecked ? 'checked' : 'unchecked'}
>
  <motion.path
    d="M5 13l4 4L19 7"
    fill="none"
    stroke="white"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    variants={checkmarkVariants}
  />
</motion.svg>
```

**Toggle Switch:**

```typescript
<motion.div
  className="toggle-track"
  animate={{ backgroundColor: isOn ? '#10b981' : '#d1d5db' }}
  transition={{ duration: 0.2 }}
>
  <motion.div
    className="toggle-thumb"
    layout
    transition={{
      type: 'spring',
      stiffness: 500,
      damping: 30,
    }}
    style={{ x: isOn ? 20 : 0 }}
  />
</motion.div>
```

### 5. Chart Animations

**Bar Chart (Staggered Height):**

```typescript
const barVariants: Variants = {
  hidden: { scaleY: 0, originY: 1 },
  visible: (i: number) => ({
    scaleY: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.6,
      ease: animations.easing.decelerate,
    },
  }),
};

{data.map((value, i) => (
  <motion.rect
    key={i}
    custom={i}
    variants={barVariants}
    initial="hidden"
    animate="visible"
    x={i * barWidth}
    y={chartHeight - value}
    width={barWidth - 4}
    height={value}
    fill="var(--color-primary)"
  />
))}
```

**Line Chart (Path Drawing):**

```typescript
<motion.path
  d={generateLinePath(data)}
  fill="none"
  stroke="var(--color-primary)"
  strokeWidth="2"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 1.5, ease: 'easeInOut' }}
/>
```

---

## Page Transitions

### Route Transitions (Next.js App Router)

```typescript
// app/layout.tsx
import { AnimatePresence } from 'framer-motion';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnimatePresence mode="wait" initial={false}>
          {children}
        </AnimatePresence>
      </body>
    </html>
  );
}

// app/dashboard/page.tsx
import { motion } from 'framer-motion';

const pageVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export default function DashboardPage() {
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ duration: animations.duration.normal }}
    >
      <h1>Dashboard</h1>
      {/* Content */}
    </motion.div>
  );
}
```

### Modal Transitions

```typescript
import { AnimatePresence } from 'framer-motion';

function ModalManager() {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Modal Content */}
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: animations.duration.enter,
              ease: animations.easing.decelerate,
            }}
          >
            {/* Modal body */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Performance Optimization

### GPU Acceleration (Critical!)

**Only animate these properties for 60fps performance:**

1. **`transform`** (translate, scale, rotate, skew)
2. **`opacity`**

**DO NOT animate:**
- `width`, `height`, `top`, `left`, `margin`, `padding` (triggers layout)
- `color`, `background-color` (triggers paint, unless using CSS variables)

### Good vs Bad Examples

```typescript
// ❌ BAD: Animates width (causes layout recalculation)
<motion.div
  animate={{ width: isExpanded ? 300 : 100 }}
>
  Panel
</motion.div>

// ✅ GOOD: Use scaleX instead
<motion.div
  style={{ transformOrigin: 'left' }}
  animate={{ scaleX: isExpanded ? 3 : 1 }}
>
  Panel
</motion.div>

// ❌ BAD: Animates top/left
<motion.div
  animate={{ top: 100, left: 200 }}
>
  Tooltip
</motion.div>

// ✅ GOOD: Use transform instead
<motion.div
  animate={{ x: 200, y: 100 }}
>
  Tooltip
</motion.div>
```

### will-change Property

**Use sparingly!** Overuse causes excessive memory consumption.

```css
/* Only on elements that will definitely animate */
.modal-dialog {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.modal-dialog.animating {
  will-change: transform, opacity;
}

.modal-dialog.idle {
  will-change: auto;
}
```

### Reduce Composite Layer Size

**Technique:** Create small layers, then scale them up with `transform: scale()`.

```typescript
// ❌ BAD: Large layer (400KB memory)
<motion.div
  style={{ width: 1000, height: 1000 }}
  animate={{ opacity: 1 }}
/>

// ✅ GOOD: Small layer scaled up (4KB memory, 100x reduction!)
<motion.div
  style={{
    width: 100,
    height: 100,
    scale: 10, // Appears 1000x1000
  }}
  animate={{ opacity: 1 }}
/>
```

### Lazy Load Animations

Use `useInView` to only animate visible components:

```typescript
import { useInView } from 'framer-motion';

function LazyAnimatedCard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      animate={isInView ? 'visible' : 'hidden'}
      variants={cardVariants}
    >
      {/* Only animates when scrolled into view */}
    </motion.div>
  );
}
```

### Avoid Unnecessary Re-Renders

```typescript
// ❌ BAD: Creates new object every render
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>

// ✅ GOOD: Define outside component
const fadeTransition = { duration: 0.3 };

<motion.div
  animate={{ opacity: 1 }}
  transition={fadeTransition}
/>
```

---

## Accessibility

### Respect `prefers-reduced-motion`

**Critical for accessibility!** Some users experience nausea/discomfort from animations.

```typescript
// utils/useReducedMotion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

// Usage in component
function AnimatedCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      {/* Content */}
    </motion.div>
  );
}
```

**Global approach (recommended):**

```typescript
// lib/animations.ts
import { useReducedMotion } from './useReducedMotion';

export function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();

  return {
    initial: shouldReduceMotion ? false : 'hidden',
    animate: shouldReduceMotion ? false : 'visible',
    exit: shouldReduceMotion ? false : 'exit',
    transition: shouldReduceMotion ? { duration: 0 } : animations.duration.normal,
  };
}
```

### Focus Management

Ensure animations don't interfere with keyboard navigation:

```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  whileFocus={{
    scale: 1.01,
    outline: '2px solid var(--color-focus)',
    outlineOffset: '2px',
  }}
>
  Submit
</motion.button>
```

---

## Component Library Examples

### 1. Animated Dashboard Card

```typescript
// components/AnimatedCard.tsx
import { motion } from 'framer-motion';
import { animations } from '@/lib/animations';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface AnimatedCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.enter,
      ease: animations.easing.decelerate,
    },
  },
};

export function AnimatedCard({
  title,
  value,
  description,
  icon,
  trend,
  onClick,
}: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="dashboard-card"
      variants={shouldReduceMotion ? {} : cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -4,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transition: {
                type: 'spring',
                stiffness: 400,
                damping: 30,
              },
            }
      }
      whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
      onClick={onClick}
    >
      <div className="card-header">
        {icon && <div className="card-icon">{icon}</div>}
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="card-value">
        <span className="value">{value}</span>
        {trend && (
          <motion.span
            className={`trend trend-${trend}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </motion.span>
        )}
      </div>

      {description && <p className="card-description">{description}</p>}
    </motion.div>
  );
}
```

### 2. Animated List (Staggered Entry)

```typescript
// components/AnimatedList.tsx
import { motion } from 'framer-motion';
import { animations } from '@/lib/animations';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: animations.duration.enter,
      ease: animations.easing.decelerate,
    },
  },
};

export function AnimatedList<T>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <motion.div
      className="animated-list"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.div key={index} variants={itemVariants}>
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### 3. Animated Toast Notification

```typescript
// components/Toast.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '@/lib/animations';

const toastVariants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.9,
    transition: {
      duration: animations.duration.exit,
      ease: animations.easing.accelerate,
    },
  },
};

export function Toast({
  message,
  type = 'info',
  isVisible,
  onDismiss,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onDismiss: () => void;
}) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={`toast toast-${type}`}
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="alert"
          aria-live="polite"
        >
          <span>{message}</span>
          <button onClick={onDismiss} aria-label="Dismiss">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 4. Animated Progress Bar

```typescript
// components/ProgressBar.tsx
import { motion } from 'framer-motion';
import { animations } from '@/lib/animations';

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
}: {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}) {
  return (
    <div className="progress-wrapper">
      {label && <label className="progress-label">{label}</label>}

      <div className="progress-container">
        <motion.div
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{
            duration: animations.duration.slow,
            ease: animations.easing.decelerate,
          }}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>

      {showPercentage && (
        <motion.span
          className="progress-percentage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {progress}%
        </motion.span>
      )}
    </div>
  );
}
```

### 5. Animated Modal

```typescript
// components/Modal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '@/lib/animations';
import { useEffect } from 'react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: animations.duration.enter,
      ease: animations.easing.decelerate,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: animations.duration.exit,
      ease: animations.easing.accelerate,
    },
  },
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            transition={{ duration: animations.duration.fast }}
          />

          {/* Modal Content */}
          <div className="modal-wrapper">
            <motion.div
              className="modal-content"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div className="modal-header">
                <h2 id="modal-title">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## Quick Reference

### Timing Cheat Sheet

| Interaction | Duration | Easing | Use Case |
|-------------|----------|--------|----------|
| **Button hover** | 150-200ms | `standard` | Desktop hover states |
| **Button click** | 100ms | `sharp` | Tap feedback |
| **Tooltip appear** | 200ms | `decelerate` | Show information |
| **Modal open** | 225ms | `decelerate` | Large overlays |
| **Modal close** | 195ms | `accelerate` | Dismissing content |
| **Page transition** | 300ms | `standard` | Route changes |
| **Full-screen** | 375ms | `standard` | Major layout shifts |
| **Card hover** | 200ms | `spring (snappy)` | Interactive feedback |
| **List items** | 50ms stagger | `decelerate` | Sequential reveals |
| **Chart reveal** | 1200-1500ms | `decelerate` | Data visualization |
| **Progress bar** | 375ms | `decelerate` | Status updates |

### Spring Physics Presets

```typescript
export const springs = {
  gentle: { stiffness: 100, damping: 10, mass: 1 },      // Default, subtle
  snappy: { stiffness: 400, damping: 30, mass: 0.8 },    // Buttons, toggles
  bouncy: { stiffness: 300, damping: 15, mass: 0.6 },    // Success feedback
  smooth: { stiffness: 80, damping: 20, mass: 1.2 },     // Large panels
  timed: { duration: 0.3, bounce: 0.25 },                 // Exact timing
};
```

### Performance Checklist

- ✅ Only animate `transform` and `opacity`
- ✅ Use `will-change` sparingly (add before animation, remove after)
- ✅ Lazy load animations with `useInView`
- ✅ Reduce composite layer sizes (scale up small layers)
- ✅ Avoid animating during scroll (use `position: fixed`)
- ✅ Respect `prefers-reduced-motion`
- ✅ Test on mobile devices (30fps is noticeable!)

---

## Resources

### Official Documentation

- **Motion (Framer Motion):** https://motion.dev
- **Material Design Motion:** https://m3.material.io/styles/motion
- **MDN Web Animations:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API

### Learning Resources

- **The Physics Behind Spring Animations:** https://blog.maximeheckel.com/posts/the-physics-behind-spring-animations/
- **GPU Animation Guide:** https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/
- **Motion Examples Library:** https://motion.dev/examples

### Tools

- **Easings.net:** Visualize easing curves
- **Cubic-bezier.com:** Create custom easing functions
- **React DevTools Profiler:** Find animation bottlenecks

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-26 | Initial guide with Material Design timing, Framer Motion patterns, and accessibility best practices |

---

**Next Review:** January 26, 2026 (Quarterly)
**Owner:** Kevy
**Contributors:** Claude Code, UX Research Team

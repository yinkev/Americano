---
title: "Animation Quick Start Guide"
description: "Get started with animations in Americano - practical examples and common patterns"
type: "Guide"
status: "Active"
version: "1.0"
owner: "Kevy"
created_date: "2025-10-26T00:00:00-07:00"
last_updated: "2025-10-26T00:00:00-07:00"
tags: ["animation", "framer-motion", "quick-start", "tutorial"]
---

# Animation Quick Start Guide

**5-minute guide to adding beautiful, performant animations to Americano**

---

## Prerequisites

```bash
# Framer Motion should already be installed
npm install framer-motion
```

---

## Step 1: Import Animation Utilities

```typescript
// Your component file
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '@/lib/animations';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';
```

---

## Step 2: Common Patterns (Copy & Paste Ready)

### Pattern A: Fade In on Mount

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: animations.duration.normal }}
>
  Your content here
</motion.div>
```

### Pattern B: Slide Up on Mount

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    duration: animations.duration.enter,
    ease: animations.easing.decelerate,
  }}
>
  Your content here
</motion.div>
```

### Pattern C: Button Hover Effect

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
  Click me
</motion.button>
```

### Pattern D: Card Hover (Dashboard Style)

```tsx
<motion.div
  className="dashboard-card"
  whileHover={{
    y: -4,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  }}
  whileTap={{ scale: 0.99 }}
  transition={animations.spring.snappy}
>
  Card content
</motion.div>
```

### Pattern E: Staggered List

```tsx
<motion.div
  variants={animations.variants.listContainer}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.div key={item.id} variants={animations.variants.listItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Pattern F: Modal with Backdrop

```tsx
import { AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{
          duration: animations.duration.enter,
          ease: animations.easing.decelerate,
        }}
      >
        <div className="modal-content">
          {/* Your modal content */}
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Pattern G: Progress Bar

```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
  <motion.div
    className="bg-blue-600 h-2 rounded-full"
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{
      duration: animations.duration.slow,
      ease: animations.easing.decelerate,
    }}
  />
</div>
```

### Pattern H: Loading Skeleton

```tsx
<motion.div
  className="h-20 bg-gray-200 rounded-lg"
  animate={{
    opacity: [0.5, 1, 0.5],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
/>
```

---

## Step 3: Accessibility (REQUIRED)

**Always respect reduced motion preferences:**

```tsx
function MyAnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0 }}
      animate={shouldReduceMotion ? {} : { opacity: 1 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

**Or use the helper hook:**

```tsx
import { useAnimationConfig } from '@/lib/animations/useReducedMotion';

function MyComponent() {
  const animConfig = useAnimationConfig();

  return (
    <motion.div {...animConfig} variants={animations.variants.fade}>
      Content
    </motion.div>
  );
}
```

---

## Step 4: Use Existing Components

We've created ready-to-use animated components:

```tsx
import { AnimatedCard, AnimatedCardGrid } from '@/components/examples/AnimatedDashboardCard';

<AnimatedCardGrid>
  <AnimatedCard
    title="Total Users"
    value="1,234"
    description="Active in last 30 days"
    trend="up"
    trendValue="+12%"
    icon={<UsersIcon />}
  />
  <AnimatedCard
    title="Revenue"
    value="$45.2K"
    trend="up"
    trendValue="+8%"
  />
</AnimatedCardGrid>
```

---

## Performance Checklist

Before deploying animations, verify:

- ✅ **Only animate `transform` and `opacity`** (GPU-accelerated)
- ✅ **Use `will-change` sparingly** (add before animation, remove after)
- ✅ **Respect `prefers-reduced-motion`** (accessibility requirement)
- ✅ **Test on mobile devices** (animations should be smooth at 60fps)
- ✅ **Avoid animating on scroll** unless using IntersectionObserver
- ✅ **Keep durations under 400ms** for most interactions

---

## Common Mistakes to Avoid

### ❌ DON'T: Animate width/height

```tsx
// BAD - causes layout recalculation
<motion.div animate={{ width: 300 }} />
```

### ✅ DO: Use scale instead

```tsx
// GOOD - GPU accelerated
<motion.div
  style={{ transformOrigin: 'left' }}
  animate={{ scaleX: 3 }}
/>
```

### ❌ DON'T: Forget AnimatePresence for exit animations

```tsx
// BAD - no exit animation
{isVisible && <motion.div exit={{ opacity: 0 }} />}
```

### ✅ DO: Wrap with AnimatePresence

```tsx
// GOOD - exit animation works
<AnimatePresence mode="wait">
  {isVisible && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

### ❌ DON'T: Create new objects in render

```tsx
// BAD - new object every render
<motion.div transition={{ duration: 0.3 }} />
```

### ✅ DO: Define outside component

```tsx
// GOOD - reuses same object
const transition = { duration: 0.3 };
<motion.div transition={transition} />

// BETTER - use constants
<motion.div transition={animations.transitions.fade} />
```

---

## Debugging Tips

### Animation not working?

1. **Check AnimatePresence:** Exit animations require `<AnimatePresence>`
2. **Check initial prop:** Set `initial="hidden"` if using variants
3. **Check mode:** Use `mode="wait"` for sequential animations

### Animation is laggy?

1. **Check properties:** Only animate `transform` and `opacity`
2. **Check DevTools:** Open Performance tab, record, find "Paint" events
3. **Reduce complexity:** Fewer elements animating = better performance

### Animation feels wrong?

1. **Check duration:** Too fast (< 150ms) or too slow (> 400ms)?
2. **Check easing:** Use `decelerate` for entrances, `accelerate` for exits
3. **Test on mobile:** Animations should feel natural on touch devices

---

## Next Steps

1. **Read full guide:** [design-system-animation-patterns.md](./design-system-animation-patterns.md)
2. **Study examples:** `../apps/web/components/examples/AnimatedDashboardCard.tsx`
3. **Explore Motion docs:** https://motion.dev
4. **Check Material Design:** https://m3.material.io/styles/motion

---

## Quick Reference

| Use Case | Duration | Pattern |
|----------|----------|---------|
| Button hover | 150-200ms | `whileHover={{ scale: 1.02 }}` |
| Card entrance | 225ms | `variants.slideUp` |
| Modal open | 225ms | `variants.modal` |
| List items | 50ms stagger | `variants.listContainer` |
| Page transition | 300ms | `variants.slideRight` |
| Progress bar | 375ms | `animate={{ width: '50%' }}` |
| Chart reveal | 1200ms | `animate={{ pathLength: 1 }}` |

---

## Support

**Questions?** Check [design-system-animation-patterns.md](./design-system-animation-patterns.md) or ask in #engineering-frontend

**Found a bug?** Create an issue with "animation" label

**Want to add a pattern?** Submit a PR with example code

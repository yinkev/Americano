# Theme System Usage Guide

## Overview

The Americano theme system uses `next-themes` for seamless light/dark mode switching with Apple-style transitions and accessibility support.

## Components

### ThemeProvider

Wraps the entire application and provides theme context.

**Location:** `/Users/kyin/Projects/Americano/apps/web/src/components/theme-provider.tsx`

**Features:**
- Automatic system preference detection
- Prevents theme flash on page load
- Supports `suppressHydrationWarning` to avoid hydration mismatches

**Already configured in:** `apps/web/src/app/layout.tsx`

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### ThemeToggle

A button component that toggles between light and dark modes.

**Location:** `/Users/kyin/Projects/Americano/apps/web/src/components/theme-toggle.tsx`

**Features:**
- Smooth icon transitions (Sun ⟷ Moon) using motion.dev
- Apple-style subtle animations
- Fully accessible (ARIA labels, keyboard navigation)
- Prevents hydration mismatch with mounted state
- Uses design system animations (`buttonIconVariants`, `springResponsive`)

**Usage:**

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

// In your component
<ThemeToggle />
```

**Already integrated in:** `apps/web/src/components/new-app-sidebar.tsx` (sidebar header)

## Global CSS Transitions

**Location:** `apps/web/src/app/globals.css` (lines 277-306)

**Features:**
- 200ms smooth color transitions when theme changes
- Only transitions colors (not transforms or positions)
- Respects `prefers-reduced-motion` for accessibility
- Can disable transitions on specific elements with `data-no-transition` attribute

```tsx
// Example: Disable transitions on an element
<div data-no-transition>
  This element won't transition when theme changes
</div>
```

## Using Themes in Components

### Hook: `useTheme`

```tsx
import { useTheme } from 'next-themes'

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark' (resolves 'system' to actual theme)

  return (
    <div>
      <p>Current theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}
```

## OKLCH Color System

All colors in `globals.css` use OKLCH color space for perceptual uniformity.

**Light mode:** Lines 43-123
**Dark mode:** Lines 125-202

Colors automatically switch when theme changes thanks to CSS custom properties.

```css
/* Light mode */
:root {
  --background: oklch(0.98 0.01 270);
  --foreground: oklch(0.25 0.02 270);
  --primary: oklch(0.75 0.12 240);
  /* ... */
}

/* Dark mode */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.6 0.15 250);
  /* ... */
}
```

## Accessibility Features

1. **Hydration Safe:** Theme toggle doesn't render until mounted to prevent flash
2. **Keyboard Navigation:** Full keyboard support on toggle button
3. **Screen Readers:** Proper ARIA labels ("Switch to light mode" / "Switch to dark mode")
4. **Reduced Motion:** Respects `prefers-reduced-motion` media query
5. **Focus Indicators:** Visible focus rings on toggle button

## Technical Details

**Dependencies:**
- `next-themes@^0.4.6` - Theme provider
- `motion/react` - Smooth animations
- `lucide-react@^0.545.0` - Sun/Moon icons

**Animation Physics:**
- Spring: `stiffness: 240, damping: 22, mass: 0.8` (springResponsive)
- Transition: 200ms cubic-bezier(0.4, 0, 0.2, 1)

## Troubleshooting

### Theme flash on page load

Ensure `suppressHydrationWarning` is on the `<html>` tag in `layout.tsx`:

```tsx
<html lang="en" suppressHydrationWarning>
```

### Icons not animating

Check that motion.dev is properly imported:

```tsx
import { motion } from 'motion/react'
```

### Colors not switching

Verify Tailwind config has `darkMode: 'class'`:

```js
// tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}
```

## Future Enhancements

- [ ] Add custom theme colors (not just light/dark)
- [ ] Add theme scheduling (auto-switch at sunset/sunrise)
- [ ] Add theme preference persistence to user profile
- [ ] Add theme-specific illustrations/assets

## References

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [OKLCH Color Space](https://oklch.com/)
- [Motion.dev Documentation](https://motion.dev/)
- [Design System](/Users/kyin/Projects/Americano/apps/web/src/lib/design-system/index.ts)

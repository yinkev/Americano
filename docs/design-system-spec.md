# Americano Design System Specification

**Created:** 2025-10-25
**Version:** 1.0
**Purpose:** Complete design system spec for UI/UX redesign
**Status:** Active

---

## Visual Specification (Gemini)

### 1. Color Palette (OKLCH)

**Primary/Secondary:**
- Soft, calming, accessible palette of analogous colors
- Base UI and text colors
- WCAG AAA compliance ensured

**Accent:**
- Single, vibrant, high-contrast color
- Reserved for primary CTAs (e.g., "Start Session", "Begin Challenge")
- Draws immediate attention

**Surface:**
- Functional glassmorphism (translucent blur)
- Used for modals, sidebars, "power-up" states
- Creates depth and context

**Modes:**
- Full dark mode variants
- Light mode (default)
- System preference detection

### 2. Typography

**Headings (H1-H6):**
- Modern, geometric sans-serif
- Clear hierarchy
- Inter or similar system font

**Body:**
- Highly legible sans-serif
- Optimized for long-form reading
- 16px base size

**Gamified:**
- Slightly bolder, stylized font
- Accent color for XP counters and achievements
- Playful but readable

**Monospace:**
- Clean, readable font for code snippets
- JetBrains Mono or Fira Code

### 3. Spacing & Layout

**Grid System:**
- Flexible 4px grid
- 8px base unit for primary spacing
- Scale: 4, 8, 12, 16, 24, 32, 48, 64px

**Layout:**
- Minimalist "bento box" grid
- Rounded-corner cards
- Clear, focused modules
- Reduces cognitive load

### 4. Animation Principles (motion.dev)

**Physics:**
- Spring physics for natural feel
- Bouncy, playful interactions

**Principles:**
- Subtle, purposeful
- Instant feedback
- Not distracting

**Types:**
- Gentle "wobbles" for rewards
- Fluid transitions for focus modes
- Subtle hovers (scale 1.05x, glow)
- Page transitions (smooth, directional)

---

## Technical Specification (Codex + Best Practices)

### 1. Component List (shadcn/ui)

**Foundation Components:**
- `Button` - Playful variants, gamified states
- `Card` - Glassmorphism styling
- `Input` / `Textarea` - Expressive validation
- `Select` / `Combobox` - Dropdowns
- `Badge` - Gamified (XP, levels, achievements)
- `Avatar` - Personality, status indicators
- `Toast` - Playful notifications
- `Dialog` / `AlertDialog` - Modal interactions
- `Tooltip` - Contextual help
- `Tabs` - Navigation
- `Accordion` - Collapsible content
- `Progress` - Loading and gamification
- `Slider` - Confidence levels
- `Switch` / `Checkbox` / `Radio` - Form controls

**Layout Components:**
- `Sidebar` (shadcn sidebar component)
- `Sheet` - Mobile navigation
- `Separator` - Visual dividers
- `ScrollArea` - Custom scrollbars

**Data Display:**
- `Table` - Data tables
- `Calendar` - Study planner
- `Chart` (via Recharts) - Analytics

**Icons:**
- Lucide React (built-in with shadcn)
- Consistent, minimal, playful

### 2. File Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home dashboard
│   ├── (dashboard)/             # Dashboard routes
│   ├── search/                  # Epic 3
│   ├── validate/                # Epic 4
│   └── insights/                # Epic 5
├── components/
│   ├── ui/                      # shadcn/ui components (extended)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── shell.tsx
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── features/                # Feature-specific components
│   │   ├── knowledge-graph/
│   │   ├── validation/
│   │   └── analytics/
│   └── gamification/            # Gamification components
│       ├── xp-counter.tsx
│       ├── achievement-badge.tsx
│       ├── streak-tracker.tsx
│       └── confetti.tsx
├── lib/
│   ├── design-system/           # Theme utilities
│   │   ├── colors.ts            # OKLCH color tokens
│   │   ├── typography.ts        # Font utilities
│   │   ├── spacing.ts           # Spacing scale
│   │   └── animations.ts        # motion.dev presets
│   └── utils.ts                 # Tailwind merge, cn()
├── styles/
│   └── globals.css              # Tailwind + theme variables
└── providers/
    ├── theme-provider.tsx       # Dark/light mode
    └── motion-provider.tsx      # motion.dev config
```

### 3. Theme System

**Implementation:**
- `next-themes` for dark/light mode
- CSS variables for color tokens
- `data-theme` attribute on `<html>`
- System preference detection

**Colors (CSS Variables):**
```css
:root {
  /* OKLCH Primary */
  --primary: oklch(65% 0.15 250);
  --primary-foreground: oklch(98% 0 0);

  /* OKLCH Accent */
  --accent: oklch(70% 0.25 30);
  --accent-foreground: oklch(10% 0 0);

  /* Background */
  --background: oklch(98% 0 0);
  --foreground: oklch(10% 0 0);

  /* Surface (Glassmorphism) */
  --glass-surface: oklch(95% 0 0 / 0.7);
  --glass-border: oklch(90% 0 0 / 0.5);
}

[data-theme="dark"] {
  --primary: oklch(60% 0.15 250);
  --primary-foreground: oklch(10% 0 0);

  --accent: oklch(75% 0.25 30);
  --accent-foreground: oklch(98% 0 0);

  --background: oklch(15% 0 0);
  --foreground: oklch(95% 0 0);

  --glass-surface: oklch(20% 0 0 / 0.7);
  --glass-border: oklch(30% 0 0 / 0.5);
}
```

**Tailwind Config:**
```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        accent: "var(--accent)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        glass: {
          surface: "var(--glass-surface)",
          border: "var(--glass-border)",
        },
      },
      borderRadius: {
        lg: "12px",  // Bento box rounded corners
        md: "8px",
        sm: "4px",
      },
      spacing: {
        // 4px grid system
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
    },
  },
  plugins: [],
};

export default config;
```

### 4. Motion.dev Configuration

**Installation:**
```bash
npm install motion
```

**Presets:**
```typescript
// lib/design-system/animations.ts
import { spring } from "motion";

export const animations = {
  // Spring physics (playful)
  bounce: spring({ stiffness: 300, damping: 20 }),
  smooth: spring({ stiffness: 100, damping: 20 }),

  // Durations
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,

  // Easing
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.65, 0, 0.35, 1],

  // Presets
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
  fadeIn: {
    opacity: [0, 1],
    transition: { duration: 0.3 },
  },
};
```

---

## Component Examples

### Button (Extended)

```typescript
// components/ui/button.tsx
import { motion } from "motion/react";
import { animations } from "@/lib/design-system/animations";

const buttonVariants = {
  default: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  gamified: "bg-gradient-to-r from-accent to-primary shadow-lg",
};

export function Button({ variant = "default", children, ...props }) {
  return (
    <motion.button
      className={`px-4 py-2 rounded-lg ${buttonVariants[variant]}`}
      whileHover={animations.hover}
      whileTap={animations.tap}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

### Card (Glassmorphism)

```typescript
// components/ui/card.tsx
export function Card({ children, variant = "default" }) {
  const isGlass = variant === "glass";

  return (
    <div
      className={`
        rounded-lg p-6
        ${isGlass
          ? "bg-glass-surface backdrop-blur-xl border border-glass-border"
          : "bg-background border border-foreground/10"
        }
      `}
    >
      {children}
    </div>
  );
}
```

---

## Implementation Roadmap

1. ✅ Design principles established
2. ✅ Visual spec defined
3. ✅ Technical spec created
4. ⏭️ Install shadcn/ui components
5. ⏭️ Setup theme system (dark/light)
6. ⏭️ Configure motion.dev
7. ⏭️ Build foundation components
8. ⏭️ Create layout components
9. ⏭️ Implement foundational pages

---

## Tech Stack Summary

- **React:** 19 RC (bleeding edge)
- **Next.js:** Canary (App Router, Server Components)
- **UI Library:** shadcn/ui
- **Icons:** Lucide React
- **Animations:** motion.dev
- **Styling:** Tailwind CSS (v4 if available)
- **Theme:** next-themes
- **Colors:** OKLCH color space
- **Package Manager:** npm

---

## References

- [Design Direction Document](./design-direction.md)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [motion.dev Documentation](https://motion.dev)
- [OKLCH Color Space](https://oklch.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Next Steps:** Begin Section 2 - Build Core Components

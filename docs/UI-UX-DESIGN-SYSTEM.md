---
title: "Americano UI/UX Design System Guide"
description: "Complete guide to the Americano design system featuring Apple minimalism, OKLCH colors, motion.dev animations, and cognitive science-backed UX patterns"
type: "Guide"
status: "Active"
version: "1.0.0"
owner: "Kevy"
review_cadence: "Monthly"
created_date: "2025-10-25T12:30:00-07:00"
last_updated: "2025-10-25T12:30:00-07:00"
last_reviewed: "2025-10-25T12:30:00-07:00"
depends_on:
  - docs/architecture/ADR-006-motion-standard.md
  - docs/design-system-spec.md
  - docs/design-direction.md
  - apps/web/src/lib/design-system/index.ts
affects:
  - apps/web
related_adrs:
  - docs/architecture/ADR-006-motion-standard.md
audience:
  - frontend-developers
  - designers
  - ux-engineers
technical_level: "Intermediate"
tags: ["design-system", "ui-ux", "oklch", "motion", "accessibility", "apple-design"]
search_priority: "critical"
lifecycle:
  stage: "Active"
---

# Americano UI/UX Design System Guide

**Version:** 1.0.0
**Created:** 2025-10-25
**Status:** Active
**Purpose:** World-class design system for medical education platform combining Apple minimalism with playful gamification

---

## Table of Contents

1. [Introduction](#introduction)
2. [Design Philosophy](#design-philosophy)
3. [Color System (OKLCH)](#color-system-oklch)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Animation System (motion.dev)](#animation-system-motiondev)
7. [Component Library](#component-library)
8. [Theme System](#theme-system)
9. [UX Psychology Principles](#ux-psychology-principles)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Development Workflow](#development-workflow)
12. [Best Practices](#best-practices)
13. [Migration Guide](#migration-guide)

---

## Introduction

The Americano Design System is a comprehensive UI/UX framework built on cutting-edge 2025-2026 design patterns, cognitive science principles, and accessibility standards. It combines Apple's "Think Different" minimalism with playful, expressive elements optimized for medical education.

### Design System Pillars

1. **Perceptual Uniformity** - OKLCH color space ensures consistent brightness and accessibility
2. **Physics-Based Motion** - Natural spring animations via motion.dev create responsive feel
3. **Cognitive Science** - UX patterns backed by Cognitive Load Theory and Self-Determination Theory
4. **Accessibility First** - WCAG 2.1 AAA compliance, respects user preferences
5. **Apple Minimalism** - Breathable whitespace, clear hierarchy, subtle interactions

### Tech Stack

- **Framework:** Next.js 15 (App Router, React 19 RC, Server Components)
- **UI Library:** shadcn/ui (40+ components)
- **Animations:** motion.dev v12.23.24
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **Theme:** next-themes (dark/light mode)
- **Icons:** Lucide React
- **Colors:** OKLCH color space
- **Fonts:** Figtree (headings), Inter (body)

---

## Design Philosophy

### Core Aesthetic

**Apple "Think Different" Minimalism Meets Playful Medical Education**

- Sophisticated, not aggressive
- Breathable whitespace with clear visual hierarchy
- Subtle, purposeful interactions
- Calm color palette to reduce study anxiety
- Playful celebrations for achievements (intrinsic motivation)

### Design Principles

#### 1. Clarity & Focus with "Bento Box" Minimalism

Adopt a minimalist, flat "bento box" grid layout. Each module (e.g., "Today's Review," "Knowledge Graph," "Clinical Case") is a distinct, rounded-corner card. This reduces cognitive load (Cognitive Load Theory) and provides clear visual hierarchy.

**Implementation:**
- Rounded corner cards (`rounded-lg` = 12px)
- Clear module boundaries with spacing
- One primary action per screen (vibrant accent color)
- Progressive disclosure (accordions, tabs)

#### 2. Soft, Purposeful Motion

Use motion.dev for subtle, physics-based animations that provide feedback without being distracting. For example, a gentle "wobble" on a completed task card or a fluid transition as a new learning path is recommended.

**Implementation:**
- Spring physics (stiffness 200, damping 25)
- Instant feedback on interactions
- Respects `prefers-reduced-motion`
- Celebratory bounces ONLY for achievements

#### 3. Functional (NO Glassmorphism)

**IMPORTANT CHANGE:** Glassmorphism has been removed as an outdated 2024 trend.

**Old Epic 5 Design (DEPRECATED):**
- ❌ Blurred, translucent surfaces for modals/sidebars
- ❌ `backdrop-blur-xl` on cards
- ❌ `bg-white/80` semi-transparent backgrounds

**New 2025-2026 Design:**
- ✅ Solid backgrounds with OKLCH colors
- ✅ Clear, crisp card boundaries
- ✅ Depth through shadow, not blur
- ✅ Better performance (no blur filters)

#### 4. Intrinsic Gamification for Mastery

Design for intrinsic motivation. Instead of just points, focus on progress visualization through growing "brain maps" or unlocking new clinical case studies. Frame challenges as "intellectual sparring" against AI.

**Implementation:**
- XP counters with celebratory animations
- Achievement badges with bounce effects
- Progress bars with smooth spring fills
- Streak trackers with playful visual indicators

#### 5. Adaptive & Personalized "Learning Companion"

The UI should feel like a personal tutor. The dashboard layout can adapt based on the Behavioral Learning Twin's analysis—surfacing flashcards for a visual learner or challenging clinical text for a reading/writing learner.

**Implementation:**
- VARK learning style detection (Epic 5)
- Adaptive content surfacing
- Personalized recommendations
- Burnout prevention (suggested breaks)

#### 6. Data Storytelling for Insight

Transform raw analytics into a compelling narrative. Instead of just charts, the dashboard tells a story: "You've mastered 70% of Cardiology basics! Your speed on identifying arrhythmias has increased by 15%. Ready to tackle advanced ECGs?"

**Implementation:**
- Contextual data narratives
- Actionable insights
- Emotional resonance
- Clear next steps

#### 7. Psychology of Color & Calm

Utilize the OKLCH color system to create a soft, accessible, and calming palette. Use color to guide attention pre-attentively. A single, vibrant accent color highlights the most important action on the page.

**Implementation:**
- Soft analogous palette (primary/secondary)
- Single vibrant accent for CTAs
- Semantic colors (success, warning, destructive)
- Gamification colors (energy, clinical, lab)

#### 8. Ethical Engagement & Burnout Prevention

The UI should promote healthy learning habits. If the system detects signs of cognitive overload, the interface can proactively suggest a break with a playful animation or offer a 5-minute "low-stakes" review game.

**Implementation:**
- Cognitive load monitoring (Epic 5)
- Proactive break suggestions
- Low-stakes review games
- Rest mode with calm visuals

#### 9. Seamless Flow & "Cognitive Tunnels"

Create "cognitive tunnels" for complex tasks. When a student begins a clinical case, the UI should fade out distractions, using a subtle zoom or transition to focus entirely on the case.

**Implementation:**
- Focus mode transitions
- Distraction minimization
- Clear task boundaries
- Context-preserving animations

#### 10. Playful Discovery & "Serendipity Mode"

Incorporate elements of playful discovery. A "Surprise Me!" button could surface a random, interesting medical fact or a short, engaging case from a topic the student is strong in.

**Implementation:**
- Random discovery features
- Curiosity-driven exploration
- Confidence-building content
- Playful surprise animations

### Anti-Patterns (Explicitly Avoided)

- ❌ **NO glassmorphism** (backdrop-blur on cards - outdated 2024 trend)
- ❌ **NO heavy gradients** (bg-gradient-*, linear-gradient - replaced with solid OKLCH)
- ❌ **NO aggressive animations** (bounces reserved for celebrations only)
- ❌ **NO cluttered layouts** (breathable whitespace, bento box grid)
- ❌ **NO framer-motion** (deprecated - use motion.dev)

---

## Color System (OKLCH)

### Why OKLCH?

OKLCH (Oklch Lightness Chroma Hue) is a perceptually uniform color space that ensures:

1. **Equal Lightness Across Hues** - No "dark yellow" problem from HSL
2. **Predictable Contrast Ratios** - Easier to guarantee WCAG AAA compliance
3. **Consistent Brightness** - Same L value = same perceived brightness
4. **Future-Proof** - CSS Color Level 4 standard, native browser support

**Format:**
```css
oklch(L C H)
/* L = Lightness (0-1, 0%=black, 100%=white) */
/* C = Chroma (0-0.4, 0=grayscale, 0.4=vibrant) */
/* H = Hue (0-360, degrees on color wheel) */
```

**Example:**
```css
oklch(0.7 0.15 230) /* Soft blue: 70% lightness, 0.15 chroma, 230° hue */
```

### Color Tokens

**Light Mode:**
```typescript
{
  // Base Colors
  background: 'oklch(0.98 0.01 270)',       // Near-white with slight cool tint
  foreground: 'oklch(0.25 0.02 270)',       // Dark text

  // Primary (Brand)
  primary: 'oklch(0.75 0.12 240)',          // Soft blue
  primaryForeground: 'oklch(1 0 0)',        // White text

  // Secondary
  secondary: 'oklch(0.70 0.15 150)',        // Soft green
  secondaryForeground: 'oklch(0.25 0.02 270)', // Dark text

  // Accent (CTA)
  accent: 'oklch(0.78 0.13 340)',           // Vibrant pink
  accentForeground: 'oklch(0.25 0.02 270)', // Dark text

  // Semantic
  destructive: 'oklch(0.577 0.245 27.325)', // Red
  success: 'oklch(0.7 0.15 145)',           // Green
  warning: 'oklch(0.8 0.15 90)',            // Yellow
  info: 'oklch(0.65 0.18 240)',             // Blue

  // Gamification
  energy: 'oklch(0.7 0.18 50)',             // Warm orange (XP)
  clinical: 'oklch(0.6 0.15 230)',          // Professional blue (clinical skills)
  lab: 'oklch(0.65 0.12 160)',              // Fresh green (lab work)
}
```

**Dark Mode:**
```typescript
{
  // Base Colors
  background: 'oklch(0.145 0 0)',           // Deep black
  foreground: 'oklch(0.985 0 0)',           // Near-white

  // Primary (Brand)
  primary: 'oklch(0.6 0.15 250)',           // Vibrant blue for OLED
  primaryForeground: 'oklch(0.205 0 0)',    // Dark text

  // Accent (CTA)
  accent: 'oklch(0.75 0.25 30)',            // High-chroma red-orange
  accentForeground: 'oklch(0.985 0 0)',     // White text

  // Semantic (brighter for dark backgrounds)
  destructive: 'oklch(0.396 0.141 25.723)',
  success: 'oklch(0.75 0.18 145)',
  warning: 'oklch(0.85 0.18 85)',
  info: 'oklch(0.7 0.2 240)',

  // Gamification (increased chroma for visibility)
  energy: 'oklch(0.75 0.2 50)',
  clinical: 'oklch(0.65 0.18 230)',
  lab: 'oklch(0.7 0.15 160)',
}
```

### Using Colors in Code

**Import from Design System:**
```typescript
import { colors, getColor, getCSSVar } from '@/lib/design-system'

// Get color for specific mode
const primaryLight = getColor('primary', 'light') // 'oklch(0.75 0.12 240)'
const primaryDark = getColor('primary', 'dark')   // 'oklch(0.6 0.15 250)'

// Get CSS variable reference
const primaryVar = getCSSVar('primary') // 'var(--primary)'
```

**Tailwind Classes:**
```tsx
<div className="bg-primary text-primary-foreground">Primary Button</div>
<div className="bg-accent text-accent-foreground">Accent CTA</div>
<div className="bg-success text-success-foreground">Success State</div>
<div className="bg-energy text-energy-foreground">+50 XP</div>
```

### Color Usage Guidelines

**Primary:** Main brand actions (buttons, links, active states, sidebar highlights)

**Accent:** Single most important CTA per screen (e.g., "Start Session", "Begin Challenge")

**Secondary:** Supporting actions with less emphasis (e.g., "View Details", "Learn More")

**Muted:** Subtle backgrounds, disabled states, placeholder text

**Semantic:**
- Success: Completed tasks, correct answers, achievements unlocked
- Warning: Attention needed, calibration alerts, burnout warnings
- Destructive: Delete actions, critical errors, failed attempts
- Info: Informational messages, tooltips, helper text

**Gamification:**
- Energy: XP counters, reward animations, level-up effects
- Clinical: Clinical reasoning scores, case completion, medical knowledge
- Lab: Lab skills progress, research achievements, data analysis

---

## Typography

### Font Families

**Heading Font: Figtree**
- Geometric sans-serif
- Clean, modern, Apple-inspired
- Variable font for smooth weight transitions
- Weights: 300 (light), 400 (regular), 600 (semibold), 700 (bold)

**Body Font: Inter**
- Humanist sans-serif
- Optimized for long-form reading
- High legibility at all sizes
- Variable font for smooth weight transitions
- Weights: 400 (regular), 500 (medium), 600 (semibold)

**Installation (next/font):**
```typescript
import { Figtree, Inter } from 'next/font/google'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-figtree',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
})
```

### Type Scale (1.25 Ratio - Major Third)

| Size   | Pixels | Usage                  |
|--------|--------|------------------------|
| xs     | 12px   | Captions, footnotes    |
| sm     | 14px   | Small text, labels     |
| base   | 16px   | Body text (default)    |
| lg     | 20px   | Lead paragraphs        |
| xl     | 25px   | H6, large body         |
| 2xl    | 31px   | H5                     |
| 3xl    | 39px   | H4                     |
| 4xl    | 49px   | H3                     |
| 5xl    | 61px   | H2                     |
| 6xl    | 76px   | H1                     |
| 7xl    | 95px   | Display                |

### Preset Text Styles

**Import from Design System:**
```typescript
import { textH1, textH2, textBody, textCaption } from '@/lib/design-system'
```

**Usage:**
```tsx
<h1 className={textH1}>Page Title</h1>
<h2 className={textH2}>Section Heading</h2>
<p className={textBody}>Body paragraph with optimal line height and spacing.</p>
<span className={textCaption}>Caption text for images and footnotes</span>
```

**Preset Definitions:**
```typescript
textDisplay = "font-heading text-7xl font-bold leading-none tracking-tight" // Hero text
textH1 = "font-heading text-6xl font-bold leading-tight tracking-tight"
textH2 = "font-heading text-5xl font-semibold leading-tight tracking-tight"
textH3 = "font-heading text-4xl font-semibold leading-snug"
textH4 = "font-heading text-3xl font-semibold leading-snug"
textH5 = "font-heading text-2xl font-semibold leading-normal"
textH6 = "font-heading text-xl font-semibold leading-normal"
textLead = "font-body text-lg font-normal leading-relaxed" // Lead paragraph
textBody = "font-body text-base font-normal leading-relaxed" // Default body
textBodySmall = "font-body text-sm font-normal leading-relaxed"
textCaption = "font-body text-xs font-normal leading-normal text-muted-foreground"
textButton = "font-body text-sm font-medium leading-none"
textOverline = "font-body text-xs font-medium leading-none uppercase tracking-wide"
textCode = "font-mono text-sm"
```

### Typography Utilities

**Text Truncation:**
```typescript
import { textTruncate, textClamp } from '@/lib/design-system'

<p className={textTruncate}>Single line with ellipsis...</p>
<p className={textClamp(3)}>Clamp to 3 lines with ellipsis...</p>
```

**Text Balance/Pretty (CSS):**
```typescript
import { textBalance, textPretty } from '@/lib/design-system'

<h1 className={textBalance}>Balanced headline wrapping</h1>
<p className={textPretty}>Better line breaks for readability</p>
```

---

## Spacing & Layout

### Grid System (4px Base Unit)

All spacing follows a 4px grid for visual consistency and alignment.

**Scale:**
```
0    → 0px
1    → 4px
2    → 8px
3    → 12px
4    → 16px
5    → 20px
6    → 24px
7    → 28px
8    → 32px
10   → 40px
12   → 48px
14   → 56px
16   → 64px
20   → 80px
24   → 96px
28   → 112px
32   → 128px
```

### Spacing Utilities

**Import from Design System:**
```typescript
import { spacing, padding, margin, gap } from '@/lib/design-system'

// Get raw spacing value
const space = spacing('4') // '16px'

// Tailwind-compatible classes
const paddingClasses = padding('4')   // 'p-4'
const marginClasses = marginX('6')    // 'mx-6'
const gapClasses = gap('8')           // 'gap-8'
```

**Usage:**
```tsx
<div className={`${padding('4')} ${gap('6')}`}>
  <Card className={margin('8')}>Content</Card>
</div>
```

### Responsive Spacing

```typescript
import { responsiveSpacing } from '@/lib/design-system'

const responsivePadding = responsiveSpacing({
  base: '4',  // 16px on mobile
  md: '6',    // 24px on tablet
  lg: '8',    // 32px on desktop
})
// Returns: { base: '16px', md: '24px', lg: '32px' }
```

### Container Widths

```typescript
containerWidth = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
}
```

### Layout Patterns

**Bento Box Grid:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
  <Card className="rounded-lg p-6">Module 1</Card>
  <Card className="rounded-lg p-6">Module 2</Card>
  <Card className="rounded-lg p-6">Module 3</Card>
</div>
```

**Sidebar Layout (Global):**
```tsx
<SidebarProvider>
  <Sidebar />
  <SidebarInset>
    <main className="p-6 space-y-6">
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

---

## Animation System (motion.dev)

### Spring Physics Presets

**Import from Design System:**
```typescript
import {
  springSubtle,
  springSmooth,
  springResponsive,
  springGentle,
  springBouncy
} from '@/lib/design-system'
```

**Preset Definitions:**
```typescript
springSubtle = {      // DEFAULT - Most UI interactions
  stiffness: 200,
  damping: 25,
  mass: 1,
}

springSmooth = {      // Cards, modals, larger elements
  stiffness: 180,
  damping: 28,
  mass: 1.2,
}

springResponsive = {  // Buttons, toggles, immediate feedback
  stiffness: 240,
  damping: 22,
  mass: 0.8,
}

springGentle = {      // Tooltips, popovers, delicate animations
  stiffness: 160,
  damping: 30,
  mass: 1.4,
}

springBouncy = {      // Achievements ONLY (celebratory)
  stiffness: 220,
  damping: 15,
  mass: 1,
}
```

### Animation Variants

**Button Animations:**
```typescript
import { buttonPrimaryVariants } from '@/lib/design-system'
import { motion } from 'motion/react'

<motion.button
  variants={buttonPrimaryVariants}
  initial="initial"
  whileHover="hover"
  whileTap="tap"
  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
>
  Click Me
</motion.button>

// Variant definition:
buttonPrimaryVariants = {
  initial: { scale: 1, y: 0, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
  hover: { scale: 1.02, y: -1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' },
  tap: { scale: 0.98, y: 0, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
}
```

**Card Animations:**
```typescript
import { cardVariants } from '@/lib/design-system'

<motion.div
  variants={cardVariants}
  initial="initial"
  whileHover="hover"
  className="bg-card p-6 rounded-lg"
>
  Interactive Card
</motion.div>

// Variant definition:
cardVariants = {
  initial: { y: 0, scale: 1, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)' },
  hover: { y: -4, scale: 1.01, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' },
}
```

**Page Transitions:**
```typescript
import { pageSlideInVariants } from '@/lib/design-system'

<motion.div
  variants={pageSlideInVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  Page Content
</motion.div>

// Variant definition:
pageSlideInVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: springSmooth },
  exit: { opacity: 0, x: -20, transition: springSmooth },
}
```

**List Stagger:**
```typescript
import { listContainerVariants, listItemVariants } from '@/lib/design-system'

<motion.ul
  variants={listContainerVariants}
  initial="initial"
  animate="animate"
>
  {items.map((item) => (
    <motion.li key={item.id} variants={listItemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>

// Container variant:
listContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

// Item variant:
listItemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: springSubtle },
}
```

**Celebration Animations:**
```typescript
import { xpIncrementVariants, achievementUnlockVariants, confettiVariants } from '@/lib/design-system'

// XP increment (+50 XP pops up)
<motion.div
  variants={xpIncrementVariants}
  initial="initial"
  animate="animate"
  className="text-energy text-xl font-bold"
>
  +50 XP
</motion.div>

// Achievement badge unlock
<motion.div
  variants={achievementUnlockVariants}
  initial="initial"
  animate="animate"
  className="bg-success p-4 rounded-full"
>
  🏆
</motion.div>

// Confetti particles
{Array.from({ length: 20 }).map((_, i) => (
  <motion.div
    key={i}
    variants={confettiVariants}
    initial="initial"
    animate="animate"
    custom={generateConfettiConfig(i)}
    className="absolute w-2 h-2 bg-accent rounded-full"
  />
))}
```

### Accessibility: prefers-reduced-motion

**Always respect user preferences:**
```typescript
import { getMotionPreference } from '@/lib/design-system'

<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={getMotionPreference(springSubtle)}
>
  Respects user's motion preferences
</motion.div>

// getMotionPreference() returns instant transitions if user prefers reduced motion
```

---

## Component Library

### shadcn/ui Foundation

**Installed Components:** 40+ components available

**Categories:**
- Layout: Sidebar, Card, Sheet, Separator, ScrollArea
- Forms: Input, Textarea, Select, Combobox, Checkbox, Radio, Switch, Slider
- Feedback: Button, Badge, Toast, Alert, Progress, Skeleton
- Navigation: Tabs, Accordion, Breadcrumb, Pagination, NavigationMenu
- Overlays: Dialog, Popover, Tooltip, DropdownMenu, AlertDialog

**Installation:**
```bash
npx shadcn@latest add button card input # etc.
```

### Component Usage Examples

**Button:**
```tsx
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { buttonPrimaryVariants } from '@/lib/design-system'

<motion.div variants={buttonPrimaryVariants}>
  <Button variant="default">Primary Action</Button>
  <Button variant="secondary">Secondary Action</Button>
  <Button variant="outline">Outline Button</Button>
  <Button variant="ghost">Ghost Button</Button>
</motion.div>
```

**Card:**
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { motion } from 'motion/react'
import { cardVariants } from '@/lib/design-system'

<motion.div variants={cardVariants} whileHover="hover">
  <Card className="bg-card rounded-lg">
    <CardHeader>
      <CardTitle className={textH3}>Mission: Cardiology Basics</CardTitle>
    </CardHeader>
    <CardContent>
      <p className={textBody}>Complete 10 flashcards on arrhythmias.</p>
    </CardContent>
  </Card>
</motion.div>
```

**Form Components:**
```tsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<div className="space-y-4">
  <div>
    <Label htmlFor="name">Name</Label>
    <Input id="name" placeholder="Enter your name" />
  </div>

  <div>
    <Label htmlFor="notes">Notes</Label>
    <Textarea id="notes" rows={4} />
  </div>

  <div>
    <Label htmlFor="difficulty">Difficulty</Label>
    <Select>
      <SelectTrigger id="difficulty">
        <SelectValue placeholder="Select difficulty" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="easy">Easy</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="hard">Hard</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

**Dialog:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Upload Lecture</DialogTitle>
    </DialogHeader>
    <p>Upload your lecture files here...</p>
  </DialogContent>
</Dialog>
```

---

## Theme System

### Dark/Light Mode with next-themes

**Provider Setup (Root Layout):**
```tsx
// apps/web/src/app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Theme Toggle Component:**
```tsx
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### CSS Variables (globals.css)

**Tailwind v4 @theme Directive:**
```css
@import "tailwindcss";

@theme {
  /* Light Mode Colors (OKLCH) */
  --color-background: oklch(0.98 0.01 270);
  --color-foreground: oklch(0.25 0.02 270);
  --color-primary: oklch(0.75 0.12 240);
  --color-accent: oklch(0.78 0.13 340);
  /* ... more colors */

  /* Font Families */
  --font-heading: var(--font-figtree);
  --font-body: var(--font-inter);

  /* Spacing (4px grid) */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-4: 16px;
  /* ... more spacing */

  /* Border Radius */
  --radius-lg: 12px;
  --radius-md: 8px;
  --radius-sm: 4px;
}

[data-theme="dark"] {
  /* Dark Mode Colors */
  --color-background: oklch(0.145 0 0);
  --color-foreground: oklch(0.985 0 0);
  --color-primary: oklch(0.6 0.15 250);
  --color-accent: oklch(0.75 0.25 30);
  /* ... more colors */
}
```

---

## UX Psychology Principles

### Cognitive Load Reduction

**Goal:** Minimize mental effort required to use the interface

**Techniques:**
1. **One Primary Action Per Screen** - Use vibrant accent color for single most important CTA
2. **Clear Visual Hierarchy** - Typography scale (1.25 ratio) + spacing (4px grid)
3. **Chunked Information** - Bento box cards group related content
4. **Progressive Disclosure** - Accordions/tabs reveal details on demand

**Implementation:**
```tsx
<div className="space-y-6">
  {/* Single primary action */}
  <Button variant="accent" size="lg" className="w-full">
    Start Today's Session
  </Button>

  {/* Chunked information in cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Today's Review</CardTitle>
      </CardHeader>
      <CardContent>10 flashcards</CardContent>
    </Card>
    {/* More cards... */}
  </div>

  {/* Progressive disclosure */}
  <Accordion type="single" collapsible>
    <AccordionItem value="details">
      <AccordionTrigger>View Details</AccordionTrigger>
      <AccordionContent>
        Hidden details revealed on demand
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</div>
```

### Emotional Design

**Goal:** Create positive emotional responses to motivate learning

**Techniques:**
1. **Playful Celebrations** - Confetti, badges, XP pops for achievements
2. **Encouraging Feedback** - "You're on a 7-day streak!" vs. "Days studied: 7"
3. **Calm Color Palette** - OKLCH soft blues/greens reduce study anxiety
4. **Subtle Animations** - Spring physics make interface feel alive, responsive

**Implementation:**
```tsx
// Celebration animation on achievement unlock
<motion.div
  variants={achievementUnlockVariants}
  initial="initial"
  animate="animate"
  className="flex items-center gap-4 p-6 bg-success rounded-lg"
>
  <motion.div
    variants={confettiVariants}
    className="text-4xl"
  >
    🎉
  </motion.div>
  <div>
    <h3 className={textH4}>Achievement Unlocked!</h3>
    <p className={textBody}>You've mastered Cardiology Basics!</p>
  </div>
</motion.div>

// Encouraging feedback
<div className="flex items-center gap-2 text-success">
  <FireIcon className="h-5 w-5" />
  <span className="font-semibold">7-day streak!</span>
  <span className="text-muted-foreground">Keep it up!</span>
</div>
```

### Anticipatory UX

**Goal:** Predict user needs and surface relevant content proactively

**Techniques:**
1. **Predictive Content Surfacing** - Behavioral Twin suggests next review based on forgetting curve
2. **Adaptive Layouts** - Dashboard changes based on VARK learning style (visual/auditory/reading/kinesthetic)
3. **Burnout Prevention** - Proactive break suggestions when cognitive load spikes
4. **Serendipity Mode** - Random medical facts to maintain curiosity

**Implementation:**
```tsx
// Behavioral Twin recommendation
<Card className="border-accent bg-accent/5">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <SparklesIcon className="h-5 w-5 text-accent" />
      Recommended for You
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p>Your Behavioral Twin predicts you'll forget Arrhythmia basics in 2 days. Review now?</p>
    <Button variant="accent" className="mt-4">Start Review</Button>
  </CardContent>
</Card>

// Burnout prevention
{cognitiveLoadHigh && (
  <motion.div
    variants={modalContentVariants}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  >
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Time for a Break?</CardTitle>
      </CardHeader>
      <CardContent>
        <p>You've been studying for 90 minutes straight. Consider taking a 10-minute break.</p>
        <div className="flex gap-4 mt-4">
          <Button variant="accent">Take a Break</Button>
          <Button variant="outline">Keep Studying</Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)}
```

### Flow & Focus

**Goal:** Create "cognitive tunnels" for deep, focused study sessions

**Techniques:**
1. **Focus Mode Transitions** - Fade out distractions when entering study mode
2. **Distraction Minimization** - Hide sidebar, notifications during cases
3. **Clear Task Boundaries** - Page transitions signal task switches
4. **Context-Preserving Animations** - Smooth transitions maintain spatial awareness

**Implementation:**
```tsx
// Focus mode transition
<motion.div
  initial={{ opacity: 1 }}
  animate={{ opacity: focusMode ? 0 : 1 }}
  transition={springSmooth}
  className="fixed inset-0 pointer-events-none bg-background/50 backdrop-blur-sm"
/>

{/* Main content with zoom transition */}
<motion.div
  initial={{ scale: 1 }}
  animate={{ scale: focusMode ? 1.05 : 1 }}
  transition={springSmooth}
  className="relative z-10"
>
  <ClinicalCaseContent />
</motion.div>
```

---

## Accessibility Guidelines

### WCAG 2.1 AAA Compliance

**Color Contrast:**
- OKLCH color space ensures predictable contrast ratios
- All text meets 7:1 contrast (AAA) against backgrounds
- Interactive elements meet 4.5:1 minimum (AA Large)

**Keyboard Navigation:**
- All interactive elements accessible via Tab/Shift+Tab
- Arrow keys for navigation within components
- Enter/Space for activation
- Escape to close dialogs/modals

**Focus Indicators:**
- Visible focus rings on all interactive elements
- `ring-offset-background` for clear visibility
- `ring-primary` for consistent brand color

**Screen Reader Support:**
- Semantic HTML (`<nav>`, `<main>`, `<aside>`, `<article>`)
- `aria-label` for icon-only buttons
- `aria-describedby` for contextual help
- `role` attributes for custom components

**Motion Preferences:**
- Respect `prefers-reduced-motion`
- Instant transitions when motion is reduced
- `getMotionPreference()` utility enforces this

### Accessibility Checklist

```tsx
// Example: Accessible Button
<Button
  variant="primary"
  aria-label="Start today's study session"
  className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
>
  <PlayIcon className="h-5 w-5" aria-hidden="true" />
  <span>Start Session</span>
</Button>

// Example: Accessible Dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    aria-describedby="dialog-description"
    className="focus:outline-none"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">Upload Lecture</DialogTitle>
    </DialogHeader>
    <p id="dialog-description">
      Upload your lecture files here. Supported formats: PDF, PPTX, DOCX.
    </p>
  </DialogContent>
</Dialog>
```

---

## Development Workflow

### Step-by-Step Component Creation

1. **Fetch Latest Docs (MCP):**
   ```
   "Fetching latest shadcn/ui Button component from shadcn MCP..."
   ```

2. **Install Component:**
   ```bash
   npx shadcn@latest add button
   ```

3. **Import Design System Tokens:**
   ```typescript
   import { springSubtle, colors, spacing, textH3 } from '@/lib/design-system'
   ```

4. **Apply Animations:**
   ```tsx
   <motion.div variants={buttonPrimaryVariants}>
     <Button>Click Me</Button>
   </motion.div>
   ```

5. **Use OKLCH Colors:**
   ```tsx
   <div className="bg-primary text-primary-foreground">
     Primary Element
   </div>
   ```

6. **Follow Spacing System:**
   ```tsx
   <div className="p-4 gap-6 space-y-8">
     {/* 4px grid: 16px padding, 24px gap, 32px vertical spacing */}
   </div>
   ```

7. **Test Dark Mode:**
   - Toggle theme switcher
   - Verify color contrast
   - Check readability

8. **Test Motion Preferences:**
   - Enable "Reduce motion" in OS settings
   - Verify instant transitions
   - Confirm `getMotionPreference()` wrapper used

### Code Review Checklist

- [ ] Design system tokens imported (`@/lib/design-system`)
- [ ] OKLCH colors used (no hex, HSL, or RGB)
- [ ] Spacing follows 4px grid (use `spacing()` helper)
- [ ] Animations use motion.dev (not framer-motion)
- [ ] `prefers-reduced-motion` respected
- [ ] Dark mode tested and verified
- [ ] WCAG 2.1 AAA contrast ratios
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] NO glassmorphism (solid backgrounds only)
- [ ] NO gradients (solid OKLCH colors)

---

## Best Practices

### Do's ✅

1. **Use Design System Tokens**
   ```tsx
   import { springSubtle, colors, textH3 } from '@/lib/design-system'
   ```

2. **Apply Spring Animations**
   ```tsx
   <motion.div variants={buttonPrimaryVariants} whileHover="hover" />
   ```

3. **Follow 4px Grid**
   ```tsx
   <div className="p-4 gap-6"> {/* 16px padding, 24px gap */}
   ```

4. **Use OKLCH Colors**
   ```tsx
   <div className="bg-primary text-primary-foreground">
   ```

5. **Respect Motion Preferences**
   ```tsx
   transition={getMotionPreference(springSubtle)}
   ```

6. **Test Dark Mode**
   - Toggle theme, verify contrast

7. **Add Accessibility**
   ```tsx
   <Button aria-label="Start session" className="focus:ring-2">
   ```

### Don'ts ❌

1. **NO Glassmorphism**
   ```tsx
   ❌ <div className="bg-white/80 backdrop-blur-xl">
   ✅ <div className="bg-card">
   ```

2. **NO Gradients**
   ```tsx
   ❌ <div className="bg-gradient-to-r from-blue-500 to-purple-500">
   ✅ <div className="bg-primary">
   ```

3. **NO Framer Motion**
   ```tsx
   ❌ import { motion } from 'framer-motion'
   ✅ import { motion } from 'motion/react'
   ```

4. **NO Arbitrary Spacing**
   ```tsx
   ❌ <div className="p-[13px]">
   ✅ <div className="p-3"> {/* 12px = 3 × 4px */}
   ```

5. **NO Hex/HSL/RGB Colors**
   ```tsx
   ❌ <div className="bg-[#3b82f6]">
   ✅ <div className="bg-primary">
   ```

6. **NO Aggressive Bounces**
   ```tsx
   ❌ <motion.div transition={springBouncy}> // Only for celebrations!
   ✅ <motion.div transition={springSubtle}>
   ```

---

## Migration Guide

### From Epic 5 Design System

**Retained:**
- ✅ OKLCH color system (same tokens)
- ✅ motion.dev v12.23.24 (same library)
- ✅ Figtree + Inter fonts
- ✅ 4px grid spacing

**Removed:**
- ❌ Glassmorphism styling (`backdrop-blur-*` on cards)
- ❌ Gradient backgrounds (`bg-gradient-*`)
- ❌ Semi-transparent backgrounds (`bg-white/80`)

**Improved:**
- ✅ Typography scale (1.25 ratio, clearer hierarchy)
- ✅ Spacing utilities (`spacing()`, `padding()`, etc.)
- ✅ Animation variants (more presets)
- ✅ Apple minimalism aesthetic (breathable whitespace)

### Breaking Changes

1. **Remove Glassmorphism:**
   ```tsx
   // Old (Epic 5)
   <Card className="bg-white/80 backdrop-blur-xl border border-white/50">

   // New (2025-2026)
   <Card className="bg-card border border-border">
   ```

2. **Remove Gradients:**
   ```tsx
   // Old
   <div className="bg-gradient-to-r from-primary to-accent">

   // New
   <div className="bg-primary"> {/* Solid color */}
   ```

3. **Update Typography:**
   ```tsx
   // Old
   <h1 className="font-sans text-5xl">

   // New
   import { textH1 } from '@/lib/design-system'
   <h1 className={textH1}>
   ```

4. **Update Spacing:**
   ```tsx
   // Old
   <div className="p-6 gap-8">

   // New
   import { padding, gap } from '@/lib/design-system'
   <div className={`${padding('6')} ${gap('8')}`}>
   ```

### Migration Steps

1. **Update Imports:**
   ```typescript
   // Add design system imports
   import { springSubtle, colors, textH3, spacing } from '@/lib/design-system'
   ```

2. **Remove Glassmorphism:**
   - Find: `backdrop-blur-*`, `bg-white/80`, `bg-black/50`
   - Replace with: `bg-card`, `bg-background`, solid OKLCH colors

3. **Remove Gradients:**
   - Find: `bg-gradient-*`, `linear-gradient`, `radial-gradient`
   - Replace with: `bg-primary`, `bg-accent`, solid colors

4. **Update Typography:**
   - Replace arbitrary font sizes with preset styles (`textH1`, `textBody`, etc.)

5. **Test Dark Mode:**
   - Toggle theme, verify contrast
   - Check all pages for color issues

6. **Test Motion:**
   - Enable "Reduce motion" in OS
   - Verify instant transitions

---

## Summary

The Americano Design System is a comprehensive UI/UX framework built on:

1. **OKLCH Colors** - Perceptually uniform, accessible, future-proof
2. **motion.dev Animations** - Subtle spring physics, Apple-inspired
3. **Apple Minimalism** - Breathable whitespace, bento box layouts
4. **Cognitive Science** - UX patterns backed by research
5. **Accessibility First** - WCAG 2.1 AAA, respects user preferences

**Key Principles:**
- Subtle over flashy
- Solid colors over gradients (NO glassmorphism)
- Physics-based motion (spring presets)
- 4px grid spacing
- Clear visual hierarchy

**Resources:**
- Design System: `apps/web/src/lib/design-system/`
- Documentation: `docs/UI-UX-DESIGN-SYSTEM.md` (this file)
- Spec: `docs/design-system-spec.md`
- Direction: `docs/design-direction.md`
- ADR: `docs/architecture/ADR-006-motion-standard.md`

**Start Building:**
```typescript
import { springSubtle, colors, textH1, spacing } from '@/lib/design-system'
import { motion } from 'motion/react'

<motion.div
  variants={buttonPrimaryVariants}
  className="bg-primary text-primary-foreground p-4 rounded-lg"
>
  <h1 className={textH1}>Hello, Americano!</h1>
</motion.div>
```

---

**Last Updated:** 2025-10-25
**Version:** 1.0.0
**Next Review:** 2025-11-25 (Monthly)

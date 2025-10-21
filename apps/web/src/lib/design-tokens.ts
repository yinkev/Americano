/**
 * Design Tokens for Premium UI
 * "Linear Light × Maximum Flair" Design System
 *
 * This file contains the design tokens for the Americano Epic 5 UI transformation.
 * - 80% Playful, 20% Professional
 * - Desktop/laptop optimized (1440px - 2560px+)
 * - Light theme with vibrant OKLCH colors
 */

export const typography = {
  heading: {
    h1: 'text-[28px] md:text-[32px] font-heading font-bold tracking-tight',
    h2: 'text-[20px] font-heading font-semibold tracking-tight',
    h3: 'text-[16px] font-heading font-semibold',
  },
  body: {
    base: 'text-[15px] font-sans leading-relaxed',
    small: 'text-[13px] font-sans leading-relaxed',
    tiny: 'text-[11px] font-sans leading-normal',
  },
} as const

export const spacing = {
  tight: '8px',
  compact: '12px',
  standard: '16px',
  comfortable: '24px',
  spacious: '32px',
} as const

export const colors = {
  // Playful accents for gamification
  success: 'oklch(0.7 0.15 145)', // Vibrant green
  warning: 'oklch(0.75 0.15 85)', // Warm amber
  info: 'oklch(0.65 0.18 240)', // Bright blue
  energy: 'oklch(0.7 0.18 50)', // Energetic orange

  // Medical professional
  clinical: 'oklch(0.6 0.15 230)', // Professional blue
  lab: 'oklch(0.65 0.12 160)', // Clinical teal
  alert: 'oklch(0.6 0.20 30)', // Medical red

  // Neutral light theme
  background: 'oklch(0.98 0 0)', // Near white
  foreground: 'oklch(0.15 0 0)', // Near black
  muted: 'oklch(0.92 0 0)', // Light gray
  mutedForeground: 'oklch(0.5 0 0)', // Medium gray
  border: 'oklch(0.88 0 0)', // Border gray
} as const

export const transitions = {
  fast: '150ms ease-out',
  medium: '300ms ease-in-out',
  slow: '800ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Satisfying bounce
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

/**
 * Glassmorphism effect (use sparingly!)
 * Only for special accent cards and hover states
 */
export const glassmorphism = {
  light: 'bg-white/80 backdrop-blur-sm border border-white/30',
  medium: 'bg-white/70 backdrop-blur-md border border-white/20',
} as const

/**
 * Grid configurations for adaptive responsive design
 */
export const grid = {
  cols1: 'grid-cols-1',
  cols2: 'md:grid-cols-2',
  cols3: 'lg:grid-cols-3',
  gap4: 'gap-4',
  gap6: 'gap-6',
} as const

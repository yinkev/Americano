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
  success: 'oklch(0.8 0.15 145)', // Softer green
  warning: 'oklch(0.85 0.15 85)', // Softer amber
  info: 'oklch(0.75 0.18 240)', // Softer blue
  energy: 'oklch(0.8 0.18 50)', // Softer orange

  // Medical professional
  clinical: 'oklch(0.7 0.15 230)', // Professional blue
  lab: 'oklch(0.75 0.12 160)', // Softer clinical teal
  alert: 'oklch(0.7 0.20 30)', // Softer medical red

  // Neutral light theme
  background: 'oklch(0.99 0 0)', // Almost white
  foreground: 'oklch(0.1 0 0)', // Near black
  muted: 'oklch(0.95 0 0)', // Lighter gray
  mutedForeground: 'oklch(0.4 0 0)', // Darker medium gray
  border: 'oklch(0.9 0 0)', // Lighter border gray
} as const

export const transitions = {
  fast: '150ms ease-out',
  medium: '300ms ease-in-out',
  slow: '800ms cubic-bezier(0.34, 1.56, 0.64, 1)', // Satisfying bounce
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
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
 * Grid configurations for adaptive responsive design
 */
export const grid = {
  cols1: 'grid-cols-1',
  cols2: 'md:grid-cols-2',
  cols3: 'lg:grid-cols-3',
  gap4: 'gap-4',
  gap6: 'gap-6',
} as const

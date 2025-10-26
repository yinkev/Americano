/**
 * Design System - Spacing
 * 4px grid system for consistent spatial rhythm
 * Apple-inspired spacing scale for clean, breathable layouts
 */

// ============================================================================
// Spacing Scale (4px grid)
// ============================================================================

/**
 * Base spacing unit (4px)
 * All spacing values are multiples of this unit
 */
export const SPACING_UNIT = 4

/**
 * Spacing scale in pixels
 * Values follow 4px grid for pixel-perfect alignment
 */
export const spacingPx = {
  /** 0px - No space */
  0: 0,

  /** 4px - Minimal spacing (tight elements) */
  1: 4,

  /** 8px - Small spacing (related elements) */
  2: 8,

  /** 12px - Medium-small spacing */
  3: 12,

  /** 16px - Base spacing (default gap) */
  4: 16,

  /** 20px - Medium spacing */
  5: 20,

  /** 24px - Medium-large spacing */
  6: 24,

  /** 32px - Large spacing (section separation) */
  8: 32,

  /** 40px - XL spacing */
  10: 40,

  /** 48px - 2XL spacing (major sections) */
  12: 48,

  /** 64px - 3XL spacing (page sections) */
  16: 64,

  /** 80px - 4XL spacing */
  20: 80,

  /** 96px - 5XL spacing (hero sections) */
  24: 96,

  /** 128px - 6XL spacing (major page divisions) */
  32: 128,
} as const

/**
 * Spacing scale in rem units (for responsive scaling)
 * Base: 16px = 1rem
 */
export const spacing = {
  /** 0rem - No space */
  0: '0',

  /** 0.25rem (4px) */
  1: '0.25rem',

  /** 0.5rem (8px) */
  2: '0.5rem',

  /** 0.75rem (12px) */
  3: '0.75rem',

  /** 1rem (16px) - Base spacing */
  4: '1rem',

  /** 1.25rem (20px) */
  5: '1.25rem',

  /** 1.5rem (24px) */
  6: '1.5rem',

  /** 2rem (32px) */
  8: '2rem',

  /** 2.5rem (40px) */
  10: '2.5rem',

  /** 3rem (48px) */
  12: '3rem',

  /** 4rem (64px) */
  16: '4rem',

  /** 5rem (80px) */
  20: '5rem',

  /** 6rem (96px) */
  24: '6rem',

  /** 8rem (128px) */
  32: '8rem',
} as const

// ============================================================================
// Padding Presets
// ============================================================================

/**
 * Padding presets for common UI elements
 */
export const padding = {
  /** No padding */
  none: {
    padding: spacing[0],
  },

  /** Tight padding - 8px (compact buttons, chips) */
  tight: {
    padding: spacing[2],
  },

  /** Small padding - 12px (small cards, inputs) */
  sm: {
    padding: spacing[3],
  },

  /** Base padding - 16px (default cards, buttons) */
  base: {
    padding: spacing[4],
  },

  /** Medium padding - 24px (medium cards, sections) */
  md: {
    padding: spacing[6],
  },

  /** Large padding - 32px (large cards, containers) */
  lg: {
    padding: spacing[8],
  },

  /** XL padding - 48px (page sections) */
  xl: {
    padding: spacing[12],
  },

  /** 2XL padding - 64px (major sections) */
  '2xl': {
    padding: spacing[16],
  },
} as const

/**
 * Horizontal padding only
 */
export const paddingX = {
  none: {
    paddingLeft: spacing[0],
    paddingRight: spacing[0],
  },
  tight: {
    paddingLeft: spacing[2],
    paddingRight: spacing[2],
  },
  sm: {
    paddingLeft: spacing[3],
    paddingRight: spacing[3],
  },
  base: {
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
  },
  md: {
    paddingLeft: spacing[6],
    paddingRight: spacing[6],
  },
  lg: {
    paddingLeft: spacing[8],
    paddingRight: spacing[8],
  },
  xl: {
    paddingLeft: spacing[12],
    paddingRight: spacing[12],
  },
} as const

/**
 * Vertical padding only
 */
export const paddingY = {
  none: {
    paddingTop: spacing[0],
    paddingBottom: spacing[0],
  },
  tight: {
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  sm: {
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
  },
  base: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  md: {
    paddingTop: spacing[6],
    paddingBottom: spacing[6],
  },
  lg: {
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
  },
  xl: {
    paddingTop: spacing[12],
    paddingBottom: spacing[12],
  },
} as const

// ============================================================================
// Margin Presets
// ============================================================================

/**
 * Margin presets for spacing between elements
 */
export const margin = {
  /** No margin */
  none: {
    margin: spacing[0],
  },

  /** Tight margin - 8px */
  tight: {
    margin: spacing[2],
  },

  /** Small margin - 12px */
  sm: {
    margin: spacing[3],
  },

  /** Base margin - 16px */
  base: {
    margin: spacing[4],
  },

  /** Medium margin - 24px */
  md: {
    margin: spacing[6],
  },

  /** Large margin - 32px */
  lg: {
    margin: spacing[8],
  },

  /** XL margin - 48px */
  xl: {
    margin: spacing[12],
  },

  /** 2XL margin - 64px */
  '2xl': {
    margin: spacing[16],
  },
} as const

/**
 * Horizontal margin only
 */
export const marginX = {
  none: {
    marginLeft: spacing[0],
    marginRight: spacing[0],
  },
  tight: {
    marginLeft: spacing[2],
    marginRight: spacing[2],
  },
  sm: {
    marginLeft: spacing[3],
    marginRight: spacing[3],
  },
  base: {
    marginLeft: spacing[4],
    marginRight: spacing[4],
  },
  md: {
    marginLeft: spacing[6],
    marginRight: spacing[6],
  },
  lg: {
    marginLeft: spacing[8],
    marginRight: spacing[8],
  },
  xl: {
    marginLeft: spacing[12],
    marginRight: spacing[12],
  },
  /** Auto horizontal centering */
  auto: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
} as const

/**
 * Vertical margin only
 */
export const marginY = {
  none: {
    marginTop: spacing[0],
    marginBottom: spacing[0],
  },
  tight: {
    marginTop: spacing[2],
    marginBottom: spacing[2],
  },
  sm: {
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  base: {
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  md: {
    marginTop: spacing[6],
    marginBottom: spacing[6],
  },
  lg: {
    marginTop: spacing[8],
    marginBottom: spacing[8],
  },
  xl: {
    marginTop: spacing[12],
    marginBottom: spacing[12],
  },
} as const

// ============================================================================
// Gap Utilities (Flexbox/Grid)
// ============================================================================

/**
 * Gap values for flex/grid layouts
 */
export const gap = {
  /** No gap */
  none: {
    gap: spacing[0],
  },

  /** Tight gap - 8px (compact lists) */
  tight: {
    gap: spacing[2],
  },

  /** Small gap - 12px (related items) */
  sm: {
    gap: spacing[3],
  },

  /** Base gap - 16px (default spacing) */
  base: {
    gap: spacing[4],
  },

  /** Medium gap - 24px (card grids) */
  md: {
    gap: spacing[6],
  },

  /** Large gap - 32px (section grids) */
  lg: {
    gap: spacing[8],
  },

  /** XL gap - 48px (major grids) */
  xl: {
    gap: spacing[12],
  },
} as const

/**
 * Horizontal gap only (column-gap)
 */
export const gapX = {
  none: { columnGap: spacing[0] },
  tight: { columnGap: spacing[2] },
  sm: { columnGap: spacing[3] },
  base: { columnGap: spacing[4] },
  md: { columnGap: spacing[6] },
  lg: { columnGap: spacing[8] },
  xl: { columnGap: spacing[12] },
} as const

/**
 * Vertical gap only (row-gap)
 */
export const gapY = {
  none: { rowGap: spacing[0] },
  tight: { rowGap: spacing[2] },
  sm: { rowGap: spacing[3] },
  base: { rowGap: spacing[4] },
  md: { rowGap: spacing[6] },
  lg: { rowGap: spacing[8] },
  xl: { rowGap: spacing[12] },
} as const

// ============================================================================
// Container Widths
// ============================================================================

/**
 * Max-width constraints for content containers
 * Following Apple's content width principles
 */
export const containerWidth = {
  /** 640px - Narrow content (forms, articles) */
  sm: '40rem',

  /** 768px - Medium content (dashboards) */
  md: '48rem',

  /** 1024px - Large content (data tables) */
  lg: '64rem',

  /** 1280px - XL content (full dashboards) */
  xl: '80rem',

  /** 1536px - 2XL content (ultra-wide displays) */
  '2xl': '96rem',

  /** 100% - Full width */
  full: '100%',
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate custom spacing value (multiple of 4px)
 * @param multiplier - Multiplier of base spacing unit (4px)
 * @returns Spacing value in rem
 */
export function customSpacing(multiplier: number): string {
  return `${(multiplier * SPACING_UNIT) / 16}rem`
}

/**
 * Generate responsive padding/margin
 * @param mobile - Mobile spacing key
 * @param desktop - Desktop spacing key
 * @returns CSS object with responsive values
 */
export function responsiveSpacing(
  property: 'padding' | 'margin',
  mobile: keyof typeof spacing,
  desktop: keyof typeof spacing
) {
  return {
    [property]: spacing[mobile],
    [`@media (min-width: 768px)`]: {
      [property]: spacing[desktop],
    },
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type SpacingKey = keyof typeof spacing
export type SpacingPreset = keyof typeof padding
export type ContainerWidth = keyof typeof containerWidth

/**
 * Design System - Typography
 * Apple-inspired typographic scale with Figtree (headings) and Inter (body)
 * Following 2025-2026 best practices for readability and accessibility
 */

// ============================================================================
// Font Families
// ============================================================================

/**
 * Font family tokens
 * Imported via globals.css from Google Fonts
 */
export const fontFamilies = {
  /** Figtree - Geometric sans-serif for headings (Apple SF Pro alternative) */
  heading: '"Figtree", system-ui, -apple-system, sans-serif',

  /** Inter - Humanist sans-serif for body text (optimal readability) */
  body: '"Inter", system-ui, -apple-system, sans-serif',

  /** System UI fallback for maximum performance */
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

  /** Monospace for code snippets */
  mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
} as const

// ============================================================================
// Font Sizes (rem-based, 16px base)
// ============================================================================

/**
 * Typographic scale following 1.25 ratio (major third)
 * Optimized for readability on modern displays
 */
export const fontSizes = {
  /** 12px - Captions, labels, metadata */
  xs: '0.75rem',

  /** 14px - Small body text, secondary info */
  sm: '0.875rem',

  /** 16px - Default body text (base size) */
  base: '1rem',

  /** 18px - Large body text, intro paragraphs */
  lg: '1.125rem',

  /** 20px - Small headings (h6, h5) */
  xl: '1.25rem',

  /** 24px - Medium headings (h4) */
  '2xl': '1.5rem',

  /** 30px - Large headings (h3) */
  '3xl': '1.875rem',

  /** 36px - XL headings (h2) */
  '4xl': '2.25rem',

  /** 48px - Hero headings (h1) */
  '5xl': '3rem',

  /** 60px - Display headings (marketing pages) */
  '6xl': '3.75rem',
} as const

// ============================================================================
// Font Weights
// ============================================================================

/**
 * Font weight tokens
 * Both Figtree and Inter support these weights
 */
export const fontWeights = {
  /** 400 - Regular body text */
  normal: 400,

  /** 500 - Medium emphasis, buttons */
  medium: 500,

  /** 600 - Semibold headings, strong emphasis */
  semibold: 600,

  /** 700 - Bold headings, high emphasis */
  bold: 700,
} as const

// ============================================================================
// Line Heights
// ============================================================================

/**
 * Line height scale optimized for readability
 * Tighter for headings, looser for body text
 */
export const lineHeights = {
  /** 1.0 - Extremely tight (use sparingly) */
  none: 1.0,

  /** 1.25 - Tight, for large headings */
  tight: 1.25,

  /** 1.375 - Snug, for medium headings */
  snug: 1.375,

  /** 1.5 - Normal, for body text (optimal readability) */
  normal: 1.5,

  /** 1.625 - Relaxed, for long-form content */
  relaxed: 1.625,

  /** 1.75 - Loose, for accessibility */
  loose: 1.75,
} as const

// ============================================================================
// Letter Spacing
// ============================================================================

/**
 * Letter spacing (tracking) for typographic refinement
 * Negative values for headings, positive for uppercase
 */
export const letterSpacing = {
  /** -0.05em - Tighter, for large display text */
  tighter: '-0.05em',

  /** -0.025em - Tight, for headings */
  tight: '-0.025em',

  /** 0 - Normal (no tracking) */
  normal: '0',

  /** 0.025em - Wide, for small text */
  wide: '0.025em',

  /** 0.05em - Wider, for uppercase labels */
  wider: '0.05em',

  /** 0.1em - Widest, for small uppercase */
  widest: '0.1em',
} as const

// ============================================================================
// Preset Text Styles
// ============================================================================

/**
 * Display heading (hero sections)
 * 60px, bold, tight line height
 */
export const textDisplay = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes['6xl'],
  fontWeight: fontWeights.bold,
  lineHeight: lineHeights.tight,
  letterSpacing: letterSpacing.tighter,
} as const

/**
 * H1 heading
 * 48px, bold, tight line height
 */
export const textH1 = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes['5xl'],
  fontWeight: fontWeights.bold,
  lineHeight: lineHeights.tight,
  letterSpacing: letterSpacing.tight,
} as const

/**
 * H2 heading
 * 36px, semibold, snug line height
 */
export const textH2 = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes['4xl'],
  fontWeight: fontWeights.semibold,
  lineHeight: lineHeights.snug,
  letterSpacing: letterSpacing.tight,
} as const

/**
 * H3 heading
 * 30px, semibold, snug line height
 */
export const textH3 = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes['3xl'],
  fontWeight: fontWeights.semibold,
  lineHeight: lineHeights.snug,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * H4 heading
 * 24px, semibold, normal line height
 */
export const textH4 = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes['2xl'],
  fontWeight: fontWeights.semibold,
  lineHeight: lineHeights.normal,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * H5 heading
 * 20px, medium, normal line height
 */
export const textH5 = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes.xl,
  fontWeight: fontWeights.medium,
  lineHeight: lineHeights.normal,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * H6 heading
 * 18px, medium, normal line height
 */
export const textH6 = {
  fontFamily: fontFamilies.heading,
  fontSize: fontSizes.lg,
  fontWeight: fontWeights.medium,
  lineHeight: lineHeights.normal,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * Lead paragraph (intro text)
 * 18px, normal weight, relaxed line height
 */
export const textLead = {
  fontFamily: fontFamilies.body,
  fontSize: fontSizes.lg,
  fontWeight: fontWeights.normal,
  lineHeight: lineHeights.relaxed,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * Body text (default)
 * 16px, normal weight, normal line height
 */
export const textBody = {
  fontFamily: fontFamilies.body,
  fontSize: fontSizes.base,
  fontWeight: fontWeights.normal,
  lineHeight: lineHeights.normal,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * Small body text
 * 14px, normal weight, normal line height
 */
export const textBodySmall = {
  fontFamily: fontFamilies.body,
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.normal,
  lineHeight: lineHeights.normal,
  letterSpacing: letterSpacing.normal,
} as const

/**
 * Caption text (metadata, labels)
 * 12px, medium weight, normal line height
 */
export const textCaption = {
  fontFamily: fontFamilies.body,
  fontSize: fontSizes.xs,
  fontWeight: fontWeights.medium,
  lineHeight: lineHeights.normal,
  letterSpacing: letterSpacing.wide,
} as const

/**
 * Button text
 * 14px, medium weight, tight line height
 */
export const textButton = {
  fontFamily: fontFamilies.body,
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.medium,
  lineHeight: lineHeights.tight,
  letterSpacing: letterSpacing.wide,
} as const

/**
 * Overline text (labels, categories)
 * 12px, semibold, uppercase, widest tracking
 */
export const textOverline = {
  fontFamily: fontFamilies.body,
  fontSize: fontSizes.xs,
  fontWeight: fontWeights.semibold,
  lineHeight: lineHeights.tight,
  letterSpacing: letterSpacing.widest,
  textTransform: 'uppercase' as const,
} as const

/**
 * Code/monospace text
 * 14px, normal weight, mono font
 */
export const textCode = {
  fontFamily: fontFamilies.mono,
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.normal,
  lineHeight: lineHeights.relaxed,
  letterSpacing: letterSpacing.normal,
} as const

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Truncate text with ellipsis
 * Apply to any text element
 */
export const textTruncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
} as const

/**
 * Clamp text to N lines
 * Uses -webkit-line-clamp (widely supported 2025+)
 */
export function textClamp(lines: number) {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  } as const
}

/**
 * Balance text wrapping for headings
 * Prevents orphaned words (CSS Text Level 4)
 */
export const textBalance = {
  textWrap: 'balance' as const,
} as const

/**
 * Pretty text wrapping for body content
 * Better word breaks (CSS Text Level 4)
 */
export const textPretty = {
  textWrap: 'pretty' as const,
} as const

// ============================================================================
// Type Exports
// ============================================================================

export type FontFamily = keyof typeof fontFamilies
export type FontSize = keyof typeof fontSizes
export type FontWeight = keyof typeof fontWeights
export type LineHeight = keyof typeof lineHeights
export type LetterSpacing = keyof typeof letterSpacing

/**
 * Text style object type
 */
export type TextStyle = {
  fontFamily: string
  fontSize: string
  fontWeight: number
  lineHeight: number
  letterSpacing: string
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
}

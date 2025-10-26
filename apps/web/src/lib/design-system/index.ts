/**
 * Design System - Barrel Export
 * Apple "Think Different" aesthetic for Americano learning platform
 *
 * Usage:
 * import { springSubtle, buttonPrimaryVariants, textH1, spacing, colors } from '@/lib/design-system'
 */

// ============================================================================
// Animations (motion.dev)
// ============================================================================
export {
  // Spring Physics Presets
  springSubtle,
  springSmooth,
  springResponsive,
  springGentle,
  springBouncy,

  // Button Variants
  buttonPrimaryVariants,
  buttonSecondaryVariants,
  buttonIconVariants,

  // Card Variants
  cardVariants,
  cardCompactVariants,

  // Page Transitions
  pageSlideInVariants,
  pageFadeVariants,
  pageScaleVariants,

  // List Stagger
  listContainerVariants,
  listItemVariants,
  gridContainerVariants,
  gridItemVariants,

  // Loading States
  skeletonVariants,
  spinnerVariants,
  pulseVariants,

  // Celebration Animations
  xpIncrementVariants,
  achievementUnlockVariants,
  confettiVariants,
  progressFillVariants,

  // Modal/Dialog
  modalOverlayVariants,
  modalContentVariants,
  drawerVariants,
  popoverVariants,

  // Utility Functions
  createSpring,
  createStagger,
  getMotionPreference,
  generateConfettiConfig,

  // Types
  type AnimationVariants,
  type SpringPreset,
} from './animations'

// ============================================================================
// Colors (OKLCH)
// ============================================================================
export {
  colors,
  getColor,
  getCSSVar,
  type ColorMode,
  type ColorToken,
} from './colors'

// ============================================================================
// Typography
// ============================================================================
export {
  // Font Families
  fontFamilies,

  // Scales
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,

  // Preset Styles
  textDisplay,
  textH1,
  textH2,
  textH3,
  textH4,
  textH5,
  textH6,
  textLead,
  textBody,
  textBodySmall,
  textCaption,
  textButton,
  textOverline,
  textCode,

  // Utilities
  textTruncate,
  textClamp,
  textBalance,
  textPretty,

  // Types
  type FontFamily,
  type FontSize,
  type FontWeight,
  type LineHeight,
  type LetterSpacing,
  type TextStyle,
} from './typography'

// ============================================================================
// Spacing
// ============================================================================
export {
  // Constants
  SPACING_UNIT,
  spacingPx,
  spacing,

  // Padding
  padding,
  paddingX,
  paddingY,

  // Margin
  margin,
  marginX,
  marginY,

  // Gap (Flex/Grid)
  gap,
  gapX,
  gapY,

  // Container Widths
  containerWidth,

  // Utility Functions
  customSpacing,
  responsiveSpacing,

  // Types
  type SpacingKey,
  type SpacingPreset,
  type ContainerWidth,
} from './spacing'

// ============================================================================
// Design Tokens Summary
// ============================================================================

/**
 * Quick reference object with all design tokens
 * Useful for debugging or generating style guides
 */
export const designTokens = {
  colors: {
    light: 'OKLCH color space with perceptual uniformity',
    dark: 'Dark mode optimized for OLED displays',
  },
  typography: {
    heading: 'Figtree - Geometric sans-serif',
    body: 'Inter - Humanist sans-serif',
    scale: '1.25 ratio (major third)',
  },
  spacing: {
    system: '4px grid',
    scale: '0-128px in multiples of 4px',
  },
  animation: {
    library: 'motion.dev v12.23.24',
    style: 'Apple-inspired subtle springs',
    physics: 'stiffness 200, damping 25 (default)',
  },
  accessibility: {
    motion: 'Respects prefers-reduced-motion',
    contrast: 'WCAG 2.2 AA target',
    focus: 'Visible focus indicators',
  },
} as const

/**
 * Design system version
 * Increment on breaking changes to tokens
 */
export const DESIGN_SYSTEM_VERSION = '1.0.1'

/**
 * Design philosophy summary
 */
export const DESIGN_PHILOSOPHY = {
  aesthetic: 'Apple "Think Different" minimalism',
  principles: [
    'Subtle over flashy',
    'Breathable whitespace',
    'Physics-based motion',
    'Perceptually uniform colors (OKLCH)',
    'Accessibility first',
  ],
  antiPatterns: [
    'NO glassmorphism (outdated 2024)',
    'NO heavy gradients',
    'NO aggressive animations',
    'NO cluttered layouts',
  ],
} as const

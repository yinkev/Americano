/**
 * Design System - Animations
 * Apple "Think Different" aesthetic with subtle, sophisticated micro-interactions
 * Using motion.dev (v12.23.24) for physics-based spring animations
 */

import type { Spring, Transition, Variant } from 'motion/react'

// ============================================================================
// Spring Physics Presets
// ============================================================================

/**
 * Subtle spring animation - default for most UI interactions
 * Apple-style: responsive but not bouncy
 */
export const springSubtle: Spring = {
  stiffness: 200,
  damping: 25,
  mass: 1,
}

/**
 * Smooth spring animation - for larger elements (cards, modals)
 */
export const springSmooth: Spring = {
  stiffness: 180,
  damping: 28,
  mass: 1.2,
}

/**
 * Responsive spring - for immediate feedback (buttons, toggles)
 */
export const springResponsive: Spring = {
  stiffness: 240,
  damping: 22,
  mass: 0.8,
}

/**
 * Gentle spring - for delicate animations (tooltips, popovers)
 */
export const springGentle: Spring = {
  stiffness: 160,
  damping: 30,
  mass: 1.4,
}

/**
 * Bouncy spring - for celebratory animations ONLY (achievements, unlocks)
 */
export const springBouncy: Spring = {
  stiffness: 220,
  damping: 15,
  mass: 1,
}

// ============================================================================
// Button Variants
// ============================================================================

/**
 * Primary button hover/tap animations
 * Subtle scale + slight lift effect
 */
export const buttonPrimaryVariants = {
  initial: {
    scale: 1,
    y: 0,
    // no shadows in 2025 flat UI
  },
  hover: {
    scale: 1.02,
    y: -1,
    transition: springResponsive,
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: springResponsive,
  },
} as const

/**
 * Secondary/ghost button variants
 * More subtle than primary buttons
 */
export const buttonSecondaryVariants = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  hover: {
    scale: 1.01,
    opacity: 0.9,
    transition: springSubtle,
  },
  tap: {
    scale: 0.99,
    opacity: 0.8,
    transition: springResponsive,
  },
} as const

/**
 * Icon button variants
 * Rotation + scale for playful feedback
 */
export const buttonIconVariants = {
  initial: {
    scale: 1,
    rotate: 0,
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: springResponsive,
  },
  tap: {
    scale: 0.95,
    rotate: -5,
    transition: springResponsive,
  },
} as const

// ============================================================================
// Card Variants
// ============================================================================

/**
 * Interactive card animations
 * Lift effect with subtle shadow-none
 */
export const cardVariants = {
  initial: {
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.01,
    transition: springSmooth,
  },
  tap: {
    y: -2,
    scale: 0.99,
    transition: springResponsive,
  },
} as const

/**
 * Compact card variants (e.g., mission cards)
 * Less dramatic lift
 */
export const cardCompactVariants = {
  initial: {
    y: 0,
  },
  hover: {
    y: -2,
    transition: springSubtle,
  },
} as const

// ============================================================================
// Page Transitions
// ============================================================================

/**
 * Page slide + fade in from right
 * For forward navigation
 */
export const pageSlideInVariants = {
  initial: {
    opacity: 0,
    x: 20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: springSmooth,
  },
} as const

/**
 * Fade in/out for non-directional transitions
 */
export const pageFadeVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
} as const

/**
 * Scale + fade for modals/dialogs
 */
export const pageScaleVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: springSubtle,
  },
} as const

// ============================================================================
// List Stagger Animations
// ============================================================================

/**
 * Container for staggered children animations
 */
export const listContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
} as const

/**
 * Individual list item fade + slide up
 */
export const listItemVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springSubtle,
  },
} as const

/**
 * Fast stagger for grids (e.g., flashcards, mission tiles)
 */
export const gridContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
} as const

/**
 * Grid item fade + scale
 */
export const gridItemVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springSubtle,
  },
} as const

// ============================================================================
// Loading States
// ============================================================================

/**
 * Skeleton shimmer effect
 */
export const skeletonVariants = {
  initial: {
    opacity: 0.5,
  },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
} as const

/**
 * Spinner rotation
 */
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
} as const

/**
 * Pulse animation for loading indicators
 */
export const pulseVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
} as const

// ============================================================================
// Celebration Animations
// ============================================================================

/**
 * XP increment counter animation
 * Number pops up and fades
 */
export const xpIncrementVariants = {
  initial: {
    opacity: 0,
    y: 0,
    scale: 0.8,
  },
  animate: {
    opacity: [0, 1, 1, 0],
    y: [0, -20, -30, -40],
    scale: [0.8, 1.2, 1, 0.8],
    transition: {
      duration: 1.5,
      ease: 'easeOut',
    },
  },
} as const

/**
 * Achievement unlock animation
 * Badge scales in with bounce
 */
export const achievementUnlockVariants = {
  initial: {
    opacity: 0,
    scale: 0,
    rotate: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: springBouncy,
  },
} as const

/**
 * Confetti particle animation
 * Random motion with gravity
 */
export const confettiVariants = {
  initial: {
    opacity: 0,
    y: -20,
    x: 0,
    rotate: 0,
  },
  animate: (custom: { x: number; rotate: number; delay: number }) => ({
    opacity: [0, 1, 1, 0],
    y: [0, 100, 200],
    x: [0, custom.x, custom.x * 1.5],
    rotate: [0, custom.rotate, custom.rotate * 2],
    transition: {
      duration: 2,
      delay: custom.delay,
      ease: 'easeIn',
    },
  }),
} as const

/**
 * Progress bar fill animation
 * Smooth fill with spring
 */
export const progressFillVariants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: springSmooth,
  }),
} as const

// ============================================================================
// Modal/Dialog Animations
// ============================================================================

/**
 * Modal overlay fade
 */
export const modalOverlayVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
} as const

/**
 * Modal content slide up + fade
 */
export const modalContentVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.96,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    transition: springSubtle,
  },
} as const

/**
 * Drawer slide in from bottom
 */
export const drawerVariants = {
  initial: {
    y: '100%',
  },
  animate: {
    y: 0,
    transition: springSmooth,
  },
  exit: {
    y: '100%',
    transition: springSubtle,
  },
} as const

/**
 * Popover scale from origin
 */
export const popoverVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    originY: 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create custom spring preset
 */
export function createSpring(
  stiffness: number,
  damping: number,
  mass: number = 1
): Spring {
  return {
    stiffness,
    damping,
    mass,
  }
}

/**
 * Create stagger transition for lists
 */
export function createStagger(
  staggerChildren: number = 0.05,
  delayChildren: number = 0
): Transition {
  return {
    staggerChildren,
    delayChildren,
  }
}

/**
 * Respect user's prefers-reduced-motion preference
 * Returns instant transitions if motion is reduced
 */
export function getMotionPreference(transition: Transition): Transition {
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      return { duration: 0.01 }
    }
  }

  return transition
}

/**
 * Generate confetti particle config
 * Returns random x-offset, rotation, and delay for natural motion
 */
export function generateConfettiConfig(index: number) {
  const spread = 100
  const x = (Math.random() - 0.5) * spread
  const rotate = (Math.random() - 0.5) * 720 // -360 to +360
  const delay = Math.random() * 0.3

  return { x, rotate, delay }
}

// ============================================================================
// Type Exports
// ============================================================================

export type AnimationVariants = Record<string, Variant>
export type SpringPreset =
  | typeof springSubtle
  | typeof springSmooth
  | typeof springResponsive
  | typeof springGentle
  | typeof springBouncy

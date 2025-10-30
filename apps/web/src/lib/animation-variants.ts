/**
 * Reusable Motion.dev Animation Variants Library
 * "Linear Light × Maximum Flair" Design System
 *
 * Design System Constraints:
 * - OKLCH colors only (no hex, RGB, or gradients)
 * - Timing: 150ms for hovers, 300ms for transitions, 800ms for satisfying animations
 * - Easing: ease-out for entry, spring for playful interactions
 * - Respects prefers-reduced-motion
 * - 8px grid alignment maintained during animations
 * - 60fps target (hardware-accelerated transforms only)
 *
 * Animation Philosophy:
 * - 80% Playful, 20% Professional
 * - Fast and purposeful
 * - Tactile spring feedback
 * - Satisfying completion animations
 */

// ========================================
// BUTTON MICRO-INTERACTIONS
// ========================================

export const buttonVariants = {
  // Hover state: Subtle scale + elevation (FAST: 150ms)
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
    transition: { duration: 0.15, ease: [0, 0, 0.2, 1] as const },
  },

  // Press state: Scale down + shadow inset (spring effect)
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 2px oklch(0 0 0 / 0.05)',
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
  },

  // Loading state: Subtle pulse
  loading: {
    opacity: 0.8,
    transition: {
      duration: 0.6,
      repeat: Number.POSITIVE_INFINITY,
      repeatType: 'reverse' as const,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },

  // Success state: Playful bounce animation
  success: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] as const, // Satisfying bounce
    },
  },
}

// ========================================
// CARD HOVER EFFECTS
// ========================================

export const cardVariants = {
  // Interactive card (clickable) - FAST lift with subtle scale
  interactive: {
    rest: {
      y: 0,
      scale: 1,
      boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)',
    },
    hover: {
      y: -2,
      scale: 1.005,
      boxShadow: '0 8px 16px oklch(0 0 0 / 0.12)',
      transition: { duration: 0.15, ease: [0, 0, 0.2, 1] as const },
    },
  },

  // Static card (info only) - subtle shadow only
  static: {
    rest: {
      boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)',
    },
    hover: {
      boxShadow: '0 4px 12px oklch(0 0 0 / 0.12)',
      transition: { duration: 0.15, ease: [0, 0, 0.2, 1] as const },
    },
  },

  // Glow effect (OKLCH-based, no gradients) - playful accent
  glow: {
    rest: {
      boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)',
    },
    hover: {
      boxShadow: '0 0 20px oklch(0.7 0.15 230 / 0.2), 0 8px 16px oklch(0 0 0 / 0.15)',
      transition: { duration: 0.15, ease: [0, 0, 0.2, 1] as const },
    },
  },
}

// ========================================
// CHART ANIMATIONS
// ========================================

export const chartVariants = {
  // Container animation
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  },

  // Individual data point/item
  item: {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1] as const,
      },
    },
  },

  // Heatmap cell stagger
  heatmapRow: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02,
        delayChildren: 0.05,
      },
    },
  },

  heatmapCell: {
    hidden: { opacity: 0, scale: 0.8 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0, 0, 0.2, 1] as const,
      },
    },
  },

  // Timeline item slide
  timelineItem: {
    hidden: {
      opacity: 0,
      x: -30,
    },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        ease: [0, 0, 0.2, 1] as const,
      },
    },
  },
}

// ========================================
// PAGE TRANSITIONS
// ========================================

export const pageVariants = {
  // Fade + slide transition
  initial: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
}

// ========================================
// SKELETON LOADING
// ========================================

export const skeletonVariants = {
  pulse: {
    opacity: [0.5, 0.8, 0.5],
    transition: {
      duration: 1.5,
      repeat: Number.POSITIVE_INFINITY,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },

  // Fade out when data arrives
  fadeOut: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

// ========================================
// LIST ANIMATIONS
// ========================================

export const listVariants = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  item: {
    hidden: { opacity: 0, x: -20 },
    show: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.25,
        ease: [0, 0, 0.2, 1] as const,
      },
    },
  },
}

// ========================================
// MODAL/DIALOG ANIMATIONS
// ========================================

export const modalVariants = {
  overlay: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
    },
  },

  content: {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0, 0, 0.2, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as const,
      },
    },
  },
}

// ========================================
// NOTIFICATION/TOAST ANIMATIONS
// ========================================

export const toastVariants = {
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1] as const,
    },
  },
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get animation config with reduced motion support
 */
export const getAnimationConfig = <T extends Record<string, any>>(
  variant: T,
  reducedVariant?: Partial<T>,
): T => {
  if (prefersReducedMotion()) {
    return reducedVariant
      ? { ...variant, ...reducedVariant }
      : ({ ...variant, transition: { duration: 0.01 } } as T)
  }
  return variant
}

/**
 * Stagger configuration for child animations
 */
export const staggerConfig = {
  fast: 0.05,
  medium: 0.1,
  slow: 0.15,
}

/**
 * Easing presets
 */
export const easings = {
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  playfulBounce: [0.34, 1.56, 0.64, 1] as const, // Satisfying bounce for 800ms animations
} as const

// ========================================
// PROGRESS & GAMIFICATION ANIMATIONS
// ========================================

/**
 * Progress bar fill animation
 * Satisfying 800ms easing for completion feeling
 */
export const progressVariants = {
  initial: {
    width: '0%',
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  }),
}

/**
 * Circular progress ring animation
 */
export const circularProgressVariants = {
  initial: {
    pathLength: 0,
  },
  animate: (progress: number) => ({
    pathLength: progress / 100,
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  }),
}

/**
 * Number counter animation for value changes
 */
export const numberCounterVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1] as const,
    },
  },
}

/**
 * Success checkmark animation
 */
export const checkmarkVariants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.5,
        ease: [0, 0, 0.2, 1] as const,
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
}

/**
 * Achievement celebration
 * Playful scale bounce
 */
export const celebrationVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
    },
  },
}

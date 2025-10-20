/**
 * Reusable Motion.dev Animation Variants Library
 *
 * Design System Constraints:
 * - OKLCH colors only (no hex, RGB, or gradients)
 * - Timing: 200-300ms for interactions, 300-500ms for transitions
 * - Easing: ease-out for entry, ease-in-out for transitions
 * - Respects prefers-reduced-motion
 * - 8px grid alignment maintained during animations
 * - 60fps target (hardware-accelerated transforms only)
 */

// ========================================
// BUTTON MICRO-INTERACTIONS
// ========================================

export const buttonVariants = {
  // Hover state: Subtle scale + elevation
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as const },
  },

  // Press state: Scale down + shadow inset
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 2px oklch(0 0 0 / 0.05)',
    transition: { duration: 0.1, ease: [0, 0, 0.2, 1] as const },
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

  // Success state: Bounce animation
  success: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.4,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}

// ========================================
// CARD HOVER EFFECTS
// ========================================

export const cardVariants = {
  // Interactive card (clickable)
  interactive: {
    rest: {
      y: 0,
      scale: 1,
      boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)',
    },
    hover: {
      y: -4,
      scale: 1.01,
      boxShadow: '0 12px 24px oklch(0 0 0 / 0.15)',
      transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const },
    },
  },

  // Static card (info only) - subtle shadow only
  static: {
    rest: {
      boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)',
    },
    hover: {
      boxShadow: '0 4px 12px oklch(0 0 0 / 0.12)',
      transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const },
    },
  },

  // Glow effect (OKLCH-based, no gradients)
  glow: {
    rest: {
      boxShadow: '0 1px 3px oklch(0 0 0 / 0.1)',
    },
    hover: {
      boxShadow: '0 0 20px oklch(0.7 0.15 230 / 0.2), 0 8px 16px oklch(0 0 0 / 0.15)',
      transition: { duration: 0.3, ease: [0, 0, 0.2, 1] as const },
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
  reducedVariant?: Partial<T>
): T => {
  if (prefersReducedMotion()) {
    return reducedVariant
      ? { ...variant, ...reducedVariant }
      : { ...variant, transition: { duration: 0.01 } } as T
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
} as const

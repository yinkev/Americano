/**
 * Animation Configuration & Utilities
 *
 * Centralized animation constants following Material Design 3 standards
 * and best practices for web dashboard interactions.
 *
 * @see /Users/kyin/Projects/Americano/docs/design/animation-patterns-guide.md
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Standard timing durations in seconds
 * Based on Material Design 3 specifications
 */
export const duration = {
  /** 150ms - Desktop interactions (hover, focus) */
  instant: 0.15,

  /** 200ms - Desktop standard, quick feedback */
  fast: 0.2,

  /** 300ms - Mobile standard, most transitions */
  normal: 0.3,

  /** 225ms - Elements entering screen */
  enter: 0.225,

  /** 195ms - Elements exiting screen */
  exit: 0.195,

  /** 375ms - Full-screen transitions, route changes */
  slow: 0.375,

  /** 1200ms - Chart reveals, data visualizations */
  reveal: 1.2,
} as const;

/**
 * Material Design 3 easing curves
 * Cubic-bezier values for natural motion
 */
export const easing = {
  /** Most common - accelerate then decelerate */
  standard: [0.4, 0.0, 0.2, 1] as const,

  /** Elements entering - decelerate to rest */
  decelerate: [0.0, 0.0, 0.2, 1] as const,

  /** Elements exiting - accelerate away */
  accelerate: [0.4, 0.0, 1, 1] as const,

  /** Temporary exits that may return */
  sharp: [0.4, 0.0, 0.6, 1] as const,
} as const;

/**
 * Spring physics presets for natural motion
 * Use instead of duration-based animations when appropriate
 */
export const spring = {
  /** Gentle, subtle motion (default) */
  gentle: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 10,
    mass: 1,
  },

  /** Snappy feedback (buttons, toggles) */
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },

  /** Bouncy success feedback */
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
    mass: 0.6,
  },

  /** Smooth glide (large panels, drawers) */
  smooth: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
    mass: 1.2,
  },

  /** Duration-based spring (exact timing needed) */
  timed: {
    type: 'spring' as const,
    duration: 0.3,
    bounce: 0.25,
  },
} as const;

/**
 * Common animation variants for consistent motion
 */
export const variants = {
  /** Simple fade in/out */
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  } satisfies Variants,

  /** Fade + scale (modals, popovers) */
  modal: {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
    },
  } satisfies Variants,

  /** Slide from bottom (sheets, toasts) */
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  } satisfies Variants,

  /** Slide from right (sidebars) */
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  } satisfies Variants,

  /** List item stagger animation */
  listItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: duration.enter,
        ease: easing.decelerate,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: duration.exit,
        ease: easing.accelerate,
      },
    },
  } satisfies Variants,

  /** Container for staggered children */
  listContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // 50ms between children
        delayChildren: 0.1,    // Wait 100ms before starting
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1,  // Reverse order
      },
    },
  } satisfies Variants,

  /** Card hover interaction */
  cardHover: {
    rest: {},
    hover: {
      y: -4,
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
      transition: spring.snappy,
    },
    tap: {
      scale: 0.99,
    },
  } satisfies Variants,
} as const;

/**
 * Common transition configurations
 */
export const transitions = {
  /** Standard fade transition */
  fade: {
    duration: duration.normal,
    ease: easing.standard,
  } satisfies Transition,

  /** Fast interaction feedback */
  fast: {
    duration: duration.fast,
    ease: easing.standard,
  } satisfies Transition,

  /** Modal/dialog entrance */
  modalEnter: {
    duration: duration.enter,
    ease: easing.decelerate,
  } satisfies Transition,

  /** Modal/dialog exit */
  modalExit: {
    duration: duration.exit,
    ease: easing.accelerate,
  } satisfies Transition,

  /** Page route transition */
  page: {
    duration: duration.normal,
    ease: easing.standard,
  } satisfies Transition,

  /** Chart reveal animation */
  chartReveal: {
    duration: duration.reveal,
    ease: easing.decelerate,
  } satisfies Transition,
} as const;

/**
 * Stagger timing configurations
 */
export const stagger = {
  /** Default stagger for lists (50ms) */
  default: 0.05,

  /** Fast stagger for small items (30ms) */
  fast: 0.03,

  /** Slow stagger for large items (100ms) */
  slow: 0.1,

  /** Exit stagger (faster than entrance) */
  exit: 0.03,
} as const;

/**
 * Export all animation utilities
 */
export const animations = {
  duration,
  easing,
  spring,
  variants,
  transitions,
  stagger,
} as const;

/**
 * Type exports for TypeScript support
 */
export type AnimationDuration = keyof typeof duration;
export type AnimationEasing = keyof typeof easing;
export type AnimationSpring = keyof typeof spring;
export type AnimationVariant = keyof typeof variants;
export type AnimationTransition = keyof typeof transitions;

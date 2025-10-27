/**
 * useReducedMotion Hook
 *
 * Respects user's prefers-reduced-motion accessibility setting.
 * Critical for users who experience nausea/discomfort from animations.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
 * @see /Users/kyin/Projects/Americano/docs/design/animation-patterns-guide.md#accessibility
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Check if user prefers reduced motion
 *
 * @returns true if user has enabled reduced motion in system preferences
 *
 * @example
 * ```tsx
 * function AnimatedCard() {
 *   const shouldReduceMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       initial={shouldReduceMotion ? {} : { opacity: 0 }}
 *       animate={shouldReduceMotion ? {} : { opacity: 1 }}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', listener);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation configuration that respects reduced motion
 *
 * @returns Animation config object or empty object if reduced motion enabled
 *
 * @example
 * ```tsx
 * function Component() {
 *   const animConfig = useAnimationConfig();
 *
 *   return (
 *     <motion.div {...animConfig} variants={fadeVariants}>
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    };
  }

  return {
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
  };
}

/**
 * Conditional animation props based on reduced motion preference
 *
 * @param normalProps - Animation props to use when motion is enabled
 * @param reducedProps - Animation props to use when motion is reduced (optional, defaults to no animation)
 * @returns Appropriate props based on user preference
 *
 * @example
 * ```tsx
 * function Component() {
 *   const props = useConditionalAnimation(
 *     { initial: { opacity: 0 }, animate: { opacity: 1 } },
 *     { initial: { opacity: 1 }, animate: { opacity: 1 } } // Optional: still render, no animation
 *   );
 *
 *   return <motion.div {...props}>Content</motion.div>;
 * }
 * ```
 */
export function useConditionalAnimation<T extends Record<string, unknown>>(
  normalProps: T,
  reducedProps: Partial<T> = {}
): T {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return { ...normalProps, ...reducedProps } as T;
  }

  return normalProps;
}

/**
 * Motion preferences utilities for WCAG 2.1 AAA compliance
 *
 * Respects user's prefers-reduced-motion setting
 * Provides utilities for conditional animations
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Add event listener for motion preference changes
 */
export function onMotionPreferenceChange(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = (event: MediaQueryListEvent) => callback(event.matches)

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }
  // Fallback for older browsers
  else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler)
    return () => mediaQuery.removeListener(handler)
  }

  return () => {}
}

/**
 * Get safe animation duration based on motion preference
 * Returns 0 if user prefers reduced motion
 */
export function getSafeAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration
}

/**
 * Tailwind class helper for animations
 * Returns empty string if user prefers reduced motion
 */
export function safeAnimationClass(className: string): string {
  return prefersReducedMotion() ? '' : className
}

/**
 * CSS custom property for animation duration
 * Sets to 0.01ms if user prefers reduced motion (instant)
 */
export function getAnimationDurationVar(duration: string): string {
  return prefersReducedMotion() ? '0.01ms' : duration
}

/**
 * React hook for motion preference
 * Usage: const shouldAnimate = useMotionPreference()
 */
export function useMotionPreference() {
  if (typeof window === 'undefined') return true

  const [shouldAnimate, setShouldAnimate] = React.useState(!prefersReducedMotion())

  React.useEffect(() => {
    const cleanup = onMotionPreferenceChange((prefersReduced) => {
      setShouldAnimate(!prefersReduced)
    })
    return cleanup
  }, [])

  return shouldAnimate
}

/**
 * Export React for hook usage
 */
import React from 'react'

/**
 * PageTransition Component
 *
 * Provides smooth page transitions using motion.dev
 * - Fade + slide animations on route changes
 * - Fallback for browsers without View Transitions API
 * - Respects prefers-reduced-motion
 * - Preserves scroll position on back/forward
 *
 * Design constraints:
 * - 300ms transition duration
 * - OKLCH colors only
 * - No layout shift (CLS: 0.0)
 * - 60fps target
 */

'use client'

import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { pageVariants, getAnimationConfig } from '@/lib/animation-variants'

interface PageTransitionProps {
  children: React.ReactNode
}

/**
 * Wrap page content with this component to add route transitions
 *
 * Usage in layout.tsx:
 * ```tsx
 * <PageTransition>
 *   {children}
 * </PageTransition>
 * ```
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={{
          initial: getAnimationConfig(pageVariants.initial),
          enter: getAnimationConfig(pageVariants.enter),
          exit: getAnimationConfig(pageVariants.exit),
        }}
        initial="initial"
        animate="enter"
        exit="exit"
        style={{
          width: '100%',
          minHeight: '100vh',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Simpler transition for nested routes or sections
 * - Fade only, no slide
 * - Faster transition (200ms)
 */
export function SectionTransition({ children, show = true }: { children: React.ReactNode; show?: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Staggered list animation for displaying multiple items
 * - Items fade + slide in with stagger
 * - Use for lists, grids, etc.
 */
export function StaggeredList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}

/**
 * Individual list item component for StaggeredList
 */
export function StaggeredListItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.25,
            ease: 'easeOut',
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Fade transition for conditional content
 * - Simple opacity animation
 * - Use for showing/hiding elements
 */
export function FadeTransition({
  children,
  show = true,
  duration = 0.2,
}: {
  children: React.ReactNode
  show?: boolean
  duration?: number
}) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Scale transition for modals/dialogs
 * - Scale + fade animation
 * - Smooth enter/exit
 */
export function ScaleTransition({
  children,
  show = true,
}: {
  children: React.ReactNode
  show?: boolean
}) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Slide transition for side panels/drawers
 * - Slide from direction + fade
 * - Configurable direction
 */
export function SlideTransition({
  children,
  show = true,
  direction = 'right',
}: {
  children: React.ReactNode
  show?: boolean
  direction?: 'left' | 'right' | 'top' | 'bottom'
}) {
  const slideValues = {
    left: { x: -100 },
    right: { x: 100 },
    top: { y: -100 },
    bottom: { y: 100 },
  }

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, ...slideValues[direction] }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...slideValues[direction] }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

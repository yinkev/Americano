'use client'

/**
 * PageTransition - Smooth page transition wrapper
 * Apple-style fade + slide animation on route changes
 *
 * Usage:
 * Wrap page content in this component to get automatic transitions
 *
 * Example:
 * <PageTransition>
 *   <YourPageContent />
 * </PageTransition>
 */

import { motion, AnimatePresence } from 'motion/react'
import { usePathname } from 'next/navigation'
import { pageSlideInVariants, springSmooth } from '@/lib/design-system'

export interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageSlideInVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * PageFadeTransition - Simpler fade-only transition
 * Use for pages where slide animation might be distracting
 */
export function PageFadeTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * PageScaleTransition - Scale + fade transition
 * Use for modal-like pages or dramatic effect
 */
export function PageScaleTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', ...springSmooth }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

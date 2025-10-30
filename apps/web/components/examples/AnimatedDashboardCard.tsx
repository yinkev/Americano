/**
 * Animated Dashboard Card Example
 *
 * Demonstrates production-ready animation patterns with:
 * - Staggered entrance animation
 * - Hover interactions
 * - Reduced motion support
 * - TypeScript type safety
 *
 * @see /Users/kyin/Projects/Americano/docs/design/animation-patterns-guide.md
 */

'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { animations } from '@/lib/animations'
import { useReducedMotion } from '@/lib/animations/useReducedMotion'

export interface AnimatedCardProps {
  /** Card title */
  title: string

  /** Primary value to display */
  value: string | number

  /** Optional description text */
  description?: string

  /** Optional icon element */
  icon?: ReactNode

  /** Trend direction indicator */
  trend?: 'up' | 'down' | 'neutral'

  /** Trend percentage or delta value */
  trendValue?: string

  /** Click handler */
  onClick?: () => void

  /** Custom CSS class */
  className?: string

  /** Disable hover effects */
  disableHover?: boolean

  /** Show loading skeleton */
  isLoading?: boolean
}

/**
 * Animated Dashboard Card Component
 *
 * @example
 * ```tsx
 * <AnimatedCard
 *   title="Total Users"
 *   value="1,234"
 *   description="Active in last 30 days"
 *   trend="up"
 *   trendValue="+12%"
 *   icon={<UsersIcon />}
 *   onClick={() => router.push('/users')}
 * />
 * ```
 */
export function AnimatedCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  onClick,
  className = '',
  disableHover = false,
  isLoading = false,
}: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion()

  // Trend colors and icons
  const trendStyles = {
    up: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/20',
      icon: '↑',
    },
    down: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/20',
      icon: '↓',
    },
    neutral: {
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-900/20',
      icon: '→',
    },
  }

  const trendStyle = trend ? trendStyles[trend] : null

  // Loading skeleton animation
  if (isLoading) {
    return (
      <motion.div
        className={`dashboard-card ${className}`}
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg" />
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`dashboard-card group cursor-pointer ${className}`}
      // Entrance animation (respects reduced motion)
      variants={shouldReduceMotion ? {} : animations.variants.slideUp}
      initial={shouldReduceMotion ? {} : 'hidden'}
      animate={shouldReduceMotion ? {} : 'visible'}
      // Hover interaction
      whileHover={
        shouldReduceMotion || disableHover
          ? {}
          : {
              y: -4,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
              transition: animations.spring.snappy,
            }
      }
      // Tap feedback
      whileTap={shouldReduceMotion || disableHover ? {} : { scale: 0.99 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <motion.div
              className="icon-wrapper p-2 rounded-lg bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      rotate: [0, -5, 5, -5, 0],
                      transition: { duration: 0.5 },
                    }
              }
            >
              {icon}
            </motion.div>
          )}
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        </div>

        {/* Trend Indicator */}
        {trend && trendValue && trendStyle && (
          <motion.div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendStyle.bg} ${trendStyle.color}`}
            initial={shouldReduceMotion ? {} : { opacity: 0, x: -10 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: animations.duration.enter }}
          >
            <span>{trendStyle.icon}</span>
            <span>{trendValue}</span>
          </motion.div>
        )}
      </div>

      {/* Primary Value */}
      <motion.div
        className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
        initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.8 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: animations.duration.enter,
          ease: animations.easing.decelerate,
        }}
      >
        {value}
      </motion.div>

      {/* Description */}
      {description && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400"
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={shouldReduceMotion ? {} : { opacity: 1 }}
          transition={{ delay: 0.15, duration: animations.duration.enter }}
        >
          {description}
        </motion.p>
      )}

      {/* Hover Indicator (Bottom Border) */}
      {onClick && !disableHover && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-b-lg"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={animations.spring.snappy}
          style={{ originX: 0 }}
        />
      )}
    </motion.div>
  )
}

/**
 * Grid container with staggered card animations
 *
 * @example
 * ```tsx
 * <AnimatedCardGrid>
 *   {metrics.map(metric => (
 *     <AnimatedCard key={metric.id} {...metric} />
 *   ))}
 * </AnimatedCardGrid>
 * ```
 */
export function AnimatedCardGrid({ children }: { children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      variants={shouldReduceMotion ? {} : animations.variants.listContainer}
      initial={shouldReduceMotion ? {} : 'hidden'}
      animate={shouldReduceMotion ? {} : 'visible'}
    >
      {children}
    </motion.div>
  )
}

/**
 * Example CSS classes (Tailwind)
 *
 * Add to your global CSS or component styles:
 *
 * ```css
 * .dashboard-card {
 *   @apply relative p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-shadow;
 * }
 *
 * .dashboard-card:focus-visible {
 *   @apply outline-2 outline-offset-2 outline-primary-500;
 * }
 * ```
 */

'use client'

import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Trend direction types
 */
export type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * Props for the TrendIndicator component
 */
export interface TrendIndicatorProps extends Omit<HTMLMotionProps<'div'>, 'animate'> {
  /**
   * Trend direction (up, down, neutral)
   */
  direction?: TrendDirection
  /**
   * Percentage change value
   */
  value?: number
  /**
   * Whether upward trend is positive (default: true)
   * Set to false for metrics where down is good (e.g., error rates)
   */
  upIsGood?: boolean
  /**
   * Show percentage sign
   */
  showPercentage?: boolean
  /**
   * Show the value (alias for showPercentage)
   */
  showValue?: boolean
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Whether to animate the component on mount
   */
  /**
   * Whether to apply entrance animation
   */
  animated?: boolean
  /**
   * Label for screen readers
   */
  ariaLabel?: string
}

const sizeStyles = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
  },
}

/**
 * TrendIndicator - Display trend direction with color-coded indicators
 *
 * @example
 * ```tsx
 * <TrendIndicator direction="up" value={12.5} />
 * <TrendIndicator direction="down" value={-5.2} upIsGood={false} />
 * ```
 */
export const TrendIndicator = React.forwardRef<HTMLDivElement, TrendIndicatorProps>(
  (
    {
      direction = 'neutral',
      value,
      upIsGood = true,
      showPercentage = true,
      size = 'md',
      animated = true,
      ariaLabel,
      className,
      ...props
    },
    ref,
  ) => {
    const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

    const isPositive = direction === 'up' ? upIsGood : direction === 'down' ? !upIsGood : false

    const colorClass = isPositive
      ? 'text-green-600 dark:text-green-400'
      : direction === 'neutral'
        ? 'text-muted-foreground'
        : 'text-red-600 dark:text-red-400'

    const formattedValue = value !== undefined ? Math.abs(value).toFixed(1) : null

    const defaultAriaLabel =
      ariaLabel ||
      `Trend ${direction}${formattedValue ? ` by ${formattedValue}${showPercentage ? ' percent' : ''}` : ''}`

    const content = (
      <>
        <Icon className={cn(sizeStyles[size].icon, 'shrink-0')} aria-hidden="true" />
        {formattedValue !== null && (
          <span className={cn(sizeStyles[size].text, 'font-medium tabular-nums')}>
            {formattedValue}
            {showPercentage && '%'}
          </span>
        )}
      </>
    )

    const containerProps: Omit<HTMLMotionProps<'div'>, 'ref'> & { ref: typeof ref } = {
      ref,
      className: cn('inline-flex items-center gap-1', colorClass, className),
      role: 'status',
      'aria-label': defaultAriaLabel,
      ...props,
    }

    const motionAnimationProps: Partial<HTMLMotionProps<'div'>> = animated
      ? {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: {
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          },
        }
      : {}

    return (
      <motion.div {...containerProps} {...motionAnimationProps}>
        {content}
      </motion.div>
    )
  },
)

TrendIndicator.displayName = 'TrendIndicator'

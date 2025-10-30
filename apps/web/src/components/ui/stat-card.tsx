'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { type TrendDirection, TrendIndicator } from '@/components/ui/trend-indicator'
import { cn } from '@/lib/utils'

/**
 * Props for the StatCard component
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Main label for the statistic
   */
  label: string
  /**
   * Sublabel or description
   */
  sublabel?: string
  /**
   * The numeric value to display
   */
  value: number
  /**
   * Previous period value for comparison
   */
  previousValue?: number
  /**
   * Percentage change (if not using previousValue)
   */
  percentageChange?: number
  /**
   * Trend direction
   */
  trend?: TrendDirection
  /**
   * Format function for the value
   */
  formatValue?: (value: number) => string
  /**
   * Whether upward trend is positive
   */
  upIsGood?: boolean
  /**
   * Whether to animate the number count-up
   */
  animateValue?: boolean
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Color theme variant
   */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'
}

const variantStyles = {
  default: 'border-border',
  primary: 'border-primary/20 bg-primary/5',
  success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
  warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
  danger: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
}

const sizeStyles = {
  sm: {
    value: 'text-2xl',
    label: 'text-xs',
    sublabel: 'text-xs',
    padding: 'p-3',
  },
  md: {
    value: 'text-3xl',
    label: 'text-sm',
    sublabel: 'text-xs',
    padding: 'p-4',
  },
  lg: {
    value: 'text-4xl',
    label: 'text-base',
    sublabel: 'text-sm',
    padding: 'p-6',
  },
}

/**
 * AnimatedNumber - Internal component for count-up animation
 */
const AnimatedNumber: React.FC<{
  value: number
  formatValue?: (value: number) => string
}> = ({ value, formatValue = (v) => v.toLocaleString() }) => {
  const spring = useSpring(0, { damping: 20, stiffness: 100 })
  const display = useTransform(spring, (current) => formatValue(Math.round(current)))

  React.useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

/**
 * StatCard - Large number display with label and comparison
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Users"
 *   sublabel="Active in last 30 days"
 *   value={1234}
 *   previousValue={1100}
 *   trend="up"
 * />
 * ```
 */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      label,
      sublabel,
      value,
      previousValue,
      percentageChange: providedPercentageChange,
      trend,
      formatValue = (v) => v.toLocaleString(),
      upIsGood = true,
      animateValue = true,
      loading = false,
      variant = 'default',
      size = 'md',
      className,
      ...props
    },
    ref,
  ) => {
    // Calculate percentage change if previousValue provided
    const calculatedPercentageChange =
      previousValue !== undefined && previousValue !== 0
        ? ((value - previousValue) / previousValue) * 100
        : undefined

    const percentageChange = providedPercentageChange ?? calculatedPercentageChange

    // Determine trend if not provided
    const determinedTrend =
      trend ??
      (percentageChange !== undefined
        ? percentageChange > 0
          ? 'up'
          : percentageChange < 0
            ? 'down'
            : 'neutral'
        : undefined)

    if (loading) {
      return (
        <Card
          ref={ref}
          className={cn('overflow-hidden', variantStyles[variant], className)}
          {...props}
        >
          <CardContent className={cn(sizeStyles[size].padding, 'space-y-2')}>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-32 animate-pulse rounded bg-muted" />
            {sublabel && <div className="h-3 w-36 animate-pulse rounded bg-muted" />}
          </CardContent>
        </Card>
      )
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
        whileHover={{
          y: -4,
          transition: { duration: 0.2 },
        }}
      >
        <Card
          className={cn(
            'overflow-hidden transition-shadow hover:shadow-lg',
            variantStyles[variant],
            className,
          )}
          {...props}
        >
          <CardContent className={cn(sizeStyles[size].padding, 'space-y-2')}>
            <div className="flex items-start justify-between gap-2">
              <h3 className={cn('font-medium text-muted-foreground', sizeStyles[size].label)}>
                {label}
              </h3>
              {determinedTrend && percentageChange !== undefined && (
                <TrendIndicator
                  direction={determinedTrend}
                  value={percentageChange}
                  upIsGood={upIsGood}
                  size="sm"
                />
              )}
            </div>

            <div
              className={cn('font-bold tabular-nums tracking-tight', sizeStyles[size].value)}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {animateValue ? (
                <AnimatedNumber value={value} formatValue={formatValue} />
              ) : (
                formatValue(value)
              )}
            </div>

            {sublabel && (
              <p className={cn('text-muted-foreground', sizeStyles[size].sublabel)}>{sublabel}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  },
)

StatCard.displayName = 'StatCard'

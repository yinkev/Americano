'use client'

import { motion } from 'framer-motion'
import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type TrendDirection, TrendIndicator } from '@/components/ui/trend-indicator'
import { cn } from '@/lib/utils'

/**
 * Sparkline data point
 */
export interface SparklineDataPoint {
  value: number
  label?: string
}

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card title
   */
  title: string
  /**
   * Main metric value
   */
  value: string | number
  /**
   * Trend direction
   */
  // Accepts 'flat' as an alias for 'neutral' for convenience
  trend?: TrendDirection | 'flat'
  /**
   * Percentage change (alias: change)
   */
  percentageChange?: number
  /**
   * Alias for percentageChange
   */
  change?: number
  /**
   * Whether upward trend is positive
   */
  upIsGood?: boolean
  /**
   * Description or subtitle (alias: subtitle)
   */
  description?: string
  /**
   * Alias for description
   */
  subtitle?: string
  /**
   * Sparkline data (optional)
   */
  sparklineData?: SparklineDataPoint[]
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Empty state
   */
  empty?: boolean
  /**
   * Icon element
   */
  icon?: React.ReactNode
  /**
   * Color status indicator
   */
  status?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  /**
   * Action button or element
   */
  action?: React.ReactNode
  /**
   * Whether to show hover interactions
   */
  interactive?: boolean
}

const statusStyles = {
  default: 'border-l-transparent',
  success: 'border-l-green-500',
  warning: 'border-l-amber-500',
  danger: 'border-l-red-500',
  info: 'border-l-blue-500',
}

/**
 * Sparkline - Mini line chart component
 */
const Sparkline: React.FC<{
  data: SparklineDataPoint[]
  className?: string
}> = ({ data, className }) => {
  const svgRef = React.useRef<SVGSVGElement>(null)

  React.useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = svgRef.current
    const width = svg.clientWidth
    const height = svg.clientHeight
    const padding = 2

    const values = data.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    const points = data
      .map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2)
        const y = height - padding - ((d.value - min) / range) * (height - padding * 2)
        return `${x},${y}`
      })
      .join(' ')

    const polyline = svg.querySelector('polyline')
    if (polyline) {
      polyline.setAttribute('points', points)
    }
  }, [data])

  if (data.length === 0) return null

  return (
    <svg ref={svgRef} className={cn('h-8 w-full', className)} aria-hidden="true">
      <motion.polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  )
}

/**
 * MetricCard - Display metric with trend indicator and optional sparkline
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Revenue"
 *   value="$12,345"
 *   trend="up"
 *   percentageChange={12.5}
 *   description="Last 30 days"
 *   sparklineData={[{value: 100}, {value: 120}, {value: 115}, {value: 140}]}
 * />
 * ```
 */
export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      trend,
      percentageChange,
      change,
      upIsGood = true,
      description,
      subtitle,
      sparklineData,
      loading = false,
      empty = false,
      icon,
      status = 'default',
      action,
      interactive = true,
      className,
      ...props
    },
    ref,
  ) => {
    // Handle aliases
    const finalPercentageChange = percentageChange ?? change
    const finalDescription = description ?? subtitle
    if (loading) {
      return (
        <Card
          ref={ref}
          className={cn('overflow-hidden border-l-4', statusStyles[status], className)}
          {...props}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            {icon && <div className="h-4 w-4 animate-pulse rounded bg-muted" />}
          </CardHeader>
          <CardContent>
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            {finalDescription && <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />}
          </CardContent>
        </Card>
      )
    }

    if (empty) {
      return (
        <Card
          ref={ref}
          className={cn('overflow-hidden border-l-4', statusStyles[status], className)}
          {...props}
        >
          <CardHeader>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      )
    }

    const cardContent = (
      <Card
        ref={ref}
        className={cn(
          'overflow-hidden border-l-4 transition-shadow',
          statusStyles[status],
          interactive && 'hover:shadow-lg',
          className,
        )}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-muted-foreground" role="img" aria-label={`${title} icon`}>
                {icon}
              </div>
            )}
            {action}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tabular-nums" role="status" aria-live="polite">
              {value}
            </div>
            {trend && finalPercentageChange !== undefined && (
              <TrendIndicator
                direction={trend === 'flat' ? 'neutral' : trend}
                value={finalPercentageChange}
                upIsGood={upIsGood}
                size="sm"
              />
            )}
          </div>

          {finalDescription && <p className="mt-1 text-xs text-muted-foreground">{finalDescription}</p>}

          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 text-muted-foreground">
              <Sparkline data={sparklineData} />
            </div>
          )}
        </CardContent>
      </Card>
    )

    if (interactive) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          whileHover={{
            y: -4,
            transition: { duration: 0.2 },
          }}
        >
          {cardContent}
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {cardContent}
      </motion.div>
    )
  },
)

MetricCard.displayName = 'MetricCard'

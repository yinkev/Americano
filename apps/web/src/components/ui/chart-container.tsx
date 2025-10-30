'use client'

import { motion } from 'framer-motion'
import { Download, Maximize2 } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

/**
 * Props for the ChartContainer component
 */
export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Chart title
   */
  title?: string
  /**
   * Chart description or subtitle
   */
  description?: string
  /**
   * Chart content (typically a recharts component)
   */
  children: React.ReactNode
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Error state
   */
  error?: boolean
  /**
   * Error message
   */
  errorMessage?: string
  /**
   * Empty state (no data)
   */
  empty?: boolean
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Whether to show export button
   */
  exportable?: boolean
  /**
   * Export handler
   */
  onExport?: () => void
  /**
   * Whether to show fullscreen button
   */
  expandable?: boolean
  /**
   * Expand handler
   */
  onExpand?: () => void
  /**
   * Custom action buttons
   */
  actions?: React.ReactNode
  /**
   * Height of the chart container
   */
  height?: number | string
  /**
   * Whether to use responsive sizing
   */
  responsive?: boolean
  /**
   * Whether to animate on mount
   */
  animate?: boolean
  /**
   * Card variant
   */
  variant?: 'default' | 'elevated'
}

/**
 * ChartContainer - Wrapper component for charts with loading, error, and empty states
 *
 * @example
 * ```tsx
 * <ChartContainer
 *   title="Revenue Over Time"
 *   description="Monthly revenue for the past year"
 *   exportable
 *   onExport={handleExport}
 * >
 *   <ResponsiveContainer width="100%" height={300}>
 *     <LineChart data={data}>
 *       <Line dataKey="value" />
 *     </LineChart>
 *   </ResponsiveContainer>
 * </ChartContainer>
 * ```
 */
export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  (
    {
      title,
      description,
      children,
      loading = false,
      error = false,
      errorMessage,
      empty = false,
      emptyMessage,
      exportable = false,
      onExport,
      expandable = false,
      onExpand,
      actions,
      height = 300,
      responsive = true,
      animate = true,
      variant = 'default',
      className,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)

    // Render loading state
    if (loading) {
      return (
        <Card
          ref={ref}
          className={cn('overflow-hidden', variant === 'elevated' && 'shadow-md', className)}
          {...props}
        >
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <div
              className="flex items-center justify-center"
              style={{ height: typeof height === 'number' ? `${height}px` : height }}
            >
              <EmptyState variant="loading" compact />
            </div>
          </CardContent>
        </Card>
      )
    }

    // Render error state
    if (error) {
      return (
        <Card
          ref={ref}
          className={cn('overflow-hidden', variant === 'elevated' && 'shadow-md', className)}
          {...props}
        >
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <div
              className="flex items-center justify-center"
              style={{ height: typeof height === 'number' ? `${height}px` : height }}
            >
              <EmptyState
                variant="error"
                description={errorMessage}
                action={{
                  label: 'Retry',
                  onClick: () => window.location.reload(),
                }}
                compact
              />
            </div>
          </CardContent>
        </Card>
      )
    }

    // Render empty state
    if (empty) {
      return (
        <Card
          ref={ref}
          className={cn('overflow-hidden', variant === 'elevated' && 'shadow-md', className)}
          {...props}
        >
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          <CardContent>
            <div
              className="flex items-center justify-center"
              style={{ height: typeof height === 'number' ? `${height}px` : height }}
            >
              <EmptyState variant="no-data" description={emptyMessage} compact />
            </div>
          </CardContent>
        </Card>
      )
    }

    // Render chart content
    const cardContent = (
      <Card
        ref={ref}
        className={cn(
          'overflow-hidden transition-shadow',
          variant === 'elevated' && 'shadow-md hover:shadow-lg',
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {(title || description || exportable || expandable || actions) && (
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {actions}
                {expandable && onExpand && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExpand}
                    aria-label="Expand chart"
                    className={cn('h-8 w-8 p-0 transition-opacity', !isHovered && 'opacity-0')}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                )}
                {exportable && onExport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onExport}
                    aria-label="Export chart"
                    className={cn('h-8 w-8 p-0 transition-opacity', !isHovered && 'opacity-0')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        )}

        <CardContent>
          <div
            className={cn('w-full', !responsive && 'overflow-x-auto')}
            style={
              responsive
                ? { height: typeof height === 'number' ? `${height}px` : height }
                : undefined
            }
            role="img"
            aria-label={title ? `${title} chart` : 'Chart'}
          >
            {children}
          </div>
        </CardContent>
      </Card>
    )

    if (!animate) {
      return cardContent
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {cardContent}
      </motion.div>
    )
  },
)

ChartContainer.displayName = 'ChartContainer'

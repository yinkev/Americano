'use client'

import { motion } from 'framer-motion'
import * as React from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

/**
 * Grid layout types
 */
export type GridLayout = 'grid' | 'masonry'

/**
 * Props for the MetricGrid component
 */
export interface MetricGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Grid layout type
   */
  layout?: GridLayout
  /**
   * Number of columns (responsive by default)
   */
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Gap between grid items
   */
  gap?: 'sm' | 'md' | 'lg'
  /**
   * Grid items (MetricCards or other components)
   */
  children: React.ReactNode
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Number of skeleton items to show during loading
   */
  skeletonCount?: number
  /**
   * Empty state configuration
   */
  emptyState?: {
    title?: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  /**
   * Whether to stagger animations
   */
  stagger?: boolean
  /**
   * Stagger delay between items (in seconds)
   */
  staggerDelay?: number
}

const gapStyles = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const columnStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
}

/**
 * SkeletonCard - Loading skeleton for metric cards
 */
const SkeletonCard: React.FC<{ index: number; stagger?: boolean; staggerDelay?: number }> = ({
  index,
  stagger,
  staggerDelay = 0.1,
}) => {
  const content = (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )

  if (stagger) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * staggerDelay,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {content}
      </motion.div>
    )
  }

  return content
}

/**
 * MetricGrid - Responsive grid layout for metric cards with auto-layout
 *
 * @example
 * ```tsx
 * <MetricGrid columns={3} gap="md" stagger>
 *   <MetricCard title="Users" value={1234} />
 *   <MetricCard title="Revenue" value="$12.5k" />
 *   <MetricCard title="Conversion" value="3.2%" />
 * </MetricGrid>
 * ```
 */
export const MetricGrid = React.forwardRef<HTMLDivElement, MetricGridProps>(
  (
    {
      layout = 'grid',
      columns = 3,
      gap = 'md',
      children,
      loading = false,
      skeletonCount = 6,
      emptyState,
      stagger = true,
      staggerDelay = 0.1,
      className,
      ...props
    },
    ref,
  ) => {
    const childArray = React.Children.toArray(children)
    const isEmpty = childArray.length === 0 && !loading

    // Handle loading state
    if (loading) {
      return (
        <div
          ref={ref}
          className={cn('grid', columnStyles[columns], gapStyles[gap], className)}
          role="status"
          aria-busy="true"
          aria-label="Loading metrics"
          {...props}
        >
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <SkeletonCard key={index} index={index} stagger={stagger} staggerDelay={staggerDelay} />
          ))}
        </div>
      )
    }

    // Handle empty state
    if (isEmpty) {
      return (
        <div ref={ref} className={className} {...props}>
          <EmptyState
            variant="no-data"
            title={emptyState?.title}
            description={emptyState?.description}
            action={emptyState?.action}
          />
        </div>
      )
    }

    // Masonry layout (CSS columns)
    if (layout === 'masonry') {
      return (
        <div
          ref={ref}
          className={cn('columns-1 md:columns-2 lg:columns-3', gapStyles[gap], className)}
          style={{
            columnCount: columns,
          }}
          {...props}
        >
          {stagger
            ? childArray.map((child, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * staggerDelay,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="mb-4 break-inside-avoid"
                >
                  {child}
                </motion.div>
              ))
            : childArray.map((child, index) => (
                <div key={index} className="mb-4 break-inside-avoid">
                  {child}
                </div>
              ))}
        </div>
      )
    }

    // Grid layout
    return (
      <div
        ref={ref}
        className={cn('grid', columnStyles[columns], gapStyles[gap], className)}
        {...props}
      >
        {stagger
          ? childArray.map((child, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * staggerDelay,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                {child}
              </motion.div>
            ))
          : children}
      </div>
    )
  },
)

MetricGrid.displayName = 'MetricGrid'

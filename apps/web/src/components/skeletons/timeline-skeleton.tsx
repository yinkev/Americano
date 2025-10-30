/**
 * Timeline Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches timeline layout with events, connectors, and dates
 * Uses shadcn/ui Skeleton component with OKLCH colors, glassmorphism
 * Vertical timeline with alternating sides
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface TimelineSkeletonProps {
  className?: string
  items?: number
  variant?: 'vertical' | 'horizontal'
}

export function TimelineSkeleton({
  className,
  items = 5,
  variant = 'vertical',
}: TimelineSkeletonProps) {
  if (variant === 'horizontal') {
    return <HorizontalTimelineSkeleton className={className} items={items} />
  }

  return (
    <div className={cn('space-y-8', className)}>
      {[...Array(items)].map((_, index) => (
        <div key={index} className="relative flex items-start gap-4">
          {/* Timeline Connector Line */}
          {index < items - 1 && <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />}

          {/* Timeline Dot */}
          <div className="relative z-10 flex-shrink-0">
            <Skeleton className="w-8 h-8 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </Skeleton>
          </div>

          {/* Timeline Content */}
          <div
            className={cn(
              'flex-1 bg-white/80 backdrop-blur-md border border-border rounded-lg p-4',
              'shadow-[0_2px_8px_rgba(31,38,135,0.08)]',
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Content Lines */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function HorizontalTimelineSkeleton({ className, items }: { className?: string; items: number }) {
  return (
    <div className={cn('relative', className)}>
      {/* Timeline Line */}
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />

      {/* Timeline Items */}
      <div className="flex justify-between items-start">
        {[...Array(items)].map((_, index) => (
          <div key={index} className="flex flex-col items-center" style={{ flex: 1 }}>
            {/* Dot */}
            <Skeleton className="w-8 h-8 rounded-full relative z-10 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </Skeleton>

            {/* Content */}
            <div className="mt-4 text-center space-y-2 w-full max-w-32">
              <Skeleton className="h-4 w-20 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

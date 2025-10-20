/**
 * Timeline Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches timeline layout with events, connectors, and dates
 * OKLCH colors, glassmorphism, animated timeline items
 * Vertical timeline with alternating sides
 */

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
          {index < items - 1 && (
            <div
              className="absolute left-4 top-10 bottom-0 w-0.5 bg-[oklch(0.9_0.02_230)] animate-pulse"
              style={{ animationDelay: `${index * 0.15}s` }}
            />
          )}

          {/* Timeline Dot */}
          <div className="relative z-10 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full bg-[oklch(0.85_0.05_230)] animate-pulse flex items-center justify-center"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </div>

          {/* Timeline Content */}
          <div
            className={cn(
              'flex-1 bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-lg p-4',
              'shadow-[0_2px_8px_rgba(31,38,135,0.08)]',
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 space-y-2">
                <div
                  className="h-5 w-48 bg-[oklch(0.88_0.02_230)] rounded animate-pulse"
                  style={{ animationDelay: `${index * 0.15 + 0.05}s` }}
                />
                <div
                  className="h-3 w-32 bg-[oklch(0.92_0.02_230)] rounded animate-pulse"
                  style={{ animationDelay: `${index * 0.15 + 0.1}s` }}
                />
              </div>
              <div
                className="h-6 w-20 bg-[oklch(0.9_0.02_230)] rounded-full animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.05}s` }}
              />
            </div>

            {/* Content Lines */}
            <div className="space-y-2">
              <div
                className="h-3 w-full bg-[oklch(0.94_0.01_230)] rounded animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.15}s` }}
              />
              <div
                className="h-3 w-5/6 bg-[oklch(0.95_0.01_230)] rounded animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.2}s` }}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[oklch(0.95_0.01_230)]">
              <div
                className="h-6 w-6 rounded-full bg-[oklch(0.92_0.02_230)] animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.25}s` }}
              />
              <div
                className="h-3 w-24 bg-[oklch(0.92_0.02_230)] rounded animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.25}s` }}
              />
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
      <div className="absolute top-4 left-4 right-4 h-0.5 bg-[oklch(0.9_0.02_230)] animate-pulse" />

      {/* Timeline Items */}
      <div className="flex justify-between items-start">
        {[...Array(items)].map((_, index) => (
          <div key={index} className="flex flex-col items-center" style={{ flex: 1 }}>
            {/* Dot */}
            <div
              className="w-8 h-8 rounded-full bg-[oklch(0.85_0.05_230)] animate-pulse relative z-10 flex items-center justify-center"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>

            {/* Content */}
            <div className="mt-4 text-center space-y-2 w-full max-w-32">
              <div
                className="h-4 w-20 mx-auto bg-[oklch(0.88_0.02_230)] rounded animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.05}s` }}
              />
              <div
                className="h-3 w-16 mx-auto bg-[oklch(0.92_0.02_230)] rounded animate-pulse"
                style={{ animationDelay: `${index * 0.15 + 0.1}s` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

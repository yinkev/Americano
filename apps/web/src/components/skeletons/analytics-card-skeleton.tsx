/**
 * Analytics Card Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches exact dimensions and visual hierarchy of real analytics cards
 * Uses shadcn/ui Skeleton component with OKLCH colors, glassmorphism effects
 * Prevents layout shift by matching real content dimensions
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface AnalyticsCardSkeletonProps {
  className?: string
  variant?: 'default' | 'compact' | 'wide'
  showHeader?: boolean
  showStats?: boolean
  showChart?: boolean
}

export function AnalyticsCardSkeleton({
  className,
  variant = 'default',
  showHeader = true,
  showStats = true,
  showChart = false,
}: AnalyticsCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)] rounded-xl p-6',
        'shadow-[0_8px_32px_rgba(31,38,135,0.1)]',
        className,
      )}
    >
      {/* Header */}
      {showHeader && (
        <div className="mb-6">
          <Skeleton className={cn('h-6', variant === 'compact' ? 'w-24' : 'w-40')} />
        </div>
      )}

      {/* Stats Grid */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Chart Placeholder */}
      {showChart && (
        <div className="h-64 rounded-lg flex items-end justify-around px-4 pb-4 bg-muted/50">
          {[...Array(7)].map((_, i) => (
            <Skeleton
              key={i}
              className="w-8 rounded-t"
              style={{
                height: `${Math.random() * 80 + 20}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Content Lines */}
      {!showChart && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}
    </div>
  )
}

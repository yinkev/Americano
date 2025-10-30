/**
 * Heatmap Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches 7x24 grid (7 days × 24 hours) heatmap structure
 * Uses shadcn/ui Skeleton component with OKLCH colors
 * Matches StudyTimeHeatmap component dimensions exactly
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface HeatmapSkeletonProps {
  className?: string
  showLabels?: boolean
}

export function HeatmapSkeleton({ className, showLabels = true }: HeatmapSkeletonProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = [...Array(24)].map((_, i) => i)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Heatmap Grid */}
      <div className="relative">
        {/* Hour Labels (Top) */}
        {showLabels && (
          <div className="flex mb-2">
            <div className="w-12" /> {/* Spacer for day labels */}
            <div className="flex-1 grid grid-cols-24 gap-1">
              {hours.map((hour, i) => (
                <div key={hour} className="text-center">
                  {i % 6 === 0 && <Skeleton className="h-3 w-6 mx-auto" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid with Day Labels */}
        <div className="space-y-1">
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center gap-2">
              {/* Day Label */}
              {showLabels && (
                <div className="w-10">
                  <Skeleton className="h-3 w-8" />
                </div>
              )}

              {/* Hour Cells */}
              <div className="flex-1 grid grid-cols-24 gap-1">
                {hours.map((hour) => (
                  <Skeleton key={hour} className="aspect-square rounded-sm" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-6 h-6 rounded" />
          ))}
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

/**
 * Heatmap Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches 7x24 grid (7 days × 24 hours) heatmap structure
 * OKLCH colors, glassmorphism, animated cells
 * Matches StudyTimeHeatmap component dimensions exactly
 */

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
        <div className="h-6 w-40 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
        <div className="h-4 w-24 bg-[oklch(0.92_0.02_230)] rounded animate-pulse" />
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
                  {i % 6 === 0 && (
                    <div className="h-3 w-6 mx-auto bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
                  )}
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
                  <div
                    className="h-3 w-8 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
                    style={{ animationDelay: `${dayIndex * 0.1}s` }}
                  />
                </div>
              )}

              {/* Hour Cells */}
              <div className="flex-1 grid grid-cols-24 gap-1">
                {hours.map((hour, hourIndex) => {
                  // Create varying intensities for visual interest
                  const intensity = Math.random()
                  const lightness = 0.85 + intensity * 0.1

                  return (
                    <div
                      key={hour}
                      className="aspect-square rounded-sm animate-pulse"
                      style={{
                        backgroundColor: `oklch(${lightness} 0.03 230)`,
                        animationDelay: `${(dayIndex * 24 + hourIndex) * 0.01}s`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className="h-3 w-16 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded animate-pulse"
              style={{
                backgroundColor: `oklch(${0.95 - i * 0.1} 0.03 230)`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <div className="h-3 w-16 bg-[oklch(0.9_0.02_230)] rounded animate-pulse" />
      </div>
    </div>
  )
}

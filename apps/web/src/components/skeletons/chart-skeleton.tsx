/**
 * Chart Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches chart dimensions with animated bars/lines
 * Variants: bar, line, area, pie, radar
 * Uses shadcn/ui Skeleton component with OKLCH colors
 */

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface ChartSkeletonProps {
  className?: string
  variant?: 'bar' | 'line' | 'area' | 'pie' | 'radar'
  height?: number
  showLegend?: boolean
  showAxes?: boolean
}

export function ChartSkeleton({
  className,
  variant = 'bar',
  height = 320,
  showLegend = true,
  showAxes = true,
}: ChartSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} style={{ height: `${height}px` }}>
      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-4 justify-center">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Chart Area */}
      <div className="flex-1 relative" style={{ height: `${height - (showLegend ? 40 : 0)}px` }}>
        {variant === 'bar' && <BarChartSkeleton showAxes={showAxes} />}
        {variant === 'line' && <LineChartSkeleton showAxes={showAxes} />}
        {variant === 'area' && <AreaChartSkeleton showAxes={showAxes} />}
        {variant === 'pie' && <PieChartSkeleton />}
        {variant === 'radar' && <RadarChartSkeleton />}
      </div>
    </div>
  )
}

function BarChartSkeleton({ showAxes }: { showAxes: boolean }) {
  return (
    <div className="h-full flex items-end justify-around gap-2 px-8 pb-8 relative">
      {/* Y-Axis */}
      {showAxes && (
        <div className="absolute left-0 top-0 bottom-8 w-6 flex flex-col justify-between text-right">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-4" />
          ))}
        </div>
      )}

      {/* Bars */}
      {[...Array(7)].map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 max-w-16 rounded-t"
          style={{
            height: `${Math.random() * 60 + 30}%`,
          }}
        />
      ))}

      {/* X-Axis */}
      {showAxes && (
        <div className="absolute left-8 right-8 bottom-0 h-6 flex justify-around items-center">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-6" />
          ))}
        </div>
      )}
    </div>
  )
}

function LineChartSkeleton({ showAxes }: { showAxes: boolean }) {
  return (
    <div className="h-full relative px-8 pb-8">
      {/* Y-Axis */}
      {showAxes && (
        <div className="absolute left-0 top-0 bottom-8 w-6 flex flex-col justify-between">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-4" />
          ))}
        </div>
      )}

      {/* Line Path */}
      <div className="w-full h-full opacity-50">
        <Skeleton
          className="w-full h-full"
          style={{
            clipPath: 'polygon(0% 80%, 15% 20%, 30% 40%, 60% 30%, 100% 60%, 100% 100%, 0% 100%)',
          }}
        />
      </div>

      {/* X-Axis Labels */}
      {showAxes && (
        <div className="absolute left-8 right-8 bottom-0 h-6 flex justify-around items-center">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-2 w-6" />
          ))}
        </div>
      )}
    </div>
  )
}

function AreaChartSkeleton({ showAxes }: { showAxes: boolean }) {
  return (
    <div className="h-full relative px-8 pb-8">
      <div className="w-full h-full opacity-40">
        <Skeleton
          className="w-full h-full"
          style={{
            clipPath: 'polygon(0% 80%, 15% 30%, 30% 50%, 60% 40%, 100% 70%, 100% 100%, 0% 100%)',
          }}
        />
      </div>
    </div>
  )
}

function PieChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <Skeleton className="w-[200px] h-[200px] rounded-full" />
    </div>
  )
}

function RadarChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-[240px] h-[240px] flex items-center justify-center">
        <Skeleton
          className="w-[180px] h-[180px]"
          style={{ clipPath: 'polygon(50% 10%, 90% 30%, 90% 70%, 50% 90%, 10% 70%, 10% 30%)' }}
        />
      </div>
    </div>
  )
}

/**
 * Chart Skeleton Component
 * Wave 2: Content-Aware Skeleton Loading States
 *
 * Design: Matches chart dimensions with animated bars/lines
 * Variants: bar, line, area, pie, radar
 * OKLCH colors, glassmorphism, subtle animations
 */

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
              <div
                className="w-3 h-3 rounded-full bg-[oklch(0.85_0.08_230)] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              <div
                className="h-3 w-16 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
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
            <div
              key={i}
              className="h-2 w-4 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Bars */}
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="flex-1 max-w-16 bg-[oklch(0.85_0.05_230)] rounded-t animate-pulse"
          style={{
            height: `${Math.random() * 60 + 30}%`,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}

      {/* X-Axis */}
      {showAxes && (
        <div className="absolute left-8 right-8 bottom-0 h-6 flex justify-around items-center">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-6 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
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
            <div
              key={i}
              className="h-2 w-4 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Line Path */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 0,80 Q 15,20 30,40 T 60,30 T 100,60"
          fill="none"
          stroke="oklch(0.85 0.05 230)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>

      {/* X-Axis Labels */}
      {showAxes && (
        <div className="absolute left-8 right-8 bottom-0 h-6 flex justify-around items-center">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-6 bg-[oklch(0.9_0.02_230)] rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AreaChartSkeleton({ showAxes }: { showAxes: boolean }) {
  return (
    <div className="h-full relative px-8 pb-8">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 0,80 Q 15,30 30,50 T 60,40 T 100,70 L 100,100 L 0,100 Z"
          fill="oklch(0.85 0.05 230 / 0.2)"
          className="animate-pulse"
        />
        <path
          d="M 0,80 Q 15,30 30,50 T 60,40 T 100,70"
          fill="none"
          stroke="oklch(0.75 0.08 230)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    </div>
  )
}

function PieChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="oklch(0.9 0.02 230)"
          strokeWidth="40"
          className="animate-pulse"
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="oklch(0.85 0.05 230)"
          strokeWidth="40"
          strokeDasharray="251 251"
          strokeDashoffset="62"
          className="animate-pulse"
          style={{ animationDelay: '0.2s' }}
        />
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="oklch(0.80 0.08 145)"
          strokeWidth="40"
          strokeDasharray="125 377"
          strokeDashoffset="189"
          className="animate-pulse"
          style={{ animationDelay: '0.4s' }}
        />
      </svg>
    </div>
  )
}

function RadarChartSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        {/* Grid */}
        {[60, 40, 20].map((r, i) => (
          <polygon
            key={i}
            points="120,20 200,80 200,160 120,220 40,160 40,80"
            fill="none"
            stroke="oklch(0.9 0.02 230)"
            strokeWidth="1"
            transform={`scale(${1 - i * 0.3})`}
            transform-origin="120 120"
            className="animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        {/* Data polygon */}
        <polygon
          points="120,60 170,100 170,140 120,180 70,140 70,100"
          fill="oklch(0.85 0.05 230 / 0.2)"
          stroke="oklch(0.75 0.08 230)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    </div>
  )
}

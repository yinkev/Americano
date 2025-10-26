/**
 * CognitiveLoadIndicator Component
 * Story 5.4 - Orchestration Components Epic 5 Transformation
 *
 * Semi-circle gauge visualization (0-100) showing current cognitive load
 * with color zones, trend sparkline, and recommendations.
 *
 * Epic 5 Design: Minimalist glassmorphism, OKLCH colors, NO gradients
 * Accessibility: ARIA labels, live regions, keyboard navigation
 */

'use client'

import { useMemo } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CognitiveLoadData {
  load: number // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  trend: number[] // Last 7 days
  recommendation: string
}

interface Props {
  userId: string
  className?: string
}

// OKLCH color zones (Epic 5 design tokens)
const LOAD_ZONES = {
  low: {
    color: 'oklch(0.7 0.15 145)', // Green
    label: 'Optimal',
    range: [0, 30],
  },
  moderate: {
    color: 'oklch(0.8 0.15 85)', // Amber
    label: 'Moderate',
    range: [30, 70],
  },
  high: {
    color: 'oklch(0.6 0.20 30)', // Red
    label: 'High',
    range: [70, 100],
  },
} as const

export function CognitiveLoadIndicator({ userId, className = '' }: Props) {
  // Mock data - replace with real API call
  const data: CognitiveLoadData = useMemo(
    () => ({
      load: 45,
      level: 'MEDIUM',
      trend: [65, 58, 52, 48, 50, 47, 45],
      recommendation:
        'Your cognitive load is moderate. Standard intensity recommended for optimal learning.',
    }),
    []
  )

  // Determine current zone
  const currentZone = useMemo(() => {
    if (data.load < 30) return 'low'
    if (data.load < 70) return 'moderate'
    return 'high'
  }, [data.load])

  const zone = LOAD_ZONES[currentZone]

  // Calculate trend direction
  const trendDirection = useMemo(() => {
    if (data.trend.length < 2) return 'stable'
    const first = data.trend[0]
    const last = data.trend[data.trend.length - 1]
    const diff = last - first
    if (Math.abs(diff) < 5) return 'stable'
    return diff > 0 ? 'up' : 'down'
  }, [data.trend])

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus

  // SVG arc calculation for semi-circle gauge
  const getProgressArc = (load: number): string => {
    const percentage = Math.min(load, 100) / 100
    const angle = -90 + percentage * 180
    const radians = (angle * Math.PI) / 180
    const x = 100 + 80 * Math.cos(radians)
    const y = 100 + 80 * Math.sin(radians)
    const largeArc = percentage > 0.5 ? 1 : 0
    return `M 20 100 A 80 80 0 ${largeArc} 1 ${x} ${y}`
  }

  return (
    <Card className={`shadow-none hover:shadow-none transition-shadow-none ${className}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="size-5" style={{ color: zone.color }} />
            <h3 className="font-heading font-semibold text-foreground text-[16px]">Cognitive Load</h3>
          </div>
          <button className="p-1 hover:bg-muted rounded-md transition-colors" aria-label="Cognitive load information">
            <Info className="size-4 text-info" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-6">
        {/* Semi-Circle Gauge Visualization */}
        <div className="relative flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-full max-w-sm" style={{ maxHeight: '160px' }} aria-hidden="true">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="oklch(0.95 0 0)"
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Green Zone (0-30) */}
            <path
              d="M 20 100 A 80 80 0 0 1 68 28"
              fill="none"
              stroke="oklch(0.7 0.15 145)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Amber Zone (30-70) */}
            <path
              d="M 68 28 A 80 80 0 0 1 132 28"
              fill="none"
              stroke="oklch(0.8 0.15 85)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Red Zone (70-100) */}
            <path
              d="M 132 28 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="oklch(0.6 0.20 30)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Active Progress Arc */}
            <path
              d={getProgressArc(data.load)}
              fill="none"
              stroke={zone.color}
              strokeWidth="20"
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />

            {/* Needle */}
            <g transform={`rotate(${-90 + (data.load / 100) * 180} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="35"
                stroke="oklch(0.3 0 0)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="6" fill="oklch(0.3 0 0)" />
            </g>

            {/* Zone Labels */}
            <text x="30" y="115" fontSize="10" fill="oklch(0.5 0 0)" textAnchor="start">
              0
            </text>
            <text x="100" y="20" fontSize="10" fill="oklch(0.5 0 0)" textAnchor="middle">
              50
            </text>
            <text x="170" y="115" fontSize="10" fill="oklch(0.5 0 0)" textAnchor="end">
              100
            </text>
          </svg>

          {/* Current Value Display */}
          <div className="absolute bottom-0 text-center">
            <div className="text-4xl font-bold font-heading" style={{ color: zone.color }}>
              {Math.round(data.load)}
            </div>
            <Badge
              variant="outline"
              className="mt-1 px-3 py-1 font-semibold"
              style={{
                backgroundColor: `color-mix(in oklch, ${zone.color}, transparent 90%)`,
                borderColor: zone.color,
                color: zone.color,
              }}
            >
              {zone.label} Load
            </Badge>
          </div>
        </div>

        {/* Trend Sparkline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              7-Day Trend
            </span>
            <div className="flex items-center gap-1">
              <TrendIcon className="size-4" style={{ color: trendDirection === 'up' ? 'oklch(0.6 0.20 30)' : trendDirection === 'down' ? 'oklch(0.7 0.15 145)' : 'oklch(0.5 0 0)' }} />
              <span className="text-[11px] font-medium text-muted-foreground">
                {trendDirection === 'up' && 'Increasing'}
                {trendDirection === 'down' && 'Decreasing'}
                {trendDirection === 'stable' && 'Stable'}
              </span>
            </div>
          </div>

          <div className="h-16 flex items-end gap-1">
            {data.trend.map((value, idx) => {
              const height = (value / 100) * 100
              const zoneColor = value < 30 ? LOAD_ZONES.low.color : value < 70 ? LOAD_ZONES.moderate.color : LOAD_ZONES.high.color
              return (
                <div
                  key={idx}
                  className="flex-1 rounded-t transition-all hover:brightness-90"
                  style={{
                    height: `${height}%`,
                    backgroundColor: zoneColor,
                    opacity: idx === data.trend.length - 1 ? 1 : 0.6,
                  }}
                  title={`Day ${idx + 1}: ${value}%`}
                />
              )
            })}
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="space-y-1.5">
          <Progress value={data.load} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>0</span>
            <span>30</span>
            <span>70</span>
            <span>100</span>
          </div>
        </div>

        {/* Recommendation */}
        <div
          className="p-4 rounded-lg space-y-2"
          style={{
            backgroundColor: `color-mix(in oklch, ${zone.color}, transparent 95%)`,
            borderLeft: `3px solid ${zone.color}`,
          }}
        >
          <div className="flex items-start gap-2">
            {data.load >= 70 ? (
              <AlertTriangle className="size-5 shrink-0 mt-0.5" style={{ color: zone.color }} />
            ) : (
              <Info className="size-5 shrink-0 mt-0.5" style={{ color: zone.color }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground mb-1">Recommendation</p>
              <p className="text-[13px] text-muted-foreground">{data.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Zone Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px]">
          {Object.entries(LOAD_ZONES).map(([key, zone]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="text-muted-foreground">
                {zone.label} ({zone.range[0]}-{zone.range[1]})
              </span>
            </div>
          ))}
        </div>

        {/* ARIA live region for screen readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Cognitive load is {zone.label} at {Math.round(data.load)} percent. Load is trending {trendDirection}.{' '}
          {data.recommendation}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * CognitiveLoadMeter Component
 * Story 5.4 Task 7.2
 *
 * Circular gauge displaying cognitive load (0-100) with color-coded zones:
 * - Green (<40): Low load - optimal learning
 * - Yellow (40-60): Moderate load - learning zone
 * - Orange (60-80): High load - approaching overload
 * - Red (>80): Critical - overload detected
 *
 * Design: OKLCH colors, glassmorphism, NO gradients (per CLAUDE.md)
 * Accessibility: ARIA live region, text labels, icons supplement colors
 */

'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'

interface CognitiveLoadMeterProps {
  currentLoad: number // 0-100 scale
  trend: 'up' | 'down' | 'stable'
  lastUpdated: Date
  className?: string
}

// OKLCH color zones (per Story 5.4 constraints)
const LOAD_ZONES = {
  low: {
    color: 'oklch(0.7 0.15 145)', // Green
    label: 'Low Load',
    icon: CheckCircle,
    message: "You're in the optimal learning zone",
    range: [0, 40],
  },
  moderate: {
    color: 'oklch(0.8 0.15 90)', // Yellow
    label: 'Moderate Load',
    icon: AlertTriangle,
    message: 'Productive learning - stay engaged',
    range: [40, 60],
  },
  high: {
    color: 'oklch(0.7 0.15 50)', // Orange
    label: 'High Load',
    icon: Zap,
    message: 'Approaching your limit - consider a break soon',
    range: [60, 80],
  },
  critical: {
    color: 'oklch(0.6 0.20 30)', // Red
    label: 'Critical Overload',
    icon: AlertCircle,
    message: 'Take a break - your brain needs rest',
    range: [80, 100],
  },
} as const

type LoadZone = keyof typeof LOAD_ZONES

export function CognitiveLoadMeter({
  currentLoad,
  trend,
  lastUpdated,
  className = '',
}: CognitiveLoadMeterProps) {
  // Determine current zone
  const currentZone: LoadZone = useMemo(() => {
    if (currentLoad < 40) return 'low'
    if (currentLoad < 60) return 'moderate'
    if (currentLoad < 80) return 'high'
    return 'critical'
  }, [currentLoad])

  const zone = LOAD_ZONES[currentZone]
  const ZoneIcon = zone.icon

  // Calculate SVG arc path for circular gauge
  const gaugeRadius = 80
  const strokeWidth = 16
  const centerX = 100
  const centerY = 100
  const circumference = 2 * Math.PI * gaugeRadius
  const loadPercentage = Math.min(Math.max(currentLoad, 0), 100)
  const arcLength = (loadPercentage / 100) * circumference

  // Trend icon
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div
      className={`bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-foreground text-lg">Cognitive Load</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendIcon className="size-4" />
          <span className="capitalize">{trend}</span>
        </div>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-full aspect-square max-w-[280px] mx-auto mb-6">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background circle (gray track) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={gaugeRadius}
            fill="none"
            stroke="oklch(0.85 0 0)" // Light gray
            strokeWidth={strokeWidth}
            opacity={0.2}
          />

          {/* Load arc with solid color zones (NO gradients) */}
          {Object.entries(LOAD_ZONES).map(([zoneName, zoneData]) => {
            const [zoneMin, zoneMax] = zoneData.range

            // Only render if current load extends into this zone
            if (loadPercentage <= zoneMin) return null

            const zoneStart = zoneMin
            const zoneEnd = Math.min(loadPercentage, zoneMax)
            const zoneLength = ((zoneEnd - zoneStart) / 100) * circumference
            const zoneOffset = ((100 - zoneStart) / 100) * circumference

            return (
              <circle
                key={zoneName}
                cx={centerX}
                cy={centerY}
                r={gaugeRadius}
                fill="none"
                stroke={zoneData.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${zoneLength} ${circumference}`}
                strokeDashoffset={zoneOffset}
                style={{
                  transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease',
                }}
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="p-3 rounded-full mb-2"
            style={{ backgroundColor: `color-mix(in oklch, ${zone.color}, transparent 85%)` }}
          >
            <ZoneIcon className="size-8" style={{ color: zone.color }} />
          </div>
          <div className="text-4xl font-bold font-heading" style={{ color: zone.color }}>
            {Math.round(loadPercentage)}
          </div>
          <div className="text-sm text-muted-foreground font-medium">/ 100</div>
        </div>
      </div>

      {/* Zone indicator badge */}
      <div
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg mb-4"
        style={{
          backgroundColor: `color-mix(in oklch, ${zone.color}, transparent 90%)`,
          borderLeft: `4px solid ${zone.color}`,
        }}
      >
        <span className="text-sm font-semibold" style={{ color: zone.color }}>
          {zone.label}
        </span>
      </div>

      {/* Supportive message */}
      <p className="text-sm text-center text-muted-foreground mb-4">{zone.message}</p>

      {/* Last updated */}
      <div className="text-xs text-center text-muted-foreground">
        Updated {format(lastUpdated, 'h:mm a')}
      </div>

      {/* ARIA live region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Cognitive load is {zone.label} at {Math.round(loadPercentage)} percent. Load is trending{' '}
        {trend}.{zone.message}
      </div>
    </div>
  )
}

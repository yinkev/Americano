/**
 * StressProfileCard Component
 * Story 5.4 Task 7.5
 *
 * Displays personalized stress profile with:
 * - Radar chart showing stress trigger dimensions (topic, time, difficulty, duration, exam-pressure)
 * - Primary stressors highlighted
 * - Load tolerance threshold reference line
 * - Effective coping strategies list
 *
 * Design: Recharts radar chart, glassmorphism, OKLCH colors
 */

'use client'

import { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { AlertTriangle, CheckCircle, Target } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export interface StressTrigger {
  dimension: string // e.g., "Topic Difficulty", "Time Pressure"
  score: number // 0-100 scale
  isPrimary?: boolean // Highlight as primary stressor
}

export interface StressProfileCardProps {
  triggers: StressTrigger[]
  loadTolerance: number // 0-100 threshold
  copingStrategies: string[]
  profileConfidence: number // 0.0-1.0
  className?: string
}

export function StressProfileCard({
  triggers,
  loadTolerance,
  copingStrategies,
  profileConfidence,
  className = '',
}: StressProfileCardProps) {
  // Transform triggers for radar chart
  const radarData = useMemo(() => {
    return triggers.map((trigger) => ({
      dimension: trigger.dimension,
      score: trigger.score,
      tolerance: loadTolerance, // Reference line
    }))
  }, [triggers, loadTolerance])

  // Identify primary stressors (score > tolerance)
  const primaryStressors = useMemo(() => {
    return triggers.filter((t) => t.isPrimary || t.score > loadTolerance)
  }, [triggers, loadTolerance])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null

    const data = payload[0].payload
    const isAboveTolerance = data.score > data.tolerance

    return (
      <div className="bg-card border border-border shadow-sm rounded-lg p-3">
        <div className="text-[13px] font-semibold text-foreground mb-1">{data.dimension}</div>
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Stress Score:</span>
            <span
              className="font-semibold"
              style={{
                color: isAboveTolerance ? 'oklch(0.6 0.20 30)' : 'oklch(0.7 0.15 145)',
              }}
            >
              {Math.round(data.score)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Your Tolerance:</span>
            <span className="font-semibold text-foreground">{Math.round(data.tolerance)}</span>
          </div>
          {isAboveTolerance && (
            <div className="pt-1 mt-1 border-t border-muted text-orange-600">
              ⚠️ Above tolerance
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="p-4 pb-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Stress Profile</h3>
          <div className="flex items-center gap-2">
            <Target className="size-4 text-clinical" />
            <span className="text-[11px] text-muted-foreground">
              {Math.round(profileConfidence * 100)}% confidence
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-4">
        {/* Radar chart */}
        <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="oklch(0.85 0 0)" strokeDasharray="3 3" />

            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 12, fill: 'oklch(0.5 0 0)' }}
              tickLine={false}
            />

            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: 'oklch(0.6 0 0)' }}
              tickCount={5}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Tolerance reference line */}
            <Radar
              name="Load Tolerance"
              dataKey="tolerance"
              stroke="oklch(0.8 0.15 90)" // Yellow
              fill="oklch(0.8 0.15 90)"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
            />

            {/* Actual stress scores */}
            <Radar
              name="Stress Score"
              dataKey="score"
              stroke="oklch(0.6 0.15 240)" // Blue
              fill="oklch(0.6 0.15 240)"
              fillOpacity={0.3}
              strokeWidth={3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

        {/* Primary stressors */}
        {primaryStressors.length > 0 && (
          <div>
            <h4 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" />
              Primary Stressors
            </h4>
            <div className="flex flex-wrap gap-2">
              {primaryStressors.map((stressor, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-medium"
                  style={{
                    backgroundColor: 'oklch(0.95 0.05 50)',
                    color: 'oklch(0.5 0.15 50)',
                    border: '1px solid oklch(0.9 0.1 50)',
                  }}
                >
                  {stressor.dimension}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load tolerance indicator */}
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground">Your Load Tolerance</span>
            <span className="text-[20px] font-bold font-heading text-foreground">
              {Math.round(loadTolerance)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            You typically experience stress when cognitive load exceeds this threshold
          </p>
        </div>

        {/* Effective coping strategies */}
        <div>
          <h4 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="size-4 text-success" />
            Effective Coping Strategies
          </h4>
          <ul className="space-y-2">
            {copingStrategies.map((strategy, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30 hover:bg-success/20 transition-colors"
              >
                <span className="shrink-0 size-5 rounded-full bg-success text-white flex items-center justify-center text-[11px] font-bold mt-0.5">
                  {index + 1}
                </span>
                <p className="text-[13px] text-foreground flex-1">{strategy}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ARIA live region for screen readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Stress profile shows {primaryStressors.length} primary stressor
          {primaryStressors.length !== 1 ? 's' : ''}: {primaryStressors.map((s) => s.dimension).join(', ')}.
          Your load tolerance is {Math.round(loadTolerance)}. You have {copingStrategies.length}{' '}
          effective coping strategies.
        </div>
      </CardContent>
    </Card>
  )
}

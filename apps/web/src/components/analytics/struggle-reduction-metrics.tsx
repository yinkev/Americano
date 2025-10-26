/**
 * StruggleReductionMetrics Component
 * Story 5.2 Task 10.5
 * Wave 3: Enhanced with chart theme and design tokens
 *
 * Displays struggle reduction statistics with before/after comparison
 *
 * Design: OKLCH colors, glassmorphism, NO gradients (per CLAUDE.md)
 * Charts: Recharts with custom Wave 3 theme
 */

'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingDown, CheckCircle2, Target, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { typography, colors } from '@/lib/design-tokens'
import { chartTheme, chartColors } from '@/lib/chart-theme'

interface ReductionData {
  baselineRate: number
  currentRate: number
  reductionPercentage: number
  timeline: {
    week: string
    struggleRate: number
  }[]
  interventionCount: number
  weeksTracked: number
}

export function StruggleReductionMetrics() {
  const [data, setData] = useState<ReductionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReductionData()
  }, [])

  async function fetchReductionData() {
    try {
      setLoading(true)

      // Fetch from real API endpoint (proxies to ML service)
      const response = await fetch('/api/analytics/struggle-reduction?period=all&userId=user-kevy')

      if (!response.ok) {
        throw new Error(`Failed to fetch struggle reduction data: ${response.statusText}`)
      }

      const result = await response.json()

      // Transform API response to component format
      if (result.success && result.data) {
        const apiData = result.data

        const transformedData: ReductionData = {
          baselineRate: apiData.baseline_rate || 0,
          currentRate: apiData.current_rate || 0,
          reductionPercentage: apiData.reduction_percentage || 0,
          timeline: (apiData.weekly_timeline || []).map((week: any) => ({
            week: week.week,
            struggleRate: week.struggle_rate * 100, // Convert to percentage
          })),
          interventionCount: apiData.intervention_count || 0,
          weeksTracked: apiData.weeks_tracked || 0,
        }

        setData(transformedData)
      } else {
        // No data available yet
        setData(null)
      }
    } catch (error) {
      console.error('Error fetching reduction data:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-card  border-border shadow-none">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <p className={`${typography.body.small} text-muted-foreground`}>Loading metrics...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.weeksTracked < 2) {
    return (
      <Card className="bg-card  border-border shadow-none">
        <CardContent className="p-6 h-64 flex flex-col items-center justify-center">
          <Calendar className="size-12 text-muted-foreground mb-3" />
          <p className={`${typography.body.small} text-muted-foreground`}>
            Not enough data to calculate reduction metrics yet
          </p>
          <p className={`${typography.body.tiny} text-muted-foreground mt-2`}>
            We need at least 2 weeks of data to show trends
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare comparison data (using design tokens)
  const comparisonData = [
    {
      label: 'Before',
      rate: data.baselineRate * 100,
      color: colors.alert,
    },
    {
      label: 'After',
      rate: data.currentRate * 100,
      color: colors.success,
    },
  ]

  const reductionColor =
    data.reductionPercentage >= 25
      ? colors.success // Green - Great
      : data.reductionPercentage >= 10
        ? colors.warning // Yellow - Good
        : chartColors.text // Gray - Modest

  return (
    <Card className="bg-card  border-border shadow-none transition-all duration-300 hover:shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className={`${typography.heading.h3} font-heading`}>Your Progress</CardTitle>
          <Badge
            variant="outline"
            className="shrink-0 px-3 py-1.5 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `color-mix(in oklch, ${reductionColor}, transparent 90%)`,
              borderColor: reductionColor,
              color: reductionColor,
            }}
          >
            {data.weeksTracked} Weeks
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Big Number - Reduction Percentage (NO gradients - use solid OKLCH colors) */}
        <div
          className="text-center py-6 px-4 rounded-xl transition-all duration-300 hover:scale-[1.01]"
          style={{
            backgroundColor: `color-mix(in oklch, ${colors.success}, transparent 92%)`,
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingDown className="size-8" style={{ color: colors.success }} />
            <p className="text-5xl font-bold text-foreground">
              {data.reductionPercentage.toFixed(0)}%
            </p>
          </div>
          <p className={`${typography.heading.h3} text-foreground mb-1`}>Struggles Reduced</p>
          <p className={`${typography.body.small} text-muted-foreground`}>
            Thanks to proactive interventions
          </p>
        </div>

        {/* Before/After Comparison Bar Chart with Recharts theme */}
        <div>
          <h4 className={`${typography.body.small} font-semibold text-foreground mb-3`}>
            Before vs After Comparison
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={comparisonData}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
            >
              <CartesianGrid {...chartTheme.grid} horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 50]}
                {...chartTheme.axis}
                label={{
                  value: 'Struggle Rate (%)',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: 11, fill: chartColors.text },
                }}
              />
              <YAxis
                type="category"
                dataKey="label"
                {...chartTheme.axis}
                tick={{ fill: chartColors.text, fontSize: 13, fontWeight: 600 }}
              />
              <Tooltip {...chartTheme.tooltip} formatter={(value: number) => `${value.toFixed(1)}%`} />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]} animationDuration={800} animationEasing="ease-out">
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Progress */}
        <div>
          <h4 className={`${typography.body.small} font-semibold text-foreground mb-3`}>
            Reduction Timeline
          </h4>
          <div className="space-y-2">
            {data.timeline.map((point, index) => {
              const isFirst = index === 0
              const isLast = index === data.timeline.length - 1
              const change = isFirst
                ? 0
                : point.struggleRate - data.timeline[index - 1].struggleRate

              return (
                <div
                  key={point.week}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-all duration-200 hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2 w-24">
                    <div
                      className="size-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: isLast ? colors.success : chartColors.grid,
                      }}
                    />
                    <span className={`${typography.body.tiny} font-medium text-muted-foreground`}>
                      {point.week}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${100 - point.struggleRate}%`,
                          backgroundColor: colors.success,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <span className={`${typography.body.small} font-semibold text-foreground`}>
                      {point.struggleRate.toFixed(0)}%
                    </span>
                    {!isFirst && (
                      <span
                        className={`ml-2 ${typography.body.tiny}`}
                        style={{
                          color: change < 0 ? colors.success : chartColors.text,
                        }}
                      >
                        {change < 0 ? '↓' : change > 0 ? '↑' : '→'}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-start gap-3 transition-all duration-200 hover:scale-[1.02]">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `color-mix(in oklch, ${colors.clinical}, transparent 90%)` }}
            >
              <Target className="size-5" style={{ color: colors.clinical }} />
            </div>
            <div>
              <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>
                Interventions Applied
              </p>
              <p className="text-2xl font-bold text-foreground">{data.interventionCount}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 transition-all duration-200 hover:scale-[1.02]">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `color-mix(in oklch, ${colors.success}, transparent 90%)` }}
            >
              <CheckCircle2 className="size-5" style={{ color: colors.success }} />
            </div>
            <div>
              <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>Success Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {((1 - data.currentRate) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01]"
          style={{
            backgroundColor: `color-mix(in oklch, ${colors.clinical}, transparent 95%)`,
            borderColor: `color-mix(in oklch, ${colors.clinical}, transparent 80%)`,
          }}
        >
          <p className={`${typography.body.small} font-medium text-foreground mb-1`}>
            Keep Providing Feedback
          </p>
          <p className={`${typography.body.tiny} text-muted-foreground`}>
            Your feedback helps improve predictions and reduces struggles even further. Let us know
            when predictions are accurate or inaccurate!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * PredictionAccuracyChart Component
 * Story 5.2 Task 10.4
 * Wave 3: Enhanced with Recharts theme and design tokens
 *
 * Displays prediction accuracy metrics over time with Recharts
 *
 * Design: OKLCH colors, glassmorphism, NO gradients (per CLAUDE.md)
 * Charts: Recharts with custom Wave 3 theme
 */

'use client'

import { format } from 'date-fns'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { chartColors, chartTheme } from '@/lib/chart-theme'
import { colors, typography } from '@/lib/design-tokens'

interface AccuracyData {
  week: string
  precision: number
  recall: number
  f1Score: number
  platformAverage: number
}

export function PredictionAccuracyChart() {
  const [data, setData] = useState<AccuracyData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccuracyData()
  }, [])

  async function fetchAccuracyData() {
    try {
      setLoading(true)

      // Fetch from real API endpoint (proxies to ML service)
      const response = await fetch('/api/analytics/model-performance?userId=user-kevy')

      if (!response.ok) {
        throw new Error(`Failed to fetch model performance: ${response.statusText}`)
      }

      const result = await response.json()

      // Transform API response to chart format
      if (result.success && result.metrics) {
        const metrics = result.metrics

        // Create weekly data points from historical metrics if available
        // For MVP, we use the current metrics as the latest week
        const chartData: AccuracyData[] = [
          {
            week: 'Current',
            precision: (metrics.precision || 0) * 100,
            recall: (metrics.recall || 0) * 100,
            f1Score: (metrics.f1_score || 0) * 100,
            platformAverage: 74, // Platform baseline (would come from API in production)
          },
        ]

        setData(chartData)
      } else {
        // No data available yet
        setData([])
      }
    } catch (error) {
      console.error('Error fetching accuracy data:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-96 flex items-center justify-center">
          <p className={`${typography.body.small} text-muted-foreground`}>
            Loading accuracy trends...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-96 flex flex-col items-center justify-center">
          <p className={`${typography.body.small} text-muted-foreground`}>
            Not enough data to show accuracy trends yet
          </p>
          <p className={`${typography.body.tiny} text-muted-foreground mt-2`}>
            Keep providing feedback on predictions!
          </p>
        </CardContent>
      </Card>
    )
  }

  const latestData = data[data.length - 1]
  const previousData = data.length > 1 ? data[data.length - 2] : null

  // Calculate trends
  const getTrend = (current: number, previous: number | null) => {
    if (!previous) return 'stable'
    const change = current - previous
    if (Math.abs(change) < 2) return 'stable'
    return change > 0 ? 'improving' : 'declining'
  }

  const f1Trend = getTrend(latestData.f1Score, previousData?.f1Score || null)

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return TrendingUp
    if (trend === 'declining') return TrendingDown
    return Minus
  }

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return colors.success
    if (trend === 'declining') return colors.alert
    return chartColors.text
  }

  const TrendIcon = getTrendIcon(f1Trend)
  const trendColor = getTrendColor(f1Trend)

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className={`${typography.heading.h3} font-heading mb-2`}>
              Model Performance Over Time
            </CardTitle>
            <p className={`${typography.body.small} text-muted-foreground`}>
              Your prediction model accuracy vs platform average
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 px-3 py-1.5 flex items-center gap-2 transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `color-mix(in oklch, ${trendColor}, transparent 90%)`,
              borderColor: trendColor,
              color: trendColor,
            }}
          >
            <TrendIcon className="size-4" />
            {f1Trend === 'improving'
              ? 'Improving'
              : f1Trend === 'declining'
                ? 'Needs Data'
                : 'Stable'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50">
          <div className="transition-all duration-200 hover:scale-[1.02]">
            <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>Precision</p>
            <p className="text-2xl font-bold text-foreground">{latestData.precision.toFixed(0)}%</p>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Accuracy when predicting struggle
            </p>
          </div>
          <div className="transition-all duration-200 hover:scale-[1.02]">
            <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>Recall</p>
            <p className="text-2xl font-bold text-foreground">{latestData.recall.toFixed(0)}%</p>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Catches struggles early
            </p>
          </div>
          <div className="transition-all duration-200 hover:scale-[1.02]">
            <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>F1 Score</p>
            <p className="text-2xl font-bold text-foreground">{latestData.f1Score.toFixed(0)}%</p>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>Overall accuracy</p>
          </div>
        </div>

        {/* Chart with Recharts theme */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid {...chartTheme.grid} vertical={false} />
            <XAxis dataKey="week" {...chartTheme.axis} />
            <YAxis
              {...chartTheme.axis}
              domain={[0, 100]}
              label={{
                value: 'Accuracy (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: chartColors.text },
              }}
            />
            <Tooltip
              {...chartTheme.tooltip}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend {...chartTheme.legend} />

            {/* Precision Line */}
            <Line
              type="monotone"
              dataKey="precision"
              stroke={colors.clinical}
              strokeWidth={2.5}
              dot={{
                fill: colors.clinical,
                r: 4,
                strokeWidth: 2,
                stroke: 'white',
              }}
              activeDot={{ r: 6 }}
              name="Precision"
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* Recall Line */}
            <Line
              type="monotone"
              dataKey="recall"
              stroke={colors.success}
              strokeWidth={2.5}
              dot={{
                fill: colors.success,
                r: 4,
                strokeWidth: 2,
                stroke: 'white',
              }}
              activeDot={{ r: 6 }}
              name="Recall"
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* F1 Score Line */}
            <Line
              type="monotone"
              dataKey="f1Score"
              stroke={colors.energy}
              strokeWidth={3}
              dot={{
                fill: colors.energy,
                r: 5,
                strokeWidth: 2,
                stroke: 'white',
              }}
              activeDot={{ r: 7 }}
              name="F1 Score (Overall)"
              animationDuration={800}
              animationEasing="ease-out"
            />

            {/* Platform Average Line */}
            <Line
              type="monotone"
              dataKey="platformAverage"
              stroke={chartColors.text}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Platform Average"
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Comparison with Platform */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.01]">
          <div>
            <p className={`${typography.body.small} font-medium text-foreground mb-1`}>
              Your Model vs Platform
            </p>
            <p className={`${typography.body.tiny} text-muted-foreground`}>
              {latestData.f1Score >= latestData.platformAverage
                ? 'Your model is performing above average!'
                : 'Keep providing feedback to improve your model'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {latestData.f1Score >= latestData.platformAverage ? '+' : ''}
              {(latestData.f1Score - latestData.platformAverage).toFixed(1)}%
            </p>
            <p className={`${typography.body.tiny} text-muted-foreground`}>vs average</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

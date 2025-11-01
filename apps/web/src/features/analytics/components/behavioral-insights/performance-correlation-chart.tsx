/**
 * PerformanceCorrelationChart Component
 * Story 5.6: Behavioral Insights Dashboard - Task 3 (Performance Correlation)
 *
 * Epic 5 UI Transformation:
 * - OKLCH colors for scatter plot and significance markers (no gradients)
 * - Design tokens from /lib/design-tokens.ts
 * - Typography system (font-heading, precise text sizes)
 * - Glassmorphism effects (bg-white/80 backdrop-blur-md)
 *
 * Displays scatter plot showing correlation between behavioral scores and academic performance.
 * - X-axis: Behavioral composite score (0-100)
 * - Y-axis: Academic performance score (0-100)
 * - Tooltips surface individual study dates and score pairs
 * - Summary badges highlight coefficient, p-value, and interpretation
 */

'use client'

import { format } from 'date-fns'
import { AlertCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { colors, typography } from '@/lib/design-tokens'

interface CorrelationPoint {
  date: string
  behavioralScore: number
  academicScore: number
}

interface CorrelationSummary {
  coefficient: number
  pValue: number
  interpretation: string
}

interface CorrelationQuality {
  sampleSize: number
  weeksOfData: number
  missingDataPoints: number
}

interface PerformanceCorrelationChartProps {
  userId: string | null
  isLoading?: boolean
}

// Transform data for scatter plot
const transformData = (points: CorrelationPoint[]) =>
  points.map((point) => ({
    x: point.behavioralScore,
    y: point.academicScore,
    date: point.date,
  }))

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0]?.payload as { x: number; y: number; date: string } | undefined

  if (!data) {
    return null
  }

  return (
    <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg">
      <div className="space-y-1 text-xs">
        <p>
          <span className="text-muted-foreground">Study Date: </span>
          <span className="font-medium">{format(new Date(data.date), 'MMM d, yyyy')}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Behavioral Score: </span>
          <span className="font-medium">{data.x.toFixed(1)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Academic Score: </span>
          <span className="font-medium">{data.y.toFixed(1)}</span>
        </p>
      </div>
    </div>
  )
}

export function PerformanceCorrelationChart({
  userId,
  isLoading: isLoadingProp = false,
}: PerformanceCorrelationChartProps) {
  const [points, setPoints] = useState<CorrelationPoint[]>([])
  const [summary, setSummary] = useState<CorrelationSummary | null>(null)
  const [quality, setQuality] = useState<CorrelationQuality | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setPoints([])
      setSummary(null)
      setQuality(null)
      setInsights([])
      setError(null)
      setIsLoading(false)
      return
    }

    let isMounted = true

    const fetchCorrelations = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          `/api/analytics/behavioral-insights/correlation?userId=${encodeURIComponent(userId)}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch correlation data')
        }

        const body = await response.json()
        if (!isMounted) {
          return
        }

        if (body.success && body.data) {
          const result = body.data
          const series = Array.isArray(result.timeSeriesData) ? result.timeSeriesData : []
          setPoints(series)

          if (typeof result.coefficient === 'number' && typeof result.pValue === 'number') {
            setSummary({
              coefficient: result.coefficient,
              pValue: result.pValue,
              interpretation: result.interpretation ?? 'Correlation analysis ready',
            })
          } else {
            setSummary(null)
          }

          if (
            result.dataQuality &&
            typeof result.dataQuality.sampleSize === 'number' &&
            typeof result.dataQuality.weeksOfData === 'number'
          ) {
            setQuality({
              sampleSize: result.dataQuality.sampleSize,
              weeksOfData: result.dataQuality.weeksOfData,
              missingDataPoints: result.dataQuality.missingDataPoints ?? 0,
            })
          } else {
            setQuality(null)
          }

          setInsights(Array.isArray(result.insights) ? result.insights : [])
        } else {
          throw new Error('Invalid response format')
        }

        const { data } = json as { data: CorrelationData }
        setCorrelationData(data)
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCorrelations()
    return () => {
      isMounted = false
    }
  }, [userId])

  const chartData = useMemo(() => transformData(points), [points])

  // Empty state
  if (!isLoading && !isLoadingProp && chartData.length === 0 && !error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h3 className={`${typography.heading.h3} mb-2`}>No Correlation Data</h3>
          <p className={`${typography.body.base} text-muted-foreground text-center max-w-md`}>
            Complete more study sessions to analyze the relationship between your behavior scores and
            performance outcomes.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card
        className="bg-white/80 backdrop-blur-md shadow-sm border"
        style={{ borderColor: colors.alert }}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 mb-4" style={{ color: colors.alert }} />
          <h3 className={`${typography.heading.h3} mb-2`}>Error Loading Data</h3>
          <p className={`${typography.body.base} text-muted-foreground text-center`}>{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading || isLoadingProp) {
    return (
      <Card className="bg-white/80 backdrop-blur-md shadow-sm animate-pulse">
        <CardHeader>
          <div className="h-6 rounded w-1/3 mb-2" style={{ backgroundColor: 'oklch(0.9 0.02 230)' }} />
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: 'oklch(0.92 0.02 230)' }} />
        </CardHeader>
        <CardContent>
          <div className="h-80 rounded" style={{ backgroundColor: 'oklch(0.94 0.02 230)' }} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm">
      <CardHeader className="space-y-3">
        <CardTitle className={typography.heading.h2}>Behavior vs Academic Performance</CardTitle>
        <CardDescription className={`${typography.body.base} mt-1`}>
          Explore how shifts in behavioral scores align with academic results over time.
        </CardDescription>
        {summary && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge className="bg-blue-600 text-white">Pearson r: {summary.coefficient.toFixed(2)}</Badge>
            <Badge className="bg-purple-600 text-white">p-value: {summary.pValue.toFixed(3)}</Badge>
            <span className="text-muted-foreground">{summary.interpretation}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis
                type="number"
                dataKey="x"
                name="Behavioral Score"
                domain={[0, 100]}
                tick={{ fill: 'oklch(0.5 0.05 220)' }}
                label={{
                  value: 'Behavioral Score',
                  position: 'insideBottom',
                  offset: -10,
                  style: { fill: 'oklch(0.5 0.05 220)' },
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Academic Score"
                domain={[0, 100]}
                tick={{ fill: 'oklch(0.5 0.05 220)' }}
                label={{
                  value: 'Academic Score',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: 'oklch(0.5 0.05 220)' },
                }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend verticalAlign="top" height={36} />
              <Scatter
                name="Study Sessions"
                data={chartData}
                fill="oklch(0.7 0.15 140)"
                opacity={0.75}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {quality && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sample Size</p>
              <p className="text-2xl font-semibold" style={{ color: 'oklch(0.7 0.15 140)' }}>
                {quality.sampleSize}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Weeks Analyzed</p>
              <p className="text-2xl font-semibold" style={{ color: 'oklch(0.6 0.12 220)' }}>
                {quality.weeksOfData}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Missing Data Points</p>
              <p className="text-2xl font-semibold" style={{ color: 'oklch(0.6 0.15 40)' }}>
                {quality.missingDataPoints}
              </p>
            </div>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-2">
            <h3 className={`${typography.heading.h3} text-muted-foreground`}>Insights</h3>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className={`${typography.body.base} text-muted-foreground flex gap-2`}>
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

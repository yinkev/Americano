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
 * Displays scatter plot showing correlation between behavioral patterns and academic performance.
 * - X-axis: Behavioral score (0-100)
 * - Y-axis: Academic score (0-100)
 * - Points represent paired weekly observations
 * - Interactive tooltips show series-level Pearson r and p-value
 */

'use client'

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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { colors, typography } from '@/lib/design-tokens'

interface TimeSeriesPoint {
  date: string
  behavioralScore: number
  academicScore: number
}

interface DataQuality {
  sampleSize: number
  weeksOfData: number
  missingDataPoints: number
}

interface CorrelationData {
  coefficient: number
  pValue: number
  interpretation: string
  confidenceInterval: [number, number]
  timeSeriesData: TimeSeriesPoint[]
  insights: string[]
  dataQuality: DataQuality
}

interface ScatterPoint {
  x: number
  y: number
  behavioralScore: number
  academicScore: number
  dateLabel: string
  coefficient: number
  pValue: number
  sampleSize: number
}

interface PerformanceCorrelationChartProps {
  userId: string
  isLoading?: boolean
}

// Custom tooltip component
const CustomTooltip = (props: any) => {
  const { active, payload } = props
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg">
        <p className="font-semibold text-sm mb-2">{data.dateLabel}</p>
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-muted-foreground">Behavioral Score: </span>
            <span className="font-medium">{data.behavioralScore.toFixed(1)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Academic Score: </span>
            <span className="font-medium">{data.academicScore.toFixed(1)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Series Pearson r: </span>
            <span className="font-medium">{data.coefficient.toFixed(3)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Series p-value: </span>
            <span className="font-medium">{data.pValue.toFixed(4)}</span>
          </p>
          <Badge className="bg-primary text-primary-foreground mt-2">
            Sample Size: {data.sampleSize}
          </Badge>
        </div>
      </div>
    )
  }
  return null
}

export function PerformanceCorrelationChart({
  userId,
  isLoading: isLoadingProp = false,
}: PerformanceCorrelationChartProps) {
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCorrelations = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          `/api/analytics/behavioral-insights/correlation?userId=${userId}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch correlation data')
        }

        const json = await response.json()
        if (!json.success) {
          throw new Error(json.error ?? 'Invalid response format')
        }

        const { data } = json as { data: CorrelationData }
        setCorrelationData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCorrelations()
  }, [userId])

  // Empty state
  if (!isLoading && !isLoadingProp && !error && !correlationData) {
    return (
      <Card className="bg-white/80 backdrop-blur-md shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 text-muted-foreground mb-4" />
          <h3 className={`${typography.heading.h3} mb-2`}>No Correlation Data</h3>
          <p className={`${typography.body.base} text-muted-foreground text-center max-w-md`}>
            Complete more study sessions to analyze the relationship between your patterns and
            performance
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
          <div
            className="h-6 rounded w-1/3 mb-2"
            style={{ backgroundColor: 'oklch(0.9 0.02 230)' }}
          />
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: 'oklch(0.92 0.02 230)' }} />
        </CardHeader>
        <CardContent>
          <div className="h-80 rounded" style={{ backgroundColor: 'oklch(0.94 0.02 230)' }} />
        </CardContent>
      </Card>
    )
  }

  const chartData = useMemo<ScatterPoint[]>(() => {
    if (!correlationData) {
      return []
    }

    return correlationData.timeSeriesData.map((point) => {
      const date = new Date(point.date)
      const isValidDate = !Number.isNaN(date.getTime())

      return {
        x: point.behavioralScore,
        y: point.academicScore,
        behavioralScore: point.behavioralScore,
        academicScore: point.academicScore,
        dateLabel: isValidDate ? date.toLocaleDateString() : point.date,
        coefficient: correlationData.coefficient,
        pValue: correlationData.pValue,
        sampleSize: correlationData.dataQuality.sampleSize,
      }
    })
  }, [correlationData])

  if (!correlationData) {
    return null
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm">
      <CardHeader>
        <CardTitle className={typography.heading.h2}>Performance Correlation Analysis</CardTitle>
        <CardDescription className={`${typography.body.base} mt-1`}>
          How your behavioral patterns impact academic performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
            <XAxis
              type="number"
              dataKey="x"
              name="Behavioral Score"
              domain={[0, 100]}
              label={{
                value: 'Behavioral Score',
                position: 'insideBottom',
                offset: -10,
                style: { fill: 'oklch(0.5 0.05 220)' },
              }}
              tick={{ fill: 'oklch(0.5 0.05 220)' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Academic Score"
              domain={[0, 100]}
              label={{
                value: 'Academic Score',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'oklch(0.5 0.05 220)' },
              }}
              tick={{ fill: 'oklch(0.5 0.05 220)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                paddingBottom: '10px',
              }}
            />
            <Scatter
              name={`Pearson r: ${correlationData.coefficient.toFixed(2)} (p = ${correlationData.pValue.toFixed(4)})`}
              data={chartData}
              fill="oklch(0.6 0.12 200)"
              opacity={0.8}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend explanation */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'oklch(0.6 0.12 200)' }}
              />
              <span className="text-muted-foreground">
                Behavioral vs. academic performance scores
              </span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.6 0.12 200)' }}>
                {correlationData.coefficient.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Pearson r</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.5 0.05 220)' }}>
                {correlationData.pValue.toFixed(4)}
              </div>
              <div className="text-sm text-muted-foreground">p-value</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.7 0.15 220)' }}>
                {correlationData.dataQuality.sampleSize}
              </div>
              <div className="text-sm text-muted-foreground">Sample Size</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

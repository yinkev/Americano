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
 * - X-axis: Pattern strength (0-1)
 * - Y-axis: Academic performance change (%)
 * - Color-coded by statistical significance
 * - Interactive tooltips with correlation coefficient and p-value
 */

'use client'

import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
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

interface CorrelationData {
  pattern: string
  academicMetric: string
  correlation: number
  significance: number
  isSignificant: boolean
  sampleSize: number
}

interface PerformanceCorrelationChartProps {
  userId: string | null
  isLoading?: boolean
}

// Pattern type labels for display
const PATTERN_LABELS: Record<string, string> = {
  MORNING_STUDY_PREFERENCE: 'Morning Study',
  OPTIMAL_STUDY_TIME: 'Optimal Time',
  SESSION_DURATION_PREFERENCE: 'Duration',
  CONTENT_TYPE_PREFERENCE: 'Content Type',
  PERFORMANCE_PEAK: 'Peak Time',
  ATTENTION_CYCLE: 'Attention',
  FORGETTING_CURVE: 'Retention',
}

// Transform data for scatter plot
const transformData = (correlations: CorrelationData[]) => {
  return correlations.map((item) => ({
    x: Math.abs(item.correlation), // Pattern strength (absolute correlation)
    y: item.correlation * 100, // Performance change %
    name: PATTERN_LABELS[item.pattern] || item.pattern,
    correlation: item.correlation,
    pValue: item.significance,
    isSignificant: item.isSignificant,
    sampleSize: item.sampleSize,
  }))
}

// Custom tooltip component
const CustomTooltip = (props: any) => {
  const { active, payload } = props
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-lg p-4 shadow-lg">
        <p className="font-semibold text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <p>
            <span className="text-muted-foreground">Correlation: </span>
            <span className="font-medium">{data.correlation.toFixed(3)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Performance Impact: </span>
            <span className="font-medium">
              {data.y > 0 ? '+' : ''}
              {data.y.toFixed(1)}%
            </span>
          </p>
          <p>
            <span className="text-muted-foreground">p-value: </span>
            <span className="font-medium">{data.pValue.toFixed(4)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Sample Size: </span>
            <span className="font-medium">{data.sampleSize}</span>
          </p>
          <Badge
            className={
              data.isSignificant ? 'bg-green-600 text-white mt-2' : 'bg-gray-500 text-white mt-2'
            }
          >
            {data.isSignificant ? 'Statistically Significant' : 'Not Significant'}
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
  const [correlations, setCorrelations] = useState<CorrelationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setCorrelations([])
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

        const data = await response.json()
        if (!isMounted) {
          return
        }

        if (data.success && data.correlations) {
          setCorrelations(data.correlations)
        } else {
          throw new Error('Invalid response format')
        }
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

  // Empty state
  if (!isLoading && !isLoadingProp && correlations.length === 0 && !error) {
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

  const chartData = transformData(correlations)
  const significantData = chartData.filter((d) => d.isSignificant)
  const nonSignificantData = chartData.filter((d) => !d.isSignificant)

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
              name="Pattern Strength"
              domain={[0, 1]}
              label={{
                value: 'Pattern Strength',
                position: 'insideBottom',
                offset: -10,
                style: { fill: 'oklch(0.5 0.05 220)' },
              }}
              tick={{ fill: 'oklch(0.5 0.05 220)' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Performance Impact"
              label={{
                value: 'Performance Change (%)',
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
              name="Statistically Significant"
              data={significantData}
              fill="oklch(0.7 0.15 140)"
              opacity={0.8}
            />
            <Scatter
              name="Not Significant"
              data={nonSignificantData}
              fill="oklch(0.5 0.05 220)"
              opacity={0.4}
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Legend explanation */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'oklch(0.7 0.15 140)' }}
              />
              <span className="text-muted-foreground">
                Significant (p &lt; 0.05): Strong evidence of impact
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'oklch(0.5 0.05 220)', opacity: 0.4 }}
              />
              <span className="text-muted-foreground">
                Not Significant (p ≥ 0.05): Insufficient evidence
              </span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.7 0.15 140)' }}>
                {significantData.length}
              </div>
              <div className="text-sm text-muted-foreground">Significant Patterns</div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.5 0.05 220)' }}>
                {correlations.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Patterns</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold" style={{ color: 'oklch(0.7 0.15 220)' }}>
                {significantData.length > 0
                  ? Math.round(
                      (significantData.reduce((sum, d) => sum + Math.abs(d.y), 0) /
                        significantData.length) *
                        10,
                    ) / 10
                  : 0}
                %
              </div>
              <div className="text-sm text-muted-foreground">Avg. Impact</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

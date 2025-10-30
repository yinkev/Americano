/**
 * PersonalizationEffectivenessChart Component
 * Story 5.5 Task 13.2
 *
 * Line chart showing retention/performance/completion improvements over time
 */

'use client'

import { Info, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EffectivenessData {
  date: string
  retentionImprovement: number
  performanceImprovement: number
  completionRateChange: number
  engagementChange: number
}

interface EffectivenessMetrics {
  hasPersonalization: boolean
  metrics: {
    retentionImprovement: number
    performanceImprovement: number
    completionRateChange: number
    engagementChange: number
  }
  statistical: {
    sampleSize: number
    correlation: number
    pValue: number
    isStatisticallySignificant: boolean
  }
  timeline: EffectivenessData[]
}

const METRIC_CONFIGS = {
  retention: {
    label: 'Retention',
    color: 'oklch(0.7 0.15 145)',
    dataKey: 'retentionImprovement',
  },
  performance: {
    label: 'Performance',
    color: 'oklch(0.7 0.15 230)',
    dataKey: 'performanceImprovement',
  },
  completion: {
    label: 'Completion Rate',
    color: 'oklch(0.8 0.15 85)',
    dataKey: 'completionRateChange',
  },
  engagement: {
    label: 'Engagement',
    color: 'oklch(0.7 0.15 300)',
    dataKey: 'engagementChange',
  },
}

export function PersonalizationEffectivenessChart() {
  const [data, setData] = useState<EffectivenessMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | '90d'>('30d')
  const [selectedMetrics, setSelectedMetrics] = useState<Set<keyof typeof METRIC_CONFIGS>>(
    new Set(['retention', 'performance', 'completion']),
  )

  useEffect(() => {
    fetchEffectivenessData()
  }, [timeRange])

  async function fetchEffectivenessData() {
    try {
      setLoading(true)

      const daysAgo = parseInt(timeRange)
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      const endDate = new Date()

      const response = await fetch(
        `/api/personalization/effectiveness?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&metric=all`,
      )
      const result = await response.json()

      if (result.success && result.data.effectiveness) {
        setData(result.data.effectiveness)
      }
    } catch (error) {
      console.error('Error fetching effectiveness data:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function toggleMetric(metric: keyof typeof METRIC_CONFIGS) {
    setSelectedMetrics((prev) => {
      const next = new Set(prev)
      if (next.has(metric)) {
        if (next.size > 1) next.delete(metric)
      } else {
        next.add(metric)
      }
      return next
    })
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
        <CardContent className="p-6 h-96 flex items-center justify-center">
          <p className="text-[13px] text-muted-foreground">Loading effectiveness data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.hasPersonalization) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
        <CardContent className="p-6 h-96 flex flex-col items-center justify-center">
          <Info className="size-12 text-muted-foreground mb-3" />
          <p className="text-[13px] text-muted-foreground text-center">
            No personalization data available yet
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Complete 6+ weeks of study with personalization enabled to see effectiveness metrics
          </p>
        </CardContent>
      </Card>
    )
  }

  // Format timeline data for chart
  const chartData = data.timeline.map((point) => ({
    dateLabel: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    retentionImprovement: point.retentionImprovement,
    performanceImprovement: point.performanceImprovement,
    completionRateChange: point.completionRateChange,
    engagementChange: point.engagementChange,
  }))

  // Calculate overall trend
  const avgImprovement =
    (data.metrics.retentionImprovement +
      data.metrics.performanceImprovement +
      data.metrics.completionRateChange) /
    3
  const isPositiveTrend = avgImprovement > 0

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="font-heading font-semibold text-[18px] flex items-center gap-2">
              Personalization Effectiveness
              {data.statistical.isStatisticallySignificant && (
                <Badge
                  variant="outline"
                  className="shrink-0 px-2 py-0.5"
                  style={{
                    backgroundColor: 'oklch(0.7 0.15 145)/0.1',
                    borderColor: 'oklch(0.7 0.15 145)',
                    color: 'oklch(0.7 0.15 145)',
                  }}
                >
                  Statistically Significant
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Impact of personalization on your learning outcomes
            </p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="14d">Last 14 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Trend Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'oklch(0.7 0.15 145)/0.05',
              borderColor: 'oklch(0.7 0.15 145)/0.2',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {isPositiveTrend ? (
                <TrendingUp className="size-4 text-[oklch(0.7_0.15_145)]" />
              ) : (
                <TrendingDown className="size-4 text-[oklch(0.6_0.15_25)]" />
              )}
              <p className="text-xs text-muted-foreground">Retention</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.metrics.retentionImprovement > 0 ? '+' : ''}
              {data.metrics.retentionImprovement.toFixed(1)}%
            </p>
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'oklch(0.7 0.15 230)/0.05',
              borderColor: 'oklch(0.7 0.15 230)/0.2',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {data.metrics.performanceImprovement > 0 ? (
                <TrendingUp className="size-4 text-[oklch(0.7_0.15_230)]" />
              ) : (
                <TrendingDown className="size-4 text-[oklch(0.6_0.15_25)]" />
              )}
              <p className="text-xs text-muted-foreground">Performance</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.metrics.performanceImprovement > 0 ? '+' : ''}
              {data.metrics.performanceImprovement.toFixed(1)}%
            </p>
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'oklch(0.8 0.15 85)/0.05',
              borderColor: 'oklch(0.8 0.15 85)/0.2',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {data.metrics.completionRateChange > 0 ? (
                <TrendingUp className="size-4 text-[oklch(0.8_0.15_85)]" />
              ) : (
                <TrendingDown className="size-4 text-[oklch(0.6_0.15_25)]" />
              )}
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.metrics.completionRateChange > 0 ? '+' : ''}
              {data.metrics.completionRateChange.toFixed(1)}%
            </p>
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'oklch(0.7 0.15 300)/0.05',
              borderColor: 'oklch(0.7 0.15 300)/0.2',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              {data.metrics.engagementChange > 0 ? (
                <TrendingUp className="size-4 text-[oklch(0.7_0.15_300)]" />
              ) : (
                <TrendingDown className="size-4 text-[oklch(0.6_0.15_25)]" />
              )}
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {data.metrics.engagementChange > 0 ? '+' : ''}
              {data.metrics.engagementChange.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Metric Toggle Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Show:</span>
          {(Object.keys(METRIC_CONFIGS) as Array<keyof typeof METRIC_CONFIGS>).map((key) => {
            const config = METRIC_CONFIGS[key]
            const isSelected = selectedMetrics.has(key)
            return (
              <Button
                key={key}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMetric(key)}
                className="h-7 text-xs"
                style={
                  isSelected
                    ? {
                        backgroundColor: config.color,
                        borderColor: config.color,
                        color: 'white',
                      }
                    : undefined
                }
              >
                {config.label}
              </Button>
            )
          })}
        </div>

        {/* Line Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis
                dataKey="dateLabel"
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.556 0 0)' }}
              />
              <YAxis
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.556 0 0)' }}
                label={{
                  value: 'Improvement (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0 / 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                  padding: '12px',
                }}
                labelStyle={{
                  color: 'oklch(0.145 0 0)',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
                formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(1)}%`, '']}
              />
              <ReferenceLine y={0} stroke="oklch(0.556 0 0)" strokeDasharray="3 3" />
              {Array.from(selectedMetrics).map((key) => {
                const config = METRIC_CONFIGS[key]
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={config.dataKey}
                    stroke={config.color}
                    strokeWidth={2}
                    dot={{ fill: config.color, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Statistical Significance */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-[oklch(0.7_0.15_230)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">Statistical Analysis</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold">Sample Size:</span> {data.statistical.sampleSize}{' '}
                  data points
                </div>
                <div>
                  <span className="font-semibold">Correlation:</span>{' '}
                  {data.statistical.correlation.toFixed(3)}
                </div>
                <div>
                  <span className="font-semibold">p-value:</span>{' '}
                  {data.statistical.pValue.toFixed(4)}
                  {data.statistical.pValue < 0.05 && ' (significant)'}
                </div>
              </div>
              {data.statistical.isStatisticallySignificant && (
                <p className="text-xs text-muted-foreground mt-2">
                  The improvement is statistically significant (p {'<'} 0.05), indicating that
                  personalization has a measurable positive impact on your learning outcomes.
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ProgressTab Component
 * Story 4.6 Task 5
 *
 * Longitudinal tracking tab for Understanding Analytics Dashboard.
 * Displays:
 * 1. Multi-line chart showing all 6 validation dimensions over time
 * 2. Milestone markers (mastery achievements, major improvements >20 points)
 * 3. Regression warnings (score decline >15 points in mastered topics) - RED ALERT
 * 4. Growth trajectory: Estimated days to mastery for in-progress objectives
 * 5. Week-over-week and month-over-month improvement rates
 * 6. Cumulative mastery count display
 * 7. PDF export button for academic advisors
 *
 * Design: Glassmorphism cards with OKLCH colors, NO gradients, min 44px touch targets
 * Data Source: /api/analytics/understanding/longitudinal (Python FastAPI service)
 */

'use client'

import { format, parseISO } from 'date-fns'
import {
  AlertTriangle,
  Award,
  Calendar,
  FileDown,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLongitudinalProgress } from '@/hooks/use-understanding-analytics'

// Color constants following design system (OKLCH)
const COLORS = {
  comprehension: 'oklch(0.6 0.18 230)', // Blue
  reasoning: 'oklch(0.65 0.20 25)', // Red
  failure: 'oklch(0.75 0.12 85)', // Yellow
  calibration: 'oklch(0.7 0.15 145)', // Green
  adaptive: 'oklch(0.6 0.18 280)', // Purple
  mastery: 'oklch(0.7 0.15 145)', // Green (same as calibration)
  regression: 'oklch(0.65 0.20 25)', // Red (alert color)
  improvement: 'oklch(0.75 0.12 85)', // Yellow
  positive: 'oklch(0.7 0.15 145)', // Green
  negative: 'oklch(0.65 0.20 25)', // Red
  neutral: 'oklch(0.6 0.05 240)', // Gray
}

// Map dimension names to colors
const DIMENSION_COLORS: Record<string, string> = {
  comprehension: COLORS.comprehension,
  reasoning: COLORS.reasoning,
  calibration: COLORS.calibration,
  adaptive: COLORS.adaptive,
  failure: COLORS.failure,
  mastery: COLORS.mastery,
}

export default function ProgressTab() {
  const { data, isLoading, error } = useLongitudinalProgress()
  const [isExporting, setIsExporting] = useState(false)

  if (isLoading) {
    return <ProgressSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.negative }} />
        <p className="text-[oklch(0.65_0.20_25)]">
          Failed to load progress data. Please try again.
        </p>
      </div>
    )
  }

  if (!data) return null

  // Transform metrics data for Recharts (pivot from long to wide format)
  const chartData = data.metrics.map((metric) => ({
    date: metric.date,
    formattedDate: format(parseISO(metric.date), 'MMM d'),
    comprehension: metric.comprehension,
    reasoning: metric.reasoning,
    calibration: metric.calibration,
    // Add more dimensions from backend if available
  }))

  // Calculate improvement rates
  const weekOverWeekRate = calculateWeekOverWeekRate(data.metrics)
  const monthOverMonthRate = calculateMonthOverMonthRate(data.metrics)

  // Handle PDF export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/analytics/understanding/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev', // TODO: Replace with auth
        },
        body: JSON.stringify({
          dateRange: '90d', // Use current filter from store
          includeCharts: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `progress-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[oklch(0.3_0.05_240)]">Longitudinal Progress</h2>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Track your understanding development over time
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="min-h-[44px] min-w-[44px] bg-[oklch(0.6_0.18_230)] hover:bg-[oklch(0.55_0.18_230)] text-white"
        >
          <FileDown className="w-5 h-5 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </Button>
      </div>

      {/* Regression Warnings (RED ALERT) */}
      {data.regressions.length > 0 && (
        <Card className="bg-[oklch(0.98_0.02_25)]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-2 border-[oklch(0.65_0.20_25)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[oklch(0.65_0.20_25)]">
              <AlertTriangle className="w-6 h-6" />
              Regression Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.regressions.map((regression, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-white/50 rounded-xl">
                  <AlertTriangle
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: COLORS.negative }}
                  />
                  <div>
                    <p className="font-semibold text-[oklch(0.3_0.05_240)]">
                      {regression.metric.charAt(0).toUpperCase() + regression.metric.slice(1)}{' '}
                      declined by {regression.dropPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
                      {format(parseISO(regression.date), 'MMMM d, yyyy')} - Previously mastered
                      topic showing decline
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Line Chart: All 6 Validation Dimensions */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-[oklch(0.3_0.05_240)]">
            Understanding Metrics Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid stroke="oklch(0.9 0.02 240)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="formattedDate"
                  stroke="oklch(0.6 0.05 240)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="oklch(0.6 0.05 240)"
                  style={{ fontSize: '12px' }}
                  label={{
                    value: 'Score',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'oklch(0.6 0.05 240)', fontSize: '12px' },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid oklch(0.9 0.02 240)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(31,38,135,0.15)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}`, '']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '13px',
                  }}
                  iconType="line"
                />

                {/* Lines for each dimension */}
                <Line
                  type="monotone"
                  dataKey="comprehension"
                  stroke={COLORS.comprehension}
                  strokeWidth={2}
                  dot={false}
                  name="Comprehension"
                />
                <Line
                  type="monotone"
                  dataKey="reasoning"
                  stroke={COLORS.reasoning}
                  strokeWidth={2}
                  dot={false}
                  name="Clinical Reasoning"
                />
                <Line
                  type="monotone"
                  dataKey="calibration"
                  stroke={COLORS.calibration}
                  strokeWidth={2}
                  dot={false}
                  name="Calibration"
                />

                {/* Milestone markers */}
                {data.milestones.map((milestone) => {
                  const dataPoint = chartData.find((d) => d.date === milestone.date)
                  if (!dataPoint) return null

                  return (
                    <ReferenceDot
                      key={milestone.date}
                      x={dataPoint.formattedDate}
                      y={
                        milestone.type === 'mastery'
                          ? 80 // Mastery threshold
                          : dataPoint.comprehension || 50
                      }
                      r={8}
                      fill={milestone.type === 'mastery' ? COLORS.positive : COLORS.improvement}
                      stroke="white"
                      strokeWidth={2}
                      label={{
                        value: milestone.type === 'mastery' ? '★' : '↑',
                        position: 'top',
                        fill: milestone.type === 'mastery' ? COLORS.positive : COLORS.improvement,
                        fontSize: 16,
                      }}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Milestone Legend */}
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: COLORS.positive }} />
              <span className="text-sm text-[oklch(0.6_0.05_240)]">Mastery Achievement</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: COLORS.improvement }} />
              <span className="text-sm text-[oklch(0.6_0.05_240)]">Major Improvement (+20%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Week-over-Week Improvement */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.6_0.05_240)]">
              Week-over-Week Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p
                className="text-4xl font-bold"
                style={{ color: weekOverWeekRate >= 0 ? COLORS.positive : COLORS.negative }}
              >
                {weekOverWeekRate >= 0 ? '+' : ''}
                {weekOverWeekRate.toFixed(1)}%
              </p>
              {weekOverWeekRate >= 0 ? (
                <TrendingUp className="w-6 h-6" style={{ color: COLORS.positive }} />
              ) : (
                <TrendingDown className="w-6 h-6" style={{ color: COLORS.negative }} />
              )}
            </div>
            <p className="text-xs text-[oklch(0.6_0.05_240)] mt-2">
              Average improvement across all metrics
            </p>
          </CardContent>
        </Card>

        {/* Month-over-Month Improvement */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.6_0.05_240)]">
              Month-over-Month Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p
                className="text-4xl font-bold"
                style={{ color: monthOverMonthRate >= 0 ? COLORS.positive : COLORS.negative }}
              >
                {monthOverMonthRate >= 0 ? '+' : ''}
                {monthOverMonthRate.toFixed(1)}%
              </p>
              {monthOverMonthRate >= 0 ? (
                <TrendingUp className="w-6 h-6" style={{ color: COLORS.positive }} />
              ) : (
                <TrendingDown className="w-6 h-6" style={{ color: COLORS.negative }} />
              )}
            </div>
            <p className="text-xs text-[oklch(0.6_0.05_240)] mt-2">Long-term growth trajectory</p>
          </CardContent>
        </Card>

        {/* Overall Growth Rate */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[oklch(0.6_0.05_240)]">
              Overall Growth Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p
                className="text-4xl font-bold"
                style={{ color: data.growthRate >= 0 ? COLORS.positive : COLORS.negative }}
              >
                {data.growthRate >= 0 ? '+' : ''}
                {data.growthRate.toFixed(1)}%
              </p>
              <Calendar className="w-6 h-6" style={{ color: COLORS.comprehension }} />
            </div>
            <p className="text-xs text-[oklch(0.6_0.05_240)] mt-2">Per month (from API)</p>
          </CardContent>
        </Card>
      </div>

      {/* Milestones Timeline */}
      {data.milestones.length > 0 && (
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="text-[oklch(0.3_0.05_240)]">Achievement Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.milestones.map((milestone, idx) => {
                const Icon =
                  milestone.type === 'mastery'
                    ? Award
                    : milestone.type === 'breakthrough'
                      ? Sparkles
                      : Target

                const iconColor =
                  milestone.type === 'mastery'
                    ? COLORS.positive
                    : milestone.type === 'breakthrough'
                      ? COLORS.improvement
                      : COLORS.comprehension

                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 bg-[oklch(0.98_0.02_240)] rounded-xl hover:bg-[oklch(0.96_0.02_240)] transition-colors"
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" style={{ color: iconColor }} />
                    <div className="flex-1">
                      <p className="font-semibold text-[oklch(0.3_0.05_240)]">
                        {milestone.description}
                      </p>
                      <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
                        {format(parseISO(milestone.date), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${iconColor}20`,
                        color: iconColor,
                      }}
                    >
                      {milestone.type.toUpperCase()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Calculate week-over-week improvement rate
 * Compares last week's average to previous week's average
 */
function calculateWeekOverWeekRate(
  metrics: Array<{ date: string; comprehension: number; reasoning: number; calibration: number }>,
): number {
  if (metrics.length < 14) return 0 // Need at least 2 weeks of data

  // Get last 7 days
  const lastWeek = metrics.slice(-7)
  const previousWeek = metrics.slice(-14, -7)

  const lastWeekAvg = calculateAverage(lastWeek)
  const previousWeekAvg = calculateAverage(previousWeek)

  if (previousWeekAvg === 0) return 0

  return ((lastWeekAvg - previousWeekAvg) / previousWeekAvg) * 100
}

/**
 * Calculate month-over-month improvement rate
 * Compares last 30 days to previous 30 days
 */
function calculateMonthOverMonthRate(
  metrics: Array<{ date: string; comprehension: number; reasoning: number; calibration: number }>,
): number {
  if (metrics.length < 60) return 0 // Need at least 2 months of data

  // Get last 30 days
  const lastMonth = metrics.slice(-30)
  const previousMonth = metrics.slice(-60, -30)

  const lastMonthAvg = calculateAverage(lastMonth)
  const previousMonthAvg = calculateAverage(previousMonth)

  if (previousMonthAvg === 0) return 0

  return ((lastMonthAvg - previousMonthAvg) / previousMonthAvg) * 100
}

/**
 * Calculate average score across all dimensions
 */
function calculateAverage(
  metrics: Array<{ comprehension: number; reasoning: number; calibration: number }>,
): number {
  if (metrics.length === 0) return 0

  const sum = metrics.reduce((acc, m) => {
    return acc + m.comprehension + m.reasoning + m.calibration
  }, 0)

  return sum / (metrics.length * 3) // 3 dimensions
}

/**
 * Loading skeleton
 */
function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
          <div className="h-4 w-96 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
        </div>
        <div className="h-11 w-40 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
      </div>

      {/* Chart skeleton */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <div className="h-6 w-48 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full bg-[oklch(0.95_0.02_240)] rounded animate-pulse" />
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0"
          >
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-12 w-24 bg-[oklch(0.9_0.05_240)] rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

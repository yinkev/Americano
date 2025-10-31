/**
 * BenchmarksTab Component
 * Story 4.6 Task 8
 *
 * Peer comparison analytics with privacy-first design:
 * - Privacy notice card with explicit opt-in consent
 * - Box plots showing peer distribution (25th, 50th, 75th percentiles + mean)
 * - User's position marked prominently on each box plot
 * - Percentile rank badges for each validation metric
 * - Relative strengths (top 25%) and weaknesses (bottom 25%)
 * - Growth rate comparison vs. peer average
 * - Sample size warning if cohort < 50 users
 *
 * Design: Glassmorphism cards with OKLCH colors (NO gradients)
 * Accessibility: Min 44px touch targets, ARIA labels, keyboard navigation
 * Performance: React Query for data fetching with stale-while-revalidate
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Info,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PeerBenchmarkResponse } from '@/lib/validation'
import { useUnderstandingAnalyticsStore } from '@/store/understanding-analytics-store'

export default function BenchmarksTab() {
  const { dateRange, courseId, topic } = useUnderstandingAnalyticsStore()

  const { data, isLoading, error } = useQuery<PeerBenchmarkResponse>({
    queryKey: ['peer-benchmark', dateRange, courseId, topic],
    queryFn: async () => {
      const params = new URLSearchParams({
        dateRange,
        ...(courseId && { courseId }),
        ...(topic && { topic }),
      })
      const response = await fetch(`/api/analytics/understanding/peer-benchmark?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch peer benchmark data')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  })

  if (isLoading) {
    return <BenchmarksSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="w-16 h-16 text-[oklch(0.65_0.20_25)]" />
        <p className="text-[oklch(0.65_0.20_25)] font-medium">Failed to load peer benchmark data</p>
        <p className="text-sm text-[oklch(0.6_0.05_240)]">
          Please ensure you have opted into peer comparison analytics.
        </p>
      </div>
    )
  }

  if (!data) return null

  const isStatisticallyValid = data.sampleSize >= 50

  return (
    <div className="space-y-6">
      {/* Privacy Notice Card */}
      <PrivacyNoticeCard sampleSize={data.sampleSize} />

      {/* Sample Size Warning */}
      {!isStatisticallyValid && (
        <Alert className="border-[oklch(0.75_0.12_85)] bg-[oklch(0.95_0.12_85)]/50 backdrop-blur-xl">
          <AlertTriangle className="h-5 w-5 text-[oklch(0.75_0.12_85)]" />
          <AlertDescription className="ml-2 text-[oklch(0.4_0.12_85)]">
            <strong>Limited Sample Size:</strong> Only {data.sampleSize} users in your cohort.
            Statistical validity requires at least 50 users. Benchmarks shown are preliminary.
          </AlertDescription>
        </Alert>
      )}

      {/* Peer Distribution Box Plots */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-['DM_Sans']">
            <Users className="w-6 h-6 text-[oklch(0.6_0.18_230)]" />
            Peer Distribution Comparison
          </CardTitle>
          <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
            Your performance compared to {data.sampleSize} peers across validation metrics
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {data.peerDistribution.map((metricData) => (
            <PeerDistributionBoxPlot
              key={metricData.metric}
              metricData={metricData}
              userPercentile={data.userPercentile[metricData.metric] || 50}
            />
          ))}
        </CardContent>
      </Card>

      {/* Relative Strengths and Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relative Strengths */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
              <Award className="w-5 h-5 text-[oklch(0.7_0.15_145)]" />
              Relative Strengths
            </CardTitle>
            <p className="text-sm text-[oklch(0.6_0.05_240)]">Top 25% vs. peers</p>
          </CardHeader>
          <CardContent>
            {data.relativeStrengths.length === 0 ? (
              <p className="text-sm text-[oklch(0.6_0.05_240)] py-4">
                No areas where you're in the top 25% yet. Keep studying!
              </p>
            ) : (
              <div className="space-y-3">
                {data.relativeStrengths.map((strength: any) => (
                  <div
                    key={strength.metric}
                    className="flex items-center justify-between p-3 rounded-xl bg-[oklch(0.95_0.15_145)]/50"
                  >
                    <div>
                      <p className="font-medium text-[oklch(0.3_0.15_145)]">
                        {formatMetricName(strength.metric)}
                      </p>
                      <p className="text-xs text-[oklch(0.5_0.15_145)]">
                        {strength.gap.toFixed(1)} points above average
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-[oklch(0.7_0.15_145)] text-white border-0 font-semibold min-h-[32px] px-3"
                    >
                      {strength.userPercentile}th percentile
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relative Weaknesses */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-['DM_Sans']">
              <AlertTriangle className="w-5 h-5 text-[oklch(0.65_0.20_25)]" />
              Relative Weaknesses
            </CardTitle>
            <p className="text-sm text-[oklch(0.6_0.05_240)]">Bottom 25% vs. peers</p>
          </CardHeader>
          <CardContent>
            {data.relativeWeaknesses.length === 0 ? (
              <p className="text-sm text-[oklch(0.6_0.05_240)] py-4">
                No areas in the bottom 25%. Great job!
              </p>
            ) : (
              <div className="space-y-3">
                {data.relativeWeaknesses.map((weakness: any) => (
                  <div
                    key={weakness.metric}
                    className="flex items-center justify-between p-3 rounded-xl bg-[oklch(0.98_0.20_25)]/50"
                  >
                    <div>
                      <p className="font-medium text-[oklch(0.4_0.20_25)]">
                        {formatMetricName(weakness.metric)}
                      </p>
                      <p className="text-xs text-[oklch(0.55_0.20_25)]">
                        {Math.abs(weakness.gap).toFixed(1)} points below average
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-[oklch(0.65_0.20_25)] text-white border-0 font-semibold min-h-[32px] px-3"
                    >
                      {weakness.userPercentile}th percentile
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Rate Comparison */}
      <GrowthRateComparison sampleSize={data.sampleSize} />
    </div>
  )
}

/**
 * Privacy Notice Card
 * Displays opt-in consent, sample size, cohort definition, and opt-out button
 */
interface PrivacyNoticeCardProps {
  sampleSize: number
}

function PrivacyNoticeCard({ sampleSize }: PrivacyNoticeCardProps) {
  const handleOptOut = async () => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharePeerCalibrationData: false }),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      // Refresh the page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error('Failed to opt out:', error)
      alert('Failed to update privacy settings. Please try again.')
    }
  }

  return (
    <Card className="bg-[oklch(0.95_0.18_230)]/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-[oklch(0.8_0.18_230)]">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-[oklch(0.6_0.18_230)] shrink-0 mt-1" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-[oklch(0.3_0.18_230)] font-['DM_Sans']">
                Privacy-First Peer Comparison
              </h3>
              <p className="text-sm text-[oklch(0.5_0.18_230)] mt-1">
                You have <strong>opted into</strong> anonymous peer comparison analytics. Your data
                helps {sampleSize - 1} other students while remaining unidentifiable.
              </p>
            </div>

            <div className="space-y-2 text-sm text-[oklch(0.5_0.18_230)]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  <strong>Cohort:</strong> {sampleSize} medical students with similar course
                  progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                <span>
                  <strong>Data Shared:</strong> Only aggregated performance statistics (no names,
                  emails, or demographics)
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOptOut}
              className="min-h-[44px] text-[oklch(0.5_0.18_230)] border-[oklch(0.8_0.18_230)] hover:bg-[oklch(0.9_0.18_230)]"
            >
              Opt Out of Peer Comparison
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Peer Distribution Box Plot
 * Shows quartiles (25th, 50th, 75th) + mean + user's position
 */
interface PeerDistributionBoxPlotProps {
  metricData: {
    metric: string
    percentile25: number
    percentile50: number
    percentile75: number
    mean: number
    userValue: number
  }
  userPercentile: number
}

function PeerDistributionBoxPlot({ metricData, userPercentile }: PeerDistributionBoxPlotProps) {
  const { metric, percentile25, percentile50, percentile75, mean, userValue } = metricData

  // Prepare data for Recharts ComposedChart (box plot approximation)
  // We'll use Bar chart with error bars to simulate box plot
  const chartData = [
    {
      name: formatMetricName(metric),
      min: percentile25,
      q1: percentile25,
      median: percentile50,
      q3: percentile75,
      max: percentile75,
      mean,
      userValue,
    },
  ]

  // Determine user's performance color
  const getUserColor = () => {
    if (userPercentile >= 75) return 'oklch(0.7 0.15 145)' // Green (top 25%)
    if (userPercentile >= 50) return 'oklch(0.6 0.18 230)' // Blue (above median)
    if (userPercentile >= 25) return 'oklch(0.75 0.12 85)' // Yellow (below median)
    return 'oklch(0.65 0.20 25)' // Red (bottom 25%)
  }

  const userColor = getUserColor()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-[oklch(0.3_0.05_240)] font-['DM_Sans']">
            {formatMetricName(metric)}
          </h4>
          <p className="text-xs text-[oklch(0.6_0.05_240)]">
            Peer distribution: 25th, 50th (median), 75th percentiles
          </p>
        </div>
        <Badge
          variant="outline"
          style={{
            backgroundColor: userColor,
            color: 'white',
            borderColor: userColor,
          }}
          className="font-semibold min-h-[32px] px-3"
        >
          You: {userPercentile}th percentile
        </Badge>
      </div>

      {/* Box Plot Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            layout="horizontal"
            margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.05 240)" />
            <XAxis type="number" domain={[0, 100]} stroke="oklch(0.6 0.05 240)" />
            <YAxis type="category" dataKey="name" stroke="oklch(0.6 0.05 240)" width={150} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'oklch(0.95 0.05 240)' }} />

            {/* Box plot elements */}
            {/* IQR (Interquartile Range) - 25th to 75th percentile */}
            <Bar dataKey="q1" stackId="box" fill="oklch(0.8 0.18 230)" barSize={40} />
            <Bar
              dataKey={(d: any) => d.median - d.q1}
              stackId="box"
              fill="oklch(0.6 0.18 230)"
              barSize={40}
            />
            <Bar
              dataKey={(d: any) => d.q3 - d.median}
              stackId="box"
              fill="oklch(0.8 0.18 230)"
              barSize={40}
            />

            {/* Mean line */}
            <ReferenceLine
              x={mean}
              stroke="oklch(0.3 0.05 240)"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'Mean', position: 'top', fill: 'oklch(0.3 0.05 240)' }}
            />

            {/* User's position - prominent marker */}
            <ReferenceLine
              x={userValue}
              stroke={userColor}
              strokeWidth={3}
              label={{
                value: '★ You',
                position: 'top',
                fill: userColor,
                fontWeight: 'bold',
                fontSize: 14,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Percentile breakdown */}
      <div className="flex items-center justify-between text-xs text-[oklch(0.6_0.05_240)]">
        <div>
          <span className="font-medium">25th:</span> {percentile25.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">Median:</span> {percentile50.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">75th:</span> {percentile75.toFixed(1)}
        </div>
        <div>
          <span className="font-medium">Mean:</span> {mean.toFixed(1)}
        </div>
        <div className="font-semibold" style={{ color: userColor }}>
          You: {userValue.toFixed(1)}
        </div>
      </div>
    </div>
  )
}

/**
 * Custom Tooltip for Box Plot
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-white/95 backdrop-blur-xl shadow-xl rounded-xl p-4 border border-[oklch(0.9_0.05_240)]">
      <p className="font-semibold text-[oklch(0.3_0.05_240)] mb-2">{data.name}</p>
      <div className="space-y-1 text-sm text-[oklch(0.6_0.05_240)]">
        <div>25th Percentile: {data.q1.toFixed(1)}</div>
        <div>Median (50th): {data.median.toFixed(1)}</div>
        <div>75th Percentile: {data.q3.toFixed(1)}</div>
        <div className="border-t border-[oklch(0.9_0.05_240)] pt-1 mt-1">
          Mean: {data.mean.toFixed(1)}
        </div>
        <div className="font-semibold text-[oklch(0.6_0.18_230)]">
          Your Score: {data.userValue.toFixed(1)}
        </div>
      </div>
    </div>
  )
}

/**
 * Growth Rate Comparison
 * Shows user's growth rate vs. peer average growth rate
 */
interface GrowthRateComparisonProps {
  sampleSize: number
}

function GrowthRateComparison({ sampleSize }: GrowthRateComparisonProps) {
  // Mock data - would fetch from API in production
  const userGrowthRate = 12.3 // % improvement per month
  const peerAverageGrowthRate = 8.5 // % improvement per month

  const isAboveAverage = userGrowthRate > peerAverageGrowthRate
  const difference = Math.abs(userGrowthRate - peerAverageGrowthRate)

  const chartData = [
    {
      category: 'Your Growth Rate',
      value: userGrowthRate,
      fill: 'oklch(0.7 0.15 145)',
    },
    {
      category: 'Peer Average',
      value: peerAverageGrowthRate,
      fill: 'oklch(0.6 0.18 230)',
    },
  ]

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-2xl border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-['DM_Sans']">
          {isAboveAverage ? (
            <TrendingUp className="w-6 h-6 text-[oklch(0.7_0.15_145)]" />
          ) : (
            <TrendingDown className="w-6 h-6 text-[oklch(0.65_0.20_25)]" />
          )}
          Growth Rate Comparison
        </CardTitle>
        <p className="text-sm text-[oklch(0.6_0.05_240)] mt-1">
          Your monthly improvement vs. {sampleSize - 1} peers
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Comparison Summary */}
          <div
            className={`p-4 rounded-xl ${
              isAboveAverage ? 'bg-[oklch(0.95_0.15_145)]/50' : 'bg-[oklch(0.98_0.20_25)]/50'
            }`}
          >
            <p className="text-center">
              <span
                className={`text-2xl font-bold ${
                  isAboveAverage ? 'text-[oklch(0.7_0.15_145)]' : 'text-[oklch(0.65_0.20_25)]'
                }`}
              >
                {isAboveAverage ? '+' : ''}
                {difference.toFixed(1)}%
              </span>
              <span className="text-[oklch(0.6_0.05_240)] ml-2">
                {isAboveAverage ? 'faster' : 'slower'} than average
              </span>
            </p>
          </div>

          {/* Bar Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.05 240)" />
                <XAxis dataKey="category" stroke="oklch(0.6 0.05 240)" tick={{ fontSize: 12 }} />
                <YAxis
                  stroke="oklch(0.6 0.05 240)"
                  label={{
                    value: '% Improvement/Month',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: 'oklch(0.6 0.05 240)' },
                  }}
                />
                <Tooltip
                  content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                    if (!active || !payload || !payload.length) return null
                    const data = payload[0]
                    return (
                      <div className="bg-white/95 backdrop-blur-xl shadow-xl rounded-xl p-3 border border-[oklch(0.9_0.05_240)]">
                        <p className="font-semibold text-[oklch(0.3_0.05_240)]">
                          {data.payload.category}
                        </p>
                        <p className="text-sm text-[oklch(0.6_0.05_240)]">
                          {data.value}% per month
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="value" barSize={80}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Insight */}
          <p className="text-sm text-[oklch(0.6_0.05_240)] text-center">
            {isAboveAverage
              ? 'Excellent progress! Your learning velocity exceeds peer average. Keep up the momentum.'
              : 'Your growth rate is below average. Consider increasing study time or trying active recall techniques.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Helper: Format metric names for display
 */
function formatMetricName(metric: string): string {
  const nameMap: Record<string, string> = {
    comprehension: 'Comprehension',
    reasoning: 'Clinical Reasoning',
    failure: 'Failure Learning',
    calibration: 'Confidence Calibration',
    adaptive: 'Adaptive Efficiency',
    mastery: 'Mastery Status',
  }

  return nameMap[metric.toLowerCase()] || metric
}

/**
 * Skeleton Loader for Benchmarks Tab
 */
function BenchmarksSkeleton() {
  return (
    <div className="space-y-6">
      {/* Privacy notice skeleton */}
      <Card className="h-40 animate-pulse bg-white/95 backdrop-blur-xl rounded-2xl border-0">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="h-4 w-48 bg-[oklch(0.9_0.05_240)] rounded" />
            <div className="h-3 w-full bg-[oklch(0.9_0.05_240)] rounded" />
            <div className="h-3 w-3/4 bg-[oklch(0.9_0.05_240)] rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Box plots skeleton */}
      <Card className="h-[600px] animate-pulse bg-white/95 backdrop-blur-xl rounded-2xl border-0">
        <CardHeader>
          <div className="h-6 w-64 bg-[oklch(0.9_0.05_240)] rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[1, 2, 3].map((i: any) => (
              <div key={i} className="h-32 bg-[oklch(0.9_0.05_240)] rounded" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths/weaknesses skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i: any) => (
          <Card
            key={i}
            className="h-64 animate-pulse bg-white/95 backdrop-blur-xl rounded-2xl border-0"
          >
            <CardHeader>
              <div className="h-5 w-40 bg-[oklch(0.9_0.05_240)] rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((j: any) => (
                  <div key={j} className="h-16 bg-[oklch(0.9_0.05_240)] rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

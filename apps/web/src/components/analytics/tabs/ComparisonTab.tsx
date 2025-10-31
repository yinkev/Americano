'use client'

import { AlertTriangle, Info, TrendingDown, TrendingUp } from 'lucide-react'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useComparisonData } from '@/hooks/use-understanding-analytics'

/**
 * Story 4.6 Task 3: Understanding vs. Memorization Comparison Tab
 *
 * Visual comparison between surface knowledge (memorization) and deep comprehension (understanding).
 *
 * Features:
 * - Dual-axis line chart: Blue line = Memorization (flashcard scores), Orange line = Understanding (validation scores)
 * - Gap analysis: Identify topics with >20 point gap → "Illusion of Knowledge" alert
 * - Correlation coefficient display with interpretation
 * - Annotation overlays highlighting gap areas
 * - Glassmorphism cards with OKLCH colors (NO gradients)
 * - Min 44px touch targets
 *
 * Design System:
 * - Glassmorphism: bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]
 * - OKLCH colors:
 *   - Memorization (Blue): oklch(0.6 0.18 230)
 *   - Understanding (Orange): oklch(0.7 0.15 45)
 *   - Alert (Red): oklch(0.65 0.20 25)
 *   - Success (Green): oklch(0.7 0.15 145)
 *   - Warning (Yellow): oklch(0.75 0.12 85)
 * - Typography: Inter (body), DM Sans (headings)
 * - Touch targets: min 44px
 *
 * Data Source:
 * - Memorization: Flashcard review performance (quick recall proxy)
 * - Understanding: Validation assessment scores (comprehension, reasoning, application)
 * - API: GET /api/analytics/understanding/comparison
 * - Hook: useComparisonData() from React Query
 *
 * @see Story 4.6 AC#2 - Understanding vs. Memorization Comparison
 * @see docs/stories/story-4.6.md (Task 3.1-3.16)
 */
export default function ComparisonTab() {
  const { data, isLoading, error } = useComparisonData()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-white/95 backdrop-blur-xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Comparison Data</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load comparison analytics'}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data) {
    return null
  }

  // Merge time-series data for dual-axis chart
  const mergedData = data.memorization.map((memPoint, idx) => ({
    date: memPoint.date,
    memorization: memPoint.score,
    understanding: data.understanding[idx]?.score || 0,
  }))

  // Calculate gap severity distribution
  const highGaps = data.gaps.filter((g: any) => g.gap > 30).length
  const mediumGaps = data.gaps.filter((g: any) => g.gap > 20 && g.gap <= 30).length
  const lowGaps = data.gaps.filter((g: any) => g.gap <= 20).length

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Correlation Card */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <CardHeader>
            <CardTitle className="text-lg font-['DM_Sans']">Correlation</CardTitle>
            <CardDescription>Memorization vs. Understanding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span
                className="text-4xl font-bold font-['DM_Sans']"
                style={{ color: getCorrelationColor(data.correlation) }}
              >
                {(data.correlation * 100).toFixed(0)}%
              </span>
              {data.correlation >= 0.5 ? (
                <TrendingUp className="h-6 w-6 mb-1" style={{ color: 'oklch(0.7 0.15 145)' }} />
              ) : (
                <TrendingDown className="h-6 w-6 mb-1" style={{ color: 'oklch(0.65 0.20 25)' }} />
              )}
            </div>
            <p className="text-sm text-[oklch(0.6_0.05_240)] mt-2">
              {getCorrelationInterpretation(data.correlation)}
            </p>
          </CardContent>
        </Card>

        {/* Gap Summary Card */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <CardHeader>
            <CardTitle className="text-lg font-['DM_Sans']">Knowledge Gaps</CardTitle>
            <CardDescription>Illusion of Knowledge Detection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">High Risk (30+ point gap)</span>
                <Badge variant="destructive" className="min-h-[28px]">
                  {highGaps}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium Risk (20-30 points)</span>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: 'oklch(0.75 0.12 85)', color: 'oklch(0.3 0.05 85)' }}
                  className="min-h-[28px]"
                >
                  {mediumGaps}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Risk (&lt;20 points)</span>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145)', color: 'white' }}
                  className="min-h-[28px]"
                >
                  {lowGaps}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Scores Card */}
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <CardHeader>
            <CardTitle className="text-lg font-['DM_Sans']">Average Scores</CardTitle>
            <CardDescription>Last {data.memorization.length} data points</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Memorization</span>
                  <span
                    className="text-lg font-bold font-['DM_Sans']"
                    style={{ color: 'oklch(0.6 0.18 230)' }}
                  >
                    {calculateAverage(data.memorization)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${calculateAverage(data.memorization)}%`,
                      backgroundColor: 'oklch(0.6 0.18 230)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Understanding</span>
                  <span
                    className="text-lg font-bold font-['DM_Sans']"
                    style={{ color: 'oklch(0.7 0.15 45)' }}
                  >
                    {calculateAverage(data.understanding)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${calculateAverage(data.understanding)}%`,
                      backgroundColor: 'oklch(0.7 0.15 45)',
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dual-Axis Line Chart */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="text-xl font-['DM_Sans']">
            Understanding vs. Memorization Over Time
          </CardTitle>
          <CardDescription>
            Blue line = Flashcard performance (quick recall), Orange line = Deep comprehension
            (validation assessments)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mergedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                accessibilityLayer
                aria-label="Understanding vs Memorization comparison chart"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="oklch(0.6 0.05 240)"
                  tickFormatter={(date: any) =>
                    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="oklch(0.6 0.05 240)"
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px',
                  }}
                  iconType="line"
                />

                {/* Reference line at 80% (mastery threshold) */}
                <ReferenceLine
                  y={80}
                  stroke="oklch(0.7 0.15 145)"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Mastery (80%)',
                    position: 'insideTopRight',
                    fill: 'oklch(0.7 0.15 145)',
                    fontSize: 12,
                  }}
                />

                {/* Memorization Line (Blue) */}
                <Line
                  type="monotone"
                  dataKey="memorization"
                  stroke="oklch(0.6 0.18 230)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'oklch(0.6 0.18 230)' }}
                  activeDot={{ r: 6 }}
                  name="Memorization (Flashcards)"
                />

                {/* Understanding Line (Orange) */}
                <Line
                  type="monotone"
                  dataKey="understanding"
                  stroke="oklch(0.7 0.15 45)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'oklch(0.7 0.15 45)' }}
                  activeDot={{ r: 6 }}
                  name="Understanding (Validation)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Interpretation */}
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'oklch(0.95 0.02 240)' }}>
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 mt-0.5" style={{ color: 'oklch(0.6 0.18 230)' }} />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Chart Interpretation</p>
                <p className="text-sm text-[oklch(0.6_0.05_240)]">{getChartInterpretation(data)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gap Analysis - Illusion of Knowledge Alerts */}
      {(highGaps > 0 || mediumGaps > 0) && (
        <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <CardHeader>
            <CardTitle className="text-xl font-['DM_Sans'] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" style={{ color: 'oklch(0.65 0.20 25)' }} />
              Illusion of Knowledge Detected
            </CardTitle>
            <CardDescription>
              Topics where memorization significantly exceeds understanding (gap &gt; 20 points)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.gaps
                .filter((gap: any) => gap.gap > 20)
                .sort((a, b) => b.gap - a.gap)
                .map((gap: any) => (
                  <Alert
                    key={gap.objectiveId}
                    variant={gap.gap > 30 ? 'destructive' : 'default'}
                    className="bg-white/95 backdrop-blur-xl"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span className="font-['DM_Sans']">{gap.objectiveName}</span>
                      <Badge
                        variant={gap.gap > 30 ? 'destructive' : 'secondary'}
                        className="min-h-[28px]"
                      >
                        {gap.gap.toFixed(0)} point gap
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Memorization (Flashcards):</span>
                          <span className="font-semibold" style={{ color: 'oklch(0.6 0.18 230)' }}>
                            {gap.memorizationScore.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Understanding (Validation):</span>
                          <span className="font-semibold" style={{ color: 'oklch(0.7 0.15 45)' }}>
                            {gap.understandingScore.toFixed(0)}%
                          </span>
                        </div>
                        <div
                          className="mt-3 p-3 rounded-md"
                          style={{ backgroundColor: 'oklch(0.95 0.02 45)' }}
                        >
                          <p className="text-sm font-medium mb-1">Recommended Action:</p>
                          <p className="text-sm text-[oklch(0.6_0.05_240)]">
                            {getGapRecommendation(gap.gap)}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Gaps - Positive Feedback */}
      {highGaps === 0 && mediumGaps === 0 && (
        <Alert
          className="bg-white/95 backdrop-blur-xl border-2"
          style={{ borderColor: 'oklch(0.7 0.15 145)' }}
        >
          <TrendingUp className="h-4 w-4" style={{ color: 'oklch(0.7 0.15 145)' }} />
          <AlertTitle className="font-['DM_Sans']">Excellent Alignment!</AlertTitle>
          <AlertDescription>
            Your memorization and understanding scores are well aligned across all objectives. This
            indicates genuine comprehension, not just surface-level recall. Keep up the great work!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Custom Tooltip for Recharts with glassmorphism design
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl shadow-lg rounded-lg p-3 border border-gray-200">
      <p className="text-sm font-medium mb-2">
        {new Date(label).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}:
          </span>
          <span className="font-semibold">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-[oklch(0.6_0.05_240)]">
            Gap: {Math.abs(payload[0].value - payload[1].value).toFixed(1)} points
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i: any) => (
          <Card key={i} className="h-40 bg-white/95 backdrop-blur-xl animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="h-96 bg-white/95 backdrop-blur-xl animate-pulse">
        <CardContent className="p-6 flex items-center justify-center">
          <p className="text-sm text-[oklch(0.6_0.05_240)]">Loading comparison chart...</p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Helper Functions
 */

function calculateAverage(dataPoints: { score: number }[]): number {
  if (dataPoints.length === 0) return 0
  const sum = dataPoints.reduce((acc, point) => acc + point.score, 0)
  return Math.round(sum / dataPoints.length)
}

function getCorrelationColor(correlation: number): string {
  if (correlation >= 0.7) return 'oklch(0.7 0.15 145)' // Green - Strong positive
  if (correlation >= 0.4) return 'oklch(0.6 0.18 230)' // Blue - Moderate positive
  if (correlation >= 0) return 'oklch(0.75 0.12 85)' // Yellow - Weak positive
  return 'oklch(0.65 0.20 25)' // Red - Negative
}

function getCorrelationInterpretation(correlation: number): string {
  if (correlation >= 0.7) {
    return 'Strong alignment between memorization and understanding. Your learning is integrated and genuine.'
  }
  if (correlation >= 0.4) {
    return 'Moderate alignment. Some areas may benefit from deeper comprehension practice.'
  }
  if (correlation >= 0) {
    return 'Weak alignment. Focus on connecting memorized facts to deeper understanding.'
  }
  return 'Negative correlation. This is unusual—review your study approach with an advisor.'
}

function getChartInterpretation(data: {
  memorization: any[]
  understanding: any[]
  correlation: number
}): string {
  const memAvg = calculateAverage(data.memorization)
  const undAvg = calculateAverage(data.understanding)
  const gap = memAvg - undAvg

  if (gap > 20) {
    return `Your memorization (${memAvg}%) significantly exceeds understanding (${undAvg}%). This suggests an "Illusion of Knowledge"—you can recall facts but may struggle with application. Increase comprehension prompts and clinical scenarios.`
  }
  if (gap < -10) {
    return `Your understanding (${undAvg}%) exceeds memorization (${memAvg}%). You grasp concepts well but might benefit from spaced repetition to strengthen quick recall for exams.`
  }
  if (data.correlation >= 0.7) {
    return `Excellent balance! Your memorization (${memAvg}%) and understanding (${undAvg}%) are well-aligned with strong correlation (${(data.correlation * 100).toFixed(0)}%). This indicates integrated, exam-ready knowledge.`
  }
  return `Your scores are balanced (Mem: ${memAvg}%, Und: ${undAvg}%), but correlation is moderate (${(data.correlation * 100).toFixed(0)}%). Focus on consistent study across topics to strengthen connections.`
}

function getGapRecommendation(gap: number): string {
  if (gap > 40) {
    return 'CRITICAL: This large gap indicates surface-level learning. Immediately pivot to deep comprehension strategies: explain concepts to peers, work through clinical cases, and use the Feynman technique (teach-back). Reduce flashcard time temporarily.'
  }
  if (gap > 30) {
    return 'HIGH PRIORITY: Increase validation assessments (explain-in-plain-English prompts) and clinical reasoning scenarios. Allocate 70% study time to comprehension, 30% to recall practice. Schedule controlled failure challenges.'
  }
  return 'MODERATE: Supplement flashcards with deeper practice. For every 10 flashcards, complete 1 comprehension prompt or clinical case. Focus on "why" and "how" questions, not just "what".'
}

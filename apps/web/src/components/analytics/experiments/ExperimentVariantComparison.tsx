/**
 * ExperimentVariantComparison Component
 * Story 5.5 Task 10.5: Variant Performance Comparison
 *
 * Displays side-by-side comparison of variant A vs variant B performance
 * with visual charts and statistical significance indicators
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Trophy, Users } from 'lucide-react'

interface ExperimentResults {
  variantAMetrics: {
    retention: number
    performance: number
    satisfaction: number
    sampleSize: number
  }
  variantBMetrics: {
    retention: number
    performance: number
    satisfaction: number
    sampleSize: number
  }
  statistical: {
    pValue: number
    isStatisticallySignificant: boolean
    winningVariant: 'A' | 'B' | 'NONE'
    confidenceLevel: number
  }
  recommendation: string
}

interface ExperimentVariantComparisonProps {
  experimentId: string
  results: ExperimentResults
  successMetric: 'retention' | 'performance' | 'satisfaction'
}

const METRIC_LABELS = {
  retention: 'Retention Rate',
  performance: 'Performance',
  satisfaction: 'Satisfaction',
}

export function ExperimentVariantComparison({
  experimentId,
  results,
  successMetric,
}: ExperimentVariantComparisonProps) {
  const { variantAMetrics, variantBMetrics, statistical } = results

  // Prepare chart data
  const chartData = [
    {
      metric: 'Retention',
      'Variant A': variantAMetrics.retention,
      'Variant B': variantBMetrics.retention,
    },
    {
      metric: 'Performance',
      'Variant A': variantAMetrics.performance,
      'Variant B': variantBMetrics.performance,
    },
    {
      metric: 'Satisfaction',
      'Variant A': variantAMetrics.satisfaction,
      'Variant B': variantBMetrics.satisfaction,
    },
  ]

  const winningVariantMetrics =
    statistical.winningVariant === 'A' ? variantAMetrics : variantBMetrics
  const losingVariantMetrics =
    statistical.winningVariant === 'A' ? variantBMetrics : variantAMetrics

  const improvement =
    statistical.winningVariant !== 'NONE'
      ? (
          ((winningVariantMetrics[successMetric] - losingVariantMetrics[successMetric]) /
            losingVariantMetrics[successMetric]) *
          100
        ).toFixed(1)
      : '0.0'

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading font-semibold text-[18px] mb-1">
              Variant Performance Comparison
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Side-by-side comparison of variants A and B across all metrics
            </p>
          </div>
          {statistical.isStatisticallySignificant && (
            <Badge
              variant="outline"
              className="px-3 py-1.5 shrink-0"
              style={{
                backgroundColor: 'oklch(0.7 0.15 145)/0.1',
                borderColor: 'oklch(0.7 0.15 145)',
                color: 'oklch(0.7 0.15 145)',
              }}
            >
              Statistically Significant
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Winner Banner */}
        {statistical.winningVariant !== 'NONE' && statistical.isStatisticallySignificant && (
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'oklch(0.7 0.15 145)/0.05',
              borderColor: 'oklch(0.7 0.15 145)/0.2',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: 'oklch(0.7 0.15 145)/0.15' }}
              >
                <Trophy className="size-6" style={{ color: 'oklch(0.7 0.15 145)' }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Variant {statistical.winningVariant} Wins
                </h4>
                <p className="text-sm text-foreground mb-2">
                  {improvement}% improvement in {METRIC_LABELS[successMetric].toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {statistical.confidenceLevel}% confidence • p-value: {statistical.pValue.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Variant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Variant A */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              statistical.winningVariant === 'A'
                ? 'border-[oklch(0.7_0.15_145)] bg-[oklch(0.7_0.15_145)]/5'
                : 'border-border bg-muted/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">Variant A</h4>
                {statistical.winningVariant === 'A' && (
                  <Trophy className="size-4 text-[oklch(0.7_0.15_145)]" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>{variantAMetrics.sampleSize} users</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Retention</span>
                  <span className="text-sm font-semibold text-foreground">
                    {variantAMetrics.retention.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${variantAMetrics.retention}%`,
                      backgroundColor: 'oklch(0.7 0.15 145)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Performance</span>
                  <span className="text-sm font-semibold text-foreground">
                    {variantAMetrics.performance.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${variantAMetrics.performance}%`,
                      backgroundColor: 'oklch(0.7 0.15 230)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Satisfaction</span>
                  <span className="text-sm font-semibold text-foreground">
                    {variantAMetrics.satisfaction.toFixed(1)}/5
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(variantAMetrics.satisfaction / 5) * 100}%`,
                      backgroundColor: 'oklch(0.8 0.15 85)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Variant B */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              statistical.winningVariant === 'B'
                ? 'border-[oklch(0.7_0.15_145)] bg-[oklch(0.7_0.15_145)]/5'
                : 'border-border bg-muted/10'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground">Variant B</h4>
                {statistical.winningVariant === 'B' && (
                  <Trophy className="size-4 text-[oklch(0.7_0.15_145)]" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>{variantBMetrics.sampleSize} users</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Retention</span>
                  <span className="text-sm font-semibold text-foreground">
                    {variantBMetrics.retention.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${variantBMetrics.retention}%`,
                      backgroundColor: 'oklch(0.7 0.15 145)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Performance</span>
                  <span className="text-sm font-semibold text-foreground">
                    {variantBMetrics.performance.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${variantBMetrics.performance}%`,
                      backgroundColor: 'oklch(0.7 0.15 230)',
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Satisfaction</span>
                  <span className="text-sm font-semibold text-foreground">
                    {variantBMetrics.satisfaction.toFixed(1)}/5
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(variantBMetrics.satisfaction / 5) * 100}%`,
                      backgroundColor: 'oklch(0.8 0.15 85)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
              <XAxis
                dataKey="metric"
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.556 0 0)' }}
              />
              <YAxis
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.556 0 0)' }}
                label={{
                  value: 'Score',
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
              />
              <Legend />
              <Bar
                dataKey="Variant A"
                fill="oklch(0.7 0.15 230)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Variant B"
                fill="oklch(0.8 0.15 85)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

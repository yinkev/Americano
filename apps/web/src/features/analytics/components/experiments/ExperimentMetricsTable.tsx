/**
 * ExperimentMetricsTable Component
 * Story 5.5 Task 10.5: Detailed Metrics Breakdown
 *
 * Displays detailed statistical analysis and metrics for A/B experiment variants
 */

'use client'

import { CheckCircle2, TrendingDown, TrendingUp, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

interface ExperimentMetricsTableProps {
  results: ExperimentResults
  successMetric: 'retention' | 'performance' | 'satisfaction'
}

export function ExperimentMetricsTable({ results, successMetric }: ExperimentMetricsTableProps) {
  const { variantAMetrics, variantBMetrics, statistical } = results

  const metrics = [
    {
      name: 'Retention Rate',
      key: 'retention' as const,
      unit: '%',
      variantA: variantAMetrics.retention,
      variantB: variantBMetrics.retention,
    },
    {
      name: 'Performance Score',
      key: 'performance' as const,
      unit: '%',
      variantA: variantAMetrics.performance,
      variantB: variantBMetrics.performance,
    },
    {
      name: 'User Satisfaction',
      key: 'satisfaction' as const,
      unit: '/5',
      variantA: variantAMetrics.satisfaction,
      variantB: variantBMetrics.satisfaction,
    },
  ]

  function calculateDifference(variantA: number, variantB: number) {
    const diff = variantB - variantA
    const percentChange = (diff / variantA) * 100
    return { diff, percentChange }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
      <CardHeader>
        <CardTitle className="font-heading font-semibold text-[18px]">
          Detailed Metrics Analysis
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Comprehensive breakdown of performance metrics with statistical analysis
        </p>
      </CardHeader>

      <CardContent>
        {/* Metrics Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Metric</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Variant A</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Variant B</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Difference</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">% Change</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Winner</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => {
                const { diff, percentChange } = calculateDifference(
                  metric.variantA,
                  metric.variantB,
                )
                const isPositive = diff > 0
                const isSuccessMetric = metric.key === successMetric
                const winner = diff > 0 ? 'B' : diff < 0 ? 'A' : 'TIE'

                return (
                  <tr
                    key={metric.key}
                    className={`border-b border-border last:border-0 ${
                      isSuccessMetric ? 'bg-[oklch(0.7_0.15_230)]/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{metric.name}</span>
                        {isSuccessMetric && (
                          <Badge
                            variant="outline"
                            className="px-2 py-0 text-xs"
                            style={{
                              backgroundColor: 'oklch(0.7 0.15 230)/0.1',
                              borderColor: 'oklch(0.7 0.15 230)',
                              color: 'oklch(0.7 0.15 230)',
                            }}
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {metric.variantA.toFixed(1)}
                      {metric.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {metric.variantB.toFixed(1)}
                      {metric.unit}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <TrendingUp className="size-4 text-[oklch(0.7_0.15_145)]" />
                        ) : diff < 0 ? (
                          <TrendingDown className="size-4 text-[oklch(0.6_0.15_25)]" />
                        ) : null}
                        <span
                          className="font-medium"
                          style={{
                            color: isPositive
                              ? 'oklch(0.7 0.15 145)'
                              : diff < 0
                                ? 'oklch(0.6 0.15 25)'
                                : 'oklch(0.556 0 0)',
                          }}
                        >
                          {isPositive ? '+' : ''}
                          {diff.toFixed(1)}
                          {metric.unit}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className="font-medium"
                        style={{
                          color: isPositive
                            ? 'oklch(0.7 0.15 145)'
                            : diff < 0
                              ? 'oklch(0.6 0.15 25)'
                              : 'oklch(0.556 0 0)',
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {percentChange.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {winner === 'TIE' ? (
                        <Badge variant="outline" className="px-2 py-0 text-xs">
                          Tie
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="px-2 py-0 text-xs"
                          style={{
                            backgroundColor: 'oklch(0.7 0.15 145)/0.1',
                            borderColor: 'oklch(0.7 0.15 145)',
                            color: 'oklch(0.7 0.15 145)',
                          }}
                        >
                          Variant {winner}
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Statistical Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Sample Size</p>
            <p className="text-sm font-semibold text-foreground">
              A: {variantAMetrics.sampleSize} | B: {variantBMetrics.sampleSize}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">p-value</p>
            <p className="text-sm font-semibold text-foreground">{statistical.pValue.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Confidence Level</p>
            <p className="text-sm font-semibold text-foreground">{statistical.confidenceLevel}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Statistical Significance</p>
            <div className="flex items-center gap-2">
              {statistical.isStatisticallySignificant ? (
                <>
                  <CheckCircle2 className="size-4 text-[oklch(0.7_0.15_145)]" />
                  <span className="text-sm font-semibold text-[oklch(0.7_0.15_145)]">
                    Significant
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="size-4 text-[oklch(0.6_0.15_25)]" />
                  <span className="text-sm font-semibold text-[oklch(0.6_0.15_25)]">
                    Not Significant
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 p-4 rounded-xl bg-muted/10 border border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Statistical Note:</span> A p-value &lt; 0.05 indicates
            statistical significance at the 95% confidence level. The winning variant is determined
            based on the primary success metric ({successMetric}) when results are statistically
            significant.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

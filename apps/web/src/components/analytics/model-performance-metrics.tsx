/**
 * ModelPerformanceMetrics Component
 * Story 5.2 Task 10 - UI Section 5
 *
 * Admin-only component displaying detailed model performance metrics:
 * - Confusion matrix heatmap
 * - Feature importance bar chart
 * - A/B test results (if multi-armed bandit active)
 * Epic 5 UI Transformation: Already using shadcn/ui components
 */

'use client'

import { Brain, Lock, TrendingUp, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MockDataBadge } from '@/components/analytics/MockDataBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConfusionMatrix {
  truePositive: number
  falsePositive: number
  trueNegative: number
  falseNegative: number
}

interface FeatureImportance {
  feature: string
  importance: number
  change: number // Percentage change from last week
}

interface ABTestResult {
  variant: string
  accuracy: number
  sampleSize: number
  isWinner: boolean
}

interface ModelMetrics {
  confusionMatrix: ConfusionMatrix
  featureImportance: FeatureImportance[]
  abTests?: ABTestResult[]
  modelVersion: string
  lastUpdated: string
  totalPredictions: number
}

interface Props {
  isAdmin?: boolean
}

export function ModelPerformanceMetrics({ isAdmin = false }: Props) {
  const [data, setData] = useState<ModelMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      fetchModelMetrics()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  async function fetchModelMetrics() {
    try {
      setLoading(true)

      // TODO: Replace with actual API call
      // const response = await fetch('/api/analytics/model-performance/admin', {
      //   headers: { 'X-User-Email': 'kevy@americano.dev' },
      // });
      // const result = await response.json();

      // Mock data for MVP
      const mockData: ModelMetrics = {
        confusionMatrix: {
          truePositive: 42,
          falsePositive: 8,
          trueNegative: 35,
          falseNegative: 5,
        },
        featureImportance: [
          { feature: 'Prerequisite Gap', importance: 0.32, change: 5 },
          { feature: 'Historical Struggle', importance: 0.24, change: -2 },
          { feature: 'Content Complexity', importance: 0.18, change: 3 },
          { feature: 'Retention Rate', importance: 0.15, change: 0 },
          { feature: 'Cognitive Load', importance: 0.11, change: -1 },
        ],
        abTests: [
          { variant: 'Logistic Regression', accuracy: 0.79, sampleSize: 124, isWinner: true },
          { variant: 'Rule-Based Model', accuracy: 0.72, sampleSize: 118, isWinner: false },
        ],
        modelVersion: 'v2.3.1',
        lastUpdated: new Date().toISOString(),
        totalPredictions: 90,
      }

      setData(mockData)
    } catch (error) {
      console.error('Error fetching model metrics:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6">
          <Alert className="bg-muted/50 border-border">
            <Lock className="size-4" />
            <AlertDescription className="ml-2">
              Admin access required to view model performance metrics
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-96 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading model metrics...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-96 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Failed to load model metrics</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate metrics from confusion matrix
  const { truePositive, falsePositive, trueNegative, falseNegative } = data.confusionMatrix
  const total = truePositive + falsePositive + trueNegative + falseNegative
  const accuracy = ((truePositive + trueNegative) / total) * 100
  const precision = (truePositive / (truePositive + falsePositive)) * 100
  const recall = (truePositive / (truePositive + falseNegative)) * 100

  // Prepare confusion matrix for heatmap visualization
  const confusionData = [
    { predicted: 'Struggle', actual: 'Struggled', value: truePositive },
    { predicted: 'Struggle', actual: 'No Struggle', value: falsePositive },
    { predicted: 'No Struggle', actual: 'Struggled', value: falseNegative },
    { predicted: 'No Struggle', actual: 'No Struggle', value: trueNegative },
  ]

  // Prepare feature importance for bar chart
  const featureData = data.featureImportance.map((f) => ({
    name: f.feature,
    importance: f.importance * 100,
    change: f.change,
  }))

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading text-lg mb-2 flex items-center gap-2">
              <Brain className="size-5 text-[oklch(0.7_0.15_230)]" />
              Model Performance Analytics
              <Badge variant="secondary" className="ml-2">
                Admin Only
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Detailed metrics for model v{data.modelVersion} • {data.totalPredictions} predictions
            </p>
          </div>
          <MockDataBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Confusion Matrix */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="size-4" />
            Confusion Matrix
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {/* True Positive */}
            <div className="p-4 rounded-xl border-2 border-[oklch(0.7_0.12_145)] bg-[oklch(0.7_0.12_145)]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">True Positive</span>
                <Badge variant="secondary" className="bg-[oklch(0.7_0.12_145)]/20">
                  Correct
                </Badge>
              </div>
              <p className="text-3xl font-bold text-[oklch(0.7_0.12_145)]">{truePositive}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Predicted struggle & user struggled
              </p>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-xl border-2 border-[oklch(0.8_0.15_85)] bg-[oklch(0.8_0.15_85)]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">False Positive</span>
                <Badge variant="secondary" className="bg-[oklch(0.8_0.15_85)]/20">
                  Warning
                </Badge>
              </div>
              <p className="text-3xl font-bold text-[oklch(0.8_0.15_85)]">{falsePositive}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Predicted struggle but user didn't
              </p>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-xl border-2 border-[oklch(0.6_0.15_25)] bg-[oklch(0.6_0.15_25)]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">False Negative</span>
                <Badge variant="secondary" className="bg-[oklch(0.6_0.15_25)]/20">
                  Missed
                </Badge>
              </div>
              <p className="text-3xl font-bold text-[oklch(0.6_0.15_25)]">{falseNegative}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Didn't predict but user struggled
              </p>
            </div>

            {/* True Negative */}
            <div className="p-4 rounded-xl border-2 border-[oklch(0.7_0.15_230)] bg-[oklch(0.7_0.15_230)]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">True Negative</span>
                <Badge variant="secondary" className="bg-[oklch(0.7_0.15_230)]/20">
                  Correct
                </Badge>
              </div>
              <p className="text-3xl font-bold text-[oklch(0.7_0.15_230)]">{trueNegative}</p>
              <p className="text-xs text-muted-foreground mt-1">No prediction & user succeeded</p>
            </div>
          </div>

          {/* Calculated Metrics */}
          <div className="grid grid-cols-3 gap-4 mt-4 p-4 rounded-xl bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-foreground">{accuracy.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Precision</p>
              <p className="text-2xl font-bold text-foreground">{precision.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recall</p>
              <p className="text-2xl font-bold text-foreground">{recall.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Feature Importance */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="size-4" />
            Feature Importance
          </h4>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={featureData} layout="horizontal" margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 40]}
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.556 0 0)' }}
                label={{
                  value: 'Importance (%)',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.145 0 0)' }}
                width={130}
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
                formatter={(value: number, name: string, props: any) => [
                  `${value.toFixed(1)}% (${props.payload.change > 0 ? '+' : ''}${props.payload.change}% vs last week)`,
                  'Importance',
                ]}
              />
              <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
                {featureData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="oklch(0.7 0.15 230)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* A/B Test Results (if available) */}
        {data.abTests && data.abTests.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">A/B Test Results</h4>
            <div className="space-y-3">
              {data.abTests.map((test) => (
                <div
                  key={test.variant}
                  className={`
                    p-4 rounded-xl border-2 transition-all
                    ${
                      test.isWinner
                        ? 'border-[oklch(0.7_0.12_145)] bg-[oklch(0.7_0.12_145)]/10'
                        : 'border-muted bg-muted/30'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-semibold text-sm text-foreground">{test.variant}</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {test.sampleSize} predictions
                      </p>
                    </div>
                    {test.isWinner && (
                      <Badge
                        variant="secondary"
                        className="bg-[oklch(0.7_0.12_145)]/20 text-[oklch(0.7_0.12_145)]"
                      >
                        Winner
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[oklch(0.7_0.15_230)] transition-all"
                        style={{ width: `${test.accuracy * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {(test.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, TrendingUp, BookOpen, Brain, CheckCircle2, X } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface BehavioralInsight {
  id: string
  insightType:
    | 'STUDY_TIME_OPTIMIZATION'
    | 'SESSION_LENGTH_ADJUSTMENT'
    | 'CONTENT_PREFERENCE'
    | 'RETENTION_STRATEGY'
  title: string
  description: string
  actionableRecommendation: string
  confidence: number
  createdAt: string
  acknowledgedAt: string | null
  applied: boolean
}

interface InsightsResponse {
  insights: BehavioralInsight[]
  insufficientData?: boolean
  weeksNeeded?: number
}

const INSIGHT_ICONS: Record<string, typeof Clock> = {
  STUDY_TIME_OPTIMIZATION: Clock,
  SESSION_LENGTH_ADJUSTMENT: TrendingUp,
  CONTENT_PREFERENCE: BookOpen,
  RETENTION_STRATEGY: Brain,
}

export function BehavioralInsightsPanel() {
  const [insights, setInsights] = useState<BehavioralInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [insufficientData, setInsufficientData] = useState(false)
  const [weeksNeeded, setWeeksNeeded] = useState(0)

  useEffect(() => {
    fetchInsights()
  }, [])

  async function fetchInsights() {
    try {
      const res = await fetch('/api/analytics/insights')
      if (!res.ok) throw new Error('Failed to fetch insights')
      const data: InsightsResponse = await res.json()

      if (data.insufficientData) {
        setInsufficientData(true)
        setWeeksNeeded(data.weeksNeeded || 0)
      } else {
        setInsights(data.insights.filter((i) => !i.acknowledgedAt))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcknowledge(id: string, applied: boolean) {
    setProcessingIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/analytics/insights/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applied }),
      })

      if (!res.ok) throw new Error('Failed to acknowledge insight')

      // Remove insight from list
      setInsights((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error('Error acknowledging insight:', err)
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-destructive/10 border-destructive/20">
        <AlertDescription className="text-destructive">{error}</AlertDescription>
      </Alert>
    )
  }

  if (insufficientData) {
    return (
      <Alert className="bg-warning/10 border-warning/20">
        <AlertDescription>
          <p className="font-medium mb-2 text-warning">
            No insights available yet
          </p>
          <p className="text-[13px]" style={{ color: 'oklch(0.5 0.05 230)' }}>
            Complete {weeksNeeded} more weeks of study to enable pattern analysis and receive
            personalized insights.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  if (insights.length === 0) {
    return (
      <Alert className="bg-success/10 border-success/20">
        <AlertDescription>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span style={{ color: 'oklch(0.4 0.08 230)' }}>
              All caught up! No new insights at this time.
            </span>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="feed"
      aria-label="Behavioral Insights"
      aria-busy={loading}
    >
      {insights.map((insight, index) => {
        const Icon = INSIGHT_ICONS[insight.insightType] || Brain
        const isProcessing = processingIds.has(insight.id)

        return (
          <Card
            key={insight.id}
            className="p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
            aria-labelledby={`insight-title-${insight.id}`}
            aria-describedby={`insight-desc-${insight.id}`}
          >
            {/* Icon and Title */}
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-md mt-1"
                style={{ backgroundColor: 'oklch(0.95 0.03 230)' }}
                role="img"
                aria-label={`${insight.insightType.replace(/_/g, ' ').toLowerCase()} insight`}
              >
                <Icon className="h-5 w-5 text-info" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  id={`insight-title-${insight.id}`}
                  className="font-semibold text-[13px] leading-tight"
                  style={{ color: 'oklch(0.3 0.08 230)' }}
                >
                  {insight.title}
                </h4>
              </div>
            </div>

            {/* Description */}
            <p
              id={`insight-desc-${insight.id}`}
              className="text-[13px] leading-relaxed"
              style={{ color: 'oklch(0.5 0.05 230)' }}
            >
              {insight.description}
            </p>

            {/* Actionable Recommendation */}
            <div
              className="p-3 rounded-md text-[13px] bg-success/10"
            >
              <p className="font-medium text-xs mb-1 text-success">
                Recommendation
              </p>
              <p className="text-success">{insight.actionableRecommendation}</p>
            </div>

            {/* Confidence Indicator */}
            <div role="meter" aria-label="Insight confidence" aria-valuenow={Math.round(insight.confidence * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'oklch(0.6 0.03 230)' }}>Confidence</span>
                <span className="font-medium" style={{ color: 'oklch(0.4 0.08 230)' }}>
                  {Math.round(insight.confidence * 100)}%
                </span>
              </div>
              <Progress value={insight.confidence * 100} className="h-1.5" aria-hidden="true" />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2" role="group" aria-label="Insight actions">
              <Button
                size="sm"
                onClick={() => handleAcknowledge(insight.id, true)}
                disabled={isProcessing}
                className="flex-1 min-h-[44px] transition-transform hover:scale-105 active:scale-95 bg-success hover:bg-success/90"
                aria-label={`Apply recommendation: ${insight.actionableRecommendation}`}
              >
                Apply Recommendation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAcknowledge(insight.id, false)}
                disabled={isProcessing}
                className="min-h-[44px] min-w-[44px] transition-transform hover:scale-105 active:scale-95"
                aria-label="Dismiss insight"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

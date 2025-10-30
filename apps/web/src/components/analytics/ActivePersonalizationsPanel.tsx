/**
 * ActivePersonalizationsPanel Component
 * Story 5.5 Task 13.3
 *
 * Card-based display of current personalizations with explanations
 */

'use client'

import {
  Activity,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Info,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PersonalizationConfig {
  context: string
  strategy: string
  confidence: number
  parameters: Record<string, any>
  enabled: boolean
}

interface ActivePersonalizationsData {
  missionPersonalization?: PersonalizationConfig
  contentPersonalization?: PersonalizationConfig
  assessmentPersonalization?: PersonalizationConfig
  sessionPersonalization?: PersonalizationConfig
  dataQualityScore: number
  lastAnalyzedAt: string
}

const CONTEXT_ICONS = {
  mission: Clock,
  content: BookOpen,
  assessment: Target,
  session: Activity,
}

const CONTEXT_COLORS = {
  mission: 'oklch(0.7 0.15 230)',
  content: 'oklch(0.8 0.15 85)',
  assessment: 'oklch(0.6 0.15 25)',
  session: 'oklch(0.7 0.15 145)',
}

export function ActivePersonalizationsPanel() {
  const [data, setData] = useState<ActivePersonalizationsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivePersonalizations()
  }, [])

  async function fetchActivePersonalizations() {
    try {
      setLoading(true)
      const response = await fetch('/api/personalization/config')
      const result = await response.json()

      if (result.success && result.data.config) {
        setData({
          missionPersonalization: result.data.config.missionPersonalization,
          contentPersonalization: result.data.config.contentPersonalization,
          assessmentPersonalization: result.data.config.assessmentPersonalization,
          sessionPersonalization: result.data.config.sessionPersonalization,
          dataQualityScore: result.data.dataQualityScore,
          lastAnalyzedAt: result.data.lastAnalyzedAt,
        })
      }
    } catch (error) {
      console.error('Error fetching active personalizations:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisablePersonalization(context: string) {
    try {
      // Disable via preferences API
      const featureKey = `${context}PersonalizationEnabled`
      await fetch('/api/personalization/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [featureKey]: false }),
      })

      // Refresh data
      await fetchActivePersonalizations()
    } catch (error) {
      console.error('Error disabling personalization:', error)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <p className="text-[13px] text-muted-foreground">Loading personalizations...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
        <CardContent className="p-6 h-64 flex flex-col items-center justify-center">
          <Info className="size-12 text-muted-foreground mb-3" />
          <p className="text-[13px] text-muted-foreground text-center">
            No personalization data available yet
          </p>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Complete 6+ weeks of study to enable personalization
          </p>
        </CardContent>
      </Card>
    )
  }

  const personalizations = [
    { key: 'mission', label: 'Mission Timing', config: data.missionPersonalization },
    { key: 'content', label: 'Content Recommendations', config: data.contentPersonalization },
    { key: 'assessment', label: 'Assessment Difficulty', config: data.assessmentPersonalization },
    { key: 'session', label: 'Session Structure', config: data.sessionPersonalization },
  ]

  const activeCount = personalizations.filter((p) => p.config?.enabled).length

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-heading font-semibold text-[18px] flex items-center gap-2">
              <Sparkles className="size-5" style={{ color: 'oklch(0.7 0.15 230)' }} />
              Active Personalizations
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">
              {activeCount} of 4 personalization features enabled
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 px-3 py-1.5"
            style={{
              backgroundColor: 'oklch(0.7 0.15 145)/0.1',
              borderColor: 'oklch(0.7 0.15 145)',
              color: 'oklch(0.7 0.15 145)',
            }}
          >
            Quality: {(data.dataQualityScore * 100).toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {personalizations.map((personalization, index) => {
          const Icon = CONTEXT_ICONS[personalization.key as keyof typeof CONTEXT_ICONS]
          const color = CONTEXT_COLORS[personalization.key as keyof typeof CONTEXT_COLORS]
          const config = personalization.config

          if (!config || !config.enabled) {
            return (
              <div key={personalization.key}>
                {index > 0 && <Separator className="my-4" />}
                <div className="p-4 rounded-xl bg-muted/10 border border-border opacity-60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${color}/0.1` }}
                      >
                        <Icon className="size-5" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                          {personalization.label}
                        </h4>
                        <p className="text-xs text-muted-foreground">Not enabled</p>
                      </div>
                    </div>
                    <XCircle className="size-5 text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>
            )
          }

          // Generate explanation based on context and parameters
          let explanation = ''
          let dataUsed: string[] = []

          if (personalization.key === 'mission') {
            const optimalTimes = config.parameters.optimalStudyTimes || []
            const duration = config.parameters.recommendedDuration || 45
            explanation =
              optimalTimes.length > 0
                ? `Recommending missions during ${optimalTimes.slice(0, 2).join(', ')} (${duration} min sessions)`
                : `Recommending ${duration}-minute missions`
            dataUsed = [
              `${Math.round(data.dataQualityScore * 100)} data points`,
              'Performance by time-of-day',
              'Session completion patterns',
            ]
          } else if (personalization.key === 'content') {
            const learningStyle = config.parameters.learningStyleProfile || {}
            const primaryStyle = Object.entries(learningStyle).sort(
              ([, a], [, b]) => (b as number) - (a as number),
            )[0]
            explanation = primaryStyle
              ? `Prioritizing ${primaryStyle[0]} content (${Math.round((primaryStyle[1] as number) * 100)}% affinity)`
              : 'Adapting content based on your learning style'
            dataUsed = [
              'VARK learning style profile',
              'Content interaction patterns',
              'Engagement metrics',
            ]
          } else if (personalization.key === 'assessment') {
            const forgettingCurve = config.parameters.forgettingCurve || {}
            explanation = forgettingCurve.k
              ? `Scheduling reviews every ${Math.round(1 / forgettingCurve.k)} days based on retention`
              : 'Optimizing assessment frequency for retention'
            dataUsed = [
              'Personal forgetting curve',
              'Retention test results',
              'Review performance history',
            ]
          } else if (personalization.key === 'session') {
            const duration = config.parameters.sessionDuration || 45
            explanation = `Structuring ${duration}-minute sessions with personalized break timing`
            dataUsed = [
              'Attention cycle patterns',
              'Fatigue indicators',
              'Session performance data',
            ]
          }

          return (
            <div key={personalization.key}>
              {index > 0 && <Separator className="my-4" />}
              <div
                className="p-4 rounded-xl border"
                style={{
                  backgroundColor: `${color}/0.05`,
                  borderColor: `${color}/0.2`,
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `${color}/0.15` }}
                    >
                      <Icon className="size-5" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {personalization.label}
                        </h4>
                        <Badge
                          variant="outline"
                          className="px-2 py-0 text-xs"
                          style={{
                            backgroundColor: `${color}/0.1`,
                            borderColor: color,
                            color,
                          }}
                        >
                          {config.strategy}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">{explanation}</p>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="size-4 shrink-0 mt-0.5" style={{ color }} />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Data Sources:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {dataUsed.map((source, idx) => (
                              <li key={idx}>• {source}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className="px-2 py-1"
                      style={{
                        backgroundColor: 'oklch(0.7 0.15 145)/0.1',
                        borderColor: 'oklch(0.7 0.15 145)',
                        color: 'oklch(0.7 0.15 145)',
                      }}
                    >
                      {(config.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => handleDisablePersonalization(personalization.key)}
                    >
                      Disable
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Last Updated */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Last analyzed{' '}
            {new Date(data.lastAnalyzedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </p>
        </div>

        {/* Help Text */}
        <div className="p-4 rounded-xl bg-[oklch(0.7_0.15_230)]/5 border border-[oklch(0.7_0.15_230)]/20">
          <div className="flex items-start gap-3">
            <Brain className="size-5 text-[oklch(0.7_0.15_230)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Transparent Personalization
              </p>
              <p className="text-xs text-muted-foreground">
                We show you exactly how we're personalizing your experience and what data drives
                each decision. You have full control to enable/disable individual features.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

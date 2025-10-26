/**
 * InsightsPanel Component
 * Story 2.6 Task 11.3
 *
 * Displays mission insights on the dashboard with expandable details
 * Epic 5 UI Transformation: Premium design with shadcn/ui components
 */

'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { typography, colors, glassmorphism } from '@/lib/design-tokens'

interface Insight {
  id: string
  type:
    | 'PERFORMANCE_TREND'
    | 'COMPLETION_PATTERN'
    | 'TIME_OPTIMIZATION'
    | 'OBJECTIVE_PREFERENCE'
    | 'ANOMALY'
  headline: string
  detail: string
  action?: string
  actionUrl?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchInsights()
  }, [])

  async function fetchInsights() {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/missions/summary?period=7d', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const result = await response.json()
      setInsights(result.data.insights || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'PERFORMANCE_TREND':
        return TrendingUp
      case 'COMPLETION_PATTERN':
        return Target
      case 'TIME_OPTIMIZATION':
        return Clock
      case 'OBJECTIVE_PREFERENCE':
        return Award
      case 'ANOMALY':
        return AlertCircle
      default:
        return Sparkles
    }
  }

  const getSentimentColor = (sentiment: Insight['sentiment']): string => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'oklch(0.75 0.15 160)'
      case 'NEGATIVE':
        return 'oklch(0.65 0.15 10)'
      case 'NEUTRAL':
        return 'oklch(0.7 0.15 230)'
      default:
        return 'oklch(0.556 0 0)'
    }
  }

  const getSentimentBg = (sentiment: Insight['sentiment']): string => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'oklch(0.75 0.15 160)/10'
      case 'NEGATIVE':
        return 'oklch(0.65 0.15 10)/10'
      case 'NEUTRAL':
        return 'oklch(0.7 0.15 230)/10'
      default:
        return 'oklch(0.922 0 0)'
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <Card className="bg-card  border-border shadow-none">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card className="bg-card  border-border shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
              <Sparkles className="size-5 text-[oklch(0.7_0.15_230)]" />
            </div>
            <div>
              <CardTitle className="text-lg font-heading">Mission Insights</CardTitle>
              <p className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No insights available yet</p>
            <p className="text-xs text-muted-foreground mt-2">
              Complete more missions to unlock personalized insights!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${glassmorphism.light}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full bg-[${colors.clinical}]/10 p-2`}>
              <Sparkles className={`size-5 text-[${colors.clinical}]`} />
            </div>
            <div>
              <CardTitle className={`${typography.heading.h3} text-foreground`}>Mission Insights</CardTitle>
              <p className={`${typography.body.tiny} text-muted-foreground`}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            className={`text-[${colors.clinical}] hover:text-[${colors.clinical}]/80`}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="single" collapsible className="space-y-3">
          {insights.map((insight) => {
            const Icon = getIcon(insight.type)
            const sentimentColor = getSentimentColor(insight.sentiment)

            return (
              <AccordionItem
                key={insight.id}
                value={insight.id}
                className={`rounded-xl border border-border bg-card transition-all hover:border-[${colors.clinical}]/30`}
              >
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-start gap-3 flex-1 text-left">
                    <div
                      className="flex-shrink-0 p-2 rounded-lg"
                      style={{ backgroundColor: `${sentimentColor}/0.1` }}
                    >
                      <Icon className="size-5" style={{ color: sentimentColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`${typography.body.small} font-semibold text-foreground`}>{insight.headline}</h4>
                        <Badge
                          variant="secondary"
                          className={`${typography.body.tiny}`}
                          style={{
                            backgroundColor: `${sentimentColor}/0.1`,
                            color: sentimentColor,
                          }}
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <p className={`${typography.body.small} text-muted-foreground leading-relaxed mb-3 ml-14`}>
                    {insight.detail}
                  </p>
                  {insight.action && (
                    <a
                      href={insight.actionUrl || '#'}
                      className={`inline-flex items-center gap-1 ${typography.body.small} font-medium hover:underline transition-colors ml-14`}
                      style={{ color: sentimentColor }}
                    >
                      {insight.action} →
                    </a>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        <div className="mt-6 pt-6 border-t border-border">
          <p className={`${typography.body.tiny} text-muted-foreground leading-relaxed`}>
            Insights are generated daily based on your recent mission activity. Click any insight to
            see more details and recommended actions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

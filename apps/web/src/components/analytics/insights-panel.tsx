/**
 * InsightsPanel Component
 * Story 2.6 Task 11.3
 *
 * Displays mission insights on the dashboard with expandable details
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
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[oklch(0.922_0_0)] rounded w-1/3" />
          <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-full" />
          <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
            <Sparkles className="size-5 text-[oklch(0.7_0.15_230)]" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Mission Insights
            </h3>
            <p className="text-xs text-[oklch(0.556_0_0)]">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-[oklch(0.556_0_0)]">No insights available yet</p>
          <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
            Complete more missions to unlock personalized insights!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
            <Sparkles className="size-5 text-[oklch(0.7_0.15_230)]" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
              Mission Insights
            </h3>
            <p className="text-xs text-[oklch(0.556_0_0)]">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          className="text-sm text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)] font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const Icon = getIcon(insight.type)
          const sentimentColor = getSentimentColor(insight.sentiment)
          const sentimentBg = getSentimentBg(insight.sentiment)
          const isExpanded = expandedId === insight.id

          return (
            <div
              key={insight.id}
              className="rounded-xl border border-white/50 transition-all overflow-hidden"
              style={{
                backgroundColor: sentimentBg,
                borderColor: isExpanded ? sentimentColor : 'oklch(0.922 0 0)',
              }}
            >
              {/* Main Content */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 p-2 rounded-lg"
                    style={{
                      backgroundColor: `${sentimentColor}/0.15`,
                    }}
                  >
                    <Icon className="size-5" style={{ color: sentimentColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)] mb-1">
                      {insight.headline}
                    </h4>
                    {isExpanded && (
                      <p className="text-sm text-[oklch(0.556_0_0)] leading-relaxed mb-3">
                        {insight.detail}
                      </p>
                    )}
                    {insight.action && isExpanded && (
                      <a
                        href={insight.actionUrl || '#'}
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline transition-colors"
                        style={{ color: sentimentColor }}
                      >
                        {insight.action} →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpand(insight.id)}
                    className="flex-shrink-0 p-1 text-[oklch(0.556_0_0)] hover:text-[oklch(0.145_0_0)] transition-colors"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-[oklch(0.922_0_0)]">
        <p className="text-xs text-[oklch(0.556_0_0)] leading-relaxed">
          Insights are generated daily based on your recent mission activity. Click any insight to
          see more details and recommended actions.
        </p>
      </div>
    </div>
  )
}

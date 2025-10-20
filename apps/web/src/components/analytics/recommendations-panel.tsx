/**
 * RecommendationsPanel Component
 * Story 2.6 Task 6.3
 *
 * Displays personalized mission recommendations with action buttons
 */

'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Clock, Target, TrendingUp, X, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Recommendation {
  id: string
  type: 'DURATION' | 'COMPLEXITY' | 'TIMING' | 'OBJECTIVE_BALANCE'
  title: string
  description: string
  rationale: string
  action: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  value: any
}

export function RecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  async function fetchRecommendations() {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/missions/recommendations', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const result = await response.json()
      setRecommendations(result.data.recommendations || [])
    } catch (error) {
      console.error('Error fetching recommendations:', error)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  async function handleApply(recommendation: Recommendation) {
    try {
      setApplyingId(recommendation.id)

      // In production, this would call an API to apply the recommendation
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success('Recommendation applied!', {
        description: `${recommendation.title} has been applied to your mission settings.`,
      })

      // Remove applied recommendation from list
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendation.id))
    } catch (error) {
      console.error('Error applying recommendation:', error)
      toast.error('Failed to apply recommendation', {
        description: 'Please try again later.',
      })
    } finally {
      setApplyingId(null)
    }
  }

  async function handleDismiss(recommendation: Recommendation) {
    try {
      // In production, this would call an API to dismiss the recommendation
      // For now, just remove from UI
      setRecommendations((prev) => prev.filter((r) => r.id !== recommendation.id))

      toast.info('Recommendation dismissed', {
        description: "We won't show this recommendation again.",
      })
    } catch (error) {
      console.error('Error dismissing recommendation:', error)
    }
  }

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'DURATION':
        return Clock
      case 'COMPLEXITY':
        return Target
      case 'TIMING':
        return TrendingUp
      case 'OBJECTIVE_BALANCE':
        return Sparkles
      default:
        return Lightbulb
    }
  }

  const getPriorityColor = (priority: Recommendation['priority']): string => {
    switch (priority) {
      case 'HIGH':
        return 'oklch(0.65 0.15 10)'
      case 'MEDIUM':
        return 'oklch(0.7 0.15 50)'
      case 'LOW':
        return 'oklch(0.7 0.15 230)'
      default:
        return 'oklch(0.556 0 0)'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30">
        <div className="text-sm text-[oklch(0.556_0_0)]">Loading recommendations...</div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
        <Lightbulb className="size-12 text-[oklch(0.556_0_0)] mb-4" />
        <div className="text-sm text-[oklch(0.556_0_0)] text-center">
          No recommendations at this time
        </div>
        <p className="text-xs text-[oklch(0.556_0_0)] mt-2 text-center">
          Keep completing missions to get personalized insights!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-[oklch(0.7_0.15_50)]/10 p-2">
          <Lightbulb className="size-5 text-[oklch(0.7_0.15_50)]" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
            Personalized Recommendations
          </h3>
          <p className="text-sm text-[oklch(0.556_0_0)]">
            Based on your recent mission performance
          </p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const Icon = getIcon(recommendation.type)
          const priorityColor = getPriorityColor(recommendation.priority)

          return (
            <div
              key={recommendation.id}
              className="relative p-5 rounded-xl bg-white/60 border border-white/50 hover:border-[oklch(0.7_0.15_230)]/30 transition-all"
            >
              {/* Priority Indicator */}
              <div className="absolute top-3 right-3">
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${priorityColor}/0.1`,
                    color: priorityColor,
                  }}
                >
                  {recommendation.priority}
                </span>
              </div>

              {/* Content */}
              <div className="flex items-start gap-4 mb-4 pr-20">
                <div
                  className="flex-shrink-0 p-2 rounded-lg"
                  style={{
                    backgroundColor: `${priorityColor}/0.1`,
                  }}
                >
                  <Icon className="size-5" style={{ color: priorityColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-[oklch(0.145_0_0)] mb-2">
                    {recommendation.title}
                  </h4>
                  <p className="text-sm text-[oklch(0.556_0_0)] leading-relaxed mb-3">
                    {recommendation.description}
                  </p>
                  <div className="p-3 bg-[oklch(0.97_0_0)] rounded-lg">
                    <p className="text-xs text-[oklch(0.556_0_0)] leading-relaxed">
                      <strong className="text-[oklch(0.145_0_0)]">Why?</strong>{' '}
                      {recommendation.rationale}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(recommendation)}
                  disabled={applyingId === recommendation.id}
                  className="gap-2"
                >
                  <X className="size-4" />
                  Not Helpful
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApply(recommendation)}
                  disabled={applyingId !== null}
                  className="gap-2"
                >
                  {applyingId === recommendation.id ? (
                    <>
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      {recommendation.action}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-6 border-t border-[oklch(0.922_0_0)]">
        <p className="text-xs text-[oklch(0.556_0_0)] leading-relaxed">
          Recommendations are generated based on your last 14 missions and update weekly. Applied
          recommendations will be reflected in future mission generation.
        </p>
      </div>
    </div>
  )
}

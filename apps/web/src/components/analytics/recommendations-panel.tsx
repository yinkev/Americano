/**
 * RecommendationsPanel Component
 * Story 2.6 Task 6.3
 *
 * Displays personalized mission recommendations with action buttons
 * Epic 5 UI Transformation: Premium design with shadcn/ui components
 */

'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Clock, Target, TrendingUp, X, Check, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Loading recommendations...</div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="flex flex-col items-center justify-center h-64 p-6">
          <Lightbulb className="size-12 text-muted-foreground mb-4" />
          <div className="text-sm text-muted-foreground text-center">
            No recommendations at this time
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Keep completing missions to get personalized insights!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[oklch(0.7_0.15_50)]/10 p-2">
            <Lightbulb className="size-5 text-[oklch(0.7_0.15_50)]" />
          </div>
          <div>
            <CardTitle className="text-lg font-heading">Personalized Recommendations</CardTitle>
            <CardDescription>Based on your recent mission performance</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => {
            const Icon = getIcon(recommendation.type)
            const priorityColor = getPriorityColor(recommendation.priority)

            return (
              <Card
                key={recommendation.id}
                className="relative bg-card border-border hover:border-[oklch(0.7_0.15_230)]/30 transition-all"
              >
                <CardContent className="p-5">
                  {/* Priority Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${priorityColor}/0.1`,
                        color: priorityColor,
                      }}
                    >
                      {recommendation.priority}
                    </Badge>
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
                      <h4 className="text-base font-semibold text-foreground mb-2">
                        {recommendation.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {recommendation.description}
                      </p>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Why?</strong>{' '}
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
                      className="gap-2 bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)]"
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
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recommendations are generated based on your last 14 missions and update weekly. Applied
            recommendations will be reflected in future mission generation.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

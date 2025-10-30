/**
 * RecommendationsPanel Component
 * Story 5.6: Behavioral Insights Dashboard - Task 5 (Recommendations)
 *
 * Epic 5 UI Transformation:
 * - OKLCH colors for category badges (no gradients)
 * - Design tokens from /lib/design-tokens.ts
 * - Typography system (font-heading, precise text sizes)
 * - Glassmorphism effects (bg-white/80 backdrop-blur-md)
 * - Fast hover animations (150ms)
 *
 * Displays top 5 behavioral recommendations sorted by priority.
 * Features:
 * - Card layout with category badges
 * - Confidence rating (5-star system)
 * - Expandable evidence list
 * - "Apply This" action button
 * - Applied state tracking
 */

'use client'

import { AlertCircle, Check, ChevronDown, ChevronUp, Lightbulb, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { colors, typography } from '@/lib/design-tokens'

type RecommendationCategory = 'TIMING' | 'DURATION' | 'CONTENT' | 'DIFFICULTY' | 'STRATEGY'

interface Recommendation {
  id: string
  userId: string
  title: string
  description: string
  category: RecommendationCategory
  priority: number
  confidence: number
  evidence: string[]
  actionable: boolean
  appliedAt: Date | null
}

interface RecommendationsPanelProps {
  userId: string
  isLoading?: boolean
}

// Category styling
const CATEGORY_CONFIG: Record<
  RecommendationCategory,
  {
    label: string
    color: string
  }
> = {
  TIMING: {
    label: 'Timing',
    color: 'bg-blue-600 text-white',
  },
  DURATION: {
    label: 'Duration',
    color: 'bg-purple-600 text-white',
  },
  CONTENT: {
    label: 'Content',
    color: 'bg-green-600 text-white',
  },
  DIFFICULTY: {
    label: 'Difficulty',
    color: 'bg-orange-600 text-white',
  },
  STRATEGY: {
    label: 'Strategy',
    color: 'bg-pink-600 text-white',
  },
}

// Render confidence stars
const ConfidenceStars = ({ confidence }: { confidence: number }) => {
  const filledStars = Math.round(confidence * 5)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= filledStars ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-1">{Math.round(confidence * 100)}%</span>
    </div>
  )
}

// Individual recommendation card
const RecommendationCard = ({
  recommendation,
  onApply,
  isApplying,
}: {
  recommendation: Recommendation
  onApply: (id: string) => void
  isApplying: boolean
}) => {
  const [expanded, setExpanded] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const categoryConfig = CATEGORY_CONFIG[recommendation.category]
  const isApplied = recommendation.appliedAt !== null

  const truncatedDescription =
    recommendation.description.length > 150
      ? recommendation.description.slice(0, 150) + '...'
      : recommendation.description

  return (
    <Card
      className="bg-white/50 hover:shadow-md transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-left-4"
      role="article"
      aria-labelledby={`rec-title-${recommendation.id}`}
      aria-describedby={`rec-desc-${recommendation.id}`}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 id={`rec-title-${recommendation.id}`} className="font-semibold text-lg">
                {recommendation.title}
              </h3>
              <Badge
                className={categoryConfig.color}
                aria-label={`Category: ${categoryConfig.label}`}
              >
                {categoryConfig.label}
              </Badge>
              {isApplied && (
                <Badge className="bg-green-600 text-white" aria-label="Status: Applied">
                  <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                  Applied
                </Badge>
              )}
            </div>
            <div
              role="img"
              aria-label={`Confidence rating: ${Math.round(recommendation.confidence * 100)} percent out of 100`}
            >
              <ConfidenceStars confidence={recommendation.confidence} />
            </div>
          </div>
        </div>

        {/* Description */}
        <p id={`rec-desc-${recommendation.id}`} className="text-sm text-muted-foreground mb-3">
          {showFullDescription ? recommendation.description : truncatedDescription}
          {recommendation.description.length > 150 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-blue-600 hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-expanded={showFullDescription}
              aria-label={showFullDescription ? 'Show less description' : 'Show full description'}
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>

        {/* Evidence section */}
        {recommendation.evidence.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-expanded={expanded}
              aria-controls={`evidence-${recommendation.id}`}
              aria-label={`${expanded ? 'Hide' : 'Show'} ${recommendation.evidence.length} evidence items`}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
              Evidence ({recommendation.evidence.length})
            </button>
            {expanded && (
              <ul
                id={`evidence-${recommendation.id}`}
                className="mt-2 space-y-1 pl-6 animate-in slide-in-from-top-2 duration-200"
                role="list"
              >
                {recommendation.evidence.map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action button */}
        {recommendation.actionable && !isApplied && (
          <Button
            onClick={() => onApply(recommendation.id)}
            disabled={isApplying}
            size="sm"
            className="w-full transition-transform hover:scale-105 active:scale-95"
            aria-busy={isApplying}
            aria-label={`Apply ${recommendation.title} recommendation`}
          >
            {isApplying ? 'Applying...' : 'Apply This'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function RecommendationsPanel({
  userId,
  isLoading: isLoadingProp = false,
}: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          `/api/analytics/behavioral-insights/recommendations?userId=${userId}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations')
        }

        const data = await response.json()
        if (data.success && data.recommendations) {
          // Sort by priority (highest first)
          const sorted = [...data.recommendations].sort((a, b) => b.priority - a.priority)
          setRecommendations(sorted.slice(0, 5)) // Top 5
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  const handleApply = async (id: string) => {
    try {
      setApplyingId(id)
      const response = await fetch(
        `/api/analytics/behavioral-insights/recommendations/${id}/apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to apply recommendation')
      }

      const data = await response.json()
      if (data.success) {
        // Update local state
        setRecommendations(
          recommendations.map((rec) => (rec.id === id ? { ...rec, appliedAt: new Date() } : rec)),
        )
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to apply recommendation')
    } finally {
      setApplyingId(null)
    }
  }

  // Empty state
  if (!isLoading && !isLoadingProp && recommendations.length === 0 && !error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Lightbulb className="size-12 text-muted-foreground mb-4" />
          <h3 className={`${typography.heading.h3} mb-2`}>No Recommendations Yet</h3>
          <p className={`${typography.body.base} text-muted-foreground text-center max-w-md`}>
            Keep studying to unlock personalized recommendations based on your learning patterns
          </p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card
        className="bg-white/80 backdrop-blur-md shadow-sm border"
        style={{ borderColor: colors.alert }}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="size-12 mb-4" style={{ color: colors.alert }} />
          <h3 className={`${typography.heading.h3} mb-2`}>Error Loading Recommendations</h3>
          <p className={`${typography.body.base} text-muted-foreground text-center`}>{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading || isLoadingProp) {
    return (
      <Card className="bg-white/80 backdrop-blur-md shadow-sm animate-pulse">
        <CardHeader>
          <div
            className="h-6 rounded w-1/3 mb-2"
            style={{ backgroundColor: 'oklch(0.9 0.02 230)' }}
          />
          <div className="h-4 rounded w-1/2" style={{ backgroundColor: 'oklch(0.92 0.02 230)' }} />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 rounded"
              style={{
                backgroundColor: 'oklch(0.94 0.02 230)',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm">
      <CardHeader>
        <CardTitle className={typography.heading.h2}>Personalized Recommendations</CardTitle>
        <CardDescription className={`${typography.body.base} mt-1`}>
          Top {recommendations.length} evidence-based suggestions to optimize your learning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onApply={handleApply}
            isApplying={applyingId === recommendation.id}
          />
        ))}
      </CardContent>
    </Card>
  )
}

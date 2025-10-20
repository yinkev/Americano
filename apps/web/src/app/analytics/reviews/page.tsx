/**
 * Mission Reviews Page
 *
 * Displays weekly and monthly mission performance reviews.
 * Allows filtering by period and generating new reviews.
 *
 * Story 2.6: Task 7.3 - /analytics/reviews page
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Calendar, TrendingUp } from 'lucide-react'
import { ReviewCard } from '@/components/analytics/review-card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

/**
 * Mission review data structure
 */
interface MissionReview {
  id: string
  period: 'WEEK' | 'MONTH'
  startDate: string
  endDate: string
  summary: {
    missionsCompleted: number
    missionsSkipped: number
    totalTime: number
    avgSuccessScore: number
    completionRate: number
    avgDifficultyRating: number
  }
  highlights: {
    longestStreak: number
    bestPerformance: {
      missionId: string
      successScore: number
      date: string
    } | null
    topObjectives: Array<{
      objectiveId: string
      objective: string
      masteryGain: number
    }>
    personalBests: string[]
  }
  insights: {
    patterns: string[]
    correlations: string[]
    improvements: string[]
    concerns: string[]
  }
  recommendations: {
    actionItems: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW'
      action: string
      reason: string
    }>
    adjustments: Array<{
      type: 'DURATION' | 'COMPLEXITY' | 'OBJECTIVE_TYPES' | 'STUDY_TIME'
      current: string
      recommended: string
      reason: string
    }>
  }
  generatedAt: string
}

type PeriodFilter = 'all' | 'WEEK' | 'MONTH'

/**
 * Mission Reviews Page Component
 */
export default function MissionReviewsPage() {
  const [reviews, setReviews] = useState<MissionReview[]>([])
  const [filteredReviews, setFilteredReviews] = useState<MissionReview[]>([])
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch reviews on mount
  useEffect(() => {
    fetchReviews()
  }, [])

  // Apply filter when period changes
  useEffect(() => {
    if (periodFilter === 'all') {
      setFilteredReviews(reviews)
    } else {
      setFilteredReviews(reviews.filter((r) => r.period === periodFilter))
    }
  }, [periodFilter, reviews])

  /**
   * Fetch reviews from API
   */
  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/analytics/reviews', {
        headers: {
          'X-User-Email': 'kevy@americano.dev',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Generate a new review
   */
  const generateReview = async (period: 'WEEK' | 'MONTH') => {
    try {
      setIsGenerating(true)
      const response = await fetch('/api/analytics/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({ period }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate review')
      }

      const data = await response.json()
      const newReview = data.review

      // Add to reviews list if not already present
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === newReview.id)
        if (exists) {
          return prev.map((r) => (r.id === newReview.id ? newReview : r))
        }
        return [newReview, ...prev]
      })

      toast.success(`${period === 'WEEK' ? 'Weekly' : 'Monthly'} review generated successfully`)
    } catch (error) {
      console.error('Error generating review:', error)
      toast.error('Failed to generate review')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Handle applying recommendations from a review
   */
  const handleApplyRecommendations = async (reviewId: string) => {
    // TODO: Implement recommendation application logic
    // This would integrate with mission preferences to apply adjustments
    toast.info('Recommendation application will be implemented in future update')
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="h-6 w-6 text-[oklch(0.6_0.15_250)]" />
          <h1 className="text-3xl font-bold">Mission Reviews</h1>
        </div>
        <p className="text-muted-foreground">
          Weekly and monthly summaries of your mission performance, insights, and recommendations
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Filter by:</Label>
          </div>
          <RadioGroup
            value={periodFilter}
            onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="filter-all" />
              <Label htmlFor="filter-all" className="cursor-pointer">
                All
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="WEEK" id="filter-week" />
              <Label htmlFor="filter-week" className="cursor-pointer">
                Weekly
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MONTH" id="filter-month" />
              <Label htmlFor="filter-month" className="cursor-pointer">
                Monthly
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Generate Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateReview('WEEK')}
            disabled={isGenerating}
          >
            <Plus className="h-4 w-4 mr-1" />
            Weekly Review
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateReview('MONTH')}
            disabled={isGenerating}
          >
            <Plus className="h-4 w-4 mr-1" />
            Monthly Review
          </Button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          <>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </>
        ) : filteredReviews.length === 0 ? (
          // Empty state
          <div className="text-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground mb-6">
              {periodFilter === 'all'
                ? 'Generate your first mission review to see insights and recommendations'
                : `No ${periodFilter.toLowerCase()}ly reviews available yet`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="default"
                onClick={() => generateReview('WEEK')}
                disabled={isGenerating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Weekly Review
              </Button>
              <Button
                variant="outline"
                onClick={() => generateReview('MONTH')}
                disabled={isGenerating}
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Monthly Review
              </Button>
            </div>
          </div>
        ) : (
          // Reviews
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApplyRecommendations={handleApplyRecommendations}
            />
          ))
        )}
      </div>

      {/* Stats Summary (if reviews exist) */}
      {!isLoading && reviews.length > 0 && (
        <div className="mt-8 p-6 rounded-lg bg-white/80 backdrop-blur-md border-white/20">
          <h3 className="text-sm font-semibold mb-4">Overall Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">{reviews.length}</div>
              <div className="text-xs text-muted-foreground">Total Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">
                {reviews.filter((r) => r.period === 'WEEK').length}
              </div>
              <div className="text-xs text-muted-foreground">Weekly Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">
                {reviews.filter((r) => r.period === 'MONTH').length}
              </div>
              <div className="text-xs text-muted-foreground">Monthly Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">
                {reviews.length > 0
                  ? (
                      (reviews.reduce((sum, r) => sum + r.summary.avgSuccessScore, 0) /
                        reviews.length) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </div>
              <div className="text-xs text-muted-foreground">Avg Success Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

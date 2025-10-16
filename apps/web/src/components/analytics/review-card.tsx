/**
 * Review Card Component
 *
 * Displays a mission review (weekly or monthly) with expandable details.
 * Shows summary stats, highlights, insights, and recommendations.
 *
 * Story 2.6: Task 7.4 - ReviewCard component
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp, Target, Lightbulb, Award, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

interface ReviewCardProps {
  review: MissionReview
  onApplyRecommendations?: (reviewId: string) => void
}

/**
 * ReviewCard Component
 *
 * Expandable card showing mission review details.
 */
export function ReviewCard({ review, onApplyRecommendations }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format date range
  const startDate = new Date(review.startDate)
  const endDate = new Date(review.endDate)
  const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  // Get success score rating
  const getSuccessRating = (score: number): { label: string; color: string } => {
    if (score >= 0.8) return { label: 'EXCELLENT', color: 'bg-green-500/10 text-green-700 border-green-500/20' }
    if (score >= 0.7) return { label: 'GOOD', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' }
    if (score >= 0.6) return { label: 'FAIR', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' }
    if (score >= 0.5) return { label: 'NEEDS IMPROVEMENT', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20' }
    return { label: 'POOR', color: 'bg-red-500/10 text-red-700 border-red-500/20' }
  }

  const successRating = getSuccessRating(review.summary.avgSuccessScore)

  // Get completion rate color
  const getCompletionRateColor = (rate: number): string => {
    if (rate >= 0.85) return 'text-green-600'
    if (rate >= 0.7) return 'text-blue-600'
    if (rate >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-[oklch(0.6_0.15_250)]" />
              <CardTitle className="text-lg">
                {review.period === 'WEEK' ? 'Weekly' : 'Monthly'} Review
              </CardTitle>
              <Badge variant="outline" className={successRating.color}>
                {successRating.label}
              </Badge>
            </div>
            <CardDescription>{dateRange}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">
              {review.summary.missionsCompleted}
            </div>
            <div className="text-xs text-muted-foreground">missions</div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Completion Rate</div>
            <div className={`text-2xl font-bold ${getCompletionRateColor(review.summary.completionRate)}`}>
              {(review.summary.completionRate * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {review.summary.completionRate >= 0.7 && review.summary.completionRate <= 0.9
                ? 'Optimal range'
                : review.summary.completionRate > 0.9
                ? 'Above target'
                : 'Below target'}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Study Time</div>
            <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">
              {Math.round(review.summary.totalTime / 60)}h
            </div>
            <div className="text-xs text-muted-foreground">
              {review.summary.totalTime} min total
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Streak</div>
            <div className="text-2xl font-bold text-[oklch(0.5_0.15_250)]">
              {review.highlights.longestStreak}
            </div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-6 mt-6">
            <Separator />

            {/* Highlights Section */}
            {(review.highlights.personalBests.length > 0 || review.highlights.topObjectives.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-[oklch(0.6_0.15_250)]" />
                  <h4 className="font-semibold text-sm">Highlights</h4>
                </div>

                {review.highlights.personalBests.length > 0 && (
                  <div className="space-y-2">
                    {review.highlights.personalBests.map((best, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm p-2 rounded-lg bg-green-500/5 border border-green-500/10"
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{best}</span>
                      </div>
                    ))}
                  </div>
                )}

                {review.highlights.topObjectives.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Top Objectives Completed
                    </div>
                    <div className="space-y-1">
                      {review.highlights.topObjectives.slice(0, 3).map((obj) => (
                        <div
                          key={obj.objectiveId}
                          className="text-sm p-2 rounded-lg bg-blue-500/5 border border-blue-500/10"
                        >
                          <div className="font-medium truncate">{obj.objective}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insights Section */}
            {(review.insights.patterns.length > 0 ||
              review.insights.improvements.length > 0 ||
              review.insights.concerns.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[oklch(0.6_0.15_250)]" />
                  <h4 className="font-semibold text-sm">Insights</h4>
                </div>

                {review.insights.improvements.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-green-700">Improvements</div>
                    {review.insights.improvements.map((improvement, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm p-2 rounded-lg bg-green-500/5 border border-green-500/10"
                      >
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{improvement}</span>
                      </div>
                    ))}
                  </div>
                )}

                {review.insights.patterns.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-blue-700">Patterns Detected</div>
                    {review.insights.patterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 rounded-lg bg-blue-500/5 border border-blue-500/10"
                      >
                        {pattern}
                      </div>
                    ))}
                  </div>
                )}

                {review.insights.concerns.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-orange-700">Areas for Attention</div>
                    {review.insights.concerns.map((concern, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm p-2 rounded-lg bg-orange-500/5 border border-orange-500/10"
                      >
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>{concern}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Section */}
            {review.recommendations.actionItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[oklch(0.6_0.15_250)]" />
                  <h4 className="font-semibold text-sm">Recommendations</h4>
                </div>

                <div className="space-y-2">
                  {review.recommendations.actionItems.map((item, index) => {
                    const priorityColors = {
                      HIGH: 'bg-red-500/10 text-red-700 border-red-500/20',
                      MEDIUM: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
                      LOW: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
                    }

                    return (
                      <div
                        key={index}
                        className="space-y-1 p-3 rounded-lg bg-white/50 border border-white/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={priorityColors[item.priority]}
                              >
                                {item.priority}
                              </Badge>
                              <div className="font-medium text-sm">{item.action}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.reason}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {onApplyRecommendations && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onApplyRecommendations(review.id)}
                    className="w-full mt-2"
                  >
                    Apply Recommendations
                  </Button>
                )}
              </div>
            )}

            {/* Review Metadata */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Clock className="h-3 w-3" />
              <span>
                Generated {new Date(review.generatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

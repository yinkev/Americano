'use client'

import { TrendingUp, TrendingDown, Minus, Clock, Target, Award, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PerformanceMetricsProps {
  mission: {
    estimatedMinutes: number
    actualMinutes?: number | null
    completedObjectivesCount: number
    totalObjectives: number
    successScore?: number | null
    difficultyRating?: number | null
  }
  showRecommendations?: boolean
}

export function PerformanceMetrics({ mission, showRecommendations = true }: PerformanceMetricsProps) {
  const completionRate = mission.totalObjectives > 0
    ? (mission.completedObjectivesCount / mission.totalObjectives) * 100
    : 0

  const timeAccuracy = mission.actualMinutes && mission.estimatedMinutes
    ? 100 - Math.abs(((mission.actualMinutes - mission.estimatedMinutes) / mission.estimatedMinutes) * 100)
    : null

  const timeDifference = mission.actualMinutes
    ? mission.actualMinutes - mission.estimatedMinutes
    : null

  const successPercentage = mission.successScore ? mission.successScore * 100 : null

  // Generate insights
  const insights = []

  if (completionRate === 100) {
    insights.push({
      type: 'success' as const,
      message: '🎉 Perfect completion! All objectives achieved.',
    })
  } else if (completionRate >= 80) {
    insights.push({
      type: 'success' as const,
      message: '✨ Excellent progress! You completed most objectives.',
    })
  } else if (completionRate >= 60) {
    insights.push({
      type: 'warning' as const,
      message: '👍 Good effort, but there\'s room for improvement.',
    })
  } else if (completionRate > 0) {
    insights.push({
      type: 'info' as const,
      message: '💪 Keep pushing! Try to complete more objectives next time.',
    })
  }

  if (timeAccuracy !== null) {
    if (timeAccuracy >= 90) {
      insights.push({
        type: 'success' as const,
        message: '⏱️ Your time estimation is highly accurate!',
      })
    } else if (timeAccuracy >= 70) {
      insights.push({
        type: 'info' as const,
        message: '⏱️ Good time management with room for refinement.',
      })
    } else if (timeDifference && timeDifference > 0) {
      insights.push({
        type: 'warning' as const,
        message: `⏱️ You took ${timeDifference}min longer than estimated. Consider adjusting future estimates.`,
      })
    } else if (timeDifference && timeDifference < 0) {
      insights.push({
        type: 'info' as const,
        message: `⏱️ You finished ${Math.abs(timeDifference)}min early! Great efficiency.`,
      })
    }
  }

  if (successPercentage !== null) {
    if (successPercentage >= 90) {
      insights.push({
        type: 'success' as const,
        message: '🌟 Outstanding performance! Keep up the excellent work.',
      })
    } else if (successPercentage >= 70) {
      insights.push({
        type: 'success' as const,
        message: '👏 Strong performance overall.',
      })
    } else if (successPercentage >= 50) {
      insights.push({
        type: 'warning' as const,
        message: '📚 Consider reviewing challenging topics for better results.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Completion Rate"
          value={`${Math.round(completionRate)}%`}
          subtitle={`${mission.completedObjectivesCount}/${mission.totalObjectives} objectives`}
          icon={Target}
          trend={
            completionRate >= 80
              ? { direction: 'up', value: completionRate, label: 'excellent' }
              : completionRate >= 60
                ? { direction: 'neutral', value: completionRate, label: 'good' }
                : { direction: 'down', value: completionRate, label: 'needs work' }
          }
          variant={completionRate >= 80 ? 'success' : completionRate >= 60 ? 'warning' : 'default'}
        />

        <MetricCard
          title="Time Spent"
          value={`${mission.actualMinutes || mission.estimatedMinutes}min`}
          subtitle={`est. ${mission.estimatedMinutes}min`}
          icon={Clock}
          trend={
            timeDifference !== null
              ? {
                  direction: timeDifference > 0 ? 'up' : timeDifference < 0 ? 'down' : 'neutral',
                  value: Math.abs(timeDifference),
                  label: timeDifference > 0 ? 'over' : timeDifference < 0 ? 'under' : 'exact',
                }
              : undefined
          }
          variant={
            timeAccuracy !== null
              ? timeAccuracy >= 90
                ? 'success'
                : timeAccuracy >= 70
                  ? 'info'
                  : 'warning'
              : 'default'
          }
        />

        {timeAccuracy !== null && (
          <MetricCard
            title="Time Accuracy"
            value={`${Math.round(timeAccuracy)}%`}
            subtitle="estimation accuracy"
            icon={Zap}
            trend={{
              direction: timeAccuracy >= 80 ? 'up' : 'neutral',
              value: timeAccuracy,
              label: timeAccuracy >= 90 ? 'excellent' : 'good',
            }}
            variant={timeAccuracy >= 80 ? 'success' : 'info'}
          />
        )}

        {successPercentage !== null && (
          <MetricCard
            title="Success Score"
            value={`${Math.round(successPercentage)}%`}
            subtitle="overall performance"
            icon={Award}
            trend={{
              direction: successPercentage >= 80 ? 'up' : successPercentage >= 60 ? 'neutral' : 'down',
              value: successPercentage,
              label:
                successPercentage >= 90
                  ? 'excellent'
                  : successPercentage >= 70
                    ? 'good'
                    : 'fair',
            }}
            variant={
              successPercentage >= 80 ? 'success' : successPercentage >= 60 ? 'info' : 'warning'
            }
          />
        )}

        {mission.difficultyRating && (
          <MetricCard
            title="Difficulty"
            value={'⭐'.repeat(mission.difficultyRating)}
            subtitle={`${mission.difficultyRating} out of 5`}
            icon={TrendingUp}
            variant="default"
          />
        )}
      </div>

      {/* Insights & Recommendations */}
      {showRecommendations && insights.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg text-sm',
                  insight.type === 'success' && 'bg-green-50 text-green-900 border border-green-200',
                  insight.type === 'warning' && 'bg-yellow-50 text-yellow-900 border border-yellow-200',
                  insight.type === 'info' && 'bg-blue-50 text-blue-900 border border-blue-200'
                )}
              >
                {insight.message}
              </div>
            ))}

            {/* Additional Recommendations */}
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <p className="text-sm font-medium text-gray-700">Recommendations:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {completionRate < 100 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Review incomplete objectives and schedule dedicated time to complete them
                    </span>
                  </li>
                )}
                {timeAccuracy !== null && timeAccuracy < 80 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Track your actual time spent to improve future time estimates
                    </span>
                  </li>
                )}
                {successPercentage !== null && successPercentage < 80 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Focus on high-yield objectives and consider additional practice sessions
                    </span>
                  </li>
                )}
                {mission.difficultyRating && mission.difficultyRating >= 4 && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>
                      Break down challenging missions into smaller, manageable chunks
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

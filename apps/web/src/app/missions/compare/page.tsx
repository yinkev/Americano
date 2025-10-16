'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, parseISO, differenceInMinutes } from 'date-fns'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface MissionObjective {
  objectiveId: string
  objective: {
    objective: string
    complexity: string
    isHighYield: boolean
  }
  estimatedMinutes: number
  completed: boolean
  completedAt?: string
  notes?: string
}

interface Mission {
  id: string
  date: string
  status: 'COMPLETED' | 'SKIPPED' | 'PENDING' | 'IN_PROGRESS'
  estimatedMinutes: number
  actualMinutes?: number
  completedObjectivesCount: number
  objectives: MissionObjective[]
  successScore?: number
  difficultyRating?: number
}

function ComparisonContent() {
  const searchParams = useSearchParams()
  const ids = searchParams?.get('ids')?.split(',') || []

  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (ids.length > 0) {
      fetchMissions()
    }
  }, [ids])

  async function fetchMissions() {
    try {
      setLoading(true)
      const fetchPromises = ids.map((id) =>
        fetch(`/api/missions/${id}`, {
          headers: {
            'X-User-Email': 'kevy@americano.dev',
          },
        }).then((res) => res.json())
      )

      const results = await Promise.all(fetchPromises)
      const validMissions = results
        .filter((r) => r.success)
        .map((r) => r.data.mission)

      setMissions(validMissions)
    } catch (error) {
      console.error('Failed to fetch missions for comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateComparison(mission1: Mission, mission2: Mission) {
    const m1CompletionRate =
      mission1.objectives.length > 0
        ? (mission1.completedObjectivesCount / mission1.objectives.length) * 100
        : 0
    const m2CompletionRate =
      mission2.objectives.length > 0
        ? (mission2.completedObjectivesCount / mission2.objectives.length) * 100
        : 0

    const completionDiff = m2CompletionRate - m1CompletionRate

    const m1TimeAccuracy = mission1.actualMinutes
      ? 100 -
        Math.abs(
          ((mission1.actualMinutes - mission1.estimatedMinutes) /
            mission1.estimatedMinutes) *
            100
        )
      : 0
    const m2TimeAccuracy = mission2.actualMinutes
      ? 100 -
        Math.abs(
          ((mission2.actualMinutes - mission2.estimatedMinutes) /
            mission2.estimatedMinutes) *
            100
        )
      : 0

    const timeAccuracyDiff = m2TimeAccuracy - m1TimeAccuracy

    const successDiff = ((mission2.successScore ?? 0) - (mission1.successScore ?? 0)) * 100

    const timeDiff = mission2.actualMinutes && mission1.actualMinutes
      ? mission2.actualMinutes - mission1.actualMinutes
      : 0

    return {
      completionDiff,
      timeAccuracyDiff,
      successDiff,
      timeDiff,
      m1CompletionRate,
      m2CompletionRate,
      m1TimeAccuracy,
      m2TimeAccuracy,
    }
  }

  function renderComparisonIndicator(diff: number, suffix: string = '%') {
    if (Math.abs(diff) < 1) {
      return (
        <div className="flex items-center gap-2 text-[oklch(0.556_0_0)]">
          <Minus className="size-4" />
          <span className="text-sm">No change</span>
        </div>
      )
    }

    const isPositive = diff > 0
    return (
      <div
        className={`flex items-center gap-2 ${
          isPositive ? 'text-[oklch(0.75_0.15_160)]' : 'text-[oklch(0.65_0.15_10)]'
        }`}
      >
        {isPositive ? (
          <TrendingUp className="size-4" />
        ) : (
          <TrendingDown className="size-4" />
        )}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}
          {diff.toFixed(1)}
          {suffix}
        </span>
      </div>
    )
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'COMPLETED':
        return 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)] border-[oklch(0.75_0.15_160)]/20'
      case 'SKIPPED':
        return 'bg-[oklch(0.556_0_0)]/10 text-[oklch(0.556_0_0)] border-[oklch(0.556_0_0)]/20'
      case 'IN_PROGRESS':
        return 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)] border-[oklch(0.7_0.15_50)]/20'
      default:
        return 'bg-[oklch(0.922_0_0)] text-[oklch(0.556_0_0)] border-[oklch(0.922_0_0)]'
    }
  }

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[oklch(0.922_0_0)] rounded w-1/3" />
          <div className="h-96 bg-[oklch(0.922_0_0)] rounded" />
        </div>
      </div>
    )
  }

  if (missions.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <Link href="/missions/history">
          <Button variant="outline" className="border-white/30 hover:bg-white/60">
            <ArrowLeft className="size-4 mr-2" />
            Back to History
          </Button>
        </Link>
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-12 text-center">
          <Target className="size-12 mx-auto mb-4 text-[oklch(0.556_0_0)]" />
          <p className="text-lg font-medium text-[oklch(0.145_0_0)] mb-2">
            No missions to compare
          </p>
          <p className="text-sm text-[oklch(0.556_0_0)]">
            Select at least 2 missions from your history to compare.
          </p>
        </div>
      </div>
    )
  }

  if (missions.length === 1) {
    return (
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <Link href="/missions/history">
          <Button variant="outline" className="border-white/30 hover:bg-white/60">
            <ArrowLeft className="size-4 mr-2" />
            Back to History
          </Button>
        </Link>
        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-12 text-center">
          <Target className="size-12 mx-auto mb-4 text-[oklch(0.556_0_0)]" />
          <p className="text-lg font-medium text-[oklch(0.145_0_0)] mb-2">
            Select one more mission
          </p>
          <p className="text-sm text-[oklch(0.556_0_0)]">
            Comparison requires at least 2 missions.
          </p>
        </div>
      </div>
    )
  }

  // For now, compare first two missions if more than 2 are selected
  const [mission1, mission2] = missions.slice(0, 2)
  const comparison = calculateComparison(mission1, mission2)

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/missions/history">
            <Button variant="outline" className="border-white/30 hover:bg-white/60 mb-4">
              <ArrowLeft className="size-4 mr-2" />
              Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-[oklch(0.145_0_0)]">
            Mission Comparison
          </h1>
          <p className="text-[oklch(0.556_0_0)]">
            Compare your missions side-by-side to track improvement and identify patterns.
          </p>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
        <h2 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)] mb-4">
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Completion Rate Change */}
          <div className="space-y-2">
            <p className="text-sm text-[oklch(0.556_0_0)]">Completion Rate</p>
            {renderComparisonIndicator(comparison.completionDiff)}
          </div>

          {/* Time Accuracy Change */}
          <div className="space-y-2">
            <p className="text-sm text-[oklch(0.556_0_0)]">Time Accuracy</p>
            {renderComparisonIndicator(comparison.timeAccuracyDiff)}
          </div>

          {/* Success Score Change */}
          <div className="space-y-2">
            <p className="text-sm text-[oklch(0.556_0_0)]">Success Score</p>
            {renderComparisonIndicator(comparison.successDiff)}
          </div>

          {/* Duration Change */}
          <div className="space-y-2">
            <p className="text-sm text-[oklch(0.556_0_0)]">Time Spent</p>
            {renderComparisonIndicator(comparison.timeDiff, ' min')}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[mission1, mission2].map((mission, idx) => {
          const completionRate =
            mission.objectives.length > 0
              ? (mission.completedObjectivesCount / mission.objectives.length) * 100
              : 0

          return (
            <div
              key={mission.id}
              className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6 space-y-6"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
                    {idx === 0 ? 'Mission 1' : 'Mission 2'}
                  </h3>
                  <Badge variant="outline" className={getStatusColor(mission.status)}>
                    {mission.status}
                  </Badge>
                </div>
                <p className="text-sm text-[oklch(0.556_0_0)]">
                  {format(parseISO(mission.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-4">
                {/* Completion */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[oklch(0.556_0_0)]">Completion</span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {mission.completedObjectivesCount} / {mission.objectives.length}{' '}
                      objectives
                    </span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                  <p className="text-xs text-right text-[oklch(0.556_0_0)]">
                    {Math.round(completionRate)}%
                  </p>
                </div>

                {/* Time */}
                {mission.actualMinutes && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[oklch(0.556_0_0)]">
                      <Clock className="size-4 inline mr-1" />
                      Time Spent
                    </span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {mission.actualMinutes} min
                      <span className="text-xs text-[oklch(0.556_0_0)] ml-1">
                        (est. {mission.estimatedMinutes} min)
                      </span>
                    </span>
                  </div>
                )}

                {/* Success Score */}
                {mission.successScore !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[oklch(0.556_0_0)]">
                      <Star className="size-4 inline mr-1" />
                      Success Score
                    </span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {Math.round(mission.successScore * 100)}%
                    </span>
                  </div>
                )}

                {/* Difficulty */}
                {mission.difficultyRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[oklch(0.556_0_0)]">Difficulty</span>
                    <span className="font-medium text-[oklch(0.145_0_0)]">
                      {'⭐'.repeat(mission.difficultyRating)}
                    </span>
                  </div>
                )}
              </div>

              {/* Objectives List */}
              <div className="space-y-3 pt-4 border-t border-white/30">
                <p className="text-sm font-medium text-[oklch(0.556_0_0)]">Objectives</p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {mission.objectives.map((obj, objIdx) => (
                    <div key={obj.objectiveId} className="flex items-start gap-2 text-sm">
                      <span
                        className={`flex-shrink-0 mt-0.5 ${
                          obj.completed
                            ? 'text-[oklch(0.75_0.15_160)]'
                            : 'text-[oklch(0.556_0_0)]'
                        }`}
                      >
                        {obj.completed ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <XCircle className="size-4" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`leading-relaxed ${
                            obj.completed
                              ? 'text-[oklch(0.556_0_0)] line-through'
                              : 'text-[oklch(0.145_0_0)]'
                          }`}
                        >
                          {obj.objective.objective}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[oklch(0.556_0_0)]">
                            {obj.estimatedMinutes} min
                          </span>
                          {obj.objective.isHighYield && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 h-4 bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)] border-[oklch(0.7_0.15_50)]/20"
                            >
                              High-Yield
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1 py-0 h-4"
                          >
                            {obj.objective.complexity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View Details Link */}
              <div className="pt-4 border-t border-white/30">
                <Link
                  href={`/missions/${mission.id}`}
                  className="text-sm font-medium text-[oklch(0.7_0.15_230)] hover:text-[oklch(0.65_0.15_230)] transition-colors"
                >
                  View Full Details →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MissionComparePage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-7xl mx-auto p-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[oklch(0.922_0_0)] rounded w-1/3" />
            <div className="h-96 bg-[oklch(0.922_0_0)] rounded" />
          </div>
        </div>
      }
    >
      <ComparisonContent />
    </Suspense>
  )
}

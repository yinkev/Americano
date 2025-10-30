'use client'

import { Calendar, CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MissionObjective {
  objectiveId: string
  objective?: {
    objective: string
    complexity: string
    isHighYield: boolean
  }
  estimatedMinutes: number
  completed: boolean
  completedAt?: string
  notes?: string
}

interface MissionCardProps {
  mission: {
    id: string
    date: Date | string
    status: 'COMPLETED' | 'SKIPPED' | 'PENDING' | 'IN_PROGRESS'
    estimatedMinutes: number
    actualMinutes?: number | null
    completedObjectivesCount: number
    objectives: MissionObjective[]
    successScore?: number | null
    difficultyRating?: number | null
  }
  onStart?: (missionId: string) => void
  onComplete?: (missionId: string) => void
  onSkip?: (missionId: string) => void
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
}

const statusConfig = {
  PENDING: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgColor: 'bg-gray-50',
    icon: Clock,
  },
  IN_PROGRESS: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50',
    icon: TrendingUp,
  },
  COMPLETED: {
    color: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50',
    icon: CheckCircle2,
  },
  SKIPPED: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50',
    icon: Calendar,
  },
}

export function MissionCard({
  mission,
  onStart,
  onComplete,
  onSkip,
  variant = 'default',
  showActions = false,
}: MissionCardProps) {
  const date = mission.date instanceof Date ? mission.date : new Date(mission.date)
  const StatusIcon = statusConfig[mission.status].icon

  // Parse objectives if they're strings
  let objectives: MissionObjective[] = []
  if (typeof mission.objectives === 'string') {
    try {
      objectives = JSON.parse(mission.objectives)
    } catch {
      objectives = []
    }
  } else {
    objectives = mission.objectives
  }

  const completedCount =
    mission.completedObjectivesCount || objectives.filter((o) => o.completed).length
  const totalCount = objectives.length
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const timeAccuracy =
    mission.actualMinutes && mission.estimatedMinutes
      ? 100 -
        Math.abs(
          ((mission.actualMinutes - mission.estimatedMinutes) / mission.estimatedMinutes) * 100,
        )
      : null

  if (variant === 'compact') {
    return (
      <Link href={`/missions/${mission.id}`} className="block group">
        <Card className="bg-white/80 backdrop-blur-md border-white/20 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', statusConfig[mission.status].bgColor)}>
                  <StatusIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {completedCount}/{totalCount} objectives
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={statusConfig[mission.status].color}>
                {mission.status}
              </Badge>
            </div>
            <div className="mt-3">
              <Progress value={completionRate} className="h-1" />
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20 hover:shadow-xl transition-all duration-300 group overflow-hidden">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('p-2 rounded-lg', statusConfig[mission.status].bgColor)}>
                <StatusIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-gray-900">
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={statusConfig[mission.status].color}>
                    {mission.status}
                  </Badge>
                  {mission.successScore && mission.successScore > 0.8 && (
                    <Badge
                      variant="outline"
                      className="bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      ⭐ High Performance
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Link href={`/missions/${mission.id}`}>
            <Button variant="ghost" size="sm" className="group-hover:bg-primary/10">
              View Details →
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-600">Objectives</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {completedCount}/{totalCount}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-600">Time</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {mission.actualMinutes || mission.estimatedMinutes}
              <span className="text-xs text-gray-500 ml-1">min</span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-600">Completion</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{Math.round(completionRate)}%</p>
          </div>

          {timeAccuracy !== null && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs text-gray-600">Accuracy</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{Math.round(timeAccuracy)}%</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Objectives Preview */}
        {variant === 'detailed' && objectives.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-2">Objectives</p>
            {objectives.slice(0, 3).map((obj, idx) => (
              <div key={obj.objectiveId} className="flex items-start gap-2 text-sm">
                <span
                  className={cn(
                    'flex-shrink-0 mt-0.5',
                    obj.completed ? 'text-green-600' : 'text-gray-400',
                  )}
                >
                  {obj.completed ? '✓' : `${idx + 1}.`}
                </span>
                <p
                  className={cn(
                    'flex-1 leading-relaxed',
                    obj.completed ? 'text-gray-500 line-through' : 'text-gray-700',
                  )}
                >
                  {obj.objective?.objective || 'Objective'}
                </p>
              </div>
            ))}
            {objectives.length > 3 && (
              <p className="text-xs text-gray-500 pl-6">+{objectives.length - 3} more objectives</p>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            {mission.status === 'PENDING' && onStart && (
              <Button
                onClick={() => onStart(mission.id)}
                size="sm"
                className="flex-1"
                variant="default"
              >
                Start Mission
              </Button>
            )}
            {mission.status === 'IN_PROGRESS' && onComplete && (
              <Button
                onClick={() => onComplete(mission.id)}
                size="sm"
                className="flex-1"
                variant="default"
              >
                Complete
              </Button>
            )}
            {(mission.status === 'PENDING' || mission.status === 'IN_PROGRESS') && onSkip && (
              <Button
                onClick={() => onSkip(mission.id)}
                size="sm"
                className="flex-1"
                variant="outline"
              >
                Skip
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

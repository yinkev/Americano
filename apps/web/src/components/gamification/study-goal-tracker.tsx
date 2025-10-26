'use client'

import { BookOpen, CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export type GoalType = 'TIME_BASED' | 'OBJECTIVE_BASED' | 'REVIEW_BASED'
export type GoalPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY'

interface StudyGoal {
  id: string
  goalType: GoalType
  targetValue: number
  currentProgress: number
  period: GoalPeriod
  startDate: Date
  endDate: Date
  isCompleted: boolean
}

interface StudyGoalTrackerProps {
  goals: StudyGoal[]
  className?: string
}

const GOAL_TYPE_CONFIG: Record<GoalType, { icon: React.ElementType; label: string; unit: string }> =
  {
    TIME_BASED: {
      icon: Clock,
      label: 'Study Time',
      unit: 'minutes',
    },
    OBJECTIVE_BASED: {
      icon: Target,
      label: 'Objectives',
      unit: 'completed',
    },
    REVIEW_BASED: {
      icon: BookOpen,
      label: 'Card Reviews',
      unit: 'cards',
    },
  }

const PERIOD_LABELS: Record<GoalPeriod, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
}

function formatTimeValue(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function GoalCard({ goal }: { goal: StudyGoal }) {
  const config = GOAL_TYPE_CONFIG[goal.goalType]
  const Icon = config.icon
  const progress = Math.min((goal.currentProgress / goal.targetValue) * 100, 100)
  const isNearCompletion = progress >= 80 && !goal.isCompleted
  const progressColor = goal.isCompleted
    ? 'oklch(0.65 0.20 145)'
    : isNearCompletion
      ? 'oklch(0.75 0.15 85)'
      : 'oklch(0.65 0.15 230)'

  return (
    <Card className="overflow-hidden border transition-all hover:shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${progressColor} / 0.15`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color: progressColor }} />
            </div>
            <span>{config.label}</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {PERIOD_LABELS[goal.period]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress value */}
        <div className="flex items-baseline justify-between">
          <div className="space-y-0.5">
            <p className="text-2xl font-bold tabular-nums" style={{ color: progressColor }}>
              {goal.goalType === 'TIME_BASED'
                ? formatTimeValue(goal.currentProgress)
                : goal.currentProgress}
            </p>
            <p className="text-xs text-muted-foreground">
              of{' '}
              {goal.goalType === 'TIME_BASED'
                ? formatTimeValue(goal.targetValue)
                : goal.targetValue}{' '}
              {goal.goalType !== 'TIME_BASED' && config.unit}
            </p>
          </div>
          {goal.isCompleted && (
            <CheckCircle2 className="h-6 w-6" style={{ color: 'oklch(0.65 0.20 145)' }} />
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress
            value={progress}
            className="h-2"
            style={{
              ['--progress-background' as string]: progressColor,
            }}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}% complete</span>
            {!goal.isCompleted && (
              <span>
                {goal.goalType === 'TIME_BASED'
                  ? formatTimeValue(goal.targetValue - goal.currentProgress)
                  : goal.targetValue - goal.currentProgress}{' '}
                remaining
              </span>
            )}
          </div>
        </div>

        {/* Completion message */}
        {goal.isCompleted && (
          <div
            className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium"
            style={{
              backgroundColor: 'oklch(0.65 0.20 145) / 0.1',
              color: 'oklch(0.45 0.20 145)',
            }}
          >
            <TrendingUp className="h-4 w-4" />
            Goal completed! Keep up the momentum!
          </div>
        )}

        {/* Near completion message */}
        {isNearCompletion && (
          <div
            className="flex items-center gap-2 rounded-lg p-2 text-xs font-medium"
            style={{
              backgroundColor: 'oklch(0.75 0.15 85) / 0.1',
              color: 'oklch(0.55 0.20 85)',
            }}
          >
            <TrendingUp className="h-4 w-4" />
            Almost there! Just a little more to go.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StudyGoalTracker({ goals, className = '' }: StudyGoalTrackerProps) {
  if (goals.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground opacity-50" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">No active study goals</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set goals to track your progress and stay motivated
          </p>
        </CardContent>
      </Card>
    )
  }

  // Separate active and completed goals
  const activeGoals = goals.filter((g) => !g.isCompleted)
  const completedGoals = goals.filter((g) => g.isCompleted)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Active goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Active Goals</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Completed Goals</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebars/headers
interface StudyGoalTrackerCompactProps {
  goal: StudyGoal
  className?: string
}

export function StudyGoalTrackerCompact({ goal, className = '' }: StudyGoalTrackerCompactProps) {
  const config = GOAL_TYPE_CONFIG[goal.goalType]
  const Icon = config.icon
  const progress = Math.min((goal.currentProgress / goal.targetValue) * 100, 100)
  const progressColor = goal.isCompleted ? 'oklch(0.65 0.20 145)' : 'oklch(0.65 0.15 230)'

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: progressColor }} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {PERIOD_LABELS[goal.period]}
        </Badge>
      </div>
      <div className="space-y-1">
        <Progress
          value={progress}
          className="h-1.5"
          style={{
            ['--progress-background' as string]: progressColor,
          }}
        />
        <p className="text-xs text-muted-foreground">
          {goal.goalType === 'TIME_BASED'
            ? `${formatTimeValue(goal.currentProgress)} / ${formatTimeValue(goal.targetValue)}`
            : `${goal.currentProgress} / ${goal.targetValue} ${config.unit}`}
        </p>
      </div>
    </div>
  )
}

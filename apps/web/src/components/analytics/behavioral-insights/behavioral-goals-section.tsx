/**
 * BehavioralGoalsSection Component
 *
 * Displays behavioral goals with progress tracking and goal creation dialog.
 * Features:
 * - List of goals with color-coded progress bars
 * - Status indicators (active, completed, failed, abandoned)
 * - Dialog form for creating new goals
 * - Progress tracking from API
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 4 (Behavioral Goals)
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Plus, Target, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'

type GoalType =
  | 'INCREASE_RETENTION'
  | 'REDUCE_STRUGGLE'
  | 'IMPROVE_EFFICIENCY'
  | 'OPTIMIZE_TIMING'
  | 'ENHANCE_CONSISTENCY'

type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ABANDONED'

interface BehavioralGoal {
  id: string
  userId: string
  goalType: GoalType
  targetValue: number
  currentValue: number
  deadline: Date
  status: GoalStatus
  createdAt: Date
}

interface BehavioralGoalsSectionProps {
  userId: string
  isLoading?: boolean
}

// Goal type configuration
const GOAL_CONFIG: Record<
  GoalType,
  {
    label: string
    description: string
    unit: string
  }
> = {
  INCREASE_RETENTION: {
    label: 'Increase Retention',
    description: 'Improve long-term memory retention',
    unit: '%',
  },
  REDUCE_STRUGGLE: {
    label: 'Reduce Struggle',
    description: 'Minimize learning difficulties',
    unit: 'sessions',
  },
  IMPROVE_EFFICIENCY: {
    label: 'Improve Efficiency',
    description: 'Complete sessions faster',
    unit: 'min',
  },
  OPTIMIZE_TIMING: {
    label: 'Optimize Timing',
    description: 'Study at peak performance times',
    unit: '%',
  },
  ENHANCE_CONSISTENCY: {
    label: 'Enhance Consistency',
    description: 'Maintain regular study habits',
    unit: 'days',
  },
}

// Status styling
const STATUS_CONFIG: Record<
  GoalStatus,
  {
    label: string
    color: string
    progressColor: string
  }
> = {
  ACTIVE: {
    label: 'Active',
    color: 'bg-blue-600 text-white',
    progressColor: 'oklch(0.7 0.15 220)',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-600 text-white',
    progressColor: 'oklch(0.7 0.15 140)',
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-600 text-white',
    progressColor: 'oklch(0.6 0.2 20)',
  },
  ABANDONED: {
    label: 'Abandoned',
    color: 'bg-gray-500 text-white',
    progressColor: 'oklch(0.5 0.05 220)',
  },
}

export function BehavioralGoalsSection({
  userId,
  isLoading: isLoadingProp = false,
}: BehavioralGoalsSectionProps) {
  const [goals, setGoals] = useState<BehavioralGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [goalType, setGoalType] = useState<GoalType>('INCREASE_RETENTION')
  const [targetValue, setTargetValue] = useState<string>('80')
  const [deadline, setDeadline] = useState<string>(
    format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  )

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/analytics/behavioral-insights/goals?userId=${userId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch goals')
        }

        const data = await response.json()
        if (data.success && data.goals) {
          setGoals(data.goals)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGoals()
  }, [userId])

  const handleCreateGoal = async () => {
    try {
      setIsCreating(true)
      const response = await fetch('/api/analytics/behavioral-insights/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          goalType,
          targetValue: parseFloat(targetValue),
          deadline: new Date(deadline).toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create goal')
      }

      const data = await response.json()
      if (data.success && data.goal) {
        setGoals([...goals, data.goal])
        setDialogOpen(false)
        // Reset form
        setGoalType('INCREASE_RETENTION')
        setTargetValue('80')
        setDeadline(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'))
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create goal')
    } finally {
      setIsCreating(false)
    }
  }

  const calculateProgress = (goal: BehavioralGoal): number => {
    if (goal.targetValue === 0) return 0
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
  }

  // Empty state
  if (!isLoading && !isLoadingProp && goals.length === 0 && !error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Create your first behavioral goal to start improving your learning habits
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Behavioral Goal</DialogTitle>
                <DialogDescription>
                  Set a goal to improve your learning habits and track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goalType">Goal Type</Label>
                  <Select value={goalType} onValueChange={(val) => setGoalType(val as GoalType)}>
                    <SelectTrigger id="goalType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetValue">Target Value ({GOAL_CONFIG[goalType].unit})</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGoal} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Goals</h3>
          <p className="text-muted-foreground text-center">{error}</p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading || isLoadingProp) {
    return (
      <Card className="bg-white/80 backdrop-blur-md animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Behavioral Goals</CardTitle>
            <CardDescription>Track your progress toward better learning habits</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Behavioral Goal</DialogTitle>
                <DialogDescription>
                  Set a goal to improve your learning habits and track your progress
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goalType">Goal Type</Label>
                  <Select value={goalType} onValueChange={(val) => setGoalType(val as GoalType)}>
                    <SelectTrigger id="goalType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {config.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetValue">Target Value ({GOAL_CONFIG[goalType].unit})</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="80"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGoal} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => {
          const config = GOAL_CONFIG[goal.goalType]
          const statusConfig = STATUS_CONFIG[goal.status]
          const progress = calculateProgress(goal)

          return (
            <Card key={goal.id} className="bg-white/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{config.label}</h3>
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: statusConfig.progressColor }}
                    >
                      {progress}%
                    </div>
                  </div>
                </div>

                <Progress
                  value={progress}
                  className="h-2 mb-3"
                  style={
                    {
                      '--progress-background': statusConfig.progressColor,
                    } as React.CSSProperties
                  }
                />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        {goal.currentValue} / {goal.targetValue} {config.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Due {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}

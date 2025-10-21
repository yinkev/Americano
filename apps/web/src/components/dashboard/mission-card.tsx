'use client'

import { useState, useEffect } from 'react'
import { Target, ChevronRight, RefreshCw, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { MissionWithObjectives, MissionProgress } from '@/types/mission'
import { getMissionObjectives } from '@/types/mission-helpers'

export function MissionCard() {
  const [mission, setMission] = useState<MissionWithObjectives | null>(null)
  const [progress, setProgress] = useState<MissionProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  // Fetch today's mission
  useEffect(() => {
    fetchMission()
  }, [])

  async function fetchMission() {
    try {
      setLoading(true)
      const response = await fetch('/api/learning/mission/today')
      const data = await response.json()

      if (data.success) {
        setMission(data.data.mission)
        setProgress(data.data.progress)
      }
    } catch (error) {
      console.error('Failed to fetch mission:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    if (!mission) return

    try {
      setRegenerating(true)
      const response = await fetch(`/api/learning/mission/${mission.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (data.success) {
        setMission(data.data.mission)
        // Recalculate progress
        const objectives = data.data.objectives
        const completed = objectives.filter((obj: any) => obj.completed).length
        setProgress({
          total: objectives.length,
          completed,
          percentage: Math.round((completed / objectives.length) * 100),
          estimatedMinutesRemaining: objectives
            .filter((obj: any) => !obj.completed)
            .reduce((sum: number, obj: any) => sum + obj.estimatedMinutes, 0),
          actualMinutesSpent: 0,
        })
      }
    } catch (error) {
      console.error('Failed to regenerate mission:', error)
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[oklch(0.922_0_0)] rounded w-1/3" />
            <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-full" />
            <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!mission || !progress) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No mission available</p>
        </CardContent>
      </Card>
    )
  }

  const objectives = getMissionObjectives(mission)
  const nextObjective = objectives.find((obj) => !obj.completed)

  return (
    <Card interactive="interactive" className="bg-white/80 backdrop-blur-md border-white/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Target className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Today's Mission
              </h2>
              <p className="text-xs text-muted-foreground">
                {new Date(mission.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRegenerate}
            disabled={regenerating}
            aria-label="Regenerate mission"
          >
            <RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Progress</p>
            <span className="text-sm font-bold text-primary">
              {progress.completed} / {progress.total} objectives
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {progress.estimatedMinutesRemaining} min remaining
            </span>
            {mission.status === 'COMPLETED' && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="size-3" />
                Complete
              </span>
            )}
          </div>
        </div>

        {/* Objective List */}
        <div className="space-y-2">
          {objectives.slice(0, 3).map((obj, idx) => (
            <div key={obj.objectiveId} className="flex items-start gap-2 text-sm">
              <span
                className={`flex-shrink-0 mt-0.5 ${
                  obj.completed ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                {obj.completed ? '✅' : `${idx + 1}.`}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium leading-relaxed ${
                    obj.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}
                >
                  {obj.objective?.objective || 'Loading...'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{obj.estimatedMinutes} min</span>
                  {obj.objective?.isHighYield && <span className="text-xs">⭐ High-yield</span>}
                  {obj.objective?.complexity && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 ${
                        obj.objective.complexity === 'BASIC'
                          ? 'bg-success/10 text-success border-success/20'
                          : obj.objective.complexity === 'INTERMEDIATE'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-energy/10 text-energy border-energy/20'
                      }`}
                    >
                      {obj.objective.complexity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          {objectives.length > 3 && (
            <p className="text-xs text-muted-foreground pl-6">
              +{objectives.length - 3} more objectives
            </p>
          )}
        </div>

        {/* Next Task Preview / Actions */}
        {nextObjective ? (
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">NEXT UP</p>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {nextObjective.objective?.objective}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextObjective.estimatedMinutes} min
                </p>
              </div>
              <Button
                size="icon"
                onClick={() => {
                  window.location.href = `/study?missionId=${mission.id}`
                }}
                aria-label="Start mission"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-border text-center">
            <p className="text-sm font-medium text-success">🎉 Mission complete!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

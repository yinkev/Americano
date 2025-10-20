'use client'

import { useState, useEffect } from 'react'
import { Target, ChevronRight, RefreshCw, Clock, CheckCircle2 } from 'lucide-react'
import type { MissionWithObjectives, MissionProgress } from '@/types/mission'

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
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[oklch(0.922_0_0)] rounded w-1/3" />
          <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-full" />
          <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!mission || !progress) {
    return (
      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
        <p className="text-sm text-[oklch(0.556_0_0)]">No mission available</p>
      </div>
    )
  }

  const objectives = (mission.objectives as any[]) || []
  const nextObjective = objectives.find((obj) => !obj.completed)

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all duration-200 p-6">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-2">
            <Target className="size-5 text-[oklch(0.7_0.15_230)]" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-semibold text-[oklch(0.145_0_0)]">
              Today's Mission
            </h2>
            <p className="text-xs text-[oklch(0.556_0_0)]">
              {new Date(mission.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="rounded-lg bg-white/60 p-2 text-[oklch(0.556_0_0)]
                     hover:bg-white/80 transition-colors duration-200
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Regenerate mission"
          type="button"
        >
          <RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Mission Progress */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[oklch(0.556_0_0)]">Progress</p>
            <span className="text-sm font-bold text-[oklch(0.7_0.15_230)]">
              {progress.completed} / {progress.total} objectives
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-[oklch(0.97_0_0)]">
            <div
              className="h-full rounded-full bg-[oklch(0.75_0.15_160)] transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-[oklch(0.556_0_0)]">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {progress.estimatedMinutesRemaining} min remaining
            </span>
            {mission.status === 'COMPLETED' && (
              <span className="flex items-center gap-1 text-[oklch(0.75_0.15_160)]">
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
                  obj.completed ? 'text-[oklch(0.75_0.15_160)]' : 'text-[oklch(0.556_0_0)]'
                }`}
              >
                {obj.completed ? '✅' : `${idx + 1}.`}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium leading-relaxed ${
                    obj.completed
                      ? 'text-[oklch(0.556_0_0)] line-through'
                      : 'text-[oklch(0.145_0_0)]'
                  }`}
                >
                  {obj.objective?.objective || 'Loading...'}
                </p>
                <p className="text-xs text-[oklch(0.556_0_0)] mt-0.5">
                  {obj.estimatedMinutes} min
                  {obj.objective?.isHighYield && ' • ⭐ High-yield'}
                  {obj.objective?.complexity && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        obj.objective.complexity === 'BASIC'
                          ? 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)]'
                          : obj.objective.complexity === 'INTERMEDIATE'
                            ? 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)]'
                            : 'bg-[oklch(0.65_0.15_10)]/10 text-[oklch(0.65_0.15_10)]'
                      }`}
                    >
                      {obj.objective.complexity}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {objectives.length > 3 && (
            <p className="text-xs text-[oklch(0.556_0_0)] pl-6">
              +{objectives.length - 3} more objectives
            </p>
          )}
        </div>

        {/* Next Task Preview / Actions */}
        {nextObjective ? (
          <div className="pt-4 border-t border-[oklch(0.922_0_0)]">
            <p className="text-xs font-medium text-[oklch(0.556_0_0)] mb-2">NEXT UP</p>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[oklch(0.145_0_0)] leading-relaxed">
                  {nextObjective.objective?.objective}
                </p>
                <p className="text-xs text-[oklch(0.556_0_0)] mt-1">
                  {nextObjective.estimatedMinutes} min
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = `/study?missionId=${mission.id}`
                }}
                className="flex-shrink-0 rounded-lg bg-[oklch(0.7_0.15_230)] p-2 text-white
                           hover:bg-[oklch(0.65_0.15_230)] transition-colors duration-200
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                           min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Start mission"
                type="button"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-[oklch(0.922_0_0)] text-center">
            <p className="text-sm font-medium text-[oklch(0.75_0.15_160)]">🎉 Mission complete!</p>
          </div>
        )}
      </div>
    </div>
  )
}

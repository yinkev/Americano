'use client'

import { useState, useEffect } from 'react'
import { Play, Coffee, BookOpen, Zap, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface ContentItem {
  id: string
  type: 'flashcard' | 'validation' | 'clinical'
  title: string
  duration: number
  completed?: boolean
}

interface SessionPhase {
  id: string
  name: string
  type: 'warm-up' | 'peak' | 'wind-down'
  duration: number
  content: ContentItem[]
  color: string
}

interface SessionPlan {
  id: string
  totalDuration: number
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
  phases: SessionPhase[]
  breaks: {
    time: number
    duration: number
  }[]
}

interface SessionPlanPreviewProps {
  timeSlot?: {
    startTime: string
    endTime: string
    duration: number
  }
  onCustomize?: () => void
  onStartSession?: () => void
}

export function SessionPlanPreview({
  timeSlot,
  onCustomize,
  onStartSession,
}: SessionPlanPreviewProps) {
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (timeSlot) {
      fetchSessionPlan()
    }
  }, [timeSlot])

  async function fetchSessionPlan() {
    if (!timeSlot) return

    try {
      setLoading(true)
      const response = await fetch('/api/orchestration/session-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: timeSlot.startTime,
          duration: timeSlot.duration,
        }),
      })
      const data = await response.json()

      if (data.success) {
        setSessionPlan(data.data.plan)
      }
    } catch (error) {
      console.error('Failed to fetch session plan:', error)
      // Fallback data for demonstration
      setSessionPlan({
        id: 'demo-plan',
        totalDuration: timeSlot.duration,
        intensity: 'MEDIUM',
        phases: [
          {
            id: 'warmup',
            name: 'Warm-up',
            type: 'warm-up',
            duration: 10,
            color: 'oklch(0.7_0.15_230)',
            content: [
              {
                id: '1',
                type: 'flashcard',
                title: 'Quick Review Cards',
                duration: 10,
              },
            ],
          },
          {
            id: 'peak',
            name: 'Peak Focus',
            type: 'peak',
            duration: 35,
            color: 'oklch(0.75_0.15_160)',
            content: [
              {
                id: '2',
                type: 'validation',
                title: 'Concept Validation',
                duration: 20,
              },
              {
                id: '3',
                type: 'clinical',
                title: 'Clinical Reasoning',
                duration: 15,
              },
            ],
          },
          {
            id: 'winddown',
            name: 'Wind-down',
            type: 'wind-down',
            duration: 15,
            color: 'oklch(0.7_0.15_50)',
            content: [
              {
                id: '4',
                type: 'flashcard',
                title: 'Reinforcement Cards',
                duration: 15,
              },
            ],
          },
        ],
        breaks: [
          { time: 25, duration: 5 },
          { time: 50, duration: 5 },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  function getIntensityColor(intensity: string) {
    switch (intensity) {
      case 'LOW':
        return 'bg-[oklch(0.7_0.15_230)]/10 text-[oklch(0.7_0.15_230)]'
      case 'MEDIUM':
        return 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)]'
      case 'HIGH':
        return 'bg-[oklch(0.65_0.15_10)]/10 text-[oklch(0.65_0.15_10)]'
      default:
        return 'bg-[oklch(0.922_0_0)]/10 text-[oklch(0.556_0_0)]'
    }
  }

  function getContentIcon(type: string) {
    switch (type) {
      case 'flashcard':
        return <BookOpen className="size-3" />
      case 'validation':
        return <Zap className="size-3" />
      case 'clinical':
        return <Settings className="size-3" />
      default:
        return <BookOpen className="size-3" />
    }
  }

  function formatTime(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (!timeSlot) {
    return (
      <Card className="rounded-xl bg-card  border border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="size-5" />
            Session Plan Preview
          </CardTitle>
          <CardDescription>
            Select a time slot to see your personalized session plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-[oklch(0.556_0_0)]">
            <Play className="size-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Choose an optimal time slot to preview your session plan</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="rounded-xl bg-card  border border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="size-5" />
            Session Plan Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-1/3 mb-2" />
              <div className="h-20 bg-[oklch(0.922_0_0)] rounded-xl mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[oklch(0.922_0_0)] rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!sessionPlan) {
    return null
  }

  return (
    <Card className="rounded-xl bg-card  border border-border shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="size-5 text-[oklch(0.7_0.15_230)]" />
              Session Plan Preview
            </CardTitle>
            <CardDescription>
              {timeSlot.startTime} - {timeSlot.endTime} ({formatTime(sessionPlan.totalDuration)})
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getIntensityColor(sessionPlan.intensity)}>
              {sessionPlan.intensity} intensity
            </Badge>
            <Button variant="outline" size="sm" onClick={onCustomize}>
              <Settings className="size-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline Visualization */}
        <div className="mb-6">
          <div className="relative">
            <div className="h-2 bg-[oklch(0.922_0_0)] rounded-full overflow-hidden">
              {sessionPlan.phases.map((phase, index) => {
                const previousPhases = sessionPlan.phases.slice(0, index)
                const previousDuration = previousPhases.reduce((sum, p) => sum + p.duration, 0)
                const widthPercent = (phase.duration / sessionPlan.totalDuration) * 100
                const leftPercent = (previousDuration / sessionPlan.totalDuration) * 100

                return (
                  <div
                    key={phase.id}
                    className="absolute h-full transition-all duration-300"
                    style={{
                      backgroundColor: `oklch(var(--${phase.color}))`,
                      width: `${widthPercent}%`,
                      left: `${leftPercent}%`,
                    }}
                  />
                )
              })}
            </div>

            {/* Break indicators */}
            {sessionPlan.breaks.map((breakTime, index) => {
              const leftPercent = (breakTime.time / sessionPlan.totalDuration) * 100
              return (
                <div
                  key={index}
                  className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-[oklch(0.7_0.15_50)] flex items-center justify-center"
                  style={{ left: `${leftPercent}%`, marginLeft: '-12px' }}
                >
                  <Coffee className="size-3 text-[oklch(0.7_0.15_50)]" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase Details */}
        <div className="space-y-4">
          {sessionPlan.phases.map((phase, phaseIndex) => (
            <div key={phase.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `oklch(var(--${phase.color}))` }}
                />
                <h4 className="font-semibold text-[oklch(0.145_0_0)]">
                  {phase.name} ({formatTime(phase.duration)})
                </h4>
              </div>

              <div className="ml-6 space-y-2">
                {phase.content.map((item, itemIndex) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[oklch(0.97_0_0)] border border-[oklch(0.922_0_0)]"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-[oklch(0.922_0_0)]">
                      {getContentIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[oklch(0.145_0_0)] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[oklch(0.556_0_0)]">
                        {item.duration} min • {item.type}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatTime(
                        sessionPlan.phases
                          .slice(0, phaseIndex)
                          .reduce((sum, p) => sum + p.duration, 0) +
                          sessionPlan.phases
                            .slice(0, phaseIndex + 1)
                            .reduce((sum, p) => sum + p.duration, 0) -
                          phase.duration +
                          item.duration,
                      )}
                    </Badge>
                  </div>
                ))}

                {/* Add break indicator after certain phases */}
                {sessionPlan.breaks.some(
                  (b) =>
                    b.time ===
                    sessionPlan.phases
                      .slice(0, phaseIndex + 1)
                      .reduce((sum, p) => sum + p.duration, 0),
                ) && (
                  <div className="flex items-center gap-2 py-2 border-l-2 border-dashed border-[oklch(0.7_0.15_50)] ml-4 pl-4">
                    <Coffee className="size-4 text-[oklch(0.7_0.15_50)]" />
                    <span className="text-sm text-[oklch(0.7_0.15_50)] font-medium">
                      5-min break
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[oklch(0.922_0_0)]">
          <Button
            onClick={onStartSession}
            className="flex-1 bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)]"
          >
            <Play className="size-4 mr-2" />
            Start Session
          </Button>
          <Button variant="outline" onClick={onCustomize}>
            <Settings className="size-4 mr-2" />
            Customize
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

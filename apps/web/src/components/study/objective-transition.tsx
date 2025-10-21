'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface LearningObjective {
  id: string
  objective: string
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  isHighYield: boolean
  pageStart?: number
  pageEnd?: number
  boardExamTags: string[]
  lecture: {
    id: string
    title: string
    courseId: string
    course: {
      name: string
    }
  }
}

interface MissionObjective {
  objectiveId: string
  objective?: LearningObjective
  estimatedMinutes: number
  completed: boolean
}

interface ObjectiveTransitionProps {
  completedObjective: LearningObjective
  nextObjective: MissionObjective
  delayMs: number
  onTransitionComplete: () => void
}

export function ObjectiveTransition({
  completedObjective,
  nextObjective,
  delayMs,
  onTransitionComplete,
}: ObjectiveTransitionProps) {
  const [countdown, setCountdown] = useState(Math.ceil(delayMs / 1000))

  useEffect(() => {
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Transition timer
    const transitionTimeout = setTimeout(() => {
      onTransitionComplete()
    }, delayMs)

    return () => {
      clearInterval(countdownInterval)
      clearTimeout(transitionTimeout)
    }
  }, [delayMs, onTransitionComplete])

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'BASIC':
        return 'oklch(0.65 0.2 140)' // Green
      case 'INTERMEDIATE':
        return 'oklch(0.65 0.15 80)' // Yellow
      case 'ADVANCED':
        return 'oklch(0.5 0.2 0)' // Red
      default:
        return 'oklch(0.55 0.2 250)' // Blue
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: 'oklch(0.2 0.05 250 / 0.8)' }}
    >
      <Card
        className="max-w-2xl w-full mx-4 p-8 backdrop-blur-xl border-0 animate-in fade-in zoom-in duration-300"
        style={{
          background: 'oklch(1 0 0 / 0.95)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
        }}
      >
        <div className="space-y-6">
          {/* Completed Objective */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div
                className="p-4 rounded-full"
                style={{ background: 'oklch(0.65 0.2 140 / 0.15)' }}
              >
                <CheckCircle2 className="w-12 h-12" style={{ color: 'oklch(0.65 0.2 140)' }} />
              </div>
            </div>
            <h2 className="text-2xl font-bold" style={{ color: 'oklch(0.3 0.15 250)' }}>
              Objective Completed!
            </h2>
            <div className="flex items-center justify-center gap-2">
              <Badge
                variant="outline"
                style={{
                  background: `${getComplexityColor(completedObjective.complexity)} / 0.15`,
                  color: getComplexityColor(completedObjective.complexity),
                  borderColor: getComplexityColor(completedObjective.complexity),
                }}
              >
                {completedObjective.complexity}
              </Badge>
              {completedObjective.isHighYield && <span className="text-lg">⭐</span>}
            </div>
            <p className="text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
              {completedObjective.objective}
            </p>
          </div>

          {/* Divider with Arrow */}
          <div className="flex items-center justify-center py-4">
            <div className="flex-1 h-px" style={{ background: 'oklch(0.8 0.05 250)' }} />
            <div className="px-4">
              <ArrowRight className="w-6 h-6" style={{ color: 'oklch(0.55 0.2 250)' }} />
            </div>
            <div className="flex-1 h-px" style={{ background: 'oklch(0.8 0.05 250)' }} />
          </div>

          {/* Next Objective */}
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold" style={{ color: 'oklch(0.4 0.15 250)' }}>
              Next Objective
            </h3>
            {nextObjective.objective && (
              <>
                <div className="flex items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    style={{
                      background: `${getComplexityColor(nextObjective.objective.complexity)} / 0.15`,
                      color: getComplexityColor(nextObjective.objective.complexity),
                      borderColor: getComplexityColor(nextObjective.objective.complexity),
                    }}
                  >
                    {nextObjective.objective.complexity}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {nextObjective.estimatedMinutes}m
                  </Badge>
                  {nextObjective.objective.isHighYield && <span className="text-lg">⭐</span>}
                </div>
                <p className="text-base font-medium" style={{ color: 'oklch(0.3 0.15 250)' }}>
                  {nextObjective.objective.objective}
                </p>
              </>
            )}
          </div>

          {/* Countdown */}
          <div className="text-center pt-4 space-y-2">
            <p className="text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
              Starting in
            </p>
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold"
              style={{
                background: 'oklch(0.55 0.2 250 / 0.15)',
                color: 'oklch(0.55 0.2 250)',
              }}
            >
              {countdown}
            </div>
          </div>

          {/* Manual start now (skip delay) */}
          <div className="text-center pt-3">
            <Button
              variant="outline"
              onClick={onTransitionComplete}
              className="min-h-[44px]"
              autoFocus
              aria-label="Start next objective now"
            >
              Start Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

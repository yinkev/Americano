'use client'

import { Coffee } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface PomodoroTimerProps {
  focusBlockMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  objectivesCompleted: number
  objectivesUntilLongBreak: number
  onBreakRecommended?: (isLongBreak: boolean) => void
}

/**
 * Pomodoro Timer Component (Story 2.5 Task 10)
 *
 * Displays Pomodoro-style focus block timer with break recommendations.
 * Integrates with session orchestration to recommend breaks between objectives.
 */
export function PomodoroTimer({
  focusBlockMinutes,
  shortBreakMinutes,
  longBreakMinutes,
  objectivesCompleted,
  objectivesUntilLongBreak,
  onBreakRecommended,
}: PomodoroTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [breakRecommended, setBreakRecommended] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 100)
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Calculate if we're in a focus block or break period
  const focusBlockMs = focusBlockMinutes * 60 * 1000
  const currentBlockElapsed = elapsed % focusBlockMs
  const percentComplete = (currentBlockElapsed / focusBlockMs) * 100

  // Check if break should be recommended
  useEffect(() => {
    if (percentComplete >= 100 && !breakRecommended) {
      const isLongBreak =
        objectivesCompleted > 0 && objectivesCompleted % objectivesUntilLongBreak === 0
      setBreakRecommended(true)
      onBreakRecommended?.(isLongBreak)
    } else if (percentComplete < 100 && breakRecommended) {
      setBreakRecommended(false)
    }
  }, [
    percentComplete,
    breakRecommended,
    objectivesCompleted,
    objectivesUntilLongBreak,
    onBreakRecommended,
  ])

  // Calculate next break type
  const isLongBreakNext =
    objectivesCompleted > 0 && (objectivesCompleted + 1) % objectivesUntilLongBreak === 0
  const nextBreakMinutes = isLongBreakNext ? longBreakMinutes : shortBreakMinutes

  // Format remaining time
  const remainingMs = focusBlockMs - currentBlockElapsed
  const remainingMinutes = Math.floor(remainingMs / 1000 / 60)
  const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
  const timeString = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`

  // Determine color based on progress
  let timerColor = 'oklch(0.55 0.2 250)' // Blue - normal
  if (percentComplete >= 100) {
    timerColor = 'oklch(0.65 0.2 140)' // Green - break time
  } else if (percentComplete >= 80) {
    timerColor = 'oklch(0.65 0.15 80)' // Yellow - almost done
  }

  return (
    <div className="flex items-center gap-3">
      <Coffee className="w-5 h-5" style={{ color: timerColor }} />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums" style={{ color: timerColor }}>
            {timeString}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {focusBlockMinutes}m focus
            </Badge>
            <span className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
              • {nextBreakMinutes}m {isLongBreakNext ? 'long' : 'short'} break next
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full mt-2 bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(percentComplete, 100)}%`,
              background: timerColor,
            }}
          />
        </div>
      </div>
    </div>
  )
}

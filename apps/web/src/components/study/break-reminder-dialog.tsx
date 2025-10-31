'use client'

import { Clock, Coffee, SkipForward } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BreakReminderDialogProps {
  open: boolean
  isLongBreak: boolean
  breakMinutes: number
  onTakeBreak: () => void
  onSkipBreak: () => void
}

/**
 * Break Reminder Dialog (Story 2.5 Task 10)
 *
 * Pomodoro-style break reminder that suggests taking breaks
 * between objectives to maintain focus and prevent burnout.
 */
export function BreakReminderDialog({
  open,
  isLongBreak,
  breakMinutes,
  onTakeBreak,
  onSkipBreak,
}: BreakReminderDialogProps) {
  const [countdown, setCountdown] = useState(breakMinutes * 60)
  const [takingBreak, setTakingBreak] = useState(false)

  useEffect(() => {
    if (!takingBreak) {
      setCountdown(breakMinutes * 60)
      return
    }

    const interval = setInterval(() => {
      setCountdown((prev: any) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTakeBreak()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [takingBreak, breakMinutes, onTakeBreak])

  const handleTakeBreak = () => {
    setTakingBreak(true)
  }

  const handleSkipBreak = () => {
    setTakingBreak(false)
    onSkipBreak()
  }

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  return (
    <Dialog open={open} onOpenChange={(open: any) => !open && handleSkipBreak()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coffee className="w-5 h-5" style={{ color: 'oklch(0.65 0.2 140)' }} />
            {takingBreak
              ? 'Break in Progress'
              : `Time for a ${isLongBreak ? 'Long' : 'Short'} Break`}
          </DialogTitle>
          <DialogDescription>
            {takingBreak
              ? 'Relax and recharge. Your break timer is running.'
              : `You've earned a ${breakMinutes}-minute break. Take a moment to rest your mind.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {takingBreak ? (
            <>
              {/* Break Timer */}
              <div
                className="rounded-xl p-8 backdrop-blur-md text-center space-y-4"
                style={{
                  background: 'oklch(0.98 0.01 250 / 0.9)',
                  border: '1px solid oklch(0.9 0.01 250)',
                }}
              >
                <Clock className="w-12 h-12 mx-auto" style={{ color: 'oklch(0.65 0.2 140)' }} />
                <div>
                  <div
                    className="text-5xl font-bold tabular-nums"
                    style={{ color: 'oklch(0.65 0.2 140)' }}
                  >
                    {timeString}
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'oklch(0.5 0.1 250)' }}>
                    Break time remaining
                  </p>
                </div>
              </div>

              {/* Break Suggestions */}
              <div className="space-y-2">
                <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Break suggestions:
                </p>
                <ul className="text-sm space-y-1 pl-4" style={{ color: 'oklch(0.5 0.1 250)' }}>
                  <li>• Stretch and move around</li>
                  <li>• Look away from your screen (20-20-20 rule)</li>
                  <li>• Hydrate and have a snack</li>
                  {isLongBreak && <li>• Take a short walk outside</li>}
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Break Prompt */}
              <div
                className="rounded-xl p-6 backdrop-blur-md text-center space-y-3"
                style={{
                  background: 'oklch(0.98 0.01 250 / 0.9)',
                  border: '1px solid oklch(0.9 0.01 250)',
                }}
              >
                <Coffee className="w-16 h-16 mx-auto" style={{ color: 'oklch(0.65 0.2 140)' }} />
                <div>
                  <p className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.15 250)' }}>
                    Great focus session!
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'oklch(0.5 0.1 250)' }}>
                    {isLongBreak
                      ? `Take a ${breakMinutes}-minute break to recharge`
                      : `Quick ${breakMinutes}-minute break to stay fresh`}
                  </p>
                </div>
              </div>

              {/* Break Benefits */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Why take breaks?
                </p>
                <ul className="text-xs space-y-1 pl-4" style={{ color: 'oklch(0.5 0.1 250)' }}>
                  <li>• Improves information retention</li>
                  <li>• Prevents mental fatigue</li>
                  <li>• Maintains long-term focus</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          {!takingBreak && (
            <>
              <Button variant="outline" onClick={handleSkipBreak} className="min-h-[44px]">
                <SkipForward className="mr-2 h-4 w-4" />
                Skip Break
              </Button>
              <Button
                onClick={handleTakeBreak}
                className="min-h-[44px]"
                style={{
                  background: 'oklch(0.65 0.2 140)',
                  color: 'oklch(1 0 0)',
                }}
              >
                <Coffee className="mr-2 h-4 w-4" />
                Start {breakMinutes}m Break
              </Button>
            </>
          )}
          {takingBreak && (
            <Button variant="outline" onClick={handleSkipBreak} className="min-h-[44px]">
              <SkipForward className="mr-2 h-4 w-4" />
              End Break Early
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

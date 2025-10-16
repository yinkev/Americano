'use client'

import { Flame, Shield } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface StreakIndicatorProps {
  currentStreak: number
  longestStreak: number
  freezesRemaining: number
  className?: string
}

export function StreakIndicator({
  currentStreak,
  longestStreak,
  freezesRemaining,
  className = '',
}: StreakIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine milestone status (7, 30, 100 days)
  const getMilestoneStatus = () => {
    if (currentStreak >= 100)
      return { level: 'platinum', label: 'Platinum', color: 'oklch(0.85 0.12 280)' }
    if (currentStreak >= 30) return { level: 'gold', label: 'Gold', color: 'oklch(0.75 0.15 85)' }
    if (currentStreak >= 7)
      return { level: 'silver', label: 'Silver', color: 'oklch(0.70 0.08 220)' }
    return { level: 'bronze', label: 'Bronze', color: 'oklch(0.65 0.15 30)' }
  }

  const milestone = getMilestoneStatus()
  const nextMilestone =
    currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : null
  const isPersonalBest = currentStreak === longestStreak && currentStreak > 0

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${className}`}
            style={{
              borderColor: milestone.color,
              backgroundColor: isHovered ? `${milestone.color} / 0.1` : 'transparent',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Flame icon with streak count */}
            <div className="flex items-center gap-1.5">
              <Flame
                className="h-5 w-5 transition-transform"
                style={{
                  color: milestone.color,
                  transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }}
              />
              <span className="text-lg font-bold tabular-nums" style={{ color: milestone.color }}>
                {currentStreak}
              </span>
            </div>

            {/* Milestone badge */}
            {currentStreak >= 7 && (
              <Badge
                variant="outline"
                className="border-0 px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${milestone.color} / 0.15`,
                  color: milestone.color,
                }}
              >
                {milestone.label}
              </Badge>
            )}

            {/* Freeze protection indicator */}
            {freezesRemaining > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: freezesRemaining }, (_, i) => `freeze-icon-${i}`).map(
                  (id) => (
                    <Shield
                      key={id}
                      className="h-3.5 w-3.5"
                      style={{ color: 'oklch(0.60 0.15 220)' }}
                      fill="oklch(0.60 0.15 220)"
                    />
                  ),
                )}
              </div>
            )}

            {/* Personal best indicator */}
            {isPersonalBest && (
              <Badge
                variant="outline"
                className="border-0 px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: 'oklch(0.85 0.15 85) / 0.15',
                  color: 'oklch(0.65 0.20 85)',
                }}
              >
                PB!
              </Badge>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs space-y-2 p-3" sideOffset={5}>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {currentStreak}-Day Streak {isPersonalBest && '🏆'}
            </p>
            <p className="text-xs text-muted-foreground">
              Study every day to maintain your streak!
            </p>
          </div>

          {/* Milestone progress */}
          {nextMilestone && (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs text-muted-foreground">Next milestone: {nextMilestone} days</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(currentStreak / nextMilestone) * 100}%`,
                    backgroundColor: milestone.color,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {nextMilestone - currentStreak} days to go
              </p>
            </div>
          )}

          {/* Personal best */}
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">
              Longest streak: <span className="font-semibold">{longestStreak} days</span>
            </p>
          </div>

          {/* Streak freeze info */}
          {freezesRemaining > 0 && (
            <div className="flex items-start gap-2 border-t pt-2">
              <Shield className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.60 0.15 220)' }} />
              <div>
                <p className="text-xs font-semibold">Streak Protection</p>
                <p className="text-xs text-muted-foreground">
                  {freezesRemaining} {freezesRemaining === 1 ? 'freeze' : 'freezes'} remaining
                </p>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

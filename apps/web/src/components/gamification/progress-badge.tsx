'use client'

import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD'

interface ProgressBadgeProps {
  tier: BadgeTier
  label: string
  isUnlocked: boolean
  unlockRequirement?: string
  objectivesCompleted?: number
  className?: string
}

const TIER_CONFIG: Record<
  BadgeTier,
  { color: string; backgroundColor: string; threshold: number }
> = {
  BRONZE: {
    color: 'oklch(0.65 0.15 30)',
    backgroundColor: 'oklch(0.65 0.15 30) / 0.15',
    threshold: 10,
  },
  SILVER: {
    color: 'oklch(0.70 0.08 220)',
    backgroundColor: 'oklch(0.70 0.08 220) / 0.15',
    threshold: 50,
  },
  GOLD: {
    color: 'oklch(0.75 0.15 85)',
    backgroundColor: 'oklch(0.75 0.15 85) / 0.15',
    threshold: 100,
  },
}

export function ProgressBadge({
  tier,
  label,
  isUnlocked,
  unlockRequirement,
  objectivesCompleted = 0,
  className = '',
}: ProgressBadgeProps) {
  const config = TIER_CONFIG[tier]
  const threshold = config.threshold

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center ${className}`}>
            {isUnlocked ? (
              <Badge
                variant="outline"
                className="gap-1.5 border px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105"
                style={{
                  borderColor: config.color,
                  backgroundColor: config.backgroundColor,
                  color: config.color,
                }}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  role="img"
                  aria-label="Star badge icon"
                >
                  <title>Star badge</title>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                {label}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1.5 border border-dashed px-3 py-1.5 text-sm font-medium opacity-50"
                style={{
                  borderColor: 'oklch(0.60 0.05 220)',
                  backgroundColor: 'oklch(0.60 0.05 220) / 0.05',
                  color: 'oklch(0.50 0.05 220)',
                }}
              >
                <Lock className="h-3.5 w-3.5" />
                {label}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs space-y-2 p-3" sideOffset={5}>
          {isUnlocked ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold" style={{ color: config.color }}>
                {tier} Badge Unlocked!
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;ve completed {objectivesCompleted} objectives
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">{tier} Badge Locked</p>
                <p className="text-xs text-muted-foreground">
                  {unlockRequirement || `Complete ${threshold} objectives to unlock`}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-semibold">
                    {objectivesCompleted} / {threshold}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min((objectivesCompleted / threshold) * 100, 100)}%`,
                      backgroundColor: config.color,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.max(0, threshold - objectivesCompleted)} objectives remaining
                </p>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Component to display all badge tiers
interface ProgressBadgeGroupProps {
  objectivesCompleted: number
  className?: string
}

export function ProgressBadgeGroup({
  objectivesCompleted,
  className = '',
}: ProgressBadgeGroupProps) {
  const badges: Array<{ tier: BadgeTier; label: string }> = [
    { tier: 'BRONZE', label: 'Bronze' },
    { tier: 'SILVER', label: 'Silver' },
    { tier: 'GOLD', label: 'Gold' },
  ]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {badges.map(({ tier, label }) => (
        <ProgressBadge
          key={tier}
          tier={tier}
          label={label}
          isUnlocked={objectivesCompleted >= TIER_CONFIG[tier].threshold}
          objectivesCompleted={objectivesCompleted}
        />
      ))}
    </div>
  )
}

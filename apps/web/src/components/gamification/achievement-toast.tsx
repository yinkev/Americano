'use client'

import { Flame, Moon, Star, Sunrise, Target, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export type AchievementType =
  | 'STREAK_MILESTONE'
  | 'OBJECTIVES_COMPLETED'
  | 'CARDS_MASTERED'
  | 'PERFECT_SESSION'
  | 'EARLY_BIRD'
  | 'NIGHT_OWL'

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

interface Achievement {
  id: string
  type: AchievementType
  name: string
  description: string
  tier: AchievementTier
  metadata?: Record<string, unknown>
}

interface AchievementToastProps {
  achievement: Achievement
  onDismiss?: () => void
}

const ACHIEVEMENT_ICONS: Record<AchievementType, React.ElementType> = {
  STREAK_MILESTONE: Flame,
  OBJECTIVES_COMPLETED: Target,
  CARDS_MASTERED: Star,
  PERFECT_SESSION: Trophy,
  EARLY_BIRD: Sunrise,
  NIGHT_OWL: Moon,
}

const TIER_COLORS: Record<AchievementTier, string> = {
  BRONZE: 'oklch(0.65 0.15 30)',
  SILVER: 'oklch(0.70 0.08 220)',
  GOLD: 'oklch(0.75 0.15 85)',
  PLATINUM: 'oklch(0.85 0.12 280)',
}

export function showAchievementToast(achievement: Achievement, onDismiss?: () => void) {
  const Icon = ACHIEVEMENT_ICONS[achievement.type] || Trophy
  const tierColor = TIER_COLORS[achievement.tier]

  toast.custom(
    (_t) => (
      <div
        className="relative overflow-hidden rounded-lg border shadow-none"
        style={{
          borderColor: tierColor,
          backgroundColor: 'oklch(0.98 0.01 220)',
          animation: 'slideIn 0.3s ease-out',
        }}
      >
        {/* Confetti animation container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={`confetti-${i}-${Math.random()}`}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor: tierColor,
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animation: `confettiFall ${1 + Math.random()}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.3}s`,
                opacity: 0.6 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        {/* Achievement content */}
        <div className="relative flex items-start gap-3 p-4">
          {/* Icon with glow effect */}
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${tierColor} / 0.15`,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <Icon className="h-6 w-6" style={{ color: tierColor }} />
          </div>

          {/* Achievement details */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Achievement Unlocked!</p>
              <Badge
                variant="outline"
                className="border-0 px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${tierColor} / 0.15`,
                  color: tierColor,
                }}
              >
                {achievement.tier}
              </Badge>
            </div>
            <p className="text-base font-bold" style={{ color: tierColor }}>
              {achievement.name}
            </p>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
          </div>

          {/* Trophy icon */}
          <Trophy
            className="h-8 w-8 flex-shrink-0"
            style={{
              color: tierColor,
              animation: 'bounce 1s ease-in-out infinite',
            }}
          />
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes confettiFall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(400%) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-5px);
            }
          }
        `}</style>
      </div>
    ),
    {
      duration: 5000,
      onDismiss,
      onAutoClose: onDismiss,
    },
  )
}

// Hook for managing achievement toasts
export function useAchievementToasts() {
  const [queue, setQueue] = useState<Achievement[]>([])

  useEffect(() => {
    if (queue.length > 0) {
      const [current, ...rest] = queue
      showAchievementToast(current, () => {
        setQueue(rest)
      })
    }
  }, [queue])

  const showAchievement = (achievement: Achievement) => {
    setQueue((prev) => [...prev, achievement])
  }

  return { showAchievement }
}

// Component version (for direct usage)
export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    showAchievementToast(achievement, onDismiss)
  }, [achievement, onDismiss])

  return null
}

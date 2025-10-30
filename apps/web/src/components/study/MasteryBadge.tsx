'use client'

import { Award, CheckCircle2, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface MasteryBadgeProps {
  verifiedAt: Date
  complexityLevel: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

/**
 * MasteryBadge
 *
 * Displays mastery verification badge with gold star and complexity level
 * (Story 4.5 Task 4). Shows verification date in tooltip and includes
 * celebratory animation on first display.
 *
 * **Features:**
 * - Gold star icon (oklch(0.8 0.15 60))
 * - Verification date tooltip
 * - Complexity level label (BASIC/INTERMEDIATE/ADVANCED)
 * - Celebratory animation on first render (pulse + scale)
 * - Multiple size variants (sm, md, lg)
 * - Optional text label
 * - Accessible with ARIA labels
 * - Glassmorphism styling
 *
 * **Design System:**
 * - Gold: oklch(0.8 0.15 60) - Mastery color
 * - Background: oklch(0.98 0.02 60) - Subtle gold tint
 * - Border: oklch(0.9 0.05 60) - Gold accent
 * - 44px minimum touch target
 *
 * **Animation:**
 * On first render, shows celebratory pulse and scale animation
 * for 2 seconds to draw attention to achievement.
 *
 * **Accessibility:**
 * - ARIA label with full mastery information
 * - Keyboard accessible tooltip
 * - High contrast gold color
 * - Screen reader friendly date format
 *
 * @see Story 4.5 AC#4 (Mastery Verification Protocol)
 * @see Story 4.5 AC#6 (Progressive Complexity Revelation)
 * @see Story 4.5 Task 4 (Adaptive UI Components)
 */
export function MasteryBadge({
  verifiedAt,
  complexityLevel,
  size = 'md',
  showLabel = true,
  animated = true,
  className,
}: MasteryBadgeProps) {
  const [showAnimation, setShowAnimation] = useState(animated)

  useEffect(() => {
    if (animated) {
      // Stop animation after 2 seconds
      const timer = setTimeout(() => setShowAnimation(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [animated])

  // Format verification date
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  // Get complexity-specific icon
  const getIcon = () => {
    switch (complexityLevel) {
      case 'BASIC':
        return CheckCircle2
      case 'INTERMEDIATE':
        return Award
      case 'ADVANCED':
        return Star
      default:
        return Star
    }
  }

  const Icon = getIcon()

  // Size variants
  const sizeClasses = {
    sm: {
      badge: 'text-xs px-2 py-0.5 gap-1',
      icon: 'h-3 w-3',
    },
    md: {
      badge: 'text-sm px-2.5 py-1 gap-1.5',
      icon: 'h-4 w-4',
    },
    lg: {
      badge: 'text-base px-3 py-1.5 gap-2',
      icon: 'h-5 w-5',
    },
  }

  const sizes = sizeClasses[size]

  // Mastery criteria description
  const getMasteryCriteria = () => [
    '✓ 3 consecutive assessments scoring 80%+',
    '✓ Multiple assessment types (comprehension, reasoning, application)',
    '✓ Difficulty matching complexity level',
    '✓ Confidence calibration within ±15 points',
    '✓ Time-spaced across ≥ 2 days',
  ]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              'inline-flex items-center font-medium border-2 transition-all duration-200',
              'cursor-help select-none',
              showAnimation && 'animate-pulse',
              sizes.badge,
              className,
            )}
            style={{
              backgroundColor: 'oklch(0.98 0.02 60)',
              color: 'oklch(0.5 0.15 60)',
              borderColor: 'oklch(0.9 0.05 60)',
              transform: showAnimation ? 'scale(1.1)' : 'scale(1)',
            }}
            aria-label={`Mastery verified on ${complexityLevel} level at ${verifiedAt.toLocaleDateString()}`}
          >
            <Icon
              className={cn(sizes.icon, 'flex-shrink-0')}
              fill="currentColor"
              style={{
                color: 'oklch(0.8 0.15 60)',
              }}
            />
            {showLabel && <span>Mastered</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs"
          style={{
            backgroundColor: 'oklch(0.2 0 0)',
            color: 'oklch(0.985 0 0)',
          }}
        >
          <div className="space-y-3">
            {/* Header with celebration icon */}
            <div className="flex items-center gap-2">
              <Star
                className="h-6 w-6 flex-shrink-0"
                fill="currentColor"
                style={{ color: 'oklch(0.8 0.15 60)' }}
              />
              <div>
                <p className="font-semibold text-base">{complexityLevel} Mastery Verified</p>
                <p className="text-xs opacity-80">Verified {formatDate(verifiedAt)}</p>
              </div>
            </div>

            {/* Mastery Criteria */}
            <div className="pt-2 border-t border-white/20">
              <p className="text-sm font-medium mb-2">Criteria Met:</p>
              <ul className="space-y-1 text-xs">
                {getMasteryCriteria().map((criterion, index) => (
                  <li key={index} className="opacity-90">
                    {criterion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Congratulations message */}
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs opacity-90">
                🎉 Congratulations! You&apos;ve demonstrated comprehensive mastery of this concept
                at the {complexityLevel.toLowerCase()} level.
                {complexityLevel === 'ADVANCED' && " You've achieved the highest level!"}
                {complexityLevel === 'INTERMEDIATE' && ' ADVANCED level is now unlocked!'}
                {complexityLevel === 'BASIC' && ' INTERMEDIATE level is now unlocked!'}
              </p>
            </div>

            {/* Date Details */}
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs opacity-70">
                Verified on{' '}
                {verifiedAt.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

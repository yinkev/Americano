'use client'

import { TrendingUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface DifficultyIndicatorProps {
  currentDifficulty: number // 0-100 scale
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * DifficultyIndicator
 *
 * Visual gauge displaying current difficulty level (Story 4.5 Task 4).
 * Shows difficulty on a 0-100 scale with color-coded ranges:
 * - Low (0-40): Green
 * - Medium (41-70): Yellow
 * - High (71-100): Red
 *
 * **Features:**
 * - Horizontal bar indicator with OKLCH colors
 * - Numeric difficulty value display
 * - Smooth transitions on difficulty changes
 * - Tooltip explaining difficulty ranges
 * - Accessible with ARIA live region for screen readers
 * - Multiple size variants (sm, md, lg)
 * - Optional text label
 *
 * **Design System:**
 * - Low: oklch(0.7 0.15 145) - Green
 * - Medium: oklch(0.75 0.12 85) - Yellow
 * - High: oklch(0.65 0.20 25) - Red
 * - Background: oklch(0.9 0.02 240)
 * - Glassmorphism styling
 *
 * **Accessibility:**
 * - aria-live="polite" for screen reader updates
 * - Tooltip with detailed difficulty explanations
 * - High contrast color choices
 * - Keyboard accessible
 *
 * @see Story 4.5 AC#2 (Real-Time Difficulty Adjustment)
 * @see Story 4.5 Task 4 (Adaptive UI Components)
 */
export function DifficultyIndicator({
  currentDifficulty,
  showLabel = false,
  size = 'md',
  className,
}: DifficultyIndicatorProps) {
  // Clamp difficulty to 0-100 range
  const difficulty = Math.max(0, Math.min(100, currentDifficulty))

  // Determine difficulty category and color
  const getDifficultyCategory = () => {
    if (difficulty <= 40) return 'Low'
    if (difficulty <= 70) return 'Medium'
    return 'High'
  }

  const getDifficultyColor = () => {
    if (difficulty <= 40) return 'oklch(0.7 0.15 145)' // Green
    if (difficulty <= 70) return 'oklch(0.75 0.12 85)' // Yellow
    return 'oklch(0.65 0.20 25)' // Red
  }

  const getDifficultyDescription = () => {
    const category = getDifficultyCategory()
    switch (category) {
      case 'Low':
        return 'Questions at this level focus on foundational concepts and basic recall. Ideal for reviewing fundamentals or building confidence.'
      case 'Medium':
        return 'Questions require application of knowledge and understanding of relationships between concepts. Typical exam-level difficulty.'
      case 'High':
        return 'Questions involve advanced reasoning, synthesis of multiple concepts, and clinical judgment. Challenges your mastery.'
      default:
        return ''
    }
  }

  // Size variants
  const sizeClasses = {
    sm: {
      bar: 'h-1.5',
      text: 'text-xs',
      icon: 'h-3 w-3',
    },
    md: {
      bar: 'h-2',
      text: 'text-sm',
      icon: 'h-4 w-4',
    },
    lg: {
      bar: 'h-3',
      text: 'text-base',
      icon: 'h-5 w-5',
    },
  }

  const sizes = sizeClasses[size]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
              'bg-white/95 backdrop-blur-xl border',
              'hover:shadow-md cursor-help',
              className,
            )}
            style={{
              borderColor: 'oklch(0.9 0.02 240)',
            }}
            role="status"
            aria-live="polite"
            aria-label={`Current difficulty: ${difficulty} out of 100, ${getDifficultyCategory()} level`}
          >
            {/* Icon */}
            <TrendingUp
              className={cn(sizes.icon, 'flex-shrink-0')}
              style={{ color: getDifficultyColor() }}
            />

            {/* Difficulty Bar */}
            <div className="flex items-center gap-2 min-w-[80px]">
              <div
                className={cn('flex-1 rounded-full overflow-hidden', sizes.bar)}
                style={{
                  backgroundColor: 'oklch(0.9 0.02 240)',
                }}
              >
                <div
                  className={cn('h-full rounded-full transition-all duration-300 ease-in-out')}
                  style={{
                    width: `${difficulty}%`,
                    backgroundColor: getDifficultyColor(),
                  }}
                />
              </div>

              {/* Numeric Value */}
              <span
                className={cn('font-medium tabular-nums min-w-[2ch]', sizes.text)}
                style={{ color: getDifficultyColor() }}
              >
                {difficulty}
              </span>
            </div>

            {/* Optional Label */}
            {showLabel && (
              <span className={cn('text-muted-foreground', sizes.text)}>
                {getDifficultyCategory()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs"
          style={{
            backgroundColor: 'oklch(0.2 0 0)',
            color: 'oklch(0.985 0 0)',
          }}
        >
          <div className="space-y-2">
            <p className="font-semibold">
              {getDifficultyCategory()} Difficulty ({difficulty}/100)
            </p>
            <p className="text-xs opacity-90">{getDifficultyDescription()}</p>

            {/* Difficulty Range Reference */}
            <div className="pt-2 mt-2 border-t border-white/20 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>Low (0-40)</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145)' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Medium (41-70)</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: 'oklch(0.75 0.12 85)' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>High (71-100)</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: 'oklch(0.65 0.20 25)' }}
                />
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

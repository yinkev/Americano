'use client'

import { TrendingUp } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ConfidenceIntervalDisplayProps {
  estimate: number // Knowledge estimate (theta from IRT)
  confidenceInterval: number // ±X at 95% confidence
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * ConfidenceIntervalDisplay
 *
 * Displays IRT-based knowledge estimate with confidence interval
 * (Story 4.5 Task 4). Shows estimate as "75±8" format with visual
 * representation of uncertainty range.
 *
 * **Features:**
 * - Knowledge estimate display (theta parameter from IRT)
 * - Confidence interval (±X at 95% confidence level)
 * - Visual range indicator showing estimate bounds
 * - Color-coded precision indicator:
 *   - High precision (CI < 10): Green
 *   - Medium precision (CI 10-15): Yellow
 *   - Low precision (CI > 15): Red
 * - Tooltip with IRT explanation
 * - Multiple size variants
 * - Accessible with ARIA labels
 *
 * **IRT Context:**
 * The estimate represents the user's knowledge level on a standardized
 * scale, typically ranging from -3 to +3 (or 0-100 when normalized).
 * The confidence interval indicates measurement precision - smaller
 * intervals mean more accurate assessment.
 *
 * **Design System:**
 * - High precision: oklch(0.7 0.15 145) - Green
 * - Medium precision: oklch(0.75 0.12 85) - Yellow
 * - Low precision: oklch(0.65 0.20 25) - Red
 * - Glassmorphism with subtle backdrop blur
 *
 * @see Story 4.5 AC#7 (Assessment Efficiency with IRT)
 * @see Story 4.5 Task 4 (Adaptive UI Components)
 */
export function ConfidenceIntervalDisplay({
  estimate,
  confidenceInterval,
  showDetails = false,
  size = 'md',
  className,
}: ConfidenceIntervalDisplayProps) {
  // Calculate bounds
  const lowerBound = Math.max(0, estimate - confidenceInterval)
  const upperBound = Math.min(100, estimate + confidenceInterval)

  // Determine precision level
  const getPrecisionLevel = () => {
    if (confidenceInterval < 10) return 'High'
    if (confidenceInterval <= 15) return 'Medium'
    return 'Low'
  }

  const getPrecisionColor = () => {
    if (confidenceInterval < 10) return 'oklch(0.7 0.15 145)' // Green
    if (confidenceInterval <= 15) return 'oklch(0.75 0.12 85)' // Yellow
    return 'oklch(0.65 0.20 25)' // Red
  }

  const getPrecisionDescription = () => {
    const level = getPrecisionLevel()
    switch (level) {
      case 'High':
        return 'Your knowledge level has been measured with high precision. The assessment can stop soon with confidence.'
      case 'Medium':
        return 'Your knowledge level is reasonably well estimated. A few more questions will increase precision.'
      case 'Low':
        return 'More questions are needed to accurately assess your knowledge level. Continue for better precision.'
      default:
        return ''
    }
  }

  // Size variants
  const sizeClasses = {
    sm: {
      text: 'text-sm',
      detail: 'text-xs',
      icon: 'h-3 w-3',
    },
    md: {
      text: 'text-lg',
      detail: 'text-sm',
      icon: 'h-4 w-4',
    },
    lg: {
      text: 'text-2xl',
      detail: 'text-base',
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
              'inline-flex items-center gap-3 px-4 py-2 rounded-lg',
              'bg-white/95 backdrop-blur-xl border',
              'hover:shadow-md transition-all duration-200 cursor-help',
              className,
            )}
            style={{
              borderColor: getPrecisionColor(),
            }}
            role="status"
            aria-label={`Knowledge estimate: ${estimate} plus or minus ${confidenceInterval} at 95% confidence`}
          >
            {/* Estimate Display */}
            <div className="flex items-center gap-2">
              <span
                className={cn('font-bold tabular-nums', sizes.text)}
                style={{ color: getPrecisionColor() }}
              >
                {Math.round(estimate)}
              </span>
              <span className={cn('text-muted-foreground', sizes.detail)}>±</span>
              <span
                className={cn('font-medium tabular-nums', sizes.detail)}
                style={{ color: getPrecisionColor() }}
              >
                {Math.round(confidenceInterval)}
              </span>
            </div>

            {/* Precision Indicator */}
            <div
              className={cn('px-2 py-1 rounded-md flex items-center gap-1', sizes.detail)}
              style={{
                backgroundColor: `${getPrecisionColor()}20`,
                color: getPrecisionColor(),
              }}
            >
              <TrendingUp className={sizes.icon} />
              <span className="font-medium">{getPrecisionLevel()}</span>
            </div>

            {/* Optional Details */}
            {showDetails && (
              <div className={cn('text-muted-foreground', sizes.detail)}>
                <p>
                  Range: {Math.round(lowerBound)}-{Math.round(upperBound)}
                </p>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-md"
          style={{
            backgroundColor: 'oklch(0.2 0 0)',
            color: 'oklch(0.985 0 0)',
          }}
        >
          <div className="space-y-3">
            {/* Header */}
            <div>
              <p className="font-semibold text-base mb-1">IRT Knowledge Estimate</p>
              <p className="text-sm opacity-90">
                {estimate.toFixed(1)} ± {confidenceInterval.toFixed(1)} (95% confidence)
              </p>
            </div>

            {/* Visual Range */}
            <div>
              <p className="text-xs opacity-80 mb-2">Confidence Range</p>
              <div className="relative h-8 rounded-full overflow-hidden bg-white/20">
                {/* Full range bar */}
                <div
                  className="absolute top-0 h-full opacity-40"
                  style={{
                    left: `${lowerBound}%`,
                    width: `${upperBound - lowerBound}%`,
                    backgroundColor: getPrecisionColor(),
                  }}
                />
                {/* Estimate point */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                  style={{
                    left: `${estimate}%`,
                    backgroundColor: getPrecisionColor(),
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1 opacity-70">
                <span>{Math.round(lowerBound)}</span>
                <span className="font-medium">{Math.round(estimate)}</span>
                <span>{Math.round(upperBound)}</span>
              </div>
            </div>

            {/* Explanation */}
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs opacity-90 mb-2">
                <span className="font-semibold">{getPrecisionLevel()} Precision</span>
              </p>
              <p className="text-xs opacity-80">{getPrecisionDescription()}</p>
            </div>

            {/* IRT Context */}
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs opacity-80">
                <span className="font-semibold">What is IRT?</span> Item Response Theory estimates
                your knowledge level using fewer questions by adapting difficulty based on your
                responses. The confidence interval shows measurement precision.
              </p>
            </div>

            {/* Precision Scale Reference */}
            <div className="pt-2 border-t border-white/20 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>High (&lt; 10)</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: 'oklch(0.7 0.15 145)' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Medium (10-15)</span>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: 'oklch(0.75 0.12 85)' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Low (&gt; 15)</span>
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

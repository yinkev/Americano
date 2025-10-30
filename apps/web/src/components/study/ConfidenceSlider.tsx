'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'

interface ConfidenceSliderProps {
  value: number // 1-5
  onChange: (value: number) => void
  showRationale?: boolean
  rationale?: string
  onRationaleChange?: (rationale: string) => void
  disabled?: boolean
  label?: string
}

const confidenceLabels = ['Very Uncertain', 'Uncertain', 'Neutral', 'Confident', 'Very Confident']

/**
 * Reusable confidence scale slider component
 * Displays 5-point scale (1-5) with descriptive labels
 * Includes optional rationale textarea for user explanation
 */
export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({
  value,
  onChange,
  showRationale = false,
  rationale = '',
  onRationaleChange,
  disabled = false,
  label = 'How confident are you?',
}) => {
  const [localRationale, setLocalRationale] = useState(rationale)

  // OKLCH colors for confidence gradient
  const getConfidenceColor = (confidence: number): string => {
    switch (confidence) {
      case 1:
        return 'oklch(0.65 0.20 25)' // Red - Very Uncertain
      case 2:
        return 'oklch(0.70 0.18 45)' // Orange - Uncertain
      case 3:
        return 'oklch(0.75 0.12 85)' // Yellow - Neutral
      case 4:
        return 'oklch(0.68 0.18 150)' // Light Green - Confident
      case 5:
        return 'oklch(0.70 0.15 145)' // Green - Very Confident
      default:
        return 'oklch(0.6 0.05 240)' // Gray - Default
    }
  }

  const handleSliderChange = (newValue: number[]) => {
    onChange(newValue[0])
  }

  const handleRationaleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newRationale = e.target.value
    setLocalRationale(newRationale)
    if (onRationaleChange) {
      onRationaleChange(newRationale)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onChange(Math.max(1, value - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onChange(Math.min(5, value + 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(1)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(5)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Label */}
      <Label id="confidence-slider-label" className="text-base font-semibold">
        {label}
      </Label>

      {/* Slider Container */}
      <div className="w-full space-y-4">
        {/* Slider with 44px touch target */}
        <div
          className="relative px-2"
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="group"
          aria-labelledby="confidence-slider-label"
        >
          <Slider
            value={[value]}
            onValueChange={handleSliderChange}
            min={1}
            max={5}
            step={1}
            disabled={disabled}
            className="w-full [&>span>span]:h-11 [&>span>span]:w-11 [&>span>span]:border-2"
            style={{
              // Set thumb color based on confidence level
              ['--slider-thumb-bg' as string]: getConfidenceColor(value),
            }}
          />
        </div>

        {/* Labels Row */}
        <div className="flex justify-between text-xs font-medium px-2">
          {confidenceLabels.map((label, idx) => (
            <span
              key={idx}
              style={{
                color: value === idx + 1 ? getConfidenceColor(idx + 1) : 'oklch(0.5 0.05 250)',
                fontWeight: value === idx + 1 ? 600 : 400,
              }}
              className="transition-colors"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Confidence Value Display */}
      <div className="text-center">
        <span className="text-2xl font-bold" style={{ color: getConfidenceColor(value) }}>
          {value}/5
        </span>
        <p className="text-sm" style={{ color: 'oklch(0.5 0.05 250)' }}>
          {confidenceLabels[value - 1]}
        </p>
      </div>

      {/* Rationale Textarea */}
      {showRationale && (
        <div className="space-y-2">
          <Label htmlFor="rationale" className="text-sm">
            Why this confidence level? (optional)
          </Label>
          <Textarea
            id="rationale"
            value={localRationale}
            onChange={handleRationaleChange}
            placeholder="Explain your confidence level..."
            className="min-h-[80px] resize-none"
            disabled={disabled}
          />
        </div>
      )}

      {/* Accessibility Note */}
      <p className="text-xs text-muted-foreground">
        Use arrow keys to adjust (← → or Home/End), or click slider above
      </p>
    </div>
  )
}

export default ConfidenceSlider

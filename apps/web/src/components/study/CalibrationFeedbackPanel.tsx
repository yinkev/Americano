'use client'

import { ArrowDown, ArrowUp, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import type { CalibrationFeedbackData } from '@/types/validation'

interface CalibrationFeedbackPanelProps {
  calibrationData: CalibrationFeedbackData
  onContinue: () => void
}

/**
 * CalibrationFeedbackPanel Component
 *
 * Displays immediate calibration feedback after assessment evaluation.
 * Shows radial calibration gauge, confidence vs. score comparison, and trend analysis.
 *
 * **Features**:
 * - Radial progress gauge showing calibration delta
 * - Color-coded by category: Red (overconfident), Blue (underconfident), Green (calibrated)
 * - Pre/post confidence display with shift indicator
 * - Actual score comparison
 * - Trend note (improving/stable/declining)
 * - Glassmorphism design with OKLCH colors
 * - Accessible with ARIA labels and semantic HTML
 *
 * @see Story 4.4 Task 5 (Calibration Feedback Component)
 * @see Story 4.4 AC#4 (Calibration Feedback Display)
 * @see Story 4.4 AC#6 (Calibration Trends Dashboard)
 */
export function CalibrationFeedbackPanel({
  calibrationData,
  onContinue,
}: CalibrationFeedbackPanelProps) {
  const {
    delta,
    category,
    preConfidence,
    postConfidence,
    confidenceNormalized,
    score,
    feedbackMessage,
    trend,
    trendMessage,
  } = calibrationData

  // Get color based on calibration category (EXACT OKLCH colors from spec)
  const getCategoryColor = () => {
    switch (category) {
      case 'OVERCONFIDENT':
        return 'oklch(0.65 0.20 25)' // Red - EXACT spec
      case 'UNDERCONFIDENT':
        return 'oklch(0.60 0.18 230)' // Blue - EXACT spec
      case 'CALIBRATED':
        return 'oklch(0.7 0.15 145)' // Green - EXACT spec
      default:
        return 'oklch(0.6 0.05 240)' // Neutral gray
    }
  }

  // Get background color for category badge
  const getCategoryBgColor = () => {
    switch (category) {
      case 'OVERCONFIDENT':
        return 'oklch(0.95 0.05 25)'
      case 'UNDERCONFIDENT':
        return 'oklch(0.95 0.05 230)'
      case 'CALIBRATED':
        return 'oklch(0.95 0.05 145)'
      default:
        return 'oklch(0.95 0.02 240)'
    }
  }

  // Get category label
  const getCategoryLabel = () => {
    switch (category) {
      case 'OVERCONFIDENT':
        return 'Overconfident'
      case 'UNDERCONFIDENT':
        return 'Underconfident'
      case 'CALIBRATED':
        return 'Well Calibrated'
      default:
        return 'Calibrated'
    }
  }

  // Calculate absolute delta percentage for gauge (cap at 50 for visualization)
  const absDeltaPercentage = Math.min(Math.abs(delta), 50)
  const gaugePercentage = (absDeltaPercentage / 50) * 100

  // Calculate confidence shift if post-confidence exists
  const confidenceShift = postConfidence !== undefined ? postConfidence - preConfidence : 0

  // Get trend icon
  const TrendIcon = () => {
    if (!trend || trend === 'stable') return <Minus className="h-4 w-4" />
    return trend === 'improving' ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    )
  }

  // Get trend color
  const getTrendColor = () => {
    if (!trend) return 'oklch(0.6 0.05 240)'
    switch (trend) {
      case 'improving':
        return 'oklch(0.7 0.15 145)' // Green
      case 'declining':
        return 'oklch(0.65 0.20 25)' // Red
      case 'stable':
      default:
        return 'oklch(0.6 0.05 240)' // Gray
    }
  }

  return (
    <div
      className="space-y-6 p-6 rounded-lg border bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]"
      style={{
        borderColor: 'oklch(0.9 0.02 240)',
      }}
      role="region"
      aria-label="Calibration feedback"
    >
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-dm-sans font-semibold mb-2">Confidence Calibration</h3>
        <p className="text-sm text-muted-foreground">
          How well did your confidence match your performance?
        </p>
      </div>

      {/* Radial Calibration Gauge - SVG-based circular progress */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-40 h-40">
          {/* SVG Radial Gauge */}
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 160 160"
            aria-hidden="true"
          >
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="oklch(0.9 0.02 240)"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={getCategoryColor()}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(gaugePercentage / 100) * 439.82} 439.82`}
              strokeLinecap="round"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-4xl font-bold"
              style={{ color: getCategoryColor() }}
              aria-label={`Calibration delta: ${delta > 0 ? '+' : ''}${Math.round(delta)} points`}
            >
              {delta > 0 ? '+' : ''}
              {Math.round(delta)}
            </span>
            <span className="text-xs text-muted-foreground">delta</span>
          </div>
        </div>

        {/* Category Badge */}
        <div
          className="px-4 py-2 rounded-full"
          style={{
            backgroundColor: getCategoryBgColor(),
            color: getCategoryColor(),
          }}
        >
          <span className="text-sm font-semibold">{getCategoryLabel()}</span>
        </div>
      </div>

      {/* Confidence vs Score Comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pre-Confidence */}
        <div
          className="p-4 rounded-lg border text-center"
          style={{
            backgroundColor: 'oklch(0.98 0.01 240)',
            borderColor: 'oklch(0.9 0.02 240)',
          }}
        >
          <div className="text-xs text-muted-foreground mb-1">Pre-Assessment</div>
          <div className="text-2xl font-bold">{confidenceNormalized}%</div>
          <div className="text-xs text-muted-foreground mt-1">Confidence</div>
        </div>

        {/* Actual Score */}
        <div
          className="p-4 rounded-lg border text-center"
          style={{
            backgroundColor: 'oklch(0.98 0.01 240)',
            borderColor: 'oklch(0.9 0.02 240)',
          }}
        >
          <div className="text-xs text-muted-foreground mb-1">Actual</div>
          <div className="text-2xl font-bold">{Math.round(score)}%</div>
          <div className="text-xs text-muted-foreground mt-1">Score</div>
        </div>

        {/* Post-Confidence (if exists) or Confidence Level */}
        <div
          className="p-4 rounded-lg border text-center"
          style={{
            backgroundColor: 'oklch(0.98 0.01 240)',
            borderColor: 'oklch(0.9 0.02 240)',
          }}
        >
          {postConfidence !== undefined ? (
            <>
              <div className="text-xs text-muted-foreground mb-1">Post-Assessment</div>
              <div className="text-2xl font-bold">{(postConfidence - 1) * 25}%</div>
              <div className="text-xs text-muted-foreground mt-1">Confidence</div>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground mb-1">Confidence</div>
              <div className="text-2xl font-bold">{preConfidence}/5</div>
              <div className="text-xs text-muted-foreground mt-1">Level</div>
            </>
          )}
        </div>
      </div>

      {/* Confidence Shift Indicator (if post-confidence exists) */}
      {postConfidence !== undefined && confidenceShift !== 0 && (
        <div
          className="flex items-center justify-center gap-2 p-3 rounded-lg border"
          style={{
            backgroundColor: confidenceShift > 0 ? 'oklch(0.95 0.05 145)' : 'oklch(0.95 0.05 25)',
            borderColor: confidenceShift > 0 ? 'oklch(0.85 0.08 145)' : 'oklch(0.85 0.08 25)',
            color: confidenceShift > 0 ? 'oklch(0.35 0.16 145)' : 'oklch(0.35 0.16 25)',
          }}
        >
          {confidenceShift > 0 ? (
            <ArrowUp className="h-5 w-5" />
          ) : (
            <ArrowDown className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">
            Confidence shifted {confidenceShift > 0 ? 'up' : 'down'} by {Math.abs(confidenceShift)}{' '}
            point{Math.abs(confidenceShift) !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Feedback Message */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: getCategoryBgColor(),
          borderColor: getCategoryColor(),
          color: getCategoryColor(),
        }}
      >
        <p className="text-sm leading-relaxed">{feedbackMessage}</p>
      </div>

      {/* Trend Note */}
      {trend && trendMessage && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'oklch(0.98 0.01 240)',
            borderColor: 'oklch(0.9 0.02 240)',
          }}
        >
          <div className="flex-shrink-0" style={{ color: getTrendColor() }} aria-hidden="true">
            <TrendIcon />
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground mb-1">7-Day Trend</div>
            <p className="text-sm" style={{ color: getTrendColor() }}>
              {trendMessage}
            </p>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={onContinue}
        className="w-full min-h-[44px] text-base"
        style={{
          backgroundColor: 'oklch(0.6 0.18 230)',
          color: 'white',
        }}
        aria-label="Continue to next objective"
      >
        Continue
      </Button>
    </div>
  )
}

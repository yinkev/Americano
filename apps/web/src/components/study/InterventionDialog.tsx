/**
 * Metacognitive Intervention Dialog
 *
 * Displays targeted interventions when calibration health is poor.
 * Helps students develop accurate self-assessment skills through
 * personalized feedback and educational content.
 *
 * @see docs/stories/story-4.4.md - Task 8: Metacognitive Intervention Engine
 */

'use client'

import { useState } from 'react'
import { Brain, AlertTriangle, TrendingUp, X, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type {
  InterventionType,
  InterventionRecommendation,
} from '@/lib/metacognitive-interventions'

/**
 * Props for InterventionDialog component
 */
export interface InterventionDialogProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback when dialog is closed */
  onClose: () => void
  /** Intervention recommendation data */
  intervention: InterventionRecommendation
  /** Callback when user dismisses intervention */
  onDismiss?: () => void
  /** Callback when user wants to learn more */
  onLearnMore?: () => void
}

/**
 * Get icon based on intervention type
 */
function getInterventionIcon(type: InterventionType) {
  switch (type) {
    case 'OVERCONFIDENCE':
      return <AlertTriangle className="h-8 w-8 text-[oklch(0.65_0.20_25)]" />
    case 'UNDERCONFIDENCE':
      return <TrendingUp className="h-8 w-8 text-[oklch(0.60_0.18_230)]" />
    default:
      return <Brain className="h-8 w-8 text-[oklch(0.6_0.15_230)]" />
  }
}

/**
 * Get background color based on intervention type
 */
function getBackgroundColor(type: InterventionType): string {
  switch (type) {
    case 'OVERCONFIDENCE':
      return 'bg-[oklch(0.65_0.20_25)]/10'
    case 'UNDERCONFIDENCE':
      return 'bg-[oklch(0.60_0.18_230)]/10'
    default:
      return 'bg-[oklch(0.6_0.15_230)]/10'
  }
}

/**
 * Get title based on intervention type
 */
function getInterventionTitle(type: InterventionType): string {
  switch (type) {
    case 'OVERCONFIDENCE':
      return 'Overconfidence Pattern Detected'
    case 'UNDERCONFIDENCE':
      return 'Your Understanding is Stronger Than You Think!'
    default:
      return 'Calibration Check-In'
  }
}

/**
 * Metacognitive Intervention Dialog Component
 *
 * Displays personalized intervention with:
 * - Main intervention message
 * - Specific actionable recommendations
 * - Educational content about metacognition
 * - Example assessments showing the pattern
 * - Dismiss and Learn More actions
 */
export function InterventionDialog({
  open,
  onClose,
  intervention,
  onDismiss,
  onLearnMore,
}: InterventionDialogProps) {
  const [showEducational, setShowEducational] = useState(false)

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss()
    }
    onClose()
  }

  const handleLearnMore = () => {
    if (onLearnMore) {
      onLearnMore()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-[oklch(0.6_0.05_240)]/20"
        aria-describedby="intervention-description"
      >
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg ${getBackgroundColor(intervention.type)}`}
              aria-hidden="true"
            >
              {getInterventionIcon(intervention.type)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-[oklch(0.2_0.05_240)]">
                {getInterventionTitle(intervention.type)}
              </DialogTitle>
              <DialogDescription
                id="intervention-description"
                className="mt-2 text-base text-[oklch(0.4_0.05_240)]"
              >
                {intervention.message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Example Assessments */}
          {intervention.exampleAssessments && intervention.exampleAssessments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[oklch(0.3_0.05_240)] uppercase tracking-wide">
                Recent Examples
              </h3>
              <div className="space-y-2">
                {intervention.exampleAssessments.map((example, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[oklch(0.95_0.02_240)] border border-[oklch(0.85_0.02_240)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[oklch(0.3_0.05_240)]">
                        {example.conceptName}
                      </span>
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`font-semibold ${
                            example.delta > 15
                              ? 'text-[oklch(0.65_0.20_25)]'
                              : example.delta < -15
                                ? 'text-[oklch(0.60_0.18_230)]'
                                : 'text-[oklch(0.7_0.15_145)]'
                          }`}
                        >
                          Confidence: {example.confidence}/5
                        </span>
                        <span className="text-[oklch(0.5_0.05_240)]">’</span>
                        <span className="font-semibold text-[oklch(0.3_0.05_240)]">
                          Score: {example.score}%
                        </span>
                      </div>
                    </div>
                    {Math.abs(example.delta) > 15 && (
                      <p className="mt-1 text-xs text-[oklch(0.5_0.05_240)]">
                        {example.delta > 0
                          ? `${Math.abs(Math.round(example.delta))}% overconfident`
                          : `${Math.abs(Math.round(example.delta))}% underconfident`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[oklch(0.3_0.05_240)] uppercase tracking-wide">
              Recommended Actions
            </h3>
            <ul className="space-y-2">
              {intervention.recommendations.map((rec, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-[oklch(0.3_0.05_240)]"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full bg-[oklch(0.7_0.15_230)] text-white text-xs flex items-center justify-center font-semibold mt-0.5"
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Educational Content (Expandable) */}
          <div className="border-t border-[oklch(0.85_0.02_240)] pt-4">
            <button
              onClick={() => setShowEducational(!showEducational)}
              className="flex items-center justify-between w-full text-left group"
              aria-expanded={showEducational}
              aria-controls="educational-content"
            >
              <span className="text-sm font-semibold text-[oklch(0.3_0.05_240)] uppercase tracking-wide">
                Learn More About Metacognition
              </span>
              <span
                className={`text-[oklch(0.6_0.15_230)] transition-transform ${
                  showEducational ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              >
                ¼
              </span>
            </button>

            {showEducational && (
              <div
                id="educational-content"
                className="mt-4 prose prose-sm max-w-none text-[oklch(0.3_0.05_240)]"
                role="region"
                aria-label="Educational content about metacognition"
              >
                <div className="whitespace-pre-wrap">{intervention.educationalContent}</div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="min-h-[44px] px-6 border-[oklch(0.6_0.05_240)]/30 text-[oklch(0.4_0.05_240)] hover:bg-[oklch(0.95_0.02_240)] hover:text-[oklch(0.3_0.05_240)]"
          >
            <X className="w-4 h-4 mr-2" />
            Dismiss
          </Button>
          <Button
            onClick={handleLearnMore}
            className="min-h-[44px] px-6 bg-[oklch(0.6_0.18_230)] hover:bg-[oklch(0.55_0.18_230)] text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Calibration Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to manage intervention dialog state
 *
 * Provides convenient state management for showing/hiding interventions
 * and handling user interactions.
 *
 * @example
 * const intervention = useInterventionDialog();
 *
 * // Check if intervention needed
 * const healthCheck = await checkCalibrationHealth(userId);
 * if (healthCheck.needsIntervention) {
 *   const recommendation = await generateInterventionRecommendations(
 *     userId,
 *     healthCheck.interventionType
 *   );
 *   intervention.show(recommendation);
 * }
 */
export function useInterventionDialog() {
  const [open, setOpen] = useState(false)
  const [intervention, setIntervention] = useState<InterventionRecommendation | null>(null)

  const show = (recommendation: InterventionRecommendation) => {
    setIntervention(recommendation)
    setOpen(true)
  }

  const hide = () => {
    setOpen(false)
  }

  const handleDismiss = async (userId: string, correlationCoeff: number, assessmentCount: number) => {
    if (intervention) {
      // Track dismissal via API
      try {
        await fetch('/api/calibration/intervention-dismiss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            interventionType: intervention.type,
            correlationAtDismissal: correlationCoeff,
            assessmentCount,
          }),
        })
      } catch (error) {
        console.error('Failed to track intervention dismissal:', error)
      }
    }
    hide()
  }

  return {
    open,
    intervention,
    show,
    hide,
    handleDismiss,
  }
}

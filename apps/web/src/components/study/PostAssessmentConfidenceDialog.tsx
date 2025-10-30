'use client'

import { ChevronRight, TrendingDown, TrendingUp } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfidenceSlider } from './ConfidenceSlider'

interface PostAssessmentConfidenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preAssessmentConfidence: number
  onConfidenceCaptured: (postConfidence: number, rationale?: string) => void
  promptDetails?: string
}

/**
 * Post-assessment confidence update dialog
 * Appears AFTER student sees assessment prompt but BEFORE submitting response
 * Captures updated confidence to measure confidence shift from prompt exposure
 */
export const PostAssessmentConfidenceDialog: React.FC<PostAssessmentConfidenceDialogProps> = ({
  open,
  onOpenChange,
  preAssessmentConfidence,
  onConfidenceCaptured,
  promptDetails,
}) => {
  const [postConfidence, setPostConfidence] = useState(preAssessmentConfidence)
  const [rationale, setRationale] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate confidence shift
  const confidenceShift = useMemo(() => {
    return postConfidence - preAssessmentConfidence
  }, [postConfidence, preAssessmentConfidence])

  // Determine shift indicator
  const shiftIndicator = useMemo(() => {
    if (confidenceShift === 0) {
      return {
        label: 'No change',
        color: 'oklch(0.6 0.05 240)',
        icon: null,
      }
    } else if (confidenceShift > 0) {
      return {
        label: `+${confidenceShift}`,
        color: 'oklch(0.7 0.15 145)',
        icon: <TrendingUp className="h-4 w-4" />,
      }
    } else {
      return {
        label: `${confidenceShift}`,
        color: 'oklch(0.65 0.20 25)',
        icon: <TrendingDown className="h-4 w-4" />,
      }
    }
  }, [confidenceShift])

  const handleContinue = async () => {
    setIsSubmitting(true)
    try {
      onConfidenceCaptured(postConfidence, rationale || undefined)
      // Reset state for next use
      setPostConfidence(preAssessmentConfidence)
      setRationale('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">After Reading the Question</DialogTitle>
          <DialogDescription className="text-base">
            Has seeing the question changed your confidence? Update it here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pre-Assessment Confidence Display */}
          <div
            className="p-4 rounded-lg"
            style={{
              background: 'oklch(0.95 0.02 250)',
              border: '1px solid',
              borderColor: 'oklch(0.85 0.05 250)',
            }}
          >
            <p className="text-sm font-semibold mb-2">Your initial confidence:</p>
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-2 rounded font-semibold text-sm"
                style={{
                  background: 'oklch(0.6 0.05 240)',
                  color: 'oklch(1 0 0)',
                }}
              >
                {preAssessmentConfidence}/5
              </div>
              <span className="text-sm text-muted-foreground">Before reading the question</span>
            </div>
          </div>

          {/* Post-Assessment Confidence Slider */}
          <ConfidenceSlider
            value={postConfidence}
            onChange={setPostConfidence}
            showRationale={true}
            rationale={rationale}
            onRationaleChange={setRationale}
            label="How confident are you now after reading the question?"
          />

          {/* Confidence Shift Indicator */}
          <div
            className="p-4 rounded-lg flex items-center gap-3"
            style={{
              background: 'oklch(0.95 0.02 250)',
              border: '2px solid',
              borderColor: shiftIndicator.color,
            }}
          >
            <div className="p-2 rounded" style={{ background: shiftIndicator.color }}>
              {shiftIndicator.icon && (
                <div style={{ color: 'oklch(1 0 0)' }}>{shiftIndicator.icon}</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Confidence Shift</p>
              <p className="text-lg font-bold" style={{ color: shiftIndicator.color }}>
                {shiftIndicator.label}
              </p>
            </div>
          </div>

          {/* Prompt Details (Optional) */}
          {promptDetails && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                background: 'oklch(0.93 0.02 230)',
                color: 'oklch(0.4 0.05 250)',
              }}
            >
              <p className="font-semibold mb-1">Question Preview:</p>
              <p className="line-clamp-2">{promptDetails}</p>
            </div>
          )}

          {/* Button */}
          <Button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="w-full min-h-[44px]"
            style={{
              backgroundColor: 'oklch(0.6 0.18 230)',
              color: 'white',
            }}
          >
            <span>Provide Your Answer</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PostAssessmentConfidenceDialog

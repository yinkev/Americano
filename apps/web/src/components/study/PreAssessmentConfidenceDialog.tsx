'use client'

import { ChevronRight } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfidenceSlider } from './ConfidenceSlider'

interface PreAssessmentConfidenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfidenceCaptured: (confidence: number, rationale?: string) => void
}

/**
 * Pre-assessment confidence capture dialog
 * Appears BEFORE student sees assessment prompt details
 * Captures initial confidence to measure learning from prompt exposure
 */
export const PreAssessmentConfidenceDialog: React.FC<PreAssessmentConfidenceDialogProps> = ({
  open,
  onOpenChange,
  onConfidenceCaptured,
}) => {
  const [confidence, setConfidence] = useState(3)
  const [rationale, setRationale] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNext = async () => {
    setIsSubmitting(true)
    try {
      onConfidenceCaptured(confidence, rationale || undefined)
      // Reset state for next use
      setConfidence(3)
      setRationale('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Before We Begin</DialogTitle>
          <DialogDescription className="text-base">
            Help us understand your confidence before seeing the question. This helps track your
            learning and metacognitive awareness.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Confidence Slider */}
          <ConfidenceSlider
            value={confidence}
            onChange={setConfidence}
            showRationale={true}
            rationale={rationale}
            onRationaleChange={setRationale}
            label="How confident are you in your understanding of this concept?"
          />

          {/* Info Box */}
          <div
            className="p-3 rounded-lg text-sm"
            style={{
              background: 'oklch(0.9 0.02 230)',
              borderLeft: '4px solid',
              borderColor: 'oklch(0.55 0.2 250)',
              color: 'oklch(0.4 0.05 250)',
            }}
          >
            <p className="font-semibold mb-1">Why this matters:</p>
            <p>
              Your initial confidence helps us identify patterns - like when you overestimate or
              underestimate your knowledge. This awareness is crucial for better studying!
            </p>
          </div>

          {/* Button */}
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full min-h-[44px]"
            style={{
              backgroundColor: 'oklch(0.6 0.18 230)',
              color: 'white',
            }}
          >
            <span>See the Question</span>
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PreAssessmentConfidenceDialog

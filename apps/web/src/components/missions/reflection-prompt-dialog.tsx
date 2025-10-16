'use client'

import { useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ReflectionPromptDialogProps {
  open: boolean
  onClose: () => void
  milestone: number // Number of missions completed (e.g., 10, 25, 50)
  onSubmit: (reflection: ReflectionData) => void
}

export interface ReflectionData {
  workingStrategies: string
  challengingObjectives: string
  confidenceChange: string
  additionalThoughts?: string
}

export function ReflectionPromptDialog({
  open,
  onClose,
  milestone,
  onSubmit,
}: ReflectionPromptDialogProps) {
  const [reflection, setReflection] = useState<ReflectionData>({
    workingStrategies: '',
    challengingObjectives: '',
    confidenceChange: '',
    additionalThoughts: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    try {
      setSubmitting(true)
      await onSubmit(reflection)
      onClose()
      // Reset form
      setReflection({
        workingStrategies: '',
        challengingObjectives: '',
        confidenceChange: '',
        additionalThoughts: '',
      })
    } catch (error) {
      console.error('Failed to submit reflection:', error)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSkip() {
    onClose()
    // Reset form
    setReflection({
      workingStrategies: '',
      challengingObjectives: '',
      confidenceChange: '',
      additionalThoughts: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-white/30">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[oklch(0.7_0.15_230)]/10 p-3">
                <Lightbulb className="size-6 text-[oklch(0.7_0.15_230)]" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-heading font-bold text-[oklch(0.145_0_0)]">
                  Reflection Time!
                </DialogTitle>
                <DialogDescription className="text-[oklch(0.556_0_0)] mt-1">
                  You've completed {milestone} missions. Take a moment to reflect on your learning journey.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Celebration Message */}
          <div className="rounded-xl bg-[oklch(0.75_0.15_160)]/10 border border-[oklch(0.75_0.15_160)]/20 p-4">
            <p className="text-sm text-[oklch(0.145_0_0)]">
              <span className="font-semibold">Congratulations!</span> You've shown great
              consistency by completing {milestone} missions. Research shows that reflection
              enhances learning retention by 20-30%. Take 2-3 minutes to capture your thoughts.
            </p>
          </div>

          {/* Reflection Questions */}
          <div className="space-y-5">
            {/* Question 1 */}
            <div className="space-y-2">
              <Label
                htmlFor="working-strategies"
                className="text-sm font-medium text-[oklch(0.145_0_0)]"
              >
                1. What study strategies are working best for you?
              </Label>
              <Textarea
                id="working-strategies"
                value={reflection.workingStrategies}
                onChange={(e) =>
                  setReflection((prev) => ({
                    ...prev,
                    workingStrategies: e.target.value,
                  }))
                }
                placeholder="Example: Spaced repetition, active recall, teaching concepts to others..."
                className="min-h-[100px] bg-white/60 border-white/30 focus:border-[oklch(0.7_0.15_230)] focus:ring-[oklch(0.7_0.15_230)]/20"
                disabled={submitting}
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-2">
              <Label
                htmlFor="challenging-objectives"
                className="text-sm font-medium text-[oklch(0.145_0_0)]"
              >
                2. Which objectives or topics were most challenging?
              </Label>
              <Textarea
                id="challenging-objectives"
                value={reflection.challengingObjectives}
                onChange={(e) =>
                  setReflection((prev) => ({
                    ...prev,
                    challengingObjectives: e.target.value,
                  }))
                }
                placeholder="Example: Complex anatomy structures, physiology mechanisms, clinical reasoning..."
                className="min-h-[100px] bg-white/60 border-white/30 focus:border-[oklch(0.7_0.15_230)] focus:ring-[oklch(0.7_0.15_230)]/20"
                disabled={submitting}
              />
            </div>

            {/* Question 3 */}
            <div className="space-y-2">
              <Label
                htmlFor="confidence-change"
                className="text-sm font-medium text-[oklch(0.145_0_0)]"
              >
                3. How has your confidence changed over these {milestone} missions?
              </Label>
              <Textarea
                id="confidence-change"
                value={reflection.confidenceChange}
                onChange={(e) =>
                  setReflection((prev) => ({
                    ...prev,
                    confidenceChange: e.target.value,
                  }))
                }
                placeholder="Example: I feel more confident with anatomy but still uncertain about pathophysiology..."
                className="min-h-[100px] bg-white/60 border-white/30 focus:border-[oklch(0.7_0.15_230)] focus:ring-[oklch(0.7_0.15_230)]/20"
                disabled={submitting}
              />
            </div>

            {/* Optional Question */}
            <div className="space-y-2">
              <Label
                htmlFor="additional-thoughts"
                className="text-sm font-medium text-[oklch(0.556_0_0)]"
              >
                4. Any additional thoughts or insights? (Optional)
              </Label>
              <Textarea
                id="additional-thoughts"
                value={reflection.additionalThoughts}
                onChange={(e) =>
                  setReflection((prev) => ({
                    ...prev,
                    additionalThoughts: e.target.value,
                  }))
                }
                placeholder="Any other observations, patterns, or goals you'd like to note..."
                className="min-h-[80px] bg-white/60 border-white/30 focus:border-[oklch(0.7_0.15_230)] focus:ring-[oklch(0.7_0.15_230)]/20"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Benefits Note */}
          <div className="rounded-lg bg-[oklch(0.97_0_0)] p-3">
            <p className="text-xs text-[oklch(0.556_0_0)]">
              <span className="font-semibold">Why reflect?</span> Your reflections help
              Americano personalize future missions and identify areas where you need more
              support. They also serve as a personal learning journal you can review anytime.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/30">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={submitting}
              className="border-white/30 hover:bg-white/60"
            >
              Skip for Now
            </Button>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !reflection.workingStrategies.trim() ||
                  !reflection.challengingObjectives.trim() ||
                  !reflection.confidenceChange.trim()
                }
                className="bg-[oklch(0.7_0.15_230)] hover:bg-[oklch(0.65_0.15_230)] text-white"
              >
                {submitting ? 'Saving...' : 'Save Reflection'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

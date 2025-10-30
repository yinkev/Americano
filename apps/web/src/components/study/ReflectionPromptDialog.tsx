'use client'

import { Brain, Send, SkipForward } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getRandomReflectionQuestion, type ReflectionQuestion } from '@/lib/reflection-config'

interface ReflectionPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reflectionNotes: string) => void
  onSkip: () => void
  recentQuestionIds?: string[] // To avoid repeating recent questions
  completedThisWeek?: number // For progress display
}

/**
 * ReflectionPromptDialog
 *
 * Dialog for metacognitive reflection after assessments.
 *
 * **Features**:
 * - Displays randomly selected reflection question
 * - Optional textarea for user response
 * - Skip button to track skip rate
 * - Submit button to save reflection notes
 * - Progress indicator showing weekly completion
 * - Glassmorphism design with OKLCH colors
 *
 * @see Story 4.4 Task 6 (Metacognitive Reflection System)
 * @see Story 4.4 AC#5 (Metacognitive Reflection Prompts)
 * @see Story 4.4 Constraint #6 (Randomized questions, optional response)
 */
export function ReflectionPromptDialog({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  recentQuestionIds = [],
  completedThisWeek = 0,
}: ReflectionPromptDialogProps) {
  const [reflectionNotes, setReflectionNotes] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<ReflectionQuestion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Select a random question when dialog opens
  useEffect(() => {
    if (open && !currentQuestion) {
      const question = getRandomReflectionQuestion(recentQuestionIds)
      setCurrentQuestion(question)
    }
  }, [open, currentQuestion, recentQuestionIds])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setReflectionNotes('')
        setCurrentQuestion(null)
        setIsSubmitting(false)
      }, 300) // Wait for dialog close animation
    }
  }, [open])

  const handleSubmit = () => {
    setIsSubmitting(true)
    onSubmit(reflectionNotes.trim())
    onOpenChange(false)
  }

  const handleSkip = () => {
    onSkip()
    onOpenChange(false)
  }

  if (!currentQuestion) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full"
              style={{
                backgroundColor: 'oklch(0.95 0.05 230)',
              }}
            >
              <Brain className="h-6 w-6" style={{ color: 'oklch(0.6 0.18 230)' }} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-dm-sans">Reflect on Your Learning</DialogTitle>
              <DialogDescription className="text-base">
                Take a moment to think about your understanding
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Weekly Progress Indicator */}
          {completedThisWeek !== undefined && (
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{
                backgroundColor: 'oklch(0.95 0.05 145)',
                borderLeft: '4px solid oklch(0.7 0.15 145)',
              }}
            >
              <span className="text-sm font-medium" style={{ color: 'oklch(0.35 0.16 145)' }}>
                {completedThisWeek} reflection{completedThisWeek !== 1 ? 's' : ''} completed this
                week
              </span>
              <span className="text-xs text-muted-foreground">Keep it up!</span>
            </div>
          )}

          {/* Reflection Question */}
          <div className="space-y-3">
            <div
              className="p-6 rounded-lg border-2"
              style={{
                backgroundColor: 'oklch(0.98 0.02 230)',
                borderColor: 'oklch(0.85 0.08 230)',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-4xl font-serif" style={{ color: 'oklch(0.6 0.18 230)' }}>
                  "
                </span>
                <div className="flex-1 pt-2">
                  <p
                    className="text-lg font-medium leading-relaxed"
                    style={{ color: 'oklch(0.30 0.15 230)' }}
                  >
                    {currentQuestion.question}
                  </p>
                  {currentQuestion.category && (
                    <span
                      className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'oklch(0.92 0.05 230)',
                        color: 'oklch(0.45 0.16 230)',
                      }}
                    >
                      {currentQuestion.category.charAt(0).toUpperCase() +
                        currentQuestion.category.slice(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Optional Reflection Textarea */}
          <div className="space-y-3">
            <Label htmlFor="reflection" className="text-base font-medium">
              Your Reflection (Optional)
            </Label>
            <Textarea
              id="reflection"
              placeholder={currentQuestion.placeholder || 'Share your thoughts...'}
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              className="min-h-[120px] resize-none"
              aria-describedby="reflection-hint"
            />
            <p id="reflection-hint" className="text-xs text-muted-foreground">
              {reflectionNotes.length > 0
                ? `${reflectionNotes.length} characters`
                : 'You can skip this reflection, but taking time to reflect improves learning'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSkip}
              variant="outline"
              className="flex-1 min-h-[44px]"
              disabled={isSubmitting}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 min-h-[44px]"
              style={{
                backgroundColor: 'oklch(0.6 0.18 230)',
                color: 'white',
              }}
            >
              <Send className="mr-2 h-4 w-4" />
              {reflectionNotes.trim().length > 0 ? 'Submit Reflection' : 'Continue'}
            </Button>
          </div>

          {/* Helpful Note */}
          <div
            className="p-4 rounded-lg text-sm"
            style={{
              backgroundColor: 'oklch(0.95 0.05 60)',
              color: 'oklch(0.35 0.16 60)',
            }}
          >
            <p className="font-medium mb-1">💡 Why reflect?</p>
            <p className="text-xs leading-relaxed">
              Metacognitive reflection helps you understand <em>how</em> you learn, not just{' '}
              <em>what</em> you learn. This self-awareness improves long-term retention and clinical
              decision-making.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

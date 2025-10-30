/**
 * PredictionFeedbackDialog Component
 * Story 5.2 Task 8.1
 *
 * Collects user feedback on prediction accuracy after completing predicted topics
 * Triggers: 24 hours after topic studied OR next session start
 * Epic 5 UI Transformation: Already using shadcn/ui components
 */

'use client'

import { format } from 'date-fns'
import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

type FeedbackType = 'HELPFUL' | 'INACCURATE' | 'FEEDBACK_RECORDED'

interface Prediction {
  id: string
  topicName: string
  predictedFor: string
  predictedStruggleProbability: number
}

interface Props {
  prediction: Prediction
  open: boolean
  onOpenChange: (open: boolean) => void
  onFeedbackSubmitted?: () => void
}

type FeedbackOption = {
  value: 'struggled' | 'easy' | 'helpful'
  label: string
  description: string
  icon: React.ReactNode
  actualStruggle: boolean
  feedbackType: FeedbackType
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  {
    value: 'struggled',
    label: 'Yes, I struggled',
    description: 'The topic was difficult as predicted',
    icon: <AlertCircle className="size-5 text-[oklch(0.6_0.15_25)]" />,
    actualStruggle: true,
    feedbackType: 'HELPFUL',
  },
  {
    value: 'easy',
    label: 'No, it was easier than expected',
    description: 'The prediction overestimated the difficulty',
    icon: <CheckCircle2 className="size-5 text-[oklch(0.7_0.12_145)]" />,
    actualStruggle: false,
    feedbackType: 'INACCURATE',
  },
  {
    value: 'helpful',
    label: 'Prediction was helpful',
    description: 'The warning helped me prepare better',
    icon: <HelpCircle className="size-5 text-[oklch(0.65_0.15_250)]" />,
    actualStruggle: true,
    feedbackType: 'HELPFUL',
  },
]

export function PredictionFeedbackDialog({
  prediction,
  open,
  onOpenChange,
  onFeedbackSubmitted,
}: Props) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast.error('Please select an option')
      return
    }

    const option = FEEDBACK_OPTIONS.find((opt) => opt.value === selectedOption)
    if (!option) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/analytics/predictions/${prediction.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actualStruggle: option.actualStruggle,
          feedbackType: option.feedbackType,
          comments: comments.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      const data = await response.json()

      // Show success toast with model accuracy update
      if (data.data?.modelAccuracyUpdate) {
        toast.success(
          `Feedback recorded! Model accuracy: ${Math.round(data.data.modelAccuracyUpdate * 100)}%`,
          {
            duration: 5000,
          },
        )
      } else {
        toast.success('Feedback recorded successfully!')
      }

      // Reset form and close dialog
      setSelectedOption('')
      setComments('')
      onOpenChange(false)

      // Notify parent component
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
    setSelectedOption('')
    setComments('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.15)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-foreground">
            How did it go with {prediction.topicName}?
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            We predicted you might struggle with this topic on{' '}
            {format(new Date(prediction.predictedFor), 'MMM d, yyyy')}. Your feedback helps improve
            our predictions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Feedback Options */}
          <RadioGroup
            value={selectedOption}
            onValueChange={setSelectedOption}
            className="space-y-3"
          >
            {FEEDBACK_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`
                  relative flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${
                    selectedOption === option.value
                      ? 'border-[oklch(0.65_0.15_250)] bg-[oklch(0.65_0.15_250)]/5'
                      : 'border-muted bg-muted/30 hover:bg-muted/50'
                  }
                `}
                onClick={() => setSelectedOption(option.value)}
              >
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="mt-0.5 min-h-[44px]"
                  aria-label={option.label}
                />
                <div className="flex items-start gap-3 flex-1">
                  <div className="shrink-0 mt-0.5">{option.icon}</div>
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={option.value}
                      className="font-semibold text-foreground cursor-pointer text-base"
                    >
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          {/* Optional Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium text-foreground">
              Additional comments (optional)
            </Label>
            <Textarea
              id="comments"
              placeholder="Any specific challenges or insights you'd like to share..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[80px] resize-none bg-white/80 backdrop-blur-sm"
              maxLength={500}
              aria-label="Additional feedback comments"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comments.length}/500 characters
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1 min-h-11"
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
            className="flex-1 min-h-11 bg-[oklch(0.65_0.15_250)] hover:bg-[oklch(0.60_0.15_250)] text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Your feedback is used to improve prediction accuracy for everyone
        </p>
      </DialogContent>
    </Dialog>
  )
}

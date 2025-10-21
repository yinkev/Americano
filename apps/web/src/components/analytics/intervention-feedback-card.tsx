/**
 * InterventionFeedbackCard Component
 * Story 5.2 Task 8.2
 *
 * Collects user feedback on intervention effectiveness
 * Displays after intervention is completed with 1-5 star rating
 * Epic 5 UI Transformation: Already using shadcn/ui components
 */

'use client'

import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Meh, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type InterventionType =
  | 'PREREQUISITE_REVIEW'
  | 'DIFFICULTY_PROGRESSION'
  | 'CONTENT_FORMAT_ADAPT'
  | 'COGNITIVE_LOAD_REDUCE'
  | 'SPACED_REPETITION_BOOST'
  | 'BREAK_SCHEDULE_ADJUST'

type FeedbackType = 'INTERVENTION_GOOD' | 'INTERVENTION_BAD'

interface Intervention {
  id: string
  predictionId: string
  interventionType: InterventionType
  description: string
  reasoning: string
}

interface Props {
  intervention: Intervention
  onFeedbackSubmitted?: () => void
  onDismiss?: () => void
}

type HelpfulnessOption = {
  value: number
  label: string
  description: string
  icon: React.ReactNode
  feedbackType: FeedbackType
  color: string
}

const HELPFULNESS_OPTIONS: HelpfulnessOption[] = [
  {
    value: 5,
    label: 'Very helpful',
    description: 'Significantly improved my understanding',
    icon: <ThumbsUp className="size-5" />,
    feedbackType: 'INTERVENTION_GOOD',
    color: 'oklch(0.7 0.12 145)',
  },
  {
    value: 3,
    label: 'Somewhat helpful',
    description: 'Had some positive impact',
    icon: <Meh className="size-5" />,
    feedbackType: 'INTERVENTION_GOOD',
    color: 'oklch(0.8 0.15 85)',
  },
  {
    value: 1,
    label: 'Not helpful',
    description: 'Did not improve my learning',
    icon: <ThumbsDown className="size-5" />,
    feedbackType: 'INTERVENTION_BAD',
    color: 'oklch(0.6 0.15 25)',
  },
  {
    value: 1,
    label: 'Made it worse',
    description: 'Increased confusion or difficulty',
    icon: <TrendingDown className="size-5" />,
    feedbackType: 'INTERVENTION_BAD',
    color: 'oklch(0.5 0.15 25)',
  },
]

const getInterventionTypeLabel = (type: InterventionType): string => {
  const labels: Record<InterventionType, string> = {
    PREREQUISITE_REVIEW: 'Prerequisite Review',
    DIFFICULTY_PROGRESSION: 'Difficulty Progression',
    CONTENT_FORMAT_ADAPT: 'Content Format Adaptation',
    COGNITIVE_LOAD_REDUCE: 'Cognitive Load Reduction',
    SPACED_REPETITION_BOOST: 'Spaced Repetition Boost',
    BREAK_SCHEDULE_ADJUST: 'Break Schedule Adjustment',
  }
  return labels[type] || type
}

export function InterventionFeedbackCard({ intervention, onFeedbackSubmitted, onDismiss }: Props) {
  const [selectedHelpfulness, setSelectedHelpfulness] = useState<number | null>(null)
  const [starRating, setStarRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comments, setComments] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  const handleSubmit = async () => {
    if (selectedHelpfulness === null && starRating === 0) {
      toast.error('Please provide a rating')
      return
    }

    const selectedOption = HELPFULNESS_OPTIONS.find((opt) => opt.value === selectedHelpfulness)
    const actualHelpfulness = starRating > 0 ? starRating : selectedHelpfulness || 1
    const feedbackType: FeedbackType =
      selectedOption?.feedbackType ||
      (actualHelpfulness >= 3 ? 'INTERVENTION_GOOD' : 'INTERVENTION_BAD')

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `/api/analytics/predictions/${intervention.predictionId}/feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actualStruggle: true, // Intervention feedback implies user did struggle
            feedbackType,
            helpfulness: actualHelpfulness,
            comments: comments.trim() || undefined,
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      toast.success('Thank you for your feedback!', {
        description: 'This helps us improve our interventions.',
      })

      // Notify parent and hide card
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }
      setIsDismissed(true)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDismissCard = () => {
    if (onDismiss) {
      onDismiss()
    }
    setIsDismissed(true)
  }

  const displayRating = hoverRating || starRating

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg text-foreground flex items-start justify-between gap-3">
          <span>How helpful was this intervention?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissCard}
            className="shrink-0 -mr-2 -mt-2 h-8 w-8 p-0"
            aria-label="Dismiss feedback card"
          >
            ×
          </Button>
        </CardTitle>
        <div className="mt-3 p-3 rounded-lg bg-[oklch(0.65_0.15_250)]/5 border border-[oklch(0.65_0.15_250)]/20">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 rounded bg-[oklch(0.65_0.15_250)]/10">
              <Star className="size-4 text-[oklch(0.65_0.15_250)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {getInterventionTypeLabel(intervention.interventionType)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{intervention.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Rate this intervention</Label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setStarRating(rating)}
                onMouseEnter={() => setHoverRating(rating)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.15_250)] focus:ring-offset-2 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={`Rate ${rating} out of 5 stars`}
              >
                <Star
                  className={`size-8 ${
                    rating <= displayRating
                      ? 'fill-[oklch(0.8_0.15_85)] text-[oklch(0.8_0.15_85)]'
                      : 'fill-none text-muted-foreground'
                  } transition-colors`}
                />
              </button>
            ))}
            {starRating > 0 && (
              <span className="ml-2 text-sm font-semibold text-foreground">
                {starRating} / 5 stars
              </span>
            )}
          </div>
        </div>

        {/* Quick Feedback Options */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Or choose an option</Label>
          <RadioGroup
            value={selectedHelpfulness?.toString() || ''}
            onValueChange={(value) => setSelectedHelpfulness(Number.parseInt(value))}
            className="space-y-2"
          >
            {HELPFULNESS_OPTIONS.map((option) => (
              <div
                key={`${option.value}-${option.label}`}
                className={`
                  relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${
                    selectedHelpfulness === option.value
                      ? `border-[${option.color}] bg-[${option.color}]/5`
                      : 'border-muted bg-muted/30 hover:bg-muted/50'
                  }
                `}
                onClick={() => setSelectedHelpfulness(option.value)}
              >
                <RadioGroupItem
                  value={option.value.toString()}
                  id={`option-${option.value}-${option.label}`}
                  className="min-h-[44px]"
                  aria-label={option.label}
                />
                <div className="flex items-center gap-3 flex-1">
                  <div className="shrink-0" style={{ color: option.color }}>
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`option-${option.value}-${option.label}`}
                      className="font-semibold text-foreground cursor-pointer"
                    >
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Optional Comments */}
        {(selectedHelpfulness !== null || starRating > 0) && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
            <Label htmlFor="intervention-comments" className="text-sm font-medium text-foreground">
              Tell us more (optional)
            </Label>
            <Textarea
              id="intervention-comments"
              placeholder="What worked well or could be improved..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[70px] resize-none bg-white/80 backdrop-blur-sm"
              maxLength={300}
              aria-label="Additional intervention feedback"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comments.length}/300 characters
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={(selectedHelpfulness === null && starRating === 0) || isSubmitting}
          className="w-full min-h-11 bg-[oklch(0.65_0.15_250)] hover:bg-[oklch(0.60_0.15_250)] text-white"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your feedback improves our intervention recommendations
        </p>
      </CardContent>
    </Card>
  )
}

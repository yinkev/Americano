/**
 * MissionFeedbackDialog Component
 * Story 2.6 Task 4.1
 *
 * Post-mission feedback collection dialog
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  missionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
}

type PaceRating = 'TOO_SLOW' | 'JUST_RIGHT' | 'TOO_FAST';

export function MissionFeedbackDialog({
  missionId,
  open,
  onOpenChange,
  onSubmit,
}: Props) {
  const [helpfulnessRating, setHelpfulnessRating] = useState<number>(0);
  const [relevanceScore, setRelevanceScore] = useState<number>(0);
  const [paceRating, setPaceRating] = useState<PaceRating | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (helpfulnessRating === 0 || relevanceScore === 0 || !paceRating) {
      toast.error('Please complete all required ratings');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/missions/${missionId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          helpfulnessRating,
          relevanceScore,
          paceRating,
          improvementSuggestions: improvementSuggestions || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const result = await response.json();

      toast.success('Feedback submitted successfully!', {
        description: 'Your input helps us improve mission quality.',
      });

      // Reset form
      setHelpfulnessRating(0);
      setRelevanceScore(0);
      setPaceRating(null);
      setImprovementSuggestions('');

      onOpenChange(false);
      onSubmit?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback', {
        description: 'Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-semibold">
            How was this mission?
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us create better missions. This will take less
            than 30 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Helpfulness Rating */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[oklch(0.145_0_0)] mb-3">
              <ThumbsUp className="size-4" />
              How helpful was this mission?
              <span className="text-[oklch(0.65_0.15_10)]">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setHelpfulnessRating(rating)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    helpfulnessRating >= rating
                      ? 'border-[oklch(0.7_0.15_50)] bg-[oklch(0.7_0.15_50)]/10'
                      : 'border-[oklch(0.922_0_0)] hover:border-[oklch(0.7_0.15_50)]/50'
                  }`}
                  aria-label={`${rating} stars`}
                >
                  <Star
                    className={`size-6 mx-auto ${
                      helpfulnessRating >= rating
                        ? 'fill-[oklch(0.7_0.15_50)] text-[oklch(0.7_0.15_50)]'
                        : 'text-[oklch(0.556_0_0)]'
                    }`}
                  />
                  <span className="text-xs text-[oklch(0.556_0_0)] mt-1 block">
                    {rating}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
              1 = Not helpful, 5 = Very helpful
            </p>
          </div>

          {/* Relevance Rating */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[oklch(0.145_0_0)] mb-3">
              <Target className="size-4" />
              How relevant were the objectives?
              <span className="text-[oklch(0.65_0.15_10)]">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setRelevanceScore(rating)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    relevanceScore >= rating
                      ? 'border-[oklch(0.7_0.15_230)] bg-[oklch(0.7_0.15_230)]/10'
                      : 'border-[oklch(0.922_0_0)] hover:border-[oklch(0.7_0.15_230)]/50'
                  }`}
                  aria-label={`${rating} stars`}
                >
                  <Star
                    className={`size-6 mx-auto ${
                      relevanceScore >= rating
                        ? 'fill-[oklch(0.7_0.15_230)] text-[oklch(0.7_0.15_230)]'
                        : 'text-[oklch(0.556_0_0)]'
                    }`}
                  />
                  <span className="text-xs text-[oklch(0.556_0_0)] mt-1 block">
                    {rating}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
              1 = Not relevant, 5 = Very relevant
            </p>
          </div>

          {/* Pace Rating */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[oklch(0.145_0_0)] mb-3">
              <Clock className="size-4" />
              Was the pace right for you?
              <span className="text-[oklch(0.65_0.15_10)]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaceRating('TOO_SLOW')}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paceRating === 'TOO_SLOW'
                    ? 'border-[oklch(0.7_0.15_230)] bg-[oklch(0.7_0.15_230)]/10 text-[oklch(0.7_0.15_230)]'
                    : 'border-[oklch(0.922_0_0)] text-[oklch(0.556_0_0)] hover:border-[oklch(0.7_0.15_230)]/50'
                }`}
              >
                Too Slow
              </button>
              <button
                onClick={() => setPaceRating('JUST_RIGHT')}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paceRating === 'JUST_RIGHT'
                    ? 'border-[oklch(0.75_0.15_160)] bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)]'
                    : 'border-[oklch(0.922_0_0)] text-[oklch(0.556_0_0)] hover:border-[oklch(0.75_0.15_160)]/50'
                }`}
              >
                Just Right
              </button>
              <button
                onClick={() => setPaceRating('TOO_FAST')}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paceRating === 'TOO_FAST'
                    ? 'border-[oklch(0.7_0.15_230)] bg-[oklch(0.7_0.15_230)]/10 text-[oklch(0.7_0.15_230)]'
                    : 'border-[oklch(0.922_0_0)] text-[oklch(0.556_0_0)] hover:border-[oklch(0.7_0.15_230)]/50'
                }`}
              >
                Too Fast
              </button>
            </div>
          </div>

          {/* Optional Suggestions */}
          <div>
            <label
              htmlFor="suggestions"
              className="text-sm font-medium text-[oklch(0.145_0_0)] mb-2 block"
            >
              Any suggestions for improvement? (Optional)
            </label>
            <Textarea
              id="suggestions"
              value={improvementSuggestions}
              onChange={(e) => setImprovementSuggestions(e.target.value)}
              placeholder="Tell us how we can make missions better for you..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Import Target icon (missing from imports)
import { Target } from 'lucide-react';

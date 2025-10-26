'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Target,
  Calendar,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import type { ValidationPromptData } from '@/types/validation';

/**
 * Emotion tags for memory anchoring (Story 4.3 AC#4)
 */
type EmotionTag = 'SURPRISE' | 'CONFUSION' | 'FRUSTRATION' | 'AHA_MOMENT';

/**
 * Challenge metadata including vulnerability type
 */
interface ChallengeMetadata {
  vulnerabilityType: 'OVERCONFIDENCE' | 'MISCONCEPTION' | 'RECENT_MISTAKES';
  attemptNumber?: number; // For retry tracking
  previousScore?: number; // For retry context
}

/**
 * Corrective feedback structure (Story 4.3 AC#3)
 */
interface CorrectiveFeedback {
  misconceptionExplained: string;
  correctConcept: string;
  clinicalContext: string;
  memoryAnchor: string; // Mnemonic, analogy, or clinical pearl
}

/**
 * Challenge response data
 */
interface ChallengeResponse {
  isCorrect: boolean;
  feedback?: CorrectiveFeedback;
  retrySchedule?: string[]; // ISO date strings
  celebration?: string; // Success message on retry mastery
}

interface ChallengeModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenge: ValidationPromptData;
  metadata: ChallengeMetadata;
  onComplete: (response: {
    userAnswer: string;
    confidenceLevel: number;
    emotionTag?: EmotionTag;
    personalNotes?: string;
    isCorrect: boolean;
  }) => void;
  onSkip: () => void;
}

const CONFIDENCE_LABELS = [
  'Very Uncertain',
  'Somewhat Uncertain',
  'Neutral',
  'Somewhat Confident',
  'Very Confident',
];

const EMOTION_OPTIONS: { value: EmotionTag; label: string; description: string }[] = [
  {
    value: 'SURPRISE',
    label: 'Surprise 😮',
    description: 'This challenged my assumptions'
  },
  {
    value: 'CONFUSION',
    label: 'Confusion 🤔',
    description: 'I need to think more about this'
  },
  {
    value: 'FRUSTRATION',
    label: 'Frustration 😤',
    description: 'This was really difficult'
  },
  {
    value: 'AHA_MOMENT',
    label: 'Aha! 💡',
    description: 'Now I understand!'
  },
];

/**
 * ChallengeModeDialog
 *
 * Dialog for displaying controlled failure challenges with growth mindset framing.
 *
 * **Features**:
 * - Challenge framing: "Challenge Mode - This is designed to be difficult!"
 * - Near-miss distractor questions
 * - Confidence slider (1-5 before submission)
 * - Corrective feedback panel on incorrect answer
 * - Emotion tag selection for memory anchoring
 * - Personal notes textarea
 * - Retry schedule display
 * - "Retry Now" button for immediate retry
 * - Growth mindset colors: orange for challenge, green for success
 * - Glassmorphism design with OKLCH colors (NO gradients)
 *
 * @see Story 4.3 Task 7 (Challenge Mode Component)
 * @see Story 4.3 AC#2 (Safe Failure Environment), AC#3 (Corrective Feedback), AC#4 (Emotional Anchoring)
 */
export function ChallengeModeDialog({
  open,
  onOpenChange,
  challenge,
  metadata,
  onComplete,
  onSkip,
}: ChallengeModeDialogProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3); // Default to "Neutral"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ChallengeResponse | null>(null);
  const [emotionTag, setEmotionTag] = useState<EmotionTag | undefined>(undefined);
  const [personalNotes, setPersonalNotes] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setUserAnswer('');
        setConfidenceLevel(3);
        setResponse(null);
        setEmotionTag(undefined);
        setPersonalNotes('');
        setShowFeedback(false);
      }, 300); // Wait for dialog close animation
    }
  }, [open]);

  const handleSubmit = async () => {
    if (userAnswer.trim().length < 10) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Call challenge submission API
      const apiResponse = await fetch('/api/validation/challenges/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          userAnswer,
          confidence: confidenceLevel,
          emotionTag,
          personalNotes,
        }),
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to submit challenge response');
      }

      const data = await apiResponse.json();
      setResponse(data);
      setShowFeedback(!data.isCorrect); // Show feedback panel if incorrect
    } catch (err) {
      console.error('Challenge submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    onComplete({
      userAnswer,
      confidenceLevel,
      emotionTag,
      personalNotes,
      isCorrect: response?.isCorrect ?? false,
    });
    onOpenChange(false);
  };

  const handleRetryNow = () => {
    // Reset for immediate retry
    setUserAnswer('');
    setConfidenceLevel(3);
    setResponse(null);
    setEmotionTag(undefined);
    setPersonalNotes('');
    setShowFeedback(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  // Format retry dates for display
  const formatRetrySchedule = (schedule: string[]) => {
    return schedule.map((dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card  shadow-none">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full"
              style={{ backgroundColor: 'oklch(0.95 0.08 45)' }}
            >
              <Target
                className="w-6 h-6"
                style={{ color: 'oklch(0.72 0.16 45)' }}
              />
            </div>
            <div>
              <DialogTitle className="text-2xl font-heading flex items-center gap-2">
                Challenge Mode
                <span
                  className="text-sm font-normal px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'oklch(0.95 0.08 45)',
                    color: 'oklch(0.5 0.16 45)'
                  }}
                >
                  {metadata.attemptNumber ? `Retry #${metadata.attemptNumber}` : 'New Challenge'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Embrace the challenge! This is designed to be difficult — that's where learning happens.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Challenge Context */}
          <Card
            className="p-4 border"
            style={{
              backgroundColor: 'oklch(0.98 0.03 45)',
              borderColor: 'oklch(0.90 0.06 45)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: 'oklch(0.72 0.16 45)' }}
              />
              <div className="flex-1 space-y-2">
                <h3
                  className="font-semibold text-sm"
                  style={{ color: 'oklch(0.5 0.16 45)' }}
                >
                  Concept Being Challenged
                </h3>
                <p className="text-base text-foreground">
                  {challenge.conceptName}
                </p>
                {metadata.previousScore !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Previous attempt: {metadata.previousScore}% — You've got this!
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Challenge Question */}
          <div className="p-5 rounded-lg border" style={{
            backgroundColor: 'oklch(1 0 0)',
            borderColor: 'oklch(0.92 0 0)',
          }}>
            <p className="text-base leading-relaxed">{challenge.promptText}</p>
          </div>

          {!showFeedback ? (
            <>
              {/* Confidence Slider (Before Answer) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidence" className="text-base font-medium">
                    How confident are you in your answer?
                  </Label>
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'oklch(0.72 0.16 45)' }}
                  >
                    {CONFIDENCE_LABELS[confidenceLevel - 1]}
                  </span>
                </div>
                <Slider
                  id="confidence"
                  min={1}
                  max={5}
                  step={1}
                  value={[confidenceLevel]}
                  onValueChange={(value) => setConfidenceLevel(value[0])}
                  className="w-full"
                  aria-label="Confidence level slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Very Uncertain</span>
                  <span>Very Confident</span>
                </div>
              </div>

              {/* Answer Input */}
              <div className="space-y-3">
                <Label htmlFor="answer" className="text-base font-medium">
                  Your Answer
                </Label>
                <Textarea
                  id="answer"
                  placeholder="Type your answer here... (minimum 10 characters)"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="min-h-[150px] resize-none"
                  aria-describedby="answer-hint"
                />
                <p id="answer-hint" className="text-xs text-muted-foreground">
                  {userAnswer.length} characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || userAnswer.trim().length < 10}
                  className="flex-1 min-h-[44px]"
                  style={{
                    backgroundColor: 'oklch(0.72 0.16 45)',
                    color: 'white',
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                >
                  Skip Challenge
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Corrective Feedback Panel */}
              {response && response.feedback && (
                <div className="space-y-6">
                  {/* Incorrect Indicator */}
                  <Card
                    className="p-5 border"
                    style={{
                      backgroundColor: 'oklch(0.98 0.03 45)',
                      borderColor: 'oklch(0.90 0.06 45)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <XCircle
                        className="w-6 h-6 flex-shrink-0"
                        style={{ color: 'oklch(0.72 0.16 45)' }}
                      />
                      <div>
                        <h3
                          className="font-semibold text-lg"
                          style={{ color: 'oklch(0.5 0.16 45)' }}
                        >
                          Not quite — but that's okay!
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Mistakes are powerful learning opportunities. Let's break this down.
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Misconception Explained */}
                  <Card className="p-5 border border-border">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Why This Was Incorrect</h4>
                        <p className="text-sm text-foreground leading-relaxed">
                          {response.feedback.misconceptionExplained}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Correct Concept */}
                  <Card
                    className="p-5 border"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 145)',
                      borderColor: 'oklch(0.85 0.08 145)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: 'oklch(0.7 0.15 145)' }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">The Correct Concept</h4>
                        <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.35 0.16 145)' }}>
                          {response.feedback.correctConcept}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Clinical Context */}
                  <Card
                    className="p-5 border"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 230)',
                      borderColor: 'oklch(0.85 0.08 230)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Target
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: 'oklch(0.6 0.18 230)' }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Clinical Context</h4>
                        <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.35 0.16 230)' }}>
                          {response.feedback.clinicalContext}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Memory Anchor */}
                  <Card
                    className="p-5 border"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 280)',
                      borderColor: 'oklch(0.85 0.08 280)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: 'oklch(0.68 0.16 280)' }}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Memory Trick</h4>
                        <p className="text-sm leading-relaxed font-medium" style={{ color: 'oklch(0.35 0.16 280)' }}>
                          {response.feedback.memoryAnchor}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Emotion Tag Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">
                      How did this challenge make you feel? (Optional)
                    </Label>
                    <RadioGroup
                      value={emotionTag}
                      onValueChange={(value) => setEmotionTag(value as EmotionTag)}
                      className="grid grid-cols-2 gap-3"
                    >
                      {EMOTION_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent"
                          style={{
                            borderColor: emotionTag === option.value
                              ? 'oklch(0.72 0.16 45)'
                              : 'oklch(0.92 0 0)',
                            backgroundColor: emotionTag === option.value
                              ? 'oklch(0.98 0.03 45)'
                              : 'transparent',
                          }}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={option.value}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-h-[44px] flex flex-col justify-center">
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Personal Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-base font-medium">
                      Personal Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="What clicked for you? What will you remember about this?"
                      value={personalNotes}
                      onChange={(e) => setPersonalNotes(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      {personalNotes.length}/500 characters
                    </p>
                  </div>

                  {/* Retry Schedule */}
                  {response.retrySchedule && response.retrySchedule.length > 0 && (
                    <Card
                      className="p-5 border"
                      style={{
                        backgroundColor: 'oklch(0.98 0.03 45)',
                        borderColor: 'oklch(0.90 0.06 45)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Calendar
                          className="w-5 h-5 flex-shrink-0 mt-0.5"
                          style={{ color: 'oklch(0.72 0.16 45)' }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">Scheduled Retries</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            We'll test you again on these dates to reinforce your learning:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {formatRetrySchedule(response.retrySchedule).map((date, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: 'oklch(0.95 0.08 45)',
                                  color: 'oklch(0.5 0.16 45)',
                                }}
                              >
                                {date}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleRetryNow}
                      variant="outline"
                      className="flex-1 min-h-[44px]"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Now
                    </Button>
                    <Button
                      onClick={handleComplete}
                      className="flex-1 min-h-[44px]"
                      style={{
                        backgroundColor: 'oklch(0.72 0.16 45)',
                        color: 'white',
                      }}
                    >
                      Continue Session
                    </Button>
                  </div>
                </div>
              )}

              {/* Success State (Retry Mastery) */}
              {response && response.isCorrect && response.celebration && (
                <div className="space-y-6">
                  <Card
                    className="p-8 border text-center"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 145)',
                      borderColor: 'oklch(0.85 0.08 145)',
                    }}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'oklch(0.7 0.15 145)' }}
                      >
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3
                          className="text-2xl font-heading font-bold mb-2"
                          style={{ color: 'oklch(0.4 0.15 145)' }}
                        >
                          You've Conquered This!
                        </h3>
                        <p className="text-base" style={{ color: 'oklch(0.35 0.16 145)' }}>
                          {response.celebration}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Button
                    onClick={handleComplete}
                    className="w-full min-h-[44px]"
                    style={{
                      backgroundColor: 'oklch(0.7 0.15 145)',
                      color: 'white',
                    }}
                  >
                    Continue Session
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

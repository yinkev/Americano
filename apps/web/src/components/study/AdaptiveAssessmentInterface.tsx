'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Info,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { DifficultyIndicator } from './DifficultyIndicator';
import { ConfidenceIntervalDisplay } from './ConfidenceIntervalDisplay';

interface AdaptiveAssessmentInterfaceProps {
  sessionId: string;
  objectiveId: string;
  onComplete: (result: AssessmentResult) => void;
}

interface AssessmentResult {
  score: number;
  responseId: string;
  difficultyAdjustment?: number;
}

interface QuestionData {
  id: string;
  promptText: string;
  difficulty: number;
  isFollowUp?: boolean;
  parentContext?: string;
}

interface DifficultyAdjustment {
  previousDifficulty: number;
  newDifficulty: number;
  reason: string;
  type: 'increase' | 'decrease' | 'maintain';
}

interface EfficiencyMetrics {
  questionsAsked: number;
  baselineQuestions: number;
  timeSaved: number;
  efficiencyScore: number;
}

/**
 * AdaptiveAssessmentInterface
 *
 * Main UI component for adaptive assessment sessions (Story 4.5 Task 4).
 * Provides real-time difficulty adjustment, follow-up question context,
 * mastery progress tracking, and efficiency metrics display.
 *
 * **Features:**
 * - Current question display with difficulty indicator
 * - Real-time difficulty adjustment notifications
 * - Follow-up question context explanation
 * - IRT-based confidence interval display
 * - Early stopping recommendation
 * - Efficiency metrics (questions saved)
 * - Mastery progress visualization
 * - Glassmorphism design with OKLCH colors
 * - 44px minimum touch targets for accessibility
 *
 * **Design System:**
 * - Background: bg-white/95 backdrop-blur-xl
 * - Colors: OKLCH color space (no gradients)
 * - Fonts: Inter (body), DM Sans (headings)
 * - Touch targets: min-h-[44px]
 *
 * @see Story 4.5 AC#2 (Real-Time Difficulty Adjustment)
 * @see Story 4.5 AC#3 (Knowledge Graph Follow-Ups)
 * @see Story 4.5 AC#7 (Assessment Efficiency with IRT)
 * @see Story 4.5 AC#8 (Adaptive Session Orchestration)
 */
export function AdaptiveAssessmentInterface({
  sessionId,
  objectiveId,
  onComplete,
}: AdaptiveAssessmentInterfaceProps) {
  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [userAnswer, setUserAnswer] = useState('');

  // Difficulty tracking
  const [currentDifficulty, setCurrentDifficulty] = useState(50);
  const [difficultyAdjustment, setDifficultyAdjustment] = useState<DifficultyAdjustment | null>(null);
  const [adjustmentCount, setAdjustmentCount] = useState(0);

  // IRT and efficiency
  const [knowledgeEstimate, setKnowledgeEstimate] = useState<number | null>(null);
  const [confidenceInterval, setConfidenceInterval] = useState<number | null>(null);
  const [canStopEarly, setCanStopEarly] = useState(false);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetrics | null>(null);

  // Progress tracking
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [masteryProgress, setMasteryProgress] = useState(0);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial question (mock for demo)
  useState(() => {
    // TODO: Call API to get initial question based on user history
    setCurrentQuestion({
      id: 'q1',
      promptText: 'Explain the mechanism of action of ACE inhibitors and their clinical use in hypertension.',
      difficulty: 50,
    });
  });

  const handleSubmit = async () => {
    if (userAnswer.trim().length < 10) {
      setError('Please provide a more detailed answer (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit answer and get evaluation
      const response = await fetch('/api/adaptive/question/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          objectiveId,
          questionId: currentQuestion?.id,
          userAnswer,
          currentDifficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      const data = await response.json();

      // Update difficulty if adjusted
      if (data.difficultyAdjustment) {
        setDifficultyAdjustment(data.difficultyAdjustment);
        setCurrentDifficulty(data.difficultyAdjustment.newDifficulty);
        setAdjustmentCount(prev => prev + 1);
      }

      // Update IRT metrics
      if (data.irtMetrics) {
        setKnowledgeEstimate(data.irtMetrics.theta);
        setConfidenceInterval(data.irtMetrics.confidenceInterval);
        setCanStopEarly(data.irtMetrics.canStopEarly);
      }

      // Update efficiency metrics
      if (data.efficiencyMetrics) {
        setEfficiencyMetrics(data.efficiencyMetrics);
      }

      // Update progress
      setQuestionsAnswered(prev => prev + 1);
      setMasteryProgress(data.masteryProgress || 0);

      // Check if session should end
      if (data.shouldEnd || data.canStopEarly) {
        onComplete({
          score: data.score,
          responseId: data.responseId,
          difficultyAdjustment: data.difficultyAdjustment?.newDifficulty,
        });
        return;
      }

      // Load next question
      if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setUserAnswer('');
        setDifficultyAdjustment(null); // Clear after showing for 3 seconds
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEarlyStop = () => {
    // User opts to stop early based on IRT convergence
    onComplete({
      score: knowledgeEstimate || 0,
      responseId: 'early-stop',
    });
  };

  if (!currentQuestion) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading question...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Difficulty Adjustment Notification */}
      {difficultyAdjustment && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300 motion-reduce:animate-none"
          style={{
            backgroundColor:
              difficultyAdjustment.type === 'increase'
                ? 'oklch(0.95 0.05 145)'
                : difficultyAdjustment.type === 'decrease'
                ? 'oklch(0.95 0.05 85)'
                : 'oklch(0.95 0.02 230)',
            borderColor:
              difficultyAdjustment.type === 'increase'
                ? 'oklch(0.85 0.08 145)'
                : difficultyAdjustment.type === 'decrease'
                ? 'oklch(0.85 0.08 85)'
                : 'oklch(0.85 0.04 230)',
          }}
        >
          {difficultyAdjustment.type === 'increase' ? (
            <ArrowUp className="h-5 w-5" style={{ color: 'oklch(0.55 0.18 145)' }} />
          ) : difficultyAdjustment.type === 'decrease' ? (
            <ArrowDown className="h-5 w-5" style={{ color: 'oklch(0.55 0.18 85)' }} />
          ) : (
            <TrendingUp className="h-5 w-5" style={{ color: 'oklch(0.55 0.18 230)' }} />
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm">Difficulty Adjusted</p>
            <p className="text-xs text-muted-foreground">{difficultyAdjustment.reason}</p>
          </div>
          <Badge variant="secondary">
            {difficultyAdjustment.previousDifficulty} → {difficultyAdjustment.newDifficulty}
          </Badge>
        </div>
      )}

      {/* Follow-Up Context */}
      {currentQuestion.isFollowUp && currentQuestion.parentContext && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'oklch(0.95 0.02 250)',
            borderColor: 'oklch(0.85 0.04 250)',
          }}
        >
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.55 0.18 250)' }} />
          <div>
            <p className="font-semibold text-sm mb-1" style={{ color: 'oklch(0.3 0.15 250)' }}>
              Follow-Up Question
            </p>
            <p className="text-sm text-muted-foreground">
              {currentQuestion.parentContext}
            </p>
          </div>
        </div>
      )}

      {/* Main Assessment Card */}
      <Card className="bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 motion-reduce:animate-none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl font-dm-sans">Assessment Question</CardTitle>
              <CardDescription className="mt-1">
                Question {questionsAnswered + 1} • Current difficulty: {currentDifficulty}/100
              </CardDescription>
            </div>
            <DifficultyIndicator currentDifficulty={currentDifficulty} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question Text */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'oklch(0.98 0.01 230)',
              borderColor: 'oklch(0.9 0.02 230)',
            }}
          >
            <p className="text-base leading-relaxed">{currentQuestion.promptText}</p>
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

          {/* Error Message */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg border"
              style={{
                backgroundColor: 'oklch(0.95 0.05 25)',
                borderColor: 'oklch(0.85 0.08 25)',
                color: 'oklch(0.35 0.16 25)',
              }}
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Separator />

          {/* IRT Metrics Display */}
          {knowledgeEstimate !== null && confidenceInterval !== null && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Knowledge Estimate (IRT)</p>
                <ConfidenceIntervalDisplay
                  estimate={knowledgeEstimate}
                  confidenceInterval={confidenceInterval}
                />
              </div>
              {canStopEarly && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="secondary"
                        className="cursor-help"
                        style={{
                          backgroundColor: 'oklch(0.95 0.05 145)',
                          color: 'oklch(0.35 0.16 145)',
                          borderColor: 'oklch(0.85 0.08 145)',
                        }}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Early Stop Available
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        IRT confidence interval has converged. You can stop now to save time
                        while maintaining accurate assessment.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* Efficiency Metrics */}
          {efficiencyMetrics && (
            <div
              className="p-4 rounded-lg border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-500 motion-reduce:animate-none"
              style={{
                backgroundColor: 'oklch(0.95 0.02 230)',
                borderColor: 'oklch(0.85 0.04 230)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5" style={{ color: 'oklch(0.55 0.18 230)' }} />
                <h3 className="font-semibold text-sm">Efficiency Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Questions Asked</p>
                  <p className="font-medium text-lg">
                    {efficiencyMetrics.questionsAsked} / {efficiencyMetrics.baselineQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time Saved</p>
                  <p className="font-medium text-lg">{efficiencyMetrics.timeSaved}%</p>
                </div>
              </div>
              <Progress value={efficiencyMetrics.efficiencyScore} className="mt-3 h-2 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none" />
              <p className="text-xs text-muted-foreground mt-2">
                Efficiency Score: {Math.round(efficiencyMetrics.efficiencyScore)}%
              </p>
            </div>
          )}

          {/* Mastery Progress */}
          {masteryProgress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Mastery Progress</Label>
                <span className="text-sm text-muted-foreground">{Math.round(masteryProgress)}%</span>
              </div>
              <Progress value={masteryProgress} className="h-2 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none" />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          {canStopEarly ? (
            <>
              <Button
                onClick={handleEarlyStop}
                variant="outline"
                className="flex-1 min-h-[44px] motion-safe:transition-all motion-safe:duration-150 motion-safe:active:scale-[0.98] motion-reduce:transition-none"
              >
                Stop Early (Optimal)
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || userAnswer.trim().length < 10}
                className="flex-1 min-h-[44px] motion-safe:transition-all motion-safe:duration-150 motion-safe:active:scale-[0.98] disabled:motion-safe:active:scale-100 motion-reduce:transition-none"
                style={{
                  backgroundColor: 'oklch(0.6 0.18 230)',
                  color: 'white',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Continue Anyway'}
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || userAnswer.trim().length < 10}
                className="flex-1 min-h-[44px] motion-safe:transition-all motion-safe:duration-150 motion-safe:active:scale-[0.98] disabled:motion-safe:active:scale-100 motion-reduce:transition-none"
                style={{
                  backgroundColor: 'oklch(0.6 0.18 230)',
                  color: 'white',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

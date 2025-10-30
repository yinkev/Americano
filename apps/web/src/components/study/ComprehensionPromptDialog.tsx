'use client'

import { AlertCircle, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  CalibrationFeedbackData,
  EvaluationResult,
  ResponseEvaluationResponse,
  ValidationPromptData,
} from '@/types/validation'
import { CalibrationFeedbackPanel } from './CalibrationFeedbackPanel'
import { PostAssessmentConfidenceDialog } from './PostAssessmentConfidenceDialog'
import { PreAssessmentConfidenceDialog } from './PreAssessmentConfidenceDialog'
import { ReflectionPromptDialog } from './ReflectionPromptDialog'

interface ComprehensionPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: ValidationPromptData
  objectiveId: string
  sessionId?: string
  onComplete: (response: ResponseEvaluationResponse) => void
  onSkip: () => void
}

const CONFIDENCE_LABELS = [
  'Very Uncertain',
  'Somewhat Uncertain',
  'Neutral',
  'Somewhat Confident',
  'Very Confident',
]

// Workflow states for confidence capture integration (Story 4.4 Task 2.9)
type WorkflowState =
  | 'PRE_ASSESSMENT_CONFIDENCE' // Step 1: Capture initial confidence BEFORE prompt shown
  | 'PROMPT_DISPLAY' // Step 2: Show prompt and allow answering
  | 'POST_ASSESSMENT_CONFIDENCE' // Step 3: Optionally update confidence AFTER prompt visible
  | 'EVALUATION_RESULTS' // Step 4: Show results and calibration
  | 'REFLECTION' // Step 5: Metacognitive reflection

/**
 * ComprehensionPromptDialog
 *
 * Dialog for displaying comprehension prompts and collecting user explanations.
 *
 * **Features** (Story 4.1 + Story 4.4 enhancements):
 * - Pre-assessment confidence capture (Story 4.4 AC#1)
 * - Displays prompt text and objective context
 * - Post-assessment confidence update (Story 4.4 AC#2)
 * - Auto-expanding textarea for explanation (min 200px height)
 * - Guidance tooltip with tips for good explanations
 * - Submit button with loading state
 * - Evaluation results display (score, strengths, gaps, calibration)
 * - Metacognitive reflection prompts (Story 4.4 AC#5)
 * - Retry and skip buttons
 * - Glassmorphism design with OKLCH colors
 *
 * **Workflow Sequence**:
 * 1. PreAssessmentConfidenceDialog (BEFORE prompt details shown)
 * 2. Prompt display with answer input
 * 3. PostAssessmentConfidenceDialog (AFTER prompt, BEFORE submission)
 * 4. Submit response with pre/post confidence data
 * 5. Show evaluation results and calibration feedback
 * 6. Metacognitive reflection prompt
 *
 * @see Story 4.1 Task 5 (Comprehension Prompt Component)
 * @see Story 4.4 Task 2.9 (Confidence Capture Integration)
 * @see Story 4.1 AC#2 (Natural Language Input), AC#5 (Feedback Display), AC#8 (Confidence Calibration)
 * @see Story 4.4 AC#1 (Pre-Assessment Confidence), AC#2 (Post-Assessment Confidence), AC#5 (Reflection)
 */
export function ComprehensionPromptDialog({
  open,
  onOpenChange,
  prompt,
  objectiveId,
  sessionId,
  onComplete,
  onSkip,
}: ComprehensionPromptDialogProps) {
  // Workflow state management
  const [workflowState, setWorkflowState] = useState<WorkflowState>('PRE_ASSESSMENT_CONFIDENCE')

  // User input state
  const [userAnswer, setUserAnswer] = useState('')
  const [confidenceLevel, setConfidenceLevel] = useState(3) // Legacy - for backward compatibility

  // Confidence tracking (Story 4.4)
  const [preAssessmentConfidence, setPreAssessmentConfidence] = useState<number | null>(null)
  const [preConfidenceRationale, setPreConfidenceRationale] = useState<string | undefined>(
    undefined,
  )
  const [postAssessmentConfidence, setPostAssessmentConfidence] = useState<number | null>(null)
  const [postConfidenceRationale, setPostConfidenceRationale] = useState<string | undefined>(
    undefined,
  )

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseId, setResponseId] = useState<string | null>(null)

  // Calibration feedback state (Story 4.4 Task 5.8)
  const [calibrationData, setCalibrationData] = useState<CalibrationFeedbackData | null>(null)

  // Reflection state
  const [showReflection, setShowReflection] = useState(false)
  const [isUpdatingReflection, setIsUpdatingReflection] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        // Reset workflow
        setWorkflowState('PRE_ASSESSMENT_CONFIDENCE')

        // Reset input
        setUserAnswer('')
        setConfidenceLevel(3)

        // Reset confidence tracking
        setPreAssessmentConfidence(null)
        setPreConfidenceRationale(undefined)
        setPostAssessmentConfidence(null)
        setPostConfidenceRationale(undefined)

        // Reset evaluation
        setEvaluation(null)
        setError(null)
        setResponseId(null)

        // Reset calibration data
        setCalibrationData(null)

        // Reset reflection
        setShowReflection(false)
        setIsUpdatingReflection(false)
      }, 300) // Wait for dialog close animation
    } else {
      // Reset to first step when dialog opens
      setWorkflowState('PRE_ASSESSMENT_CONFIDENCE')
    }
  }, [open])

  // Handler: Pre-assessment confidence captured
  const handlePreAssessmentConfidenceCaptured = (confidence: number, rationale?: string) => {
    setPreAssessmentConfidence(confidence)
    setPreConfidenceRationale(rationale)
    setConfidenceLevel(confidence) // Set default for legacy compatibility

    // Move to prompt display
    setWorkflowState('PROMPT_DISPLAY')
  }

  // Handler: "Continue to Submit" button (after seeing prompt and providing answer)
  const handleContinueToPostConfidence = () => {
    if (userAnswer.trim().length < 10) {
      setError('Please provide a more detailed explanation (at least 10 characters)')
      return
    }

    setError(null)
    // Move to post-assessment confidence capture
    setWorkflowState('POST_ASSESSMENT_CONFIDENCE')
  }

  // Handler: Post-assessment confidence captured
  const handlePostAssessmentConfidenceCaptured = (confidence: number, rationale?: string) => {
    setPostAssessmentConfidence(confidence)
    setPostConfidenceRationale(rationale)

    // Proceed to submit
    handleSubmit()
  }

  const handleSubmit = async () => {
    if (userAnswer.trim().length < 10) {
      setError('Please provide a more detailed explanation (at least 10 characters)')
      return
    }

    setIsEvaluating(true)
    setError(null)

    try {
      // Build request body with confidence data (Story 4.4)
      const requestBody: any = {
        promptId: prompt.id,
        sessionId,
        userAnswer,
        objectiveId,
      }

      // Add pre-assessment confidence (REQUIRED per Story 4.4 AC#1)
      if (preAssessmentConfidence) {
        requestBody.preAssessmentConfidence = preAssessmentConfidence
        if (preConfidenceRationale) {
          requestBody.confidenceRationale = preConfidenceRationale
        }
      }

      // Add post-assessment confidence (OPTIONAL per Story 4.4 AC#2)
      if (postAssessmentConfidence) {
        requestBody.postAssessmentConfidence = postAssessmentConfidence
        // If post-rationale provided, append or override
        if (postConfidenceRationale) {
          requestBody.confidenceRationale = postConfidenceRationale
        }
      }

      // Fallback: if no pre/post confidence (backward compatibility),
      // use legacy confidenceLevel
      if (!preAssessmentConfidence && !postAssessmentConfidence) {
        requestBody.confidenceLevel = confidenceLevel
      }

      const response = await fetch('/api/validation/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to evaluate response')
      }

      const data = await response.json()
      setEvaluation(data.data.evaluation)
      setResponseId(data.data.responseId) // Store responseId for reflection update

      // Extract calibration data from API response (Story 4.4 Task 5.8)
      if (data.data.calibration) {
        setCalibrationData({
          delta: data.data.calibration.calibrationDelta,
          category: data.data.calibration.category,
          preConfidence: preAssessmentConfidence || 0,
          postConfidence: postAssessmentConfidence || undefined,
          confidenceNormalized: data.data.calibration.confidenceNormalized,
          score: data.data.evaluation.overall_score,
          feedbackMessage: data.data.calibration.feedbackMessage,
          // Note: trend and trendMessage not yet implemented in API
          // TODO: Add trend calculation in future task
        })
      }

      // Move to evaluation results state
      setWorkflowState('EVALUATION_RESULTS')

      // Note: Don't call onComplete yet - wait for reflection to complete
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate response')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleRetry = () => {
    // Reset to prompt display state (skip pre-confidence, keep existing)
    setUserAnswer('')
    setEvaluation(null)
    setError(null)
    setResponseId(null)
    setWorkflowState('PROMPT_DISPLAY')
  }

  const handleSkip = () => {
    onSkip()
    onOpenChange(false)
  }

  const handleContinueToReflection = () => {
    setShowReflection(true)
  }

  const handleReflectionSubmit = async (reflectionNotes: string) => {
    if (!responseId) {
      console.error('No responseId available for reflection update')
      return
    }

    setIsUpdatingReflection(true)
    try {
      // Update ValidationResponse with reflection notes
      const response = await fetch(`/api/validation/responses/${responseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reflectionNotes,
        }),
      })

      if (!response.ok) {
        console.error('Failed to save reflection notes')
      }

      // Track reflection completion
      // TODO: Add analytics tracking for reflection completion rate
    } catch (err) {
      console.error('Error saving reflection:', err)
    } finally {
      setIsUpdatingReflection(false)
      setShowReflection(false)
      // Now call onComplete after reflection is done
      if (evaluation) {
        onComplete({ evaluation, score: evaluation.overall_score, responseId: responseId! })
      }
      onOpenChange(false)
    }
  }

  const handleReflectionSkip = () => {
    // Track skip event
    // TODO: Add analytics tracking for reflection skip rate
    setShowReflection(false)
    // Call onComplete even if reflection is skipped
    if (evaluation && responseId) {
      onComplete({ evaluation, score: evaluation.overall_score, responseId })
    }
    onOpenChange(false)
  }

  // Determine score color (OKLCH color space)
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'oklch(0.7 0.15 145)' // Green - Proficient
    if (score >= 60) return 'oklch(0.75 0.12 85)' // Yellow - Developing
    return 'oklch(0.65 0.20 25)' // Red - Needs Review
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Proficient'
    if (score >= 60) return 'Developing'
    return 'Needs Review'
  }

  // Render workflow steps conditionally
  return (
    <>
      {/* Step 1: Pre-Assessment Confidence Dialog */}
      <PreAssessmentConfidenceDialog
        open={open && workflowState === 'PRE_ASSESSMENT_CONFIDENCE'}
        onOpenChange={onOpenChange}
        onConfidenceCaptured={handlePreAssessmentConfidenceCaptured}
      />

      {/* Steps 2 & 4: Main Dialog (Prompt Display or Evaluation Results) */}
      <Dialog
        open={
          open && (workflowState === 'PROMPT_DISPLAY' || workflowState === 'EVALUATION_RESULTS')
        }
        onOpenChange={onOpenChange}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200 motion-reduce:animate-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-dm-sans">Explain to a Patient</DialogTitle>
            <DialogDescription className="text-base">
              Demonstrate your understanding by explaining this concept in patient-friendly
              language.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Prompt Text */}
            <div className="p-4 rounded-lg bg-oklch-primary/5 border border-oklch-primary/20">
              <p className="text-base leading-relaxed">{prompt.promptText}</p>
            </div>

            {workflowState === 'PROMPT_DISPLAY' && (
              <>
                {/* Confidence Indicator (Show pre-assessment confidence) */}
                {preAssessmentConfidence && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{
                      background: 'oklch(0.95 0.02 230)',
                      borderLeft: '4px solid',
                      borderColor: 'oklch(0.55 0.2 250)',
                      color: 'oklch(0.4 0.05 250)',
                    }}
                  >
                    <p>
                      <span className="font-semibold">Your initial confidence:</span>{' '}
                      {preAssessmentConfidence}/5 ({CONFIDENCE_LABELS[preAssessmentConfidence - 1]})
                    </p>
                  </div>
                )}

                {/* Explanation Textarea */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="explanation" className="text-base font-medium">
                      Your Explanation
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-11 w-11 p-0"
                            aria-label="Explanation guidance"
                          >
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-2">Good explanations include:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Correct medical terminology</li>
                            <li>Connections between concepts</li>
                            <li>Real-world clinical examples</li>
                            <li>Patient-friendly language</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="explanation"
                    placeholder="Type your explanation here... (minimum 10 characters)"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="min-h-[200px] resize-none"
                    aria-describedby="explanation-hint"
                  />
                  <p id="explanation-hint" className="text-xs text-muted-foreground">
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleContinueToPostConfidence}
                    disabled={userAnswer.trim().length < 10}
                    className="flex-1 min-h-[44px] motion-safe:transition-all motion-safe:duration-150 motion-safe:active:scale-[0.98] disabled:motion-safe:active:scale-100"
                    style={{
                      backgroundColor: 'oklch(0.6 0.18 230)',
                      color: 'white',
                    }}
                  >
                    Continue to Submit
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="min-h-[44px] motion-safe:transition-transform motion-safe:duration-150 motion-safe:active:scale-[0.98]"
                  >
                    Skip
                  </Button>
                </div>
              </>
            )}

            {workflowState === 'EVALUATION_RESULTS' && evaluation && (
              <>
                {/* Evaluation Results */}
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div
                    className="flex flex-col items-center gap-4 p-6 rounded-lg border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 motion-reduce:animate-none"
                    style={{
                      backgroundColor: 'oklch(1 0 0)',
                      borderColor: 'oklch(0.9 0.02 240)',
                    }}
                  >
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="oklch(0.9 0.02 240)"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke={getScoreColor(evaluation.overall_score)}
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(evaluation.overall_score / 100) * 351.86} 351.86`}
                          strokeLinecap="round"
                          className="motion-safe:transition-all motion-safe:duration-[800ms] motion-safe:ease-out"
                          style={{
                            strokeDashoffset: 0,
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-4xl font-bold"
                          style={{ color: getScoreColor(evaluation.overall_score) }}
                        >
                          {Math.round(evaluation.overall_score)}
                        </span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p
                        className="text-lg font-semibold"
                        style={{ color: getScoreColor(evaluation.overall_score) }}
                      >
                        {getScoreLabel(evaluation.overall_score)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Overall Comprehension Score
                      </p>
                    </div>
                  </div>

                  {/* Subscores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-100 motion-reduce:animate-none">
                      <div className="flex justify-between text-sm">
                        <span>Terminology</span>
                        <span className="font-medium">
                          {Math.round(evaluation.terminology_score)}%
                        </span>
                      </div>
                      <Progress
                        value={evaluation.terminology_score}
                        className="h-2 motion-safe:transition-all motion-safe:duration-500"
                      />
                    </div>
                    <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-150 motion-reduce:animate-none">
                      <div className="flex justify-between text-sm">
                        <span>Relationships</span>
                        <span className="font-medium">
                          {Math.round(evaluation.relationships_score)}%
                        </span>
                      </div>
                      <Progress
                        value={evaluation.relationships_score}
                        className="h-2 motion-safe:transition-all motion-safe:duration-500"
                      />
                    </div>
                    <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-200 motion-reduce:animate-none">
                      <div className="flex justify-between text-sm">
                        <span>Application</span>
                        <span className="font-medium">
                          {Math.round(evaluation.application_score)}%
                        </span>
                      </div>
                      <Progress
                        value={evaluation.application_score}
                        className="h-2 motion-safe:transition-all motion-safe:duration-500"
                      />
                    </div>
                    <div className="space-y-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-[250ms] motion-reduce:animate-none">
                      <div className="flex justify-between text-sm">
                        <span>Clarity</span>
                        <span className="font-medium">{Math.round(evaluation.clarity_score)}%</span>
                      </div>
                      <Progress
                        value={evaluation.clarity_score}
                        className="h-2 motion-safe:transition-all motion-safe:duration-500"
                      />
                    </div>
                  </div>

                  {/* Strengths */}
                  {evaluation.strengths.length > 0 && (
                    <div
                      className="p-4 rounded-lg border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-500 motion-reduce:animate-none"
                      style={{
                        backgroundColor: 'oklch(0.95 0.05 145)',
                        borderColor: 'oklch(0.85 0.08 145)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2
                          className="h-5 w-5"
                          style={{ color: 'oklch(0.55 0.18 145)' }}
                        />
                        <h3 className="font-semibold" style={{ color: 'oklch(0.30 0.15 145)' }}>
                          Strengths
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.strengths.map((strength, index) => (
                          <li
                            key={index}
                            className="text-sm flex gap-2"
                            style={{ color: 'oklch(0.35 0.16 145)' }}
                          >
                            <span style={{ color: 'oklch(0.55 0.18 145)' }}>•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {evaluation.gaps.length > 0 && (
                    <div
                      className="p-4 rounded-lg border motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-500 motion-reduce:animate-none"
                      style={{
                        backgroundColor: 'oklch(0.95 0.05 85)',
                        borderColor: 'oklch(0.85 0.08 85)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-5 w-5" style={{ color: 'oklch(0.55 0.18 85)' }} />
                        <h3 className="font-semibold" style={{ color: 'oklch(0.30 0.15 85)' }}>
                          Areas for Improvement
                        </h3>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.gaps.map((gap, index) => (
                          <li
                            key={index}
                            className="text-sm flex gap-2"
                            style={{ color: 'oklch(0.35 0.16 85)' }}
                          >
                            <span style={{ color: 'oklch(0.55 0.18 85)' }}>•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Calibration Feedback Panel (Story 4.4 Task 5.8) */}
                  {calibrationData && (
                    <CalibrationFeedbackPanel
                      calibrationData={calibrationData}
                      onContinue={handleContinueToReflection}
                    />
                  )}

                  {/* Action Buttons - Hidden when CalibrationFeedbackPanel is shown (it has its own Continue button) */}
                  {!calibrationData && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="flex-1 min-h-[44px]"
                      >
                        Try Again
                      </Button>
                      <Button
                        onClick={handleContinueToReflection}
                        className="flex-1 min-h-[44px]"
                        style={{
                          backgroundColor: 'oklch(0.6 0.18 230)',
                          color: 'white',
                        }}
                      >
                        Continue
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Step 3: Post-Assessment Confidence Dialog */}
      <PostAssessmentConfidenceDialog
        open={open && workflowState === 'POST_ASSESSMENT_CONFIDENCE'}
        onOpenChange={onOpenChange}
        preAssessmentConfidence={preAssessmentConfidence || 3}
        onConfidenceCaptured={handlePostAssessmentConfidenceCaptured}
        promptDetails={prompt.promptText}
      />

      {/* Step 5: Reflection Prompt Dialog - shown after calibration feedback */}
      <ReflectionPromptDialog
        open={showReflection}
        onOpenChange={setShowReflection}
        onSubmit={handleReflectionSubmit}
        onSkip={handleReflectionSkip}
      />
    </>
  )
}

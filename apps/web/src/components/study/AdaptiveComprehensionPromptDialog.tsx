'use client'

import { AlertCircle, CheckCircle2, HelpCircle, Info, Loader2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  CalibrationFeedbackData,
  EvaluationResult,
  ResponseEvaluationResponse,
  ValidationPromptData,
} from '@/types/validation'
import { BreakReminderDialog } from './break-reminder-dialog'
import { CalibrationFeedbackPanel } from './CalibrationFeedbackPanel'
import { ComplexitySkillTree } from './ComplexitySkillTree'
import { ConfidenceIntervalDisplay } from './ConfidenceIntervalDisplay'
import { DifficultyIndicator } from './DifficultyIndicator'
import { MasteryBadge } from './MasteryBadge'
import { PostAssessmentConfidenceDialog } from './PostAssessmentConfidenceDialog'
import { PreAssessmentConfidenceDialog } from './PreAssessmentConfidenceDialog'
import { ReflectionPromptDialog } from './ReflectionPromptDialog'

interface AdaptiveComprehensionPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prompt: ValidationPromptData
  objectiveId: string
  sessionId?: string
  onComplete: (response: ResponseEvaluationResponse) => void
  onSkip: () => void
  // Adaptive features
  enableAdaptive?: boolean
  showComplexityTree?: boolean
  currentDifficulty?: number
  nextDifficulty?: number
  irtMetrics?: {
    estimate: number
    confidenceInterval: number
  }
  masteryStatus?: {
    isMastered: boolean
    verifiedAt?: Date
    complexityLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  }
  sessionMetrics?: {
    questionsAnswered: number
    durationMinutes: number
  }
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
 * AdaptiveComprehensionPromptDialog
 *
 * Enhanced version of ComprehensionPromptDialog with adaptive features from Story 4.5.
 * Integrates difficulty indicators, IRT metrics, complexity progression, and break recommendations.
 *
 * **Story 4.5 Adaptive Features:**
 * - DifficultyIndicator: Shows current and next difficulty levels
 * - ConfidenceIntervalDisplay: IRT knowledge estimate with confidence bounds
 * - ComplexitySkillTree: BASIC → INTERMEDIATE → ADVANCED progression
 * - MasteryBadge: Gold star when mastery verified
 * - Break recommendations: After 10+ questions or 30+ minutes
 *
 * **Story 4.4 Confidence Calibration:**
 * - Pre-assessment confidence capture
 * - Post-assessment confidence update
 * - Calibration feedback panel
 * - Metacognitive reflection prompts
 *
 * **Story 4.1 Foundation:**
 * - Natural language comprehension prompts
 * - 4-dimensional AI evaluation
 * - Strengths and gaps feedback
 *
 * @see Story 4.5 Task 11 (UI Integration)
 * @see Story 4.5 AC#2 (Real-Time Difficulty Adjustment)
 * @see Story 4.5 AC#6 (Progressive Complexity Revelation)
 * @see Story 4.5 AC#7 (IRT Assessment Efficiency)
 */
export function AdaptiveComprehensionPromptDialog({
  open,
  onOpenChange,
  prompt,
  objectiveId,
  sessionId,
  onComplete,
  onSkip,
  enableAdaptive = true,
  showComplexityTree = true,
  currentDifficulty = 50,
  nextDifficulty,
  irtMetrics,
  masteryStatus,
  sessionMetrics,
}: AdaptiveComprehensionPromptDialogProps) {
  // Workflow state management
  const [workflowState, setWorkflowState] = useState<WorkflowState>('PRE_ASSESSMENT_CONFIDENCE')

  // User input state
  const [userAnswer, setUserAnswer] = useState('')
  const [confidenceLevel, setConfidenceLevel] = useState(3)

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

  // Calibration feedback state
  const [calibrationData, setCalibrationData] = useState<CalibrationFeedbackData | null>(null)

  // Reflection state
  const [showReflection, setShowReflection] = useState(false)
  const [isUpdatingReflection, setIsUpdatingReflection] = useState(false)

  // Break reminder state (Story 4.5 AC#8)
  const [showBreakReminder, setShowBreakReminder] = useState(false)
  const [breakType, setBreakType] = useState<'short' | 'long'>('short')

  // Check if break is recommended (Story 4.5 AC#8)
  useEffect(() => {
    if (sessionMetrics && enableAdaptive) {
      const shouldRecommendBreak =
        sessionMetrics.questionsAnswered >= 10 || sessionMetrics.durationMinutes >= 30

      if (shouldRecommendBreak && !showBreakReminder) {
        setBreakType(sessionMetrics.durationMinutes >= 30 ? 'long' : 'short')
        // Show break reminder after completing this question
      }
    }
  }, [sessionMetrics, enableAdaptive, showBreakReminder])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setWorkflowState('PRE_ASSESSMENT_CONFIDENCE')
        setUserAnswer('')
        setConfidenceLevel(3)
        setPreAssessmentConfidence(null)
        setPreConfidenceRationale(undefined)
        setPostAssessmentConfidence(null)
        setPostConfidenceRationale(undefined)
        setEvaluation(null)
        setError(null)
        setResponseId(null)
        setCalibrationData(null)
        setShowReflection(false)
        setIsUpdatingReflection(false)
      }, 300)
    } else {
      setWorkflowState('PRE_ASSESSMENT_CONFIDENCE')
    }
  }, [open])

  // Handler: Pre-assessment confidence captured
  const handlePreAssessmentConfidenceCaptured = (confidence: number, rationale?: string) => {
    setPreAssessmentConfidence(confidence)
    setPreConfidenceRationale(rationale)
    setConfidenceLevel(confidence)
    setWorkflowState('PROMPT_DISPLAY')
  }

  // Handler: Continue to post-confidence
  const handleContinueToPostConfidence = () => {
    if (userAnswer.trim().length < 10) {
      setError('Please provide a more detailed explanation (at least 10 characters)')
      return
    }
    setError(null)
    setWorkflowState('POST_ASSESSMENT_CONFIDENCE')
  }

  // Handler: Post-assessment confidence captured
  const handlePostAssessmentConfidenceCaptured = (confidence: number, rationale?: string) => {
    setPostAssessmentConfidence(confidence)
    setPostConfidenceRationale(rationale)
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
      const requestBody: any = {
        promptId: prompt.id,
        sessionId,
        userAnswer,
        objectiveId,
      }

      if (preAssessmentConfidence) {
        requestBody.preAssessmentConfidence = preAssessmentConfidence
        if (preConfidenceRationale) {
          requestBody.confidenceRationale = preConfidenceRationale
        }
      }

      if (postAssessmentConfidence) {
        requestBody.postAssessmentConfidence = postAssessmentConfidence
        if (postConfidenceRationale) {
          requestBody.confidenceRationale = postConfidenceRationale
        }
      }

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
      setResponseId(data.data.responseId)

      if (data.data.calibration) {
        setCalibrationData({
          delta: data.data.calibration.calibrationDelta,
          category: data.data.calibration.category,
          preConfidence: preAssessmentConfidence || 0,
          postConfidence: postAssessmentConfidence || undefined,
          confidenceNormalized: data.data.calibration.confidenceNormalized,
          score: data.data.evaluation.overall_score,
          feedbackMessage: data.data.calibration.feedbackMessage,
        })
      }

      setWorkflowState('EVALUATION_RESULTS')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate response')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleRetry = () => {
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
    // Check if break is recommended before reflection
    if (sessionMetrics && enableAdaptive) {
      const shouldRecommendBreak =
        sessionMetrics.questionsAnswered >= 10 || sessionMetrics.durationMinutes >= 30

      if (shouldRecommendBreak) {
        setShowBreakReminder(true)
        return
      }
    }

    setShowReflection(true)
  }

  const handleReflectionSubmit = async (reflectionNotes: string) => {
    if (!responseId) {
      console.error('No responseId available for reflection update')
      return
    }

    setIsUpdatingReflection(true)
    try {
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
    } catch (err) {
      console.error('Error saving reflection:', err)
    } finally {
      setIsUpdatingReflection(false)
      setShowReflection(false)
      if (evaluation) {
        onComplete({ evaluation, score: evaluation.overall_score, responseId: responseId! })
      }
      onOpenChange(false)
    }
  }

  const handleReflectionSkip = () => {
    setShowReflection(false)
    if (evaluation && responseId) {
      onComplete({ evaluation, score: evaluation.overall_score, responseId })
    }
    onOpenChange(false)
  }

  const handleTakeBreak = () => {
    setShowBreakReminder(false)
    setShowReflection(true)
  }

  const handleSkipBreak = () => {
    setShowBreakReminder(false)
    setShowReflection(true)
  }

  // Determine score color (OKLCH color space)
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'oklch(0.7 0.15 145)' // Green
    if (score >= 60) return 'oklch(0.75 0.12 85)' // Yellow
    return 'oklch(0.65 0.20 25)' // Red
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Proficient'
    if (score >= 60) return 'Developing'
    return 'Needs Review'
  }

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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-dm-sans">Explain to a Patient</DialogTitle>
                <DialogDescription className="text-base">
                  Demonstrate your understanding by explaining this concept in patient-friendly
                  language.
                </DialogDescription>
              </div>

              {/* Story 4.5: Adaptive indicators in header */}
              {enableAdaptive && (
                <div className="flex items-center gap-3">
                  <DifficultyIndicator currentDifficulty={currentDifficulty} size="sm" />
                  {masteryStatus?.isMastered &&
                    masteryStatus.verifiedAt &&
                    masteryStatus.complexityLevel && (
                      <MasteryBadge
                        verifiedAt={masteryStatus.verifiedAt}
                        complexityLevel={masteryStatus.complexityLevel}
                        size="sm"
                      />
                    )}
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Story 4.5: Adaptive metrics banner */}
            {enableAdaptive && workflowState === 'PROMPT_DISPLAY' && (
              <div
                className="p-3 rounded-lg flex items-center gap-4"
                style={{
                  backgroundColor: 'oklch(0.95 0.02 230)',
                  borderLeft: '4px solid oklch(0.6 0.18 230)',
                }}
              >
                <Info className="h-5 w-5" style={{ color: 'oklch(0.6 0.18 230)' }} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Adaptive Assessment Active</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Current difficulty: {currentDifficulty}/100</span>
                    {nextDifficulty && <span>Next: {nextDifficulty}/100</span>}
                    {irtMetrics && (
                      <span>
                        Knowledge estimate: {Math.round(irtMetrics.estimate)}±
                        {Math.round(irtMetrics.confidenceInterval)}
                      </span>
                    )}
                  </div>
                </div>
                {irtMetrics && (
                  <ConfidenceIntervalDisplay
                    estimate={irtMetrics.estimate}
                    confidenceInterval={irtMetrics.confidenceInterval}
                    size="sm"
                  />
                )}
              </div>
            )}

            {/* Prompt Text */}
            <div className="p-4 rounded-lg bg-oklch-primary/5 border border-oklch-primary/20">
              <p className="text-base leading-relaxed">{prompt.promptText}</p>
            </div>

            {workflowState === 'PROMPT_DISPLAY' && (
              <>
                {/* Confidence Indicator */}
                {preAssessmentConfidence && (
                  <div
                    className="p-3 rounded-lg text-sm"
                    style={{
                      background: 'oklch(0.95 0.02 230)',
                      borderLeft: '4px solid oklch(0.55 0.2 250)',
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
                    disabled={userAnswer.trim().length < 10 || isEvaluating}
                    className="flex-1 min-h-[44px]"
                    style={{
                      backgroundColor: 'oklch(0.6 0.18 230)',
                      color: 'white',
                    }}
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Evaluating...
                      </>
                    ) : (
                      'Continue to Submit'
                    )}
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="min-h-[44px]">
                    Skip
                  </Button>
                </div>
              </>
            )}

            {workflowState === 'EVALUATION_RESULTS' && evaluation && (
              <>
                {/* Story 4.5: Tabbed view for results + complexity tree */}
                <Tabs defaultValue="results" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="results">Results & Feedback</TabsTrigger>
                    {enableAdaptive && showComplexityTree && (
                      <TabsTrigger value="progression">Complexity Progression</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value="results" className="space-y-6 mt-6">
                    {/* Overall Score */}
                    <div
                      className="flex flex-col items-center gap-4 p-6 rounded-lg border"
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
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Terminology</span>
                          <span className="font-medium">
                            {Math.round(evaluation.terminology_score)}%
                          </span>
                        </div>
                        <Progress value={evaluation.terminology_score} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Relationships</span>
                          <span className="font-medium">
                            {Math.round(evaluation.relationships_score)}%
                          </span>
                        </div>
                        <Progress value={evaluation.relationships_score} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Application</span>
                          <span className="font-medium">
                            {Math.round(evaluation.application_score)}%
                          </span>
                        </div>
                        <Progress value={evaluation.application_score} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Clarity</span>
                          <span className="font-medium">
                            {Math.round(evaluation.clarity_score)}%
                          </span>
                        </div>
                        <Progress value={evaluation.clarity_score} className="h-2" />
                      </div>
                    </div>

                    {/* Strengths */}
                    {evaluation.strengths.length > 0 && (
                      <div
                        className="p-4 rounded-lg border"
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
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: 'oklch(0.95 0.05 85)',
                          borderColor: 'oklch(0.85 0.08 85)',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle
                            className="h-5 w-5"
                            style={{ color: 'oklch(0.55 0.18 85)' }}
                          />
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

                    {/* Calibration Feedback Panel */}
                    {calibrationData && (
                      <CalibrationFeedbackPanel
                        calibrationData={calibrationData}
                        onContinue={handleContinueToReflection}
                      />
                    )}

                    {/* Action Buttons */}
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
                  </TabsContent>

                  {/* Story 4.5: Complexity Progression Tab */}
                  {enableAdaptive && showComplexityTree && (
                    <TabsContent value="progression" className="mt-6">
                      <ComplexitySkillTree
                        userId="kevy@americano.dev" // TODO: Get from auth
                        conceptId={objectiveId}
                      />
                    </TabsContent>
                  )}
                </Tabs>
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

      {/* Story 4.5: Break Reminder Dialog */}
      {enableAdaptive && (
        <BreakReminderDialog
          open={showBreakReminder}
          isLongBreak={breakType === 'long'}
          breakMinutes={breakType === 'long' ? 15 : 5}
          onTakeBreak={handleTakeBreak}
          onSkipBreak={handleSkipBreak}
        />
      )}

      {/* Step 5: Reflection Prompt Dialog */}
      <ReflectionPromptDialog
        open={showReflection}
        onOpenChange={setShowReflection}
        onSubmit={handleReflectionSubmit}
        onSkip={handleReflectionSkip}
      />
    </>
  )
}

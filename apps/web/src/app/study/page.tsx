'use client'

import { CheckCircle, ChevronLeft, Menu, Pause, Play, Settings, Square } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AdaptiveAssessmentInterface } from '@/components/study/AdaptiveAssessmentInterface'
import { BreakReminderDialog } from '@/components/study/break-reminder-dialog'
import { ChallengeModeDialog } from '@/components/study/ChallengeModeDialog'
import { ClinicalCaseDialog } from '@/components/study/ClinicalCaseDialog'
import { ClinicalFeedbackPanel } from '@/components/study/ClinicalFeedbackPanel'
import { ComprehensionPromptDialog } from '@/components/study/ComprehensionPromptDialog'
import { type FlashCard, FlashcardReview } from '@/components/study/flashcard-review'
import { MissionProgressHeader } from '@/components/study/mission-progress-header'
import { ObjectiveCompletionDialog } from '@/components/study/objective-completion-dialog'
import { ObjectiveContentPanel } from '@/components/study/objective-content-panel'
import { ObjectiveTimer } from '@/components/study/objective-timer'
import { ObjectiveTransition } from '@/components/study/objective-transition'
import { PomodoroTimer } from '@/components/study/pomodoro-timer'
import { SessionResumeDialog } from '@/components/study/session-resume-dialog'
import { SessionSettingsPanel } from '@/components/study/session-settings-panel'
import { SessionTimer } from '@/components/study/session-timer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useStudySession } from '@/hooks/use-study-session'
import { useSessionStore } from '@/store/use-session-store'
import { useUserStore } from '@/store/use-user-store'
import type { ResponseEvaluationResponse, ValidationPromptData } from '@/types/validation'

interface LearningObjective {
  id: string
  objective: string
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  masteryLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  pageStart?: number
  pageEnd?: number
  isHighYield: boolean
  boardExamTags: string[]
  lecture: {
    id: string
    title: string
    courseId: string
    course: {
      name: string
    }
  }
}

interface MissionObjective {
  objectiveId: string
  objective?: LearningObjective
  estimatedMinutes: number
  completed: boolean
}

interface Mission {
  id: string
  date: Date
  objectives: MissionObjective[]
  completedObjectivesCount: number
  estimatedMinutes: number
}

type StudyPhase = 'content' | 'comprehension' | 'cards' | 'assessment' | 'adaptive'

export default function StudyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const missionId = searchParams.get('missionId')

  const {
    sessionId,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    pausedAt,
    getPausedDuration,
    userEmail: sessionUserEmail,
    clearSession,
    currentObjective: storeCurrentObjective,
    missionProgress: storeMissionProgress,
    setCurrentObjective,
    setMissionProgress,
    startObjectiveTimer,
    getObjectiveElapsed,
    sessionSnapshot,
    captureSessionSnapshot,
    clearSessionSnapshot,
    hasSessionTimeout,
    settings,
    updateSettings,
    resetSettings,
    objectivesCompletedSinceScenario: storeObjectivesCompletedSinceScenario,
    incrementObjectivesCompleted,
    resetScenarioCounter,
    setAdaptiveSessionId: storeSetAdaptiveSessionId,
    setAdaptiveMetrics: storeSetAdaptiveMetrics,
    clearAdaptiveMetrics: storeClearAdaptiveMetrics,
  } = useSessionStore()
  const { userEmail } = useUserStore()

  // Wave 2: Study session hook for enhanced timer and state management
  const studySessionHook = useStudySession()

  // Real-time orchestration (Story 5.3)
  const studyOrchestration = useStudyOrchestration({
    enabled: true,
    autoRecord: true,
    sensitivity: settings.orchestrationSensitivity,
  })

  const [isStarting, setIsStarting] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [mission, setMission] = useState<Mission | null>(null)
  const [loadingMission, setLoadingMission] = useState(false)
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(0)
  const [studyPhase, setStudyPhase] = useState<StudyPhase>('content')
  const [cards, setCards] = useState<FlashCard[]>([])
  const [loadingCards, setLoadingCards] = useState(false)
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [objectiveStartTime, setObjectiveStartTime] = useState<Date | null>(null)
  const [showTransition, setShowTransition] = useState(false)
  const [transitionData, setTransitionData] = useState<{
    completedObjective: LearningObjective
    nextObjective: MissionObjective
  } | null>(null)
  const [previousObjectiveIndex, setPreviousObjectiveIndex] = useState<number | null>(null)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [showBreakDialog, setShowBreakDialog] = useState(false)
  const [isLongBreak, setIsLongBreak] = useState(false)
  const [objectivesCompletedCount, setObjectivesCompletedCount] = useState(0)
  const contentPanelRef = useRef<HTMLDivElement>(null)
  const isAdvancingRef = useRef(false)

  // Orchestration dialog state
  const [showIntelligentBreak, setShowIntelligentBreak] = useState(false)
  const [showContentAdaptation, setShowContentAdaptation] = useState(false)
  const [showSessionRecommendation, setShowSessionRecommendation] = useState(false)

  // Cognitive load monitoring (Story 5.4)
  const [showCognitiveLoad, setShowCognitiveLoad] = useState(true)

  // Use Zustand store for objectives completed since scenario (Story 4.2 Task 7)
  const objectivesCompletedSinceScenario = storeObjectivesCompletedSinceScenario

  // Story 4.1 Task 6: Comprehension prompt state
  const [showComprehensionPrompt, setShowComprehensionPrompt] = useState(false)
  const [comprehensionPrompt, setComprehensionPrompt] = useState<ValidationPromptData | null>(null)
  const [loadingComprehensionPrompt, setLoadingComprehensionPrompt] = useState(false)
  const [comprehensionStartTime, setComprehensionStartTime] = useState<number | null>(null)
  const [comprehensionScore, setComprehensionScore] = useState<number | null>(null)

  // Story 4.4 Task 10: Confidence calibration workflow time tracking
  // Note: ComprehensionPromptDialog manages full workflow internally (pre-confidence, prompt, post-confidence, evaluation, reflection)
  const [calibrationWorkflowStartTime, setCalibrationWorkflowStartTime] = useState<number | null>(
    null,
  )

  // Story 4.2 Task 7: Clinical scenario state
  const [showClinicalScenario, setShowClinicalScenario] = useState(false)
  const [clinicalScenario, setClinicalScenario] = useState<any>(null)
  const [clinicalEvaluation, setClinicalEvaluation] = useState<any>(null)
  const [loadingClinicalScenario, setLoadingClinicalScenario] = useState(false)
  const [clinicalStartTime, setClinicalStartTime] = useState<number>(0)
  const [clinicalScenarioScore, setClinicalScenarioScore] = useState<number | null>(null)
  const [clinicalScenarioTimeSpent, setClinicalScenarioTimeSpent] = useState<number | null>(null)

  // Story 4.3 Task 10: Challenge Mode state
  const [showChallengeMode, setShowChallengeMode] = useState(false)
  const [challengeData, setChallengeData] = useState<any>(null)
  const [loadingChallenge, setLoadingChallenge] = useState(false)
  const [challengeScore, setChallengeScore] = useState<number | null>(null)
  const [challengeType, setChallengeType] = useState<string | null>(null)

  // Story 4.5 Task 12: Adaptive Assessment state
  const [showAdaptiveAssessment, setShowAdaptiveAssessment] = useState(false)
  const [adaptiveSessionId, setAdaptiveSessionId] = useState<string | null>(null)
  const [adaptiveStartTime, setAdaptiveStartTime] = useState<number | null>(null)
  const [adaptiveScore, setAdaptiveScore] = useState<number | null>(null)
  const [adaptiveQuestionsAsked, setAdaptiveQuestionsAsked] = useState<number>(0)
  const [adaptiveEfficiency, setAdaptiveEfficiency] = useState<number | null>(null)
  const [comprehensionFailureCount, setComprehensionFailureCount] = useState<number>(0)

  // Enhanced interruption recovery (Wave 2 + existing)
  useEffect(() => {
    const performRecovery = async () => {
      setIsRecovering(true)

      try {
        // Check Wave 2 session recovery
        if (studySessionHook.canRecover) {
          toast.info('Recovering previous study session...', { duration: 2000 })
          // Wave 2 hook handles recovery automatically
        }

        // Check existing session snapshot recovery (Story 2.5 Task 9)
        if (sessionSnapshot && sessionId && !pausedAt) {
          const timeout = hasSessionTimeout()
          setShowResumeDialog(true)
        }
      } catch (error) {
        console.error('Recovery error:', error)
        toast.error('Failed to recover session - starting fresh')
      } finally {
        setIsRecovering(false)
      }
    }

    performRecovery()
  }, [])

  // Fetch mission if missionId is provided
  useEffect(() => {
    const fetchMission = async () => {
      if (!missionId) return

      setLoadingMission(true)
      try {
        const response = await fetch(`/api/learning/mission/${missionId}`, {
          headers: { 'X-User-Email': userEmail },
        })

        if (response.ok) {
          const data = await response.json()
          setMission(data.data.mission)
        }
      } catch (error) {
        console.error('Failed to fetch mission:', error)
      } finally {
        setLoadingMission(false)
      }
    }

    fetchMission()
  }, [missionId, userEmail])

  // Auto-complete session on user switch
  useEffect(() => {
    const autoCompleteOnUserSwitch = async () => {
      if (sessionId && sessionUserEmail && sessionUserEmail !== userEmail) {
        try {
          const pausedDurationMs = getPausedDuration()
          await fetch(`/api/learning/sessions/${sessionId}/complete`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Email': sessionUserEmail,
            },
            body: JSON.stringify({ pausedDurationMs }),
          })
          clearSession()
          toast.success(`Previous session saved for ${sessionUserEmail.split('@')[0]}`)
        } catch (error) {
          console.error('Failed to auto-complete session on user switch:', error)
          clearSession()
          toast.info('Session cleared - switched to different user')
        }
      }
    }

    autoCompleteOnUserSwitch()
  }, [userEmail, sessionId, sessionUserEmail, clearSession, getPausedDuration])

  // Load cards for current objective
  const loadCardsForObjective = async (objectiveId: string) => {
    setLoadingCards(true)
    try {
      // TODO: Replace with actual card loading API
      // For MVP, we'll show empty cards array
      setCards([])
    } catch (error) {
      console.error('Failed to load cards:', error)
    } finally {
      setLoadingCards(false)
    }
  }

  // Start objective timer when entering content phase
  useEffect(() => {
    if (studyPhase === 'content' && sessionId && mission) {
      const startTime = new Date()
      setObjectiveStartTime(startTime)
      startObjectiveTimer()

      // Record phase change with orchestration (Story 5.3)
      studyOrchestration.recordPhaseChange(studyPhase)
    }
  }, [studyPhase, sessionId, mission, startObjectiveTimer, studyOrchestration])

  const isPaused = !!pausedAt
  const isActive = !!sessionId && !isPaused
  const currentObjective = mission?.objectives[currentObjectiveIndex]

  const handleStartSession = async () => {
    setIsStarting(true)
    try {
      const response = await fetch('/api/learning/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        body: JSON.stringify({ missionId: missionId || undefined }),
      })

      if (!response.ok) {
        throw new Error('Failed to start session')
      }

      const data = await response.json()
      const newSessionId = data.data.session.id

      // Update Zustand store
      startSession(newSessionId, userEmail, missionId || undefined)

      if (mission && data.data.currentObjective) {
        setCurrentObjective(data.data.currentObjective)
        setMissionProgress(data.data.missionProgress)
        setCurrentObjectiveIndex(0)
        setStudyPhase('content')

        // Load cards for first objective
        if (currentObjective) {
          await loadCardsForObjective(currentObjective.objectiveId)
        }
      }

      toast.success(missionId ? 'Study session started for mission!' : 'Study session started!')
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session')
    } finally {
      setIsStarting(false)
    }
  }

  const handlePauseSession = async () => {
    if (!sessionId) return

    try {
      // Capture session snapshot with current state (Story 2.5 Task 9)
      const scrollPosition = contentPanelRef.current?.scrollTop || 0
      captureSessionSnapshot({
        currentObjectiveIndex,
        studyPhase,
        contentScrollPosition: scrollPosition,
        cardQueuePosition: 0, // TODO: Get from card review component
      })

      const response = await fetch(`/api/learning/sessions/${sessionId}/pause`, {
        method: 'PATCH',
        headers: {
          'X-User-Email': userEmail,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to pause session')
      }

      pauseSession()
      toast.info('Session paused - your progress is saved')
    } catch (error) {
      console.error('Error pausing session:', error)
      toast.error('Failed to pause session')
    }
  }

  const handleResumeSession = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/learning/sessions/${sessionId}/resume`, {
        method: 'PATCH',
        headers: {
          'X-User-Email': userEmail,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to resume session')
      }

      resumeSession()

      // Restore snapshot state (Story 2.5 Task 9)
      if (sessionSnapshot) {
        setCurrentObjectiveIndex(sessionSnapshot.currentObjectiveIndex)
        setStudyPhase(sessionSnapshot.studyPhase)

        // Restore scroll position
        setTimeout(() => {
          if (contentPanelRef.current && sessionSnapshot.contentScrollPosition > 0) {
            contentPanelRef.current.scrollTop = sessionSnapshot.contentScrollPosition
          }
        }, 100)

        clearSessionSnapshot()
      }

      toast.success('Session resumed - picking up where you left off')
    } catch (error) {
      console.error('Error resuming session:', error)
      toast.error('Failed to resume session')
    }
  }

  // Handle resume from dialog (Story 2.5 Task 9)
  const handleResumeFromDialog = async () => {
    setShowResumeDialog(false)
    await handleResumeSession()
  }

  // Handle start fresh from dialog (Story 2.5 Task 9)
  const handleStartFresh = async () => {
    setShowResumeDialog(false)
    clearSessionSnapshot()
    setCurrentObjectiveIndex(0)
    setStudyPhase('content')
    toast.info('Starting fresh session')
  }

  const handleCompleteSession = async () => {
    if (!sessionId) return

    setIsCompleting(true)
    try {
      const pausedDurationMs = getPausedDuration()
      const response = await fetch(`/api/learning/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': userEmail,
        },
        body: JSON.stringify({ pausedDurationMs }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete session')
      }

      const data = await response.json()
      const completedSessionId = data.data.session.id

      completeSession()
      toast.success('Session completed!')
      router.push(`/study/sessions/${completedSessionId}`)
    } catch (error) {
      console.error('Error completing session:', error)
      toast.error('Failed to complete session')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleContentPhaseComplete = async () => {
    // Story 4.1 Task 6.2: Check if comprehension validation is needed
    if (!currentObjective) return

    try {
      // Check 7-day validation cache (Story 4.1 Task 6.3)
      const checkResponse = await fetch(
        `/api/validation/prompts/check?objectiveId=${currentObjective.objectiveId}&userId=${userEmail}`,
      )

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()

        if (checkData.data.needsValidation) {
          // Generate and show comprehension prompt (Story 4.1 Task 6.4)
          setLoadingComprehensionPrompt(true)

          const promptResponse = await fetch('/api/validation/prompts/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              objectiveId: currentObjective.objectiveId,
              sessionId,
            }),
          })

          if (promptResponse.ok) {
            const promptData = await promptResponse.json()
            setComprehensionPrompt(promptData.data.prompt)
            setComprehensionStartTime(Date.now()) // Story 4.1 Task 6.5: Start time tracking

            // Story 4.4 Task 10.1: Start calibration workflow time tracking
            setCalibrationWorkflowStartTime(Date.now())

            // Story 4.4 Task 10.2: ComprehensionPromptDialog now handles full workflow internally
            // (pre-confidence, prompt, post-confidence, evaluation, reflection)
            setStudyPhase('comprehension')
            setShowComprehensionPrompt(true)
            setLoadingComprehensionPrompt(false)
            return // Exit early, ComprehensionPromptDialog manages workflow
          } else {
            console.error('Failed to generate comprehension prompt')
            setLoadingComprehensionPrompt(false)
          }
        } else {
          // Recent validation exists, skip comprehension prompt
          toast.info('Comprehension validated recently - skipping prompt')
        }
      }
    } catch (error) {
      console.error('Error checking/generating comprehension prompt:', error)
      setLoadingComprehensionPrompt(false)
    }

    // Story 4.2 Task 7: Check if clinical scenario should be triggered
    if (currentObjective.objective) {
      const masteryLevel = currentObjective.objective.masteryLevel || 'BASIC'

      // Only trigger for INTERMEDIATE+ mastery level (AC#6)
      if (masteryLevel === 'INTERMEDIATE' || masteryLevel === 'ADVANCED') {
        // Check if we've completed 3-4 objectives since last scenario (Story 4.2 Task 7.3)
        if (objectivesCompletedSinceScenario >= 3) {
          try {
            // Check last scenario attempt date (14-day cooldown) (Story 4.2 Task 7.4)
            const checkRecentResponse = await fetch(
              `/api/validation/scenarios/check-recent?objectiveId=${currentObjective.objectiveId}`,
            )

            if (checkRecentResponse.ok) {
              const checkRecentData = await checkRecentResponse.json()
              const hasRecent = checkRecentData.data?.hasRecent || false

              // Trigger scenario if NO recent attempt (14-day cooldown) (Story 4.2 Task 7.5)
              if (!hasRecent) {
                await handleGenerateClinicalScenario(currentObjective.objectiveId)
                return // Pause session for scenario
              } else {
                toast.info('Clinical scenario attempted recently - skipping to avoid fatigue')
              }
            }
          } catch (error) {
            console.error('Error checking last scenario attempt:', error)
          }
        }
      }
    }

    // Move to cards phase or assessment (existing logic)
    if (cards.length > 0) {
      setStudyPhase('cards')
      studyOrchestration.recordPhaseChange('cards')
    } else {
      // No cards, skip to assessment
      setStudyPhase('assessment')
      studyOrchestration.recordPhaseChange('assessment')
      setShowCompletionDialog(true)
    }
  }

  const handleCardReview = async (
    cardId: string,
    rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
    timeSpentMs: number,
  ) => {
    // Record card review with orchestration (Story 5.3)
    const isCorrect = rating === 'GOOD' || rating === 'EASY'
    studyOrchestration.recordAnswer(
      isCorrect,
      timeSpentMs,
      rating === 'EASY' ? 5 : rating === 'GOOD' ? 4 : rating === 'HARD' ? 3 : 2,
    )

    // TODO: Implement FSRS update
    console.log('Card reviewed:', { cardId, rating, timeSpentMs })
  }

  const handleCardsComplete = () => {
    // Move to assessment phase
    setStudyPhase('assessment')
    setShowCompletionDialog(true)
  }

  // Story 4.1 Task 6: Comprehension prompt handlers
  const handleComprehensionComplete = async (response: ResponseEvaluationResponse) => {
    // Story 4.1 Task 6.5: Track time spent on comprehension prompt
    if (comprehensionStartTime) {
      const timeSpentMs = Date.now() - comprehensionStartTime
      console.log('Comprehension prompt time spent:', timeSpentMs, 'ms')
      // TODO: Add to session duration via API
    }

    // Story 4.4 Task 10.6: Track total calibration workflow time
    if (calibrationWorkflowStartTime) {
      const workflowTimeMs = Date.now() - calibrationWorkflowStartTime
      console.log('Calibration workflow time:', workflowTimeMs, 'ms')
      // TODO: Add calibration workflow metrics to session summary
    }

    // Store score for mission completion check (Story 4.1 Task 6.6)
    setComprehensionScore(response.score)
    setShowComprehensionPrompt(false)

    // Story 4.5 Task 12.1: Detect if adaptive assessment should trigger
    // Trigger: 3+ failed comprehension attempts (score < 60%)
    if (response.score < 60) {
      const newFailureCount = comprehensionFailureCount + 1
      setComprehensionFailureCount(newFailureCount)

      if (newFailureCount >= 3) {
        // Trigger adaptive assessment (AC#1: initial difficulty calibration)
        toast.info('Adaptive assessment recommended to identify knowledge gaps')
        await handleStartAdaptiveAssessment()
        return // Adaptive assessment takes over the flow
      } else {
        toast.warning(
          `Comprehension score below 60% (${newFailureCount}/3 attempts) - consider reviewing material`,
        )
      }
    } else {
      // Success - reset failure counter
      setComprehensionFailureCount(0)
    }

    // Story 4.4 Task 10: ComprehensionPromptDialog now handles full workflow internally
    // (pre-confidence, prompt, post-confidence, evaluation, reflection)
    // When onComplete is called, all workflow steps are complete
    // Move to next phase
    if (cards.length > 0) {
      setStudyPhase('cards')
    } else {
      setStudyPhase('assessment')
      setShowCompletionDialog(true)
    }
  }

  const handleComprehensionSkip = async () => {
    // Story 4.1 Task 6.5: Track time spent on comprehension prompt (even if skipped)
    if (comprehensionStartTime) {
      const timeSpentMs = Date.now() - comprehensionStartTime
      console.log('Comprehension prompt skipped after:', timeSpentMs, 'ms')
    }

    // Record skip (score = null for skipped)
    setComprehensionScore(null)
    setShowComprehensionPrompt(false)
    toast.info('Comprehension prompt skipped - marked for future review')

    // Move to next phase
    if (cards.length > 0) {
      setStudyPhase('cards')
    } else {
      setStudyPhase('assessment')
      setShowCompletionDialog(true)
    }
  }

  // Story 4.2 Task 7: Clinical scenario generation handler
  const handleGenerateClinicalScenario = async (objectiveId: string) => {
    setLoadingClinicalScenario(true)
    try {
      const response = await fetch('/api/validation/scenarios/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectiveId }),
      })

      if (!response.ok) throw new Error('Failed to generate scenario')

      const data = await response.json()
      setClinicalScenario(data.data.scenario)
      setClinicalStartTime(Date.now())
      setShowClinicalScenario(true)
    } catch (error) {
      console.error('Failed to generate clinical scenario:', error)
      toast.error('Failed to generate clinical scenario')
    } finally {
      setLoadingClinicalScenario(false)
    }
  }

  // Story 4.2 Task 7: Clinical scenario submission handler
  const handleClinicalScenarioSubmit = async (choices: Record<string, any>, reasoning: string) => {
    if (!clinicalScenario) return

    const timeSpent = Math.floor((Date.now() - clinicalStartTime) / 1000)

    try {
      const response = await fetch('/api/validation/scenarios/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: clinicalScenario.id,
          sessionId: sessionId || undefined,
          userChoices: choices,
          userReasoning: reasoning,
          timeSpent,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit scenario')

      const data = await response.json()
      const evaluation = data.data.evaluation
      setClinicalEvaluation(evaluation)

      // Store score and time for session summary (Story 4.2 Task 7.6, 7.7)
      setClinicalScenarioScore(evaluation.score || evaluation.overallScore || 0)
      setClinicalScenarioTimeSpent(timeSpent)

      // Reset counter after scenario completion (Story 4.2 Task 7.6)
      resetScenarioCounter()
      toast.success('Clinical scenario completed! 🏥')
    } catch (error) {
      console.error('Failed to evaluate scenario:', error)
      toast.error('Failed to evaluate scenario')
    }
  }

  // Story 4.3 Task 10: Check if challenge mode should be triggered
  // Timing: After 2-3 objectives completed (optimal for memory encoding) (AC#8)
  // Frequency: Max 1 challenge per session (avoid fatigue)
  const checkForChallengeMode = async () => {
    // Check if challenge already shown this session
    if (challengeData || showChallengeMode) {
      return false // Already shown, skip
    }

    // Check if 2-3 objectives have been completed
    const objectivesCompleted = storeMissionProgress?.completed || 0
    if (objectivesCompleted < 2 || objectivesCompleted > 3) {
      return false // Not optimal timing
    }

    // Fetch next challenge from API
    try {
      setLoadingChallenge(true)
      const response = await fetch(`/api/validation/challenges/next?userId=${userEmail}`)

      if (!response.ok) {
        console.error('Failed to fetch challenge')
        return false
      }

      const result = await response.json()

      if (result.data && result.data.challenge) {
        setChallengeData({
          challenge: result.data.challenge,
          vulnerabilityType: result.data.vulnerabilityType,
          retryInfo: result.data.retryInfo,
        })
        setChallengeType(result.data.vulnerabilityType)
        setShowChallengeMode(true)
        return true // Challenge shown
      }

      return false // No challenge available
    } catch (error) {
      console.error('Error checking for challenge mode:', error)
      return false
    } finally {
      setLoadingChallenge(false)
    }
  }

  // Story 4.3 Task 10: Handle challenge mode completion
  const handleChallengeComplete = async (response: {
    userAnswer: string
    confidenceLevel: number
    emotionTag?: string
    personalNotes?: string
    isCorrect: boolean
  }) => {
    // Store score for session summary (Task 10.6)
    // In full implementation, this would call /api/validation/challenges/submit
    // For now, we'll track basic completion
    const score = response.isCorrect ? 85 : 45 // Simulated score
    setChallengeScore(score)

    // Growth mindset messaging (AC#8)
    if (response.isCorrect && challengeType === 'RETRY') {
      toast.success(
        '🎉 You mastered a concept you previously struggled with! Growth mindset in action!',
      )
    } else if (response.isCorrect) {
      toast.success("✨ Challenge conquered! You're getting stronger!")
    } else {
      toast.info(
        "💪 This is where learning happens! You'll see this concept again to reinforce it.",
      )
    }

    setShowChallengeMode(false)
  }

  // Story 4.3 Task 10: Handle challenge mode skip
  const handleChallengeSkip = () => {
    // Track as skipped (not penalty) (AC#2)
    toast.info("Challenge skipped - no penalty! You can tackle it when you're ready.")
    setChallengeType(null)
    setShowChallengeMode(false)
  }

  // Story 4.5 Task 12: Adaptive Assessment Handlers

  /**
   * Start adaptive assessment session
   *
   * AC#1: Initial Difficulty Calibration
   * - Calculates initial difficulty from last 10 assessments
   * - Considers confidence calibration accuracy
   * - Starts at baseline ± 10 points
   *
   * Task 12.2: Initialize AdaptiveSession with initial difficulty
   */
  const handleStartAdaptiveAssessment = async () => {
    if (!currentObjective || !sessionId) return

    try {
      setAdaptiveStartTime(Date.now())
      setAdaptiveQuestionsAsked(0)

      // Get first question (API calculates initial difficulty automatically)
      const response = await fetch('/api/adaptive/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          objectiveId: currentObjective.objectiveId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start adaptive assessment')
      }

      const data = await response.json()

      // Store adaptive session ID (Task 12.2 + 12.7)
      const adaptiveId = data.data.adaptiveSessionId
      setAdaptiveSessionId(adaptiveId) // Local state
      storeSetAdaptiveSessionId(adaptiveId) // Zustand store for persistence

      // Transition to adaptive phase (Task 12.3)
      setStudyPhase('adaptive')
      setShowAdaptiveAssessment(true)

      toast.success('🎯 Adaptive assessment started - questions will adjust to your level')
    } catch (error) {
      console.error('Failed to start adaptive assessment:', error)
      toast.error('Failed to start adaptive assessment')
    }
  }

  /**
   * Handle adaptive assessment completion
   *
   * AC#4: Mastery Verification Protocol
   * - Checks if mastery criteria met (3 consecutive > 80%, multiple types, etc.)
   *
   * AC#7: Assessment Efficiency Optimization
   * - Records questions asked (target: 3-5 vs baseline 15+)
   * - Calculates time saved
   *
   * Task 12.5: Include efficiency metrics in session summary
   * Task 12.6: Track time separately (adaptive time vs content time)
   */
  const handleAdaptiveAssessmentComplete = async (result: {
    score: number
    responseId: string
    difficultyAdjustment?: number
    questionsAsked?: number
    efficiencyScore?: number
    masteryStatus?: 'VERIFIED' | 'IN_PROGRESS' | 'NOT_STARTED'
  }) => {
    // Task 12.6: Calculate time spent on adaptive assessment
    const adaptiveTimeMs = adaptiveStartTime ? Date.now() - adaptiveStartTime : 0

    // Store results (Task 12.5 + 12.7)
    const score = result.score
    const questionsAsked = result.questionsAsked || 0
    const efficiency = result.efficiencyScore || null

    setAdaptiveScore(score) // Local state
    setAdaptiveQuestionsAsked(questionsAsked)
    setAdaptiveEfficiency(efficiency)

    // Store in Zustand for persistence (Task 12.7)
    storeSetAdaptiveMetrics(score, questionsAsked, efficiency || 0)

    setShowAdaptiveAssessment(false)

    // Log efficiency metrics (Task 12.5)
    if (result.efficiencyScore) {
      console.log('Adaptive Assessment Efficiency:', {
        questionsAsked: result.questionsAsked,
        efficiencyScore: result.efficiencyScore,
        timeSpentMs: adaptiveTimeMs,
      })

      const savedQuestions = 15 - (result.questionsAsked || 0) // Baseline 15 questions
      toast.success(
        `✨ Assessment complete! Saved ${savedQuestions} questions (${result.efficiencyScore}% efficiency)`,
      )
    }

    // Check mastery status (AC#4)
    if (result.masteryStatus === 'VERIFIED') {
      toast.success(
        "🎓 Mastery verified! You've demonstrated consistent high performance across multiple dimensions.",
      )
    } else if (result.masteryStatus === 'IN_PROGRESS') {
      toast.info('📈 Making progress toward mastery - keep practicing!')
    }

    // Move to next phase (cards or completion)
    if (cards.length > 0) {
      setStudyPhase('cards')
    } else {
      setStudyPhase('assessment')
      setShowCompletionDialog(true)
    }
  }

  const handleObjectiveComplete = async (data: {
    selfAssessment: number
    confidenceRating: number
    notes?: string
  }) => {
    if (!sessionId || !currentObjective) return

    // Story 4.1 Task 6.6: Check comprehension score requirement
    if (comprehensionScore !== null && comprehensionScore < 60) {
      toast.error(
        'Comprehension score below 60% - please retry the explanation or review the material',
      )
      setShowCompletionDialog(false)
      // Reset to comprehension phase for retry
      setStudyPhase('comprehension')
      setShowComprehensionPrompt(true)
      return
    }

    // Story 4.2 Task 7.8: Check clinical scenario score requirement (threshold: 60%)
    if (clinicalScenarioScore !== null && clinicalScenarioScore < 60) {
      toast.error('Clinical scenario score below 60% - objective not completed')
      setShowCompletionDialog(false)
      return
    }

    try {
      const timeSpentMs = getObjectiveElapsed()
      const response = await fetch(
        `/api/learning/sessions/${sessionId}/objectives/${currentObjective.objectiveId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Email': userEmail,
          },
          body: JSON.stringify({
            ...data,
            timeSpentMs,
            comprehensionScore, // Story 4.1 Task 6.7: Include comprehension score
            clinicalScenarioScore, // Story 4.2 Task 7.7: Include clinical scenario score
            clinicalScenarioTime: clinicalScenarioTimeSpent, // Story 4.2 Task 7.6: Include clinical scenario time
            // Story 4.5 Task 12.5: Include adaptive assessment metrics
            adaptiveScore, // Final adaptive score
            adaptiveQuestionsAsked, // Questions asked (efficiency metric)
            adaptiveEfficiency, // Efficiency score (% vs baseline)
            adaptiveTimeSpent: adaptiveStartTime ? Date.now() - adaptiveStartTime : null, // Task 12.6: Separate time tracking
          }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to complete objective')
      }

      const result = await response.json()
      setShowCompletionDialog(false)
      setMissionProgress(result.data.missionProgress)

      // Record objective completion with orchestration (Story 5.3)
      studyOrchestration.recordInteraction('objective_completed')

      // Story 4.2 Task 7: Increment objectives completed since scenario (Story 4.2 Task 7.7)
      incrementObjectivesCompleted()

      // Check if there's a next objective
      if (result.data.nextObjective) {
        const nextObjIndex = currentObjectiveIndex + 1
        setObjectivesCompletedCount((prev) => prev + 1)

        // Story 4.3 Task 10: Check if challenge mode should be triggered (AC#8)
        // Timing: After 2-3 objectives (optimal for memory encoding)
        const shouldShowChallenge = await checkForChallengeMode()

        if (shouldShowChallenge) {
          // Challenge mode shown, pause session flow
          return // Challenge dialog will handle continuation
        }

        // Check if break is needed (Story 2.5 Task 10 - Pomodoro mode)
        if (settings.enableBreaks || settings.pomodoroMode) {
          const shouldTakeLongBreak =
            objectivesCompletedCount > 0 &&
            (objectivesCompletedCount + 1) % settings.objectivesUntilLongBreak === 0
          setIsLongBreak(shouldTakeLongBreak)
          setShowBreakDialog(true)
        } else if (settings.autoAdvance && currentObjective.objective) {
          // If auto-advance is enabled, show transition screen
          setTransitionData({
            completedObjective: currentObjective.objective,
            nextObjective: result.data.nextObjective,
          })
          setShowTransition(true)
          // Transition component will call handleTransitionComplete after delay
        } else {
          // Manual advance - move immediately
          await advanceToNextObjective(
            nextObjIndex,
            result.data.nextObjective,
            result.data.missionProgress,
          )
          toast.success('Objective completed! Moving to next...')
        }
      } else {
        // Mission complete!
        toast.success('🎉 Mission completed!')
        await handleCompleteSession()
      }
    } catch (error) {
      console.error('Failed to complete objective:', error)
      toast.error('Failed to complete objective')
    }
  }

  const advanceToNextObjective = async (
    nextIndex: number,
    nextObjective: MissionObjective,
    missionProgress: { completed: number; total: number },
  ) => {
    // Store current index as previous for "back" navigation
    setPreviousObjectiveIndex(currentObjectiveIndex)

    // Move to next objective
    setCurrentObjectiveIndex(nextIndex)
    setCurrentObjective(nextObjective)
    setMissionProgress(missionProgress)
    setStudyPhase('content')

    // Start timer immediately for new objective (avoid waiting for effect tick)
    setObjectiveStartTime(new Date())
    startObjectiveTimer()

    // Load cards for next objective
    await loadCardsForObjective(nextObjective.objectiveId)
  }

  const handleTransitionComplete = async () => {
    if (isAdvancingRef.current) return
    if (!transitionData) return
    isAdvancingRef.current = true

    setShowTransition(false)

    // Get the updated data from store
    const nextObjIndex = currentObjectiveIndex + 1
    await advanceToNextObjective(
      nextObjIndex,
      transitionData.nextObjective,
      storeMissionProgress || { completed: nextObjIndex, total: mission?.objectives.length || 0 },
    )

    setTransitionData(null)
    toast.success('Moving to next objective...')

    // allow subsequent transitions
    isAdvancingRef.current = false
  }

  // Handle break completion (Story 2.5 Task 10)
  const handleBreakComplete = async () => {
    setShowBreakDialog(false)

    // Move to next objective after break
    if (currentObjective) {
      const nextObjIndex = currentObjectiveIndex + 1
      const nextObjective = mission?.objectives[nextObjIndex]

      if (nextObjective) {
        await advanceToNextObjective(
          nextObjIndex,
          nextObjective,
          storeMissionProgress || {
            completed: nextObjIndex,
            total: mission?.objectives.length || 0,
          },
        )
        toast.success('Break complete - continuing to next objective')
      }
    }
  }

  // Handle skip break (Story 2.5 Task 10)
  const handleSkipBreak = async () => {
    setShowBreakDialog(false)

    // Move to next objective immediately
    if (currentObjective) {
      const nextObjIndex = currentObjectiveIndex + 1
      const nextObjective = mission?.objectives[nextObjIndex]

      if (nextObjective) {
        await advanceToNextObjective(
          nextObjIndex,
          nextObjective,
          storeMissionProgress || {
            completed: nextObjIndex,
            total: mission?.objectives.length || 0,
          },
        )
        toast.info('Break skipped - moving to next objective')
      }
    }
  }

  // Handle Pomodoro break recommendation (Story 2.5 Task 10)
  const handlePomodoroBreakRecommended = (isLongBreak: boolean) => {
    if (settings.enableBreaks) {
      setIsLongBreak(isLongBreak)
      setShowBreakDialog(true)
    }
  }

  // Handle cognitive load break recommendation (Story 5.4)
  const handleCognitiveLoadBreak = () => {
    setIsLongBreak(false)
    setShowBreakDialog(true)
  }

  // Real-time orchestration handlers (Story 5.3)
  const handleOrchestrationBreakRecommendation = (recommendation: any) => {
    setShowIntelligentBreak(true)
  }

  const handleOrchestrationContentAdaptation = (adaptation: any) => {
    setShowContentAdaptation(true)
  }

  const handleOrchestrationSessionRecommendation = (recommendation: any) => {
    setShowSessionRecommendation(true)
  }

  const handleIntelligentBreakTake = (duration: number) => {
    setShowIntelligentBreak(false)
    studyOrchestration.acceptBreakRecommendation()

    // Update phase to break
    studyOrchestration.recordPhaseChange('break')

    toast.info(`Taking intelligent break for ${duration} minutes`)
  }

  const handleIntelligentBreakSkip = () => {
    setShowIntelligentBreak(false)
    studyOrchestration.declineRecommendation('break')
    toast.info('Intelligent break skipped')
  }

  const handleIntelligentBreakPostpone = (minutes: number) => {
    setShowIntelligentBreak(false)
    toast.info(`Intelligent break postponed by ${minutes} minutes`)
  }

  const handleContentAdaptationAccept = (adaptation: any, selectedOption?: string) => {
    setShowContentAdaptation(false)
    studyOrchestration.acceptContentAdaptation(selectedOption)

    if (selectedOption === 'easier') {
      toast.info('Switching to easier content')
    } else if (selectedOption === 'harder') {
      toast.info('Switching to more challenging content')
    }
  }

  const handleContentAdaptationDecline = (adaptation: any) => {
    setShowContentAdaptation(false)
    studyOrchestration.declineRecommendation('content')
    toast.info('Content adaptation declined')
  }

  const handleContentAdaptationPostpone = (adaptation: any, minutes: number) => {
    setShowContentAdaptation(false)
    toast.info(`Content adaptation postponed by ${minutes} minutes`)
  }

  const handleSessionRecommendationAccept = (recommendation: any, selectedOption?: string) => {
    setShowSessionRecommendation(false)
    studyOrchestration.acceptSessionRecommendation(selectedOption)

    if (recommendation.type === 'extend') {
      toast.info(`Session extended by ${selectedOption || '15'} minutes`)
    } else if (recommendation.type === 'complete_early') {
      toast.success('Completing session early - great work!')
      // Trigger session completion after a short delay
      setTimeout(() => handleCompleteSession(), 2000)
    }
  }

  const handleSessionRecommendationDecline = (recommendation: any) => {
    setShowSessionRecommendation(false)
    studyOrchestration.declineRecommendation('session')
    toast.info('Session recommendation declined - continuing as planned')
  }

  // Record user interactions for orchestration (Story 5.3)
  const recordUserInteraction = (action: string) => {
    // STUB: Story 5.3 - recordInteraction method not yet implemented
    // orchestration.recordInteraction(action)
    console.log('User interaction:', action)
  }

  // Cleanup transition state on unmount/session end
  useEffect(() => {
    return () => {
      setShowTransition(false)
      setTransitionData(null)
      isAdvancingRef.current = false
    }
  }, [])

  const handleBackToPrevious = async () => {
    if (previousObjectiveIndex === null || !mission) return

    const prevObjective = mission.objectives[previousObjectiveIndex]
    if (!prevObjective) return

    setCurrentObjectiveIndex(previousObjectiveIndex)
    setCurrentObjective(prevObjective)
    setStudyPhase('content')
    setPreviousObjectiveIndex(null)

    // Record navigation with orchestration (Story 5.3)
    recordUserInteraction('navigate_back_to_previous')

    // Load cards for previous objective
    await loadCardsForObjective(prevObjective.objectiveId)

    toast.info(`Returning to previous objective`)
  }

  const handleJumpToObjective = async (index: number) => {
    if (!mission || index < 0 || index >= mission.objectives.length) return

    const targetObjective = mission.objectives[index]
    if (!targetObjective) return

    // Store current as previous
    setPreviousObjectiveIndex(currentObjectiveIndex)

    setCurrentObjectiveIndex(index)
    setCurrentObjective(targetObjective)
    setStudyPhase('content')

    // Record navigation with orchestration (Story 5.3)
    recordUserInteraction(`navigate_to_objective_${index + 1}`)

    // Load cards for target objective
    await loadCardsForObjective(targetObjective.objectiveId)

    toast.info(`Jumped to objective ${index + 1}`)
  }

  // Show loading skeleton during recovery
  if (isRecovering) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>

          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />

          <div className="flex justify-center">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground">Recovering your session...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no mission, show basic session UI
  if (!missionId || !mission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'oklch(0.3 0.15 250)' }}>
              Study Session
            </h1>
            <p className="text-base" style={{ color: 'oklch(0.5 0.1 250)' }}>
              Track your study time and maintain consistent habits
            </p>
          </div>

          <div
            className="rounded-2xl p-8 backdrop-blur-md"
            style={{
              background: 'oklch(1 0 0 / 0.8)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          >
            <div className="mb-8">
              <SessionTimer />
            </div>

            <div className="flex justify-center gap-4">
              {!sessionId ? (
                <Button
                  size="lg"
                  onClick={handleStartSession}
                  disabled={isStarting}
                  className="min-h-[44px] px-8"
                  style={{
                    background: 'oklch(0.55 0.2 250)',
                    color: 'oklch(1 0 0)',
                  }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {isStarting ? 'Starting...' : 'Start Session'}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={isPaused ? handleResumeSession : handlePauseSession}
                    className="min-h-[44px] px-8"
                  >
                    {isPaused ? (
                      <Play className="mr-2 h-5 w-5" />
                    ) : (
                      <Pause className="mr-2 h-5 w-5" />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCompleteSession}
                    disabled={isCompleting}
                    className="min-h-[44px] px-8"
                    style={{
                      background: 'oklch(0.65 0.2 140)',
                      color: 'oklch(1 0 0)',
                    }}
                  >
                    <Square className="mr-2 h-5 w-5" />
                    {isCompleting ? 'Completing...' : 'Complete Session'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mission-based orchestration UI
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Hide header in focus mode (Story 2.5 Task 10) */}
        {!settings.focusMode && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'oklch(0.3 0.15 250)' }}>
              Mission Study Session
            </h1>
            <p className="text-base" style={{ color: 'oklch(0.5 0.1 250)' }}>
              Follow your daily mission objectives with guided focus
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Mission Progress Header - hide in minimize mode (Story 2.5 Task 10) */}
          {sessionId && mission && !settings.minimizeMode && (
            <MissionProgressHeader
              objectives={mission.objectives}
              currentObjectiveIndex={currentObjectiveIndex}
              estimatedTotalMinutes={mission.estimatedMinutes}
            />
          )}

          {/* Real-time Orchestration Panel (Story 5.3) */}
          {sessionId &&
            studyOrchestration.isActive &&
            settings.enableRealtimeOrchestration &&
            !settings.focusMode && (
              <RealtimeOrchestrationPanel
                sessionId={sessionId}
                missionId={missionId}
                currentPhase={studyPhase}
                onBreakRecommendation={handleOrchestrationBreakRecommendation}
                onContentAdaptation={handleOrchestrationContentAdaptation}
                onSessionRecommendation={handleOrchestrationSessionRecommendation}
                compact={settings.minimizeMode}
              />
            )}

          {/* Cognitive Load Indicator (Story 5.4) */}
          {sessionId && showCognitiveLoad && !settings.focusMode && (
            <CognitiveLoadIndicator
              sessionId={sessionId}
              userId={userEmail}
              onBreakRecommended={handleCognitiveLoadBreak}
              compact={settings.minimizeMode}
            />
          )}

          {/* Main Study Area */}
          {!sessionId ? (
            <div
              className="rounded-2xl p-8 backdrop-blur-md text-center"
              style={{
                background: 'oklch(1 0 0 / 0.8)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
              }}
            >
              <Button
                size="lg"
                onClick={handleStartSession}
                disabled={isStarting}
                className="min-h-[44px] px-8"
                style={{
                  background: 'oklch(0.55 0.2 250)',
                  color: 'oklch(1 0 0)',
                }}
              >
                <Play className="mr-2 h-5 w-5" />
                {isStarting ? 'Starting Mission...' : 'Start Mission'}
              </Button>
            </div>
          ) : currentObjective?.objective ? (
            <>
              {/* Objective Timer or Pomodoro Timer */}
              <div
                className="rounded-2xl p-6 backdrop-blur-md"
                style={{
                  background: settings.focusMode
                    ? 'oklch(0.98 0.01 250 / 0.95)'
                    : 'oklch(1 0 0 / 0.95)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                }}
              >
                {settings.pomodoroMode ? (
                  <PomodoroTimer
                    focusBlockMinutes={settings.focusBlockMinutes}
                    shortBreakMinutes={settings.shortBreakMinutes}
                    longBreakMinutes={settings.longBreakMinutes}
                    objectivesCompleted={objectivesCompletedCount}
                    objectivesUntilLongBreak={settings.objectivesUntilLongBreak}
                    onBreakRecommended={handlePomodoroBreakRecommended}
                  />
                ) : (
                  <ObjectiveTimer
                    startedAt={objectiveStartTime}
                    estimatedMinutes={currentObjective.estimatedMinutes}
                    onAlertThreshold={(percent) => {
                      // Use custom alerts from settings
                      if (settings.objectiveTimeAlerts.includes(percent)) {
                        if (percent >= 100) {
                          toast.error('⏱️ Estimated time reached! Consider wrapping up.')
                        } else if (percent >= 80) {
                          toast.warning(`⏰ Approaching estimated time (${percent}%)`)
                        } else {
                          toast.info(`Time alert: ${percent}% of estimated time`)
                        }
                      }
                    }}
                  />
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={isPaused ? handleResumeSession : handlePauseSession}
                    className="min-h-[44px]"
                  >
                    {isPaused ? (
                      <Play className="mr-2 h-4 w-4" />
                    ) : (
                      <Pause className="mr-2 h-4 w-4" />
                    )}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    onClick={handleCompleteSession}
                    disabled={isCompleting}
                    variant="outline"
                    className="min-h-[44px]"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    End Session
                  </Button>

                  {/* Navigation Controls - hide in focus mode (Story 2.5 Task 10) */}
                  {!settings.focusMode && (
                    <div className="ml-auto flex gap-2">
                      {/* Back to Previous Objective */}
                      {previousObjectiveIndex !== null && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackToPrevious}
                          className="min-h-[44px]"
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      )}

                      {/* Jump to Objective Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="min-h-[44px]">
                            <Menu className="mr-2 h-4 w-4" />
                            Jump To
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                          <DropdownMenuLabel>Objectives</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {mission?.objectives.map((obj, index) => (
                            <DropdownMenuItem
                              key={obj.objectiveId}
                              onClick={() => handleJumpToObjective(index)}
                              disabled={index === currentObjectiveIndex}
                              className="min-h-[44px]"
                            >
                              <div className="flex items-center gap-2 w-full">
                                {obj.completed && (
                                  <CheckCircle
                                    className="w-4 h-4"
                                    style={{ color: 'oklch(0.65 0.2 140)' }}
                                  />
                                )}
                                {index === currentObjectiveIndex && (
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: 'oklch(0.55 0.2 250)' }}
                                  >
                                    CURRENT
                                  </span>
                                )}
                                <span className="flex-1 truncate text-sm">
                                  {obj.objective?.objective || 'Objective'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {obj.estimatedMinutes}m
                                </Badge>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Settings Panel */}
                      <SessionSettingsPanel
                        settings={settings}
                        onUpdateSettings={updateSettings}
                        onResetSettings={resetSettings}
                        variant="dropdown"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Study Phase Content */}
              {studyPhase === 'content' && (
                <>
                  <div
                    ref={contentPanelRef}
                    className={settings.minimizeMode ? 'max-h-[400px] overflow-y-auto' : ''}
                  >
                    <ObjectiveContentPanel
                      objective={currentObjective.objective}
                      lectureId={currentObjective.objective.lecture.id}
                      pageStart={currentObjective.objective.pageStart}
                      pageEnd={currentObjective.objective.pageEnd}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleContentPhaseComplete}
                      disabled={loadingComprehensionPrompt}
                      className="min-h-[44px] px-8"
                      style={{
                        background: 'oklch(0.65 0.2 140)',
                        color: 'oklch(1 0 0)',
                      }}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {loadingComprehensionPrompt ? 'Loading...' : 'Continue to Review Cards'}
                    </Button>
                  </div>
                </>
              )}

              {studyPhase === 'comprehension' && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground">
                      {loadingComprehensionPrompt
                        ? 'Generating comprehension prompt...'
                        : 'Opening comprehension prompt...'}
                    </p>
                  </div>
                </div>
              )}

              {loadingClinicalScenario && (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground">
                      Generating clinical case scenario...
                    </p>
                  </div>
                </div>
              )}

              {studyPhase === 'cards' && (
                <FlashcardReview
                  cards={cards}
                  onReview={handleCardReview}
                  onComplete={handleCardsComplete}
                />
              )}

              {/* Story 4.5 Task 12.3: Adaptive Assessment Phase */}
              {studyPhase === 'adaptive' && adaptiveSessionId && (
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'oklch(0.95 0.05 230)',
                      borderColor: 'oklch(0.85 0.08 230)',
                    }}
                  >
                    <h3
                      className="font-semibold text-base mb-2"
                      style={{ color: 'oklch(0.3 0.15 230)' }}
                    >
                      🎯 Adaptive Assessment Active
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Questions will adapt to your performance in real-time. Target: 3-5 questions
                      for accurate assessment (vs 15+ traditional questions). Time spent here is
                      tracked separately from content review.
                    </p>
                  </div>

                  {/* Task 12.4: Render AdaptiveAssessmentInterface component */}
                  <AdaptiveAssessmentInterface
                    sessionId={sessionId}
                    objectiveId={currentObjective.objectiveId}
                    onComplete={handleAdaptiveAssessmentComplete}
                  />
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Objective Completion Dialog */}
        {currentObjective?.objective && (
          <ObjectiveCompletionDialog
            open={showCompletionDialog}
            objectiveName={currentObjective.objective.objective}
            onComplete={handleObjectiveComplete}
            onCancel={() => setShowCompletionDialog(false)}
          />
        )}

        {/* Objective Transition Screen */}
        {showTransition && transitionData && settings.autoAdvance && (
          <ObjectiveTransition
            completedObjective={transitionData.completedObjective}
            nextObjective={transitionData.nextObjective}
            delayMs={settings.autoAdvanceDelay}
            onTransitionComplete={handleTransitionComplete}
          />
        )}

        {/* Session Resume Dialog (Story 2.5 Task 9) */}
        <SessionResumeDialog
          open={showResumeDialog}
          snapshot={sessionSnapshot}
          currentObjectiveName={currentObjective?.objective?.objective}
          hasTimeout={hasSessionTimeout()}
          onResume={handleResumeFromDialog}
          onStartFresh={handleStartFresh}
          onCancel={() => setShowResumeDialog(false)}
        />

        {/* Break Reminder Dialog (Story 2.5 Task 10) */}
        <BreakReminderDialog
          open={showBreakDialog}
          isLongBreak={isLongBreak}
          breakMinutes={isLongBreak ? settings.longBreakMinutes : settings.shortBreakMinutes}
          onTakeBreak={handleBreakComplete}
          onSkipBreak={handleSkipBreak}
        />

        {/* Comprehension Prompt Dialog (Story 4.1 Task 6) */}
        {comprehensionPrompt && currentObjective && (
          <ComprehensionPromptDialog
            open={showComprehensionPrompt}
            onOpenChange={setShowComprehensionPrompt}
            prompt={comprehensionPrompt}
            objectiveId={currentObjective.objectiveId}
            sessionId={sessionId || undefined}
            onComplete={handleComprehensionComplete}
            onSkip={handleComprehensionSkip}
          />
        )}

        {/* Clinical Scenario Dialog (Story 4.2 Task 7) */}
        {clinicalScenario && (
          <>
            <ClinicalCaseDialog
              scenario={clinicalScenario}
              open={showClinicalScenario && !clinicalEvaluation}
              onClose={() => setShowClinicalScenario(false)}
              onSubmit={handleClinicalScenarioSubmit}
            />

            {clinicalEvaluation && (
              <ClinicalFeedbackPanel
                evaluation={clinicalEvaluation}
                scenario={clinicalScenario}
                onReview={() => {
                  setClinicalEvaluation(null)
                  setShowClinicalScenario(true)
                }}
                onNext={() => {
                  setClinicalEvaluation(null)
                  setShowClinicalScenario(false)
                  setClinicalScenario(null)
                  // Continue to cards or assessment phase
                  if (cards.length > 0) {
                    setStudyPhase('cards')
                  } else {
                    setStudyPhase('assessment')
                    setShowCompletionDialog(true)
                  }
                }}
              />
            )}
          </>
        )}

        {/* Challenge Mode Dialog (Story 4.3 Task 10) */}
        {challengeData && (
          <ChallengeModeDialog
            open={showChallengeMode}
            onOpenChange={setShowChallengeMode}
            challenge={challengeData.challenge}
            metadata={{
              vulnerabilityType: challengeData.vulnerabilityType,
              attemptNumber: challengeData.retryInfo?.attemptNumber,
              previousScore: challengeData.retryInfo?.previousScore,
            }}
            onComplete={handleChallengeComplete}
            onSkip={handleChallengeSkip}
          />
        )}

        {/* Story 4.4 Task 10: Confidence Calibration Workflow
             Note: ComprehensionPromptDialog manages full workflow internally:
             - PreAssessmentConfidenceDialog (before prompt shown)
             - PostAssessmentConfidenceDialog (after prompt, before submission)
             - Evaluation results with calibration feedback
             - ReflectionPromptDialog (after evaluation)
             When onComplete is called, all workflow steps are complete.
        */}
      </div>
    </div>
  )
}

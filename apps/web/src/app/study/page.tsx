'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSessionStore } from '@/store/use-session-store'
import { useUserStore } from '@/store/use-user-store'
import { SessionTimer } from '@/components/study/session-timer'
import { ObjectiveContentPanel } from '@/components/study/objective-content-panel'
import { ObjectiveTimer } from '@/components/study/objective-timer'
import { MissionProgressHeader } from '@/components/study/mission-progress-header'
import { FlashcardReview, FlashCard } from '@/components/study/flashcard-review'
import { ObjectiveCompletionDialog } from '@/components/study/objective-completion-dialog'
import { ObjectiveTransition } from '@/components/study/objective-transition'
import { SessionResumeDialog } from '@/components/study/session-resume-dialog'
import { SessionSettingsPanel } from '@/components/study/session-settings-panel'
import { PomodoroTimer } from '@/components/study/pomodoro-timer'
import { BreakReminderDialog } from '@/components/study/break-reminder-dialog'
import { RealtimeOrchestrationPanel } from '@/components/study/realtime-orchestration-panel'
import { IntelligentBreakNotification } from '@/components/study/intelligent-break-notification'
import { ContentAdaptationDialog } from '@/components/study/content-adaptation-dialog'
import { SessionRecommendationDialog } from '@/components/study/session-recommendation-dialog'
import { CognitiveLoadIndicator } from '@/components/study/cognitive-load-indicator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, Square, CheckCircle, Settings, ChevronLeft, Menu } from 'lucide-react'
import { toast } from 'sonner'
import { useStudyOrchestration } from '@/hooks/use-study-orchestration'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface LearningObjective {
  id: string
  objective: string
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
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

type StudyPhase = 'content' | 'cards' | 'assessment'

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
    // Real-time orchestration (Story 5.3)
    orchestration,
    initializeOrchestration,
    recordSessionEvent,
    updateCurrentPhase,
    setBreakRecommendation,
    setContentAdaptation,
    setSessionRecommendation,
    handleBreakTaken,
    handleContentAdaptation,
    handleSessionRecommendation,
    updatePerformanceMetrics,
    cleanupOrchestration,
  } = useSessionStore()
  const { userEmail } = useUserStore()

  // Real-time orchestration (Story 5.3)
  const studyOrchestration = useStudyOrchestration({
    enabled: true,
    autoRecord: true,
    sensitivity: settings.orchestrationSensitivity,
  })

  const [isStarting, setIsStarting] = useState(false)
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

  // Check for paused session on mount (Story 2.5 Task 9)
  useEffect(() => {
    if (sessionSnapshot && sessionId && !pausedAt) {
      // Session exists with snapshot but is not paused - check for timeout
      const timeout = hasSessionTimeout()
      setShowResumeDialog(true)
    }
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
    // Record phase completion with orchestration (Story 5.3)
    studyOrchestration.recordInteraction('content_phase_completed')

    // Move to cards phase
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

  const handleObjectiveComplete = async (data: {
    selfAssessment: number
    confidenceRating: number
    notes?: string
  }) => {
    if (!sessionId || !currentObjective) return

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

      // Check if there's a next objective
      if (result.data.nextObjective) {
        const nextObjIndex = currentObjectiveIndex + 1
        setObjectivesCompletedCount((prev) => prev + 1)

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
                      className="min-h-[44px] px-8"
                      style={{
                        background: 'oklch(0.65 0.2 140)',
                        color: 'oklch(1 0 0)',
                      }}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Continue to Review Cards
                    </Button>
                  </div>
                </>
              )}

              {studyPhase === 'cards' && (
                <FlashcardReview
                  cards={cards}
                  onReview={handleCardReview}
                  onComplete={handleCardsComplete}
                />
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

        {/* Real-time Orchestration Dialogs (Story 5.3) */}
        <IntelligentBreakNotification
          open={showIntelligentBreak}
          recommendation={null} // Will be generated by orchestration service
          onTakeBreak={handleIntelligentBreakTake}
          onSkipBreak={handleIntelligentBreakSkip}
          onPostponeBreak={handleIntelligentBreakPostpone}
          sessionProgress={{
            objectivesCompleted: objectivesCompletedCount,
            totalObjectives: mission?.objectives.length || 0,
            sessionDuration: Math.round(studyOrchestration.sessionDuration / 60000),
          }}
        />

        <ContentAdaptationDialog
          open={showContentAdaptation}
          adaptation={null} // Will be generated by orchestration service
          onAccept={handleContentAdaptationAccept}
          onDecline={handleContentAdaptationDecline}
          onPostpone={handleContentAdaptationPostpone}
          currentContent={{
            type: (currentObjective?.objective?.complexity.toLowerCase() as any) || 'intermediate',
            topic: currentObjective?.objective?.objective || '',
            completedPercentage: storeMissionProgress
              ? Math.round((storeMissionProgress.completed / storeMissionProgress.total) * 100)
              : 0,
          }}
          sessionContext={{
            objectivesCompleted: objectivesCompletedCount,
            totalObjectives: mission?.objectives.length || 0,
            timeSpent: Math.round(studyOrchestration.sessionDuration / 60000),
            currentStreak: 1,
          }}
        />

        <SessionRecommendationDialog
          open={showSessionRecommendation}
          recommendation={null} // Will be generated by orchestration service
          onAccept={handleSessionRecommendationAccept}
          onDecline={handleSessionRecommendationDecline}
          sessionContext={{
            objectivesCompleted: objectivesCompletedCount,
            totalObjectives: mission?.objectives.length || 0,
            sessionDuration: Math.round(studyOrchestration.sessionDuration / 60000),
            plannedDuration: mission?.estimatedMinutes || 60,
            performanceScore: studyOrchestration.performanceMetrics.recentAccuracy,
            fatigueLevel: studyOrchestration.performanceMetrics.fatigueIndicator,
            streakCount: 1,
          }}
          availableObjectives={
            mission?.objectives.slice(currentObjectiveIndex + 1).map((obj) => ({
              id: obj.objectiveId,
              title: obj.objective?.objective || 'Objective',
              estimatedMinutes: obj.estimatedMinutes,
              difficulty: (obj.objective?.complexity.toLowerCase() as any) || 'intermediate',
              priority: obj.objective?.isHighYield ? 'high' : 'medium',
            })) || []
          }
        />
      </div>
    </div>
  )
}

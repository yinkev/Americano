import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  realtimeOrchestrationService,
  type SessionEvent,
  type BreakRecommendation,
  type ContentAdaptation,
  type SessionRecommendation,
} from '@/services/realtime-orchestration'

// Mission objective interface for session orchestration (Story 2.5)
export interface MissionObjective {
  objectiveId: string
  estimatedMinutes: number
  completed?: boolean
  completedAt?: string
  notes?: string
}

// Objective completion data (Story 2.5)
export interface ObjectiveCompletion {
  objectiveId: string
  completedAt: string
  timeSpentMs: number
  selfAssessment: number // 1-5 stars
  confidenceRating: number // 1-5 stars
  notes?: string
}

// Mission progress tracker (Story 2.5)
export interface MissionProgress {
  completed: number
  total: number
}

// Advanced pause/resume state snapshot (Story 2.5 Task 9 + Story 4.1 Task 6)
export interface SessionSnapshot {
  pausedAt: number
  currentObjectiveIndex: number
  studyPhase: 'content' | 'comprehension' | 'cards' | 'assessment'
  contentScrollPosition: number
  cardQueuePosition: number
  objectiveTimerState: {
    startedAt: number | null
    pausedTime: number
  }
}

// Session settings (Story 2.5 Task 10)
export interface SessionSettings {
  // Auto-advance
  autoAdvance: boolean
  autoAdvanceDelay: number // milliseconds

  // Time alerts
  objectiveTimeAlerts: number[] // Array of percentages (e.g., [80, 100])
  customAlertPercent?: number

  // Cards
  cardsPerObjective: number // 0-10 range

  // Breaks & Pomodoro
  enableBreaks: boolean
  pomodoroMode: boolean
  focusBlockMinutes: number // Default 25 for Pomodoro
  shortBreakMinutes: number // Default 5
  longBreakMinutes: number // Default 15
  objectivesUntilLongBreak: number // Default 2

  // Focus & Distraction management
  focusMode: boolean
  minimizeMode: boolean
  disableNotifications: boolean

  // Real-time orchestration (Story 5.3)
  enableRealtimeOrchestration: boolean
  orchestrationSensitivity: 'low' | 'medium' | 'high' // How sensitive to performance changes
  autoBreaksEnabled: boolean
  autoContentAdaptationEnabled: boolean
  sessionRecommendationsEnabled: boolean
}

// Real-time orchestration state (Story 5.3)
export interface OrchestrationState {
  isActive: boolean
  currentPhase: 'content' | 'cards' | 'assessment' | 'break'
  lastEvent: SessionEvent | null
  currentRecommendation: {
    break: BreakRecommendation | null
    content: ContentAdaptation | null
    session: SessionRecommendation | null
  }
  orchestrationHistory: {
    breaksTaken: number
    contentAdaptationsAccepted: number
    sessionRecommendationsAccepted: number
    totalInteractions: number
  }
  performanceMetrics: {
    currentScore: number
    trend: 'improving' | 'stable' | 'declining'
    fatigueLevel: number
    engagementScore: number
  }
}

// Session store state interface
interface SessionStore {
  sessionId: string | null
  startTime: number | null
  pausedAt: number | null
  pausedDuration: number
  userEmail: string | null // Track which user owns this session

  // Mission orchestration state (Story 2.5 Task 1.2)
  currentObjective: MissionObjective | null
  missionProgress: MissionProgress | null
  objectiveTimer: { startedAt: number | null; pausedTime: number }
  missionId: string | null

  // Advanced pause/resume state (Story 2.5 Task 9)
  sessionSnapshot: SessionSnapshot | null

  // Session settings (Story 2.5 Task 10)
  settings: SessionSettings

<<<<<<< HEAD
  // Real-time orchestration state (Story 5.3)
  orchestration: OrchestrationState
=======
  // Clinical scenario tracking (Story 4.2 Task 7)
  objectivesCompletedSinceScenario: number

  // Adaptive assessment tracking (Story 4.5 Task 12.7)
  adaptiveSessionId: string | null
  adaptiveScore: number | null
  adaptiveQuestionsAsked: number
  adaptiveEfficiency: number | null
>>>>>>> origin/main

  // Actions
  startSession: (sessionId: string, userEmail: string, missionId?: string) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => void
  clearSession: () => void

  // Mission orchestration actions (Story 2.5)
  setCurrentObjective: (objective: MissionObjective | null) => void
  setMissionProgress: (progress: MissionProgress) => void
  startObjectiveTimer: () => void
  pauseObjectiveTimer: () => void
  resumeObjectiveTimer: () => void
  getObjectiveElapsed: () => number

  // Advanced pause/resume actions (Story 2.5 Task 9)
  captureSessionSnapshot: (snapshot: Partial<SessionSnapshot>) => void
  clearSessionSnapshot: () => void
  hasSessionTimeout: () => boolean

  // Session settings actions (Story 2.5 Task 10)
  updateSettings: (settings: Partial<SessionSettings>) => void
  resetSettings: () => void

<<<<<<< HEAD
  // Real-time orchestration actions (Story 5.3)
  initializeOrchestration: (currentPhase?: 'content' | 'cards' | 'assessment') => void
  recordSessionEvent: (event: Omit<SessionEvent, 'timestamp'>) => void
  updateCurrentPhase: (phase: 'content' | 'cards' | 'assessment' | 'break') => void
  setBreakRecommendation: (recommendation: BreakRecommendation | null) => void
  setContentAdaptation: (adaptation: ContentAdaptation | null) => void
  setSessionRecommendation: (recommendation: SessionRecommendation | null) => void
  handleBreakTaken: () => void
  handleContentAdaptation: (accepted: boolean) => void
  handleSessionRecommendation: (accepted: boolean) => void
  updatePerformanceMetrics: (metrics: Partial<OrchestrationState['performanceMetrics']>) => void
  cleanupOrchestration: () => void
=======
  // Clinical scenario tracking (Story 4.2 Task 7)
  incrementObjectivesCompleted: () => void
  resetScenarioCounter: () => void

  // Adaptive assessment tracking (Story 4.5 Task 12.7)
  setAdaptiveSessionId: (adaptiveSessionId: string | null) => void
  setAdaptiveMetrics: (score: number, questionsAsked: number, efficiency: number) => void
  clearAdaptiveMetrics: () => void
>>>>>>> origin/main

  // Computed values
  getElapsedTime: () => number
  getPausedDuration: () => number
}

// Session timeout threshold (24 hours in milliseconds)
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000

// Default session settings
const DEFAULT_SETTINGS: SessionSettings = {
  // Auto-advance
  autoAdvance: true,
  autoAdvanceDelay: 2000,

  // Time alerts
  objectiveTimeAlerts: [80, 100],
  customAlertPercent: undefined,

  // Cards
  cardsPerObjective: 5,

  // Breaks & Pomodoro
  enableBreaks: false,
  pomodoroMode: false,
  focusBlockMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  objectivesUntilLongBreak: 2,

  // Focus & Distraction management
  focusMode: false,
  minimizeMode: false,
  disableNotifications: false,

  // Real-time orchestration (Story 5.3)
  enableRealtimeOrchestration: true,
  orchestrationSensitivity: 'medium',
  autoBreaksEnabled: true,
  autoContentAdaptationEnabled: true,
  sessionRecommendationsEnabled: true,
}

// Default orchestration state
const DEFAULT_ORCHESTRATION_STATE: OrchestrationState = {
  isActive: false,
  currentPhase: 'content',
  lastEvent: null,
  currentRecommendation: {
    break: null,
    content: null,
    session: null,
  },
  orchestrationHistory: {
    breaksTaken: 0,
    contentAdaptationsAccepted: 0,
    sessionRecommendationsAccepted: 0,
    totalInteractions: 0,
  },
  performanceMetrics: {
    currentScore: 0,
    trend: 'stable',
    fatigueLevel: 0,
    engagementScore: 100,
  },
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessionId: null,
      startTime: null,
      pausedAt: null,
      pausedDuration: 0,
      userEmail: null,

      // Mission orchestration state (Story 2.5)
      currentObjective: null,
      missionProgress: null,
      objectiveTimer: { startedAt: null, pausedTime: 0 },
      missionId: null,

      // Advanced pause/resume state (Story 2.5 Task 9)
      sessionSnapshot: null,

      // Session settings (Story 2.5 Task 10) - use defaults
      settings: DEFAULT_SETTINGS,

<<<<<<< HEAD
      // Real-time orchestration state (Story 5.3)
      orchestration: DEFAULT_ORCHESTRATION_STATE,
=======
      // Clinical scenario tracking (Story 4.2 Task 7)
      objectivesCompletedSinceScenario: 0,

      // Adaptive assessment tracking (Story 4.5 Task 12.7)
      adaptiveSessionId: null,
      adaptiveScore: null,
      adaptiveQuestionsAsked: 0,
      adaptiveEfficiency: null,
>>>>>>> origin/main

      startSession: (sessionId: string, userEmail: string, missionId?: string) => {
        set({
          sessionId,
          userEmail,
          missionId: missionId || null,
          startTime: Date.now(),
          pausedAt: null,
          pausedDuration: 0,
        })
      },

      pauseSession: () => {
        const { pausedAt, objectiveTimer } = get()
        // Only pause if not already paused
        if (!pausedAt) {
          set({ pausedAt: Date.now() })

          // Also pause the objective timer
          if (objectiveTimer.startedAt) {
            const currentPausedTime =
              Date.now() - objectiveTimer.startedAt - objectiveTimer.pausedTime
            set({
              objectiveTimer: { ...objectiveTimer, pausedTime: currentPausedTime },
            })
          }
        }
      },

      resumeSession: () => {
        const { pausedAt, pausedDuration, objectiveTimer } = get()
        // Only resume if currently paused
        if (pausedAt) {
          const additionalPausedTime = Date.now() - pausedAt
          set({
            pausedAt: null,
            pausedDuration: pausedDuration + additionalPausedTime,
          })

          // Resume objective timer if it was running
          if (objectiveTimer.startedAt) {
            // Timer continues with already captured pausedTime
            set({ objectiveTimer })
          }
        }
      },

      completeSession: () => {
        // Clear the session state
        set({
          sessionId: null,
          startTime: null,
          pausedAt: null,
          pausedDuration: 0,
          userEmail: null,
        })
      },

      clearSession: () => {
        set({
          sessionId: null,
          startTime: null,
          pausedAt: null,
          pausedDuration: 0,
          userEmail: null,
        })
      },

      getElapsedTime: () => {
        const { startTime, pausedAt, pausedDuration } = get()

        if (!startTime) return 0

        const now = Date.now()
        const totalElapsed = now - startTime

        // If currently paused, don't count time after pause
        if (pausedAt) {
          const currentPausedTime = now - pausedAt
          return totalElapsed - pausedDuration - currentPausedTime
        }

        return totalElapsed - pausedDuration
      },

      getPausedDuration: () => {
        const { pausedAt, pausedDuration } = get()

        if (!pausedAt) {
          return pausedDuration
        }

        // If currently paused, include current pause time
        const currentPausedTime = Date.now() - pausedAt
        return pausedDuration + currentPausedTime
      },

      // Mission orchestration actions (Story 2.5 Task 1.2)
      setCurrentObjective: (objective: MissionObjective | null) => {
        set({ currentObjective: objective })
      },

      setMissionProgress: (progress: MissionProgress) => {
        set({ missionProgress: progress })
      },

      /**
       * Starts the objective timer using Date.now() for drift-free accuracy.
       *
       * Captures the current timestamp as the start time, allowing elapsed time
       * to be calculated by comparing against Date.now() on each check. This approach
       * prevents timer drift that occurs with setInterval-based counters, ensuring
       * accurate time tracking regardless of browser throttling or background tab behavior.
       */
      startObjectiveTimer: () => {
        set({
          objectiveTimer: { startedAt: Date.now(), pausedTime: 0 },
        })
      },

      /**
       * Pauses the objective timer by capturing accumulated paused duration.
       *
       * Uses Date.now() to calculate the current elapsed time and stores it as pausedTime.
       * This allows the timer to resume accurately by accounting for the paused duration
       * when calculating total elapsed time.
       */
      pauseObjectiveTimer: () => {
        const { objectiveTimer } = get()
        if (objectiveTimer.startedAt) {
          const pausedTime = Date.now() - objectiveTimer.startedAt - objectiveTimer.pausedTime
          set({
            objectiveTimer: { ...objectiveTimer, pausedTime },
          })
        }
      },

      resumeObjectiveTimer: () => {
        const { objectiveTimer } = get()
        if (objectiveTimer.startedAt) {
          // Pause time already captured, just keep tracking
          set({ objectiveTimer })
        }
      },

      /**
       * Calculates elapsed time using Date.now() for drift-free accuracy.
       *
       * Computes the total elapsed time by comparing current time (Date.now()) against
       * the stored start time, then subtracts any accumulated paused duration. This
       * timestamp-based calculation prevents drift that occurs with setInterval counters,
       * ensuring millisecond-accurate time tracking even during extended sessions.
       *
       * @returns Elapsed time in milliseconds, excluding paused duration
       */
      getObjectiveElapsed: () => {
        const { objectiveTimer } = get()
        if (!objectiveTimer.startedAt) return 0

        const now = Date.now()
        const totalElapsed = now - objectiveTimer.startedAt
        return totalElapsed - objectiveTimer.pausedTime
      },

      // Advanced pause/resume actions (Story 2.5 Task 9)
      captureSessionSnapshot: (snapshot: Partial<SessionSnapshot>) => {
        const { sessionSnapshot, objectiveTimer } = get()
        set({
          sessionSnapshot: {
            pausedAt: Date.now(),
            currentObjectiveIndex:
              snapshot.currentObjectiveIndex ?? sessionSnapshot?.currentObjectiveIndex ?? 0,
            studyPhase: snapshot.studyPhase ?? sessionSnapshot?.studyPhase ?? 'content',
            contentScrollPosition:
              snapshot.contentScrollPosition ?? sessionSnapshot?.contentScrollPosition ?? 0,
            cardQueuePosition:
              snapshot.cardQueuePosition ?? sessionSnapshot?.cardQueuePosition ?? 0,
            objectiveTimerState: snapshot.objectiveTimerState ?? objectiveTimer,
          },
        })
      },

      clearSessionSnapshot: () => {
        set({ sessionSnapshot: null })
      },

      hasSessionTimeout: () => {
        const { sessionSnapshot } = get()
        if (!sessionSnapshot) return false

        const now = Date.now()
        const pausedDuration = now - sessionSnapshot.pausedAt
        return pausedDuration > SESSION_TIMEOUT_MS
      },

      // Session settings actions (Story 2.5 Task 10)
      updateSettings: (newSettings: Partial<SessionSettings>) => {
        const { settings } = get()
        set({
          settings: { ...settings, ...newSettings },
        })
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS })
      },

<<<<<<< HEAD
      // Real-time orchestration actions (Story 5.3)
      initializeOrchestration: (currentPhase = 'content') => {
        const { sessionId, missionId, settings } = get()

        if (!sessionId || !settings.enableRealtimeOrchestration) {
          return
        }

        // Initialize the orchestration service
        realtimeOrchestrationService
          .initializeSession(sessionId, missionId, currentPhase)
          .then(() => {
            set({
              orchestration: {
                ...get().orchestration,
                isActive: true,
                currentPhase,
              },
            })
          })
          .catch((error) => {
            console.error('Failed to initialize orchestration:', error)
          })
      },

      recordSessionEvent: (event) => {
        const { orchestration, settings } = get()

        if (!orchestration.isActive || !settings.enableRealtimeOrchestration) {
          return
        }

        const fullEvent: SessionEvent = {
          ...event,
          timestamp: new Date(),
        }

        // Record event in orchestration service
        realtimeOrchestrationService.recordEvent(fullEvent)

        // Update last event in state
        set({
          orchestration: {
            ...orchestration,
            lastEvent: fullEvent,
            orchestrationHistory: {
              ...orchestration.orchestrationHistory,
              totalInteractions: orchestration.orchestrationHistory.totalInteractions + 1,
            },
          },
        })
      },

      updateCurrentPhase: (phase) => {
        const { orchestration } = get()

        if (!orchestration.isActive) {
          return
        }

        set({
          orchestration: {
            ...orchestration,
            currentPhase: phase,
          },
        })

        // Record phase change event
        get().recordSessionEvent({
          type: phase === 'break' ? 'pause' : 'resume',
          data: {},
        })
      },

      setBreakRecommendation: (recommendation) => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            currentRecommendation: {
              ...orchestration.currentRecommendation,
              break: recommendation,
            },
          },
        })
      },

      setContentAdaptation: (adaptation) => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            currentRecommendation: {
              ...orchestration.currentRecommendation,
              content: adaptation,
            },
          },
        })
      },

      setSessionRecommendation: (recommendation) => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            currentRecommendation: {
              ...orchestration.currentRecommendation,
              session: recommendation,
            },
          },
        })
      },

      handleBreakTaken: () => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            currentRecommendation: {
              ...orchestration.currentRecommendation,
              break: null,
            },
            orchestrationHistory: {
              ...orchestration.orchestrationHistory,
              breaksTaken: orchestration.orchestrationHistory.breaksTaken + 1,
            },
          },
        })

        // Update phase to break
        get().updateCurrentPhase('break')
      },

      handleContentAdaptation: (accepted) => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            currentRecommendation: {
              ...orchestration.currentRecommendation,
              content: null,
            },
            orchestrationHistory: {
              ...orchestration.orchestrationHistory,
              contentAdaptationsAccepted: accepted
                ? orchestration.orchestrationHistory.contentAdaptationsAccepted + 1
                : orchestration.orchestrationHistory.contentAdaptationsAccepted,
            },
          },
        })
      },

      handleSessionRecommendation: (accepted) => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            currentRecommendation: {
              ...orchestration.currentRecommendation,
              session: null,
            },
            orchestrationHistory: {
              ...orchestration.orchestrationHistory,
              sessionRecommendationsAccepted: accepted
                ? orchestration.orchestrationHistory.sessionRecommendationsAccepted + 1
                : orchestration.orchestrationHistory.sessionRecommendationsAccepted,
            },
          },
        })
      },

      updatePerformanceMetrics: (metrics) => {
        const { orchestration } = get()

        set({
          orchestration: {
            ...orchestration,
            performanceMetrics: {
              ...orchestration.performanceMetrics,
              ...metrics,
            },
          },
        })
      },

      cleanupOrchestration: () => {
        realtimeOrchestrationService.cleanup()

        set({
          orchestration: DEFAULT_ORCHESTRATION_STATE,
=======
      // Clinical scenario tracking (Story 4.2 Task 7)
      incrementObjectivesCompleted: () => {
        const { objectivesCompletedSinceScenario } = get()
        set({ objectivesCompletedSinceScenario: objectivesCompletedSinceScenario + 1 })
      },

      resetScenarioCounter: () => {
        set({ objectivesCompletedSinceScenario: 0 })
      },

      // Adaptive assessment tracking (Story 4.5 Task 12.7)
      setAdaptiveSessionId: (adaptiveSessionId: string | null) => {
        set({ adaptiveSessionId })
      },

      setAdaptiveMetrics: (score: number, questionsAsked: number, efficiency: number) => {
        set({
          adaptiveScore: score,
          adaptiveQuestionsAsked: questionsAsked,
          adaptiveEfficiency: efficiency,
        })
      },

      clearAdaptiveMetrics: () => {
        set({
          adaptiveSessionId: null,
          adaptiveScore: null,
          adaptiveQuestionsAsked: 0,
          adaptiveEfficiency: null,
>>>>>>> origin/main
        })
      },
    }),
    {
      name: 'study-session-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

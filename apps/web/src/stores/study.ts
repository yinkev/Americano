/**
 * Study Store
 *
 * Manages study session state including:
 * - Active session tracking
 * - Current question index
 * - Session timer state
 * - Interruption recovery data
 * - Session preferences (difficulty, question types)
 *
 * Features:
 * - Partial persistence for recovery
 * - Timer state preservation
 * - Session interruption handling
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'mixed'
export type QuestionType = 'mcq' | 'sba' | 'clinical-case' | 'mixed'
export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed'

interface StudySession {
  id: string
  startedAt: number
  pausedAt?: number
  totalPausedTime: number
  questionIds: string[]
  currentIndex: number
  answers: Record<string, string | string[]>
  timePerQuestion: Record<string, number>
}

interface StudyPreferences {
  difficulty: DifficultyLevel
  questionTypes: QuestionType[]
  questionsPerSession: number
  showExplanations: boolean
  enableTimer: boolean
  timerDuration: number // seconds per question
}

interface StudyState {
  // Session state (partially persisted for recovery)
  activeSession: StudySession | null
  sessionStatus: SessionStatus
  elapsedTime: number // current question elapsed time in ms
  lastActiveAt: number | null

  // Preferences (persisted)
  preferences: StudyPreferences

  // Actions
  startSession: (id: string, questionIds: string[], preferences?: Partial<StudyPreferences>) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => void
  abandonSession: () => void
  nextQuestion: () => void
  previousQuestion: () => void
  goToQuestion: (index: number) => void
  answerQuestion: (questionId: string, answer: string | string[]) => void
  updateElapsedTime: (timeMs: number) => void
  updatePreferences: (preferences: Partial<StudyPreferences>) => void
  recoverSession: () => StudySession | null
}

const defaultPreferences: StudyPreferences = {
  difficulty: 'mixed',
  questionTypes: ['mixed'],
  questionsPerSession: 20,
  showExplanations: true,
  enableTimer: false,
  timerDuration: 90,
}

export const useStudyStore = create<StudyState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activeSession: null,
        sessionStatus: 'idle',
        elapsedTime: 0,
        lastActiveAt: null,
        preferences: defaultPreferences,

        // Session lifecycle
        startSession: (id, questionIds, preferences) =>
          set(
            {
              activeSession: {
                id,
                startedAt: Date.now(),
                totalPausedTime: 0,
                questionIds,
                currentIndex: 0,
                answers: {},
                timePerQuestion: {},
              },
              sessionStatus: 'active',
              elapsedTime: 0,
              lastActiveAt: Date.now(),
              preferences: preferences
                ? { ...get().preferences, ...preferences }
                : get().preferences,
            },
            false,
            'study/startSession',
          ),

        pauseSession: () => {
          const session = get().activeSession
          if (!session) return

          set(
            {
              activeSession: {
                ...session,
                pausedAt: Date.now(),
              },
              sessionStatus: 'paused',
              lastActiveAt: Date.now(),
            },
            false,
            'study/pauseSession',
          )
        },

        resumeSession: () => {
          const session = get().activeSession
          if (!session || !session.pausedAt) return

          const pausedDuration = Date.now() - session.pausedAt

          set(
            {
              activeSession: {
                ...session,
                pausedAt: undefined,
                totalPausedTime: session.totalPausedTime + pausedDuration,
              },
              sessionStatus: 'active',
              lastActiveAt: Date.now(),
            },
            false,
            'study/resumeSession',
          )
        },

        completeSession: () =>
          set(
            {
              sessionStatus: 'completed',
              lastActiveAt: Date.now(),
            },
            false,
            'study/completeSession',
          ),

        abandonSession: () =>
          set(
            {
              activeSession: null,
              sessionStatus: 'idle',
              elapsedTime: 0,
              lastActiveAt: null,
            },
            false,
            'study/abandonSession',
          ),

        // Navigation
        nextQuestion: () => {
          const session = get().activeSession
          if (!session) return

          const currentQuestionId = session.questionIds[session.currentIndex]
          const newIndex = Math.min(session.currentIndex + 1, session.questionIds.length - 1)

          set(
            {
              activeSession: {
                ...session,
                currentIndex: newIndex,
                timePerQuestion: {
                  ...session.timePerQuestion,
                  [currentQuestionId]:
                    (session.timePerQuestion[currentQuestionId] || 0) + get().elapsedTime,
                },
              },
              elapsedTime: 0,
            },
            false,
            'study/nextQuestion',
          )
        },

        previousQuestion: () => {
          const session = get().activeSession
          if (!session) return

          set(
            {
              activeSession: {
                ...session,
                currentIndex: Math.max(session.currentIndex - 1, 0),
              },
              elapsedTime: 0,
            },
            false,
            'study/previousQuestion',
          )
        },

        goToQuestion: (index) => {
          const session = get().activeSession
          if (!session) return

          set(
            {
              activeSession: {
                ...session,
                currentIndex: Math.max(0, Math.min(index, session.questionIds.length - 1)),
              },
              elapsedTime: 0,
            },
            false,
            'study/goToQuestion',
          )
        },

        answerQuestion: (questionId, answer) => {
          const session = get().activeSession
          if (!session) return

          set(
            {
              activeSession: {
                ...session,
                answers: {
                  ...session.answers,
                  [questionId]: answer,
                },
              },
            },
            false,
            'study/answerQuestion',
          )
        },

        updateElapsedTime: (timeMs) =>
          set({ elapsedTime: timeMs }, false, 'study/updateElapsedTime'),

        updatePreferences: (preferences) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...preferences },
            }),
            false,
            'study/updatePreferences',
          ),

        recoverSession: () => {
          const session = get().activeSession
          const lastActive = get().lastActiveAt

          // Only recover if session is less than 24 hours old
          if (session && lastActive && Date.now() - lastActive < 24 * 60 * 60 * 1000) {
            return session
          }

          return null
        },
      }),
      {
        name: 'study-storage',
        version: 1,
        // Persist session for recovery and preferences
        partialize: (state) => ({
          activeSession: state.activeSession,
          lastActiveAt: state.lastActiveAt,
          preferences: state.preferences,
        }),
        // Skip hydration initially, manually rehydrate after check
        skipHydration: false,
      },
    ),
    {
      name: 'StudyStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)

// Selectors
export const selectActiveSession = (state: StudyState) => state.activeSession
export const selectSessionStatus = (state: StudyState) => state.sessionStatus
export const selectCurrentQuestion = (state: StudyState) => {
  if (!state.activeSession) return null
  return state.activeSession.questionIds[state.activeSession.currentIndex]
}
export const selectProgress = (state: StudyState) => {
  if (!state.activeSession) return null
  return {
    current: state.activeSession.currentIndex + 1,
    total: state.activeSession.questionIds.length,
    percentage:
      ((state.activeSession.currentIndex + 1) / state.activeSession.questionIds.length) * 100,
  }
}
export const selectPreferences = (state: StudyState) => state.preferences
export const selectElapsedTime = (state: StudyState) => state.elapsedTime

/**
 * Study Session Hook
 *
 * High-level hook for managing study sessions with timer and state management.
 *
 * Features:
 * - Session lifecycle management
 * - Automatic timer updates
 * - Interruption recovery
 * - Progress tracking
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { DifficultyLevel, QuestionType } from '@/stores/study'
import { useStudyStore } from '@/stores/study'

export function useStudySession() {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Store state
  const activeSession = useStudyStore((state) => state.activeSession)
  const sessionStatus = useStudyStore((state) => state.sessionStatus)
  const elapsedTime = useStudyStore((state) => state.elapsedTime)
  const preferences = useStudyStore((state) => state.preferences)

  // Store actions
  const startSession = useStudyStore((state) => state.startSession)
  const pauseSession = useStudyStore((state) => state.pauseSession)
  const resumeSession = useStudyStore((state) => state.resumeSession)
  const completeSession = useStudyStore((state) => state.completeSession)
  const abandonSession = useStudyStore((state) => state.abandonSession)
  const nextQuestion = useStudyStore((state) => state.nextQuestion)
  const previousQuestion = useStudyStore((state) => state.previousQuestion)
  const goToQuestion = useStudyStore((state) => state.goToQuestion)
  const answerQuestion = useStudyStore((state) => state.answerQuestion)
  const updateElapsedTime = useStudyStore((state) => state.updateElapsedTime)
  const updatePreferences = useStudyStore((state) => state.updatePreferences)
  const recoverSession = useStudyStore((state) => state.recoverSession)

  // Timer logic
  useEffect(() => {
    if (sessionStatus === 'active' && preferences.enableTimer) {
      timerRef.current = setInterval(() => {
        updateElapsedTime(Date.now())
      }, 100) // Update every 100ms for smooth UI

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [sessionStatus, preferences.enableTimer, updateElapsedTime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Recovery check on mount
  useEffect(() => {
    const recovered = recoverSession()
    if (recovered) {
      console.log('Recovered study session:', recovered.id)
    }
  }, [recoverSession])

  // Session progress
  const progress = activeSession
    ? {
        current: activeSession.currentIndex + 1,
        total: activeSession.questionIds.length,
        percentage: ((activeSession.currentIndex + 1) / activeSession.questionIds.length) * 100,
      }
    : null

  // Current question
  const currentQuestion = activeSession
    ? activeSession.questionIds[activeSession.currentIndex]
    : null

  // Answered questions count
  const answeredCount = activeSession ? Object.keys(activeSession.answers).length : 0

  // Time stats
  const totalTime = activeSession
    ? Date.now() - activeSession.startedAt - activeSession.totalPausedTime
    : 0

  const averageTimePerQuestion = activeSession ? totalTime / (activeSession.currentIndex + 1) : 0

  // Wrapped start session with type safety
  const start = useCallback(
    (
      questionIds: string[],
      options?: {
        difficulty?: DifficultyLevel
        questionTypes?: QuestionType[]
        questionsPerSession?: number
      },
    ) => {
      const sessionId = `session-${Date.now()}`
      startSession(sessionId, questionIds, options)
    },
    [startSession],
  )

  return {
    // State
    activeSession,
    sessionStatus,
    currentQuestion,
    progress,
    elapsedTime,
    preferences,

    // Stats
    answeredCount,
    totalTime,
    averageTimePerQuestion,

    // Actions
    start,
    pause: pauseSession,
    resume: resumeSession,
    complete: completeSession,
    abandon: abandonSession,
    next: nextQuestion,
    previous: previousQuestion,
    goToQuestion,
    answer: answerQuestion,
    updatePreferences,

    // Utilities
    isActive: sessionStatus === 'active',
    isPaused: sessionStatus === 'paused',
    isCompleted: sessionStatus === 'completed',
    canRecover: recoverSession() !== null,
  }
}

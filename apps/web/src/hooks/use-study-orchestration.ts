/**
 * Study Orchestration Hook
 * Story 5.3: Real-time session orchestration integration
 *
 * Provides a simple interface for components to integrate with the
 * real-time orchestration system. Handles performance monitoring,
 * event recording, and adaptation recommendations.
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSessionStore } from '@/store/use-session-store'
import { usePerformanceMonitoring, type PerformanceMetrics } from './use-performance-monitoring'
import { realtimeOrchestrationService } from '@/services/realtime-orchestration'

interface StudyOrchestrationOptions {
  enabled?: boolean
  autoRecord?: boolean
  sensitivity?: 'low' | 'medium' | 'high'
}

export function useStudyOrchestration(options: StudyOrchestrationOptions = {}) {
  const { enabled = true, autoRecord = true, sensitivity = 'medium' } = options

  const {
    orchestration,
    sessionId,
    currentObjective,
    settings,
    updateCurrentPhase,
    setBreakRecommendation,
    setContentAdaptation,
    setSessionRecommendation,
    handleBreakTaken,
    handleContentAdaptation,
    handleSessionRecommendation,
  } = useSessionStore()

  const performanceMonitoring = usePerformanceMonitoring({
    enabled: enabled && settings.enableRealtimeOrchestration,
    trackingWindow:
      sensitivity === 'high'
        ? 10 * 60 * 1000
        : // 10 minutes for high sensitivity
          sensitivity === 'low'
          ? 20 * 60 * 1000
          : // 20 minutes for low sensitivity
            15 * 60 * 1000, // 15 minutes default
    minSampleSize: sensitivity === 'high' ? 3 : sensitivity === 'low' ? 7 : 5,
  })

  const lastCheckTime = useRef<number>(Date.now())
  const checkInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize orchestration when session starts
  useEffect(() => {
    if (sessionId && enabled && settings.enableRealtimeOrchestration && !orchestration.isActive) {
      realtimeOrchestrationService
        .initializeSession(sessionId, undefined, 'content')
        .then(() => {
          updateCurrentPhase('content')
        })
        .catch((error) => {
          console.error('Failed to initialize orchestration:', error)
        })
    }
  }, [
    sessionId,
    enabled,
    settings.enableRealtimeOrchestration,
    orchestration.isActive,
    updateCurrentPhase,
  ])

  // Periodic performance checks and adaptation triggers
  useEffect(() => {
    if (!enabled || !sessionId || !orchestration.isActive) {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
        checkInterval.current = null
      }
      return
    }

    const checkIntervalMs =
      sensitivity === 'high'
        ? 30000
        : // 30 seconds for high sensitivity
          sensitivity === 'low'
          ? 120000
          : // 2 minutes for low sensitivity
            60000 // 1 minute default

    checkInterval.current = setInterval(() => {
      checkPerformanceAndTriggerAdaptations()
    }, checkIntervalMs)

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
        checkInterval.current = null
      }
    }
  }, [
    enabled,
    sessionId,
    orchestration.isActive,
    sensitivity,
    checkPerformanceAndTriggerAdaptations,
  ])

  // Check performance and trigger adaptations
  const checkPerformanceAndTriggerAdaptations = useCallback(() => {
    if (!sessionId || !orchestration.isActive) return

    const metrics = performanceMonitoring.getCurrentMetrics()
    const isStruggling = performanceMonitoring.isStruggling()
    const isExcelling = performanceMonitoring.isExcelling()

    // Update performance metrics in store
    updateCurrentPhase(orchestration.currentPhase)

    // Check for break recommendations
    if (shouldRecommendBreak(metrics, isStruggling)) {
      const breakRecommendation = generateBreakRecommendation(metrics, isStruggling)
      setBreakRecommendation(breakRecommendation)
      // The UI component will handle showing the dialog
    }

    // Check for content adaptations
    if (shouldRecommendContentAdaptation(metrics, isStruggling, isExcelling)) {
      const adaptation = generateContentAdaptation(metrics, isStruggling, isExcelling)
      setContentAdaptation(adaptation)
      // The UI component will handle showing the dialog
    }

    // Check for session recommendations
    if (shouldRecommendSessionExtension(metrics, isExcelling)) {
      const recommendation = generateSessionRecommendation(metrics, isExcelling)
      setSessionRecommendation(recommendation)
      // The UI component will handle showing the dialog
    }

    lastCheckTime.current = Date.now()
  }, [
    sessionId,
    orchestration.isActive,
    orchestration.currentPhase,
    performanceMonitoring,
    updateCurrentPhase,
    shouldRecommendBreak,
    generateBreakRecommendation,
    setBreakRecommendation,
    shouldRecommendContentAdaptation,
    generateContentAdaptation,
    setContentAdaptation,
    shouldRecommendSessionExtension,
    generateSessionRecommendation,
    setSessionRecommendation,
  ])

  // Determine if break should be recommended
  const shouldRecommendBreak = useCallback(
    (metrics: PerformanceMetrics, isStruggling: boolean): boolean => {
      const sessionDuration = performanceMonitoring.sessionDuration
      const timeSinceLastBreak = sessionDuration // Simplified - would track actual breaks

      return (
        isStruggling ||
        metrics.fatigueIndicator > 75 ||
        metrics.trend === 'declining' ||
        timeSinceLastBreak > 45 * 60 * 1000 // 45 minutes
      )
    },
    [performanceMonitoring],
  )

  // Generate break recommendation
  const generateBreakRecommendation = useCallback(
    (metrics: PerformanceMetrics, isStruggling: boolean): any => {
      const urgency = isStruggling || metrics.fatigueIndicator > 80 ? 'high' : 'medium'
      const type = isStruggling
        ? 'performance_drop'
        : metrics.fatigueIndicator > 70
          ? 'fatigue_detected'
          : 'scheduled'

      return {
        type,
        urgency,
        message: isStruggling
          ? `Performance declining (accuracy: ${metrics.recentAccuracy}%). Take a break?`
          : metrics.fatigueIndicator > 70
            ? `Fatigue level at ${metrics.fatigueIndicator}%. Consider a break.`
            : `Regular break recommended to maintain focus.`,
        estimatedBreakDuration: 5,
        canPostpone: true,
        canSkip: urgency !== 'high',
        reason: isStruggling ? 'Performance decline detected' : 'Scheduled break time',
      }
    },
    [],
  )

  // Determine if content adaptation should be recommended
  const shouldRecommendContentAdaptation = useCallback(
    (metrics: PerformanceMetrics, isStruggling: boolean, isExcelling: boolean): boolean => {
      return (
        isStruggling ||
        isExcelling ||
        metrics.trend === 'declining' ||
        (metrics.trend === 'improving' && metrics.recentAccuracy > 85)
      )
    },
    [],
  )

  // Generate content adaptation
  const generateContentAdaptation = useCallback(
    (metrics: PerformanceMetrics, isStruggling: boolean, isExcelling: boolean): any => {
      if (isStruggling) {
        return {
          type: 'difficulty_adjust',
          recommendation: 'Try easier content to rebuild confidence',
          reason: `Performance below optimal (accuracy: ${metrics.recentAccuracy}%)`,
          userChoice: 'postpone',
        }
      }

      if (isExcelling) {
        return {
          type: 'difficulty_adjust',
          recommendation: 'Try more challenging content',
          reason: `Excellent performance (accuracy: ${metrics.recentAccuracy}%) - ready for next level`,
          userChoice: 'postpone',
        }
      }

      return {
        type: 'content_switch',
        recommendation: 'Try different content format',
        reason: 'Variety in content format can improve engagement',
        userChoice: 'postpone',
      }
    },
    [],
  )

  // Determine if session extension should be recommended
  const shouldRecommendSessionExtension = useCallback(
    (metrics: PerformanceMetrics, isExcelling: boolean): boolean => {
      const sessionDuration = performanceMonitoring.sessionDuration

      return (
        (isExcelling && sessionDuration > 45 * 60 * 1000) || // 45+ minutes + excellent performance
        (metrics.fatigueIndicator < 30 && sessionDuration > 30 * 60 * 1000) // Low fatigue + 30+ minutes
      )
    },
    [performanceMonitoring],
  )

  // Generate session recommendation
  const generateSessionRecommendation = useCallback(
    (metrics: PerformanceMetrics, isExcelling: boolean): any => {
      const sessionDuration = performanceMonitoring.sessionDuration

      if (isExcelling && sessionDuration > 45 * 60 * 1000) {
        return {
          type: 'extend',
          reason: `Strong performance (${metrics.recentAccuracy}% accuracy). Consider extending session.`,
          confidence: 85,
        }
      }

      return {
        type: 'continue',
        reason: 'Continue with current plan',
        confidence: 70,
      }
    },
    [performanceMonitoring],
  )

  // Convenience methods for recording common events
  const recordAnswer = useCallback(
    (correct: boolean, responseTime?: number, confidence?: number) => {
      if (autoRecord) {
        performanceMonitoring.recordAnswer(correct, responseTime || 0, confidence)
      }
    },
    [autoRecord, performanceMonitoring],
  )

  const recordInteraction = useCallback(
    (action: string) => {
      if (autoRecord) {
        performanceMonitoring.recordInteraction(action)
      }
    },
    [autoRecord, performanceMonitoring],
  )

  const recordPhaseChange = useCallback(
    (phase: 'content' | 'cards' | 'assessment' | 'break') => {
      updateCurrentPhase(phase)
      if (autoRecord) {
        if (phase === 'break') {
          performanceMonitoring.recordPause()
        } else {
          performanceMonitoring.recordResume()
        }
      }
    },
    [autoRecord, performanceMonitoring, updateCurrentPhase],
  )

  // Handle user responses to recommendations
  const acceptBreakRecommendation = useCallback(() => {
    handleBreakTaken()
  }, [handleBreakTaken])

  const acceptContentAdaptation = useCallback(
    (selectedOption?: string) => {
      handleContentAdaptation(true)
      // TODO: Implement actual content adaptation based on selectedOption
    },
    [handleContentAdaptation],
  )

  const acceptSessionRecommendation = useCallback(
    (selectedOption?: string) => {
      handleSessionRecommendation(true)
      // TODO: Implement actual session extension/early completion
    },
    [handleSessionRecommendation],
  )

  const declineRecommendation = useCallback(
    (type: 'break' | 'content' | 'session') => {
      switch (type) {
        case 'break':
          // User declined break
          break
        case 'content':
          handleContentAdaptation(false)
          break
        case 'session':
          handleSessionRecommendation(false)
          break
      }
    },
    [handleContentAdaptation, handleSessionRecommendation],
  )

  return {
    // State
    isActive: orchestration.isActive,
    isEnabled: enabled && settings.enableRealtimeOrchestration,
    currentPhase: orchestration.currentPhase,
    performanceMetrics: performanceMonitoring.getCurrentMetrics(),

    // Recording methods
    recordAnswer,
    recordInteraction,
    recordPhaseChange,

    // Recommendation handling
    acceptBreakRecommendation,
    acceptContentAdaptation,
    acceptSessionRecommendation,
    declineRecommendation,

    // Analysis
    isStruggling: performanceMonitoring.isStruggling(),
    isExcelling: performanceMonitoring.isExcelling(),
    sessionDuration: performanceMonitoring.sessionDuration,

    // Raw monitoring hook for advanced usage
    performanceMonitoring,
  }
}

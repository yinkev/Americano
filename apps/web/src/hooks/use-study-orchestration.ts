/**
 * Study Orchestration Hook
 * Story 5.3: Real-time session orchestration integration
 *
 * Provides a simple interface for components to integrate with the
 * real-time orchestration system. Handles performance monitoring,
 * event recording, and adaptation recommendations.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { realtimeOrchestrationService } from '@/services/realtime-orchestration'
import { useSessionStore } from '@/store/use-session-store'
import { type PerformanceMetrics, usePerformanceMonitoring } from './use-performance-monitoring'

interface StudyOrchestrationOptions {
  enabled?: boolean
  autoRecord?: boolean
  sensitivity?: 'low' | 'medium' | 'high'
}

export function useStudyOrchestration(options: StudyOrchestrationOptions = {}) {
  const { enabled = true, autoRecord = true, sensitivity = 'medium' } = options

  const { sessionId, currentObjective, settings } = useSessionStore()

  // Local orchestration state; keep in sync to store for tests/consumers
  const [isActive, setIsActive] = useState<boolean>(
    Boolean(enabled && settings.enableRealtimeOrchestration),
  )
  const [currentPhase, setCurrentPhase] = useState<'content' | 'cards' | 'assessment' | 'break'>(
    'content',
  )

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

  // Check performance and trigger adaptations
  const checkPerformanceAndTriggerAdaptations = useCallback(() => {
    if (!sessionId || !isActive) return

    const metrics = performanceMonitoring.getCurrentMetrics()
    const isStruggling = performanceMonitoring.isStruggling()
    const isExcelling = performanceMonitoring.isExcelling()

    // Update performance metrics in store
    // Keep store phase in sync for integration tests/consumers expecting it on the store
    useSessionStore.setState(
      (prev) =>
        ({
          orchestration: {
            ...(prev as unknown as { orchestration?: any }).orchestration,
            isActive: true,
            currentPhase,
          },
        }) as any,
    )

    // Check for break recommendations
    if (shouldRecommendBreak(metrics, isStruggling)) {
      const breakRecommendation = generateBreakRecommendation(metrics, isStruggling)
      useSessionStore.setState(
        (prev) =>
          ({
            orchestration: {
              ...(prev as unknown as { orchestration?: any }).orchestration,
              breakRecommendation,
            },
          }) as any,
      )
      // The UI component will handle showing the dialog
    }

    // Check for content adaptations
    if (shouldRecommendContentAdaptation(metrics, isStruggling, isExcelling)) {
      const adaptation = generateContentAdaptation(metrics, isStruggling, isExcelling)
      useSessionStore.setState(
        (prev) =>
          ({
            orchestration: {
              ...(prev as unknown as { orchestration?: any }).orchestration,
              contentAdaptation: adaptation,
            },
          }) as any,
      )
      // The UI component will handle showing the dialog
    }

    // Check for session recommendations
    if (shouldRecommendSessionExtension(metrics, isExcelling)) {
      const recommendation = generateSessionRecommendation(metrics, isExcelling)
      useSessionStore.setState(
        (prev) =>
          ({
            orchestration: {
              ...(prev as unknown as { orchestration?: any }).orchestration,
              sessionRecommendation: recommendation,
            },
          }) as any,
      )
      // The UI component will handle showing the dialog
    }

    lastCheckTime.current = Date.now()
  }, [
    sessionId,
    isActive,
    currentPhase,
    performanceMonitoring,
    shouldRecommendBreak,
    generateBreakRecommendation,
    shouldRecommendContentAdaptation,
    generateContentAdaptation,
    shouldRecommendSessionExtension,
    generateSessionRecommendation,
  ])

  // Initialize orchestration when session starts
  useEffect(() => {
    if (sessionId && enabled && settings.enableRealtimeOrchestration && !isActive) {
      realtimeOrchestrationService
        .initializeSession(sessionId, undefined, 'content')
        .then(() => {
          setIsActive(true)
          setCurrentPhase('content')
          useSessionStore.setState(
            (prev) =>
              ({
                orchestration: {
                  ...(prev as unknown as { orchestration?: any }).orchestration,
                  isActive: true,
                  currentPhase: 'content',
                },
              }) as any,
          )
        })
        .catch((error) => {
          console.error('Failed to initialize orchestration:', error)
        })
    }
  }, [sessionId, enabled, settings.enableRealtimeOrchestration, isActive])

  // Periodic performance checks and adaptation triggers
  useEffect(() => {
    if (!enabled || !sessionId || !isActive) {
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
    isActive,
    sensitivity,
    checkPerformanceAndTriggerAdaptations,
  ])

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
      setCurrentPhase(phase)
      useSessionStore.setState(
        (prev) =>
          ({
            orchestration: {
              ...(prev as unknown as { orchestration?: any }).orchestration,
              isActive: true,
              currentPhase: phase,
            },
          }) as any,
      )
      if (autoRecord) {
        if (phase === 'break') {
          performanceMonitoring.recordPause()
        } else {
          performanceMonitoring.recordResume()
        }
      }
    },
    [autoRecord, performanceMonitoring],
  )

  // Handle user responses to recommendations
  const acceptBreakRecommendation = useCallback(() => {
    // For now, simply clear the recommendation and mark break taken in store shape
    useSessionStore.setState(
      (prev) =>
        ({
          orchestration: {
            ...(prev as unknown as { orchestration?: any }).orchestration,
            breakRecommendation: null,
            lastEvent: { type: 'break_taken', at: Date.now() },
          },
        }) as any,
    )
  }, [])

  const acceptContentAdaptation = useCallback((selectedOption?: string) => {
    useSessionStore.setState(
      (prev) =>
        ({
          orchestration: {
            ...(prev as unknown as { orchestration?: any }).orchestration,
            contentAdaptation: null,
            lastEvent: { type: 'content_adaptation_accepted', option: selectedOption },
          },
        }) as any,
    )
  }, [])

  const acceptSessionRecommendation = useCallback((selectedOption?: string) => {
    useSessionStore.setState(
      (prev) =>
        ({
          orchestration: {
            ...(prev as unknown as { orchestration?: any }).orchestration,
            sessionRecommendation: null,
            lastEvent: { type: 'session_recommendation_accepted', option: selectedOption },
          },
        }) as any,
    )
  }, [])

  const declineRecommendation = useCallback((type: 'break' | 'content' | 'session') => {
    useSessionStore.setState((prev) => {
      const orchestration = (prev as unknown as { orchestration?: any }).orchestration || {}
      if (type === 'break') {
        return { orchestration: { ...orchestration, breakRecommendation: null } } as any
      }
      if (type === 'content') {
        return { orchestration: { ...orchestration, contentAdaptation: null } } as any
      }
      return { orchestration: { ...orchestration, sessionRecommendation: null } } as any
    })
  }, [])

  return {
    // State
    isActive,
    isEnabled: enabled && settings.enableRealtimeOrchestration,
    currentPhase,
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

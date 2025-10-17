/**
 * Performance Monitoring Hook
 * Story 5.3 Task 2: In-session performance monitoring system
 *
 * Captures user interactions during study sessions to feed the real-time
 * orchestration system with performance data including accuracy, response times,
 * engagement patterns, and fatigue indicators.
 */

'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useSessionStore } from '@/store/use-session-store'

interface PerformanceEvent {
  type: 'answer' | 'navigation' | 'interaction' | 'pause' | 'resume'
  timestamp: number
  data: {
    correct?: boolean
    responseTime?: number
    confidence?: number
    action?: string
    objectiveId?: string
  }
}

export interface PerformanceMetrics {
  recentAccuracy: number // Last 10 answers
  avgResponseTime: number // Last 10 answers
  engagementScore: number // Based on interaction frequency
  fatigueIndicator: number // Based on session duration and performance trends
  trend: 'improving' | 'stable' | 'declining'
  interactionCount: number
  lastInteractionTime: number
}

interface UsePerformanceMonitoringOptions {
  enabled?: boolean
  trackingWindow?: number // milliseconds to look back for performance data
  minSampleSize?: number // minimum number of events needed for reliable metrics
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    enabled = true,
    trackingWindow = 15 * 60 * 1000, // 15 minutes
    minSampleSize = 5,
  } = options

  const {
    orchestration,
    recordSessionEvent,
    sessionId,
    currentObjective,
    updatePerformanceMetrics,
  } = useSessionStore()

  // Performance event history
  const performanceEvents = useRef<PerformanceEvent[]>([])
  const interactionStartTime = useRef<number>(Date.now())
  const lastActivityTime = useRef<number>(Date.now())

  // Clean old events outside tracking window
  const cleanOldEvents = useCallback(() => {
    const now = Date.now()
    performanceEvents.current = performanceEvents.current.filter(
      (event) => now - event.timestamp < trackingWindow,
    )
  }, [trackingWindow])

  // Record a performance event
  const recordEvent = useCallback(
    (event: Omit<PerformanceEvent, 'timestamp'>) => {
      if (!enabled || !sessionId || !orchestration.isActive) return

      const fullEvent: PerformanceEvent = {
        ...event,
        timestamp: Date.now(),
      }

      performanceEvents.current.push(fullEvent)
      lastActivityTime.current = Date.now()

      // Clean old events periodically
      if (performanceEvents.current.length > 50) {
        cleanOldEvents()
      }

      // Record in orchestration service
      recordSessionEvent({
        type: event.type,
        data: event.data,
      })

      // Update performance metrics
      const metrics = calculatePerformanceMetrics()
      updatePerformanceMetrics({
        currentScore: calculateOverallScore(metrics),
        trend: metrics.trend,
        fatigueLevel: metrics.fatigueIndicator,
        engagementScore: metrics.engagementScore,
      })
    },
    [
      enabled,
      sessionId,
      orchestration.isActive,
      recordSessionEvent,
      updatePerformanceMetrics,
      cleanOldEvents,
    ],
  )

  // Record an answer (correct/incorrect with response time)
  const recordAnswer = useCallback(
    (correct: boolean, responseTime: number, confidence?: number) => {
      recordEvent({
        type: 'answer',
        data: {
          correct,
          responseTime,
          confidence,
          objectiveId: currentObjective?.objectiveId,
        },
      })
    },
    [recordEvent, currentObjective?.objectiveId],
  )

  // Record user interaction (clicks, navigation, etc.)
  const recordInteraction = useCallback(
    (action: string) => {
      recordEvent({
        type: 'interaction',
        data: {
          action,
          objectiveId: currentObjective?.objectiveId,
        },
      })
    },
    [recordEvent, currentObjective?.objectiveId],
  )

  // Record navigation events
  const recordNavigation = useCallback(
    (action: string) => {
      recordEvent({
        type: 'navigation',
        data: {
          action,
          objectiveId: currentObjective?.objectiveId,
        },
      })
    },
    [recordEvent, currentObjective?.objectiveId],
  )

  // Record pause/resume events
  const recordPause = useCallback(() => {
    recordEvent({
      type: 'pause',
      data: {
        action: 'session_pause',
        objectiveId: currentObjective?.objectiveId,
      },
    })
  }, [recordEvent, currentObjective?.objectiveId])

  const recordResume = useCallback(() => {
    recordEvent({
      type: 'resume',
      data: {
        action: 'session_resume',
        objectiveId: currentObjective?.objectiveId,
      },
    })
  }, [recordEvent, currentObjective?.objectiveId])

  // Calculate current performance metrics
  const calculatePerformanceMetrics = useCallback((): PerformanceMetrics => {
    const now = Date.now()
    const recentEvents = performanceEvents.current.filter(
      (event) => now - event.timestamp < trackingWindow,
    )

    // Get answer events for accuracy and response time calculation
    const answerEvents = recentEvents.filter((event) => event.type === 'answer')

    // Calculate accuracy
    let recentAccuracy = 0
    if (answerEvents.length >= minSampleSize) {
      const correctAnswers = answerEvents.filter((event) => event.data.correct).length
      recentAccuracy = (correctAnswers / answerEvents.length) * 100
    }

    // Calculate average response time
    let avgResponseTime = 0
    if (answerEvents.length >= minSampleSize) {
      const totalTime = answerEvents.reduce((sum, event) => sum + (event.data.responseTime || 0), 0)
      avgResponseTime = totalTime / answerEvents.length
    }

    // Calculate engagement score based on interaction frequency
    const interactionEvents = recentEvents.filter(
      (event) => event.type === 'interaction' || event.type === 'navigation',
    )
    const sessionDuration = now - interactionStartTime.current
    const interactionsPerMinute =
      sessionDuration > 0 ? interactionEvents.length / (sessionDuration / 60000) : 0
    const engagementScore = Math.min(100, Math.max(0, interactionsPerMinute * 10)) // Scale to 0-100

    // Calculate fatigue indicator
    const sessionDurationMinutes = sessionDuration / 60000
    const baseFatigue = Math.min(100, (sessionDurationMinutes / 90) * 100) // 90 minutes = full fatigue

    // Performance-based fatigue (declining performance increases fatigue)
    let performanceFatigue = 0
    if (answerEvents.length >= minSampleSize * 2) {
      const firstHalf = answerEvents.slice(0, Math.floor(answerEvents.length / 2))
      const secondHalf = answerEvents.slice(Math.floor(answerEvents.length / 2))

      const firstHalfAccuracy =
        (firstHalf.filter((e) => e.data.correct).length / firstHalf.length) * 100
      const secondHalfAccuracy =
        (secondHalf.filter((e) => e.data.correct).length / secondHalf.length) * 100

      const performanceDecline = firstHalfAccuracy - secondHalfAccuracy
      performanceFatigue = Math.max(0, performanceDecline * 0.5) // Scale performance decline to fatigue
    }

    const fatigueIndicator = Math.min(100, baseFatigue + performanceFatigue)

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable'
    if (answerEvents.length >= minSampleSize * 2) {
      const recentThird = answerEvents.slice(-Math.floor(answerEvents.length / 3))
      const olderThird = answerEvents.slice(0, Math.floor(answerEvents.length / 3))

      const recentAccuracy =
        (recentThird.filter((e) => e.data.correct).length / recentThird.length) * 100
      const olderAccuracy =
        (olderThird.filter((e) => e.data.correct).length / olderThird.length) * 100

      const difference = recentAccuracy - olderAccuracy
      if (difference > 10) trend = 'improving'
      else if (difference < -10) trend = 'declining'
    }

    return {
      recentAccuracy: Math.round(recentAccuracy),
      avgResponseTime: Math.round(avgResponseTime),
      engagementScore: Math.round(engagementScore),
      fatigueIndicator: Math.round(fatigueIndicator),
      trend,
      interactionCount: interactionEvents.length,
      lastInteractionTime: lastActivityTime.current,
    }
  }, [trackingWindow, minSampleSize])

  // Calculate overall performance score (0-100)
  const calculateOverallScore = useCallback((metrics: PerformanceMetrics): number => {
    const weights = {
      accuracy: 0.4,
      speed: 0.2, // Inverse of response time
      engagement: 0.3,
      fatigue: 0.1, // Inverse of fatigue
    }

    // Convert response time to speed score (lower time = higher score)
    const speedScore = Math.max(0, 100 - (metrics.avgResponseTime / 30000) * 100) // 30s = 0 score

    // Convert fatigue to wellness score (lower fatigue = higher score)
    const wellnessScore = Math.max(0, 100 - metrics.fatigueIndicator)

    const overallScore =
      metrics.recentAccuracy * weights.accuracy +
      speedScore * weights.speed +
      metrics.engagementScore * weights.engagement +
      wellnessScore * weights.fatigue

    return Math.round(overallScore)
  }, [])

  // Get current metrics
  const getCurrentMetrics = useCallback((): PerformanceMetrics => {
    cleanOldEvents()
    return calculatePerformanceMetrics()
  }, [cleanOldEvents, calculatePerformanceMetrics])

  // Check if user appears to be struggling
  const isStruggling = useCallback((): boolean => {
    const metrics = getCurrentMetrics()
    return (
      metrics.recentAccuracy < 60 ||
      metrics.avgResponseTime > 20000 || // > 20 seconds per answer
      metrics.fatigueIndicator > 80 ||
      metrics.trend === 'declining'
    )
  }, [getCurrentMetrics])

  // Check if user appears to be excelling
  const isExcelling = useCallback((): boolean => {
    const metrics = getCurrentMetrics()
    return (
      metrics.recentAccuracy > 90 &&
      metrics.avgResponseTime < 10000 && // < 10 seconds per answer
      metrics.fatigueIndicator < 40 &&
      metrics.trend === 'improving'
    )
  }, [getCurrentMetrics])

  // Auto-cleanup old events periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      cleanOldEvents()
    }, 60000) // Clean every minute

    return () => clearInterval(cleanupInterval)
  }, [cleanOldEvents])

  // Reset monitoring when session changes
  useEffect(() => {
    if (!sessionId) {
      performanceEvents.current = []
      interactionStartTime.current = Date.now()
      lastActivityTime.current = Date.now()
    }
  }, [sessionId])

  return {
    // Recording methods
    recordAnswer,
    recordInteraction,
    recordNavigation,
    recordPause,
    recordResume,

    // Analysis methods
    getCurrentMetrics,
    isStruggling,
    isExcelling,

    // Raw data access
    performanceEvents: performanceEvents.current,
    sessionDuration: Date.now() - interactionStartTime.current,
  }
}

/**
 * Story 5.4: Cognitive Load Monitoring
 *
 * Real-time cognitive load calculation using 5-factor weighted algorithm.
 * Performance requirement: <100ms calculation time.
 *
 * Algorithm (Story 5.4 lines 424-454):
 * loadScore = (responseLatency * 0.30) + (errorRate * 0.25) + (engagementDrop * 0.20)
 *           + (performanceDecline * 0.15) + (durationStress * 0.10)
 */

import type { Prisma } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import type { StressIndicator as StressIndicatorType } from '@/types/prisma-json'

const prismaClient = prisma

// ============================================
// Types & Interfaces
// ============================================

export interface StressIndicator {
  type:
    | 'RESPONSE_LATENCY'
    | 'ERROR_RATE'
    | 'ENGAGEMENT_DROP'
    | 'PERFORMANCE_DECLINE'
    | 'DURATION_STRESS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  value: number
  contribution: number // Contribution to total load (0-100)
}

export interface CognitiveLoadScore {
  loadScore: number // 0-100 scale
  loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  stressIndicators: StressIndicator[]
  confidenceLevel: number // 0.0-1.0 based on data quality
  timestamp: Date
  sessionId?: string
  recommendations: string[]
  overloadDetected: boolean
}

export interface SessionBehavioralData {
  userId: string
  sessionId: string
  responseLatencies: number[] // milliseconds for each review
  errorRate: number // 0.0-1.0
  engagementMetrics?: {
    pauseCount: number
    pauseDurationMs: number
    cardInteractions: number
  }
  performanceScores: number[] // Recent review scores (0-1)
  sessionDuration: number // minutes
  baselineData?: {
    avgResponseLatency: number
    baselinePerformance: number
  }
}

export interface OverloadRisk {
  isOverload: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  triggeringFactors: string[]
  recommendations: string[]
}

// ============================================
// Cognitive Load Monitor Class
// ============================================

export class CognitiveLoadMonitor {
  /**
   * Calculate current cognitive load for a study session
   * Performance target: <100ms
   *
   * @param userId - User identifier
   * @param sessionId - Current study session ID
   * @param sessionData - Behavioral data from session
   * @returns Cognitive load score with indicators
   */
  async calculateCurrentLoad(
    userId: string,
    sessionId: string,
    sessionData: SessionBehavioralData,
  ): Promise<CognitiveLoadScore> {
    const startTime = performance.now()

    try {
      // Step 1: Calculate 5 factors (parallel computation)
      const responseLatencyScore = this.calculateResponseLatencyScore(sessionData)
      const errorRateScore = this.calculateErrorRateScore(sessionData)
      const engagementDropScore = this.calculateEngagementDropScore(sessionData)
      const performanceDeclineScore = this.calculatePerformanceDeclineScore(sessionData)
      const durationStressScore = this.calculateDurationStressScore(sessionData)

      // Step 2: Weighted sum (0.30 + 0.25 + 0.20 + 0.15 + 0.10 = 1.0)
      const loadScore = Math.min(
        100,
        Math.max(
          0,
          responseLatencyScore * 0.3 +
            errorRateScore * 0.25 +
            engagementDropScore * 0.2 +
            performanceDeclineScore * 0.15 +
            durationStressScore * 0.1,
        ),
      )

      // Step 3: Determine load level and detect stress indicators
      const loadLevel = this.determineLoadLevel(loadScore)
      const stressIndicators = this.detectStressIndicators(sessionData)

      // Step 4: Calculate confidence based on data quality
      const confidenceLevel = this.calculateConfidence(sessionData)

      // Step 5: Assess overload risk
      const overloadRisk = this.assessOverloadRisk(loadScore, stressIndicators)

      // Step 6: Generate recommendations
      const recommendations = this.generateRecommendations(loadScore, stressIndicators)

      // Step 7: Record metric to database (async, non-blocking)
      this.recordLoadMetric(userId, sessionId, {
        loadScore,
        stressIndicators,
        confidenceLevel,
      }).catch((err) => console.error('Failed to record cognitive load metric:', err))

      const endTime = performance.now()
      const executionTime = endTime - startTime

      if (executionTime > 100) {
        console.warn(`Cognitive load calculation exceeded 100ms: ${executionTime.toFixed(2)}ms`)
      }

      return {
        loadScore,
        loadLevel,
        stressIndicators,
        confidenceLevel,
        timestamp: new Date(),
        sessionId,
        recommendations,
        overloadDetected: overloadRisk.isOverload,
      }
    } catch (error) {
      console.error('Error calculating cognitive load:', error)
      // Return safe default on error
      return {
        loadScore: 50,
        loadLevel: 'MODERATE',
        stressIndicators: [],
        confidenceLevel: 0,
        timestamp: new Date(),
        sessionId,
        recommendations: ['Unable to calculate cognitive load - continuing with default'],
        overloadDetected: false,
      }
    }
  }

  /**
   * Detect stress indicators from behavioral session data
   *
   * @param sessionData - Session behavioral data
   * @returns Array of detected stress indicators
   */
  detectStressIndicators(sessionData: SessionBehavioralData): StressIndicator[] {
    const indicators: StressIndicator[] = []

    // Response latency indicator
    if (sessionData.responseLatencies.length > 0) {
      const avgLatency =
        sessionData.responseLatencies.reduce((a, b) => a + b, 0) /
        sessionData.responseLatencies.length
      const baselineLatency = sessionData.baselineData?.avgResponseLatency || 2000
      const latencyIncrease = (avgLatency - baselineLatency) / baselineLatency

      if (latencyIncrease > 0.15) {
        indicators.push({
          type: 'RESPONSE_LATENCY',
          severity: latencyIncrease > 0.5 ? 'HIGH' : latencyIncrease > 0.3 ? 'MEDIUM' : 'LOW',
          value: avgLatency,
          contribution: this.calculateResponseLatencyScore(sessionData),
        })
      }
    }

    // Error rate indicator
    if (sessionData.errorRate > 0.2) {
      indicators.push({
        type: 'ERROR_RATE',
        severity:
          sessionData.errorRate > 0.4 ? 'HIGH' : sessionData.errorRate > 0.3 ? 'MEDIUM' : 'LOW',
        value: sessionData.errorRate,
        contribution: this.calculateErrorRateScore(sessionData),
      })
    }

    // Engagement drop indicator
    if (sessionData.engagementMetrics) {
      const pauseRatio =
        sessionData.engagementMetrics.pauseDurationMs / (sessionData.sessionDuration * 60 * 1000)
      if (pauseRatio > 0.2) {
        indicators.push({
          type: 'ENGAGEMENT_DROP',
          severity: pauseRatio > 0.4 ? 'HIGH' : pauseRatio > 0.3 ? 'MEDIUM' : 'LOW',
          value: pauseRatio,
          contribution: this.calculateEngagementDropScore(sessionData),
        })
      }
    }

    // Performance decline indicator
    if (sessionData.performanceScores.length >= 5) {
      const recentPerf = sessionData.performanceScores.slice(-5).reduce((a, b) => a + b, 0) / 5
      const baseline = sessionData.baselineData?.baselinePerformance || 0.7
      const decline = (baseline - recentPerf) / baseline

      if (decline > 0.2) {
        indicators.push({
          type: 'PERFORMANCE_DECLINE',
          severity: decline > 0.4 ? 'HIGH' : decline > 0.3 ? 'MEDIUM' : 'LOW',
          value: decline,
          contribution: this.calculatePerformanceDeclineScore(sessionData),
        })
      }
    }

    // Duration stress indicator
    if (sessionData.sessionDuration > 60) {
      indicators.push({
        type: 'DURATION_STRESS',
        severity: sessionData.sessionDuration > 90 ? 'HIGH' : 'MEDIUM',
        value: sessionData.sessionDuration,
        contribution: this.calculateDurationStressScore(sessionData),
      })
    }

    return indicators
  }

  /**
   * Assess overload risk based on load score and indicators
   *
   * @param loadScore - Current cognitive load score (0-100)
   * @param indicators - Detected stress indicators
   * @returns Overload risk assessment
   */
  assessOverloadRisk(loadScore: number, indicators: StressIndicator[]): OverloadRisk {
    const isOverload = loadScore > 80 || indicators.filter((i) => i.severity === 'HIGH').length >= 2
    const riskLevel = this.determineRiskLevel(loadScore, indicators)
    const triggeringFactors = indicators.map((i) => `${i.type}: ${i.severity}`)
    const recommendations = this.generateRecommendations(loadScore, indicators)

    return {
      isOverload,
      riskLevel,
      triggeringFactors,
      recommendations,
    }
  }

  /**
   * Record cognitive load metric to database
   *
   * @param userId - User identifier
   * @param sessionId - Session identifier
   * @param loadData - Load calculation data
   */
  async recordLoadMetric(
    userId: string,
    sessionId: string,
    loadData: {
      loadScore: number
      stressIndicators: StressIndicator[]
      confidenceLevel: number
    },
  ): Promise<void> {
    await prismaClient.cognitiveLoadMetric.create({
      data: {
        userId,
        sessionId,
        loadScore: loadData.loadScore,
        stressIndicators: loadData.stressIndicators as unknown as Prisma.InputJsonValue,
        confidenceLevel: loadData.confidenceLevel,
      },
    })

    // Also update BehavioralEvent if cognitive overload detected
    if (loadData.loadScore > 80) {
      await prismaClient.behavioralEvent.create({
        data: {
          userId,
          eventType: 'SESSION_ENDED',
          eventData: {
            sessionId,
            loadScore: loadData.loadScore,
            overload: true,
            stressIndicators: loadData.stressIndicators,
          } as unknown as Prisma.InputJsonValue,
          timestamp: new Date(),
        },
      })
    }
  }

  // ============================================
  // Private Helper Methods (5-factor calculations)
  // ============================================

  private calculateResponseLatencyScore(data: SessionBehavioralData): number {
    if (data.responseLatencies.length === 0) return 0

    const avgLatency =
      data.responseLatencies.reduce((a, b) => a + b, 0) / data.responseLatencies.length
    const baselineLatency = data.baselineData?.avgResponseLatency || 2000 // 2 seconds default

    const increase = (avgLatency - baselineLatency) / baselineLatency

    // >50% increase = 100 score, >30% = 75, >15% = 50, >5% = 25, else 0
    if (increase > 0.5) return 100
    if (increase > 0.3) return 75
    if (increase > 0.15) return 50
    if (increase > 0.05) return 25
    return 0
  }

  private calculateErrorRateScore(data: SessionBehavioralData): number {
    // Error rate: (errors / totalAttempts) * 100
    return Math.min(100, data.errorRate * 100)
  }

  private calculateEngagementDropScore(data: SessionBehavioralData): number {
    if (!data.engagementMetrics) return 0

    const { pauseCount, pauseDurationMs, cardInteractions } = data.engagementMetrics

    // +10 per disengagement event (pause >30 seconds)
    const longPauses = pauseCount // Assume each pause is significant
    const pauseRatio = pauseDurationMs / (data.sessionDuration * 60 * 1000)

    const score = longPauses * 10 + pauseRatio * 50
    return Math.min(100, score)
  }

  private calculatePerformanceDeclineScore(data: SessionBehavioralData): number {
    if (data.performanceScores.length < 5) return 0

    const recent = data.performanceScores.slice(-5).reduce((a, b) => a + b, 0) / 5
    const baseline = data.baselineData?.baselinePerformance || 0.7

    const decline = (baseline - recent) / baseline

    // 20%+ drop = +20 points
    if (decline >= 0.2) {
      return Math.min(100, decline * 100)
    }
    return 0
  }

  private calculateDurationStressScore(data: SessionBehavioralData): number {
    // >60 min = +10, >90 min = +25
    if (data.sessionDuration > 90) return 25
    if (data.sessionDuration > 60) return 10
    return 0
  }

  private determineLoadLevel(loadScore: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
    if (loadScore < 40) return 'LOW'
    if (loadScore < 60) return 'MODERATE'
    if (loadScore < 80) return 'HIGH'
    return 'CRITICAL'
  }

  private determineRiskLevel(
    loadScore: number,
    indicators: StressIndicator[],
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const highSeverityCount = indicators.filter((i) => i.severity === 'HIGH').length

    if (loadScore > 80 || highSeverityCount >= 2) return 'CRITICAL'
    if (loadScore > 60 || highSeverityCount >= 1) return 'HIGH'
    if (loadScore > 40) return 'MEDIUM'
    return 'LOW'
  }

  private calculateConfidence(data: SessionBehavioralData): number {
    let confidence = 1.0

    // Reduce confidence if insufficient data
    if (data.responseLatencies.length < 5) confidence *= 0.7
    if (data.performanceScores.length < 5) confidence *= 0.8
    if (!data.engagementMetrics) confidence *= 0.9
    if (!data.baselineData) confidence *= 0.6

    return Math.max(0, Math.min(1, confidence))
  }

  private generateRecommendations(loadScore: number, indicators: StressIndicator[]): string[] {
    const recommendations: string[] = []

    if (loadScore > 80) {
      recommendations.push(
        'Critical cognitive overload detected - take a 10-minute break immediately',
      )
      recommendations.push('Switch to pure review mode (no new content)')
      recommendations.push('Consider ending session and resuming tomorrow')
    } else if (loadScore > 60) {
      recommendations.push('High cognitive load - reduce difficulty by 1 level')
      recommendations.push('Take a 5-minute break every 20 minutes')
      recommendations.push('Focus on review cards (80% review, 20% new)')
    } else if (loadScore > 40) {
      recommendations.push('Moderate load - maintain current difficulty')
      recommendations.push('Add minor scaffolding if needed')
      recommendations.push('Take breaks every 30 minutes')
    }

    // Specific recommendations for each indicator
    indicators.forEach((indicator) => {
      if (indicator.type === 'RESPONSE_LATENCY' && indicator.severity === 'HIGH') {
        recommendations.push('Response times increasing - simplify validation prompts')
      }
      if (indicator.type === 'ERROR_RATE' && indicator.severity === 'HIGH') {
        recommendations.push('High error rate - review prerequisite concepts')
      }
      if (indicator.type === 'DURATION_STRESS') {
        recommendations.push('Long session detected - take a longer break (15 minutes)')
      }
    })

    return [...new Set(recommendations)] // Remove duplicates
  }
}

// Export singleton instance
export const cognitiveLoadMonitor = new CognitiveLoadMonitor()

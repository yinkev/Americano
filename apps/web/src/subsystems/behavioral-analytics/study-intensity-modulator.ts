/**
 * Study Intensity Modulator
 * Story 5.3 Task 5
 *
 * Calculates cognitive load and modulates study intensity to prevent burnout
 * while optimizing learning effectiveness. Integrates with Story 5.4 cognitive load API.
 */

import { prisma } from '@/lib/db'

/**
 * Intensity recommendation with reasoning
 */
export interface IntensityRecommendation {
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
  cognitiveLoad: number // 0-100
  confidence: number // 0.0-1.0
  reasoning: string[]
  sessionModulation: {
    durationAdjustment: number // percentage (e.g., -30 for HIGH load)
    breakFrequencyIncrease: number // additional breaks
    contentComplexityReduction: boolean
  }
  recoveryRecommendation?: string // If burnout risk detected
}

/**
 * Cognitive load score from Story 5.4 API (defensive typing)
 */
interface CognitiveLoadScore {
  loadScore: number // 0-100
  loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  stressIndicators?: Array<{
    type: string
    severity: string
    value: number
  }>
  timestamp: Date
}

/**
 * Study Intensity Modulator class
 * Manages cognitive load and study intensity for optimal learning
 */
export class StudyIntensityModulator {
  /**
   * Calculate cognitive load assessment (4-factor model)
   *
   * Algorithm (if Story 5.4 API unavailable, calculate locally):
   * 1. Recent study volume (last 7 days) - volumeLoad
   *    - baselineHours = user's typical weekly hours
   *    - volumeLoad = min(100, (recentHours / baselineHours) * 50)
   * 2. Performance trend (last 5 sessions) - performanceLoad
   *    - avgPerformance = mean session performance
   *    - performanceLoad = 100 - avgPerformance
   * 3. Validation scores (comprehension depth) - comprehensionLoad
   *    - avgValidation = mean validation scores
   *    - comprehensionLoad = 100 - avgValidation
   * 4. Stress indicators (abandonment rate, pause frequency) - stressLoad
   *    - abandonmentRate = abandoned sessions / total
   *    - pauseFrequency = pauses per hour
   *    - stressLoad = (abandonmentRate * 50) + (pauseFrequency * 50)
   * 5. Weighted average: volume * 0.3 + performance * 0.3 + comprehension * 0.2 + stress * 0.2
   *
   * @param userId - User ID
   * @returns Cognitive load score (0-100)
   */
  static async assessCognitiveLoad(userId: string): Promise<number> {
    // DEFENSIVE CODING: Try Story 5.4 API first, fallback to local calculation
    try {
      const response = await fetch(`/api/analytics/cognitive-load/current?userId=${userId}`)
      if (response.ok) {
        const data = (await response.json()) as CognitiveLoadScore
        return data.loadScore
      }
    } catch (error) {
      console.warn('Story 5.4 cognitive load API unavailable, using local calculation:', error)
    }

    // Fallback: Local calculation
    // 1. Recent study volume
    const recentHours = await this.getStudyHours(userId, 7)
    const baselineHours = await this.getBaselineStudyHours(userId)
    const volumeLoad = baselineHours > 0 ? Math.min(100, (recentHours / baselineHours) * 50) : 0

    // 2. Performance trend
    const recentSessions = await this.getRecentSessions(userId, 5)
    const avgPerformance =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, s) => sum + (s.performanceScore || 50), 0) /
          recentSessions.length
        : 50
    const performanceLoad = 100 - avgPerformance

    // 3. Validation scores
    const validationScores = await this.getRecentValidationScores(userId, 7)
    const avgValidation =
      validationScores.length > 0
        ? validationScores.reduce((sum, s) => sum + s, 0) / validationScores.length
        : 0.5
    const comprehensionLoad = (1 - avgValidation) * 100

    // 4. Stress indicators
    const abandonmentRate = await this.getAbandonmentRate(userId, 7)
    const pauseFrequency = await this.getPauseFrequency(userId, 7)
    const stressLoad = abandonmentRate * 50 + pauseFrequency * 50

    // Weighted cognitive load
    const cognitiveLoad = Math.round(
      volumeLoad * 0.3 + performanceLoad * 0.3 + comprehensionLoad * 0.2 + stressLoad * 0.2,
    )

    return Math.min(100, Math.max(0, cognitiveLoad))
  }

  /**
   * Calculate intensity level from cognitive load
   *
   * Thresholds:
   * - LOW: cognitiveLoad < 40 (capacity for more challenging work)
   * - MEDIUM: cognitiveLoad 40-70 (optimal learning zone)
   * - HIGH: cognitiveLoad > 70 (reduce workload, risk of burnout)
   *
   * @param cognitiveLoad - Cognitive load score (0-100)
   * @returns Intensity level
   */
  static calculateIntensityLevel(
    cognitiveLoad: number,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (cognitiveLoad < 40) return 'LOW'
    if (cognitiveLoad <= 70) return 'MEDIUM'
    return 'HIGH'
  }

  /**
   * Generate intensity recommendation with session modulation
   *
   * @param userId - User ID
   * @returns IntensityRecommendation with session adjustments
   */
  static async recommendIntensity(userId: string): Promise<IntensityRecommendation> {
    const cognitiveLoad = await this.assessCognitiveLoad(userId)
    const intensity = this.calculateIntensityLevel(cognitiveLoad)

    const reasoning: string[] = []
    let durationAdjustment = 0
    let breakFrequencyIncrease = 0
    let contentComplexityReduction = false
    let recoveryRecommendation: string | undefined

    // Modulate session based on intensity
    if (intensity === 'LOW') {
      reasoning.push(`Low cognitive load (${cognitiveLoad}/100) - capacity for challenging work`)
      durationAdjustment = +20 // Can extend sessions by 20%
      reasoning.push('Duration: +20% (capacity available)')
    } else if (intensity === 'MEDIUM') {
      reasoning.push(`Moderate cognitive load (${cognitiveLoad}/100) - optimal learning zone`)
      reasoning.push('Duration: Standard (optimal)')
    } else {
      // HIGH intensity
      reasoning.push(`High cognitive load (${cognitiveLoad}/100) - reduce workload`)
      durationAdjustment = -40 // Reduce sessions by 40%
      breakFrequencyIncrease = 2 // Add 2 more breaks
      contentComplexityReduction = true
      reasoning.push('Duration: -40% (prevent burnout)')
      reasoning.push('Breaks: +2 additional breaks')
      reasoning.push('Content: Switch to easier review material')

      if (cognitiveLoad > 80) {
        recoveryRecommendation = 'Critical cognitive load detected. Consider taking a rest day or limiting session to 15-minute light review.'
        reasoning.push('⚠️ Burnout risk: Consider rest day')
      }
    }

    // Calculate confidence based on data quality
    const dataQuality = await this.getDataQualityScore(userId)

    return {
      intensity,
      cognitiveLoad,
      confidence: dataQuality,
      reasoning,
      sessionModulation: {
        durationAdjustment,
        breakFrequencyIncrease,
        contentComplexityReduction,
      },
      recoveryRecommendation,
    }
  }

  /**
   * Modulate session plan based on intensity
   *
   * @param userId - User ID
   * @param baseDuration - Base session duration (minutes)
   * @param baseBreakCount - Base number of breaks
   * @returns Modulated session parameters
   */
  static async modulateSessionPlan(
    userId: string,
    baseDuration: number,
    baseBreakCount: number,
  ): Promise<{
    adjustedDuration: number
    adjustedBreakCount: number
    contentDifficultyLevel: 'easy' | 'medium' | 'hard'
    reasoning: string
  }> {
    const recommendation = await this.recommendIntensity(userId)

    const adjustedDuration = Math.round(
      baseDuration * (1 + recommendation.sessionModulation.durationAdjustment / 100),
    )
    const adjustedBreakCount = baseBreakCount + recommendation.sessionModulation.breakFrequencyIncrease

    let contentDifficultyLevel: 'easy' | 'medium' | 'hard' = 'medium'
    if (recommendation.sessionModulation.contentComplexityReduction) {
      contentDifficultyLevel = 'easy'
    } else if (recommendation.intensity === 'LOW') {
      contentDifficultyLevel = 'hard'
    }

    return {
      adjustedDuration,
      adjustedBreakCount,
      contentDifficultyLevel,
      reasoning: recommendation.reasoning.join('; '),
    }
  }

  /**
   * Recommend recovery period if burnout risk detected
   *
   * @param userId - User ID
   * @returns Recovery recommendation (days off, light review, etc.)
   */
  static async recommendRecoveryPeriod(
    userId: string,
  ): Promise<{ required: boolean; daysOff: number; lightReviewOnly: boolean; message: string }> {
    const cognitiveLoad = await this.assessCognitiveLoad(userId)

    if (cognitiveLoad > 80) {
      // Critical load - mandatory recovery
      return {
        required: true,
        daysOff: 2,
        lightReviewOnly: false,
        message:
          'Critical cognitive load detected. Take 2 days off from studying to prevent burnout. Your brain needs rest to consolidate learning.',
      }
    } else if (cognitiveLoad > 70) {
      // High load - light activity only
      return {
        required: true,
        daysOff: 0,
        lightReviewOnly: true,
        message:
          'High cognitive load detected. Switch to light review sessions (15-20 min) for the next 2 days. Avoid new material.',
      }
    }

    return {
      required: false,
      daysOff: 0,
      lightReviewOnly: false,
      message: 'Cognitive load is manageable. Continue with regular study schedule.',
    }
  }

  // Helper methods for cognitive load calculation

  private static async getStudyHours(userId: string, days: number): Promise<number> {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - days)

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: minDate },
        completedAt: { not: null },
      },
      select: { durationMs: true },
    })

    return sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0) / (1000 * 60 * 60)
  }

  private static async getBaselineStudyHours(userId: string): Promise<number> {
    // Get average weekly hours from past 4 weeks
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: fourWeeksAgo },
        completedAt: { not: null },
      },
      select: { durationMs: true },
    })

    const totalHours = sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0) / (1000 * 60 * 60)
    return totalHours / 4 // Average per week
  }

  private static async getRecentSessions(
    userId: string,
    count: number,
  ): Promise<Array<{ performanceScore: number }>> {
    const sessions = await prisma.behavioralEvent.findMany({
      where: {
        userId,
        eventType: 'SESSION_ENDED',
        sessionPerformanceScore: { not: null },
      },
      select: { sessionPerformanceScore: true },
      orderBy: { timestamp: 'desc' },
      take: count,
    })

    return sessions.map((s) => ({ performanceScore: s.sessionPerformanceScore || 50 }))
  }

  private static async getRecentValidationScores(userId: string, days: number): Promise<number[]> {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - days)

    const validations = await prisma.validationResponse.findMany({
      where: {
        session: { userId },
        respondedAt: { gte: minDate },
      },
      select: { score: true },
    })

    return validations.map((v) => v.score)
  }

  private static async getAbandonmentRate(userId: string, days: number): Promise<number> {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - days)

    const total = await prisma.studySession.count({
      where: {
        userId,
        startedAt: { gte: minDate },
      },
    })

    const abandoned = await prisma.studySession.count({
      where: {
        userId,
        startedAt: { gte: minDate },
        completedAt: null,
      },
    })

    return total > 0 ? abandoned / total : 0
  }

  private static async getPauseFrequency(userId: string, days: number): Promise<number> {
    // Simplified: Use session duration vs actual time as proxy for pauses
    // In production, would track actual pause events
    return 0.2 // Placeholder
  }

  private static async getDataQualityScore(userId: string): Promise<number> {
    const profile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })
    return profile?.dataQualityScore || 0.5
  }
}

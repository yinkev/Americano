/**
 * Session Duration Optimizer
 * Story 5.3 Task 3
 *
 * Optimizes study session duration and break schedules based on user attention cycles,
 * mission complexity, time-of-day performance, and recent study load.
 */

import { prisma } from '@/lib/db'
import { StudyTimeAnalyzer, type AttentionCyclePattern } from './study-time-analyzer'

/**
 * Duration recommendation with min/max bounds
 */
export interface DurationRecommendation {
  recommendedDuration: number // minutes
  minDuration: number
  maxDuration: number
  breaks: BreakSchedule
  confidence: number // 0.0-1.0
  reasoning: string[]
}

/**
 * Personalized break schedule
 */
export interface BreakSchedule {
  breakIntervals: number[] // Minutes into session [25, 50, 75]
  breakDurations: number[] // Duration in minutes [5, 5, 10]
  totalBreakTime: number // Sum of all breaks
  reasoning: string // "Based on your 25-min attention cycle"
}

/**
 * Session Duration Optimizer class
 * Calculates optimal session lengths and break schedules
 */
export class SessionDurationOptimizer {
  /**
   * Recommend optimal session duration based on user patterns and context
   *
   * Algorithm:
   * 1. Get baseline duration from UserLearningProfile.optimalSessionDuration
   * 2. Adjust for mission complexity:
   *    - BASIC: -10 min
   *    - INTERMEDIATE: 0 (baseline)
   *    - ADVANCED: +15 min
   * 3. Adjust for time-of-day (isPeakHour multiplier):
   *    - Peak hour (top 3 from Study Time Analyzer): * 1.2
   *    - Non-peak: * 0.9
   * 4. Adjust for recent study load (last 7 days):
   *    - If > 20 hours: * 0.85 (fatigue protection)
   *    - If < 5 hours: * 1.1 (capacity available)
   * 5. Calculate break schedule based on attention cycles
   * 6. Return min/max bounds (±20% of recommended)
   *
   * @param userId - User ID
   * @param missionComplexity - Mission difficulty level
   * @param startTime - Planned session start time
   * @returns DurationRecommendation with breaks
   */
  static async recommendDuration(
    userId: string,
    missionComplexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED',
    startTime: Date,
  ): Promise<DurationRecommendation> {
    // 1. Get baseline duration from user profile
    const userProfile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    let baseDuration = userProfile?.optimalSessionDuration || 45 // Default 45 min

    const reasoning: string[] = []
    reasoning.push(`Base duration: ${baseDuration} min (from your profile)`)

    // 2. Adjust for mission complexity
    const complexityAdjustments = {
      BASIC: -10,
      INTERMEDIATE: 0,
      ADVANCED: +15,
    }
    baseDuration += complexityAdjustments[missionComplexity]
    if (complexityAdjustments[missionComplexity] !== 0) {
      reasoning.push(
        `Complexity adjustment: ${complexityAdjustments[missionComplexity] > 0 ? '+' : ''}${complexityAdjustments[missionComplexity]} min (${missionComplexity} content)`,
      )
    }

    // 3. Check if start time is a peak performance hour
    const hour = startTime.getHours()
    const peakHours = await this.getPeakPerformanceHours(userId)
    const isPeakHour = peakHours.includes(hour)

    if (isPeakHour) {
      baseDuration = Math.round(baseDuration * 1.2)
      reasoning.push('Peak performance hour: +20% duration')
    } else {
      baseDuration = Math.round(baseDuration * 0.9)
      reasoning.push('Non-peak hour: -10% duration')
    }

    // 4. Adjust for recent study load
    const recentLoad = await this.getRecentStudyLoad(userId, 7)

    if (recentLoad > 20) {
      baseDuration = Math.round(baseDuration * 0.85)
      reasoning.push(`High study load (${Math.round(recentLoad)} hrs this week): -15% duration for recovery`)
    } else if (recentLoad < 5) {
      baseDuration = Math.round(baseDuration * 1.1)
      reasoning.push(`Low study load (${Math.round(recentLoad)} hrs this week): +10% duration (capacity available)`)
    }

    // 5. Calculate break schedule
    const breakSchedule = await this.calculateBreakSchedule(userId, baseDuration)

    // 6. Calculate confidence based on data quality
    const confidence = userProfile?.dataQualityScore || 0.5

    return {
      recommendedDuration: baseDuration,
      minDuration: Math.round(baseDuration * 0.8),
      maxDuration: Math.round(baseDuration * 1.2),
      breaks: breakSchedule,
      confidence,
      reasoning,
    }
  }

  /**
   * Calculate personalized break schedule based on attention cycles
   *
   * Algorithm (Pomodoro-inspired but personalized):
   * 1. Get user's attention cycle pattern from Story 5.1
   * 2. If no data, use default 25-min intervals
   * 3. Place breaks at intervals matching attention cycle
   * 4. Break durations: 5 min for short breaks, 10 min for long breaks (every 4th)
   * 5. Total break time should be 15-20% of session duration
   *
   * @param userId - User ID
   * @param sessionDuration - Total session duration in minutes
   * @returns BreakSchedule with intervals and durations
   */
  static async calculateBreakSchedule(
    userId: string,
    sessionDuration: number,
  ): Promise<BreakSchedule> {
    // Get user's attention cycle pattern
    const attentionCycles = await StudyTimeAnalyzer.identifyAttentionCycles(userId)
    const attentionCycle = attentionCycles[0]

    // Default to 25-min intervals if no data
    const breakInterval = attentionCycle?.optimalBreakInterval || 25

    // Calculate number of breaks
    const numBreaks = Math.floor(sessionDuration / breakInterval)

    const breakIntervals: number[] = []
    const breakDurations: number[] = []

    for (let i = 1; i <= numBreaks; i++) {
      const intervalTime = i * breakInterval
      if (intervalTime < sessionDuration) {
        breakIntervals.push(intervalTime)
        // Every 4th break is longer (10 min), others are 5 min
        breakDurations.push(i % 4 === 0 ? 10 : 5)
      }
    }

    const totalBreakTime = breakDurations.reduce((sum, d) => sum + d, 0)

    const reasoning = attentionCycle
      ? `Based on your ${Math.round(breakInterval)}-min attention cycle (detected from ${attentionCycle.avgSessionDuration.toFixed(0)}-min avg sessions)`
      : 'Using research-based 25-min intervals (complete more sessions to personalize)'

    return {
      breakIntervals,
      breakDurations,
      totalBreakTime,
      reasoning,
    }
  }

  /**
   * Get peak performance hours for a user
   */
  private static async getPeakPerformanceHours(userId: string): Promise<number[]> {
    const patterns = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId, 6)
    return patterns.slice(0, 3).map((p) => p.hourOfDay) // Top 3 hours
  }

  /**
   * Get recent study load in hours
   */
  private static async getRecentStudyLoad(userId: string, days: number): Promise<number> {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - days)

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: { gte: minDate },
        completedAt: { not: null },
      },
      select: {
        durationMs: true,
      },
    })

    const totalMs = sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0)
    return totalMs / (1000 * 60 * 60) // Convert to hours
  }

  /**
   * Detect fatigue during session and recommend duration adjustment
   *
   * @param userId - User ID
   * @param currentSessionId - Current session ID
   * @param elapsedMinutes - Minutes elapsed in current session
   * @returns Recommended adjustment (in minutes, can be negative)
   */
  static async detectFatigueAndAdjust(
    userId: string,
    currentSessionId: string,
    elapsedMinutes: number,
  ): Promise<{ adjustment: number; reason: string }> {
    // Get current session reviews to calculate real-time performance
    const session = await prisma.studySession.findUnique({
      where: { id: currentSessionId },
      include: {
        reviews: {
          orderBy: { reviewedAt: 'asc' },
        },
      },
    })

    if (!session || session.reviews.length < 5) {
      return { adjustment: 0, reason: 'Insufficient data for fatigue detection' }
    }

    // Calculate performance in last 10 minutes vs first 10 minutes
    const sessionStart = session.startedAt.getTime()
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000
    const firstTenMinutes = sessionStart + 10 * 60 * 1000

    const recentReviews = session.reviews.filter((r) => r.reviewedAt.getTime() >= tenMinutesAgo)
    const earlyReviews = session.reviews.filter(
      (r) =>
        r.reviewedAt.getTime() >= sessionStart && r.reviewedAt.getTime() <= firstTenMinutes,
    )

    if (recentReviews.length < 3 || earlyReviews.length < 3) {
      return { adjustment: 0, reason: 'Insufficient review data' }
    }

    // Calculate accuracy
    const recentAccuracy =
      recentReviews.filter((r) => r.rating === 'GOOD' || r.rating === 'EASY').length /
      recentReviews.length
    const earlyAccuracy =
      earlyReviews.filter((r) => r.rating === 'GOOD' || r.rating === 'EASY').length /
      earlyReviews.length

    // Detect 20%+ performance drop (fatigue indicator)
    if (earlyAccuracy > 0 && recentAccuracy < earlyAccuracy * 0.8) {
      return {
        adjustment: -15, // Recommend wrapping up 15 min early
        reason: `Performance drop detected: ${Math.round(earlyAccuracy * 100)}% → ${Math.round(recentAccuracy * 100)}%`,
      }
    }

    return { adjustment: 0, reason: 'Performance stable' }
  }

  /**
   * Dynamically adjust session duration during active session
   *
   * @param userId - User ID
   * @param currentSessionId - Active session ID
   * @param originalDuration - Originally planned duration
   * @param elapsedMinutes - Minutes elapsed
   * @returns Updated duration recommendation
   */
  static async adjustDurationDynamically(
    userId: string,
    currentSessionId: string,
    originalDuration: number,
    elapsedMinutes: number,
  ): Promise<{ newDuration: number; reason: string }> {
    const fatigueCheck = await this.detectFatigueAndAdjust(userId, currentSessionId, elapsedMinutes)

    if (fatigueCheck.adjustment < 0) {
      return {
        newDuration: originalDuration + fatigueCheck.adjustment,
        reason: fatigueCheck.reason,
      }
    }

    return {
      newDuration: originalDuration,
      reason: 'Continue as planned',
    }
  }
}

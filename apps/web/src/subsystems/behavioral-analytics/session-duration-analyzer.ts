/**
 * Session Duration Analyzer
 *
 * Analyzes user study session duration patterns to identify optimal session lengths,
 * detect fatigue points, and provide personalized duration recommendations.
 *
 * Story 5.1 Task 3: Session Duration Pattern Analysis
 *
 * Algorithm:
 * - Groups sessions into duration buckets (<30, 30-40, 40-50, 50-60, 60-90, 90+ minutes)
 * - Calculates bucket score: performance (50%) + completion (30%) + (1 - fatigue) (20%)
 * - Identifies optimal duration with highest quality outcomes
 * - Accounts for mission complexity correlation (longer for ADVANCED objectives)
 */

import { prisma } from '@/lib/db'
import { ObjectiveComplexity } from '@/generated/prisma'

/**
 * Duration bucket configuration
 */
const DURATION_BUCKETS = [
  { min: 0, max: 30, label: '<30 min' },
  { min: 30, max: 40, label: '30-40 min' },
  { min: 40, max: 50, label: '40-50 min' },
  { min: 50, max: 60, label: '50-60 min' },
  { min: 60, max: 90, label: '60-90 min' },
  { min: 90, max: Infinity, label: '90+ min' },
] as const

/**
 * Minimum sessions per bucket for statistical significance
 */
const MIN_SESSIONS_PER_BUCKET = 3

/**
 * Performance degradation threshold for fatigue detection (20% drop)
 */
const FATIGUE_DEGRADATION_THRESHOLD = 0.2

/**
 * Duration bucket with performance metrics
 */
export interface DurationBucket {
  durationRange: string
  minMinutes: number
  maxMinutes: number
  sessionCount: number
  avgPerformance: number // 0-100 score
  completionRate: number // 0.0-1.0
  fatigueIndicator: number // 0.0-1.0, higher = more fatigue
  bucketScore: number // 0-100 composite score
}

/**
 * Overall duration pattern analysis result
 */
export interface DurationPattern {
  optimalBucket: DurationBucket
  allBuckets: DurationBucket[]
  recommendedDuration: number // Minutes (midpoint of optimal bucket)
  confidence: number // 0.0-1.0
  totalSessionsAnalyzed: number
}

/**
 * Optimal duration recommendation with context
 */
export interface OptimalDurationRecommendation {
  current: number // Average session duration in minutes
  recommended: number // Optimal duration from analysis
  confidence: number // 0.0-1.0
  reason: string // Explanation for recommendation
  byComplexity?: {
    [ObjectiveComplexity.BASIC]: number
    [ObjectiveComplexity.INTERMEDIATE]: number
    [ObjectiveComplexity.ADVANCED]: number
  }
}

/**
 * Fatigue analysis result
 */
export interface FatigueAnalysis {
  fatiguePoint: number | null // Minutes until performance degrades, null if not detected
  averageSessionLength: number // Minutes
  longSessionCount: number // Sessions >60 minutes
  fatigueDetected: boolean
  recommendation: string
  optimalBreakInterval: number | null // Minutes between breaks
}

/**
 * Session Duration Analyzer
 *
 * Provides analysis of study session duration patterns to optimize
 * session length recommendations and detect fatigue points.
 */
export class SessionDurationAnalyzer {
  /**
   * Analyze session duration patterns across all completed sessions
   *
   * Groups sessions into duration buckets and calculates performance metrics
   * for each bucket to identify the optimal session length.
   *
   * @param userId - User ID to analyze
   * @returns Duration pattern analysis with optimal bucket recommendation
   */
  async analyzeSessionDurationPatterns(userId: string): Promise<DurationPattern> {
    // Query all completed study sessions
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
        durationMs: { not: null },
      },
      include: {
        reviews: true,
        mission: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    if (sessions.length === 0) {
      // Return empty pattern if no sessions
      return {
        optimalBucket: {
          durationRange: '40-50 min',
          minMinutes: 40,
          maxMinutes: 50,
          sessionCount: 0,
          avgPerformance: 0,
          completionRate: 0,
          fatigueIndicator: 0,
          bucketScore: 0,
        },
        allBuckets: [],
        recommendedDuration: 45, // Default recommendation
        confidence: 0,
        totalSessionsAnalyzed: 0,
      }
    }

    // Group sessions into duration buckets
    const bucketGroups = new Map<string, typeof sessions>()

    for (const session of sessions) {
      const durationMinutes = session.durationMs! / (1000 * 60)
      const bucket = DURATION_BUCKETS.find(
        (b) => durationMinutes >= b.min && durationMinutes < b.max,
      )

      if (bucket) {
        const existing = bucketGroups.get(bucket.label) || []
        existing.push(session)
        bucketGroups.set(bucket.label, existing)
      }
    }

    // Calculate metrics for each bucket
    const bucketAnalyses: DurationBucket[] = []

    for (const bucket of DURATION_BUCKETS) {
      const bucketSessions = bucketGroups.get(bucket.label) || []

      if (bucketSessions.length < MIN_SESSIONS_PER_BUCKET) {
        // Skip buckets with insufficient data
        continue
      }

      // Calculate average performance from reviews
      const avgPerformance = this.calculateAvgPerformance(bucketSessions)

      // Calculate completion rate from objective completions
      const completionRate = this.calculateCompletionRate(bucketSessions)

      // Detect performance dropoff (fatigue indicator)
      const fatigueIndicator = await this.detectPerformanceDropoff(bucketSessions)

      // Calculate composite bucket score
      // Formula: (avgPerformance * 0.5 + completionRate * 0.3 + (1 - fatigue) * 0.2) * 100
      const bucketScore =
        (avgPerformance * 0.5 + completionRate * 100 * 0.3 + (1 - fatigueIndicator) * 100 * 0.2) *
        1.0

      bucketAnalyses.push({
        durationRange: bucket.label,
        minMinutes: bucket.min,
        maxMinutes: bucket.max === Infinity ? 120 : bucket.max,
        sessionCount: bucketSessions.length,
        avgPerformance,
        completionRate,
        fatigueIndicator,
        bucketScore,
      })
    }

    // Find optimal bucket (highest score)
    let optimalBucket = bucketAnalyses[0]
    for (const bucket of bucketAnalyses) {
      if (bucket.bucketScore > (optimalBucket?.bucketScore ?? 0)) {
        optimalBucket = bucket
      }
    }

    // If no valid buckets, return default
    if (!optimalBucket) {
      return {
        optimalBucket: {
          durationRange: '40-50 min',
          minMinutes: 40,
          maxMinutes: 50,
          sessionCount: 0,
          avgPerformance: 0,
          completionRate: 0,
          fatigueIndicator: 0,
          bucketScore: 0,
        },
        allBuckets: [],
        recommendedDuration: 45,
        confidence: 0,
        totalSessionsAnalyzed: sessions.length,
      }
    }

    // Calculate recommended duration (midpoint of optimal bucket)
    const recommendedDuration =
      optimalBucket.maxMinutes === 120 // Handle 90+ bucket
        ? 90
        : (optimalBucket.minMinutes + optimalBucket.maxMinutes) / 2

    // Calculate confidence based on total sessions analyzed
    const confidence = Math.min(1.0, sessions.length / 50)

    return {
      optimalBucket,
      allBuckets: bucketAnalyses.sort((a, b) => b.bucketScore - a.bucketScore),
      recommendedDuration: Math.round(recommendedDuration),
      confidence,
      totalSessionsAnalyzed: sessions.length,
    }
  }

  /**
   * Calculate optimal session duration with personalized recommendations
   *
   * Provides context-aware duration recommendations including current vs.
   * recommended duration, confidence level, and reasoning.
   *
   * @param userId - User ID to analyze
   * @returns Optimal duration recommendation with detailed context
   */
  async calculateOptimalDuration(userId: string): Promise<OptimalDurationRecommendation> {
    // Get overall duration pattern
    const pattern = await this.analyzeSessionDurationPatterns(userId)

    // Calculate current average session duration
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
        durationMs: { not: null },
      },
      select: {
        durationMs: true,
      },
    })

    const currentAvg =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.durationMs!, 0) / sessions.length / (1000 * 60)
        : 45 // Default to 45 minutes if no data

    // Generate reasoning
    let reason = ''
    if (pattern.confidence >= 0.7) {
      const performanceDiff = (((pattern.optimalBucket.avgPerformance - 70) / 70) * 100).toFixed(0)
      reason = `Based on ${pattern.totalSessionsAnalyzed} sessions, your ${pattern.optimalBucket.durationRange} sessions show ${performanceDiff}% better performance with ${(pattern.optimalBucket.completionRate * 100).toFixed(0)}% completion rate.`
    } else if (pattern.confidence >= 0.4) {
      reason = `Initial analysis of ${pattern.totalSessionsAnalyzed} sessions suggests ${pattern.optimalBucket.durationRange} as optimal. Complete more sessions to increase recommendation confidence.`
    } else {
      reason = `Insufficient data (${pattern.totalSessionsAnalyzed} sessions). Recommendation based on general best practices. Complete 20+ sessions for personalized analysis.`
    }

    // Calculate duration by complexity level
    const byComplexity = await this.calculateDurationByComplexity(userId)

    return {
      current: Math.round(currentAvg),
      recommended: pattern.recommendedDuration,
      confidence: pattern.confidence,
      reason,
      byComplexity,
    }
  }

  /**
   * Detect session fatigue point where performance degrades
   *
   * Analyzes long sessions (>60 minutes) to identify the point at which
   * performance begins to degrade, indicating fatigue.
   *
   * @param userId - User ID to analyze
   * @returns Fatigue analysis with detected fatigue point and recommendations
   */
  async detectSessionFatiguePoint(userId: string): Promise<FatigueAnalysis> {
    // Query long sessions (>60 minutes)
    const longSessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
        durationMs: { gte: 60 * 60 * 1000 }, // 60 minutes in milliseconds
      },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'asc',
          },
        },
      },
    })

    const allSessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null },
        durationMs: { not: null },
      },
      select: {
        durationMs: true,
      },
    })

    const averageSessionLength =
      allSessions.length > 0
        ? allSessions.reduce((sum, s) => sum + s.durationMs!, 0) / allSessions.length / (1000 * 60)
        : 45

    // Need at least 5 long sessions for meaningful analysis
    if (longSessions.length < 5) {
      return {
        fatiguePoint: null,
        averageSessionLength: Math.round(averageSessionLength),
        longSessionCount: longSessions.length,
        fatigueDetected: false,
        recommendation: `Complete ${5 - longSessions.length} more sessions longer than 60 minutes to enable fatigue point detection.`,
        optimalBreakInterval: null,
      }
    }

    // Analyze performance degradation within each long session
    const fatiguePoints: number[] = []

    for (const session of longSessions) {
      if (session.reviews.length < 10) continue // Need enough reviews to detect trend

      // Split reviews into 10-minute segments
      const sessionStart = session.startedAt.getTime()
      const segments: Array<{ minuteMark: number; performance: number }> = []

      for (let minute = 10; minute <= session.durationMs! / (1000 * 60); minute += 10) {
        const segmentEnd = sessionStart + minute * 60 * 1000
        const reviewsInSegment = session.reviews.filter(
          (r) =>
            r.reviewedAt.getTime() >= segmentEnd - 10 * 60 * 1000 &&
            r.reviewedAt.getTime() < segmentEnd,
        )

        if (reviewsInSegment.length > 0) {
          const correctReviews = reviewsInSegment.filter(
            (r) => r.rating === 'GOOD' || r.rating === 'EASY',
          ).length
          const performance = correctReviews / reviewsInSegment.length
          segments.push({ minuteMark: minute, performance })
        }
      }

      // Detect inflection point where performance drops by 20%+
      if (segments.length >= 3) {
        const baselinePerformance = segments[0].performance
        for (let i = 1; i < segments.length; i++) {
          const degradation = (baselinePerformance - segments[i].performance) / baselinePerformance
          if (degradation >= FATIGUE_DEGRADATION_THRESHOLD) {
            fatiguePoints.push(segments[i].minuteMark)
            break
          }
        }
      }
    }

    // Calculate average fatigue point
    const avgFatiguePoint =
      fatiguePoints.length > 0
        ? Math.round(fatiguePoints.reduce((sum, p) => sum + p, 0) / fatiguePoints.length)
        : null

    const fatigueDetected = avgFatiguePoint !== null

    // Generate recommendation
    let recommendation = ''
    let optimalBreakInterval: number | null = null

    if (fatigueDetected && avgFatiguePoint) {
      optimalBreakInterval = Math.max(30, avgFatiguePoint - 10) // Break 10 min before fatigue point, min 30 min
      recommendation = `Performance degrades after ${avgFatiguePoint} minutes. Take a 5-10 minute break every ${optimalBreakInterval} minutes to maintain focus and retention.`
    } else if (longSessions.length >= 5) {
      recommendation = `No significant fatigue pattern detected in ${longSessions.length} long sessions. You maintain consistent performance throughout extended study periods.`
    } else {
      recommendation = `Insufficient long session data. Continue studying and we'll monitor for fatigue patterns.`
    }

    return {
      fatiguePoint: avgFatiguePoint,
      averageSessionLength: Math.round(averageSessionLength),
      longSessionCount: longSessions.length,
      fatigueDetected,
      recommendation,
      optimalBreakInterval,
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Calculate average performance score from session reviews
   *
   * Performance = (GOOD + EASY reviews) / total reviews * 100
   *
   * @param sessions - Array of study sessions
   * @returns Average performance score (0-100)
   */
  private calculateAvgPerformance(sessions: any[]): number {
    let totalPerformance = 0
    let sessionCount = 0

    for (const session of sessions) {
      if (session.reviews.length === 0) continue

      const correctReviews = session.reviews.filter(
        (r: any) => r.rating === 'GOOD' || r.rating === 'EASY',
      ).length
      const performance = (correctReviews / session.reviews.length) * 100

      totalPerformance += performance
      sessionCount++
    }

    return sessionCount > 0 ? totalPerformance / sessionCount : 0
  }

  /**
   * Calculate completion rate from objective completions
   *
   * CompletionRate = completed objectives / total objectives
   *
   * @param sessions - Array of study sessions
   * @returns Completion rate (0.0-1.0)
   */
  private calculateCompletionRate(sessions: any[]): number {
    let totalObjectives = 0
    let completedObjectives = 0

    for (const session of sessions) {
      const objectiveCompletions = (session.objectiveCompletions || []) as Array<{
        completed?: boolean
        selfAssessment?: number
      }>

      if (objectiveCompletions.length === 0) continue

      totalObjectives += objectiveCompletions.length

      // Count objectives as completed if they have selfAssessment >= 4 (confident understanding)
      const completed = objectiveCompletions.filter(
        (o) => o.completed || (o.selfAssessment && o.selfAssessment >= 4),
      ).length
      completedObjectives += completed
    }

    return totalObjectives > 0 ? completedObjectives / totalObjectives : 0
  }

  /**
   * Detect performance dropoff within sessions (fatigue indicator)
   *
   * Compares performance in first half vs. second half of session.
   * Higher fatigue indicator = greater performance degradation.
   *
   * @param sessions - Array of study sessions
   * @returns Fatigue indicator (0.0-1.0, higher = more fatigue)
   */
  private async detectPerformanceDropoff(sessions: any[]): Promise<number> {
    let totalDegradation = 0
    let validSessions = 0

    for (const session of sessions) {
      if (session.reviews.length < 6) continue // Need enough reviews to split

      const sessionStart = session.startedAt.getTime()
      const sessionDuration = session.durationMs || 0
      const midpoint = sessionStart + sessionDuration / 2

      // Split reviews into first and second half
      const firstHalfReviews = session.reviews.filter((r: any) => r.reviewedAt.getTime() < midpoint)
      const secondHalfReviews = session.reviews.filter(
        (r: any) => r.reviewedAt.getTime() >= midpoint,
      )

      if (firstHalfReviews.length < 3 || secondHalfReviews.length < 3) continue

      // Calculate performance for each half
      const firstHalfPerformance =
        firstHalfReviews.filter((r: any) => r.rating === 'GOOD' || r.rating === 'EASY').length /
        firstHalfReviews.length

      const secondHalfPerformance =
        secondHalfReviews.filter((r: any) => r.rating === 'GOOD' || r.rating === 'EASY').length /
        secondHalfReviews.length

      // Calculate degradation (0 if improved, positive if declined)
      const degradation = Math.max(0, firstHalfPerformance - secondHalfPerformance)
      totalDegradation += degradation
      validSessions++
    }

    // Return average degradation, normalized to 0.0-1.0 scale
    return validSessions > 0 ? totalDegradation / validSessions : 0
  }

  /**
   * Calculate recommended duration by objective complexity
   *
   * BASIC objectives: -10 minutes from optimal
   * INTERMEDIATE objectives: optimal duration
   * ADVANCED objectives: +10-15 minutes from optimal
   *
   * @param userId - User ID to analyze
   * @returns Duration recommendations by complexity level
   */
  private async calculateDurationByComplexity(userId: string): Promise<
    | {
        [ObjectiveComplexity.BASIC]: number
        [ObjectiveComplexity.INTERMEDIATE]: number
        [ObjectiveComplexity.ADVANCED]: number
      }
    | undefined
  > {
    // Get overall optimal duration
    const pattern = await this.analyzeSessionDurationPatterns(userId)

    if (pattern.confidence < 0.4) {
      return undefined // Insufficient data
    }

    const baselineDuration = pattern.recommendedDuration

    return {
      [ObjectiveComplexity.BASIC]: Math.max(30, baselineDuration - 10),
      [ObjectiveComplexity.INTERMEDIATE]: baselineDuration,
      [ObjectiveComplexity.ADVANCED]: Math.min(90, baselineDuration + 15),
    }
  }
}

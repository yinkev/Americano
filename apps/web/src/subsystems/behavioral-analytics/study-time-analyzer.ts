/**
 * Study Time Pattern Analyzer
 * Story 5.1 Task 2
 *
 * Analyzes user study session patterns to identify optimal study times,
 * performance peaks, and attention cycles for personalized recommendations.
 */

import { prisma } from '@/lib/db'
import { PerformanceCalculator } from '@/lib/performance-calculator'

/**
 * Represents a time-of-day study pattern with performance metrics
 */
export interface StudyTimePattern {
  hourOfDay: number // 0-23
  sessionCount: number
  avgPerformanceScore: number // 0-100
  avgRetention: number // 0.0-1.0
  completionRate: number // 0.0-1.0
  avgEngagement: number // 0-100
  timeOfDayScore: number // 0-100 composite score
  confidence: number // 0.0-1.0
}

/**
 * Represents multi-hour windows of consistent high performance
 */
export interface PerformancePeakPattern {
  dayOfWeek: number // 0=Sunday, 6=Saturday
  startHour: number // 0-23
  endHour: number // 0-23
  avgScore: number // 0-100
  sessionCount: number
  consistency: number // 0.0-1.0, variance measure
  label: string // Human-readable: "Monday-Friday 7-9 AM"
}

/**
 * Time-of-day effectiveness score with detailed metrics
 */
export interface TimeOfDayScore {
  hour: number // 0-23
  score: number // 0-100
  sessionCount: number
  metrics: {
    performance: number // 0-100
    retention: number // 0.0-1.0
    completion: number // 0.0-1.0
    engagement: number // 0-100
  }
}

/**
 * Within-session attention and fatigue patterns
 */
export interface AttentionCyclePattern {
  avgSessionDuration: number // Minutes
  timeToFatigue: number // Minutes until performance drops 20%
  optimalBreakInterval: number // Minutes between breaks
  flowStateIndicators: {
    avgFlowDuration: number // Minutes of sustained high performance
    flowFrequency: number // 0.0-1.0, proportion of sessions with flow state
  }
}

/**
 * StudyTimeAnalyzer class for behavioral pattern analysis
 * Analyzes study session timing patterns to optimize learning schedules
 */
export class StudyTimeAnalyzer {
  /**
   * Analyze optimal study times based on historical session performance
   *
   * Algorithm:
   * 1. Query StudySession for past minWeeks
   * 2. Group sessions by hour-of-day (0-23 buckets)
   * 3. For each bucket with >=5 sessions:
   *    - Calculate avgPerformanceScore from objectiveCompletions + reviews
   *    - Calculate avgRetention using PerformanceCalculator.calculateRetentionScore()
   *    - Calculate completionRate (completed objectives / total)
   *    - Calculate avgEngagement from sessionPerformanceScore
   *    - timeOfDayScore = (performance * 0.4 + retention * 0.3 + completion * 0.2 + engagement * 0.1) * 100
   * 4. Return top 3 hours with highest timeOfDayScore
   * 5. Calculate confidence = min(1.0, totalSessions / 50)
   *
   * @param userId - User ID to analyze
   * @param minWeeks - Minimum weeks of history to analyze (default: 6)
   * @returns Array of StudyTimePattern sorted by timeOfDayScore DESC (top 3)
   */
  static async analyzeOptimalStudyTimes(
    userId: string,
    minWeeks: number = 6,
  ): Promise<StudyTimePattern[]> {
    // Calculate date threshold
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - minWeeks * 7)

    // Query study sessions with reviews
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: minDate,
        },
        completedAt: {
          not: null,
        },
      },
      include: {
        reviews: true,
      },
      orderBy: {
        startedAt: 'asc',
      },
    })

    if (sessions.length === 0) {
      return []
    }

    // Group sessions by hour-of-day
    const hourBuckets: Map<
      number,
      {
        sessions: typeof sessions
        performanceScores: number[]
        retentionScores: number[]
        completionRates: number[]
        engagementScores: number[]
      }
    > = new Map()

    for (const session of sessions) {
      const hour = session.startedAt.getHours()

      if (!hourBuckets.has(hour)) {
        hourBuckets.set(hour, {
          sessions: [],
          performanceScores: [],
          retentionScores: [],
          completionRates: [],
          engagementScores: [],
        })
      }

      const bucket = hourBuckets.get(hour)!
      bucket.sessions.push(session)

      // Calculate performance score from objective completions
      const objectiveCompletions = (session.objectiveCompletions || []) as Array<{
        objectiveId: string
        completedAt?: string
        timeSpentMs?: number
        selfAssessment?: number
        confidenceRating?: number
      }>

      const totalObjectives = objectiveCompletions.length
      const completedObjectives = objectiveCompletions.filter((o) => o.completedAt).length
      const completionRate = totalObjectives > 0 ? completedObjectives / totalObjectives : 0
      bucket.completionRates.push(completionRate)

      // Calculate performance from self-assessments (1-5 scale normalized to 0-100)
      const avgSelfAssessment =
        objectiveCompletions.length > 0
          ? objectiveCompletions.reduce((sum, o) => sum + (o.selfAssessment || 3), 0) /
            objectiveCompletions.length
          : 3
      const performanceScore = (avgSelfAssessment / 5) * 100
      bucket.performanceScores.push(performanceScore)

      // Calculate retention from reviews
      const retentionScore = PerformanceCalculator.calculateRetentionScore(session.reviews)
      bucket.retentionScores.push(retentionScore)

      // Calculate engagement (placeholder - could be enhanced with BehavioralEvent data)
      // For now, use review count and session duration as proxy
      const expectedReviewsPerHour = 30 // Baseline expectation
      const sessionHours = (session.durationMs || 0) / (1000 * 60 * 60)
      const expectedReviews = sessionHours * expectedReviewsPerHour
      const engagementScore =
        expectedReviews > 0 ? Math.min(100, (session.reviewsCompleted / expectedReviews) * 100) : 0
      bucket.engagementScores.push(engagementScore)
    }

    // Calculate time-of-day patterns for buckets with sufficient data
    const patterns: StudyTimePattern[] = []

    for (const [hour, bucket] of hourBuckets.entries()) {
      // Require minimum 5 sessions for statistical significance
      if (bucket.sessions.length < 5) {
        continue
      }

      // Calculate averages
      const avgPerformanceScore =
        bucket.performanceScores.reduce((sum, s) => sum + s, 0) / bucket.performanceScores.length
      const avgRetention =
        bucket.retentionScores.reduce((sum, s) => sum + s, 0) / bucket.retentionScores.length
      const completionRate =
        bucket.completionRates.reduce((sum, r) => sum + r, 0) / bucket.completionRates.length
      const avgEngagement =
        bucket.engagementScores.reduce((sum, s) => sum + s, 0) / bucket.engagementScores.length

      // Calculate composite time-of-day score
      // Weights: performance 40%, retention 30%, completion 20%, engagement 10%
      const timeOfDayScore =
        avgPerformanceScore * 0.4 +
        avgRetention * 100 * 0.3 +
        completionRate * 100 * 0.2 +
        avgEngagement * 0.1

      // Calculate confidence based on sample size
      const confidence = Math.min(1.0, bucket.sessions.length / 50)

      patterns.push({
        hourOfDay: hour,
        sessionCount: bucket.sessions.length,
        avgPerformanceScore,
        avgRetention,
        completionRate,
        avgEngagement,
        timeOfDayScore,
        confidence,
      })
    }

    // Sort by timeOfDayScore DESC and return top 3
    return patterns.sort((a, b) => b.timeOfDayScore - a.timeOfDayScore).slice(0, 3)
  }

  /**
   * Detect multi-hour windows of consistent high performance
   *
   * Algorithm:
   * 1. Group sessions by day-of-week AND hour-of-day
   * 2. Detect multi-hour windows of consistent high performance (>80 score)
   * 3. Account for weekday vs weekend variations
   * 4. Return "golden hours" with performance scores
   *
   * @param userId - User ID to analyze
   * @returns Array of PerformancePeakPattern sorted by avgScore DESC
   */
  static async detectPerformancePeaks(userId: string): Promise<PerformancePeakPattern[]> {
    // Query sessions from past 8 weeks for pattern stability
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - 8 * 7)

    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: minDate,
        },
        completedAt: {
          not: null,
        },
      },
      include: {
        reviews: true,
      },
    })

    if (sessions.length === 0) {
      return []
    }

    // Group sessions by day-of-week and hour-of-day
    const dayHourBuckets: Map<
      string, // Key: "dayOfWeek-hour" e.g., "1-7" for Monday 7 AM
      {
        sessions: typeof sessions
        scores: number[]
      }
    > = new Map()

    for (const session of sessions) {
      const dayOfWeek = session.startedAt.getDay() // 0=Sunday, 6=Saturday
      const hour = session.startedAt.getHours()
      const key = `${dayOfWeek}-${hour}`

      if (!dayHourBuckets.has(key)) {
        dayHourBuckets.set(key, {
          sessions: [],
          scores: [],
        })
      }

      const bucket = dayHourBuckets.get(key)!
      bucket.sessions.push(session)

      // Calculate performance score (simplified)
      const objectiveCompletions = (session.objectiveCompletions || []) as Array<{
        selfAssessment?: number
      }>
      const avgSelfAssessment =
        objectiveCompletions.length > 0
          ? objectiveCompletions.reduce((sum, o) => sum + (o.selfAssessment || 3), 0) /
            objectiveCompletions.length
          : 3
      const performanceScore = (avgSelfAssessment / 5) * 100
      bucket.scores.push(performanceScore)
    }

    // Detect multi-hour high-performance windows
    const peaks: PerformancePeakPattern[] = []
    const processedHours = new Set<string>()

    // Group by day of week and look for consecutive high-performance hours
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      let windowStart: number | null = null
      let windowScores: number[] = []
      let windowSessionCount = 0

      for (let hour = 0; hour <= 23; hour++) {
        const key = `${dayOfWeek}-${hour}`
        const bucket = dayHourBuckets.get(key)

        if (bucket && bucket.sessions.length >= 3) {
          const avgScore = bucket.scores.reduce((sum, s) => sum + s, 0) / bucket.scores.length

          if (avgScore >= 80) {
            // High performance hour
            if (windowStart === null) {
              windowStart = hour
            }
            windowScores.push(...bucket.scores)
            windowSessionCount += bucket.sessions.length
            processedHours.add(key)
          } else {
            // End of high-performance window
            if (windowStart !== null && hour - windowStart >= 2) {
              // Multi-hour window (at least 2 hours)
              peaks.push(
                this.createPeakPattern(
                  dayOfWeek,
                  windowStart,
                  hour - 1,
                  windowScores,
                  windowSessionCount,
                ),
              )
            }
            windowStart = null
            windowScores = []
            windowSessionCount = 0
          }
        } else {
          // No data or insufficient data for this hour
          if (windowStart !== null && hour - windowStart >= 2) {
            peaks.push(
              this.createPeakPattern(
                dayOfWeek,
                windowStart,
                hour - 1,
                windowScores,
                windowSessionCount,
              ),
            )
          }
          windowStart = null
          windowScores = []
          windowSessionCount = 0
        }
      }

      // Check for window extending to end of day
      if (windowStart !== null && 23 - windowStart >= 1) {
        peaks.push(
          this.createPeakPattern(dayOfWeek, windowStart, 23, windowScores, windowSessionCount),
        )
      }
    }

    // Sort by avgScore DESC
    return peaks.sort((a, b) => b.avgScore - a.avgScore)
  }

  /**
   * Calculate time-of-day effectiveness scores for all hours
   *
   * @param userId - User ID to analyze
   * @returns Array of TimeOfDayScore for all hours with data
   */
  static async calculateTimeOfDayEffectiveness(userId: string): Promise<TimeOfDayScore[]> {
    const patterns = await this.analyzeOptimalStudyTimes(userId, 6)

    return patterns.map((pattern) => ({
      hour: pattern.hourOfDay,
      score: pattern.timeOfDayScore,
      sessionCount: pattern.sessionCount,
      metrics: {
        performance: pattern.avgPerformanceScore,
        retention: pattern.avgRetention,
        completion: pattern.completionRate,
        engagement: pattern.avgEngagement,
      },
    }))
  }

  /**
   * Identify within-session attention cycles and fatigue patterns
   *
   * Algorithm:
   * 1. For sessions >60 minutes, analyze within-session performance degradation
   * 2. Measure time-to-fatigue (when performance drops 20%+)
   * 3. Calculate optimal break intervals
   * 4. Detect flow state indicators (long uninterrupted high-performance periods)
   *
   * @param userId - User ID to analyze
   * @returns AttentionCyclePattern with fatigue and flow state metrics
   */
  static async identifyAttentionCycles(userId: string): Promise<AttentionCyclePattern[]> {
    // Query long sessions (>60 minutes) from past 8 weeks
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - 8 * 7)

    const longSessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: minDate,
        },
        completedAt: {
          not: null,
        },
        durationMs: {
          gte: 60 * 60 * 1000, // >= 60 minutes
        },
      },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'asc',
          },
        },
      },
    })

    if (longSessions.length === 0) {
      return []
    }

    let totalDuration = 0
    let totalFatigueTime = 0
    let flowStateSessions = 0
    let totalFlowDuration = 0

    for (const session of longSessions) {
      const sessionDurationMinutes = (session.durationMs || 0) / (1000 * 60)
      totalDuration += sessionDurationMinutes

      // Analyze within-session performance degradation
      // Group reviews into time buckets (10-minute intervals)
      const bucketSize = 10 * 60 * 1000 // 10 minutes in ms
      const buckets: Map<number, { reviews: typeof session.reviews; avgAccuracy: number }> =
        new Map()

      for (const review of session.reviews) {
        const timeSinceStart = review.reviewedAt.getTime() - session.startedAt.getTime()
        const bucketIndex = Math.floor(timeSinceStart / bucketSize)

        if (!buckets.has(bucketIndex)) {
          buckets.set(bucketIndex, { reviews: [], avgAccuracy: 0 })
        }

        buckets.get(bucketIndex)!.reviews.push(review)
      }

      // Calculate average accuracy per bucket
      let baselineAccuracy = 0
      let fatigueDetected = false
      let fatigueTimeMinutes = sessionDurationMinutes

      for (const [bucketIndex, bucket] of Array.from(buckets.entries()).sort(
        (a, b) => a[0] - b[0],
      )) {
        const correctReviews = bucket.reviews.filter(
          (r) => r.rating === 'GOOD' || r.rating === 'EASY',
        ).length
        const accuracy = bucket.reviews.length > 0 ? correctReviews / bucket.reviews.length : 0
        bucket.avgAccuracy = accuracy

        // Set baseline from first bucket
        if (bucketIndex === 0) {
          baselineAccuracy = accuracy
        }

        // Detect 20% performance drop
        if (!fatigueDetected && baselineAccuracy > 0 && accuracy < baselineAccuracy * 0.8) {
          fatigueDetected = true
          fatigueTimeMinutes = bucketIndex * 10 // Convert bucket index to minutes
        }
      }

      totalFatigueTime += fatigueTimeMinutes

      // Detect flow state: sustained high accuracy (>85%) for 20+ minutes
      let consecutiveHighPerformanceBuckets = 0
      let maxFlowDuration = 0

      for (const bucket of buckets.values()) {
        if (bucket.avgAccuracy >= 0.85) {
          consecutiveHighPerformanceBuckets++
          maxFlowDuration = Math.max(maxFlowDuration, consecutiveHighPerformanceBuckets * 10)
        } else {
          consecutiveHighPerformanceBuckets = 0
        }
      }

      if (maxFlowDuration >= 20) {
        flowStateSessions++
        totalFlowDuration += maxFlowDuration
      }
    }

    // Calculate aggregate metrics
    const avgSessionDuration = totalDuration / longSessions.length
    const avgTimeToFatigue = totalFatigueTime / longSessions.length
    const optimalBreakInterval = avgTimeToFatigue * 0.9 // Take break just before fatigue
    const avgFlowDuration = flowStateSessions > 0 ? totalFlowDuration / flowStateSessions : 0
    const flowFrequency = flowStateSessions / longSessions.length

    return [
      {
        avgSessionDuration,
        timeToFatigue: avgTimeToFatigue,
        optimalBreakInterval,
        flowStateIndicators: {
          avgFlowDuration,
          flowFrequency,
        },
      },
    ]
  }

  /**
   * Helper method to create a PerformancePeakPattern
   */
  private static createPeakPattern(
    dayOfWeek: number,
    startHour: number,
    endHour: number,
    scores: number[],
    sessionCount: number,
  ): PerformancePeakPattern {
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

    // Calculate consistency (1.0 - normalized standard deviation)
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)
    const consistency = Math.max(0, 1.0 - stdDev / 100)

    // Generate human-readable label
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const formatHour = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour} ${period}`
    }

    const label = `${dayNames[dayOfWeek]} ${formatHour(startHour)}-${formatHour(endHour)}`

    return {
      dayOfWeek,
      startHour,
      endHour,
      avgScore,
      sessionCount,
      consistency,
      label,
    }
  }
}

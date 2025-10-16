/**
 * Performance Calculation Engine
 * Story 2.2 Task 2
 *
 * Calculates performance metrics, weakness scores, and mastery levels
 * for learning objectives based on review history and study patterns.
 */

import type { Card, LearningObjective, Review } from '@/generated/prisma'
import { MasteryLevel, ReviewRating } from '@/generated/prisma'
import { prisma } from '@/lib/db'

// Mastery thresholds (Story 2.2 spec)
const MASTERY_THRESHOLDS = {
  BEGINNER_RETENTION: 0.5,
  BEGINNER_REVIEWS: 3,
  INTERMEDIATE_RETENTION_MIN: 0.5,
  INTERMEDIATE_RETENTION_MAX: 0.7,
  INTERMEDIATE_REVIEWS: 3,
  ADVANCED_RETENTION_MIN: 0.7,
  ADVANCED_RETENTION_MAX: 0.9,
  ADVANCED_REVIEWS: 5,
  MASTERED_RETENTION: 0.9,
  MASTERED_REVIEWS: 10,
}

// Weakness score factor weights
const WEAKNESS_WEIGHTS = {
  RETENTION: 0.4,
  STUDY_TIME: 0.3,
  FAILURE: 0.2,
  CONFIDENCE: 0.1,
}

export class PerformanceCalculator {
  /**
   * Calculate retention score from FSRS retrievability
   * Average across all reviews for this objective
   */
  static calculateRetentionScore(reviews: Review[]): number {
    if (reviews.length === 0) return 0

    // Use FSRS stabilityAfter values which reflect retention
    const totalRetention = reviews.reduce((sum, review) => {
      // Normalize FSRS stability to 0-1 range
      // Higher stability = better retention
      const retention = Math.min(1.0, review.stabilityAfter / 10)
      return sum + retention
    }, 0)

    return totalRetention / reviews.length
  }

  /**
   * Calculate weakness score (0.0-1.0, higher = weaker)
   * Formula: (retentionFactor * 0.4) + (studyTimeFactor * 0.3) +
   *          (failureFactor * 0.2) + (confidenceFactor * 0.1)
   */
  static calculateWeaknessScore(
    objective: LearningObjective & { cards: Card[] },
    reviews: Review[],
    userConfidence?: number,
  ): number {
    // 1. Retention factor (inverted, so low retention = high factor)
    const retentionScore = PerformanceCalculator.calculateRetentionScore(reviews)
    const retentionFactor = 1.0 - retentionScore

    // 2. Study time factor
    // Compare actual study time to expected time for mastery
    const totalStudyTimeMs = objective.totalStudyTimeMs
    const expectedTimeForMastery = PerformanceCalculator.estimateTimeForMastery(
      objective.complexity,
    )
    const studyTimeFactor = Math.min(1.0, totalStudyTimeMs / expectedTimeForMastery)

    // 3. Failure factor (proportion of incorrect reviews)
    let failureFactor = 0
    if (reviews.length > 0) {
      const incorrectReviews = reviews.filter(
        (r) => r.rating === ReviewRating.AGAIN || r.rating === ReviewRating.HARD,
      ).length
      failureFactor = incorrectReviews / reviews.length
    }

    // 4. Confidence factor (if user provided self-assessment)
    let confidenceFactor = 0.5 // Default neutral
    if (userConfidence !== undefined) {
      confidenceFactor = 1.0 - userConfidence / 5.0 // Invert (low confidence = high factor)
    }

    // Calculate weighted sum
    const weaknessScore =
      retentionFactor * WEAKNESS_WEIGHTS.RETENTION +
      studyTimeFactor * WEAKNESS_WEIGHTS.STUDY_TIME +
      failureFactor * WEAKNESS_WEIGHTS.FAILURE +
      confidenceFactor * WEAKNESS_WEIGHTS.CONFIDENCE

    return Math.max(0, Math.min(1.0, weaknessScore))
  }

  /**
   * Determine mastery level based on retention score, review count, and study time
   */
  static calculateMasteryLevel(
    retentionScore: number,
    reviewCount: number,
    studyTimeMs: number,
  ): MasteryLevel {
    // NOT_STARTED: No reviews completed
    if (reviewCount === 0) return MasteryLevel.NOT_STARTED

    // MASTERED: retention >= 0.9 AND reviews >= 10
    if (
      retentionScore >= MASTERY_THRESHOLDS.MASTERED_RETENTION &&
      reviewCount >= MASTERY_THRESHOLDS.MASTERED_REVIEWS
    ) {
      return MasteryLevel.MASTERED
    }

    // ADVANCED: retention 0.7-0.9 AND reviews >= 5
    if (
      retentionScore >= MASTERY_THRESHOLDS.ADVANCED_RETENTION_MIN &&
      retentionScore < MASTERY_THRESHOLDS.ADVANCED_RETENTION_MAX &&
      reviewCount >= MASTERY_THRESHOLDS.ADVANCED_REVIEWS
    ) {
      return MasteryLevel.ADVANCED
    }

    // INTERMEDIATE: retention 0.5-0.7 AND reviews >= 3
    if (
      retentionScore >= MASTERY_THRESHOLDS.INTERMEDIATE_RETENTION_MIN &&
      retentionScore < MASTERY_THRESHOLDS.INTERMEDIATE_RETENTION_MAX &&
      reviewCount >= MASTERY_THRESHOLDS.INTERMEDIATE_REVIEWS
    ) {
      return MasteryLevel.INTERMEDIATE
    }

    // BEGINNER: retention < 0.5 OR reviews < 3
    return MasteryLevel.BEGINNER
  }

  /**
   * Identify weak areas for a user
   * Returns objectives with weakness score above threshold
   */
  static async identifyWeakAreas(
    userId: string,
    thresholdScore: number = 0.6,
    limit?: number,
    courseId?: string,
  ): Promise<LearningObjective[]> {
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
          ...(courseId && { courseId }),
        },
        weaknessScore: {
          gte: thresholdScore,
        },
      },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        weaknessScore: 'desc',
      },
      take: limit,
    })

    return objectives
  }

  /**
   * Batch update all performance metrics for a user
   * Should be run daily or on-demand
   */
  static async updateAllPerformanceMetrics(userId: string): Promise<void> {
    // Fetch all objectives for user
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
        },
      },
      include: {
        cards: true,
      },
    })

    // Update each objective
    for (const objective of objectives) {
      await PerformanceCalculator.updateObjectivePerformance(userId, objective.id)
    }
  }

  /**
   * Update performance metrics for a single objective
   */
  static async updateObjectivePerformance(userId: string, objectiveId: string): Promise<void> {
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        cards: true,
      },
    })

    if (!objective) return

    // Fetch all reviews for cards associated with this objective
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        card: {
          objectiveId,
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
    })

    // Calculate metrics
    const retentionScore = PerformanceCalculator.calculateRetentionScore(reviews)
    const weaknessScore = PerformanceCalculator.calculateWeaknessScore(objective, reviews)
    const masteryLevel = PerformanceCalculator.calculateMasteryLevel(
      retentionScore,
      reviews.length,
      objective.totalStudyTimeMs,
    )

    // Update objective aggregate fields
    await prisma.learningObjective.update({
      where: { id: objectiveId },
      data: {
        weaknessScore,
        masteryLevel,
        lastStudiedAt: reviews.length > 0 ? reviews[0].reviewedAt : null,
      },
    })

    // Create today's performance metric record
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayReviews = reviews.filter((r) => {
      const reviewDate = new Date(r.reviewedAt)
      reviewDate.setHours(0, 0, 0, 0)
      return reviewDate.getTime() === today.getTime()
    })

    if (todayReviews.length > 0) {
      const correctReviews = todayReviews.filter(
        (r) => r.rating === ReviewRating.GOOD || r.rating === ReviewRating.EASY,
      ).length
      const incorrectReviews = todayReviews.filter(
        (r) => r.rating === ReviewRating.AGAIN || r.rating === ReviewRating.HARD,
      ).length
      const studyTimeMs = todayReviews.reduce((sum, r) => sum + r.timeSpentMs, 0)

      await prisma.performanceMetric.upsert({
        where: {
          userId_learningObjectiveId_date: {
            userId,
            learningObjectiveId: objectiveId,
            date: today,
          },
        },
        create: {
          userId,
          learningObjectiveId: objectiveId,
          date: today,
          retentionScore,
          studyTimeMs,
          reviewCount: todayReviews.length,
          correctReviews,
          incorrectReviews,
        },
        update: {
          retentionScore,
          studyTimeMs,
          reviewCount: todayReviews.length,
          correctReviews,
          incorrectReviews,
        },
      })
    }
  }

  /**
   * Estimate expected time to achieve mastery (in milliseconds)
   * Based on objective complexity
   */
  private static estimateTimeForMastery(complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'): number {
    const baseMinutes = {
      BASIC: 20,
      INTERMEDIATE: 40,
      ADVANCED: 60,
    }

    return baseMinutes[complexity] * 60 * 1000 // Convert to ms
  }

  /**
   * Calculate session-level analytics (Story 2.5 Task 11)
   * Returns detailed performance data for a completed or in-progress session
   */
  static async calculateSessionAnalytics(sessionId: string): Promise<{
    objectives: Array<{
      objectiveId: string
      objective: string
      complexity: string
      timeSpentMs: number
      estimatedTimeMs: number
      timeDeltaMs: number
      selfAssessment?: number
      confidenceRating?: number
      cardsReviewed: number
      cardAccuracy: number
      contentViews: number
    }>
    cards: {
      totalReviewed: number
      accuracy: number
      averageTimeMs: number
      byRating: {
        again: number
        hard: number
        good: number
        easy: number
      }
    }
    timeBreakdown: {
      totalSessionMs: number
      totalObjectiveMs: number
      totalCardReviewMs: number
      averageObjectiveMs: number
    }
    insights: string[]
  }> {
    // Fetch session with all related data
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
        reviews: {
          include: {
            card: {
              include: {
                objective: true,
              },
            },
          },
        },
      },
    })

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const objectiveCompletions = (session.objectiveCompletions || []) as any[]
    const missionObjectives = (session.missionObjectives || []) as any[]

    // Calculate objective-level metrics
    const objectiveMetrics = await Promise.all(
      objectiveCompletions.map(async (completion: any) => {
        const objective = await prisma.learningObjective.findUnique({
          where: { id: completion.objectiveId },
        })

        if (!objective) {
          return null
        }

        // Get estimated time from mission objectives
        const missionObjective = missionObjectives.find(
          (mo: any) => mo.objectiveId === completion.objectiveId,
        )
        const estimatedTimeMs = (missionObjective?.estimatedMinutes || 20) * 60 * 1000
        const timeSpentMs = completion.timeSpentMs || 0
        const timeDeltaMs = timeSpentMs - estimatedTimeMs

        // Get cards reviewed for this objective
        const objectiveReviews = session.reviews.filter(
          (r) => r.card.objectiveId === completion.objectiveId,
        )
        const cardsReviewed = objectiveReviews.length
        const correctReviews = objectiveReviews.filter(
          (r) => r.rating === 'GOOD' || r.rating === 'EASY',
        ).length
        const cardAccuracy = cardsReviewed > 0 ? correctReviews / cardsReviewed : 0

        // Content views (placeholder - would track in future)
        const contentViews = 1

        return {
          objectiveId: completion.objectiveId,
          objective: objective.objective,
          complexity: objective.complexity,
          timeSpentMs,
          estimatedTimeMs,
          timeDeltaMs,
          selfAssessment: completion.selfAssessment,
          confidenceRating: completion.confidenceRating,
          cardsReviewed,
          cardAccuracy,
          contentViews,
        }
      }),
    )

    const validObjectiveMetrics = objectiveMetrics.filter(
      (m): m is NonNullable<typeof m> => m !== null,
    )

    // Calculate card-level metrics
    const totalReviewed = session.reviews.length
    const correctReviews = session.reviews.filter(
      (r) => r.rating === 'GOOD' || r.rating === 'EASY',
    ).length
    const accuracy = totalReviewed > 0 ? correctReviews / totalReviewed : 0

    const totalReviewTimeMs = session.reviews.reduce((sum, r) => sum + r.timeSpentMs, 0)
    const averageTimeMs = totalReviewed > 0 ? totalReviewTimeMs / totalReviewed : 0

    const byRating = {
      again: session.reviews.filter((r) => r.rating === 'AGAIN').length,
      hard: session.reviews.filter((r) => r.rating === 'HARD').length,
      good: session.reviews.filter((r) => r.rating === 'GOOD').length,
      easy: session.reviews.filter((r) => r.rating === 'EASY').length,
    }

    // Calculate time breakdown
    const totalObjectiveMs = validObjectiveMetrics.reduce((sum, m) => sum + m.timeSpentMs, 0)
    const averageObjectiveMs =
      validObjectiveMetrics.length > 0 ? totalObjectiveMs / validObjectiveMetrics.length : 0

    const timeBreakdown = {
      totalSessionMs: session.durationMs || 0,
      totalObjectiveMs,
      totalCardReviewMs: totalReviewTimeMs,
      averageObjectiveMs,
    }

    // Generate insights
    const insights = PerformanceCalculator.generateSessionInsights(
      validObjectiveMetrics,
      { totalReviewed, accuracy },
      timeBreakdown,
    )

    return {
      objectives: validObjectiveMetrics,
      cards: {
        totalReviewed,
        accuracy,
        averageTimeMs,
        byRating,
      },
      timeBreakdown,
      insights,
    }
  }

  /**
   * Generate actionable insights from session analytics
   */
  private static generateSessionInsights(
    objectives: Array<{
      timeDeltaMs: number
      selfAssessment?: number
      confidenceRating?: number
      cardAccuracy: number
      complexity: string
    }>,
    cards: { totalReviewed: number; accuracy: number },
    timeBreakdown: { totalObjectiveMs: number; averageObjectiveMs: number },
  ): string[] {
    const insights: string[] = []

    // Time efficiency insights
    const totalTimeDelta = objectives.reduce((sum, o) => sum + o.timeDeltaMs, 0)
    if (totalTimeDelta < 0) {
      const percentFaster = Math.abs((totalTimeDelta / timeBreakdown.totalObjectiveMs) * 100)
      insights.push(`You completed objectives ${percentFaster.toFixed(0)}% faster than estimated`)
    } else if (totalTimeDelta > 0) {
      const percentSlower = (totalTimeDelta / timeBreakdown.totalObjectiveMs) * 100
      insights.push(
        `Objectives took ${percentSlower.toFixed(0)}% longer than estimated - consider adjusting time allocations`,
      )
    }

    // Card performance insights
    if (cards.totalReviewed > 0) {
      if (cards.accuracy >= 0.85) {
        insights.push(`Excellent card accuracy (${(cards.accuracy * 100).toFixed(0)}%)`)
      } else if (cards.accuracy < 0.6) {
        insights.push(
          `Card accuracy is low (${(cards.accuracy * 100).toFixed(0)}%) - consider reviewing fundamentals`,
        )
      }
    }

    // Confidence vs performance insights
    const lowConfidenceObjectives = objectives.filter(
      (o) => o.confidenceRating && o.confidenceRating <= 2,
    )
    if (lowConfidenceObjectives.length > 0) {
      insights.push(
        `${lowConfidenceObjectives.length} objective(s) marked with low confidence - recommend targeted review`,
      )
    }

    // Self-assessment insights
    const highSelfAssessment = objectives.filter((o) => o.selfAssessment && o.selfAssessment >= 4)
    if (highSelfAssessment.length > 0 && objectives.length > 0) {
      const percentMastered = (highSelfAssessment.length / objectives.length) * 100
      insights.push(
        `${percentMastered.toFixed(0)}% of objectives self-assessed as mastered (4-5 stars)`,
      )
    }

    return insights
  }

  /**
   * Update performance metrics based on session completion (Story 2.5 Task 11.2)
   * Integrates objective self-assessment and confidence into mastery calculation
   */
  static async updatePerformanceFromSession(sessionId: string, userId: string): Promise<void> {
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        reviews: {
          include: {
            card: true,
          },
        },
      },
    })

    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const objectiveCompletions = (session.objectiveCompletions || []) as any[]

    // Update each objective's performance based on session data
    for (const completion of objectiveCompletions) {
      const objective = await prisma.learningObjective.findUnique({
        where: { id: completion.objectiveId },
        include: { cards: true },
      })

      if (!objective) continue

      // Get reviews for this objective
      const objectiveReviews = session.reviews.filter(
        (r) => r.card.objectiveId === completion.objectiveId,
      )

      // Calculate new weakness score incorporating self-assessment
      const userConfidence = completion.confidenceRating
      const weaknessScore = PerformanceCalculator.calculateWeaknessScore(
        objective,
        objectiveReviews,
        userConfidence,
      )

      // Update total study time
      const newTotalStudyTimeMs = objective.totalStudyTimeMs + (completion.timeSpentMs || 0)

      // Calculate mastery level
      const retentionScore = PerformanceCalculator.calculateRetentionScore(objectiveReviews)
      const masteryLevel = PerformanceCalculator.calculateMasteryLevel(
        retentionScore,
        objectiveReviews.length,
        newTotalStudyTimeMs,
      )

      // Apply self-assessment adjustments (Story 2.5 Task 11.2)
      let adjustedWeaknessScore = weaknessScore
      if (completion.selfAssessment) {
        // High self-assessment (4-5 stars) → Decrease weakness score
        if (completion.selfAssessment >= 4) {
          adjustedWeaknessScore = Math.max(0, weaknessScore - 0.1)
        }
        // Low self-assessment (1-2 stars) → Increase weakness score
        else if (completion.selfAssessment <= 2) {
          adjustedWeaknessScore = Math.min(1.0, weaknessScore + 0.1)
        }
      }

      // Update objective
      await prisma.learningObjective.update({
        where: { id: completion.objectiveId },
        data: {
          weaknessScore: adjustedWeaknessScore,
          masteryLevel,
          totalStudyTimeMs: newTotalStudyTimeMs,
          lastStudiedAt: new Date(),
        },
      })

      // Create performance metric for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const correctReviews = objectiveReviews.filter(
        (r) => r.rating === 'GOOD' || r.rating === 'EASY',
      ).length
      const incorrectReviews = objectiveReviews.filter(
        (r) => r.rating === 'AGAIN' || r.rating === 'HARD',
      ).length

      await prisma.performanceMetric.upsert({
        where: {
          userId_learningObjectiveId_date: {
            userId,
            learningObjectiveId: completion.objectiveId,
            date: today,
          },
        },
        create: {
          userId,
          learningObjectiveId: completion.objectiveId,
          date: today,
          retentionScore,
          studyTimeMs: completion.timeSpentMs || 0,
          reviewCount: objectiveReviews.length,
          correctReviews,
          incorrectReviews,
        },
        update: {
          retentionScore,
          studyTimeMs: { increment: completion.timeSpentMs || 0 },
          reviewCount: { increment: objectiveReviews.length },
          correctReviews: { increment: correctReviews },
          incorrectReviews: { increment: incorrectReviews },
        },
      })
    }
  }

  /**
   * Calculate time estimation feedback for user (Story 2.5 Task 11.3)
   * Compares actual vs estimated time to improve future mission generation
   */
  static async calculateTimeEstimationFeedback(
    userId: string,
    sessionId?: string,
  ): Promise<{
    byComplexity: {
      BASIC: { averageDeltaMs: number; multiplier: number; sampleSize: number }
      INTERMEDIATE: { averageDeltaMs: number; multiplier: number; sampleSize: number }
      ADVANCED: { averageDeltaMs: number; multiplier: number; sampleSize: number }
    }
    overall: { averageDeltaMs: number; multiplier: number }
  }> {
    // Get all user sessions (or specific session)
    const sessions = await prisma.studySession.findMany({
      where: {
        userId,
        ...(sessionId && { id: sessionId }),
        completedAt: { not: null },
      },
      include: {
        mission: true,
      },
    })

    // Collect time deltas by complexity
    const deltasByComplexity: {
      BASIC: number[]
      INTERMEDIATE: number[]
      ADVANCED: number[]
    } = {
      BASIC: [],
      INTERMEDIATE: [],
      ADVANCED: [],
    }

    for (const session of sessions) {
      const objectiveCompletions = (session.objectiveCompletions || []) as any[]
      const missionObjectives = (session.missionObjectives || []) as any[]

      for (const completion of objectiveCompletions) {
        const objective = await prisma.learningObjective.findUnique({
          where: { id: completion.objectiveId },
        })

        if (!objective) continue

        const missionObjective = missionObjectives.find(
          (mo: any) => mo.objectiveId === completion.objectiveId,
        )
        const estimatedTimeMs = (missionObjective?.estimatedMinutes || 20) * 60 * 1000
        const actualTimeMs = completion.timeSpentMs || 0
        const deltaMs = actualTimeMs - estimatedTimeMs

        deltasByComplexity[objective.complexity].push(deltaMs)
      }
    }

    // Calculate average deltas and multipliers
    const calculateStats = (deltas: number[]) => {
      if (deltas.length === 0) {
        return { averageDeltaMs: 0, multiplier: 1.0, sampleSize: 0 }
      }

      const averageDeltaMs = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
      // Multiplier: 1.0 = on time, >1.0 = slower, <1.0 = faster
      const baseTime = 20 * 60 * 1000 // Base 20 minutes
      const multiplier = 1.0 + averageDeltaMs / baseTime

      return {
        averageDeltaMs,
        multiplier: Math.max(0.5, Math.min(2.0, multiplier)), // Clamp between 0.5x and 2x
        sampleSize: deltas.length,
      }
    }

    const byComplexity = {
      BASIC: calculateStats(deltasByComplexity.BASIC),
      INTERMEDIATE: calculateStats(deltasByComplexity.INTERMEDIATE),
      ADVANCED: calculateStats(deltasByComplexity.ADVANCED),
    }

    // Overall stats
    const allDeltas = [
      ...deltasByComplexity.BASIC,
      ...deltasByComplexity.INTERMEDIATE,
      ...deltasByComplexity.ADVANCED,
    ]
    const overallStats = calculateStats(allDeltas)

    return {
      byComplexity,
      overall: {
        averageDeltaMs: overallStats.averageDeltaMs,
        multiplier: overallStats.multiplier,
      },
    }
  }
}

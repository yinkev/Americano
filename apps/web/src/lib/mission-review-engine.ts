/**
 * Mission Review Engine
 *
 * Generates automated weekly and monthly mission performance reviews.
 * Aggregates mission data, highlights achievements, identifies patterns,
 * and provides actionable recommendations.
 *
 * Story 2.6: Task 7 - Weekly/Monthly Review System
 */

import { prisma } from '@/lib/db'
import { MissionStatus, ReviewPeriod } from '@/generated/prisma'
import { MissionAnalyticsEngine } from './mission-analytics-engine'
import { MissionInsightsEngine } from './mission-insights-engine'

/**
 * Review summary data structure
 */
interface ReviewSummary {
  missionsCompleted: number
  missionsSkipped: number
  totalTime: number // minutes
  avgSuccessScore: number
  completionRate: number
  avgDifficultyRating: number
}

/**
 * Review highlights data structure
 */
interface ReviewHighlights {
  longestStreak: number
  bestPerformance: {
    missionId: string
    successScore: number
    date: string
  } | null
  topObjectives: Array<{
    objectiveId: string
    objective: string
    masteryGain: number
  }>
  personalBests: string[] // Achievement descriptions
}

/**
 * Review insights data structure
 */
interface ReviewInsights {
  patterns: string[] // Detected behavioral patterns
  correlations: string[] // Performance correlations
  improvements: string[] // Improvements observed
  concerns: string[] // Areas needing attention
}

/**
 * Review recommendations data structure
 */
interface ReviewRecommendations {
  actionItems: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    action: string
    reason: string
  }>
  adjustments: Array<{
    type: 'DURATION' | 'COMPLEXITY' | 'OBJECTIVE_TYPES' | 'STUDY_TIME'
    current: string
    recommended: string
    reason: string
  }>
}

/**
 * Mission Review Engine
 *
 * Generates comprehensive weekly and monthly reviews of mission performance.
 * Triggered by cron jobs:
 * - Weekly: Sunday 11pm, analyzes previous Mon-Sun
 * - Monthly: Last day 11pm, analyzes full month
 */
export class MissionReviewEngine {
  private analyticsEngine: MissionAnalyticsEngine
  private insightsEngine: MissionInsightsEngine

  constructor() {
    this.analyticsEngine = new MissionAnalyticsEngine()
    this.insightsEngine = new MissionInsightsEngine()
  }

  /**
   * Generate weekly review for a user
   *
   * Analyzes the previous week (Monday-Sunday) of mission activity.
   *
   * @param userId - User ID
   * @param weekStartDate - Monday of the week to review (optional, defaults to last week)
   * @returns Generated review record
   */
  async generateWeeklyReview(
    userId: string,
    weekStartDate?: Date
  ): Promise<{
    id: string
    userId: string
    period: ReviewPeriod
    startDate: Date
    endDate: Date
    summary: ReviewSummary
    highlights: ReviewHighlights
    insights: ReviewInsights
    recommendations: ReviewRecommendations
    generatedAt: Date
  }> {
    // Calculate week boundaries (Monday to Sunday)
    const { startDate, endDate } = this.getWeekBoundaries(weekStartDate)

    // Check if review already exists
    const existingReview = await prisma.missionReview.findUnique({
      where: {
        userId_period_startDate: {
          userId,
          period: ReviewPeriod.WEEK,
          startDate,
        },
      },
    })

    if (existingReview) {
      return {
        id: existingReview.id,
        userId: existingReview.userId,
        period: existingReview.period,
        startDate: existingReview.startDate,
        endDate: existingReview.endDate,
        summary: existingReview.summary as unknown as ReviewSummary,
        highlights: existingReview.highlights as unknown as ReviewHighlights,
        insights: existingReview.insights as unknown as ReviewInsights,
        recommendations: existingReview.recommendations as unknown as ReviewRecommendations,
        generatedAt: existingReview.generatedAt,
      }
    }

    // Generate review components
    const summary = await this.generateSummary(userId, startDate, endDate)
    const highlights = await this.generateHighlights(userId, startDate, endDate)
    const insights = await this.generateInsights(userId, startDate, endDate)
    const recommendations = await this.generateRecommendations(
      userId,
      summary,
      insights
    )

    // Store review in database
    const review = await prisma.missionReview.create({
      data: {
        userId,
        period: ReviewPeriod.WEEK,
        startDate,
        endDate,
        summary: summary as any,
        highlights: highlights as any,
        insights: insights as any,
        recommendations: recommendations as any,
      },
    })

    return {
      id: review.id,
      userId: review.userId,
      period: review.period,
      startDate: review.startDate,
      endDate: review.endDate,
      summary,
      highlights,
      insights,
      recommendations,
      generatedAt: review.generatedAt,
    }
  }

  /**
   * Generate monthly review for a user
   *
   * Analyzes the previous month of mission activity.
   *
   * @param userId - User ID
   * @param monthStartDate - First day of the month to review (optional, defaults to last month)
   * @returns Generated review record
   */
  async generateMonthlyReview(
    userId: string,
    monthStartDate?: Date
  ): Promise<{
    id: string
    userId: string
    period: ReviewPeriod
    startDate: Date
    endDate: Date
    summary: ReviewSummary
    highlights: ReviewHighlights
    insights: ReviewInsights
    recommendations: ReviewRecommendations
    generatedAt: Date
  }> {
    // Calculate month boundaries
    const { startDate, endDate } = this.getMonthBoundaries(monthStartDate)

    // Check if review already exists
    const existingReview = await prisma.missionReview.findUnique({
      where: {
        userId_period_startDate: {
          userId,
          period: ReviewPeriod.MONTH,
          startDate,
        },
      },
    })

    if (existingReview) {
      return {
        id: existingReview.id,
        userId: existingReview.userId,
        period: existingReview.period,
        startDate: existingReview.startDate,
        endDate: existingReview.endDate,
        summary: existingReview.summary as unknown as ReviewSummary,
        highlights: existingReview.highlights as unknown as ReviewHighlights,
        insights: existingReview.insights as unknown as ReviewInsights,
        recommendations: existingReview.recommendations as unknown as ReviewRecommendations,
        generatedAt: existingReview.generatedAt,
      }
    }

    // Generate review components
    const summary = await this.generateSummary(userId, startDate, endDate)
    const highlights = await this.generateHighlights(userId, startDate, endDate)
    const insights = await this.generateInsights(userId, startDate, endDate)
    const recommendations = await this.generateRecommendations(
      userId,
      summary,
      insights
    )

    // Store review in database
    const review = await prisma.missionReview.create({
      data: {
        userId,
        period: ReviewPeriod.MONTH,
        startDate,
        endDate,
        summary: summary as any,
        highlights: highlights as any,
        insights: insights as any,
        recommendations: recommendations as any,
      },
    })

    return {
      id: review.id,
      userId: review.userId,
      period: review.period,
      startDate: review.startDate,
      endDate: review.endDate,
      summary,
      highlights,
      insights,
      recommendations,
      generatedAt: review.generatedAt,
    }
  }

  /**
   * Get all reviews for a user
   *
   * @param userId - User ID
   * @param period - Filter by period (optional)
   * @returns Array of reviews
   */
  async getUserReviews(
    userId: string,
    period?: ReviewPeriod
  ): Promise<
    Array<{
      id: string
      userId: string
      period: ReviewPeriod
      startDate: Date
      endDate: Date
      summary: ReviewSummary
      highlights: ReviewHighlights
      insights: ReviewInsights
      recommendations: ReviewRecommendations
      generatedAt: Date
    }>
  > {
    const reviews = await prisma.missionReview.findMany({
      where: {
        userId,
        ...(period && { period }),
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    return reviews.map((review) => ({
      id: review.id,
      userId: review.userId,
      period: review.period,
      startDate: review.startDate,
      endDate: review.endDate,
      summary: review.summary as unknown as ReviewSummary,
      highlights: review.highlights as unknown as ReviewHighlights,
      insights: review.insights as unknown as ReviewInsights,
      recommendations: review.recommendations as unknown as ReviewRecommendations,
      generatedAt: review.generatedAt,
    }))
  }

  // ==================== Private Helper Methods ====================

  /**
   * Generate summary statistics for review period
   */
  private async generateSummary(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewSummary> {
    const missions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const missionsCompleted = missions.filter(
      (m) => m.status === MissionStatus.COMPLETED
    ).length
    const missionsSkipped = missions.filter(
      (m) => m.status === MissionStatus.SKIPPED
    ).length

    const totalTime = missions
      .filter((m) => m.actualMinutes)
      .reduce((sum, m) => sum + m.actualMinutes!, 0)

    const successScores = missions
      .filter((m) => m.successScore !== null)
      .map((m) => m.successScore!)
    const avgSuccessScore =
      successScores.length > 0
        ? successScores.reduce((sum, score) => sum + score, 0) /
          successScores.length
        : 0

    const completionRate =
      missions.length > 0 ? missionsCompleted / missions.length : 0

    const difficultyRatings = missions
      .filter((m) => m.difficultyRating !== null)
      .map((m) => m.difficultyRating!)
    const avgDifficultyRating =
      difficultyRatings.length > 0
        ? difficultyRatings.reduce((sum, rating) => sum + rating, 0) /
          difficultyRatings.length
        : 0

    return {
      missionsCompleted,
      missionsSkipped,
      totalTime,
      avgSuccessScore,
      completionRate,
      avgDifficultyRating,
    }
  }

  /**
   * Generate highlights for review period
   */
  private async generateHighlights(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewHighlights> {
    const missions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: MissionStatus.COMPLETED,
      },
      orderBy: {
        successScore: 'desc',
      },
    })

    // Get streak data
    const missionStreak = await prisma.missionStreak.findUnique({
      where: { userId },
    })

    const longestStreak = missionStreak?.longestStreak || 0

    // Find best performing mission
    const bestMission = missions.find((m) => m.successScore !== null)
    const bestPerformance = bestMission
      ? {
          missionId: bestMission.id,
          successScore: bestMission.successScore!,
          date: bestMission.date.toISOString(),
        }
      : null

    // Identify top objectives (most frequently completed)
    const objectiveCounts = new Map<string, { objective: string; count: number }>()
    for (const mission of missions) {
      const objectives = mission.objectives as Array<{
        objectiveId: string
        objective: string
        completed?: boolean
      }>
      for (const obj of objectives) {
        if (obj.completed) {
          const existing = objectiveCounts.get(obj.objectiveId)
          if (existing) {
            existing.count++
          } else {
            objectiveCounts.set(obj.objectiveId, {
              objective: obj.objective,
              count: 1,
            })
          }
        }
      }
    }

    const topObjectives = Array.from(objectiveCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([objectiveId, data]) => ({
        objectiveId,
        objective: data.objective,
        masteryGain: data.count * 0.1, // Simplified metric
      }))

    // Generate personal bests
    const personalBests: string[] = []
    if (missions.length > 0) {
      const completedCount = missions.length
      if (completedCount >= 7) {
        personalBests.push(`Completed ${completedCount} missions this period!`)
      }
      if (longestStreak >= 7) {
        personalBests.push(`${longestStreak}-day mission streak achieved!`)
      }
      if (bestPerformance && bestPerformance.successScore >= 0.8) {
        personalBests.push(
          `Outstanding mission performance: ${(bestPerformance.successScore * 100).toFixed(0)}% success score`
        )
      }
    }

    return {
      longestStreak,
      bestPerformance,
      topObjectives,
      personalBests,
    }
  }

  /**
   * Generate insights for review period
   */
  private async generateInsights(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReviewInsights> {
    const missions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const patterns: string[] = []
    const correlations: string[] = []
    const improvements: string[] = []
    const concerns: string[] = []

    // Detect completion patterns
    const completionRate =
      missions.length > 0
        ? missions.filter((m) => m.status === MissionStatus.COMPLETED).length /
          missions.length
        : 0

    if (completionRate >= 0.85) {
      patterns.push(
        `Excellent completion consistency: ${(completionRate * 100).toFixed(0)}% of missions completed`
      )
    } else if (completionRate < 0.6) {
      concerns.push(
        `Low completion rate: ${(completionRate * 100).toFixed(0)}%. Consider adjusting mission difficulty.`
      )
    }

    // Detect time patterns
    const completedMissions = missions.filter(
      (m) => m.status === MissionStatus.COMPLETED && m.actualMinutes
    )
    if (completedMissions.length >= 3) {
      const avgDuration =
        completedMissions.reduce((sum, m) => sum + m.actualMinutes!, 0) /
        completedMissions.length
      patterns.push(
        `Average study session duration: ${avgDuration.toFixed(0)} minutes`
      )
    }

    // Detect improvement trends
    const successScores = missions
      .filter((m) => m.successScore !== null)
      .map((m) => m.successScore!)
    if (successScores.length >= 5) {
      const firstHalf = successScores.slice(0, Math.floor(successScores.length / 2))
      const secondHalf = successScores.slice(Math.floor(successScores.length / 2))
      const firstAvg =
        firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
      const secondAvg =
        secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length

      if (secondAvg > firstAvg * 1.1) {
        improvements.push(
          `Success scores improved ${((secondAvg / firstAvg - 1) * 100).toFixed(0)}% over the period`
        )
      } else if (secondAvg < firstAvg * 0.9) {
        concerns.push(
          `Success scores declined ${((1 - secondAvg / firstAvg) * 100).toFixed(0)}%. Review mission difficulty.`
        )
      }
    }

    // Add correlation insights if available
    try {
      const correlation = await this.analyticsEngine.detectPerformanceCorrelation(
        userId
      )
      if (correlation.confidence !== 'LOW') {
        correlations.push(correlation.insight)
      }
    } catch (error) {
      // Skip if correlation analysis fails
    }

    return {
      patterns,
      correlations,
      improvements,
      concerns,
    }
  }

  /**
   * Generate recommendations based on summary and insights
   */
  private async generateRecommendations(
    userId: string,
    summary: ReviewSummary,
    insights: ReviewInsights
  ): Promise<ReviewRecommendations> {
    const actionItems: ReviewRecommendations['actionItems'] = []
    const adjustments: ReviewRecommendations['adjustments'] = []

    // Low completion rate recommendations
    if (summary.completionRate < 0.7) {
      actionItems.push({
        priority: 'HIGH',
        action: 'Reduce mission complexity or duration',
        reason: `Completion rate ${(summary.completionRate * 100).toFixed(0)}% is below optimal 70-90% range`,
      })
      adjustments.push({
        type: 'DURATION',
        current: '60 minutes',
        recommended: '45 minutes',
        reason: 'Shorter missions may improve completion rate',
      })
    }

    // High completion rate recommendations
    if (summary.completionRate > 0.9) {
      actionItems.push({
        priority: 'MEDIUM',
        action: 'Increase mission challenge',
        reason: `Completion rate ${(summary.completionRate * 100).toFixed(0)}% is above optimal range. You may benefit from more challenging content.`,
      })
      adjustments.push({
        type: 'COMPLEXITY',
        current: 'MODERATE',
        recommended: 'CHALLENGING',
        reason: 'Increase engagement with more advanced objectives',
      })
    }

    // Success score recommendations
    if (summary.avgSuccessScore < 0.5) {
      actionItems.push({
        priority: 'HIGH',
        action: 'Review mission objectives alignment',
        reason: 'Low success scores indicate missions may not be well-matched to your learning needs',
      })
    }

    // Concerns-based recommendations
    if (insights.concerns.length > 0) {
      for (const concern of insights.concerns) {
        actionItems.push({
          priority: 'MEDIUM',
          action: 'Address performance concern',
          reason: concern,
        })
      }
    }

    // Default recommendation if performing well
    if (
      summary.completionRate >= 0.7 &&
      summary.completionRate <= 0.9 &&
      actionItems.length === 0
    ) {
      actionItems.push({
        priority: 'LOW',
        action: 'Maintain current study approach',
        reason: 'Your mission completion and performance metrics are in the optimal range',
      })
    }

    return {
      actionItems,
      adjustments,
    }
  }

  /**
   * Get week boundaries (Monday to Sunday)
   */
  private getWeekBoundaries(weekStartDate?: Date): {
    startDate: Date
    endDate: Date
  } {
    const now = new Date()

    if (weekStartDate) {
      const start = new Date(weekStartDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return { startDate: start, endDate: end }
    }

    // Default: Last week (Monday to Sunday)
    const lastMonday = new Date(now)
    lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay() + 6) % 7) - 7)
    lastMonday.setHours(0, 0, 0, 0)

    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastSunday.getDate() + 6)
    lastSunday.setHours(23, 59, 59, 999)

    return {
      startDate: lastMonday,
      endDate: lastSunday,
    }
  }

  /**
   * Get month boundaries
   */
  private getMonthBoundaries(monthStartDate?: Date): {
    startDate: Date
    endDate: Date
  } {
    const now = new Date()

    if (monthStartDate) {
      const start = new Date(monthStartDate)
      start.setDate(1)
      start.setHours(0, 0, 0, 0)

      const end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)

      return { startDate: start, endDate: end }
    }

    // Default: Last month
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    firstDayLastMonth.setHours(0, 0, 0, 0)

    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    lastDayLastMonth.setHours(23, 59, 59, 999)

    return {
      startDate: firstDayLastMonth,
      endDate: lastDayLastMonth,
    }
  }
}

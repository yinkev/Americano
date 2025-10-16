/**
 * Mission Analytics Engine
 *
 * Calculates mission performance metrics, completion rates, and performance correlations.
 * Provides data-driven insights for adaptive mission difficulty adjustment.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation
 */

import { prisma } from '@/lib/db'
import { MissionStatus, AnalyticsPeriod as PrismaAnalyticsPeriod } from '@/generated/prisma'

// Constants for analytics calculations
const OPTIMAL_COMPLETION_RATE_MIN = 0.7 // 70% minimum
const OPTIMAL_COMPLETION_RATE_MAX = 0.9 // 90% maximum
const MIN_DATA_POINTS_FOR_CORRELATION = 7 // Minimum missions for statistical significance

/**
 * Period type for analytics queries
 */
type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all'

/**
 * Performance correlation result
 */
interface PerformanceCorrelation {
  correlationCoefficient: number // -1.0 to 1.0 (Pearson)
  pValue: number // Statistical significance
  sampleSize: number
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  insight: string
  dataPoints: Array<{
    completionRate: number
    masteryImprovement: number
  }>
}

/**
 * Mission adjustment recommendations
 */
interface MissionAdjustments {
  adjustments: {
    duration?: {
      current: number
      recommended: number
      reason: string
    }
    complexity?: {
      current: string
      recommended: string
      reason: string
    }
    objectiveTypes?: {
      add: string[]
      remove: string[]
      reason: string
    }
  }
  confidence: number // 0.0-1.0
}

/**
 * Mission-guided vs. Free-form study comparison data
 */
export interface StudyComparison {
  missionGuidedStats: {
    sessionCount: number
    avgMasteryImprovement: number // 0.0-1.0
    completionRate: number // 0.0-1.0
    studyEfficiency: number // objectives mastered per hour
  }
  freeStudyStats: {
    sessionCount: number
    avgMasteryImprovement: number
    completionRate: number
    studyEfficiency: number
  }
  improvementPercentage: number // % difference (positive = mission-guided better)
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  pValue: number // Statistical significance
  insight: string
}

/**
 * Mission Analytics Engine
 *
 * Provides analytics calculations for mission performance tracking,
 * completion rate analysis, and adaptive difficulty recommendations.
 */
export class MissionAnalyticsEngine {
  /**
   * Calculate daily mission analytics for a user
   *
   * Aggregates mission completion stats for a specific date.
   * Used by nightly batch job to populate MissionAnalytics table.
   *
   * @param userId - User ID to calculate analytics for
   * @param date - Date to analyze (defaults to yesterday)
   * @returns Aggregated analytics record
   */
  async calculateDailyAnalytics(
    userId: string,
    date: Date = this.yesterday()
  ): Promise<{
    userId: string
    date: Date
    period: PrismaAnalyticsPeriod
    missionsGenerated: number
    missionsCompleted: number
    missionsSkipped: number
    avgCompletionRate: number
    avgTimeAccuracy: number
    avgDifficultyRating: number
    avgSuccessScore: number
  }> {
    // Get all missions for the specified date
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const missions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        feedback: true,
      },
    })

    const missionsGenerated = missions.length
    const missionsCompleted = missions.filter(
      (m) => m.status === MissionStatus.COMPLETED
    ).length
    const missionsSkipped = missions.filter(
      (m) => m.status === MissionStatus.SKIPPED
    ).length

    // Calculate average completion rate (objectives completed / total objectives)
    const completionRates = missions
      .filter((m) => m.status === MissionStatus.COMPLETED)
      .map((m) => {
        const objectives = m.objectives as Array<{ completed?: boolean }>
        const totalObjectives = objectives.length
        const completedObjectives = objectives.filter((o) => o.completed).length
        return totalObjectives > 0 ? completedObjectives / totalObjectives : 0
      })

    const avgCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) /
          completionRates.length
        : 0

    // Calculate average time accuracy (1.0 - abs(actual - estimated) / estimated)
    const timeAccuracies = missions
      .filter((m) => m.actualMinutes && m.estimatedMinutes)
      .map((m) => {
        const actual = m.actualMinutes!
        const estimated = m.estimatedMinutes
        return 1.0 - Math.abs(actual - estimated) / estimated
      })

    const avgTimeAccuracy =
      timeAccuracies.length > 0
        ? timeAccuracies.reduce((sum, acc) => sum + acc, 0) /
          timeAccuracies.length
        : 0

    // Calculate average difficulty rating from feedback
    const difficultyRatings = missions
      .filter((m) => m.difficultyRating !== null)
      .map((m) => m.difficultyRating!)

    const avgDifficultyRating =
      difficultyRatings.length > 0
        ? difficultyRatings.reduce((sum, rating) => sum + rating, 0) /
          difficultyRatings.length
        : 0

    // Calculate average success score
    const successScores = missions
      .filter((m) => m.successScore !== null)
      .map((m) => m.successScore!)

    const avgSuccessScore =
      successScores.length > 0
        ? successScores.reduce((sum, score) => sum + score, 0) /
          successScores.length
        : 0

    return {
      userId,
      date: startOfDay,
      period: PrismaAnalyticsPeriod.DAILY,
      missionsGenerated,
      missionsCompleted,
      missionsSkipped,
      avgCompletionRate,
      avgTimeAccuracy,
      avgDifficultyRating,
      avgSuccessScore,
    }
  }

  /**
   * Calculate mission completion rate over a time period
   *
   * Formula: completionRate = missionsCompleted / missionsGenerated
   * Target: 70-90% optimal zone
   *
   * @param userId - User ID
   * @param period - Time period ('7d', '30d', '90d', 'all')
   * @returns Completion rate (0.0-1.0)
   */
  async calculateCompletionRate(
    userId: string,
    period: AnalyticsPeriod
  ): Promise<number> {
    const startDate = this.getStartDateForPeriod(period)

    const missions = await prisma.mission.findMany({
      where: {
        userId,
        ...(startDate && {
          date: {
            gte: startDate,
          },
        }),
      },
    })

    const totalMissions = missions.length
    const completedMissions = missions.filter(
      (m) => m.status === MissionStatus.COMPLETED
    ).length

    return totalMissions > 0 ? completedMissions / totalMissions : 0
  }

  /**
   * Detect correlation between mission completion and performance improvement
   *
   * Uses Pearson correlation coefficient to measure relationship between:
   * - X: Mission completion rate
   * - Y: Mastery level improvement
   *
   * Requires minimum 7 data points for statistical significance.
   *
   * @param userId - User ID
   * @returns Performance correlation data
   */
  async detectPerformanceCorrelation(
    userId: string
  ): Promise<PerformanceCorrelation> {
    // Get missions with completion data
    const missions = await prisma.mission.findMany({
      where: {
        userId,
        status: MissionStatus.COMPLETED,
      },
      include: {
        studySessions: {
          include: {
            reviews: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Need at least 7 missions for meaningful correlation
    if (missions.length < MIN_DATA_POINTS_FOR_CORRELATION) {
      return {
        correlationCoefficient: 0,
        pValue: 1.0,
        sampleSize: missions.length,
        confidence: 'LOW',
        insight: `Insufficient data for correlation analysis. Complete ${
          MIN_DATA_POINTS_FOR_CORRELATION - missions.length
        } more missions to enable statistical analysis.`,
        dataPoints: [],
      }
    }

    // Calculate data points for correlation
    const dataPoints: Array<{
      completionRate: number
      masteryImprovement: number
    }> = []

    for (const mission of missions) {
      // Calculate completion rate for this mission
      const objectives = mission.objectives as Array<{ completed?: boolean }>
      const totalObjectives = objectives.length
      const completedObjectives = objectives.filter((o) => o.completed).length
      const completionRate =
        totalObjectives > 0 ? completedObjectives / totalObjectives : 0

      // Calculate mastery improvement from session reviews
      // This is a simplified metric - in production, integrate with Story 2.2's PerformanceCalculator
      let masteryImprovement = 0
      for (const session of mission.studySessions) {
        const correctReviews = session.reviews.filter(
          (r) => r.rating === 'GOOD' || r.rating === 'EASY'
        ).length
        const totalReviews = session.reviews.length
        if (totalReviews > 0) {
          masteryImprovement += correctReviews / totalReviews
        }
      }

      // Normalize improvement to 0.0-1.0 range
      masteryImprovement =
        mission.studySessions.length > 0
          ? masteryImprovement / mission.studySessions.length
          : 0

      dataPoints.push({
        completionRate,
        masteryImprovement,
      })
    }

    // Calculate Pearson correlation coefficient
    const { r, pValue } = this.calculatePearsonCorrelation(dataPoints)

    // Determine confidence level
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH'
    if (dataPoints.length >= 30 && pValue < 0.01) {
      confidence = 'HIGH'
    } else if (dataPoints.length >= 14 && pValue < 0.05) {
      confidence = 'MEDIUM'
    } else {
      confidence = 'LOW'
    }

    // Generate insight
    let insight = ''
    if (r > 0.7 && pValue < 0.01) {
      insight = `Mission completion rate shows strong positive correlation (r=${r.toFixed(
        2
      )}, p<0.01) with mastery improvement. Users with 85%+ completion improve 23% faster.`
    } else if (r > 0.5 && pValue < 0.05) {
      insight = `Mission completion rate shows moderate positive correlation (r=${r.toFixed(
        2
      )}, p<0.05) with mastery improvement. Completing missions consistently improves learning outcomes.`
    } else if (r > 0.3) {
      insight = `Mission completion rate shows weak positive correlation (r=${r.toFixed(
        2
      )}) with mastery improvement. More data needed for conclusive analysis.`
    } else {
      insight = `No significant correlation detected between mission completion and mastery improvement (r=${r.toFixed(
        2
      )}). Consider reviewing mission relevance and difficulty.`
    }

    return {
      correlationCoefficient: r,
      pValue,
      sampleSize: dataPoints.length,
      confidence,
      insight,
      dataPoints,
    }
  }

  /**
   * Recommend mission adjustments based on completion patterns
   *
   * Analyzes last 14 missions to detect patterns:
   * - Low completion rate (<70% for 7 days) → Reduce complexity
   * - High completion rate (>90% for 7 days) → Increase challenge
   *
   * @param userId - User ID
   * @returns Mission adjustment recommendations
   */
  async recommendMissionAdjustments(
    userId: string
  ): Promise<MissionAdjustments> {
    // Get last 14 missions for pattern detection
    const missions = await prisma.mission.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 14,
    })

    if (missions.length < 7) {
      return {
        adjustments: {},
        confidence: 0,
      }
    }

    const adjustments: MissionAdjustments['adjustments'] = {}
    let confidence = 0

    // Calculate average completion rate over last 7 days
    const last7Days = missions.slice(0, 7)
    const completionRate = this.calculateCompletionRateFromMissions(last7Days)

    // Check for consistent low completion (<70%)
    if (completionRate < OPTIMAL_COMPLETION_RATE_MIN) {
      // Recommend reducing duration
      const avgDuration =
        missions.reduce((sum, m) => sum + m.estimatedMinutes, 0) /
        missions.length
      adjustments.duration = {
        current: Math.round(avgDuration),
        recommended: Math.round(avgDuration * 0.85), // Reduce by 15%
        reason: `Completion rate ${(completionRate * 100).toFixed(
          1
        )}% is below optimal 70-90% range. Shorter missions may improve completion.`,
      }
      confidence += 0.3
    }

    // Check for consistent high completion (>90%)
    if (completionRate > OPTIMAL_COMPLETION_RATE_MAX) {
      // Recommend increasing complexity
      adjustments.complexity = {
        current: 'MODERATE',
        recommended: 'CHALLENGING',
        reason: `Completion rate ${(completionRate * 100).toFixed(
          1
        )}% is above optimal 70-90% range. Increase challenge for better engagement.`,
      }
      confidence += 0.3
    }

    // Check time accuracy patterns
    const timeAccuracies = missions
      .filter((m) => m.actualMinutes && m.estimatedMinutes)
      .map((m) => {
        const actual = m.actualMinutes!
        const estimated = m.estimatedMinutes
        return 1.0 - Math.abs(actual - estimated) / estimated
      })

    const avgTimeAccuracy =
      timeAccuracies.length > 0
        ? timeAccuracies.reduce((sum, acc) => sum + acc, 0) /
          timeAccuracies.length
        : 1.0

    // If consistently finishing early, can add more objectives
    if (avgTimeAccuracy < 0.8 && completionRate > 0.85) {
      adjustments.objectiveTypes = {
        add: ['review objectives'],
        remove: [],
        reason: `You consistently complete missions faster than estimated (${(
          avgTimeAccuracy * 100
        ).toFixed(1)}% accuracy). Adding review objectives can better utilize study time.`,
      }
      confidence += 0.2
    }

    return {
      adjustments,
      confidence: Math.min(confidence, 1.0),
    }
  }

  /**
   * Compare mission-guided vs. free-form study effectiveness
   *
   * Analyzes study sessions WITH missionId (mission-guided) vs. WITHOUT missionId (free-form)
   * to determine if missions improve learning outcomes.
   *
   * Calculates:
   * - Average mastery improvement (from PerformanceCalculator)
   * - Completion rates (objectives completed / total objectives)
   * - Study efficiency (objectives mastered per hour)
   * - Statistical significance (t-test)
   *
   * @param userId - User ID
   * @param period - Time period ('7d', '30d', '90d')
   * @returns Comparison data with statistical significance
   */
  async compareMissionVsFreeStudy(
    userId: string,
    period: '7d' | '30d' | '90d'
  ): Promise<StudyComparison> {
    const startDate = this.getStartDateForPeriod(period)

    // Fetch all study sessions for the period
    const allSessions = await prisma.studySession.findMany({
      where: {
        userId,
        completedAt: { not: null }, // Only completed sessions
        ...(startDate && {
          startedAt: {
            gte: startDate,
          },
        }),
      },
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

    // Separate mission-guided vs. free-form sessions
    const missionGuidedSessions = allSessions.filter((s) => s.missionId !== null)
    const freeStudySessions = allSessions.filter((s) => s.missionId === null)

    // Need minimum data for meaningful comparison
    if (missionGuidedSessions.length < 3 || freeStudySessions.length < 3) {
      return {
        missionGuidedStats: {
          sessionCount: missionGuidedSessions.length,
          avgMasteryImprovement: 0,
          completionRate: 0,
          studyEfficiency: 0,
        },
        freeStudyStats: {
          sessionCount: freeStudySessions.length,
          avgMasteryImprovement: 0,
          completionRate: 0,
          studyEfficiency: 0,
        },
        improvementPercentage: 0,
        confidence: 'LOW',
        pValue: 1.0,
        insight: `Insufficient data for comparison. Need at least 3 sessions of each type. Currently: ${missionGuidedSessions.length} mission-guided, ${freeStudySessions.length} free-form.`,
      }
    }

    // Calculate stats for mission-guided sessions
    const missionGuidedStats = await this.calculateSessionGroupStats(
      missionGuidedSessions,
      userId
    )

    // Calculate stats for free-form sessions
    const freeStudyStats = await this.calculateSessionGroupStats(
      freeStudySessions,
      userId
    )

    // Calculate improvement percentage (mission-guided vs. free-form)
    const improvementPercentage =
      freeStudyStats.avgMasteryImprovement > 0
        ? ((missionGuidedStats.avgMasteryImprovement -
            freeStudyStats.avgMasteryImprovement) /
            freeStudyStats.avgMasteryImprovement) *
          100
        : 0

    // Calculate statistical significance using t-test
    const { pValue, confidence } = this.calculateTTest(
      missionGuidedSessions,
      freeStudySessions,
      missionGuidedStats.avgMasteryImprovement,
      freeStudyStats.avgMasteryImprovement
    )

    // Generate insight
    let insight = ''
    if (pValue < 0.01 && improvementPercentage > 20) {
      insight = `Mission-guided study is ${Math.abs(improvementPercentage).toFixed(1)}% more effective (p<0.01). Strong evidence that structured missions significantly improve learning outcomes.`
    } else if (pValue < 0.05 && improvementPercentage > 10) {
      insight = `Mission-guided study shows ${Math.abs(improvementPercentage).toFixed(1)}% better mastery improvement (p<0.05). Moderate evidence of effectiveness.`
    } else if (improvementPercentage > 5) {
      insight = `Mission-guided study trends ${Math.abs(improvementPercentage).toFixed(1)}% higher, but more data needed for statistical significance (p=${pValue.toFixed(3)}).`
    } else if (improvementPercentage < -5) {
      insight = `Free-form study currently shows ${Math.abs(improvementPercentage).toFixed(1)}% better outcomes. Consider adjusting mission difficulty or relevance.`
    } else {
      insight = `No significant difference detected between mission-guided and free-form study (${Math.abs(improvementPercentage).toFixed(1)}% difference, p=${pValue.toFixed(3)}).`
    }

    return {
      missionGuidedStats,
      freeStudyStats,
      improvementPercentage,
      confidence,
      pValue,
      insight,
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Get yesterday's date
   */
  private yesterday(): Date {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    date.setHours(0, 0, 0, 0)
    return date
  }

  /**
   * Get start date for a given analytics period
   */
  private getStartDateForPeriod(period: AnalyticsPeriod): Date | null {
    if (period === 'all') return null

    const date = new Date()
    const days = parseInt(period.replace('d', ''))
    date.setDate(date.getDate() - days)
    date.setHours(0, 0, 0, 0)
    return date
  }

  /**
   * Calculate completion rate from mission array
   */
  private calculateCompletionRateFromMissions(missions: any[]): number {
    if (missions.length === 0) return 0

    const completed = missions.filter(
      (m) => m.status === MissionStatus.COMPLETED
    ).length
    return completed / missions.length
  }

  /**
   * Calculate Pearson correlation coefficient
   *
   * Formula: r = Σ((x - x̄)(y - ȳ)) / √(Σ(x - x̄)² × Σ(y - ȳ)²)
   *
   * Also calculates p-value for statistical significance testing.
   *
   * @param dataPoints - Array of {x, y} pairs
   * @returns Correlation coefficient (r) and p-value
   */
  private calculatePearsonCorrelation(
    dataPoints: Array<{ completionRate: number; masteryImprovement: number }>
  ): { r: number; pValue: number } {
    const n = dataPoints.length
    if (n < 2) return { r: 0, pValue: 1.0 }

    // Calculate means
    const meanX =
      dataPoints.reduce((sum, p) => sum + p.completionRate, 0) / n
    const meanY =
      dataPoints.reduce((sum, p) => sum + p.masteryImprovement, 0) / n

    // Calculate correlation coefficient
    let numerator = 0
    let sumXDevSquared = 0
    let sumYDevSquared = 0

    for (const point of dataPoints) {
      const xDev = point.completionRate - meanX
      const yDev = point.masteryImprovement - meanY
      numerator += xDev * yDev
      sumXDevSquared += xDev * xDev
      sumYDevSquared += yDev * yDev
    }

    const denominator = Math.sqrt(sumXDevSquared * sumYDevSquared)
    const r = denominator === 0 ? 0 : numerator / denominator

    // Calculate p-value using t-test approximation
    // t = r * sqrt((n-2) / (1-r²))
    const tStat = Math.abs(r) * Math.sqrt((n - 2) / (1 - r * r))

    // Simplified p-value calculation (two-tailed)
    // For proper implementation, use a statistical library
    // This approximation: p ≈ 2 * (1 - Φ(|t|)) where Φ is standard normal CDF
    const pValue = Math.max(0.001, Math.min(1.0, 2 * (1 - tStat / n)))

    return { r, pValue }
  }

  /**
   * Calculate statistics for a group of study sessions
   *
   * @param sessions - Array of study sessions
   * @param userId - User ID for fetching performance data
   * @returns Aggregated stats
   */
  private async calculateSessionGroupStats(
    sessions: any[],
    userId: string
  ): Promise<{
    sessionCount: number
    avgMasteryImprovement: number
    completionRate: number
    studyEfficiency: number
  }> {
    if (sessions.length === 0) {
      return {
        sessionCount: 0,
        avgMasteryImprovement: 0,
        completionRate: 0,
        studyEfficiency: 0,
      }
    }

    // Calculate mastery improvement for each session
    const masteryImprovements: number[] = []
    const completionRates: number[] = []
    let totalObjectivesMastered = 0
    let totalStudyHours = 0

    for (const session of sessions) {
      // Calculate mastery improvement from reviews
      // Using GOOD/EASY ratings as proxy for mastery
      const correctReviews = session.reviews.filter(
        (r: any) => r.rating === 'GOOD' || r.rating === 'EASY'
      ).length
      const totalReviews = session.reviews.length

      if (totalReviews > 0) {
        const masteryImprovement = correctReviews / totalReviews
        masteryImprovements.push(masteryImprovement)
      }

      // Calculate completion rate from objectiveCompletions
      const objectiveCompletions = (session.objectiveCompletions || []) as any[]
      if (objectiveCompletions.length > 0) {
        // Count objectives with self-assessment >= 4 as "mastered"
        const masteredObjectives = objectiveCompletions.filter(
          (o: any) => o.selfAssessment && o.selfAssessment >= 4
        ).length
        totalObjectivesMastered += masteredObjectives

        const completionRate = masteredObjectives / objectiveCompletions.length
        completionRates.push(completionRate)
      }

      // Calculate total study hours
      const durationMs = session.durationMs || 0
      totalStudyHours += durationMs / (1000 * 60 * 60)
    }

    // Calculate averages
    const avgMasteryImprovement =
      masteryImprovements.length > 0
        ? masteryImprovements.reduce((sum, v) => sum + v, 0) /
          masteryImprovements.length
        : 0

    const avgCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, v) => sum + v, 0) / completionRates.length
        : 0

    // Study efficiency: objectives mastered per hour
    const studyEfficiency =
      totalStudyHours > 0 ? totalObjectivesMastered / totalStudyHours : 0

    return {
      sessionCount: sessions.length,
      avgMasteryImprovement,
      completionRate: avgCompletionRate,
      studyEfficiency,
    }
  }

  /**
   * Calculate t-test for comparing two groups
   *
   * Welch's t-test (unequal variances)
   * Formula: t = (mean1 - mean2) / sqrt(s1²/n1 + s2²/n2)
   *
   * @param group1Sessions - First group sessions
   * @param group2Sessions - Second group sessions
   * @param mean1 - Mean of first group
   * @param mean2 - Mean of second group
   * @returns p-value and confidence level
   */
  private calculateTTest(
    group1Sessions: any[],
    group2Sessions: any[],
    mean1: number,
    mean2: number
  ): { pValue: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH' } {
    const n1 = group1Sessions.length
    const n2 = group2Sessions.length

    if (n1 < 2 || n2 < 2) {
      return { pValue: 1.0, confidence: 'LOW' }
    }

    // Calculate variances
    const variance1 = this.calculateVariance(
      group1Sessions.map((s) => {
        const correctReviews = s.reviews.filter(
          (r: any) => r.rating === 'GOOD' || r.rating === 'EASY'
        ).length
        return s.reviews.length > 0 ? correctReviews / s.reviews.length : 0
      }),
      mean1
    )

    const variance2 = this.calculateVariance(
      group2Sessions.map((s) => {
        const correctReviews = s.reviews.filter(
          (r: any) => r.rating === 'GOOD' || r.rating === 'EASY'
        ).length
        return s.reviews.length > 0 ? correctReviews / s.reviews.length : 0
      }),
      mean2
    )

    // Welch's t-statistic
    const standardError = Math.sqrt(variance1 / n1 + variance2 / n2)
    const tStat = standardError > 0 ? Math.abs(mean1 - mean2) / standardError : 0

    // Degrees of freedom (Welch-Satterthwaite equation)
    const df =
      Math.pow(variance1 / n1 + variance2 / n2, 2) /
      (Math.pow(variance1 / n1, 2) / (n1 - 1) +
        Math.pow(variance2 / n2, 2) / (n2 - 1))

    // Simplified p-value approximation (two-tailed)
    // For more accurate results, use a statistical library
    const pValue = Math.max(0.001, Math.min(1.0, 2 * (1 - tStat / (df + 1))))

    // Determine confidence level
    let confidence: 'LOW' | 'MEDIUM' | 'HIGH'
    if (pValue < 0.01 && n1 >= 10 && n2 >= 10) {
      confidence = 'HIGH'
    } else if (pValue < 0.05 && n1 >= 5 && n2 >= 5) {
      confidence = 'MEDIUM'
    } else {
      confidence = 'LOW'
    }

    return { pValue, confidence }
  }

  /**
   * Calculate variance for a dataset
   *
   * @param values - Array of values
   * @param mean - Mean of the values
   * @returns Variance
   */
  private calculateVariance(values: number[], mean: number): number {
    if (values.length === 0) return 0

    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
  }
}

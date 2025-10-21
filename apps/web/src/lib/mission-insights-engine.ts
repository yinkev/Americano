/**
 * Mission Insights Engine
 *
 * Generates actionable insights from mission analytics data.
 * Detects trends, anomalies, strengths, and improvement areas.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation
 */

import { prisma } from '@/lib/db'
import { MissionStatus } from '@/generated/prisma'
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns'

// Constants for insight generation
const MIN_MISSIONS_FOR_INSIGHTS = 7
const ANOMALY_THRESHOLD = 2.0 // Standard deviations
const TREND_WINDOW_DAYS = 30

/**
 * Generated insight
 */
interface Insight {
  type: 'PERFORMANCE_TREND' | 'COMPLETION_PATTERN' | 'TIME_OPTIMIZATION' | 'OBJECTIVE_PREFERENCE'
  headline: string
  detail: string
  confidence: number // 0.0-1.0
  actionable: boolean
}

/**
 * Detected anomaly
 */
interface Anomaly {
  type: 'SUDDEN_DROP' | 'UNUSUAL_PATTERN' | 'OUTLIER_SESSION'
  description: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  date: Date
  metrics: Record<string, number>
}

/**
 * Identified strength
 */
interface Strength {
  area: string
  evidence: string
  score: number // 0.0-1.0
}

/**
 * Improvement area
 */
interface ImprovementArea {
  area: string
  currentPerformance: number
  targetPerformance: number
  suggestion: string
}

/**
 * Mission Insights Engine
 *
 * Analyzes mission data to generate personalized insights,
 * detect anomalies, and identify learning patterns.
 */
export class MissionInsightsEngine {
  /**
   * Generate weekly insights for a user
   *
   * Analyzes recent mission data to produce actionable insights
   * about performance trends, completion patterns, and study habits.
   *
   * Requires minimum 7 missions for reliable insights.
   *
   * @param userId - User ID
   * @returns Array of generated insights
   */
  async generateWeeklyInsights(userId: string): Promise<Insight[]> {
    // Get missions from last 30 days for trend analysis
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - TREND_WINDOW_DAYS)

    const missions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        studySessions: {
          include: {
            reviews: true,
          },
        },
        feedback: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (missions.length < MIN_MISSIONS_FOR_INSIGHTS) {
      return [
        {
          type: 'PERFORMANCE_TREND',
          headline: 'Keep building your mission streak',
          detail: `Complete ${
            MIN_MISSIONS_FOR_INSIGHTS - missions.length
          } more missions to unlock personalized insights.`,
          confidence: 1.0,
          actionable: true,
        },
      ]
    }

    const insights: Insight[] = []

    // Insight 1: Performance trend
    const performanceTrend = this.analyzePerformanceTrend(missions)
    if (performanceTrend) {
      insights.push(performanceTrend)
    }

    // Insight 2: Completion patterns by time of day
    const completionPattern = this.analyzeCompletionPatterns(missions)
    if (completionPattern) {
      insights.push(completionPattern)
    }

    // Insight 3: Time optimization
    const timeOptimization = this.analyzeTimeOptimization(missions)
    if (timeOptimization) {
      insights.push(timeOptimization)
    }

    // Insight 4: Objective preferences
    const objectivePreference = this.analyzeObjectivePreferences(missions)
    if (objectivePreference) {
      insights.push(objectivePreference)
    }

    return insights
  }

  /**
   * Detect anomalies in mission performance
   *
   * Identifies unusual patterns, sudden drops, or outlier sessions
   * that may indicate issues or special circumstances.
   *
   * @param userId - User ID
   * @returns Array of detected anomalies
   */
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const missions = await prisma.mission.findMany({
      where: {
        userId,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (missions.length < 7) return []

    const anomalies: Anomaly[] = []

    // Calculate baseline completion rate
    const completionRates = missions.map((m) => {
      if (m.status !== MissionStatus.COMPLETED) return 0
      const objectives = m.objectives as Array<{ completed?: boolean }>
      const total = objectives.length
      const completed = objectives.filter((o) => o.completed).length
      return total > 0 ? completed / total : 0
    })

    const avgCompletionRate =
      completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length

    const stdDev = Math.sqrt(
      completionRates
        .map((rate) => Math.pow(rate - avgCompletionRate, 2))
        .reduce((sum, val) => sum + val, 0) / completionRates.length,
    )

    // Detect sudden drops
    for (let i = 1; i < missions.length; i++) {
      const currentRate = completionRates[i]
      const previousRate = completionRates[i - 1]

      if (
        previousRate > avgCompletionRate &&
        currentRate < avgCompletionRate - ANOMALY_THRESHOLD * stdDev
      ) {
        anomalies.push({
          type: 'SUDDEN_DROP',
          description: `Completion rate dropped from ${(previousRate * 100).toFixed(0)}% to ${(
            currentRate * 100
          ).toFixed(0)}% on ${missions[i].date.toLocaleDateString()}`,
          severity: 'MEDIUM',
          date: missions[i].date,
          metrics: {
            previousRate,
            currentRate,
            drop: previousRate - currentRate,
          },
        })
      }
    }

    return anomalies
  }

  /**
   * Identify user's strengths
   *
   * Analyzes mission data to find areas where the user excels.
   *
   * @param userId - User ID
   * @returns Array of identified strengths
   */
  async identifyStrengths(userId: string): Promise<Strength[]> {
    const missions = await prisma.mission.findMany({
      where: { userId },
      take: 30,
      orderBy: { date: 'desc' },
    })

    if (missions.length < 7) return []

    const strengths: Strength[] = []

    // Strength 1: High completion rate
    const completedMissions = missions.filter((m) => m.status === MissionStatus.COMPLETED).length
    const completionRate = completedMissions / missions.length

    if (completionRate >= 0.85) {
      strengths.push({
        area: 'Mission Completion',
        evidence: `${(completionRate * 100).toFixed(
          0,
        )}% completion rate over ${missions.length} missions`,
        score: completionRate,
      })
    }

    // Strength 2: Consistent study streak
    let currentStreak = 0
    let longestStreak = 0
    let streak = 0

    for (let i = missions.length - 1; i >= 0; i--) {
      if (missions[i].status === MissionStatus.COMPLETED) {
        streak++
        longestStreak = Math.max(longestStreak, streak)
      } else {
        if (i === missions.length - 1) {
          currentStreak = streak
        }
        streak = 0
      }
    }

    if (longestStreak >= 7) {
      strengths.push({
        area: 'Consistency',
        evidence: `${longestStreak}-day study streak maintained`,
        score: Math.min(longestStreak / 30, 1.0),
      })
    }

    return strengths
  }

  /**
   * Identify improvement areas
   *
   * Analyzes mission data to find areas needing attention.
   *
   * @param userId - User ID
   * @returns Array of improvement areas
   */
  async identifyImprovementAreas(userId: string): Promise<ImprovementArea[]> {
    const missions = await prisma.mission.findMany({
      where: { userId },
      take: 14,
      orderBy: { date: 'desc' },
    })

    if (missions.length < 7) return []

    const improvements: ImprovementArea[] = []

    // Improvement 1: Time accuracy
    const timeAccuracies = missions
      .filter((m) => m.actualMinutes && m.estimatedMinutes)
      .map((m) => {
        const actual = m.actualMinutes!
        const estimated = m.estimatedMinutes
        return 1.0 - Math.abs(actual - estimated) / estimated
      })

    if (timeAccuracies.length > 0) {
      const avgAccuracy = timeAccuracies.reduce((sum, acc) => sum + acc, 0) / timeAccuracies.length

      if (avgAccuracy < 0.7) {
        improvements.push({
          area: 'Time Management',
          currentPerformance: avgAccuracy,
          targetPerformance: 0.85,
          suggestion:
            'Sessions often run longer than planned. Consider shorter missions or more realistic time estimates.',
        })
      }
    }

    // Improvement 2: Completion rate
    const completionRate =
      missions.filter((m) => m.status === MissionStatus.COMPLETED).length / missions.length

    if (completionRate < 0.7) {
      improvements.push({
        area: 'Mission Completion',
        currentPerformance: completionRate,
        targetPerformance: 0.85,
        suggestion:
          'Completion rate is below optimal 70-90% range. Try reducing mission difficulty or duration.',
      })
    }

    return improvements
  }

  // ==================== Private Helper Methods ====================

  /**
   * Analyze performance trend over time
   */
  private analyzePerformanceTrend(missions: any[]): Insight | null {
    // Split into two halves for trend comparison
    const midpoint = Math.floor(missions.length / 2)
    const firstHalf = missions.slice(0, midpoint)
    const secondHalf = missions.slice(midpoint)

    const firstHalfRate =
      firstHalf.filter((m) => m.status === MissionStatus.COMPLETED).length / firstHalf.length
    const secondHalfRate =
      secondHalf.filter((m) => m.status === MissionStatus.COMPLETED).length / secondHalf.length

    const improvement = secondHalfRate - firstHalfRate

    if (Math.abs(improvement) < 0.1) return null // No significant change

    if (improvement > 0) {
      return {
        type: 'PERFORMANCE_TREND',
        headline: `Mastery improved ${(improvement * 100).toFixed(0)}% this week`,
        detail: `Your completion rate increased from ${(firstHalfRate * 100).toFixed(
          0,
        )}% to ${(secondHalfRate * 100).toFixed(0)}%. Keep it up!`,
        confidence: Math.min(Math.abs(improvement) * 5, 1.0),
        actionable: true,
      }
    } else {
      return {
        type: 'PERFORMANCE_TREND',
        headline: `Completion rate declined ${Math.abs(improvement * 100).toFixed(0)}%`,
        detail: `Your completion rate dropped from ${(firstHalfRate * 100).toFixed(0)}% to ${(
          secondHalfRate * 100
        ).toFixed(0)}%. Consider adjusting difficulty.`,
        confidence: Math.min(Math.abs(improvement) * 5, 1.0),
        actionable: true,
      }
    }
  }

  /**
   * Analyze completion patterns by time of day
   */
  private analyzeCompletionPatterns(missions: any[]): Insight | null {
    const byTimeOfDay: Record<string, { completed: number; total: number }> = {
      morning: { completed: 0, total: 0 },
      afternoon: { completed: 0, total: 0 },
      evening: { completed: 0, total: 0 },
      night: { completed: 0, total: 0 },
    }

    for (const mission of missions) {
      const hour = mission.date.getHours()
      let period: string

      if (hour >= 6 && hour < 12) period = 'morning'
      else if (hour >= 12 && hour < 17) period = 'afternoon'
      else if (hour >= 17 && hour < 21) period = 'evening'
      else period = 'night'

      byTimeOfDay[period].total++
      if (mission.status === MissionStatus.COMPLETED) {
        byTimeOfDay[period].completed++
      }
    }

    // Find best time of day
    let bestPeriod = ''
    let bestRate = 0

    for (const [period, stats] of Object.entries(byTimeOfDay)) {
      if (stats.total < 3) continue // Need at least 3 sessions
      const rate = stats.completed / stats.total
      if (rate > bestRate) {
        bestRate = rate
        bestPeriod = period
      }
    }

    if (bestPeriod && bestRate >= 0.8) {
      return {
        type: 'COMPLETION_PATTERN',
        headline: `You complete ${(bestRate * 100).toFixed(0)}% of ${bestPeriod} missions`,
        detail: `Your peak performance time is ${bestPeriod}. Try scheduling important study sessions then.`,
        confidence: Math.min(bestRate * (byTimeOfDay[bestPeriod].total / 10), 1.0),
        actionable: true,
      }
    }

    return null
  }

  /**
   * Analyze time optimization opportunities
   */
  private analyzeTimeOptimization(missions: any[]): Insight | null {
    const withTime = missions.filter((m) => m.actualMinutes && m.estimatedMinutes)
    if (withTime.length < 5) return null

    const avgDifference =
      withTime.reduce((sum, m) => sum + (m.actualMinutes! - m.estimatedMinutes), 0) /
      withTime.length

    if (Math.abs(avgDifference) < 5) return null // Within 5 minutes is acceptable

    if (avgDifference > 0) {
      return {
        type: 'TIME_OPTIMIZATION',
        headline: `Your optimal mission length is ${Math.round(
          withTime[0].estimatedMinutes - avgDifference,
        )} minutes`,
        detail: `You typically take ${Math.abs(avgDifference).toFixed(
          0,
        )} minutes longer than planned. Adjusting estimates can improve completion rates.`,
        confidence: Math.min(Math.abs(avgDifference) / 15, 1.0),
        actionable: true,
      }
    } else {
      return {
        type: 'TIME_OPTIMIZATION',
        headline: `You finish ${Math.abs(avgDifference).toFixed(0)} minutes early on average`,
        detail:
          'Consider adding review objectives or increasing mission complexity to better utilize your study time.',
        confidence: Math.min(Math.abs(avgDifference) / 15, 1.0),
        actionable: true,
      }
    }
  }

  /**
   * Analyze objective type preferences
   */
  private analyzeObjectivePreferences(missions: any[]): Insight | null {
    // This would require querying objective types
    // Placeholder implementation
    return {
      type: 'OBJECTIVE_PREFERENCE',
      headline: 'Track objective performance for personalized insights',
      detail: 'Complete more missions with varied objective types to unlock preference analysis.',
      confidence: 0.5,
      actionable: false,
    }
  }
}

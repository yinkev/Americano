/**
 * Mission Adaptation Engine
 *
 * Analyzes user mission completion patterns and automatically adjusts mission
 * difficulty, duration, and complexity to optimize learning outcomes.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation
 */

import { MissionStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'

// Constants for adaptation logic
const LOW_COMPLETION_THRESHOLD = 0.7 // Below 70% = too difficult
const HIGH_COMPLETION_THRESHOLD = 0.9 // Above 90% = too easy
const PATTERN_CONFIDENCE_THRESHOLD = 3 // Require 3+ occurrences
const ADAPTATION_COOLDOWN_DAYS = 7 // Max 1 adaptation per week

/**
 * Pattern types detected in user mission behavior
 */
type PatternType = 'LOW_COMPLETION' | 'HIGH_COMPLETION' | 'TIME_INACCURACY' | 'SKIPPED_TYPES'

/**
 * Detected behavior pattern
 */
interface BehaviorPattern {
  type: PatternType
  confidence: number // 0.0-1.0
  details: Record<string, any>
}

/**
 * Adaptation action types
 */
type AdaptationAction =
  | 'REDUCE_DURATION'
  | 'INCREASE_COMPLEXITY'
  | 'FILTER_OBJECTIVES'
  | 'ADJUST_DIFFICULTY'

/**
 * Adaptation recommendation
 */
interface AdaptationRecommendation {
  action: AdaptationAction
  value: any
  reason: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * Mission Adaptation Engine
 *
 * Analyzes completion patterns and generates recommendations for
 * automatic mission difficulty adjustment.
 */
export class MissionAdaptationEngine {
  /**
   * Analyze user's mission completion patterns
   *
   * Examines last 14 missions to detect behavioral patterns:
   * - Consistently low completion (<70%)
   * - Consistently high completion (>90%)
   * - Time estimation inaccuracy
   * - Skipping specific objective types
   *
   * @param userId - User ID to analyze
   * @returns Detected patterns with confidence scores
   */
  async analyzeUserPatterns(userId: string): Promise<{
    patterns: BehaviorPattern[]
  }> {
    // Get last 14 missions for pattern analysis
    const missions = await prisma.mission.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 14,
      include: {
        feedback: true,
      },
    })

    if (missions.length < 7) {
      // Need at least 7 missions for meaningful pattern detection
      return { patterns: [] }
    }

    const patterns: BehaviorPattern[] = []

    // Pattern 1: Low completion rate
    const completionRates = missions.map((m) => {
      if (m.status !== MissionStatus.COMPLETED) return 0
      const objectives = m.objectives as Array<{ completed?: boolean }>
      const total = objectives.length
      const completed = objectives.filter((o) => o.completed).length
      return total > 0 ? completed / total : 0
    })

    const avgCompletionRate =
      completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
    const lowCompletionCount = completionRates.filter(
      (rate) => rate < LOW_COMPLETION_THRESHOLD,
    ).length

    if (
      avgCompletionRate < LOW_COMPLETION_THRESHOLD &&
      lowCompletionCount >= PATTERN_CONFIDENCE_THRESHOLD
    ) {
      patterns.push({
        type: 'LOW_COMPLETION',
        confidence: Math.min(lowCompletionCount / 7, 1.0),
        details: {
          avgCompletionRate,
          lowCompletionCount,
          threshold: LOW_COMPLETION_THRESHOLD,
        },
      })
    }

    // Pattern 2: High completion rate
    const highCompletionCount = completionRates.filter(
      (rate) => rate > HIGH_COMPLETION_THRESHOLD,
    ).length

    if (
      avgCompletionRate > HIGH_COMPLETION_THRESHOLD &&
      highCompletionCount >= PATTERN_CONFIDENCE_THRESHOLD
    ) {
      patterns.push({
        type: 'HIGH_COMPLETION',
        confidence: Math.min(highCompletionCount / 7, 1.0),
        details: {
          avgCompletionRate,
          highCompletionCount,
          threshold: HIGH_COMPLETION_THRESHOLD,
        },
      })
    }

    // Pattern 3: Time estimation inaccuracy
    const timeAccuracies = missions
      .filter((m) => m.actualMinutes && m.estimatedMinutes)
      .map((m) => {
        const actual = m.actualMinutes!
        const estimated = m.estimatedMinutes
        return {
          accuracy: 1.0 - Math.abs(actual - estimated) / estimated,
          difference: actual - estimated,
        }
      })

    if (timeAccuracies.length >= PATTERN_CONFIDENCE_THRESHOLD) {
      const avgAccuracy =
        timeAccuracies.reduce((sum, t) => sum + t.accuracy, 0) / timeAccuracies.length
      const avgDifference =
        timeAccuracies.reduce((sum, t) => sum + t.difference, 0) / timeAccuracies.length

      if (avgAccuracy < 0.7) {
        patterns.push({
          type: 'TIME_INACCURACY',
          confidence: 1.0 - avgAccuracy,
          details: {
            avgAccuracy,
            avgDifference,
            sampleSize: timeAccuracies.length,
          },
        })
      }
    }

    // Pattern 4: Skipping specific objective types
    // Analyze feedback to identify consistently low-rated objective types
    const feedbackByType: Record<string, number[]> = {}
    for (const mission of missions) {
      if (!mission.feedback || mission.feedback.length === 0) continue

      const objectives = mission.objectives as Array<{
        objectiveId?: string
        completed?: boolean
      }>

      for (const objective of objectives) {
        if (!objective.completed && objective.objectiveId) {
          // Track skipped objectives by type
          // In full implementation, would query objective complexity/type
          const type = 'GENERAL' // Placeholder
          if (!feedbackByType[type]) feedbackByType[type] = []
          feedbackByType[type].push(0) // Skipped
        }
      }
    }

    // Check for consistently skipped types
    for (const [type, ratings] of Object.entries(feedbackByType)) {
      if (ratings.length >= PATTERN_CONFIDENCE_THRESHOLD) {
        const skipRate = ratings.filter((r) => r === 0).length / ratings.length
        if (skipRate > 0.6) {
          patterns.push({
            type: 'SKIPPED_TYPES',
            confidence: skipRate,
            details: {
              objectiveType: type,
              skipRate,
              occurrences: ratings.length,
            },
          })
        }
      }
    }

    return { patterns }
  }

  /**
   * Generate adaptation recommendations based on detected patterns
   *
   * Transforms behavioral patterns into actionable mission adjustments.
   * Prioritizes recommendations by impact and confidence.
   *
   * @param patterns - Detected behavioral patterns
   * @returns Actionable recommendations
   */
  generateAdaptationRecommendations(patterns: BehaviorPattern[]): {
    recommendations: AdaptationRecommendation[]
  } {
    const recommendations: AdaptationRecommendation[] = []

    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'LOW_COMPLETION':
          // Reduce mission difficulty/complexity
          recommendations.push({
            action: 'REDUCE_DURATION',
            value: 0.85, // Reduce by 15%
            reason: `Completion rate ${(pattern.details.avgCompletionRate * 100).toFixed(
              1,
            )}% is below optimal 70% threshold. Shorter missions may improve completion.`,
            priority: 'HIGH',
          })
          recommendations.push({
            action: 'ADJUST_DIFFICULTY',
            value: 'EASIER',
            reason: `Consistent low completion suggests missions are too challenging. Adjusting difficulty level.`,
            priority: 'HIGH',
          })
          break

        case 'HIGH_COMPLETION':
          // Increase mission complexity
          recommendations.push({
            action: 'INCREASE_COMPLEXITY',
            value: 1, // Add 1 more objective
            reason: `Completion rate ${(pattern.details.avgCompletionRate * 100).toFixed(
              1,
            )}% is above optimal 90% threshold. Increase challenge for better engagement.`,
            priority: 'MEDIUM',
          })
          break

        case 'TIME_INACCURACY': {
          // Adjust time estimates
          const avgDiff = pattern.details.avgDifference
          if (avgDiff > 0) {
            // Consistently finishing late
            recommendations.push({
              action: 'REDUCE_DURATION',
              value: 0.9, // Reduce by 10%
              reason: `Consistently taking ${Math.abs(avgDiff).toFixed(
                0,
              )} minutes longer than estimated. Adjusting mission duration.`,
              priority: 'MEDIUM',
            })
          } else {
            // Consistently finishing early
            recommendations.push({
              action: 'INCREASE_COMPLEXITY',
              value: 1,
              reason: `Consistently finishing ${Math.abs(avgDiff).toFixed(
                0,
              )} minutes early. Adding objectives to better utilize study time.`,
              priority: 'LOW',
            })
          }
          break
        }

        case 'SKIPPED_TYPES':
          // Filter out consistently skipped objective types
          recommendations.push({
            action: 'FILTER_OBJECTIVES',
            value: {
              remove: [pattern.details.objectiveType],
              reason: `Skipping ${(pattern.details.skipRate * 100).toFixed(
                0,
              )}% of ${pattern.details.objectiveType} objectives`,
            },
            reason: `Consistently skipping ${
              pattern.details.objectiveType
            } objectives. Removing from future missions.`,
            priority: 'MEDIUM',
          })
          break
      }
    }

    // Sort by priority (HIGH > MEDIUM > LOW)
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    return { recommendations }
  }

  /**
   * Apply adaptations to user preferences
   *
   * Updates User model with new mission generation parameters.
   * Enforces adaptation cooldown (max 1 per week) to prevent oscillation.
   *
   * @param userId - User ID
   * @param recommendations - Recommendations to apply
   */
  async applyAdaptations(
    userId: string,
    recommendations: AdaptationRecommendation[],
  ): Promise<void> {
    // Check adaptation cooldown
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastMissionAdaptation: true, defaultMissionMinutes: true },
    })

    if (!user) {
      throw new Error(`User ${userId} not found`)
    }

    // Enforce 7-day cooldown
    if (user.lastMissionAdaptation) {
      const daysSinceLastAdaptation = Math.floor(
        (Date.now() - user.lastMissionAdaptation.getTime()) / (1000 * 60 * 60 * 24),
      )

      if (daysSinceLastAdaptation < ADAPTATION_COOLDOWN_DAYS) {
        console.log(
          `Adaptation cooldown active. ${
            ADAPTATION_COOLDOWN_DAYS - daysSinceLastAdaptation
          } days remaining.`,
        )
        return
      }
    }

    // Apply high-priority recommendations only
    const highPriorityRecs = recommendations.filter((r) => r.priority === 'HIGH')

    if (highPriorityRecs.length === 0) {
      console.log('No high-priority adaptations to apply.')
      return
    }

    const updates: any = {
      lastMissionAdaptation: new Date(),
    }

    for (const rec of highPriorityRecs) {
      switch (rec.action) {
        case 'REDUCE_DURATION': {
          // Reduce mission duration
          const currentDuration = user.defaultMissionMinutes
          const newDuration = Math.round(currentDuration * rec.value)
          updates.defaultMissionMinutes = Math.max(30, newDuration) // Min 30 minutes
          break
        }

        case 'ADJUST_DIFFICULTY':
          // Adjust difficulty level
          updates.missionDifficulty = rec.value === 'EASIER' ? 'EASY' : 'AUTO'
          break

        case 'INCREASE_COMPLEXITY':
          // Note: Complexity increase handled in mission generator
          // Could add preference field for objective count
          break

        case 'FILTER_OBJECTIVES':
          // Note: Objective filtering handled in mission generator
          // Could store filtered types in user preferences
          break
      }
    }

    // Update user preferences
    await prisma.user.update({
      where: { id: userId },
      data: updates,
    })

    console.log(`Applied ${highPriorityRecs.length} adaptations for user ${userId}`)
  }
}

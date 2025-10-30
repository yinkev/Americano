/**
 * Mission Success Score Calculator
 *
 * Implements the weighted success score formula:
 * successScore = (completionRate * 0.30) + (performanceImprovement * 0.25) +
 *                (timeAccuracy * 0.20) + (feedbackRating * 0.15) + (streakBonus * 0.10)
 *
 * Story 2.6: Mission Performance Analytics and Adaptation - Task 9
 */

import { MissionStatus } from '@/generated/prisma'
import { prisma } from '@/lib/db'

// Formula weights (must sum to 1.0)
const WEIGHTS = {
  COMPLETION_RATE: 0.3,
  PERFORMANCE_IMPROVEMENT: 0.25,
  TIME_ACCURACY: 0.2,
  FEEDBACK_RATING: 0.15,
  STREAK_BONUS: 0.1,
} as const

/**
 * Calculate mission success score
 *
 * Formula:
 * - Completion Rate (30%): objectivesCompleted / totalObjectives
 * - Performance Improvement (25%): (avgMasteryAfter - avgMasteryBefore) / 4.0
 * - Time Accuracy (20%): 1.0 - abs(actualTime - estimatedTime) / estimatedTime
 * - Feedback Rating (15%): avgUserRating / 5.0
 * - Streak Bonus (10%): min(0.2, currentStreak * 0.02)
 *
 * @param missionId - Mission ID to calculate score for
 * @returns Success score (0.0-1.0)
 */
export async function calculateMissionSuccessScore(missionId: string): Promise<number> {
  // Fetch mission with all related data
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: {
      feedback: true,
      studySessions: {
        include: {
          reviews: true,
        },
      },
    },
  })

  if (!mission) {
    throw new Error(`Mission ${missionId} not found`)
  }

  if (mission.status !== MissionStatus.COMPLETED) {
    // Only calculate success score for completed missions
    return 0
  }

  // Component 1: Completion Rate (30%)
  const objectives = mission.objectives as Array<{
    completed?: boolean
    objectiveId?: string
  }>
  const totalObjectives = objectives.length
  const completedObjectives = objectives.filter((o) => o.completed).length
  const completionRate = totalObjectives > 0 ? completedObjectives / totalObjectives : 0

  // Component 2: Performance Improvement (25%)
  // Simplified: Calculate from session reviews
  // In full implementation, would integrate with PerformanceCalculator from Story 2.2
  let performanceImprovement = 0
  if (mission.studySessions.length > 0) {
    for (const session of mission.studySessions) {
      if (session.reviews.length > 0) {
        const goodReviews = session.reviews.filter(
          (r) => r.rating === 'GOOD' || r.rating === 'EASY',
        ).length
        const sessionImprovement = goodReviews / session.reviews.length
        performanceImprovement += sessionImprovement
      }
    }
    performanceImprovement /= mission.studySessions.length
  }
  // Normalize to 0.0-1.0 range
  performanceImprovement = Math.min(performanceImprovement, 1.0)

  // Component 3: Time Accuracy (20%)
  let timeAccuracy = 1.0 // Default perfect if no time data
  if (mission.actualMinutes && mission.estimatedMinutes > 0) {
    const difference = Math.abs(mission.actualMinutes - mission.estimatedMinutes)
    timeAccuracy = Math.max(0, 1.0 - difference / mission.estimatedMinutes)
  }

  // Component 4: Feedback Rating (15%)
  let feedbackRating = 0.5 // Default neutral if no feedback
  if (mission.feedback.length > 0) {
    const avgHelpfulness =
      mission.feedback.reduce((sum, f) => sum + f.helpfulnessRating, 0) / mission.feedback.length
    feedbackRating = avgHelpfulness / 5.0 // Normalize 1-5 to 0.0-1.0
  }

  // Component 5: Streak Bonus (10%)
  // Get current streak
  const missionStreak = await prisma.missionStreak.findUnique({
    where: { userId: mission.userId },
  })
  const currentStreak = missionStreak?.currentStreak || 0
  const streakBonus = Math.min(0.2, currentStreak * 0.02) // +2% per day, max 20%

  // Calculate weighted success score
  const successScore =
    completionRate * WEIGHTS.COMPLETION_RATE +
    performanceImprovement * WEIGHTS.PERFORMANCE_IMPROVEMENT +
    timeAccuracy * WEIGHTS.TIME_ACCURACY +
    feedbackRating * WEIGHTS.FEEDBACK_RATING +
    streakBonus * WEIGHTS.STREAK_BONUS

  // Clamp to 0.0-1.0 range
  return Math.max(0, Math.min(1.0, successScore))
}

/**
 * Update mission with calculated success score
 *
 * Should be called after mission completion and feedback collection.
 *
 * @param missionId - Mission ID
 */
export async function updateMissionSuccessScore(missionId: string): Promise<void> {
  const successScore = await calculateMissionSuccessScore(missionId)

  await prisma.mission.update({
    where: { id: missionId },
    data: { successScore },
  })
}

/**
 * Get success score rating label
 *
 * @param score - Success score (0.0-1.0)
 * @returns Rating label
 */
export function getSuccessRating(score: number): string {
  if (score >= 0.9) return 'EXCELLENT'
  if (score >= 0.75) return 'GOOD'
  if (score >= 0.6) return 'FAIR'
  if (score >= 0.4) return 'NEEDS IMPROVEMENT'
  return 'POOR'
}

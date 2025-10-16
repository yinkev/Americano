/**
 * Mission Generator - MVP Implementation
 * Story 2.4: Daily Mission Generation and Display
 *
 * MVP Prioritization Algorithm (without Stories 2.2/2.3):
 * 1. FSRS due dates (nextReviewAt) - cards coming up for review
 * 2. High-yield objectives (isHighYield flag)
 * 3. Weak area heuristic (objectives with more review failures)
 */

import { prisma } from '@/lib/db'
import type { LearningObjective } from '@/generated/prisma'
import type {
  MissionObjective,
  MissionGenerationConstraints,
  PrioritizedObjective,
} from '@/types/mission'

// Time estimation constants (minutes)
const COMPLEXITY_TIME_MAP = {
  BASIC: 12,
  INTERMEDIATE: 20,
  ADVANCED: 32,
} as const

// Default constraints
const DEFAULT_TARGET_MINUTES = 50
const DEFAULT_MIN_OBJECTIVES = 2
const DEFAULT_MAX_OBJECTIVES = 4

export class MissionGenerator {
  /**
   * Generate a daily mission for a user
   * @param userId User ID
   * @param targetDate Date for the mission (defaults to today)
   * @param constraints Optional generation constraints
   * @returns Mission with objectives
   */
  async generateDailyMission(
    userId: string,
    targetDate: Date = new Date(),
    constraints: MissionGenerationConstraints = {}
  ) {
    const {
      targetMinutes = DEFAULT_TARGET_MINUTES,
      minObjectives = DEFAULT_MIN_OBJECTIVES,
      maxObjectives = DEFAULT_MAX_OBJECTIVES,
      includeHighYield = true,
      includeFSRSDue = true,
      includeWeakAreas = true,
    } = constraints

    // Step 1: Get prioritized objectives using MVP algorithm
    const prioritizedObjectives = await this.getPrioritizedObjectives(
      userId,
      {
        includeHighYield,
        includeFSRSDue,
        includeWeakAreas,
        limit: 20, // Get top 20 candidates
      }
    )

    if (prioritizedObjectives.length === 0) {
      // No objectives available - return empty mission
      return {
        objectives: [],
        estimatedMinutes: 0,
        newContentCount: 0,
        reviewCardCount: 0,
      }
    }

    // Step 2: Compose mission with 2-4 objectives
    const missionObjectives = this.composeMissionObjectives(
      prioritizedObjectives,
      {
        targetMinutes,
        minObjectives,
        maxObjectives,
      }
    )

    // Step 3: Calculate total time and counts
    const estimatedMinutes = this.estimateMissionDuration(missionObjectives)
    const newContentCount = missionObjectives.filter(
      (mo) => !mo.objective?.isHighYield
    ).length
    const reviewCardCount = await this.getReviewCardCount(
      userId,
      missionObjectives.map((mo) => mo.objectiveId)
    )

    return {
      objectives: missionObjectives,
      estimatedMinutes,
      newContentCount,
      reviewCardCount,
    }
  }

  /**
   * Get prioritized objectives using MVP algorithm
   * Priority = FSRS urgency (40%) + High-yield (30%) + Weak areas (30%)
   */
  private async getPrioritizedObjectives(
    userId: string,
    options: {
      includeHighYield: boolean
      includeFSRSDue: boolean
      includeWeakAreas: boolean
      limit: number
    }
  ): Promise<PrioritizedObjective[]> {
    // Get all learning objectives for user with related cards
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
        },
      },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: {
                name: true,
              },
            },
          },
        },
        cards: {
          select: {
            id: true,
            nextReviewAt: true,
            lapseCount: true,
            reviewCount: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Prefer recent content
      },
    })

    if (objectives.length === 0) {
      return []
    }

    const now = new Date()

    // Calculate priority score for each objective
    const scored = objectives.map((obj: any) => {
      let score = 0
      let reasons: string[] = []

      // Factor 1: FSRS urgency (cards due soon = higher priority)
      if (options.includeFSRSDue && obj.cards.length > 0) {
        const cardsDueSoon = obj.cards.filter((card: any) => {
          if (!card.nextReviewAt) return false
          const hoursUntilDue =
            (card.nextReviewAt.getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilDue <= 24 && hoursUntilDue >= -24 // Due within ±24 hours
        })

        if (cardsDueSoon.length > 0) {
          score += 40
          reasons.push(`${cardsDueSoon.length} cards due for review`)
        }
      }

      // Factor 2: High-yield content
      if (options.includeHighYield && obj.isHighYield) {
        score += 30
        reasons.push('High-yield content')

        if (obj.boardExamTags.length > 0) {
          reasons.push(`Board exam: ${obj.boardExamTags.slice(0, 2).join(', ')}`)
        }
      }

      // Factor 3: Weak areas (Story 2.2 integration)
      // Use weakness score if available, otherwise fall back to lapse rate
      if (options.includeWeakAreas) {
        // Story 2.2: Use calculated weakness score (0.0-1.0, higher = weaker)
        const weaknessScore = obj.weaknessScore || 0.5 // Default neutral if not calculated

        if (weaknessScore >= 0.7) {
          // High weakness = needs immediate attention
          score += 30
          reasons.push(`Weak area (${Math.round(weaknessScore * 100)}% weakness)`)
        } else if (weaknessScore >= 0.55) {
          // Moderate weakness = needs reinforcement
          score += 15
          reasons.push('Needs reinforcement')
        }

        // Add mastery level context to reason
        if (obj.masteryLevel && obj.masteryLevel !== 'NOT_STARTED') {
          reasons.push(`${obj.masteryLevel.replace('_', ' ')} level`)
        }
      }

      // Bonus: Complexity-based variety (prefer mix of difficulties)
      if (obj.complexity === 'BASIC') {
        score += 5 // Slightly prefer basics for warm-up
        reasons.push('Foundation concept')
      }

      return {
        objective: obj,
        priorityScore: score,
        reason: reasons.length > 0 ? reasons.join(' • ') : 'General review',
      }
    })

    // Sort by priority score (highest first) and take top N
    return scored
      .filter((s: any) => s.priorityScore > 0) // Only include objectives with some priority
      .sort((a: any, b: any) => b.priorityScore - a.priorityScore)
      .slice(0, options.limit)
  }

  /**
   * Compose mission objectives from prioritized candidates
   * Balances time, variety, and priority
   */
  private composeMissionObjectives(
    prioritized: PrioritizedObjective[],
    constraints: {
      targetMinutes: number
      minObjectives: number
      maxObjectives: number
    }
  ): MissionObjective[] {
    const { targetMinutes, minObjectives, maxObjectives } = constraints
    const selected: MissionObjective[] = []
    let totalMinutes = 0
    const usedCourses = new Set<string>()

    for (const { objective, reason } of prioritized) {
      // Stop if we have enough objectives
      if (selected.length >= maxObjectives) break

      // Estimate time for this objective
      const estimatedMinutes = this.estimateObjectiveTime(objective as any)

      // Check if adding this would exceed target (but allow if under min)
      if (
        selected.length >= minObjectives &&
        totalMinutes + estimatedMinutes > targetMinutes * 1.2
      ) {
        continue // Skip if would make mission too long
      }

      // Variety constraint: max 1 objective per course (avoid fatigue)
      const objectiveData = objective as any
      const courseId = objectiveData?.lecture?.courseId
      if (courseId && usedCourses.has(courseId) && selected.length >= minObjectives) {
        continue // Skip if already have objective from this course
      }

      // Add to mission
      selected.push({
        objectiveId: objective.id,
        objective: objective as any,
        estimatedMinutes,
        completed: false,
      })

      totalMinutes += estimatedMinutes
      if (courseId) {
        usedCourses.add(courseId)
      }

      // Stop if we've hit target time
      if (
        selected.length >= minObjectives &&
        totalMinutes >= targetMinutes * 0.8
      ) {
        break
      }
    }

    // Ensure minimum objectives if possible
    if (selected.length < minObjectives && prioritized.length > 0) {
      for (const { objective } of prioritized) {
        if (selected.find((mo) => mo.objectiveId === objective.id)) continue

        selected.push({
          objectiveId: objective.id,
          objective: objective,
          estimatedMinutes: this.estimateObjectiveTime(objective),
          completed: false,
        })

        if (selected.length >= minObjectives) break
      }
    }

    return selected
  }

  /**
   * Estimate time needed for a single objective
   * Based on complexity + mastery level (Story 2.2 integration)
   */
  private estimateObjectiveTime(objective: LearningObjective): number {
    const baseTime = COMPLEXITY_TIME_MAP[objective.complexity]

    // Story 2.2: Adjust time based on mastery level
    const masteryAdjustments: Record<string, number> = {
      NOT_STARTED: 1.5, // +50% time (new material)
      BEGINNER: 1.2, // +20% time (still learning)
      INTERMEDIATE: 1.0, // Base time
      ADVANCED: 0.8, // -20% time (mostly familiar)
      MASTERED: 0.7, // -30% time (quick review)
    }

    const masteryLevel = (objective as any).masteryLevel || 'INTERMEDIATE'
    const adjustment = masteryAdjustments[masteryLevel] || 1.0

    return Math.round(baseTime * adjustment)
  }

  /**
   * Calculate total mission duration
   */
  estimateMissionDuration(objectives: MissionObjective[]): number {
    return objectives.reduce((sum, mo) => sum + mo.estimatedMinutes, 0)
  }

  /**
   * Get count of review cards for mission objectives
   */
  private async getReviewCardCount(
    userId: string,
    objectiveIds: string[]
  ): Promise<number> {
    const count = await prisma.card.count({
      where: {
        objectiveId: {
          in: objectiveIds,
        },
        nextReviewAt: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due within 24 hours
        },
      },
    })

    return count
  }
}

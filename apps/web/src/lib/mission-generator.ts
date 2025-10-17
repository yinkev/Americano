/**
 * Mission Generator - MVP Implementation
 * Story 2.4: Daily Mission Generation and Display
 * Story 5.1 Task 9: Behavioral Pattern Integration
 *
 * MVP Prioritization Algorithm (without Stories 2.2/2.3):
 * 1. FSRS due dates (nextReviewAt) - cards coming up for review
 * 2. High-yield objectives (isHighYield flag)
 * 3. Weak area heuristic (objectives with more review failures)
 *
 * Story 5.1: Personalization based on UserLearningProfile
 * - Time-of-day recommendations from preferredStudyTimes
 * - Session duration adjustment from optimalSessionDuration
 * - Content mix personalization from learningStyleProfile
 */

import type { LearningObjective, UserLearningProfile } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import type {
  MissionGenerationConstraints,
  MissionObjective,
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

// Story 5.1: Complexity time adjustments for ADVANCED objectives
const ADVANCED_TIME_BUFFER = 12 // +10-15 minutes for ADVANCED objectives

/**
 * Mission generation result with personalization insights
 */
interface MissionGenerationResult {
  objectives: MissionObjective[]
  estimatedMinutes: number
  newContentCount: number
  reviewCardCount: number
  personalizationInsights?: {
    optimalTimeRecommendation?: string
    sessionDurationAdjusted?: boolean
    contentMixPersonalized?: boolean
  }
}

/**
 * VARK learning style profile structure
 */
interface LearningStyleProfile {
  visual: number
  auditory: number
  kinesthetic: number
  reading: number
}

/**
 * Preferred study time window
 */
interface PreferredStudyTime {
  dayOfWeek: number // 0-6 (0=Sunday)
  startHour: number // 0-23
  endHour: number // 0-23
}

export class MissionGenerator {
  /**
   * Generate a daily mission for a user with behavioral personalization
   * Story 5.1 Task 9: Integrates UserLearningProfile for personalized missions
   *
   * @param userId User ID
   * @param targetDate Date for the mission (defaults to today)
   * @param constraints Optional generation constraints
   * @returns Mission with objectives and personalization insights
   */
  async generateDailyMission(
    userId: string,
    targetDate: Date = new Date(),
    constraints: MissionGenerationConstraints = {},
  ): Promise<MissionGenerationResult> {
    // Story 5.1: Query UserLearningProfile before generating mission
    const profile = await this.getUserLearningProfile(userId)

    // Apply profile-based personalization to constraints
    const personalizedConstraints = this.applyProfilePersonalization(
      constraints,
      profile,
      targetDate,
    )

    const {
      targetMinutes = DEFAULT_TARGET_MINUTES,
      minObjectives = DEFAULT_MIN_OBJECTIVES,
      maxObjectives = DEFAULT_MAX_OBJECTIVES,
      includeHighYield = true,
      includeFSRSDue = true,
      includeWeakAreas = true,
    } = personalizedConstraints

    // Step 1: Get prioritized objectives using MVP algorithm
    const prioritizedObjectives = await this.getPrioritizedObjectives(userId, {
      includeHighYield,
      includeFSRSDue,
      includeWeakAreas,
      limit: 20, // Get top 20 candidates
    })

    if (prioritizedObjectives.length === 0) {
      // No objectives available - return empty mission
      return {
        objectives: [],
        estimatedMinutes: 0,
        newContentCount: 0,
        reviewCardCount: 0,
      }
    }

    // Story 5.1: Apply content mix personalization based on learning style
    const prioritizedWithContentPreference = this.applyContentMixPersonalization(
      prioritizedObjectives,
      profile,
    )

    // Step 2: Compose mission with 2-4 objectives
    const missionObjectives = this.composeMissionObjectives(
      prioritizedWithContentPreference,
      {
        targetMinutes,
        minObjectives,
        maxObjectives,
      },
      profile,
    )

    // Step 3: Calculate total time and counts
    const estimatedMinutes = this.estimateMissionDuration(missionObjectives, profile)
    const newContentCount = missionObjectives.filter((mo) => !mo.objective?.isHighYield).length
    const reviewCardCount = await this.getReviewCardCount(
      userId,
      missionObjectives.map((mo) => mo.objectiveId),
    )

    // Story 5.1: Generate personalization insights
    const personalizationInsights = this.generatePersonalizationInsights(
      profile,
      targetDate,
      estimatedMinutes,
      personalizedConstraints.targetMinutes !== constraints.targetMinutes,
    )

    return {
      objectives: missionObjectives,
      estimatedMinutes,
      newContentCount,
      reviewCardCount,
      personalizationInsights,
    }
  }

  /**
   * Story 5.1 Task 9: Query UserLearningProfile for personalization
   * Gracefully handles missing profile by returning null
   *
   * @param userId User ID
   * @returns UserLearningProfile or null if not available
   */
  private async getUserLearningProfile(
    userId: string,
  ): Promise<UserLearningProfile | null> {
    try {
      const profile = await prisma.userLearningProfile.findUnique({
        where: { userId },
      })
      return profile
    } catch (error) {
      // Gracefully handle errors - return null to use defaults
      console.warn(`Failed to fetch UserLearningProfile for user ${userId}:`, error)
      return null
    }
  }

  /**
   * Story 5.1 Task 9: Apply profile-based personalization to mission constraints
   * Adjusts target duration and applies optimal timing recommendations
   *
   * @param constraints Original mission constraints
   * @param profile User learning profile (nullable)
   * @param targetDate Mission target date
   * @returns Personalized constraints
   */
  private applyProfilePersonalization(
    constraints: MissionGenerationConstraints,
    profile: UserLearningProfile | null,
    targetDate: Date,
  ): MissionGenerationConstraints {
    if (!profile) {
      return constraints // Use defaults if no profile
    }

    const personalized = { ...constraints }

    // Story 5.1 lines 1049-1050: Set estimatedMinutes = profile.optimalSessionDuration
    if (!constraints.targetMinutes && profile.optimalSessionDuration > 0) {
      personalized.targetMinutes = profile.optimalSessionDuration
    }

    return personalized
  }

  /**
   * Story 5.1 Task 9 (lines 1069-1073): Content mix personalization based on learning style
   * Prioritizes objectives matching learner's VARK profile preferences
   *
   * @param objectives Prioritized objectives
   * @param profile User learning profile (nullable)
   * @returns Re-prioritized objectives with content mix adjustments
   */
  private applyContentMixPersonalization(
    objectives: PrioritizedObjective[],
    profile: UserLearningProfile | null,
  ): PrioritizedObjective[] {
    if (!profile || !profile.learningStyleProfile) {
      return objectives // No personalization if profile missing
    }

    const learningStyle = profile.learningStyleProfile as unknown as LearningStyleProfile

    // Story 5.1 line 1069: If kinesthetic > 0.5, prioritize clinical reasoning
    const kinestheticBoost = learningStyle.kinesthetic > 0.5 ? 15 : 0

    // Story 5.1 line 1070: If visual > 0.5, prioritize knowledge graph + diagram cards
    const visualBoost = learningStyle.visual > 0.5 ? 12 : 0

    // Apply content type boosts to priority scores
    return objectives.map((prioritized) => {
      let boostedScore = prioritized.priorityScore
      const objective = prioritized.objective as any

      // Boost clinical reasoning objectives for kinesthetic learners
      if (kinestheticBoost > 0 && this.isClinicalReasoningObjective(objective)) {
        boostedScore += kinestheticBoost
      }

      // Boost visual/diagram-heavy objectives for visual learners
      if (visualBoost > 0 && this.hasVisualContent(objective)) {
        boostedScore += visualBoost
      }

      return {
        ...prioritized,
        priorityScore: boostedScore,
      }
    }).sort((a, b) => b.priorityScore - a.priorityScore) // Re-sort after boosting
  }

  /**
   * Helper: Determine if objective involves clinical reasoning
   * Heuristic: Check board exam tags for clinical keywords or objective text
   *
   * @param objective Learning objective
   * @returns True if clinical reasoning objective
   */
  private isClinicalReasoningObjective(objective: any): boolean {
    const clinicalKeywords = ['clinical', 'diagnosis', 'treatment', 'patient', 'case']
    const objectiveText = objective.objective?.toLowerCase() || ''
    const tags = objective.boardExamTags || []

    return (
      clinicalKeywords.some((keyword) => objectiveText.includes(keyword)) ||
      tags.some((tag: string) => tag.toLowerCase().includes('clinical'))
    )
  }

  /**
   * Helper: Determine if objective has visual/diagram content
   * Heuristic: Check for diagram-related keywords or high-yield visual topics
   *
   * @param objective Learning objective
   * @returns True if visual content available
   */
  private hasVisualContent(objective: any): boolean {
    const visualKeywords = ['anatomy', 'structure', 'pathway', 'diagram', 'graph', 'chart']
    const objectiveText = objective.objective?.toLowerCase() || ''

    return visualKeywords.some((keyword) => objectiveText.includes(keyword))
  }

  /**
   * Story 5.1 Task 9 (lines 1056-1060): Generate time-of-day recommendation insights
   * Compares current time against preferredStudyTimes from profile
   *
   * @param profile User learning profile (nullable)
   * @param targetDate Mission target date
   * @param estimatedMinutes Estimated mission duration
   * @param durationAdjusted Whether duration was adjusted by profile
   * @returns Personalization insights object
   */
  private generatePersonalizationInsights(
    profile: UserLearningProfile | null,
    targetDate: Date,
    estimatedMinutes: number,
    durationAdjusted: boolean,
  ): MissionGenerationResult['personalizationInsights'] {
    if (!profile) {
      return undefined
    }

    const insights: MissionGenerationResult['personalizationInsights'] = {
      sessionDurationAdjusted: durationAdjusted,
      contentMixPersonalized: !!profile.learningStyleProfile,
    }

    // Story 5.1 lines 1056-1060: Time-of-day recommendations
    const optimalTimeRecommendation = this.generateOptimalTimeRecommendation(
      profile,
      targetDate,
    )

    if (optimalTimeRecommendation) {
      insights.optimalTimeRecommendation = optimalTimeRecommendation
    }

    return insights
  }

  /**
   * Story 5.1 Task 9 (lines 1048-1060): Generate optimal time recommendation
   * If current time outside optimal window, suggest better time with performance gain
   *
   * @param profile User learning profile
   * @param targetDate Mission target date
   * @returns Recommendation string or null if current time is optimal
   */
  private generateOptimalTimeRecommendation(
    profile: UserLearningProfile,
    targetDate: Date,
  ): string | null {
    if (!profile.preferredStudyTimes) {
      return null
    }

    const preferredTimes = profile.preferredStudyTimes as unknown as PreferredStudyTime[]
    if (!Array.isArray(preferredTimes) || preferredTimes.length === 0) {
      return null
    }

    const currentHour = targetDate.getHours()
    const currentDay = targetDate.getDay() // 0=Sunday, 6=Saturday

    // Check if current time falls within any preferred window
    const isInOptimalWindow = preferredTimes.some(
      (window) =>
        window.dayOfWeek === currentDay &&
        currentHour >= window.startHour &&
        currentHour < window.endHour,
    )

    if (isInOptimalWindow) {
      return null // Already in optimal window, no recommendation needed
    }

    // Find the next optimal window for today or next available day
    const todayOptimal = preferredTimes.find((window) => window.dayOfWeek === currentDay)

    if (todayOptimal) {
      // Story 5.1 line 1058: Example recommendation format
      const optimalStart = this.formatHour(todayOptimal.startHour)
      const optimalEnd = this.formatHour(todayOptimal.endHour)
      const currentTime = this.formatHour(currentHour)

      // Estimate performance gain (heuristic: 20-30% based on time difference)
      const performanceGain = 25 // Conservative estimate

      return `Consider studying between ${optimalStart}-${optimalEnd} instead of ${currentTime} for ${performanceGain}% better retention`
    }

    return null
  }

  /**
   * Helper: Format hour in 12-hour format with AM/PM
   *
   * @param hour Hour in 24-hour format (0-23)
   * @returns Formatted time string (e.g., "7 AM", "11 PM")
   */
  private formatHour(hour: number): string {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
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
    },
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
      const reasons: string[] = []

      // Factor 1: FSRS urgency (cards due soon = higher priority)
      if (options.includeFSRSDue && obj.cards.length > 0) {
        const cardsDueSoon = obj.cards.filter((card: any) => {
          if (!card.nextReviewAt) return false
          const hoursUntilDue = (card.nextReviewAt.getTime() - now.getTime()) / (1000 * 60 * 60)
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
   * Story 5.1: Considers profile for duration adjustments
   */
  private composeMissionObjectives(
    prioritized: PrioritizedObjective[],
    constraints: {
      targetMinutes: number
      minObjectives: number
      maxObjectives: number
    },
    profile: UserLearningProfile | null,
  ): MissionObjective[] {
    const { targetMinutes, minObjectives, maxObjectives } = constraints
    const selected: MissionObjective[] = []
    let totalMinutes = 0
    const usedCourses = new Set<string>()

    for (const { objective, reason } of prioritized) {
      // Stop if we have enough objectives
      if (selected.length >= maxObjectives) break

      // Estimate time for this objective (with profile adjustments)
      const estimatedMinutes = this.estimateObjectiveTime(objective as any, profile)

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
      if (selected.length >= minObjectives && totalMinutes >= targetMinutes * 0.8) {
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
          estimatedMinutes: this.estimateObjectiveTime(objective, profile),
          completed: false,
        })

        if (selected.length >= minObjectives) break
      }
    }

    return selected
  }

  /**
   * Story 5.1 Task 9 (lines 1062-1067): Estimate time needed for a single objective
   * Based on complexity + mastery level + ADVANCED buffer
   * Accounts for attention cycle patterns from profile
   *
   * @param objective Learning objective
   * @param profile User learning profile (nullable)
   * @returns Estimated time in minutes
   */
  private estimateObjectiveTime(
    objective: LearningObjective,
    profile: UserLearningProfile | null = null,
  ): number {
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

    let estimatedTime = Math.round(baseTime * adjustment)

    // Story 5.1 line 1064: ADVANCED objectives need +10-15 minutes
    if (objective.complexity === 'ADVANCED') {
      estimatedTime += ADVANCED_TIME_BUFFER
    }

    // Story 5.1 line 1066: Add buffer time for breaks based on attention cycle
    // If session is long, add break buffer (5-10 minutes per hour of study)
    if (profile && estimatedTime > 45) {
      const breakBuffer = Math.floor(estimatedTime / 60) * 7 // 7 min per hour
      estimatedTime += breakBuffer
    }

    return estimatedTime
  }

  /**
   * Story 5.1: Calculate total mission duration with profile adjustments
   * Adds buffer time for breaks based on attention cycle patterns
   *
   * @param objectives Mission objectives
   * @param profile User learning profile (nullable)
   * @returns Total estimated minutes
   */
  estimateMissionDuration(
    objectives: MissionObjective[],
    profile: UserLearningProfile | null = null,
  ): number {
    const baseTotal = objectives.reduce((sum, mo) => sum + mo.estimatedMinutes, 0)

    // Story 5.1 line 1066: Add buffer for longer sessions based on attention patterns
    if (profile && baseTotal > 60) {
      // For sessions >60 min, add 5-10% buffer for mental fatigue
      const fatigueBuffer = Math.floor(baseTotal * 0.07)
      return baseTotal + fatigueBuffer
    }

    return baseTotal
  }

  /**
   * Get count of review cards for mission objectives
   */
  private async getReviewCardCount(userId: string, objectiveIds: string[]): Promise<number> {
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

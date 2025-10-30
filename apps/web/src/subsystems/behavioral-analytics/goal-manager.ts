/**
 * Goal Manager
 * Story 5.6 Task 3
 *
 * Manages behavioral improvement goals with template-based creation,
 * automated progress tracking, and completion detection.
 *
 * @subsystem Behavioral Analytics and Personalization
 * @location apps/web/src/subsystems/behavioral-analytics/goal-manager.ts
 */

import type {
  BehavioralGoal,
  BehavioralGoalType,
  BehavioralPattern,
  GoalStatus,
  Prisma,
} from '@/generated/prisma'
import { prisma } from '@/lib/db'
import type {
  GoalProgressEntry,
  PersonalizedForgettingCurve,
  PreferredStudyTime,
} from '@/types/prisma-json'

/**
 * Goal template for standardized goal creation
 */
interface GoalTemplate {
  type: BehavioralGoalType
  title: string
  description: string
  targetMetric: string
  recommendedTargetValue: number
  recommendedDeadlineDays: number
  minDataRequired: {
    weeks: number
    sessions: number
  }
}

/**
 * Goal suggestion based on user patterns
 */
export interface GoalSuggestion {
  template: GoalTemplate
  currentValue: number
  targetValue: number
  deadline: Date
  rationale: string
  confidence: number // 0.0-1.0
}

/**
 * Goal creation input
 */
export interface GoalCreationInput {
  goalType: BehavioralGoalType
  title?: string // Optional override for custom goals
  description?: string
  targetMetric: string
  targetValue: number
  deadline: Date
}

/**
 * Progress checkpoint for goal history
 */
interface ProgressCheckpoint {
  date: string // ISO date
  value: number
  note?: string
}

/**
 * Goal templates (from story context constraint #6)
 */
const GOAL_TEMPLATES: Record<BehavioralGoalType, GoalTemplate> = {
  STUDY_TIME_CONSISTENCY: {
    type: 'STUDY_TIME_CONSISTENCY',
    title: 'Study during peak hours consistently',
    description:
      'Build a habit of studying during your optimal time windows for maximum retention.',
    targetMetric: 'peakHourSessionsPerWeek',
    recommendedTargetValue: 5, // 5 out of 7 days
    recommendedDeadlineDays: 30,
    minDataRequired: { weeks: 4, sessions: 15 },
  },
  SESSION_DURATION: {
    type: 'SESSION_DURATION',
    title: 'Maintain optimal session length',
    description:
      'Consistently study for your ideal session duration to reduce fatigue and improve completion.',
    targetMetric: 'avgSessionDuration',
    recommendedTargetValue: 45, // Minutes
    recommendedDeadlineDays: 21,
    minDataRequired: { weeks: 3, sessions: 10 },
  },
  CONTENT_DIVERSIFICATION: {
    type: 'CONTENT_DIVERSIFICATION',
    title: 'Balance content types (VARK)',
    description: 'Diversify learning modalities to strengthen understanding and retention.',
    targetMetric: 'varkBalanceScore',
    recommendedTargetValue: 0.7, // 0.0-1.0 balance score
    recommendedDeadlineDays: 45,
    minDataRequired: { weeks: 4, sessions: 20 },
  },
  RETENTION_IMPROVEMENT: {
    type: 'RETENTION_IMPROVEMENT',
    title: 'Improve retention curve metrics',
    description: 'Increase your retention half-life through optimized review schedules.',
    targetMetric: 'retentionHalfLifeDays',
    recommendedTargetValue: 7, // Days
    recommendedDeadlineDays: 60,
    minDataRequired: { weeks: 6, sessions: 30 },
  },
  CUSTOM: {
    type: 'CUSTOM',
    title: 'Custom behavioral goal',
    description: 'User-defined behavioral improvement goal.',
    targetMetric: 'custom',
    recommendedTargetValue: 100, // User-specified
    recommendedDeadlineDays: 30,
    minDataRequired: { weeks: 2, sessions: 5 },
  },
}

/**
 * Maximum deadline (from constraint #6)
 */
const MAX_DEADLINE_DAYS = 90

/**
 * Progress milestone thresholds for notifications
 */
const PROGRESS_MILESTONES = [0.25, 0.5, 0.75] as const

/**
 * GoalManager
 *
 * Core responsibilities:
 * 1. Create goals from templates or custom input
 * 2. Track automated progress via study sessions
 * 3. Detect goal completion and generate notifications
 * 4. Suggest goals based on behavioral patterns
 */
export class GoalManager {
  /**
   * Create a new behavioral goal
   *
   * Validation:
   * - targetValue > currentValue
   * - deadline ≤ 90 days from now
   * - goalType in enum
   *
   * @param userId - User ID
   * @param input - Goal creation parameters
   * @returns Created BehavioralGoal
   */
  static async createGoal(userId: string, input: GoalCreationInput): Promise<BehavioralGoal> {
    const template = GOAL_TEMPLATES[input.goalType]

    // Validation
    if (!template) {
      throw new Error(`Invalid goal type: ${input.goalType}`)
    }

    const deadlineDays = Math.floor((input.deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    if (deadlineDays > MAX_DEADLINE_DAYS) {
      throw new Error(
        `Deadline cannot exceed ${MAX_DEADLINE_DAYS} days. Provided: ${deadlineDays} days.`,
      )
    }

    if (deadlineDays < 1) {
      throw new Error('Deadline must be in the future.')
    }

    // Calculate current value for this metric
    const currentValue = await GoalManager.calculateCurrentMetricValue(userId, input.targetMetric)

    if (input.targetValue <= currentValue) {
      throw new Error(
        `Target value (${input.targetValue}) must be greater than current value (${currentValue}).`,
      )
    }

    // Create initial progress checkpoint
    const progressHistory: ProgressCheckpoint[] = [
      {
        date: new Date().toISOString(),
        value: currentValue,
        note: 'Goal created',
      },
    ]

    // Create goal
    const goal = await prisma.behavioralGoal.create({
      data: {
        userId,
        goalType: input.goalType,
        title: input.title || template.title,
        description: input.description || template.description,
        targetMetric: input.targetMetric,
        currentValue,
        targetValue: input.targetValue,
        deadline: input.deadline,
        status: 'ACTIVE',
        progressHistory: progressHistory as unknown as Prisma.InputJsonValue,
      },
    })

    // Generate notification
    await GoalManager.createGoalNotification(userId, goal.id, 'GOAL_CREATED')

    return goal
  }

  /**
   * Update goal progress (manual or automated)
   *
   * @param goalId - Goal ID
   * @param currentValue - New current value
   * @param note - Optional progress note
   * @returns Updated goal with completion status
   */
  static async updateGoalProgress(
    goalId: string,
    currentValue: number,
    note?: string,
  ): Promise<{ goal: BehavioralGoal; completed: boolean }> {
    const goal = await prisma.behavioralGoal.findUnique({
      where: { id: goalId },
    })

    if (!goal) {
      throw new Error(`Goal ${goalId} not found`)
    }

    if (goal.status !== 'ACTIVE') {
      throw new Error(`Cannot update progress for ${goal.status} goal`)
    }

    // Update progress history
    const progressHistory = (goal.progressHistory as unknown as ProgressCheckpoint[]) || []
    const checkpoint: ProgressCheckpoint = {
      date: new Date().toISOString(),
      value: currentValue,
      note,
    }
    progressHistory.push(checkpoint)

    // Calculate progress percentage
    const progressPercent =
      (currentValue - (progressHistory[0]?.value || 0)) /
      (goal.targetValue - (progressHistory[0]?.value || 0))

    // Check for milestone notifications
    for (const milestone of PROGRESS_MILESTONES) {
      const prevValue = goal.currentValue
      const prevPercent =
        (prevValue - (progressHistory[0]?.value || 0)) /
        (goal.targetValue - (progressHistory[0]?.value || 0))

      if (prevPercent < milestone && progressPercent >= milestone) {
        const milestoneType =
          milestone === 0.25
            ? 'GOAL_PROGRESS_25'
            : milestone === 0.5
              ? 'GOAL_PROGRESS_50'
              : 'GOAL_PROGRESS_75'
        await GoalManager.createGoalNotification(goal.userId, goalId, milestoneType)
      }
    }

    // Check completion
    const completed = await GoalManager.checkGoalCompletion(goalId, currentValue)

    // Update goal
    const updated = await prisma.behavioralGoal.update({
      where: { id: goalId },
      data: {
        currentValue,
        progressHistory: progressHistory as unknown as Prisma.InputJsonValue,
        ...(completed && {
          status: 'COMPLETED',
          completedAt: new Date(),
        }),
      },
    })

    return { goal: updated, completed }
  }

  /**
   * Check if goal is complete and trigger completion flow
   *
   * @param goalId - Goal ID
   * @param currentValue - Optional current value (if not provided, uses DB value)
   * @returns True if goal completed
   */
  static async checkGoalCompletion(goalId: string, currentValue?: number): Promise<boolean> {
    const goal = await prisma.behavioralGoal.findUnique({
      where: { id: goalId },
    })

    if (!goal || goal.status !== 'ACTIVE') {
      return false
    }

    const value = currentValue !== undefined ? currentValue : goal.currentValue
    const completed = value >= goal.targetValue

    if (completed) {
      // Mark as completed
      await prisma.behavioralGoal.update({
        where: { id: goalId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })

      // Generate completion notification
      await GoalManager.createGoalNotification(goal.userId, goalId, 'GOAL_ACHIEVED')

      // Award achievement badge (if applicable)
      await GoalManager.awardGoalBadge(goal.userId, goal.goalType)
    }

    return completed
  }

  /**
   * Suggest goals based on behavioral patterns
   *
   * Algorithm:
   * 1. Analyze user's behavioral patterns
   * 2. Identify improvement opportunities
   * 3. Generate 3 goal suggestions with rationale
   * 4. Sort by confidence (pattern strength)
   *
   * @param userId - User ID
   * @returns Array of goal suggestions (max 3)
   */
  static async suggestGoals(userId: string): Promise<GoalSuggestion[]> {
    const [patterns, profile, activeSessions] = await Promise.all([
      prisma.behavioralPattern.findMany({
        where: { userId, confidence: { gte: 0.6 } },
        orderBy: { confidence: 'desc' },
      }),
      prisma.userLearningProfile.findUnique({
        where: { userId },
      }),
      prisma.studySession.findMany({
        where: {
          userId,
          startedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ])

    const suggestions: GoalSuggestion[] = []

    // Suggestion 1: Study time consistency
    const optimalTimePattern = patterns.find((p) => p.patternType === 'OPTIMAL_STUDY_TIME')
    if (optimalTimePattern) {
      const template = GOAL_TEMPLATES.STUDY_TIME_CONSISTENCY
      const currentValue = GoalManager.calculatePeakHourSessions(activeSessions, profile)
      const suggestion: GoalSuggestion = {
        template,
        currentValue,
        targetValue: template.recommendedTargetValue,
        deadline: new Date(Date.now() + template.recommendedDeadlineDays * 24 * 60 * 60 * 1000),
        rationale: `You perform best at specific times. Build consistency by studying during these hours ${template.recommendedTargetValue} days per week.`,
        confidence: optimalTimePattern.confidence,
      }
      suggestions.push(suggestion)
    }

    // Suggestion 2: Session duration optimization
    const durationPattern = patterns.find((p) => p.patternType === 'SESSION_DURATION_PREFERENCE')
    if (durationPattern && profile?.optimalSessionDuration) {
      const template = GOAL_TEMPLATES.SESSION_DURATION
      const currentValue = profile.averageSessionDuration || template.recommendedTargetValue
      const targetValue = profile.optimalSessionDuration
      if (targetValue > currentValue) {
        const suggestion: GoalSuggestion = {
          template,
          currentValue,
          targetValue,
          deadline: new Date(Date.now() + template.recommendedDeadlineDays * 24 * 60 * 60 * 1000),
          rationale: `Your optimal session length is ${targetValue} minutes. Gradually increase from ${currentValue} to reduce fatigue.`,
          confidence: durationPattern.confidence,
        }
        suggestions.push(suggestion)
      }
    }

    // Suggestion 3: Content diversification (VARK balance)
    if (profile?.learningStyleProfile) {
      const learningStyle = profile.learningStyleProfile as Record<string, number>
      const maxStyle = Math.max(...Object.values(learningStyle))
      const avgStyle = Object.values(learningStyle).reduce((a, b) => a + b, 0) / 4
      const rawBalance = 1 - (maxStyle - avgStyle)
      const balance = Math.max(0, Math.min(1, rawBalance))

      if (balance < 0.7) {
        const template = GOAL_TEMPLATES.CONTENT_DIVERSIFICATION
        const suggestion: GoalSuggestion = {
          template,
          currentValue: balance,
          targetValue: template.recommendedTargetValue,
          deadline: new Date(Date.now() + template.recommendedDeadlineDays * 24 * 60 * 60 * 1000),
          rationale: `Your learning style is skewed (${Math.round(maxStyle * 100)}% ${Object.entries(learningStyle).find(([, v]) => v === maxStyle)?.[0]}). Diversify to strengthen retention.`,
          confidence: 0.75,
        }
        suggestions.push(suggestion)
      }
    }

    // Sort by confidence and return top 3
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  }

  /**
   * Daily automated progress tracking job
   *
   * Checks all active goals and updates progress based on study sessions
   *
   * @param userId - User ID (or run for all users if not specified)
   */
  static async runDailyProgressTracking(userId?: string) {
    const goals = await prisma.behavioralGoal.findMany({
      where: {
        ...(userId && { userId }),
        status: 'ACTIVE',
      },
    })

    for (const goal of goals) {
      try {
        const currentValue = await GoalManager.calculateCurrentMetricValue(
          goal.userId,
          goal.targetMetric,
        )

        if (currentValue !== goal.currentValue) {
          await GoalManager.updateGoalProgress(goal.id, currentValue, 'Automated daily update')
        }
      } catch (error) {
        console.error(`Error tracking goal ${goal.id}:`, error)
      }
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Calculate current value for a given metric
   */
  private static async calculateCurrentMetricValue(
    userId: string,
    targetMetric: string,
  ): Promise<number> {
    const profile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    switch (targetMetric) {
      case 'peakHourSessionsPerWeek': {
        const sessions = await prisma.studySession.findMany({
          where: {
            userId,
            startedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        })
        return GoalManager.calculatePeakHourSessions(sessions, profile)
      }

      case 'avgSessionDuration':
        return profile?.averageSessionDuration || 0

      case 'varkBalanceScore': {
        if (!profile?.learningStyleProfile) return 0
        const styles = profile.learningStyleProfile as Record<string, number>
        const maxStyle = Math.max(...Object.values(styles))
        const avgStyle = Object.values(styles).reduce((a, b) => a + b, 0) / 4
        const raw = 1 - (maxStyle - avgStyle)
        return Math.max(0, Math.min(1, raw))
      }

      case 'retentionHalfLifeDays': {
        const curve = profile?.personalizedForgettingCurve as unknown as
          | (PersonalizedForgettingCurve & { halfLife?: number })
          | null
        return curve?.halfLife || curve?.stabilityFactor || 0
      }

      default:
        return 0
    }
  }

  /**
   * Calculate sessions during peak hours
   */
  private static calculatePeakHourSessions(sessions: any[], profile: any): number {
    if (!profile?.preferredStudyTimes) return 0

    const times = (profile.preferredStudyTimes as unknown as PreferredStudyTime[] | null) || []
    const peakHours = Array.from(
      new Set(
        times
          .map((t) => Number((t as any).startHour))
          .filter((h) => Number.isFinite(h))
          .map((h) => Math.max(0, Math.min(23, Math.floor(h)))),
      ),
    )

    if (peakHours.length === 0) return 0

    return sessions.filter((s) => {
      const startedAt =
        s.startedAt instanceof Date ? (s.startedAt as Date) : new Date((s as any).startedAt as any)
      if (!startedAt || isNaN(startedAt.getTime())) {
        return false
      }
      // Use UTC to avoid timezone drift across environments
      const hour = startedAt.getUTCHours()
      return peakHours.includes(hour)
    }).length
  }

  /**
   * Create goal notification
   */
  private static async createGoalNotification(
    userId: string,
    goalId: string,
    type:
      | 'GOAL_CREATED'
      | 'GOAL_PROGRESS_25'
      | 'GOAL_PROGRESS_50'
      | 'GOAL_PROGRESS_75'
      | 'GOAL_ACHIEVED',
  ) {
    const goal = await prisma.behavioralGoal.findUnique({
      where: { id: goalId },
    })

    if (!goal) return

    const messages = {
      GOAL_CREATED: {
        title: 'New Goal Created',
        message: `Started tracking: ${goal.title}`,
        priority: 'NORMAL' as const,
      },
      GOAL_PROGRESS_25: {
        title: '25% Progress',
        message: `You're 25% towards "${goal.title}"!`,
        priority: 'NORMAL' as const,
      },
      GOAL_PROGRESS_50: {
        title: 'Halfway There!',
        message: `You're 50% towards "${goal.title}"! Keep going!`,
        priority: 'NORMAL' as const,
      },
      GOAL_PROGRESS_75: {
        title: '75% Complete',
        message: `Almost there! 75% towards "${goal.title}"`,
        priority: 'HIGH' as const,
      },
      GOAL_ACHIEVED: {
        title: 'Goal Achieved! 🎉',
        message: `Congratulations! You completed "${goal.title}"`,
        priority: 'HIGH' as const,
      },
    }

    const notifData = messages[type]

    /**
     * @justification NotificationType enum doesn't include all goal-related types yet
     * @todo Add GOAL_CREATED, GOAL_PROGRESS_25/50/75, GOAL_ACHIEVED to NotificationType enum in next schema update
     */
    await prisma.insightNotification.create({
      data: {
        userId,
        notificationType: type.replace('GOAL_CREATED', 'NEW_PATTERN') as any,
        title: notifData.title,
        message: notifData.message,
        priority: notifData.priority,
        relatedEntityId: goalId,
        relatedEntityType: 'goal',
      },
    })
  }

  /**
   * Award achievement badge for goal completion
   */
  private static async awardGoalBadge(userId: string, goalType: BehavioralGoalType) {
    const completedGoals = await prisma.behavioralGoal.count({
      where: { userId, status: 'COMPLETED', goalType },
    })

    const tiers = [
      { count: 1, tier: 'BRONZE' as const },
      { count: 3, tier: 'SILVER' as const },
      { count: 5, tier: 'GOLD' as const },
      { count: 10, tier: 'PLATINUM' as const },
    ]

    const achievedTier = tiers.find((t) => completedGoals === t.count)
    if (achievedTier) {
      await prisma.achievement.create({
        data: {
          userId,
          type: 'OBJECTIVES_COMPLETED',
          name: `${goalType.replace(/_/g, ' ')} ${achievedTier.tier}`,
          description: `Completed ${completedGoals} ${goalType.toLowerCase()} goals`,
          tier: achievedTier.tier,
        },
      })
    }
  }
}

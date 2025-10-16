/**
 * Prioritization Engine - Core Logic
 * Story 2.3: Intelligent Content Prioritization Algorithm
 *
 * Multi-factor prioritization algorithm:
 * priority = (examUrgency * 0.30) +
 *            (weaknessScore * 0.25) +
 *            (highYieldFactor * 0.20) +
 *            (prerequisiteFactor * 0.15) +
 *            (recencyPenalty * 0.10)
 */

import { prisma } from '@/lib/db'
import type {
  PriorityContext,
  PriorityExplanation,
  PriorityFactor,
  PriorityFilters,
  PrioritizedObjective,
  ExamUrgencyData,
  PrerequisiteData,
} from '@/types/prioritization'
import { differenceInDays } from 'date-fns'

// Priority factor weights (must sum to 1.0)
const WEIGHTS = {
  EXAM_URGENCY: 0.30,
  WEAKNESS_SCORE: 0.25,
  HIGH_YIELD: 0.20,
  PREREQUISITE: 0.15,
  RECENCY: 0.10,
} as const

// Constants for calculations
const MAX_DAYS_WINDOW = 90 // Days beyond which exam urgency = 0
const OPTIMAL_REVIEW_INTERVAL = 5 // Days for spaced repetition
const PREREQUISITE_TRAVERSAL_DEPTH = 3 // Max depth for prerequisite graph

// Priority level thresholds for visual indicators
const PRIORITY_THRESHOLDS = {
  CRITICAL: 0.8, // Red badge - highest priority
  HIGH: 0.6, // Orange badge - high priority
  MEDIUM: 0.4, // Yellow badge - medium priority
  LOW: 0.0, // Green badge - lowest priority
} as const

export class PrioritizationEngine {
  /**
   * Calculate priority score for a single objective
   */
  async calculatePriorityScore(
    context: PriorityContext
  ): Promise<number> {
    const { userId, objectiveId, today = new Date() } = context

    // Get objective with related data
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          include: {
            course: true,
          },
        },
        cards: {
          select: {
            lastReviewedAt: true,
          },
        },
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        dependents: {
          include: {
            objective: {
              select: {
                id: true,
                weaknessScore: true,
              },
            },
          },
        },
      },
    })

    if (!objective) {
      return 0
    }

    // Calculate individual factors
    const examUrgency = await this.calculateExamUrgency(userId, objective, today)
    const weaknessScore = objective.weaknessScore || 0.5 // Default neutral
    const highYieldFactor = this.calculateHighYieldFactor(objective)
    const prerequisiteFactor = this.calculatePrerequisiteFactor(objective)
    const recencyPenalty = this.calculateRecencyPenalty(objective, today)

    // Apply weighted formula
    const priorityScore =
      examUrgency * WEIGHTS.EXAM_URGENCY +
      weaknessScore * WEIGHTS.WEAKNESS_SCORE +
      highYieldFactor * WEIGHTS.HIGH_YIELD +
      prerequisiteFactor * WEIGHTS.PREREQUISITE +
      recencyPenalty * WEIGHTS.RECENCY

    return Math.min(1.0, Math.max(0.0, priorityScore)) // Clamp to [0, 1]
  }

  /**
   * Get prioritized list of objectives for a user
   */
  async getPrioritizedObjectives(
    userId: string,
    filters: PriorityFilters = {}
  ): Promise<PrioritizedObjective[]> {
    const { courseId, minPriority = 0, excludeRecent = false, limit = 20 } = filters
    const today = new Date()

    // Build query constraints
    const where: any = {
      lecture: {
        userId,
        ...(courseId ? { courseId } : {}),
      },
    }

    if (excludeRecent) {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      where.lastStudiedAt = {
        lt: yesterday,
      }
    }

    // Get objectives with related data
    const objectives = await prisma.learningObjective.findMany({
      where,
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
            lastReviewedAt: true,
          },
        },
        dependents: {
          include: {
            objective: {
              select: {
                id: true,
                weaknessScore: true,
              },
            },
          },
        },
      },
    })

    // Calculate priority scores for all objectives
    const scored = await Promise.all(
      objectives.map(async (obj) => {
        const priorityScore = await this.calculatePriorityScore({
          userId,
          objectiveId: obj.id,
          today,
        })

        const reason = await this.generateShortReason(userId, obj, priorityScore, today)

        return {
          objective: obj,
          priorityScore,
          reason,
        }
      })
    )

    // Filter by minimum priority and sort
    return scored
      .filter((s) => s.priorityScore >= minPriority)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit)
  }

  /**
   * Generate detailed explanation for an objective's priority
   */
  async explainPrioritization(
    context: PriorityContext
  ): Promise<PriorityExplanation> {
    const { userId, objectiveId, today = new Date() } = context

    // Get objective with related data
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          include: {
            course: true,
          },
        },
        cards: {
          select: {
            lastReviewedAt: true,
          },
        },
        dependents: {
          include: {
            objective: {
              select: {
                id: true,
                weaknessScore: true,
              },
            },
          },
        },
      },
    })

    if (!objective) {
      throw new Error(`Objective ${objectiveId} not found`)
    }

    // Calculate all factors
    const examUrgency = await this.calculateExamUrgency(userId, objective, today)
    const weaknessScore = objective.weaknessScore || 0.5
    const highYieldFactor = this.calculateHighYieldFactor(objective)
    const prerequisiteFactor = this.calculatePrerequisiteFactor(objective)
    const recencyPenalty = this.calculateRecencyPenalty(objective, today)

    // Build factor explanations
    const factors: PriorityFactor[] = [
      {
        name: 'Exam Urgency',
        value: examUrgency,
        weight: WEIGHTS.EXAM_URGENCY,
        contribution: examUrgency * WEIGHTS.EXAM_URGENCY,
        explanation: await this.explainExamUrgency(userId, objective, examUrgency, today),
      },
      {
        name: 'Weakness Score',
        value: weaknessScore,
        weight: WEIGHTS.WEAKNESS_SCORE,
        contribution: weaknessScore * WEIGHTS.WEAKNESS_SCORE,
        explanation: this.explainWeaknessScore(weaknessScore),
      },
      {
        name: 'High-Yield Factor',
        value: highYieldFactor,
        weight: WEIGHTS.HIGH_YIELD,
        contribution: highYieldFactor * WEIGHTS.HIGH_YIELD,
        explanation: this.explainHighYieldFactor(objective, highYieldFactor),
      },
      {
        name: 'Prerequisite Factor',
        value: prerequisiteFactor,
        weight: WEIGHTS.PREREQUISITE,
        contribution: prerequisiteFactor * WEIGHTS.PREREQUISITE,
        explanation: this.explainPrerequisiteFactor(objective, prerequisiteFactor),
      },
      {
        name: 'Recency Penalty',
        value: recencyPenalty,
        weight: WEIGHTS.RECENCY,
        contribution: recencyPenalty * WEIGHTS.RECENCY,
        explanation: this.explainRecencyPenalty(objective, recencyPenalty, today),
      },
    ]

    // Calculate final priority score
    const priorityScore = factors.reduce((sum, f) => sum + f.contribution, 0)

    // Sort factors by contribution (highest first) for reasoning
    const topFactors = [...factors]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3)

    // Generate reasoning text
    const reasoning = `Priority ${(priorityScore * 100).toFixed(0)}% due to: ${topFactors
      .map((f) => `${f.name} (${(f.contribution * 100).toFixed(0)}%)`)
      .join(', ')}`

    // Generate recommendations
    const recommendations = this.generateRecommendations(factors, objective)

    // Determine visual indicator
    const visualIndicator = this.getVisualIndicator(priorityScore)

    return {
      objectiveId,
      priorityScore,
      factors,
      reasoning,
      recommendations,
      visualIndicator,
    }
  }

  /**
   * Calculate exam urgency factor (0.0-1.0)
   * Formula: 1.0 - (daysUntilExam / MAX_DAYS_WINDOW)
   */
  private async calculateExamUrgency(
    userId: string,
    objective: any,
    today: Date
  ): Promise<number> {
    // Find upcoming exams for this objective's course
    const upcomingExams = await prisma.exam.findMany({
      where: {
        userId,
        courseId: objective.lecture.courseId,
        date: {
          gte: today,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (upcomingExams.length === 0) {
      return 0.3 // Default baseline for non-exam content
    }

    // Find most urgent exam that covers this objective
    let maxUrgency = 0

    for (const exam of upcomingExams) {
      // Check if exam covers this objective's content
      // Simple tag matching: check if any exam topic matches objective tags
      const objectiveTags = [
        objective.objective.toLowerCase(),
        ...(objective.lecture.topicTags || []).map((t: string) => t.toLowerCase()),
      ]

      const examTopics = exam.coverageTopics.map((t) => t.toLowerCase())
      const isRelevant = examTopics.some((topic) =>
        objectiveTags.some((tag) => tag.includes(topic) || topic.includes(tag))
      )

      if (isRelevant) {
        const daysUntil = differenceInDays(exam.date, today)
        const urgency = Math.max(0, 1.0 - daysUntil / MAX_DAYS_WINDOW)
        maxUrgency = Math.max(maxUrgency, urgency)
      }
    }

    return maxUrgency > 0 ? maxUrgency : 0.3 // Return default if no relevant exams
  }

  /**
   * Calculate high-yield factor (0.0-1.0)
   * Based on board exam tags and manual flagging
   */
  private calculateHighYieldFactor(objective: any): number {
    // Check if user manually flagged as high-yield
    if (objective.isHighYield) {
      return 1.0
    }

    // Check board exam tags
    const tags = objective.boardExamTags || []
    const hasUSMLE = tags.some((t: string) => t.includes('USMLE'))
    const hasCOMLEX = tags.some((t: string) => t.includes('COMLEX'))
    const hasNBME = tags.some((t: string) => t.includes('NBME'))

    if (hasUSMLE || hasCOMLEX) {
      return 1.0 // Highest yield
    } else if (hasNBME) {
      return 0.7 // Moderate yield
    }

    return 0.4 // Baseline importance
  }

  /**
   * Calculate prerequisite factor (0.0-1.0)
   * Higher if this objective is a prerequisite for weak areas
   */
  private calculatePrerequisiteFactor(objective: any): number {
    const dependents = objective.dependents || []

    if (dependents.length === 0) {
      return 0.5 // Neutral - no dependent relationships
    }

    // Calculate average weakness of dependent objectives
    const avgDependentWeakness =
      dependents.reduce((sum: number, dep: any) => {
        return sum + (dep.objective?.weaknessScore || 0.5)
      }, 0) / dependents.length

    // If dependent objectives are weak, this prerequisite is high priority
    if (avgDependentWeakness >= 0.6) {
      return 1.0 // Essential foundation
    } else if (objective.masteryLevel === 'MASTERED') {
      return 0.2 // Already solid, low priority
    }

    return 0.5 // Neutral
  }

  /**
   * Calculate recency penalty (0.0-1.0)
   * Higher penalty = studied recently = lower priority
   * Formula: 1.0 - min(1.0, daysSinceLastStudied / OPTIMAL_REVIEW_INTERVAL)
   */
  private calculateRecencyPenalty(objective: any, today: Date): number {
    if (!objective.lastStudiedAt) {
      return 0 // Never studied = no penalty
    }

    const daysSince = differenceInDays(today, objective.lastStudiedAt)

    if (daysSince >= OPTIMAL_REVIEW_INTERVAL) {
      return 0 // No penalty if beyond optimal interval
    }

    // Recent study = higher penalty (inverted)
    return 1.0 - Math.min(1.0, daysSince / OPTIMAL_REVIEW_INTERVAL)
  }

  /**
   * Generate short reason string for quick display
   */
  private async generateShortReason(
    userId: string,
    objective: any,
    priorityScore: number,
    today: Date
  ): Promise<string> {
    const reasons: string[] = []

    // Check exam urgency
    const examUrgency = await this.calculateExamUrgency(userId, objective, today)
    if (examUrgency >= 0.85) {
      reasons.push('Exam imminent')
    } else if (examUrgency >= 0.6) {
      reasons.push('Exam soon')
    }

    // Check weakness
    if (objective.weaknessScore >= 0.7) {
      reasons.push('Weak area')
    }

    // Check high-yield
    if (objective.isHighYield || objective.boardExamTags?.length > 0) {
      reasons.push('High-yield')
    }

    // Check prerequisite
    const dependents = objective.dependents || []
    if (dependents.length > 0) {
      const avgWeakness =
        dependents.reduce((sum: number, d: any) => sum + (d.objective?.weaknessScore || 0.5), 0) /
        dependents.length
      if (avgWeakness >= 0.6) {
        reasons.push('Prerequisite for weak areas')
      }
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'General review'
  }

  /**
   * Explain exam urgency factor
   */
  private async explainExamUrgency(
    userId: string,
    objective: any,
    urgency: number,
    today: Date
  ): Promise<string> {
    if (urgency <= 0.3) {
      return 'No upcoming exams for this content'
    }

    const upcomingExams = await prisma.exam.findMany({
      where: {
        userId,
        courseId: objective.lecture.courseId,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 1,
    })

    if (upcomingExams.length > 0) {
      const exam = upcomingExams[0]
      const days = differenceInDays(exam.date, today)
      return `Exam "${exam.name}" in ${days} days (${(urgency * 100).toFixed(0)}% urgency)`
    }

    return `Moderate urgency (${(urgency * 100).toFixed(0)}%)`
  }

  /**
   * Explain weakness score
   */
  private explainWeaknessScore(score: number): string {
    if (score >= 0.7) {
      return `High weakness (${(score * 100).toFixed(0)}%) - needs immediate attention`
    } else if (score >= 0.55) {
      return `Moderate weakness (${(score * 100).toFixed(0)}%) - needs reinforcement`
    } else if (score <= 0.3) {
      return `Strong mastery (${((1 - score) * 100).toFixed(0)}% confidence)`
    }
    return `Average performance (${(score * 100).toFixed(0)}% weakness)`
  }

  /**
   * Explain high-yield factor
   */
  private explainHighYieldFactor(objective: any, factor: number): string {
    if (objective.isHighYield) {
      return 'Manually flagged as high-yield content'
    }

    const tags = objective.boardExamTags || []
    if (tags.length > 0) {
      return `Board exam relevant: ${tags.slice(0, 2).join(', ')}`
    }

    return 'Standard importance content'
  }

  /**
   * Explain prerequisite factor
   */
  private explainPrerequisiteFactor(objective: any, factor: number): string {
    const dependents = objective.dependents || []

    if (dependents.length === 0) {
      return 'No dependent objectives identified'
    }

    const avgWeakness =
      dependents.reduce((sum: number, d: any) => sum + (d.objective?.weaknessScore || 0.5), 0) /
      dependents.length

    if (avgWeakness >= 0.6) {
      return `Essential prerequisite for ${dependents.length} weak area(s)`
    }

    if (objective.masteryLevel === 'MASTERED') {
      return 'Already mastered - lower priority'
    }

    return 'Neutral prerequisite relationship'
  }

  /**
   * Explain recency penalty
   */
  private explainRecencyPenalty(objective: any, penalty: number, today: Date): string {
    if (!objective.lastStudiedAt) {
      return 'Never studied - no recency penalty'
    }

    const daysSince = differenceInDays(today, objective.lastStudiedAt)

    if (penalty >= 0.7) {
      return `Studied ${daysSince} day(s) ago - too recent, defer for spacing`
    } else if (penalty >= 0.4) {
      return `Studied ${daysSince} day(s) ago - some recency penalty`
    }

    return `Studied ${daysSince} day(s) ago - optimal spacing window`
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(factors: PriorityFactor[], objective: any): string[] {
    const recommendations: string[] = []

    // Find highest contributing factor
    const topFactor = factors.reduce((max, f) => (f.contribution > max.contribution ? f : max))

    if (topFactor.name === 'Exam Urgency' && topFactor.value >= 0.85) {
      recommendations.push('Study this within the next 2 days')
    }

    if (topFactor.name === 'Weakness Score' && topFactor.value >= 0.7) {
      recommendations.push('Review prerequisites first, then focus extra time here')
    }

    if (topFactor.name === 'High-Yield Factor' && topFactor.value >= 0.7) {
      recommendations.push('High-yield content - allocate extra study time')
    }

    const recencyFactor = factors.find((f) => f.name === 'Recency Penalty')
    if (recencyFactor && recencyFactor.value >= 0.7) {
      recommendations.push('Recently studied - defer for 3+ days for optimal spacing')
    }

    if (recommendations.length === 0) {
      recommendations.push('Include in balanced study rotation')
    }

    return recommendations
  }

  /**
   * Determine visual priority indicator
   */
  private getVisualIndicator(
    score: number
  ): '🔴 CRITICAL' | '🟠 HIGH' | '🟡 MEDIUM' | '🟢 LOW' {
    if (score >= PRIORITY_THRESHOLDS.CRITICAL) return '🔴 CRITICAL'
    if (score >= PRIORITY_THRESHOLDS.HIGH) return '🟠 HIGH'
    if (score >= PRIORITY_THRESHOLDS.MEDIUM) return '🟡 MEDIUM'
    return '🟢 LOW'
  }
}

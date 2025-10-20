/**
 * Follow-Up Question Generator
 *
 * Generates adaptive follow-up questions based on user performance.
 * Story 4.5 AC#3: Knowledge Graph-Based Follow-Up Questions
 *
 * Features:
 * - Routes follow-ups based on score (< 60% → prerequisite, > 85% → advanced)
 * - Uses ObjectivePrerequisite join table for prerequisite identification
 * - Queries Knowledge Graph for advanced concepts
 * - Enforces max 2 follow-ups per original question
 * - Allows users to skip if time-constrained
 *
 * Pattern:
 * - Low score (< 60%): generatePrerequisiteFollowUp() → easier concepts
 * - High score (> 85%): generateAdvancedFollowUp() → harder concepts
 * - Moderate score (60-85%): No follow-up, continue main assessment
 */

import { prisma } from '@/lib/db'

type ObjectiveComplexity = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export interface FollowUpQuestionResult {
  shouldGenerateFollowUp: boolean
  followUpType: 'prerequisite' | 'advanced' | 'none'
  relatedObjectiveId: string | null
  difficultyAdjustment: number // -20 for prerequisite, +20 for advanced
  rationale: string
}

export interface FollowUpLimitResult {
  canGenerateFollowUp: boolean
  currentFollowUpCount: number
  maxAllowed: number
  reason: string
}

export class FollowUpQuestionGenerator {
  private readonly MAX_FOLLOWUPS_PER_QUESTION = 2

  /**
   * Main routing function: decides whether to generate follow-up and which type
   *
   * AC#3: Route based on score:
   * - Score < 60% → prerequisite question (difficulty -20)
   * - Score > 85% → advanced question (difficulty +20)
   * - Score 60-85% → no follow-up
   */
  async generateFollowUp(
    parentPromptId: string,
    score: number, // 0-100 scale
    userId: string
  ): Promise<FollowUpQuestionResult> {
    // Check if follow-up limit reached
    const limitCheck = await this.limitFollowUps(userId, parentPromptId)
    if (!limitCheck.canGenerateFollowUp) {
      return {
        shouldGenerateFollowUp: false,
        followUpType: 'none',
        relatedObjectiveId: null,
        difficultyAdjustment: 0,
        rationale: limitCheck.reason,
      }
    }

    // Get parent prompt to access objectiveId
    const parentPrompt = await prisma.validationPrompt.findUnique({
      where: { id: parentPromptId },
      select: { objectiveId: true },
    })

    if (!parentPrompt?.objectiveId) {
      return {
        shouldGenerateFollowUp: false,
        followUpType: 'none',
        relatedObjectiveId: null,
        difficultyAdjustment: 0,
        rationale: 'Parent prompt has no linked objective - cannot generate follow-up',
      }
    }

    // Route based on score
    if (score < 60) {
      // Low score: prerequisite follow-up
      const prerequisiteObjective = await this.findPrerequisiteQuestions(parentPrompt.objectiveId)

      return {
        shouldGenerateFollowUp: prerequisiteObjective !== null,
        followUpType: 'prerequisite',
        relatedObjectiveId: prerequisiteObjective,
        difficultyAdjustment: -20,
        rationale: prerequisiteObjective
          ? `Low score (${score}%) - generating easier prerequisite question to build foundation`
          : `Low score (${score}%) - no prerequisite concepts available`,
      }
    } else if (score > 85) {
      // High score: advanced follow-up
      const advancedObjective = await this.findAdvancedQuestions(parentPrompt.objectiveId)

      return {
        shouldGenerateFollowUp: advancedObjective !== null,
        followUpType: 'advanced',
        relatedObjectiveId: advancedObjective,
        difficultyAdjustment: 20,
        rationale: advancedObjective
          ? `Excellent score (${score}%) - generating advanced question for deeper mastery`
          : `Excellent score (${score}%) - no advanced concepts available`,
      }
    } else {
      // Moderate score: no follow-up, continue main assessment
      return {
        shouldGenerateFollowUp: false,
        followUpType: 'none',
        relatedObjectiveId: null,
        difficultyAdjustment: 0,
        rationale: `Good score (${score}%) - no follow-up needed, continuing main assessment`,
      }
    }
  }

  /**
   * Generate prerequisite follow-up for low scores (< 60%)
   *
   * AC#3: Query ObjectivePrerequisite join table for foundational concepts
   * Difficulty adjustment: -20 points (easier)
   */
  async generatePrerequisiteFollowUp(parentPromptId: string): Promise<string | null> {
    const parentPrompt = await prisma.validationPrompt.findUnique({
      where: { id: parentPromptId },
      select: { objectiveId: true },
    })

    if (!parentPrompt?.objectiveId) {
      return null
    }

    return this.findPrerequisiteQuestions(parentPrompt.objectiveId)
  }

  /**
   * Generate advanced follow-up for high scores (> 85%)
   *
   * AC#3: Query for higher complexity objectives in same course
   * Difficulty adjustment: +20 points (harder)
   */
  async generateAdvancedFollowUp(parentPromptId: string): Promise<string | null> {
    const parentPrompt = await prisma.validationPrompt.findUnique({
      where: { id: parentPromptId },
      select: { objectiveId: true },
    })

    if (!parentPrompt?.objectiveId) {
      return null
    }

    return this.findAdvancedQuestions(parentPrompt.objectiveId)
  }

  /**
   * Find prerequisite questions using ObjectivePrerequisite join table
   *
   * AC#3: Use ObjectivePrerequisite for MVP (Knowledge Graph not yet implemented)
   * Returns objectiveId of strongest prerequisite concept
   */
  async findPrerequisiteQuestions(objectiveId: string): Promise<string | null> {
    // Query ObjectivePrerequisite join table for prerequisites
    const prerequisites = await prisma.objectivePrerequisite.findMany({
      where: {
        objectiveId, // Current objective
      },
      orderBy: {
        strength: 'desc', // Order by strength (highest first)
      },
      take: 1,
      include: {
        prerequisite: {
          select: {
            id: true,
            objective: true,
            complexity: true,
          },
        },
      },
    })

    if (prerequisites.length === 0) {
      return null
    }

    // Return the strongest prerequisite objectiveId
    return prerequisites[0].prerequisiteId
  }

  /**
   * Find advanced questions using dependency graph
   *
   * AC#3: Query LearningObjective for same course but higher complexity
   * Strategy: Find objectives that depend on current objective (reverse prerequisite lookup)
   */
  async findAdvancedQuestions(objectiveId: string): Promise<string | null> {
    // Get current objective details
    const currentObjective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      select: {
        id: true,
        complexity: true,
        lecture: {
          select: {
            courseId: true,
          },
        },
      },
    })

    if (!currentObjective) {
      return null
    }

    // Strategy 1: Find objectives that list current as prerequisite (reverse lookup)
    const dependentObjectives = await prisma.objectivePrerequisite.findMany({
      where: {
        prerequisiteId: objectiveId, // Current objective is a prerequisite
      },
      orderBy: {
        strength: 'desc',
      },
      take: 1,
      include: {
        objective: {
          select: {
            id: true,
            objective: true,
            complexity: true,
          },
        },
      },
    })

    if (dependentObjectives.length > 0) {
      return dependentObjectives[0].objectiveId
    }

    // Strategy 2: Find higher complexity objectives in same course
    const complexityOrder: ObjectiveComplexity[] = ['BASIC', 'INTERMEDIATE', 'ADVANCED']
    const currentComplexityIndex = complexityOrder.indexOf(currentObjective.complexity)

    if (currentComplexityIndex < complexityOrder.length - 1) {
      // Not yet at highest complexity
      const nextComplexity = complexityOrder[currentComplexityIndex + 1]

      const advancedObjectives = await prisma.learningObjective.findMany({
        where: {
          lecture: {
            courseId: currentObjective.lecture.courseId,
          },
          complexity: nextComplexity,
          id: {
            not: objectiveId, // Exclude current objective
          },
        },
        take: 1,
        orderBy: {
          createdAt: 'asc', // Earliest objectives first (likely related)
        },
      })

      if (advancedObjectives.length > 0) {
        return advancedObjectives[0].id
      }
    }

    // No advanced concepts found
    return null
  }

  /**
   * Enforce max 2 follow-ups per original question
   *
   * AC#3: Maximum 2 follow-ups per original prompt
   * Counts existing follow-up responses for this parent prompt
   */
  async limitFollowUps(userId: string, parentPromptId: string): Promise<FollowUpLimitResult> {
    // Count existing follow-up responses for this parent prompt
    const existingFollowUps = await prisma.validationResponse.count({
      where: {
        userId,
        parentPromptId,
        isFollowUpQuestion: true,
      },
    })

    const canGenerate = existingFollowUps < this.MAX_FOLLOWUPS_PER_QUESTION

    return {
      canGenerateFollowUp: canGenerate,
      currentFollowUpCount: existingFollowUps,
      maxAllowed: this.MAX_FOLLOWUPS_PER_QUESTION,
      reason: canGenerate
        ? `${existingFollowUps}/${this.MAX_FOLLOWUPS_PER_QUESTION} follow-ups used - can generate more`
        : `Max ${this.MAX_FOLLOWUPS_PER_QUESTION} follow-ups reached for this question - skipping`,
    }
  }

  /**
   * Calculate adjusted difficulty for follow-up question
   *
   * Helper function to apply difficulty adjustment based on follow-up type
   * Prerequisite: -20 points (easier)
   * Advanced: +20 points (harder)
   */
  calculateFollowUpDifficulty(
    currentDifficulty: number,
    followUpType: 'prerequisite' | 'advanced'
  ): number {
    const adjustment = followUpType === 'prerequisite' ? -20 : 20
    return Math.max(0, Math.min(100, currentDifficulty + adjustment))
  }

  /**
   * Get follow-up context for UI display
   *
   * Provides user-friendly explanation of why follow-up is being generated
   */
  getFollowUpContext(followUpType: 'prerequisite' | 'advanced', score: number): {
    title: string
    description: string
    icon: string
  } {
    if (followUpType === 'prerequisite') {
      return {
        title: 'Building Foundation',
        description: `Your score of ${score}% suggests reviewing foundational concepts. This easier question will help strengthen the basics.`,
        icon: '📚', // Book emoji for learning
      }
    } else {
      return {
        title: 'Deeper Challenge',
        description: `Excellent score of ${score}%! This advanced question will help deepen your mastery.`,
        icon: '🚀', // Rocket emoji for advancement
      }
    }
  }
}

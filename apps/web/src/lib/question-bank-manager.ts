/**
 * Question Bank Manager
 *
 * Manages adaptive question bank for Story 4.5 AC#5.
 * Handles question selection, cooldown enforcement, difficulty filtering,
 * discrimination index tracking, and question effectiveness flagging.
 *
 * Features:
 * - Load question bank with difficulty/discrimination data
 * - Filter questions by difficulty range (±10 points)
 * - Enforce 14-day cooldown period
 * - Select best question based on usage and discrimination
 * - Update question statistics (usage, discrimination index)
 * - Flag ineffective questions (discrimination < 0.2)
 */

import type { ValidationPrompt } from '@/generated/prisma'
import { prisma } from '@/lib/db'

export interface QuestionBankQuestion {
  id: string
  promptText: string
  conceptName: string
  promptType: string
  difficultyLevel: number
  discriminationIndex: number | null
  timesUsed: number
  lastUsedAt: Date | null
  objectiveId: string | null
}

export interface QuestionSelectionCriteria {
  preferUnused: boolean // Prioritize questions never answered
  sortByDiscrimination: boolean // Sort by discrimination DESC (more discriminating questions first)
  excludeRecent: boolean // Enforce 14-day cooldown
}

export interface QuestionStats {
  promptId: string
  timesUsed: number
  lastUsedAt: Date
  discriminationIndex: number | null
  isFlagged: boolean
  flagReason: string | null
}

export class QuestionBankManager {
  /**
   * Load all questions for an objective with difficulty/discrimination data
   *
   * @param objectiveId - Learning objective ID
   * @returns Array of questions with metadata
   */
  async loadQuestionBank(objectiveId: string): Promise<QuestionBankQuestion[]> {
    const questions = await prisma.validationPrompt.findMany({
      where: {
        objectiveId,
      },
      select: {
        id: true,
        promptText: true,
        conceptName: true,
        promptType: true,
        difficultyLevel: true,
        discriminationIndex: true,
        timesUsed: true,
        lastUsedAt: true,
        objectiveId: true,
      },
      orderBy: [
        { timesUsed: 'asc' }, // Prioritize unused questions
        { discriminationIndex: 'desc' }, // Then by discrimination
      ],
    })

    return questions.map((q) => ({
      id: q.id,
      promptText: q.promptText,
      conceptName: q.conceptName,
      promptType: q.promptType,
      difficultyLevel: q.difficultyLevel ?? 0,
      discriminationIndex: q.discriminationIndex,
      timesUsed: q.timesUsed,
      lastUsedAt: q.lastUsedAt,
      objectiveId: q.objectiveId,
    }))
  }

  /**
   * Filter questions by difficulty range (±10 points)
   *
   * @param questions - Questions to filter
   * @param targetDifficulty - Target difficulty (0-100)
   * @returns Filtered questions within ±10 difficulty range
   */
  filterByDifficulty(
    questions: QuestionBankQuestion[],
    targetDifficulty: number,
  ): QuestionBankQuestion[] {
    const minDifficulty = Math.max(0, targetDifficulty - 10)
    const maxDifficulty = Math.min(100, targetDifficulty + 10)

    return questions.filter(
      (q) => q.difficultyLevel >= minDifficulty && q.difficultyLevel <= maxDifficulty,
    )
  }

  /**
   * Enforce 14-day cooldown period
   *
   * Removes questions answered by user in last 14 days (minimum cooldown)
   *
   * @param questions - Questions to filter
   * @param userId - User ID
   * @returns Questions not recently answered (or never answered)
   */
  async enforceCooldown(
    questions: QuestionBankQuestion[],
    userId: string,
  ): Promise<QuestionBankQuestion[]> {
    const cooldownDate = new Date()
    cooldownDate.setDate(cooldownDate.getDate() - 14) // 14 days ago

    // Get question IDs answered by user in last 14 days
    const recentResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        promptId: {
          in: questions.map((q) => q.id),
        },
        respondedAt: {
          gte: cooldownDate,
        },
      },
      select: {
        promptId: true,
      },
    })

    const recentPromptIds = new Set(recentResponses.map((r) => r.promptId))

    return questions.filter((q) => !recentPromptIds.has(q.id))
  }

  /**
   * Select best question based on criteria
   *
   * Prioritization:
   * 1. Unused questions (timesUsed = 0) - highest priority
   * 2. Sort by discrimination index DESC (most discriminating first)
   * 3. Sort by timesUsed ASC (least used first)
   *
   * @param questions - Questions to choose from
   * @param criteria - Selection criteria
   * @returns Best question, or null if none available
   */
  selectBestQuestion(
    questions: QuestionBankQuestion[],
    criteria: QuestionSelectionCriteria,
  ): QuestionBankQuestion | null {
    if (questions.length === 0) {
      return null
    }

    // Create copy for sorting
    const sortedQuestions = [...questions]

    // Sort based on criteria
    sortedQuestions.sort((a, b) => {
      // Priority 1: preferUnused - unused questions first
      if (criteria.preferUnused) {
        if (a.timesUsed === 0 && b.timesUsed !== 0) return -1
        if (a.timesUsed !== 0 && b.timesUsed === 0) return 1
        // Both unused or both used, continue to next criteria
      }

      // Priority 2: sortByDiscrimination - higher discrimination first (within same usage tier)
      if (criteria.sortByDiscrimination) {
        // Null discrimination goes to end
        if (a.discriminationIndex === null && b.discriminationIndex === null) {
          // Both null, sort by timesUsed
          return a.timesUsed - b.timesUsed
        }
        if (a.discriminationIndex === null) return 1
        if (b.discriminationIndex === null) return -1

        // Higher discrimination first
        if (b.discriminationIndex !== a.discriminationIndex) {
          return b.discriminationIndex - a.discriminationIndex
        }
      }

      // Priority 3: Tie-breaker - fewer times used
      if (a.timesUsed !== b.timesUsed) {
        return a.timesUsed - b.timesUsed
      }

      // Final tie-breaker: higher discrimination (if available)
      if (a.discriminationIndex === null && b.discriminationIndex === null) return 0
      if (a.discriminationIndex === null) return 1
      if (b.discriminationIndex === null) return -1

      return b.discriminationIndex - a.discriminationIndex
    })

    return sortedQuestions[0]
  }

  /**
   * Update question statistics after use
   *
   * Increments timesUsed, updates lastUsedAt, recalculates discrimination index
   *
   * @param promptId - Question ID
   * @param difficulty - Difficulty level of question (for IRT)
   * @param responseScore - User's score on this question (0-100)
   * @returns Updated question stats
   */
  async updateQuestionStats(
    promptId: string,
    difficulty: number,
    responseScore: number,
  ): Promise<QuestionStats> {
    const now = new Date()

    // Update usage statistics
    await prisma.validationPrompt.update({
      where: { id: promptId },
      data: {
        timesUsed: { increment: 1 },
        lastUsedAt: now,
      },
    })

    // Recalculate discrimination index if enough responses (≥20)
    const responseCount = await prisma.validationResponse.count({
      where: { promptId },
    })

    let discriminationIndex: number | null = null
    let isFlagged = false
    let flagReason: string | null = null

    if (responseCount >= 20) {
      // Calculate discrimination index: D = (% correct top 27%) - (% correct bottom 27%)
      discriminationIndex = await this.calculateDiscriminationIndex(promptId)

      // Update discrimination index in database
      await prisma.validationPrompt.update({
        where: { id: promptId },
        data: { discriminationIndex },
      })

      // Flag poor questions (D < 0.2)
      if (discriminationIndex < 0.2) {
        isFlagged = true
        flagReason = `Low discrimination index (${discriminationIndex.toFixed(2)}) - question does not effectively distinguish between high and low performers`
      }
    }

    // Get updated question
    const updatedQuestion = await prisma.validationPrompt.findUnique({
      where: { id: promptId },
      select: {
        id: true,
        timesUsed: true,
        lastUsedAt: true,
        discriminationIndex: true,
      },
    })

    if (!updatedQuestion) {
      throw new Error(`Question ${promptId} not found after update`)
    }

    return {
      promptId: updatedQuestion.id,
      timesUsed: updatedQuestion.timesUsed,
      lastUsedAt: updatedQuestion.lastUsedAt || now,
      discriminationIndex: updatedQuestion.discriminationIndex,
      isFlagged,
      flagReason,
    }
  }

  /**
   * Calculate discrimination index for a question
   *
   * D = (% correct top 27%) - (% correct bottom 27%)
   * Discrimination index > 0.3 = good question
   * Discrimination index < 0.2 = poor question (flag for review)
   *
   * @param promptId - Question ID
   * @returns Discrimination index (0.0-1.0)
   */
  async calculateDiscriminationIndex(promptId: string): Promise<number> {
    // Get all responses for this question
    const responses = await prisma.validationResponse.findMany({
      where: { promptId },
      select: {
        score: true, // 0.0-1.0 scale
      },
      orderBy: {
        score: 'desc',
      },
    })

    const totalResponses = responses.length

    if (totalResponses < 20) {
      // Not enough data for reliable discrimination index
      return 0.0
    }

    // Calculate top 27% and bottom 27% boundaries
    const topCount = Math.ceil(totalResponses * 0.27)
    const bottomCount = Math.ceil(totalResponses * 0.27)

    // Get top 27% responses
    const topResponses = responses.slice(0, topCount)
    const topCorrect = topResponses.filter((r) => r.score >= 0.8).length // 80% threshold for "correct"
    const topPercentCorrect = topCorrect / topCount

    // Get bottom 27% responses
    const bottomResponses = responses.slice(-bottomCount)
    const bottomCorrect = bottomResponses.filter((r) => r.score >= 0.8).length
    const bottomPercentCorrect = bottomCorrect / bottomCount

    // D = (% correct top) - (% correct bottom)
    const discriminationIndex = topPercentCorrect - bottomPercentCorrect

    return Math.max(0.0, Math.min(1.0, discriminationIndex)) // Clamp to 0-1
  }

  /**
   * Flag poor questions for review
   *
   * Questions with discrimination index < 0.2 after 20+ responses are flagged.
   * These questions do not effectively distinguish between high/low performers.
   *
   * @param promptId - Question ID
   * @returns True if question was flagged, false otherwise
   */
  async flagPoorQuestions(promptId: string): Promise<boolean> {
    const question = await prisma.validationPrompt.findUnique({
      where: { id: promptId },
      include: {
        responses: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!question) {
      return false
    }

    const responseCount = question.responses.length

    // Only flag if enough responses (≥20)
    if (responseCount < 20) {
      return false
    }

    // Check discrimination index
    const discriminationIndex = question.discriminationIndex

    if (discriminationIndex === null) {
      // Calculate if not already calculated
      const calculatedIndex = await this.calculateDiscriminationIndex(promptId)

      await prisma.validationPrompt.update({
        where: { id: promptId },
        data: { discriminationIndex: calculatedIndex },
      })

      return calculatedIndex < 0.2
    }

    return discriminationIndex < 0.2
  }

  /**
   * Get questions flagged for review
   *
   * Returns questions with low discrimination index (< 0.2) that should be revised or removed
   *
   * @param objectiveId - Optional objective ID to filter by
   * @returns Array of flagged questions with statistics
   */
  async getFlaggedQuestions(
    objectiveId?: string,
  ): Promise<Array<QuestionBankQuestion & { flagReason: string }>> {
    const questions = await prisma.validationPrompt.findMany({
      where: {
        objectiveId,
        discriminationIndex: {
          lt: 0.2,
          not: null,
        },
        responses: {
          some: {}, // Has at least one response
        },
      },
      include: {
        responses: {
          select: {
            id: true,
          },
        },
      },
    })

    // Filter to questions with ≥20 responses
    return questions
      .filter((q) => q.responses.length >= 20)
      .map((q) => ({
        id: q.id,
        promptText: q.promptText,
        conceptName: q.conceptName,
        promptType: q.promptType,
        difficultyLevel: q.difficultyLevel ?? 0,
        discriminationIndex: q.discriminationIndex,
        timesUsed: q.timesUsed,
        lastUsedAt: q.lastUsedAt,
        objectiveId: q.objectiveId,
        flagReason: `Low discrimination index (${q.discriminationIndex?.toFixed(2)}) - question does not effectively distinguish between high and low performers. Consider revising or removing.`,
      }))
  }
}

/**
 * Singleton instance export
 */
export const questionBankManager = new QuestionBankManager()

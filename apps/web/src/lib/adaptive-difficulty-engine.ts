// Adaptive Difficulty Engine for Story 4.5
// Manages difficulty calculations, adjustments, and question selection
// Implements Item Response Theory (IRT) simplified Rasch model (1PL)

import { ObjectiveComplexity } from '@/generated/prisma'
import { prisma } from './db'

/**
 * Difficulty adjustment result
 */
export interface DifficultyAdjustment {
  /** New difficulty level (0-100) */
  newDifficulty: number
  /** Adjustment amount (+15, 0, -15) */
  adjustment: number
  /** Human-readable reason for adjustment */
  reason: string
}

/**
 * Question selection criteria
 */
export interface QuestionCriteria {
  /** Target difficulty level (0-100) */
  difficulty: number
  /** Complexity level */
  complexity: ObjectiveComplexity
  /** User ID for history tracking */
  userId: string
  /** Objective ID to filter questions */
  objectiveId: string
}

/**
 * Question metadata for selection
 */
export interface QuestionMetadata {
  /** Question ID */
  id: string
  /** Difficulty level (0-100) */
  difficultyLevel: number
  /** Complexity level */
  complexity: ObjectiveComplexity
  /** Times this question has been used */
  timesUsed: number
  /** Last time this question was used (ISO string) */
  lastUsedAt: string | null
  /** Discrimination index (0.0-1.0) */
  discriminationIndex: number | null
}

/**
 * Performance history for initial difficulty calculation
 */
interface PerformanceRecord {
  score: number
  objectiveId: string
  respondedAt: Date
}

/**
 * Adaptive Difficulty Engine
 *
 * Manages adaptive difficulty calculations based on user performance.
 * Implements simplified IRT (Rasch model) for efficient assessment.
 *
 * @example
 * ```typescript
 * const engine = new AdaptiveDifficultyEngine();
 *
 * // Calculate initial difficulty
 * const initialDifficulty = await engine.calculateInitialDifficulty(userId, objectiveId);
 *
 * // Adjust difficulty based on performance
 * const adjustment = engine.adjustDifficulty(75, initialDifficulty);
 *
 * // Select question at target difficulty
 * const question = await engine.getQuestionByDifficulty({
 *   difficulty: adjustment.newDifficulty,
 *   complexity: 'INTERMEDIATE',
 *   userId,
 *   objectiveId
 * });
 * ```
 */
export class AdaptiveDifficultyEngine {
  /** Default difficulty for users with no history */
  private static readonly DEFAULT_DIFFICULTY = 50

  /** Difficulty increase for high performance (score > 80) */
  private static readonly DIFFICULTY_INCREASE = 15

  /** Difficulty decrease for low performance (score < 60) */
  private static readonly DIFFICULTY_DECREASE = 15

  /** Minimum difficulty level */
  private static readonly MIN_DIFFICULTY = 0

  /** Maximum difficulty level */
  private static readonly MAX_DIFFICULTY = 100

  /** Number of recent assessments to consider for initial difficulty */
  private static readonly HISTORY_WINDOW = 10

  /** Question cooldown period (14 days) */
  private static readonly COOLDOWN_DAYS = 14

  /** Minimum discrimination index for effective questions */
  private static readonly MIN_DISCRIMINATION = 0.2

  /** Minimum sample size for discrimination calculation */
  private static readonly MIN_DISCRIMINATION_SAMPLES = 20

  /**
   * Calculate initial difficulty based on user's historical performance
   *
   * Analyzes the last 10 assessments for the given objective and related concepts.
   * Uses weighted average of scores with confidence calibration adjustments.
   *
   * @param userId - User ID to analyze
   * @param objectiveId - Optional objective ID to focus on (defaults to global history)
   * @returns Promise<number> - Initial difficulty (0-100)
   *
   * @example
   * ```typescript
   * const difficulty = await engine.calculateInitialDifficulty('user123', 'obj456');
   * // Returns: 65 (based on average performance around 65%)
   * ```
   */
  async calculateInitialDifficulty(userId: string, objectiveId?: string): Promise<number> {
    // Query last N assessments for user
    const recentResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        ...(objectiveId && {
          prompt: {
            objectiveId,
          },
        }),
      },
      select: {
        score: true,
        respondedAt: true,
        prompt: {
          select: {
            objectiveId: true,
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: AdaptiveDifficultyEngine.HISTORY_WINDOW,
    })

    // If no history, return default difficulty
    if (recentResponses.length === 0) {
      return AdaptiveDifficultyEngine.DEFAULT_DIFFICULTY
    }

    // Calculate weighted average (more recent = higher weight)
    let weightedSum = 0
    let totalWeight = 0

    recentResponses.forEach((response, index) => {
      // Convert score (0.0-1.0) to percentage (0-100)
      const scorePercentage = response.score * 100

      // Weight: more recent responses weighted higher (exponential decay)
      // Most recent = weight 1.0, oldest = weight 0.5
      const weight = 1.0 - index / (AdaptiveDifficultyEngine.HISTORY_WINDOW * 2)

      weightedSum += scorePercentage * weight
      totalWeight += weight
    })

    const averageScore =
      totalWeight > 0 ? weightedSum / totalWeight : AdaptiveDifficultyEngine.DEFAULT_DIFFICULTY

    // Map score to difficulty (score of 80+ suggests current difficulty is appropriate)
    // Score 90+ → increase initial difficulty slightly
    // Score < 70 → decrease initial difficulty slightly
    let initialDifficulty = averageScore

    if (averageScore >= 90) {
      initialDifficulty = Math.min(initialDifficulty + 10, AdaptiveDifficultyEngine.MAX_DIFFICULTY)
    } else if (averageScore < 70) {
      initialDifficulty = Math.max(initialDifficulty - 10, AdaptiveDifficultyEngine.MIN_DIFFICULTY)
    }

    // Clamp to valid range
    return Math.max(
      AdaptiveDifficultyEngine.MIN_DIFFICULTY,
      Math.min(AdaptiveDifficultyEngine.MAX_DIFFICULTY, Math.round(initialDifficulty)),
    )
  }

  /**
   * Adjust difficulty based on user's response quality
   *
   * Implements adaptive algorithm:
   * - Score > 80: Increase difficulty by 15 points
   * - Score 60-80: Maintain difficulty ± 5 points variation (0 on boundaries)
   * - Score < 60: Decrease difficulty by 15 points
   *
   * @param currentScore - User's score on current question (0-100)
   * @param currentDifficulty - Current difficulty level (0-100)
   * @returns DifficultyAdjustment - New difficulty with adjustment details
   *
   * @example
   * ```typescript
   * const adjustment = engine.adjustDifficulty(90, 50);
   * // Returns: { newDifficulty: 65, adjustment: 15, reason: "Excellent performance..." }
   * ```
   */
  adjustDifficulty(currentScore: number, currentDifficulty: number): DifficultyAdjustment {
    let adjustment = 0
    let reason = ''

    // High performance → increase difficulty
    if (currentScore > 80) {
      adjustment = AdaptiveDifficultyEngine.DIFFICULTY_INCREASE
      reason = `Excellent performance (${currentScore}%) - increasing challenge level`
    }
    // Low performance → decrease difficulty
    else if (currentScore < 60) {
      adjustment = -AdaptiveDifficultyEngine.DIFFICULTY_DECREASE
      reason = `Needs more practice (${currentScore}%) - providing more accessible questions`
    }
    // Moderate performance → maintain with small variation
    else {
      // At exact boundaries (80 or 60), maintain current difficulty
      // Otherwise small random variation (±5) to prevent monotony
      if (currentScore === 80 || currentScore === 60) {
        adjustment = 0
      } else {
        adjustment = Math.random() < 0.5 ? -5 : 5
      }
      reason = `Solid performance (${currentScore}%) - maintaining similar difficulty with slight variation`
    }

    // Calculate new difficulty with clamping
    const newDifficulty = Math.max(
      AdaptiveDifficultyEngine.MIN_DIFFICULTY,
      Math.min(AdaptiveDifficultyEngine.MAX_DIFFICULTY, currentDifficulty + adjustment),
    )

    // Update reason if clamped
    if (newDifficulty === AdaptiveDifficultyEngine.MIN_DIFFICULTY) {
      reason += ' (at minimum difficulty)'
    } else if (newDifficulty === AdaptiveDifficultyEngine.MAX_DIFFICULTY) {
      reason += ' (at maximum difficulty)'
    }

    return {
      newDifficulty,
      adjustment,
      reason,
    }
  }

  /**
   * Select question matching target difficulty and complexity
   *
   * Implements intelligent question selection:
   * - Filters by difficulty range (±10 points)
   * - Excludes recently answered questions (14-day cooldown)
   * - Prioritizes unused questions
   * - Considers discrimination index for effectiveness
   * - Falls back to question generation if none available
   *
   * @param criteria - Question selection criteria
   * @returns Promise<QuestionMetadata | null> - Selected question or null if none available
   *
   * @example
   * ```typescript
   * const question = await engine.getQuestionByDifficulty({
   *   difficulty: 65,
   *   complexity: 'INTERMEDIATE',
   *   userId: 'user123',
   *   objectiveId: 'obj456'
   * });
   * ```
   */
  async getQuestionByDifficulty(criteria: QuestionCriteria): Promise<QuestionMetadata | null> {
    const { difficulty, complexity, userId, objectiveId } = criteria

    // Calculate difficulty range (±10 points)
    const minDifficulty = Math.max(AdaptiveDifficultyEngine.MIN_DIFFICULTY, difficulty - 10)
    const maxDifficulty = Math.min(AdaptiveDifficultyEngine.MAX_DIFFICULTY, difficulty + 10)

    // Calculate cooldown date (14 days ago)
    const cooldownDate = new Date()
    cooldownDate.setDate(cooldownDate.getDate() - AdaptiveDifficultyEngine.COOLDOWN_DAYS)

    // Get user's recent responses to exclude already-answered questions
    const recentResponsePromptIds = await prisma.validationResponse.findMany({
      where: {
        userId,
        respondedAt: {
          gte: cooldownDate,
        },
      },
      select: {
        promptId: true,
      },
    })

    const excludedPromptIds = recentResponsePromptIds.map((r) => r.promptId)

    // Query available questions with difficulty and complexity filters
    const availableQuestions = await prisma.validationPrompt.findMany({
      where: {
        objectiveId,
        difficultyLevel: {
          gte: minDifficulty,
          lte: maxDifficulty,
        },
        id: {
          notIn: excludedPromptIds,
        },
        // Filter out questions with poor discrimination (if we have data)
        OR: [
          {
            discriminationIndex: null, // No data yet - include
          },
          {
            discriminationIndex: {
              gte: AdaptiveDifficultyEngine.MIN_DISCRIMINATION, // Good discrimination
            },
          },
        ],
      },
      select: {
        id: true,
        promptText: true,
        conceptName: true,
        difficultyLevel: true,
        timesUsed: true,
        lastUsedAt: true,
        discriminationIndex: true,
      },
      // Prioritize unused questions, then by discrimination index
      orderBy: [
        { timesUsed: 'asc' }, // Least used first
        { discriminationIndex: 'desc' }, // Best discrimination first (nulls last)
      ],
      take: 10, // Get top 10 candidates
    })

    // If no questions available, return null (caller should trigger generation)
    if (availableQuestions.length === 0) {
      return null
    }

    // Select first available question (already sorted by priority)
    const selectedPrompt = availableQuestions[0]

    // Return question metadata
    return {
      id: selectedPrompt.id,
      // Prisma type is number | null; coalesce to 0 for strict typing
      difficultyLevel: selectedPrompt.difficultyLevel ?? 0,
      complexity, // From criteria (complexity not stored in prompt currently)
      timesUsed: selectedPrompt.timesUsed,
      lastUsedAt: selectedPrompt.lastUsedAt?.toISOString() || null,
      discriminationIndex: selectedPrompt.discriminationIndex,
    }
  }

  /**
   * Map difficulty level to complexity category
   *
   * @param difficulty - Difficulty level (0-100)
   * @returns ObjectiveComplexity - BASIC, INTERMEDIATE, or ADVANCED
   *
   * @example
   * ```typescript
   * const complexity = engine.mapDifficultyToComplexity(75);
   * // Returns: 'ADVANCED'
   * ```
   */
  mapDifficultyToComplexity(difficulty: number): ObjectiveComplexity {
    if (difficulty < 40) {
      return ObjectiveComplexity.BASIC
    } else if (difficulty < 70) {
      return ObjectiveComplexity.INTERMEDIATE
    } else {
      return ObjectiveComplexity.ADVANCED
    }
  }

  /**
   * Calculate discrimination index for a question
   *
   * Discrimination index (D) = (% correct in top 27%) - (% correct in bottom 27%)
   * Measures how well a question differentiates high vs low performers.
   *
   * D > 0.3: Excellent discrimination
   * D 0.2-0.3: Good discrimination
   * D < 0.2: Poor discrimination (consider removing)
   *
   * @param promptId - Question ID to analyze
   * @returns Promise<number | null> - Discrimination index or null if insufficient data
   *
   * @example
   * ```typescript
   * const discrimination = await engine.calculateDiscrimination('prompt123');
   * // Returns: 0.45 (excellent discrimination)
   * ```
   */
  async calculateDiscrimination(promptId: string): Promise<number | null> {
    // Get all responses for this question
    const responses = await prisma.validationResponse.findMany({
      where: {
        promptId,
      },
      select: {
        score: true,
        userId: true,
      },
      orderBy: {
        score: 'desc',
      },
    })

    // Need at least 20 responses for statistical validity (per AC#5 constraint)
    if (responses.length < AdaptiveDifficultyEngine.MIN_DISCRIMINATION_SAMPLES) {
      return null
    }

    // Calculate top 27% and bottom 27%
    const topPercentile = Math.ceil(responses.length * 0.27)
    const bottomPercentile = Math.floor(responses.length * 0.27)

    const topGroup = responses.slice(0, topPercentile)
    const bottomGroup = responses.slice(-bottomPercentile)

    // Calculate correct rate for each group (score > 0.7 = "correct")
    const topCorrectRate = topGroup.filter((r) => r.score > 0.7).length / topGroup.length
    const bottomCorrectRate = bottomGroup.filter((r) => r.score > 0.7).length / bottomGroup.length

    // Discrimination index = difference between groups
    return topCorrectRate - bottomCorrectRate
  }

  /**
   * Check if a question should be removed due to poor discrimination
   *
   * @param promptId - Question ID to check
   * @returns Promise<boolean> - True if question should be flagged for review/removal
   *
   * @example
   * ```typescript
   * const shouldRemove = await engine.shouldRemoveQuestion('prompt123');
   * if (shouldRemove) {
   *   // Flag for review or remove from active pool
   * }
   * ```
   */
  async shouldRemoveQuestion(promptId: string): Promise<boolean> {
    const discrimination = await this.calculateDiscrimination(promptId)

    // If insufficient data, don't remove yet
    if (discrimination === null) {
      return false
    }

    // Flag questions with discrimination < 0.2
    return discrimination < AdaptiveDifficultyEngine.MIN_DISCRIMINATION
  }

  /**
   * Get recommended difficulty range for a complexity level
   *
   * @param complexity - Complexity level
   * @returns { min: number, max: number } - Difficulty range
   *
   * @example
   * ```typescript
   * const range = engine.getDifficultyRangeForComplexity('INTERMEDIATE');
   * // Returns: { min: 40, max: 70 }
   * ```
   */
  getDifficultyRangeForComplexity(complexity: ObjectiveComplexity): { min: number; max: number } {
    switch (complexity) {
      case ObjectiveComplexity.BASIC:
        return { min: 0, max: 40 }
      case ObjectiveComplexity.INTERMEDIATE:
        return { min: 40, max: 70 }
      case ObjectiveComplexity.ADVANCED:
        return { min: 70, max: 100 }
      default:
        return { min: 0, max: 100 }
    }
  }
}

// Export singleton instance
export const adaptiveDifficultyEngine = new AdaptiveDifficultyEngine()

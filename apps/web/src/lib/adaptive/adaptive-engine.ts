/**
 * Adaptive Difficulty Engine
 *
 * Manages real-time difficulty adjustment based on user performance.
 * Implements Story 4.5 AC#1 (Initial Difficulty Calibration) and AC#2 (Real-Time Adjustment).
 *
 * Features:
 * - Calculates initial difficulty from historical performance (last 10 assessments)
 * - Adjusts difficulty based on response quality (+15 if score > 85%, -15 if < 60%)
 * - Enforces max 3 adjustments per session to prevent whiplash
 * - Considers confidence calibration accuracy from Story 4.4
 */

import { prisma } from '@/lib/db'

export interface DifficultyAdjustment {
  newDifficulty: number
  adjustment: number
  reason: string
}

export interface InitialDifficultyResult {
  difficulty: number
  baseline: number
  rationale: string
  sampleSize: number
}

export class AdaptiveDifficultyEngine {
  /**
   * Calculate initial difficulty based on user's last 10 assessments
   *
   * AC#1: Analyze last 10 assessments for concept and related concepts
   * Baseline difficulty = weighted average of recent scores
   * Adjust for confidence calibration accuracy (±5 points)
   * Return baseline ± 10 points for initial challenge
   */
  async calculateInitialDifficulty(
    userId: string,
    objectiveId: string
  ): Promise<InitialDifficultyResult> {
    // Query last 10 validation responses for this user and objective
    const recentResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        prompt: {
          objectiveId,
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: 10,
      include: {
        prompt: true,
      },
    })

    // If no history, start at medium difficulty (50)
    if (recentResponses.length === 0) {
      return {
        difficulty: 50,
        baseline: 50,
        rationale: 'No prior assessment history - starting at medium difficulty',
        sampleSize: 0,
      }
    }

    // Calculate baseline from recent scores
    // More recent responses weighted higher (exponential decay)
    let weightedSum = 0
    let weightTotal = 0

    recentResponses.forEach((response, index) => {
      const weight = Math.pow(0.9, index) // Exponential decay: 1.0, 0.9, 0.81...
      const normalizedScore = response.score * 100 // Convert 0-1 to 0-100
      weightedSum += normalizedScore * weight
      weightTotal += weight
    })

    const baseline = Math.round(weightedSum / weightTotal)

    // Adjust for calibration accuracy
    // Get recent calibration metrics
    const calibrationMetrics = await prisma.calibrationMetric.findMany({
      where: {
        userId,
        objectiveId,
      },
      orderBy: {
        date: 'desc',
      },
      take: 3,
    })

    let calibrationAdjustment = 0
    if (calibrationMetrics.length > 0) {
      const avgCorrelation = calibrationMetrics.reduce((sum, m) => sum + m.correlationCoeff, 0) / calibrationMetrics.length

      // Well-calibrated users (correlation > 0.7) get +5 difficulty
      // Poorly-calibrated users (correlation < 0.3) get -5 difficulty
      if (avgCorrelation > 0.7) {
        calibrationAdjustment = 5
      } else if (avgCorrelation < 0.3) {
        calibrationAdjustment = -5
      }
    }

    // Add variation (±10 points) for initial challenge
    const variation = Math.floor(Math.random() * 21) - 10 // -10 to +10
    const finalDifficulty = Math.max(0, Math.min(100, baseline + calibrationAdjustment + variation))

    return {
      difficulty: finalDifficulty,
      baseline,
      rationale: `Baseline ${baseline} from ${recentResponses.length} recent assessments. Calibration adjustment: ${calibrationAdjustment}. Variation: ${variation}.`,
      sampleSize: recentResponses.length,
    }
  }

  /**
   * Adjust difficulty based on response quality
   *
   * AC#2: Real-time difficulty adjustment rules:
   * - Score > 85%: +15 points (max 100)
   * - Score 60-85%: ±5 points (random variation)
   * - Score < 60%: -15 points (min 0)
   * - Max 3 adjustments per session enforced externally
   */
  adjustDifficulty(
    currentDifficulty: number,
    score: number, // 0-100 scale
    confidenceLevel?: number, // 1-5 scale
    sessionAdjustmentCount?: number
  ): DifficultyAdjustment {
    // Enforce max 3 adjustments per session
    if (sessionAdjustmentCount !== undefined && sessionAdjustmentCount >= 3) {
      return {
        newDifficulty: currentDifficulty,
        adjustment: 0,
        reason: 'Max 3 adjustments per session reached - maintaining current difficulty',
      }
    }

    let adjustment = 0
    let reason = ''

    if (score > 85) {
      // Excellent performance - increase difficulty
      adjustment = 15
      reason = `Excellent performance (${score}%) - increasing difficulty to maintain challenge`
    } else if (score >= 60) {
      // Good performance - maintain with slight variation
      adjustment = Math.floor(Math.random() * 11) - 5 // -5 to +5
      reason = `Good performance (${score}%) - maintaining difficulty with slight variation (${adjustment > 0 ? '+' : ''}${adjustment})`
    } else {
      // Poor performance - decrease difficulty
      adjustment = -15
      reason = `Struggling (${score}%) - decreasing difficulty to build confidence`
    }

    // Apply adjustment and clamp to 0-100 range
    const newDifficulty = Math.max(0, Math.min(100, currentDifficulty + adjustment))

    return {
      newDifficulty,
      adjustment,
      reason,
    }
  }

  /**
   * Calculate difficulty ranges for question selection
   *
   * Returns min/max difficulty range (±10 points) for database query
   */
  getDifficultyRange(targetDifficulty: number): { min: number; max: number } {
    return {
      min: Math.max(0, targetDifficulty - 10),
      max: Math.min(100, targetDifficulty + 10),
    }
  }
}

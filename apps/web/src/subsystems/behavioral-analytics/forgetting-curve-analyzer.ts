/**
 * Forgetting Curve Analyzer
 * Story 5.1 Task 5
 *
 * Calculates personalized forgetting curves and retention predictions
 * based on user's review history using exponential decay modeling.
 */

import type { Review } from '@/generated/prisma'
import { prisma } from '@/lib/db'
import { PerformanceCalculator } from '@/lib/performance-calculator'

// Standard Ebbinghaus forgetting curve parameters
const EBBINGHAUS_R0 = 1.0
const EBBINGHAUS_K = 0.14 // ~5 day half-life

// Minimum data requirements for curve calculation
const MIN_REVIEWS = 50
const MIN_DAYS = 30
const MIN_REVIEWS_PER_CARD = 2

// Standard intervals to sample for retention curve (in days)
const SAMPLE_INTERVALS = [1, 3, 7, 14, 30, 90]

/**
 * Forgetting curve model parameters
 */
export interface ForgettingCurveModel {
  /** Initial retention (0-1) */
  R0: number
  /** Decay rate constant */
  k: number
  /** Half-life in days (time until retention drops to 50%) */
  halfLife: number
  /** Confidence score (0-1) based on data quality */
  confidence: number
  /** Human-readable deviation from standard curve */
  deviation: string
}

/**
 * Retention data point for curve visualization
 */
export interface RetentionCurveData {
  /** Days since review */
  days: number
  /** Retention score (0-1) */
  retention: number
  /** Number of samples at this interval */
  sampleCount: number
}

/**
 * Retention prediction for a specific objective
 */
export interface RetentionPrediction {
  /** Objective ID */
  objectiveId: string
  /** Predicted retention at current time (0-1) */
  currentRetention: number
  /** Days until retention drops below 0.5 */
  daysUntilForgetting: number
  /** Recommended review date */
  recommendedReviewDate: Date
  /** Confidence in prediction (0-1) */
  confidence: number
}

/**
 * Internal data point for curve fitting
 */
interface DataPoint {
  days: number
  retention: number
}

export class ForgettingCurveAnalyzer {
  /**
   * Calculate personalized forgetting curve for a user
   *
   * Algorithm:
   * 1. Query reviews with multiple review cycles per card
   * 2. For each review, measure retention at standard intervals
   * 3. Fit exponential decay curve: R(t) = R₀ × e^(-kt)
   * 4. Calculate half-life and compare to Ebbinghaus baseline
   *
   * @param userId - User ID to analyze
   * @returns Personalized forgetting curve model
   */
  static async calculatePersonalizedForgettingCurve(userId: string): Promise<ForgettingCurveModel> {
    // Step 1: Query reviews with sufficient review counts
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        card: {
          reviews: {
            some: {}, // Cards that have reviews
          },
        },
      },
      include: {
        card: {
          include: {
            reviews: {
              where: { userId },
              orderBy: { reviewedAt: 'asc' },
            },
          },
        },
      },
      orderBy: { reviewedAt: 'asc' },
    })

    // Filter to cards with multiple reviews
    const cardsWithMultipleReviews = new Map<string, Review[]>()
    for (const review of reviews) {
      if (review.card.reviews.length >= MIN_REVIEWS_PER_CARD) {
        if (!cardsWithMultipleReviews.has(review.cardId)) {
          cardsWithMultipleReviews.set(review.cardId, review.card.reviews)
        }
      }
    }

    // Step 2: Check minimum requirements
    const totalReviews = reviews.length
    const dateRange =
      reviews.length > 0
        ? (reviews[reviews.length - 1].reviewedAt.getTime() - reviews[0].reviewedAt.getTime()) /
          (1000 * 60 * 60 * 24)
        : 0

    if (totalReviews < MIN_REVIEWS || dateRange < MIN_DAYS) {
      // Insufficient data - return default Ebbinghaus curve
      return {
        R0: EBBINGHAUS_R0,
        k: EBBINGHAUS_K,
        halfLife: Math.log(2) / EBBINGHAUS_K,
        confidence: Math.min(1.0, totalReviews / MIN_REVIEWS),
        deviation: 'Insufficient data - using standard Ebbinghaus curve',
      }
    }

    // Step 3: Collect retention data points at standard intervals
    const dataPoints: DataPoint[] = []

    for (const [cardId, cardReviews] of cardsWithMultipleReviews) {
      for (let i = 0; i < cardReviews.length - 1; i++) {
        const currentReview = cardReviews[i]

        for (const interval of SAMPLE_INTERVALS) {
          const nextReview = ForgettingCurveAnalyzer.getNextReviewAfterInterval(
            cardReviews,
            i,
            interval,
          )

          if (nextReview) {
            const daysSinceReview =
              (nextReview.reviewedAt.getTime() - currentReview.reviewedAt.getTime()) /
              (1000 * 60 * 60 * 24)

            const retentionScore = PerformanceCalculator.calculateRetentionScore([nextReview])
            const safeRetention = Number(retentionScore)

            if (Number.isFinite(safeRetention)) {
              dataPoints.push({
                days: daysSinceReview,
                retention: safeRetention,
              })
            }
          }
        }
      }
    }

    if (dataPoints.length === 0) {
      // No valid data points - return default curve with confidence from total review count
      return {
        R0: EBBINGHAUS_R0,
        k: EBBINGHAUS_K,
        halfLife: Math.log(2) / EBBINGHAUS_K,
        confidence: Math.min(1.0, totalReviews / MIN_REVIEWS),
        deviation: 'No valid retention intervals found',
      }
    }

    // Step 4: Fit exponential decay curve using linearized regression
    const { R0, k } = ForgettingCurveAnalyzer.fitExponentialCurve(dataPoints)

    // Step 5: Calculate half-life
    const halfLifeRaw = Math.log(2) / k
    const halfLife =
      Number.isFinite(halfLifeRaw) && halfLifeRaw > 0 ? halfLifeRaw : Math.log(2) / EBBINGHAUS_K

    // Step 6: Compare to standard Ebbinghaus curve
    const deviation = ForgettingCurveAnalyzer.calculateDeviation(k, halfLife)

    // Step 7: Calculate confidence based on total review count (not interval matches)
    const confidence = Math.min(1.0, totalReviews / MIN_REVIEWS)

    return {
      R0,
      k,
      halfLife,
      confidence,
      deviation,
    }
  }

  /**
   * Analyze retention by time interval for curve visualization
   *
   * @param userId - User ID to analyze
   * @returns Array of retention data points at standard intervals
   */
  static async analyzeRetentionByTimeInterval(userId: string): Promise<RetentionCurveData[]> {
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        card: {
          reviews: {
            some: {},
          },
        },
      },
      include: {
        card: {
          include: {
            reviews: {
              where: { userId },
              orderBy: { reviewedAt: 'asc' },
            },
          },
        },
      },
      orderBy: { reviewedAt: 'asc' },
    })

    // Group reviews by card
    const cardReviewsMap = new Map<string, Review[]>()
    for (const review of reviews) {
      if (review.card.reviews.length >= MIN_REVIEWS_PER_CARD) {
        cardReviewsMap.set(review.cardId, review.card.reviews)
      }
    }

    // Collect retention data by interval
    const intervalData = new Map<number, { retentions: number[] }>()
    SAMPLE_INTERVALS.forEach((interval) => {
      intervalData.set(interval, { retentions: [] })
    })

    for (const [cardId, cardReviews] of cardReviewsMap) {
      for (let i = 0; i < cardReviews.length - 1; i++) {
        const currentReview = cardReviews[i]

        for (const interval of SAMPLE_INTERVALS) {
          const nextReview = ForgettingCurveAnalyzer.getNextReviewAfterInterval(
            cardReviews,
            i,
            interval,
          )

          if (nextReview) {
            const retentionScore = PerformanceCalculator.calculateRetentionScore([nextReview])

            intervalData.get(interval)?.retentions.push(retentionScore)
          }
        }
      }
    }

    // Calculate average retention for each interval
    const retentionCurve: RetentionCurveData[] = []

    for (const interval of SAMPLE_INTERVALS) {
      const data = intervalData.get(interval)
      if (data && data.retentions.length > 0) {
        const avgRaw = data.retentions.reduce((sum, r) => sum + r, 0) / data.retentions.length
        const avgRetention = Number.isFinite(avgRaw) ? Math.max(0, Math.min(1, avgRaw)) : 0

        retentionCurve.push({
          days: interval,
          retention: avgRetention,
          sampleCount: data.retentions.length,
        })
      }
    }

    return retentionCurve
  }

  /**
   * Predict retention decay for a specific objective
   *
   * @param userId - User ID
   * @param objectiveId - Learning objective ID
   * @returns Retention prediction
   */
  static async predictRetentionDecay(
    userId: string,
    objectiveId: string,
  ): Promise<RetentionPrediction> {
    // Get personalized forgetting curve
    const curve = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

    // Get last review date for this objective
    const lastReview = await prisma.review.findFirst({
      where: {
        userId,
        card: {
          objectiveId,
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
    })

    if (!lastReview) {
      // No reviews yet - return conservative prediction
      return {
        objectiveId,
        currentRetention: 0,
        daysUntilForgetting: 0,
        recommendedReviewDate: new Date(),
        confidence: 0,
      }
    }

    // Calculate days since last review
    const daysSinceReview = (Date.now() - lastReview.reviewedAt.getTime()) / (1000 * 60 * 60 * 24)

    // Calculate current retention using personalized curve: R(t) = R₀ × e^(-kt)
    const currentRetentionRaw = curve.R0 * Math.exp(-curve.k * daysSinceReview)
    const currentRetention = Number.isFinite(currentRetentionRaw)
      ? Math.max(0, Math.min(1, currentRetentionRaw))
      : 0

    // Calculate days until retention drops below 0.5
    // Solve: 0.5 = R₀ × e^(-kt) for t
    // t = -ln(0.5/R₀) / k
    const targetRetention = 0.5
    const daysUntilForgettingRaw = -Math.log(targetRetention / curve.R0) / curve.k - daysSinceReview
    const daysUntilForgetting = Number.isFinite(daysUntilForgettingRaw)
      ? Math.max(0, daysUntilForgettingRaw)
      : 0

    // Recommend review when retention is expected to drop to 0.7 (optimal spacing)
    const optimalRetention = 0.7
    const daysUntilOptimalReviewRaw =
      -Math.log(optimalRetention / curve.R0) / curve.k - daysSinceReview
    const daysUntilOptimalReview = Number.isFinite(daysUntilOptimalReviewRaw)
      ? Math.max(0, daysUntilOptimalReviewRaw)
      : 0

    const recommendedReviewDate = new Date(
      Date.now() + daysUntilOptimalReview * 24 * 60 * 60 * 1000,
    )

    return {
      objectiveId,
      currentRetention,
      daysUntilForgetting,
      recommendedReviewDate,
      confidence: curve.confidence,
    }
  }

  /**
   * Get the next review after a specified interval
   *
   * @param reviews - Sorted array of reviews for a card
   * @param currentIndex - Index of current review
   * @param targetInterval - Target interval in days
   * @returns Next review within acceptable range of target interval, or null
   */
  private static getNextReviewAfterInterval(
    reviews: Review[],
    currentIndex: number,
    targetInterval: number,
  ): Review | null {
    const currentReview = reviews[currentIndex]
    const targetTime = currentReview.reviewedAt.getTime() + targetInterval * 24 * 60 * 60 * 1000

    // Look for next review within ±20% of target interval
    const tolerance = targetInterval * 0.2 * 24 * 60 * 60 * 1000

    for (let i = currentIndex + 1; i < reviews.length; i++) {
      const nextReview = reviews[i]
      const timeDiff = Math.abs(nextReview.reviewedAt.getTime() - targetTime)

      if (timeDiff <= tolerance) {
        return nextReview
      }

      // If we've gone past the window, stop searching
      if (nextReview.reviewedAt.getTime() > targetTime + tolerance) {
        break
      }
    }

    return null
  }

  /**
   * Fit exponential decay curve using linearized least squares regression
   *
   * Linearization: log(R) = log(R₀) - kt
   * This transforms the exponential into a linear equation for regression
   *
   * @param dataPoints - Array of {days, retention} data points
   * @returns Fitted curve parameters {R0, k}
   */
  private static fitExponentialCurve(dataPoints: DataPoint[]): { R0: number; k: number } {
    // Filter out zero retention values (log undefined)
    const validPoints = dataPoints.filter((p) => p.retention > 0)

    if (validPoints.length < 2) {
      return { R0: EBBINGHAUS_R0, k: EBBINGHAUS_K }
    }

    // Linearize: y = log(retention), x = days
    const n = validPoints.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (const point of validPoints) {
      const x = point.days
      const y = Math.log(point.retention)

      sumX += x
      sumY += y
      sumXY += x * y
      sumXX += x * x
    }

    // Linear regression: y = a + bx where a = log(R₀), b = -k
    const denominator = n * sumXX - sumX * sumX

    if (denominator === 0) {
      return { R0: EBBINGHAUS_R0, k: EBBINGHAUS_K }
    }

    const a = (sumY * sumXX - sumX * sumXY) / denominator
    const b = (n * sumXY - sumX * sumY) / denominator

    // Convert back: R₀ = e^a, k = -b
    const R0 = Math.exp(a)
    const k = -b

    // Sanity checks
    const finalR0 = Math.max(0.5, Math.min(1.0, R0)) // R0 should be 0.5-1.0
    const finalK = Math.max(0.05, Math.min(0.5, k)) // k should be 0.05-0.5 (1-14 day half-life)

    return { R0: finalR0, k: finalK }
  }

  /**
   * Calculate deviation from standard Ebbinghaus curve
   *
   * @param k - User's decay constant
   * @param halfLife - User's half-life in days
   * @returns Human-readable deviation description
   */
  private static calculateDeviation(k: number, halfLife: number): string {
    const standardHalfLife = Math.log(2) / EBBINGHAUS_K
    const percentDiff = ((halfLife - standardHalfLife) / standardHalfLife) * 100

    if (k > EBBINGHAUS_K * 1.1) {
      // Faster decay
      return `${Math.abs(percentDiff).toFixed(0)}% faster than average (shorter half-life)`
    } else if (k < EBBINGHAUS_K * 0.9) {
      // Slower decay
      return `${Math.abs(percentDiff).toFixed(0)}% slower than average (longer half-life)`
    } else {
      return 'Similar to average forgetting curve'
    }
  }
}

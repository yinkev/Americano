/**
 * Story 5.2: Predictive Analytics for Learning Struggles
 * Task 7: Prediction Accuracy Tracking & Model Improvement
 *
 * Tracks prediction accuracy, analyzes error patterns, and generates
 * model improvement recommendations based on actual outcomes.
 *
 * Key Metrics:
 * - Accuracy: (TP + TN) / Total
 * - Precision: TP / (TP + FP) - How many predicted struggles were real
 * - Recall: TP / (TP + FN) - How many real struggles were caught
 * - F1-score: Harmonic mean of precision and recall
 * - Calibration: Predicted probability vs. actual struggle rate per bin
 *
 * Outcome Capture Logic:
 * - After user completes predicted topic, analyze:
 *   - Session score <65% OR 3+ AGAIN ratings OR validation score <60% = struggle
 *   - Update StrugglePrediction.actualOutcome and predictionStatus
 *   - Automatic capture (no user action needed)
 *   - Manual correction allowed (user can override)
 */

import { prisma } from '@/lib/db'
import {
  StrugglePrediction,
  PredictionStatus,
  FeedbackType,
  ReviewRating,
  StudySession,
} from '@/generated/prisma'
import { subDays, subWeeks, subMonths, differenceInDays } from 'date-fns'
import type { FeatureVector } from '@/types/prisma-json'

// use singleton prisma
const prismaInstance = prisma

/**
 * Accuracy metrics for model performance evaluation
 */
export interface AccuracyMetrics {
  // Core metrics
  accuracy: number // (TP + TN) / Total
  precision: number // TP / (TP + FP) - Quality of positive predictions
  recall: number // TP / (TP + FN) - Coverage of actual positives
  f1Score: number // Harmonic mean of precision and recall

  // Calibration metrics
  calibration: CalibrationMetrics

  // Confusion matrix
  confusionMatrix: {
    truePositives: number // Predicted struggle, did struggle
    falsePositives: number // Predicted struggle, didn't struggle
    trueNegatives: number // Predicted no struggle, didn't struggle
    falseNegatives: number // Predicted no struggle, did struggle
  }

  // Sample statistics
  sampleSize: number
  predictionCount: number
  outcomesCaptured: number

  // Timeframe info
  timeframe: 'week' | 'month' | 'all'
  startDate: Date
  endDate: Date
  lastUpdated: Date
}

/**
 * Calibration analysis (predicted probability vs. actual rate)
 */
export interface CalibrationMetrics {
  calibrationScore: number // 0-1, 1 = perfect calibration
  bins: CalibrationBin[] // Probability bins with actual vs predicted rates
  brier: number // Brier score (lower is better, 0-1)
}

/**
 * Single calibration bin
 */
export interface CalibrationBin {
  binRange: string // e.g., "0.5-0.6"
  predictedProbability: number // Average predicted probability in bin
  actualRate: number // Actual struggle rate in bin
  count: number // Number of predictions in bin
  calibrationError: number // |predicted - actual|
}

/**
 * Error pattern analysis results
 */
export interface ErrorAnalysis {
  // False positive patterns
  falsePositivePatterns: ErrorPattern[]
  falsePositiveRate: number

  // False negative patterns
  falseNegativePatterns: ErrorPattern[]
  falseNegativeRate: number

  // Feature-level insights
  featureErrorAnalysis: FeatureErrorInsight[]

  // Timing patterns
  timingPatterns: {
    morningErrorRate: number // 6am-12pm
    afternoonErrorRate: number // 12pm-6pm
    eveningErrorRate: number // 6pm-12am
  }

  // Topic area patterns
  topicErrorRates: Array<{
    topicId: string
    topicName: string
    errorRate: number
    falsePositiveRate: number
    falseNegativeRate: number
  }>

  analyzedAt: Date
}

/**
 * Specific error pattern detected
 */
export interface ErrorPattern {
  pattern: string // Human-readable pattern description
  frequency: number // How often this pattern occurs (0-1)
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  affectedPredictions: number // Count of predictions with this pattern
  examples: Array<{
    predictionId: string
    objectiveName: string
    predictedProbability: number
    actualOutcome: boolean
  }>
  suggestedFix: string // Recommended action
}

/**
 * Feature-level error insight
 */
export interface FeatureErrorInsight {
  featureName: string
  falsePositiveContribution: number // How much this feature contributes to FP
  falseNegativeContribution: number // How much this feature contributes to FN
  currentWeight: number
  suggestedWeight: number
  confidenceInSuggestion: number // 0-1
}

/**
 * Model improvement recommendations
 */
export interface ImprovementRecommendations {
  // Overall status
  currentAccuracy: number
  targetAccuracy: number // 0.75 minimum
  needsRetraining: boolean
  lastRetrained?: Date

  // Specific recommendations
  recommendations: Recommendation[]

  // Feature engineering suggestions
  featureEngineeringSuggestions: FeatureSuggestion[]

  // Data collection enhancements
  dataCollectionSuggestions: DataCollectionSuggestion[]

  // Model architecture changes
  architectureSuggestions: ArchitectureSuggestion[]

  // Retraining schedule
  retrainingSchedule: {
    recommended: boolean
    reason: string
    estimatedImprovement: number // Expected accuracy gain
    requiredDataPoints: number
    currentDataPoints: number
  }

  generatedAt: Date
}

/**
 * Single improvement recommendation
 */
export interface Recommendation {
  id: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'FEATURE' | 'DATA' | 'ARCHITECTURE' | 'THRESHOLD'
  title: string
  description: string
  expectedImpact: string
  implementationComplexity: 'LOW' | 'MEDIUM' | 'HIGH'
  actionItems: string[]
}

/**
 * Feature engineering suggestion
 */
export interface FeatureSuggestion {
  type: 'ADD' | 'REMOVE' | 'MODIFY' | 'RECALIBRATE'
  featureName: string
  reasoning: string
  expectedImpact: number // 0-1, expected accuracy improvement
  implementation: string
}

/**
 * Data collection suggestion
 */
export interface DataCollectionSuggestion {
  dataType: string
  reasoning: string
  collectionMethod: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

/**
 * Architecture change suggestion
 */
export interface ArchitectureSuggestion {
  component: 'MODEL' | 'FEATURES' | 'THRESHOLDS' | 'CALIBRATION'
  suggestion: string
  reasoning: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
}

export class PredictionAccuracyTracker {
  /**
   * Record the actual outcome after user completes predicted topic
   *
   * Automatic outcome capture logic:
   * - Session score <65% = struggle
   * - 3+ AGAIN ratings = struggle
   * - Validation score <60% = struggle
   */
  async recordActualOutcome(
    predictionId: string,
    actualStruggle: boolean,
    sessionId?: string,
    manualOverride: boolean = false,
  ): Promise<void> {
    const prediction = await prisma.strugglePrediction.findUnique({
      where: { id: predictionId },
      include: {
        learningObjective: true,
      },
    })

    if (!prediction) {
      throw new Error(`Prediction ${predictionId} not found`)
    }

    // Determine prediction status
    let predictionStatus: PredictionStatus
    const predictedStruggle = prediction.predictedStruggleProbability > 0.5

    if (predictedStruggle && actualStruggle) {
      predictionStatus = PredictionStatus.CONFIRMED // True positive
    } else if (predictedStruggle && !actualStruggle) {
      predictionStatus = PredictionStatus.FALSE_POSITIVE // False positive
    } else if (!predictedStruggle && actualStruggle) {
      predictionStatus = PredictionStatus.MISSED // False negative
    } else {
      // Predicted no struggle, didn't struggle (true negative)
      // Note: We typically don't create predictions for low-probability cases
      // So this is rare, but we'll mark it as CONFIRMED (correct prediction)
      predictionStatus = PredictionStatus.CONFIRMED
    }

    // Update prediction record
    await prisma.strugglePrediction.update({
      where: { id: predictionId },
      data: {
        actualOutcome: actualStruggle,
        actualOutcomeRecordedAt: new Date(),
        predictionStatus,
      },
    })

    // Note: PredictionFeedback model removed from schema
    // Manual override tracking can be logged separately if needed
    if (manualOverride) {
      console.log(`Manual outcome override for prediction ${predictionId}: ${actualStruggle}`)
    }

    // Check if model accuracy has dropped below threshold
    const currentMetrics = await this.calculateModelAccuracy('month')

    if (currentMetrics.accuracy < 0.75 && currentMetrics.sampleSize > 30) {
      console.log(
        `[PredictionAccuracyTracker] Model accuracy below threshold: ${currentMetrics.accuracy.toFixed(2)}`,
      )
      console.log(`[PredictionAccuracyTracker] Retraining recommended`)

      // TODO: Trigger automatic retraining workflow
      // For MVP, this is logged; post-MVP will trigger actual retraining
    }
  }

  /**
   * Automatically capture outcome from completed study session
   *
   * Struggle criteria:
   * - Session score <65% OR
   * - 3+ AGAIN ratings OR
   * - Validation score <60%
   */
  async captureOutcomeFromSession(sessionId: string, objectiveId: string): Promise<void> {
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        reviews: {
          include: {
            card: {
              include: {
                objective: true,
              },
            },
          },
        },
        validationResponses: true,
      },
    })

    if (!session || !session.completedAt) {
      return // Session not completed yet
    }

    // Find active prediction for this objective
    const prediction = await prisma.strugglePrediction.findFirst({
      where: {
        userId: session.userId,
        learningObjectiveId: objectiveId,
        predictionStatus: PredictionStatus.PENDING,
      },
      orderBy: { predictionDate: 'desc' },
    })

    if (!prediction) {
      return // No active prediction for this objective
    }

    // Calculate session performance
    const objectiveReviews = session.reviews.filter((r) => r.card.objective?.id === objectiveId)

    if (objectiveReviews.length === 0) {
      return // No reviews for this objective
    }

    // Criterion 1: Session score <65%
    const goodReviews = objectiveReviews.filter(
      (r) => r.rating === ReviewRating.GOOD || r.rating === ReviewRating.EASY,
    ).length
    const sessionScore = goodReviews / objectiveReviews.length

    // Criterion 2: 3+ AGAIN ratings
    const againCount = objectiveReviews.filter((r) => r.rating === ReviewRating.AGAIN).length

    // Criterion 3: Validation score <60%
    const objectiveValidations = session.validationResponses.filter((v) => {
      // Match validation to objective based on conceptName
      // This is a simple heuristic; can be improved with better linking
      return true // For MVP, include all validations
    })

    let avgValidationScore = 0.7 // Default (neutral)
    if (objectiveValidations.length > 0) {
      avgValidationScore =
        objectiveValidations.reduce((sum, v) => sum + v.score, 0) / objectiveValidations.length
    }

    // Determine if user struggled
    const didStruggle = sessionScore < 0.65 || againCount >= 3 || avgValidationScore < 0.6

    // Record outcome
    await this.recordActualOutcome(
      prediction.id,
      didStruggle,
      sessionId,
      false, // Not a manual override
    )
  }

  /**
   * Calculate model accuracy metrics for a given timeframe
   */
  async calculateModelAccuracy(timeframe: 'week' | 'month' | 'all'): Promise<AccuracyMetrics> {
    // Determine date range
    let startDate: Date
    const endDate = new Date()

    switch (timeframe) {
      case 'week':
        startDate = subWeeks(endDate, 1)
        break
      case 'month':
        startDate = subMonths(endDate, 1)
        break
      case 'all':
        startDate = new Date(0) // Unix epoch
        break
    }

    // Get predictions with recorded outcomes
    const predictions = await prisma.strugglePrediction.findMany({
      where: {
        predictionDate: {
          gte: startDate,
          lte: endDate,
        },
        actualOutcome: {
          not: null,
        },
        predictionStatus: {
          not: PredictionStatus.PENDING,
        },
      },
      include: {
        learningObjective: {
          include: {
            lecture: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    })

    const sampleSize = predictions.length

    if (sampleSize === 0) {
      // No data, return default metrics
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        calibration: {
          calibrationScore: 0,
          bins: [],
          brier: 1,
        },
        confusionMatrix: {
          truePositives: 0,
          falsePositives: 0,
          trueNegatives: 0,
          falseNegatives: 0,
        },
        sampleSize: 0,
        predictionCount: 0,
        outcomesCaptured: 0,
        timeframe,
        startDate,
        endDate,
        lastUpdated: new Date(),
      }
    }

    // Calculate confusion matrix
    let truePositives = 0
    let falsePositives = 0
    let trueNegatives = 0
    let falseNegatives = 0

    for (const prediction of predictions) {
      const predictedStruggle = prediction.predictedStruggleProbability > 0.5
      const actualStruggle = prediction.actualOutcome === true

      if (predictedStruggle && actualStruggle) {
        truePositives++
      } else if (predictedStruggle && !actualStruggle) {
        falsePositives++
      } else if (!predictedStruggle && actualStruggle) {
        falseNegatives++
      } else {
        trueNegatives++
      }
    }

    // Calculate core metrics
    const accuracy = (truePositives + trueNegatives) / sampleSize
    const precision = truePositives > 0 ? truePositives / (truePositives + falsePositives) : 0
    const recall = truePositives > 0 ? truePositives / (truePositives + falseNegatives) : 0
    const f1Score =
      precision > 0 && recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

    // Calculate calibration metrics
    const calibration = this.calculateCalibration(predictions)

    // Get total prediction count (including pending)
    const totalPredictions = await prisma.strugglePrediction.count({
      where: {
        predictionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      calibration,
      confusionMatrix: {
        truePositives,
        falsePositives,
        trueNegatives,
        falseNegatives,
      },
      sampleSize,
      predictionCount: totalPredictions,
      outcomesCaptured: sampleSize,
      timeframe,
      startDate,
      endDate,
      lastUpdated: new Date(),
    }
  }

  /**
   * Calculate calibration metrics (predicted probability vs. actual rate)
   */
  private calculateCalibration(
    predictions: Array<StrugglePrediction & { actualOutcome: boolean | null }>,
  ): CalibrationMetrics {
    // Define probability bins
    const binRanges = [
      { min: 0.0, max: 0.5, label: '0.0-0.5' },
      { min: 0.5, max: 0.6, label: '0.5-0.6' },
      { min: 0.6, max: 0.7, label: '0.6-0.7' },
      { min: 0.7, max: 0.8, label: '0.7-0.8' },
      { min: 0.8, max: 0.9, label: '0.8-0.9' },
      { min: 0.9, max: 1.0, label: '0.9-1.0' },
    ]

    const bins: CalibrationBin[] = []
    let totalCalibrationError = 0
    let brierScore = 0

    for (const binRange of binRanges) {
      const binPredictions = predictions.filter(
        (p) =>
          p.predictedStruggleProbability >= binRange.min &&
          p.predictedStruggleProbability < binRange.max,
      )

      if (binPredictions.length === 0) {
        continue // Skip empty bins
      }

      const avgPredictedProbability =
        binPredictions.reduce((sum, p) => sum + p.predictedStruggleProbability, 0) /
        binPredictions.length

      const actualStruggles = binPredictions.filter((p) => p.actualOutcome === true).length
      const actualRate = actualStruggles / binPredictions.length

      const calibrationError = Math.abs(avgPredictedProbability - actualRate)
      totalCalibrationError += calibrationError * binPredictions.length

      bins.push({
        binRange: binRange.label,
        predictedProbability: avgPredictedProbability,
        actualRate,
        count: binPredictions.length,
        calibrationError,
      })
    }

    // Calculate Brier score (mean squared error of predictions)
    brierScore =
      predictions.reduce((sum, p) => {
        const actual = p.actualOutcome ? 1 : 0
        const predicted = p.predictedStruggleProbability
        return sum + Math.pow(predicted - actual, 2)
      }, 0) / predictions.length

    // Calibration score: 1 - normalized calibration error
    const calibrationScore = 1 - totalCalibrationError / predictions.length

    return {
      calibrationScore: Math.max(0, calibrationScore),
      bins,
      brier: brierScore,
    }
  }

  /**
   * Analyze error patterns to identify systematic prediction failures
   */
  async analyzeErrorPatterns(): Promise<ErrorAnalysis> {
    // Get all predictions with outcomes from last 3 months
    const predictions = await prisma.strugglePrediction.findMany({
      where: {
        predictionDate: {
          gte: subMonths(new Date(), 3),
        },
        actualOutcome: {
          not: null,
        },
      },
      include: {
        learningObjective: {
          include: {
            lecture: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    })

    if (predictions.length < 10) {
      // Not enough data for meaningful analysis
      return this.getDefaultErrorAnalysis()
    }

    // Separate false positives and false negatives
    const falsePositives = predictions.filter(
      (p) => p.predictionStatus === PredictionStatus.FALSE_POSITIVE,
    )
    const falseNegatives = predictions.filter((p) => p.predictionStatus === PredictionStatus.MISSED)

    const totalPredictions = predictions.length
    const falsePositiveRate = falsePositives.length / totalPredictions
    const falseNegativeRate = falseNegatives.length / totalPredictions

    // Analyze false positive patterns
    const falsePositivePatterns = await this.detectErrorPatterns(falsePositives, 'FALSE_POSITIVE')

    // Analyze false negative patterns
    const falseNegativePatterns = await this.detectErrorPatterns(falseNegatives, 'FALSE_NEGATIVE')

    // Analyze feature-level errors
    const featureErrorAnalysis = this.analyzeFeatureErrors(falsePositives, falseNegatives)

    // Analyze timing patterns
    const timingPatterns = this.analyzeTimingPatterns(predictions)

    // Analyze topic-level error rates
    const topicErrorRates = this.analyzeTopicErrorRates(predictions)

    return {
      falsePositivePatterns,
      falsePositiveRate,
      falseNegativePatterns,
      falseNegativeRate,
      featureErrorAnalysis,
      timingPatterns,
      topicErrorRates,
      analyzedAt: new Date(),
    }
  }

  /**
   * Detect specific error patterns in predictions
   */
  private async detectErrorPatterns(
    errorPredictions: Array<StrugglePrediction & { learningObjective: any }>,
    errorType: 'FALSE_POSITIVE' | 'FALSE_NEGATIVE',
  ): Promise<ErrorPattern[]> {
    const patterns: ErrorPattern[] = []

    if (errorPredictions.length === 0) {
      return patterns
    }

    // Pattern 1: Over-reliance on historical struggles
    const historicalStruggleErrors = errorPredictions.filter((p) => {
      const features = p.featureVector as unknown as FeatureVector | null
      return (features?.historicalPerformance ?? 0) > 0.7
    })

    if (historicalStruggleErrors.length / errorPredictions.length > 0.4) {
      patterns.push({
        pattern:
          errorType === 'FALSE_POSITIVE'
            ? 'Over-predicting struggles based on past performance'
            : 'Under-weighting historical struggle patterns',
        frequency: historicalStruggleErrors.length / errorPredictions.length,
        severity: historicalStruggleErrors.length > 5 ? 'HIGH' : 'MEDIUM',
        affectedPredictions: historicalStruggleErrors.length,
        examples: historicalStruggleErrors.slice(0, 3).map((p) => ({
          predictionId: p.id,
          objectiveName: p.learningObjective?.objective || 'Unknown',
          predictedProbability: p.predictedStruggleProbability,
          actualOutcome: p.actualOutcome || false,
        })),
        suggestedFix:
          errorType === 'FALSE_POSITIVE'
            ? 'Reduce weight of historicalStruggleScore feature by 30%'
            : 'Increase weight of historicalStruggleScore feature by 20%',
      })
    }

    // Pattern 2: Complexity mismatch errors
    const complexityErrors = errorPredictions.filter((p) => {
      const features = p.featureVector as unknown as FeatureVector | null
      return (features?.complexityMismatch ?? 0) > 0.6
    })

    if (complexityErrors.length / errorPredictions.length > 0.3) {
      patterns.push({
        pattern:
          errorType === 'FALSE_POSITIVE'
            ? 'Over-estimating impact of content complexity'
            : 'Under-estimating user ability to handle complex content',
        frequency: complexityErrors.length / errorPredictions.length,
        severity: 'MEDIUM',
        affectedPredictions: complexityErrors.length,
        examples: complexityErrors.slice(0, 3).map((p) => ({
          predictionId: p.id,
          objectiveName: p.learningObjective?.objective || 'Unknown',
          predictedProbability: p.predictedStruggleProbability,
          actualOutcome: p.actualOutcome || false,
        })),
        suggestedFix:
          errorType === 'FALSE_POSITIVE'
            ? 'Recalibrate complexityMismatch threshold from 0.6 to 0.7'
            : 'Add user progression rate as additional feature',
      })
    }

    // Pattern 3: Prerequisite gap errors
    const prerequisiteErrors = errorPredictions.filter((p) => {
      const features = p.featureVector as unknown as FeatureVector | null
      return (features?.prerequisiteGap ?? 0) > 0.5
    })

    if (prerequisiteErrors.length / errorPredictions.length > 0.35) {
      patterns.push({
        pattern:
          errorType === 'FALSE_POSITIVE'
            ? 'Overestimating importance of prerequisite gaps'
            : 'Missing prerequisite dependencies',
        frequency: prerequisiteErrors.length / errorPredictions.length,
        severity: 'HIGH',
        affectedPredictions: prerequisiteErrors.length,
        examples: prerequisiteErrors.slice(0, 3).map((p) => ({
          predictionId: p.id,
          objectiveName: p.learningObjective?.objective || 'Unknown',
          predictedProbability: p.predictedStruggleProbability,
          actualOutcome: p.actualOutcome || false,
        })),
        suggestedFix:
          errorType === 'FALSE_POSITIVE'
            ? 'Improve prerequisite relationship detection accuracy'
            : 'Add semantic similarity-based prerequisite detection',
      })
    }

    return patterns
  }

  /**
   * Analyze feature-level contributions to errors
   */
  private analyzeFeatureErrors(
    falsePositives: StrugglePrediction[],
    falseNegatives: StrugglePrediction[],
  ): FeatureErrorInsight[] {
    const insights: FeatureErrorInsight[] = []

    // Define features to analyze
    const featureNames = [
      'retentionScore',
      'prerequisiteGapCount',
      'complexityMismatch',
      'historicalStruggleScore',
      'contentTypeMismatch',
      'cognitiveLoadIndicator',
    ]

    for (const featureName of featureNames) {
      // Calculate average feature value in false positives
      const fpValues = falsePositives
        .map((p) => {
          const features = p.featureVector as unknown as FeatureVector | null
          return features?.[featureName as keyof FeatureVector]
        })
        .filter((v): v is number => v !== undefined && v !== null)
      const fpAvg =
        fpValues.length > 0 ? fpValues.reduce((sum, v) => sum + v, 0) / fpValues.length : 0.5

      // Calculate average feature value in false negatives
      const fnValues = falseNegatives
        .map((p) => {
          const features = p.featureVector as unknown as FeatureVector | null
          return features?.[featureName as keyof FeatureVector]
        })
        .filter((v): v is number => v !== undefined && v !== null)
      const fnAvg =
        fnValues.length > 0 ? fnValues.reduce((sum, v) => sum + v, 0) / fnValues.length : 0.5

      // Current weight (from MVP rule-based model)
      const currentWeights: Record<string, number> = {
        retentionScore: 0.3,
        prerequisiteGapCount: 0.3,
        complexityMismatch: 0.2,
        historicalStruggleScore: 0.2,
        contentTypeMismatch: 0.1,
        cognitiveLoadIndicator: 0.1,
      }

      const currentWeight = currentWeights[featureName] || 0.1

      // Suggest weight adjustment based on error patterns
      let suggestedWeight = currentWeight
      let confidenceInSuggestion = 0.5

      if (fpAvg > 0.7) {
        // Feature is high in false positives - reduce weight
        suggestedWeight = currentWeight * 0.8
        confidenceInSuggestion = Math.min(1.0, fpValues.length / 20)
      } else if (fnAvg > 0.7) {
        // Feature is high in false negatives - increase weight
        suggestedWeight = currentWeight * 1.2
        confidenceInSuggestion = Math.min(1.0, fnValues.length / 20)
      }

      insights.push({
        featureName,
        falsePositiveContribution: fpAvg,
        falseNegativeContribution: fnAvg,
        currentWeight,
        suggestedWeight: Math.min(1.0, suggestedWeight),
        confidenceInSuggestion,
      })
    }

    return insights
  }

  /**
   * Analyze timing patterns in prediction errors
   */
  private analyzeTimingPatterns(predictions: StrugglePrediction[]): {
    morningErrorRate: number
    afternoonErrorRate: number
    eveningErrorRate: number
  } {
    const morningPredictions = predictions.filter((p) => {
      const hour = p.predictionDate.getHours()
      return hour >= 6 && hour < 12
    })

    const afternoonPredictions = predictions.filter((p) => {
      const hour = p.predictionDate.getHours()
      return hour >= 12 && hour < 18
    })

    const eveningPredictions = predictions.filter((p) => {
      const hour = p.predictionDate.getHours()
      return hour >= 18 || hour < 6
    })

    const calculateErrorRate = (preds: StrugglePrediction[]) => {
      if (preds.length === 0) return 0
      const errors = preds.filter(
        (p) =>
          p.predictionStatus === PredictionStatus.FALSE_POSITIVE ||
          p.predictionStatus === PredictionStatus.MISSED,
      ).length
      return errors / preds.length
    }

    return {
      morningErrorRate: calculateErrorRate(morningPredictions),
      afternoonErrorRate: calculateErrorRate(afternoonPredictions),
      eveningErrorRate: calculateErrorRate(eveningPredictions),
    }
  }

  /**
   * Analyze error rates by topic area
   */
  private analyzeTopicErrorRates(
    predictions: Array<StrugglePrediction & { learningObjective: any }>,
  ): Array<{
    topicId: string
    topicName: string
    errorRate: number
    falsePositiveRate: number
    falseNegativeRate: number
  }> {
    // Group predictions by topic (courseId)
    const topicGroups = new Map<string, typeof predictions>()

    for (const prediction of predictions) {
      const topicId = prediction.topicId || 'unknown'
      if (!topicGroups.has(topicId)) {
        topicGroups.set(topicId, [])
      }
      topicGroups.get(topicId)!.push(prediction)
    }

    const topicErrorRates = []

    for (const [topicId, topicPredictions] of topicGroups.entries()) {
      if (topicPredictions.length < 5) continue // Skip topics with too few predictions

      const errors = topicPredictions.filter(
        (p) =>
          p.predictionStatus === PredictionStatus.FALSE_POSITIVE ||
          p.predictionStatus === PredictionStatus.MISSED,
      )
      const falsePositives = topicPredictions.filter(
        (p) => p.predictionStatus === PredictionStatus.FALSE_POSITIVE,
      )
      const falseNegatives = topicPredictions.filter(
        (p) => p.predictionStatus === PredictionStatus.MISSED,
      )

      const topicName = topicPredictions[0]?.learningObjective?.lecture?.course?.name || 'Unknown'

      topicErrorRates.push({
        topicId,
        topicName,
        errorRate: errors.length / topicPredictions.length,
        falsePositiveRate: falsePositives.length / topicPredictions.length,
        falseNegativeRate: falseNegatives.length / topicPredictions.length,
      })
    }

    return topicErrorRates.sort((a, b) => b.errorRate - a.errorRate)
  }

  /**
   * Generate comprehensive model improvement recommendations
   */
  async generateModelImprovementPlan(): Promise<ImprovementRecommendations> {
    // Get current accuracy metrics
    const currentMetrics = await this.calculateModelAccuracy('month')
    const errorAnalysis = await this.analyzeErrorPatterns()

    const targetAccuracy = 0.75
    const needsRetraining =
      currentMetrics.accuracy < targetAccuracy && currentMetrics.sampleSize >= 30

    const recommendations: Recommendation[] = []
    const featureSuggestions: FeatureSuggestion[] = []
    const dataCollectionSuggestions: DataCollectionSuggestion[] = []
    const architectureSuggestions: ArchitectureSuggestion[] = []

    // Critical recommendation: Retrain if accuracy is low
    if (needsRetraining) {
      recommendations.push({
        id: 'retrain-model',
        priority: 'CRITICAL',
        category: 'ARCHITECTURE',
        title: 'Model Retraining Required',
        description: `Current accuracy (${(currentMetrics.accuracy * 100).toFixed(1)}%) is below target (${(targetAccuracy * 100).toFixed(0)}%). Model needs retraining with recent feedback data.`,
        expectedImpact: 'Accuracy improvement of 5-10%',
        implementationComplexity: 'MEDIUM',
        actionItems: [
          'Collect all predictions with outcomes from last 3 months',
          'Train logistic regression model with new data',
          'Evaluate on held-out test set',
          'Deploy new model if accuracy improves',
        ],
      })
    }

    // Feature engineering recommendations
    for (const insight of errorAnalysis.featureErrorAnalysis) {
      if (
        Math.abs(insight.currentWeight - insight.suggestedWeight) > 0.05 &&
        insight.confidenceInSuggestion > 0.6
      ) {
        const type = insight.suggestedWeight > insight.currentWeight ? 'RECALIBRATE' : 'RECALIBRATE'
        const direction = insight.suggestedWeight > insight.currentWeight ? 'increase' : 'decrease'

        featureSuggestions.push({
          type,
          featureName: insight.featureName,
          reasoning: `Feature contributes to ${insight.falsePositiveContribution > insight.falseNegativeContribution ? 'false positives' : 'false negatives'}. Suggest ${direction} weight.`,
          expectedImpact: 0.02, // 2% improvement per feature
          implementation: `Update ${insight.featureName} weight from ${insight.currentWeight.toFixed(2)} to ${insight.suggestedWeight.toFixed(2)}`,
        })
      }
    }

    // High-priority feature suggestions
    if (featureSuggestions.length > 0) {
      recommendations.push({
        id: 'recalibrate-features',
        priority: 'HIGH',
        category: 'FEATURE',
        title: 'Recalibrate Feature Weights',
        description: `${featureSuggestions.length} features need weight adjustment based on error analysis`,
        expectedImpact: `Estimated ${(featureSuggestions.length * 2).toFixed(0)}% accuracy improvement`,
        implementationComplexity: 'LOW',
        actionItems: featureSuggestions.map((s) => s.implementation),
      })
    }

    // Error pattern recommendations
    for (const pattern of [
      ...errorAnalysis.falsePositivePatterns,
      ...errorAnalysis.falseNegativePatterns,
    ]) {
      if (pattern.severity === 'HIGH') {
        recommendations.push({
          id: `fix-${pattern.pattern.toLowerCase().replace(/\s+/g, '-')}`,
          priority: 'HIGH',
          category: 'FEATURE',
          title: `Address: ${pattern.pattern}`,
          description: `Affecting ${pattern.affectedPredictions} predictions (${(pattern.frequency * 100).toFixed(1)}% of errors)`,
          expectedImpact: `Reduce error rate by ${(pattern.frequency * 100).toFixed(1)}%`,
          implementationComplexity: 'MEDIUM',
          actionItems: [pattern.suggestedFix],
        })
      }
    }

    // Data collection suggestions
    if (currentMetrics.sampleSize < 50) {
      dataCollectionSuggestions.push({
        dataType: 'Prediction outcomes',
        reasoning: `Only ${currentMetrics.sampleSize} outcomes recorded. Need 50+ for reliable model training.`,
        collectionMethod: 'Automatic outcome capture from completed sessions',
        priority: 'HIGH',
      })
    }

    if (currentMetrics.precision < 0.65) {
      dataCollectionSuggestions.push({
        dataType: 'User feedback on false positives',
        reasoning:
          'Precision is low - too many false positives. Need user feedback to understand why predictions are wrong.',
        collectionMethod: "Prompt user for feedback when predicted struggle doesn't occur",
        priority: 'MEDIUM',
      })
    }

    // Architecture suggestions
    if (currentMetrics.calibration.calibrationScore < 0.7) {
      architectureSuggestions.push({
        component: 'CALIBRATION',
        suggestion: 'Implement probability calibration using isotonic regression or Platt scaling',
        reasoning: `Calibration score is ${currentMetrics.calibration.calibrationScore.toFixed(2)} (target: >0.8). Predicted probabilities don't match actual rates.`,
        impact: 'HIGH',
      })
    }

    if (currentMetrics.recall < 0.7 && currentMetrics.sampleSize > 30) {
      architectureSuggestions.push({
        component: 'THRESHOLDS',
        suggestion: 'Lower prediction threshold from 0.5 to 0.4 to catch more struggles',
        reasoning: `Recall is ${(currentMetrics.recall * 100).toFixed(1)}% (target: >70%). Model is missing too many actual struggles.`,
        impact: 'MEDIUM',
      })
    }

    // Retraining schedule
    const retrainingSchedule = {
      recommended: needsRetraining,
      reason: needsRetraining
        ? `Accuracy (${(currentMetrics.accuracy * 100).toFixed(1)}%) below threshold (75%)`
        : `Accuracy (${(currentMetrics.accuracy * 100).toFixed(1)}%) meets target`,
      estimatedImprovement: needsRetraining ? 0.08 : 0.02, // 8% or 2% improvement
      requiredDataPoints: 50,
      currentDataPoints: currentMetrics.sampleSize,
    }

    return {
      currentAccuracy: currentMetrics.accuracy,
      targetAccuracy,
      needsRetraining,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }),
      featureEngineeringSuggestions: featureSuggestions,
      dataCollectionSuggestions,
      architectureSuggestions,
      retrainingSchedule,
      generatedAt: new Date(),
    }
  }

  /**
   * Get default error analysis when insufficient data
   */
  private getDefaultErrorAnalysis(): ErrorAnalysis {
    return {
      falsePositivePatterns: [],
      falsePositiveRate: 0,
      falseNegativePatterns: [],
      falseNegativeRate: 0,
      featureErrorAnalysis: [],
      timingPatterns: {
        morningErrorRate: 0,
        afternoonErrorRate: 0,
        eveningErrorRate: 0,
      },
      topicErrorRates: [],
      analyzedAt: new Date(),
    }
  }
}

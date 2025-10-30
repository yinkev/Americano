/**
 * Confidence Calibration Engine
 * Calculates calibration accuracy between student confidence and actual performance
 * Story 4.4: Metacognitive Assessment through Confidence Tracking
 */

/**
 * Normalize confidence scale (1-5) to performance scale (0-100)
 * Formula: (confidence - 1) * 25
 * Maps: 1→0, 2→25, 3→50, 4→75, 5→100
 */
export function normalizeConfidence(confidence: number): number {
  if (confidence < 1 || confidence > 5) {
    throw new Error('Confidence must be between 1 and 5')
  }
  return (confidence - 1) * 25
}

/**
 * Calibration categories based on confidence-performance delta
 */
export type CalibrationCategory = 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'CALIBRATED'

/**
 * Calibration result with detailed analysis
 */
export interface CalibrationResult {
  confidenceNormalized: number // 0-100
  calibrationDelta: number // confidence - score
  category: CalibrationCategory
  feedbackMessage: string
}

/**
 * Calculate calibration accuracy for a single assessment
 * @param confidence - User confidence level (1-5)
 * @param score - AI evaluation score (0-100)
 * @returns Calibration analysis
 */
export function calculateCalibration(confidence: number, score: number): CalibrationResult {
  if (confidence < 1 || confidence > 5) {
    throw new Error('Confidence must be between 1 and 5')
  }
  if (score < 0 || score > 100) {
    throw new Error('Score must be between 0 and 100')
  }

  const confidenceNormalized = normalizeConfidence(confidence)
  const calibrationDelta = confidenceNormalized - score

  let category: CalibrationCategory
  let feedbackMessage: string

  if (calibrationDelta > 15) {
    category = 'OVERCONFIDENT'
    feedbackMessage = `You felt ${confidenceNormalized}% confident but scored ${Math.round(score)}% - review areas where certainty exceeded accuracy.`
  } else if (calibrationDelta < -15) {
    category = 'UNDERCONFIDENT'
    feedbackMessage = `You felt ${confidenceNormalized}% confident but scored ${Math.round(score)}% - trust your understanding more!`
  } else {
    category = 'CALIBRATED'
    feedbackMessage = `Your confidence matches your performance - well calibrated!`
  }

  return {
    confidenceNormalized,
    calibrationDelta,
    category,
    feedbackMessage,
  }
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 * Measures confidence-performance relationship strength
 *
 * Uses exact Pearson's r formula as specified:
 * r = [n*Σ(xy) - Σx*Σy] / sqrt([n*Σx² - (Σx)²] * [n*Σy² - (Σy)²])
 *
 * @param confidenceArray - Normalized confidence values (0-100)
 * @param scoreArray - AI evaluation scores (0-100)
 * @returns Pearson's r correlation coefficient (-1 to 1), or null if insufficient data
 */
export function calculateCorrelation(
  confidenceArray: number[],
  scoreArray: number[],
): number | null {
  if (confidenceArray.length < 5) {
    return null // Insufficient data (minimum 5 samples required)
  }

  if (confidenceArray.length !== scoreArray.length) {
    throw new Error('Arrays must have equal length')
  }

  const n = confidenceArray.length

  // Calculate sums for Pearson's r formula
  // r = [n*Σ(xy) - Σx*Σy] / sqrt([n*Σx² - (Σx)²] * [n*Σy² - (Σy)²])
  const sumX = confidenceArray.reduce((sum, x) => sum + x, 0)
  const sumY = scoreArray.reduce((sum, y) => sum + y, 0)
  const sumXY = confidenceArray.reduce((sum, x, i) => sum + x * scoreArray[i], 0)
  const sumX2 = confidenceArray.reduce((sum, x) => sum + x * x, 0)
  const sumY2 = scoreArray.reduce((sum, y) => sum + y * y, 0)

  // Calculate numerator: n*Σ(xy) - Σx*Σy
  const numerator = n * sumXY - sumX * sumY

  // Calculate denominator: sqrt([n*Σx² - (Σx)²] * [n*Σy² - (Σy)²])
  const denominatorX = n * sumX2 - sumX * sumX
  const denominatorY = n * sumY2 - sumY * sumY
  const denominator = Math.sqrt(denominatorX * denominatorY)

  // Handle edge case: divide by zero (no variance in x or y)
  if (denominator === 0) {
    return 0 // No variance, correlation is 0
  }

  // Calculate Pearson's r
  const correlation = numerator / denominator

  // Clamp to [-1, 1] to handle floating point errors
  return Math.max(-1, Math.min(1, correlation))
}

/**
 * Interpret correlation coefficient strength
 * @param r - Pearson correlation coefficient
 * @returns Interpretation string
 */
export function interpretCorrelation(r: number | null): string {
  if (r === null) {
    return 'Insufficient data - complete at least 5 assessments to see calibration trends'
  }

  if (r >= 0.7) {
    return 'Strong calibration accuracy'
  } else if (r >= 0.4) {
    return 'Moderate calibration accuracy'
  } else {
    return 'Weak calibration accuracy - consider reviewing your confidence patterns'
  }
}

/**
 * Calculate calibration trend over two time periods
 * @param recentCorrelation - Correlation from recent period
 * @param priorCorrelation - Correlation from prior period
 * @returns Trend: "improving", "stable", or "declining"
 */
export function calculateTrend(
  recentCorrelation: number | null,
  priorCorrelation: number | null,
): 'improving' | 'stable' | 'declining' {
  if (recentCorrelation === null || priorCorrelation === null) {
    return 'stable' // Insufficient data
  }

  const difference = recentCorrelation - priorCorrelation
  const threshold = 0.05 // 0.05 change threshold

  if (difference > threshold) {
    return 'improving'
  } else if (difference < -threshold) {
    return 'declining'
  } else {
    return 'stable'
  }
}

/**
 * Generate trend message for user feedback
 * @param trend - Trend type
 * @returns Feedback message
 */
export function getTrendMessage(trend: 'improving' | 'stable' | 'declining'): string {
  switch (trend) {
    case 'improving':
      return 'Your calibration accuracy is improving - great progress!'
    case 'declining':
      return 'Your calibration accuracy is declining - take time to reflect on your confidence patterns'
    case 'stable':
    default:
      return 'Your calibration accuracy is stable'
  }
}

/**
 * Identify overconfident topics from assessment history
 * @param assessments - Array of assessment results with concept names
 * @param deltaThreshold - Delta threshold for overconfidence (default: 15)
 * @param minAssessments - Minimum assessments to flag a topic (default: 3)
 * @returns Array of topic names that show overconfidence patterns
 */
export function identifyOverconfidentTopics(
  assessments: Array<{ conceptName: string; calibrationDelta: number }>,
  deltaThreshold: number = 15,
  minAssessments: number = 3,
): string[] {
  const topicDeltas: Record<string, number[]> = {}

  // Group deltas by topic
  for (const assessment of assessments) {
    if (!topicDeltas[assessment.conceptName]) {
      topicDeltas[assessment.conceptName] = []
    }
    topicDeltas[assessment.conceptName].push(assessment.calibrationDelta)
  }

  // Identify overconfident topics
  const overconfidentTopics: string[] = []

  for (const [topic, deltas] of Object.entries(topicDeltas)) {
    if (deltas.length >= minAssessments) {
      const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
      if (avgDelta > deltaThreshold) {
        overconfidentTopics.push(topic)
      }
    }
  }

  return overconfidentTopics.sort((a, b) => {
    const avgDeltaA = topicDeltas[a].reduce((sum, d) => sum + d, 0) / topicDeltas[a].length
    const avgDeltaB = topicDeltas[b].reduce((sum, d) => sum + d, 0) / topicDeltas[b].length
    return avgDeltaB - avgDeltaA // Sort by highest delta first
  })
}

/**
 * Identify underconfident topics from assessment history
 * @param assessments - Array of assessment results with concept names
 * @param deltaThreshold - Delta threshold for underconfidence (default: -15)
 * @param minAssessments - Minimum assessments to flag a topic (default: 3)
 * @returns Array of topic names that show underconfidence patterns
 */
export function identifyUnderconfidentTopics(
  assessments: Array<{ conceptName: string; calibrationDelta: number }>,
  deltaThreshold: number = -15,
  minAssessments: number = 3,
): string[] {
  const topicDeltas: Record<string, number[]> = {}

  // Group deltas by topic
  for (const assessment of assessments) {
    if (!topicDeltas[assessment.conceptName]) {
      topicDeltas[assessment.conceptName] = []
    }
    topicDeltas[assessment.conceptName].push(assessment.calibrationDelta)
  }

  // Identify underconfident topics
  const underconfidentTopics: string[] = []

  for (const [topic, deltas] of Object.entries(topicDeltas)) {
    if (deltas.length >= minAssessments) {
      const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
      if (avgDelta < deltaThreshold) {
        underconfidentTopics.push(topic)
      }
    }
  }

  return underconfidentTopics.sort((a, b) => {
    const avgDeltaA = topicDeltas[a].reduce((sum, d) => sum + d, 0) / topicDeltas[a].length
    const avgDeltaB = topicDeltas[b].reduce((sum, d) => sum + d, 0) / topicDeltas[b].length
    return avgDeltaA - avgDeltaB // Sort by lowest delta first
  })
}

/**
 * Calculate mean absolute error of calibration deltas
 * Measures average magnitude of calibration errors
 * @param deltas - Array of calibration deltas
 * @returns Mean absolute error
 */
export function calculateMeanAbsoluteError(deltas: number[]): number {
  if (deltas.length === 0) {
    return 0
  }
  const sumAbsDeltas = deltas.reduce((sum, delta) => sum + Math.abs(delta), 0)
  return sumAbsDeltas / deltas.length
}

/**
 * Validate confidence-performance data before calculations
 * @param confidenceArray - Confidence values to validate
 * @param scoreArray - Score values to validate
 * @throws Error if validation fails
 */
export function validateCalibrationData(confidenceArray: number[], scoreArray: number[]): void {
  if (!Array.isArray(confidenceArray) || !Array.isArray(scoreArray)) {
    throw new Error('Both arguments must be arrays')
  }

  if (confidenceArray.length !== scoreArray.length) {
    throw new Error('Arrays must have equal length')
  }

  for (const conf of confidenceArray) {
    if (typeof conf !== 'number' || conf < 0 || conf > 100) {
      throw new Error('Confidence values must be numbers between 0 and 100')
    }
  }

  for (const score of scoreArray) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Score values must be numbers between 0 and 100')
    }
  }
}

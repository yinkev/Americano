/**
 * IRT Assessment Engine
 * Implements Item Response Theory (Rasch Model - 1PL) for adaptive testing
 * Story 4.5: Adaptive Questioning and Progressive Assessment
 *
 * Key Functions:
 * - estimateTheta: Newton-Raphson IRT estimation of student ability
 * - calculateConfidenceInterval: CI < 10 points = mastery verification ready
 * - shouldTerminateEarly: Early stopping when CI converges
 * - calculateDiscriminationIndex: Item quality measurement
 * - logisticFunction: Rasch 1PL probability model
 *
 * Performance Requirements:
 * - IRT calculation < 500ms (typically 3-5 iterations)
 * - Newton-Raphson convergence tolerance: 0.01
 * - Maximum 10 iterations to prevent infinite loops
 */

/**
 * Response data for IRT calculation
 */
export interface IRTResponse {
  itemDifficulty: number // beta parameter (0-100 scale, normalized to -3 to +3 for IRT)
  correct: boolean // 1 if correct, 0 if incorrect
  discriminationIndex?: number // Optional, for future 2PL/3PL models
}

/**
 * IRT estimation result
 */
export interface IRTEstimationResult {
  theta: number // Ability estimate (-3 to +3, typical IRT scale)
  standardError: number // Standard error of theta estimate
  confidenceInterval: number // 95% CI width in points (0-100 scale)
  iterations: number // Number of Newton-Raphson iterations
  converged: boolean // Whether estimation converged
}

/**
 * Discrimination index calculation result
 */
export interface DiscriminationResult {
  discriminationIndex: number // D = (% correct top 27%) - (% correct bottom 27%)
  topGroupCorrectRate: number // Percentage (0-1)
  bottomGroupCorrectRate: number // Percentage (0-1)
  sampleSize: number // Number of responses used
  isStatisticallyValid: boolean // True if sample size >= 20
}

/**
 * Early termination criteria result
 */
export interface EarlyStoppingResult {
  shouldStop: boolean // True if ready to terminate
  reason: string // Human-readable reason
  questionsAsked: number // Current question count
  confidenceInterval: number // Current CI width (0-100 scale)
  minimumQuestionsReached: boolean // True if >= 3 questions asked
}

/**
 * Normalize difficulty from 0-100 scale to IRT scale (-3 to +3)
 * Maps: 0 → -3, 50 → 0, 100 → +3
 * Formula: (difficulty - 50) / 50 * 3
 */
function normalizeDifficultyToIRT(difficulty: number): number {
  if (difficulty < 0 || difficulty > 100) {
    throw new Error('Difficulty must be between 0 and 100')
  }
  return ((difficulty - 50) / 50) * 3
}

/**
 * Denormalize theta from IRT scale (-3 to +3) to 0-100 scale
 * Maps: -3 → 0, 0 → 50, +3 → 100
 * Formula: (theta / 3 * 50) + 50
 */
function denormalizeThetaToPercentage(theta: number): number {
  return (theta / 3) * 50 + 50
}

/**
 * Denormalize confidence interval from IRT scale to 0-100 scale
 * CI in IRT scale is typically around 0.3-0.5 for 95% CI
 * We multiply by 50/3 to convert to percentage scale
 */
function denormalizeCI(ciIRT: number): number {
  return ciIRT * (50 / 3)
}

/**
 * Rasch model logistic function (1-parameter logistic - 1PL)
 * Calculates probability of correct response given ability and item difficulty
 *
 * Formula: P(correct) = exp(theta - beta) / (1 + exp(theta - beta))
 *
 * @param theta - Person ability parameter (IRT scale: -3 to +3)
 * @param difficulty - Item difficulty parameter (IRT scale: -3 to +3)
 * @returns Probability of correct response (0 to 1)
 */
export function logisticFunction(theta: number, difficulty: number): number {
  const exponent = theta - difficulty
  const expValue = Math.exp(exponent)
  return expValue / (1 + expValue)
}

/**
 * Calculate first derivative of log-likelihood (score function) for Newton-Raphson
 * Used to iteratively improve theta estimate
 *
 * @param theta - Current ability estimate
 * @param responses - Array of response data
 * @returns First derivative value
 */
function calculateFirstDerivative(theta: number, responses: IRTResponse[]): number {
  let derivative = 0

  for (const response of responses) {
    const beta = normalizeDifficultyToIRT(response.itemDifficulty)
    const probability = logisticFunction(theta, beta)
    const correct = response.correct ? 1 : 0

    // First derivative: Σ[correct - P(theta, beta)]
    derivative += correct - probability
  }

  return derivative
}

/**
 * Calculate second derivative of log-likelihood (information function) for Newton-Raphson
 * Used to estimate standard error and convergence
 *
 * @param theta - Current ability estimate
 * @param responses - Array of response data
 * @returns Second derivative value (negative information)
 */
function calculateSecondDerivative(theta: number, responses: IRTResponse[]): number {
  let derivative = 0

  for (const response of responses) {
    const beta = normalizeDifficultyToIRT(response.itemDifficulty)
    const probability = logisticFunction(theta, beta)

    // Second derivative: -Σ[P(theta, beta) * (1 - P(theta, beta))]
    derivative -= probability * (1 - probability)
  }

  return derivative
}

/**
 * Estimate student ability (theta) using Newton-Raphson maximum likelihood estimation
 * Implements Rasch model (1PL IRT) with convergence tolerance and iteration limits
 *
 * Algorithm:
 * 1. Initialize theta = 0 (average ability)
 * 2. Iterate: theta_new = theta_old - f'(theta) / f''(theta)
 * 3. Stop when |theta_new - theta_old| < tolerance or max iterations reached
 * 4. Calculate standard error: SE = sqrt(-1 / f''(theta))
 * 5. Calculate 95% CI: 1.96 * SE
 *
 * @param responses - Array of item responses with difficulty and correctness
 * @returns IRT estimation result with theta, SE, CI, iterations, and convergence status
 */
export function estimateTheta(responses: IRTResponse[]): IRTEstimationResult {
  if (responses.length === 0) {
    throw new Error('At least one response is required for IRT estimation')
  }

  // Validate responses
  for (const response of responses) {
    if (response.itemDifficulty < 0 || response.itemDifficulty > 100) {
      throw new Error('Item difficulty must be between 0 and 100')
    }
  }

  // Configuration
  const MAX_ITERATIONS = 10
  const CONVERGENCE_TOLERANCE = 0.01

  // Initialize theta at 0 (average ability)
  let theta = 0
  let iterations = 0
  let converged = false

  // Newton-Raphson iteration
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    iterations++

    const firstDerivative = calculateFirstDerivative(theta, responses)
    const secondDerivative = calculateSecondDerivative(theta, responses)

    // Prevent division by zero
    if (Math.abs(secondDerivative) < 1e-10) {
      // Information is too low, stop iteration
      break
    }

    // Newton-Raphson update: theta_new = theta_old - f'(theta) / f''(theta)
    const thetaNew = theta - firstDerivative / secondDerivative

    // Check convergence
    if (Math.abs(thetaNew - theta) < CONVERGENCE_TOLERANCE) {
      theta = thetaNew
      converged = true
      break
    }

    theta = thetaNew

    // Clamp theta to reasonable bounds (-5 to +5)
    theta = Math.max(-5, Math.min(5, theta))
  }

  // Calculate standard error: SE = sqrt(-1 / f''(theta))
  const information = -calculateSecondDerivative(theta, responses)
  const standardError = information > 0 ? Math.sqrt(1 / information) : 1.0

  // Calculate 95% confidence interval width (1.96 * SE)
  const confidenceIntervalIRT = 1.96 * standardError

  // Convert CI to 0-100 scale
  const confidenceInterval = denormalizeCI(confidenceIntervalIRT)

  return {
    theta,
    standardError,
    confidenceInterval,
    iterations,
    converged,
  }
}

/**
 * Calculate 95% confidence interval for theta estimate
 * CI < 10 points on 0-100 scale indicates mastery verification readiness
 *
 * @param theta - Ability estimate (IRT scale)
 * @param n - Number of responses (used for information calculation if needed)
 * @returns Confidence interval width in points (0-100 scale)
 */
export function calculateConfidenceInterval(theta: number, n: number): number {
  // For Rasch model, information is approximately n * P(1-P)
  // Assuming average P = 0.5 (optimal information point), information ≈ n * 0.25
  const information = n * 0.25

  // Standard error: SE = sqrt(1 / information)
  const standardError = information > 0 ? Math.sqrt(1 / information) : 1.0

  // 95% CI width: 1.96 * SE
  const confidenceIntervalIRT = 1.96 * standardError

  // Convert to 0-100 scale
  return denormalizeCI(confidenceIntervalIRT)
}

/**
 * Determine if assessment should terminate early based on IRT convergence
 * Early stopping criteria:
 * 1. Confidence interval < 10 points (high precision)
 * 2. At least 3 questions asked (minimum reliability)
 *
 * @param confidenceInterval - Current CI width (0-100 scale)
 * @param questionsAsked - Number of questions completed
 * @returns Early stopping result with decision and rationale
 */
export function shouldTerminateEarly(
  confidenceInterval: number,
  questionsAsked: number,
): EarlyStoppingResult {
  const CI_THRESHOLD = 10 // Points on 0-100 scale
  const MIN_QUESTIONS = 3 // Minimum questions for reliability

  const minimumQuestionsReached = questionsAsked >= MIN_QUESTIONS
  const confidencePrecise = confidenceInterval < CI_THRESHOLD

  let shouldStop = false
  let reason = ''

  if (minimumQuestionsReached && confidencePrecise) {
    shouldStop = true
    reason = `Assessment complete - knowledge level estimated with ${confidenceInterval.toFixed(1)} point confidence (< ${CI_THRESHOLD} threshold) after ${questionsAsked} questions`
  } else if (!minimumQuestionsReached) {
    reason = `Continue assessment - minimum ${MIN_QUESTIONS} questions required (currently ${questionsAsked})`
  } else if (!confidencePrecise) {
    reason = `Continue assessment - confidence interval ${confidenceInterval.toFixed(1)} points (target: < ${CI_THRESHOLD} points)`
  }

  return {
    shouldStop,
    reason,
    questionsAsked,
    confidenceInterval,
    minimumQuestionsReached,
  }
}

/**
 * Calculate discrimination index for item quality assessment
 * Measures how well an item differentiates between high and low ability students
 *
 * Formula: D = (% correct top 27%) - (% correct bottom 27%)
 *
 * Interpretation:
 * - D >= 0.4: Excellent discrimination
 * - D >= 0.3: Good discrimination
 * - D >= 0.2: Acceptable discrimination
 * - D < 0.2: Poor discrimination (flag for review)
 *
 * @param topScores - Array of top 27% student scores (0 or 1)
 * @param bottomScores - Array of bottom 27% student scores (0 or 1)
 * @returns Discrimination index result with D value, rates, and validity
 */
export function calculateDiscriminationIndex(
  topScores: number[],
  bottomScores: number[],
): DiscriminationResult {
  if (topScores.length === 0 || bottomScores.length === 0) {
    throw new Error('Both top and bottom score arrays must contain at least one value')
  }

  // Validate scores are binary (0 or 1)
  for (const score of [...topScores, ...bottomScores]) {
    if (score !== 0 && score !== 1) {
      throw new Error('Scores must be binary (0 or 1)')
    }
  }

  // Calculate correct rates
  const topCorrect = topScores.filter((s) => s === 1).length
  const bottomCorrect = bottomScores.filter((s) => s === 1).length

  const topGroupCorrectRate = topCorrect / topScores.length
  const bottomGroupCorrectRate = bottomCorrect / bottomScores.length

  // Discrimination index: D = top rate - bottom rate
  const discriminationIndex = topGroupCorrectRate - bottomGroupCorrectRate

  // Total sample size
  const sampleSize = topScores.length + bottomScores.length

  // Statistical validity check (minimum 20 responses recommended)
  const isStatisticallyValid = sampleSize >= 20

  return {
    discriminationIndex,
    topGroupCorrectRate,
    bottomGroupCorrectRate,
    sampleSize,
    isStatisticallyValid,
  }
}

/**
 * Interpret discrimination index value with qualitative category
 * @param D - Discrimination index value
 * @returns Interpretation string
 */
export function interpretDiscrimination(D: number): string {
  if (D >= 0.4) {
    return 'Excellent - item strongly differentiates high/low ability'
  } else if (D >= 0.3) {
    return 'Good - item effectively differentiates ability levels'
  } else if (D >= 0.2) {
    return 'Acceptable - item provides modest differentiation'
  } else if (D >= 0.1) {
    return 'Marginal - item weakly differentiates ability'
  } else {
    return 'Poor - item fails to differentiate ability (flag for review)'
  }
}

/**
 * Calculate efficiency gain from adaptive testing
 * Compares adaptive assessment (IRT-based) to traditional fixed-length test
 *
 * @param adaptiveQuestions - Number of questions asked in adaptive test
 * @param baselineQuestions - Number of questions in traditional test (default: 15)
 * @returns Efficiency metrics
 */
export function calculateEfficiencyGain(
  adaptiveQuestions: number,
  baselineQuestions: number = 15,
): {
  questionsAsked: number
  baselineQuestions: number
  questionsSaved: number
  efficiencyScore: number // Percentage improvement
  timeSaved: string // Human-readable estimate
} {
  if (adaptiveQuestions <= 0 || baselineQuestions <= 0) {
    throw new Error('Question counts must be positive')
  }

  const questionsSaved = Math.max(0, baselineQuestions - adaptiveQuestions)
  const efficiencyScore = (questionsSaved / baselineQuestions) * 100

  // Estimate time saved (assume 2 minutes per question)
  const minutesSaved = questionsSaved * 2
  const timeSaved = `${minutesSaved} minutes`

  return {
    questionsAsked: adaptiveQuestions,
    baselineQuestions,
    questionsSaved,
    efficiencyScore: Math.round(efficiencyScore),
    timeSaved,
  }
}

/**
 * Convert theta to human-readable knowledge level description
 * @param theta - Ability estimate (IRT scale: -3 to +3)
 * @returns Knowledge level description
 */
export function describeKnowledgeLevel(theta: number): string {
  if (theta >= 2.0) {
    return 'Expert - mastery demonstrated across all difficulty levels'
  } else if (theta >= 1.0) {
    return 'Advanced - strong understanding with few gaps'
  } else if (theta >= 0.0) {
    return 'Intermediate - solid foundation with room for growth'
  } else if (theta >= -1.0) {
    return 'Developing - basic understanding with significant gaps'
  } else {
    return 'Novice - foundational knowledge still developing'
  }
}

/**
 * Denormalize theta from IRT scale to 0-100 percentage scale
 * Exposed for external use (e.g., displaying ability scores)
 * @param theta - Ability estimate (IRT scale: -3 to +3)
 * @returns Ability as percentage (0-100)
 */
export function thetaToPercentage(theta: number): number {
  return denormalizeThetaToPercentage(theta)
}

/**
 * Validate IRT response data before calculations
 * @param responses - Array of responses to validate
 * @throws Error if validation fails
 */
export function validateIRTResponses(responses: IRTResponse[]): void {
  if (!Array.isArray(responses)) {
    throw new Error('Responses must be an array')
  }

  if (responses.length === 0) {
    throw new Error('At least one response is required')
  }

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i]

    if (typeof response.itemDifficulty !== 'number') {
      throw new Error(`Response ${i}: itemDifficulty must be a number`)
    }

    if (response.itemDifficulty < 0 || response.itemDifficulty > 100) {
      throw new Error(`Response ${i}: itemDifficulty must be between 0 and 100`)
    }

    if (typeof response.correct !== 'boolean') {
      throw new Error(`Response ${i}: correct must be a boolean`)
    }
  }
}

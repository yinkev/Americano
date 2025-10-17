/**
 * Item Response Theory (IRT) Assessment Engine
 *
 * Implements simplified Rasch model (1-parameter logistic) for efficient assessment.
 * Story 4.5 AC#7: Assessment Efficiency Optimization
 *
 * Features:
 * - Estimates knowledge level (theta) from 3-5 questions (vs 20+ traditional)
 * - Newton-Raphson iteration for theta estimation
 * - Early stopping when confidence interval < 10 points
 * - Maximum likelihood estimation with convergence tolerance 0.01
 *
 * Rasch Model:
 * P(correct) = exp(theta - beta) / (1 + exp(theta - beta))
 * where theta = person ability, beta = item difficulty
 */

export interface ResponseData {
  difficulty: number // Item difficulty (beta) on 0-100 scale
  correct: boolean // User response
  timeSpent?: number // Optional: response time in ms
}

export interface IrtEstimate {
  theta: number // Ability estimate on 0-100 scale (converted from logit)
  standardError: number // Standard error of theta estimate
  confidenceInterval: number // 95% CI width (±points)
  iterations: number // Number of Newton-Raphson iterations
  shouldStopEarly: boolean // Early stopping criterion met
}

export class IrtEngine {
  private readonly MAX_ITERATIONS = 10
  private readonly CONVERGENCE_TOLERANCE = 0.01
  private readonly EARLY_STOP_CI_THRESHOLD = 10 // Stop if CI < 10 points

  /**
   * Estimate knowledge level using Rasch model (1PL IRT)
   *
   * Uses Newton-Raphson algorithm to find maximum likelihood estimate of theta
   * Converts difficulty from 0-100 scale to logit scale for calculation
   *
   * @param responses Array of response data (difficulty, correct)
   * @returns IRT estimate with theta, SE, CI, and early stop signal
   */
  estimateKnowledgeLevel(responses: ResponseData[]): IrtEstimate {
    if (responses.length === 0) {
      throw new Error('At least one response required for IRT estimation')
    }

    // Convert difficulties from 0-100 scale to logit scale (-4 to +4)
    // 0 → -4 (very easy), 50 → 0 (medium), 100 → +4 (very hard)
    const betaLogit = responses.map((r) => this.scaleToLogit(r.difficulty))

    // Simplified initial theta estimate based on response pattern
    // Average the difficulties, weighted by correctness
    let thetaSum = 0
    for (let i = 0; i < responses.length; i++) {
      const beta = betaLogit[i]
      const correct = responses[i].correct
      // If correct on hard item: theta > beta
      // If wrong on easy item: theta < beta
      // If correct: add beta + 0.5, if wrong: add beta - 0.5
      thetaSum += correct ? beta + 0.5 : beta - 0.5
    }
    let theta = thetaSum / responses.length

    // Clamp initial theta to avoid extreme values
    theta = Math.max(-4, Math.min(4, theta))

    let iterations = 0
    let converged = false

    // Newton-Raphson iteration with safeguards
    for (iterations = 0; iterations < this.MAX_ITERATIONS; iterations++) {
      const { firstDerivative, secondDerivative } = this.logLikelihoodDerivatives(
        theta,
        betaLogit,
        responses
      )

      // Check second derivative for numerical stability
      if (Math.abs(secondDerivative) < 1e-8) {
        converged = true
        break
      }

      // Newton-Raphson update with damping to prevent overshooting
      const rawAdjustment = firstDerivative / Math.abs(secondDerivative)
      // Limit step size to prevent extreme moves
      const adjustment = Math.max(-1, Math.min(1, rawAdjustment))
      const newTheta = theta - adjustment

      // Check convergence
      if (Math.abs(adjustment) < this.CONVERGENCE_TOLERANCE) {
        converged = true
        theta = newTheta
        iterations++
        break
      }

      theta = newTheta
      // Clamp theta to stay in reasonable range
      theta = Math.max(-4, Math.min(4, theta))
    }

    // Calculate standard error: SE = 1 / sqrt(-f''(theta))
    const { secondDerivative } = this.logLikelihoodDerivatives(theta, betaLogit, responses)
    const seInverse = Math.abs(secondDerivative)
    let standardError = 1.0
    if (seInverse > 1e-8) {
      standardError = 1 / Math.sqrt(seInverse)
      // Clamp SE to reasonable values
      standardError = Math.max(0.1, Math.min(10, standardError))
    }

    // 95% confidence interval: ±1.96 * SE
    const ciLogit = 1.96 * standardError

    // Convert back to 0-100 scale
    const thetaScaled = this.logitToScale(theta)
    const ciScaled = Math.abs(this.logitToScale(theta + ciLogit) - thetaScaled)

    // Early stopping: CI < 10 points and at least 3 responses
    const shouldStopEarly = ciScaled < this.EARLY_STOP_CI_THRESHOLD && responses.length >= 3

    return {
      theta: Math.max(0, Math.min(100, thetaScaled)), // Clamp to 0-100
      standardError: Math.min(100, standardError),
      confidenceInterval: Math.min(100, ciScaled), // Cap CI at 100
      iterations,
      shouldStopEarly,
    }
  }

  /**
   * Calculate log-likelihood derivatives for Newton-Raphson
   *
   * First derivative: f'(theta) = Σ (y_i - P_i)
   * Second derivative: f''(theta) = -Σ P_i(1 - P_i)
   * where P_i = P(correct | theta, beta_i)
   */
  private logLikelihoodDerivatives(
    theta: number,
    betaLogit: number[],
    responses: ResponseData[]
  ): { firstDerivative: number; secondDerivative: number } {
    let firstDerivative = 0
    let secondDerivative = 0

    for (let i = 0; i < responses.length; i++) {
      const beta = betaLogit[i]
      const y = responses[i].correct ? 1 : 0

      // Rasch model probability
      const prob = this.raschProbability(theta, beta)

      firstDerivative += y - prob
      secondDerivative -= prob * (1 - prob)
    }

    return { firstDerivative, secondDerivative }
  }

  /**
   * Rasch model probability function
   *
   * P(correct | theta, beta) = exp(theta - beta) / (1 + exp(theta - beta))
   */
  private raschProbability(theta: number, beta: number): number {
    const exponent = theta - beta
    return Math.exp(exponent) / (1 + Math.exp(exponent))
  }

  /**
   * Convert proportion to logit scale
   *
   * logit(p) = ln(p / (1 - p))
   */
  private logit(p: number): number {
    return Math.log(p / (1 - p))
  }

  /**
   * Convert 0-100 scale to logit scale (-4 to +4)
   */
  private scaleToLogit(scale: number): number {
    return ((scale - 50) / 50) * 4 // 0 → -4, 50 → 0, 100 → +4
  }

  /**
   * Convert logit scale to 0-100 scale
   */
  private logitToScale(logit: number): number {
    return (logit / 4) * 50 + 50 // -4 → 0, 0 → 50, +4 → 100
  }

  /**
   * Calculate efficiency metrics for display
   *
   * Compares adaptive assessment to baseline (15 questions)
   */
  calculateEfficiencyMetrics(questionsAsked: number): {
    questionsAsked: number
    baselineQuestions: number
    questionsSaved: number
    timeSaved: number // Percentage
    efficiencyScore: number // 0-100
  } {
    const baselineQuestions = 15
    const questionsSaved = Math.max(0, baselineQuestions - questionsAsked)
    const timeSaved = Math.round((questionsSaved / baselineQuestions) * 100)
    const efficiencyScore = Math.min(100, Math.round((questionsSaved / baselineQuestions) * 100))

    return {
      questionsAsked,
      baselineQuestions,
      questionsSaved,
      timeSaved,
      efficiencyScore,
    }
  }
}

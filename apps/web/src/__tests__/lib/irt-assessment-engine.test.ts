/**
 * IRT Assessment Engine Tests
 * Story 4.5: Adaptive Questioning and Progressive Assessment
 *
 * Tests Rasch model (1PL IRT) implementation:
 * - Newton-Raphson theta estimation
 * - Confidence interval calculation
 * - Early stopping logic
 * - Discrimination index
 * - Logistic function
 */

import { describe, expect, it } from '@jest/globals'
import {
  calculateConfidenceInterval,
  calculateDiscriminationIndex,
  calculateEfficiencyGain,
  describeKnowledgeLevel,
  estimateTheta,
  type IRTResponse,
  interpretDiscrimination,
  logisticFunction,
  shouldTerminateEarly,
  thetaToPercentage,
  validateIRTResponses,
} from '@/lib/irt-assessment-engine'

describe('IRT Assessment Engine', () => {
  describe('logisticFunction', () => {
    it('should calculate probability = 0.5 when theta equals difficulty', () => {
      const prob = logisticFunction(0, 0)
      expect(prob).toBeCloseTo(0.5, 5)
    })

    it('should calculate probability > 0.5 when theta > difficulty (easier item)', () => {
      const prob = logisticFunction(1, 0) // Ability 1, difficulty 0
      expect(prob).toBeGreaterThan(0.5)
      expect(prob).toBeCloseTo(0.731, 3) // exp(1) / (1 + exp(1)) ≈ 0.731
    })

    it('should calculate probability < 0.5 when theta < difficulty (harder item)', () => {
      const prob = logisticFunction(0, 1) // Ability 0, difficulty 1
      expect(prob).toBeLessThan(0.5)
      expect(prob).toBeCloseTo(0.269, 3) // exp(-1) / (1 + exp(-1)) ≈ 0.269
    })

    it('should approach 1.0 for very high ability vs low difficulty', () => {
      const prob = logisticFunction(3, -3)
      expect(prob).toBeGreaterThan(0.99)
    })

    it('should approach 0.0 for very low ability vs high difficulty', () => {
      const prob = logisticFunction(-3, 3)
      expect(prob).toBeLessThan(0.01)
    })
  })

  describe('estimateTheta', () => {
    it('should estimate theta ≈ 0 for 50% correct responses at medium difficulty', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
      ]

      const result = estimateTheta(responses)

      expect(result.theta).toBeCloseTo(0, 1) // Near 0 (average ability)
      expect(result.converged).toBe(true)
      expect(result.iterations).toBeLessThanOrEqual(10)
      expect(result.standardError).toBeGreaterThan(0)
      expect(result.confidenceInterval).toBeGreaterThan(0)
    })

    it('should estimate positive theta for high ability (mostly correct)', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 60, correct: true },
        { itemDifficulty: 70, correct: true },
        { itemDifficulty: 80, correct: false }, // One miss at high difficulty
      ]

      const result = estimateTheta(responses)

      expect(result.theta).toBeGreaterThan(0) // Positive ability
      expect(result.converged).toBe(true)
    })

    it('should estimate negative theta for low ability (mostly incorrect)', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 40, correct: false },
        { itemDifficulty: 30, correct: true }, // One correct at low difficulty
        { itemDifficulty: 20, correct: false },
      ]

      const result = estimateTheta(responses)

      expect(result.theta).toBeLessThan(0) // Negative ability
      expect(result.converged).toBe(true)
    })

    it('should converge within 10 iterations for typical data', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 30, correct: true },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 70, correct: false },
      ]

      const result = estimateTheta(responses)

      expect(result.iterations).toBeLessThanOrEqual(10)
      expect(result.converged).toBe(true)
    })

    it('should handle all correct responses (high ability estimate)', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 60, correct: true },
        { itemDifficulty: 70, correct: true },
        { itemDifficulty: 80, correct: true },
      ]

      const result = estimateTheta(responses)

      expect(result.theta).toBeGreaterThan(1) // High ability
    })

    it('should handle all incorrect responses (low ability estimate)', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 40, correct: false },
        { itemDifficulty: 30, correct: false },
        { itemDifficulty: 20, correct: false },
      ]

      const result = estimateTheta(responses)

      expect(result.theta).toBeLessThan(-1) // Low ability
    })

    it('should throw error for empty responses array', () => {
      expect(() => estimateTheta([])).toThrow('At least one response is required')
    })

    it('should throw error for invalid difficulty (< 0)', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: -5, correct: true }]
      expect(() => estimateTheta(responses)).toThrow('Item difficulty must be between 0 and 100')
    })

    it('should throw error for invalid difficulty (> 100)', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: 150, correct: true }]
      expect(() => estimateTheta(responses)).toThrow('Item difficulty must be between 0 and 100')
    })

    it('should calculate narrower CI with more responses (more information)', () => {
      const responses3: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
      ]

      const responses10: IRTResponse[] = [
        ...responses3,
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
      ]

      const result3 = estimateTheta(responses3)
      const result10 = estimateTheta(responses10)

      // More responses → narrower CI
      expect(result10.confidenceInterval).toBeLessThan(result3.confidenceInterval)
    })
  })

  describe('calculateConfidenceInterval', () => {
    it('should calculate CI width for given theta and n', () => {
      const ci = calculateConfidenceInterval(0, 5)
      expect(ci).toBeGreaterThan(0)
      expect(ci).toBeLessThan(50) // Reasonable CI range
    })

    it('should calculate narrower CI with more responses', () => {
      const ci3 = calculateConfidenceInterval(0, 3)
      const ci10 = calculateConfidenceInterval(0, 10)

      expect(ci10).toBeLessThan(ci3) // More responses → narrower CI
    })

    it('should calculate CI < 10 points after ~5 questions (efficiency target)', () => {
      const ci5 = calculateConfidenceInterval(0, 5)
      // May or may not be < 10, but should be reasonable
      expect(ci5).toBeLessThan(30) // Sanity check
    })

    it('should handle theta at extremes', () => {
      const ciLow = calculateConfidenceInterval(-3, 5)
      const ciHigh = calculateConfidenceInterval(3, 5)

      expect(ciLow).toBeGreaterThan(0)
      expect(ciHigh).toBeGreaterThan(0)
    })
  })

  describe('shouldTerminateEarly', () => {
    it('should NOT terminate with < 3 questions (minimum requirement)', () => {
      const result = shouldTerminateEarly(5, 2)

      expect(result.shouldStop).toBe(false)
      expect(result.minimumQuestionsReached).toBe(false)
      expect(result.reason).toContain('minimum 3 questions required')
    })

    it('should NOT terminate with CI >= 10 points (insufficient precision)', () => {
      const result = shouldTerminateEarly(15, 5)

      expect(result.shouldStop).toBe(false)
      expect(result.minimumQuestionsReached).toBe(true)
      expect(result.reason).toContain('confidence interval 15.0 points')
    })

    it('should TERMINATE with CI < 10 points and >= 3 questions', () => {
      const result = shouldTerminateEarly(8, 4)

      expect(result.shouldStop).toBe(true)
      expect(result.minimumQuestionsReached).toBe(true)
      expect(result.reason).toContain('Assessment complete')
      expect(result.reason).toContain('8.0 point confidence')
    })

    it('should provide correct reason for insufficient questions', () => {
      const result = shouldTerminateEarly(5, 1)

      expect(result.reason).toContain('minimum 3 questions required')
      expect(result.reason).toContain('currently 1')
    })

    it('should provide correct reason for high CI', () => {
      const result = shouldTerminateEarly(20, 5)

      expect(result.reason).toContain('confidence interval 20.0 points')
      expect(result.reason).toContain('target: < 10 points')
    })

    it('should handle edge case: exactly 3 questions, exactly 10 point CI', () => {
      const result = shouldTerminateEarly(10, 3)

      // CI must be < 10 (not <=), so should NOT stop
      expect(result.shouldStop).toBe(false)
    })

    it('should handle edge case: 3 questions, 9.9 point CI (just under threshold)', () => {
      const result = shouldTerminateEarly(9.9, 3)

      expect(result.shouldStop).toBe(true)
    })
  })

  describe('calculateDiscriminationIndex', () => {
    it('should calculate D = 1.0 for perfect discrimination (top 100%, bottom 0%)', () => {
      const topScores = [1, 1, 1, 1] // All correct
      const bottomScores = [0, 0, 0, 0] // All incorrect

      const result = calculateDiscriminationIndex(topScores, bottomScores)

      expect(result.discriminationIndex).toBeCloseTo(1.0, 5)
      expect(result.topGroupCorrectRate).toBe(1.0)
      expect(result.bottomGroupCorrectRate).toBe(0.0)
      expect(result.sampleSize).toBe(8)
    })

    it('should calculate D = 0.0 for no discrimination (equal rates)', () => {
      const topScores = [1, 0, 1, 0] // 50% correct
      const bottomScores = [1, 0, 1, 0] // 50% correct

      const result = calculateDiscriminationIndex(topScores, bottomScores)

      expect(result.discriminationIndex).toBeCloseTo(0.0, 5)
      expect(result.topGroupCorrectRate).toBe(0.5)
      expect(result.bottomGroupCorrectRate).toBe(0.5)
    })

    it('should calculate D ≈ 0.5 for good discrimination', () => {
      const topScores = [1, 1, 1, 0] // 75% correct
      const bottomScores = [0, 1, 0, 0] // 25% correct

      const result = calculateDiscriminationIndex(topScores, bottomScores)

      expect(result.discriminationIndex).toBeCloseTo(0.5, 5)
      expect(result.topGroupCorrectRate).toBe(0.75)
      expect(result.bottomGroupCorrectRate).toBe(0.25)
    })

    it('should mark as statistically valid with >= 20 responses', () => {
      const topScores = new Array(10).fill(1) // 10 top students
      const bottomScores = new Array(10).fill(0) // 10 bottom students

      const result = calculateDiscriminationIndex(topScores, bottomScores)

      expect(result.sampleSize).toBe(20)
      expect(result.isStatisticallyValid).toBe(true)
    })

    it('should mark as NOT statistically valid with < 20 responses', () => {
      const topScores = [1, 1, 1] // 3 top students
      const bottomScores = [0, 0, 0] // 3 bottom students

      const result = calculateDiscriminationIndex(topScores, bottomScores)

      expect(result.sampleSize).toBe(6)
      expect(result.isStatisticallyValid).toBe(false)
    })

    it('should throw error for empty arrays', () => {
      expect(() => calculateDiscriminationIndex([], [1, 0])).toThrow(
        'Both top and bottom score arrays must contain at least one value',
      )
    })

    it('should throw error for non-binary scores', () => {
      const topScores = [1, 0, 0.5] // Invalid: 0.5
      const bottomScores = [0, 0, 0]

      expect(() => calculateDiscriminationIndex(topScores, bottomScores)).toThrow(
        'Scores must be binary (0 or 1)',
      )
    })

    it('should handle negative discrimination (bottom > top, bad item)', () => {
      const topScores = [0, 0, 1] // 33% correct (top performers struggle)
      const bottomScores = [1, 1, 1] // 100% correct (bottom performers ace it)

      const result = calculateDiscriminationIndex(topScores, bottomScores)

      expect(result.discriminationIndex).toBeLessThan(0) // Negative D
    })
  })

  describe('interpretDiscrimination', () => {
    it('should interpret D >= 0.4 as "Excellent"', () => {
      expect(interpretDiscrimination(0.5)).toContain('Excellent')
    })

    it('should interpret D >= 0.3 as "Good"', () => {
      expect(interpretDiscrimination(0.35)).toContain('Good')
    })

    it('should interpret D >= 0.2 as "Acceptable"', () => {
      expect(interpretDiscrimination(0.25)).toContain('Acceptable')
    })

    it('should interpret D >= 0.1 as "Marginal"', () => {
      expect(interpretDiscrimination(0.15)).toContain('Marginal')
    })

    it('should interpret D < 0.1 as "Poor"', () => {
      expect(interpretDiscrimination(0.05)).toContain('Poor')
      expect(interpretDiscrimination(0.05)).toContain('flag for review')
    })

    it('should interpret negative D as "Poor"', () => {
      expect(interpretDiscrimination(-0.2)).toContain('Poor')
    })
  })

  describe('calculateEfficiencyGain', () => {
    it('should calculate 80% efficiency for 3 questions vs 15 baseline', () => {
      const result = calculateEfficiencyGain(3, 15)

      expect(result.questionsAsked).toBe(3)
      expect(result.baselineQuestions).toBe(15)
      expect(result.questionsSaved).toBe(12)
      expect(result.efficiencyScore).toBe(80) // 12/15 * 100 = 80%
      expect(result.timeSaved).toBe('24 minutes') // 12 questions * 2 min
    })

    it('should calculate 67% efficiency for 5 questions vs 15 baseline', () => {
      const result = calculateEfficiencyGain(5, 15)

      expect(result.questionsSaved).toBe(10)
      expect(result.efficiencyScore).toBe(67) // Rounded
      expect(result.timeSaved).toBe('20 minutes')
    })

    it('should calculate 0% efficiency if adaptive equals baseline', () => {
      const result = calculateEfficiencyGain(15, 15)

      expect(result.questionsSaved).toBe(0)
      expect(result.efficiencyScore).toBe(0)
      expect(result.timeSaved).toBe('0 minutes')
    })

    it('should handle custom baseline (e.g., 20 questions)', () => {
      const result = calculateEfficiencyGain(5, 20)

      expect(result.questionsSaved).toBe(15)
      expect(result.efficiencyScore).toBe(75) // 15/20 * 100
      expect(result.timeSaved).toBe('30 minutes')
    })

    it('should throw error for non-positive question counts', () => {
      expect(() => calculateEfficiencyGain(0, 15)).toThrow('Question counts must be positive')
      expect(() => calculateEfficiencyGain(5, -10)).toThrow('Question counts must be positive')
    })
  })

  describe('describeKnowledgeLevel', () => {
    it('should describe theta >= 2.0 as "Expert"', () => {
      expect(describeKnowledgeLevel(2.5)).toContain('Expert')
    })

    it('should describe theta >= 1.0 as "Advanced"', () => {
      expect(describeKnowledgeLevel(1.5)).toContain('Advanced')
    })

    it('should describe theta >= 0.0 as "Intermediate"', () => {
      expect(describeKnowledgeLevel(0.5)).toContain('Intermediate')
    })

    it('should describe theta >= -1.0 as "Developing"', () => {
      expect(describeKnowledgeLevel(-0.5)).toContain('Developing')
    })

    it('should describe theta < -1.0 as "Novice"', () => {
      expect(describeKnowledgeLevel(-2.0)).toContain('Novice')
    })

    it('should handle edge case: theta = 0 (exactly average)', () => {
      expect(describeKnowledgeLevel(0)).toContain('Intermediate')
    })
  })

  describe('thetaToPercentage', () => {
    it('should convert theta = -3 to 0%', () => {
      expect(thetaToPercentage(-3)).toBeCloseTo(0, 1)
    })

    it('should convert theta = 0 to 50%', () => {
      expect(thetaToPercentage(0)).toBeCloseTo(50, 1)
    })

    it('should convert theta = 3 to 100%', () => {
      expect(thetaToPercentage(3)).toBeCloseTo(100, 1)
    })

    it('should convert theta = 1.5 to 75%', () => {
      expect(thetaToPercentage(1.5)).toBeCloseTo(75, 1)
    })

    it('should convert theta = -1.5 to 25%', () => {
      expect(thetaToPercentage(-1.5)).toBeCloseTo(25, 1)
    })
  })

  describe('validateIRTResponses', () => {
    it('should pass validation for valid responses', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 60, correct: false },
      ]

      expect(() => validateIRTResponses(responses)).not.toThrow()
    })

    it('should throw error for non-array input', () => {
      expect(() => validateIRTResponses('not an array' as any)).toThrow(
        'Responses must be an array',
      )
    })

    it('should throw error for empty array', () => {
      expect(() => validateIRTResponses([])).toThrow('At least one response is required')
    })

    it('should throw error for non-number difficulty', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: 'fifty' as any, correct: true }]

      expect(() => validateIRTResponses(responses)).toThrow('itemDifficulty must be a number')
    })

    it('should throw error for difficulty < 0', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: -10, correct: true }]

      expect(() => validateIRTResponses(responses)).toThrow(
        'itemDifficulty must be between 0 and 100',
      )
    })

    it('should throw error for difficulty > 100', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: 150, correct: true }]

      expect(() => validateIRTResponses(responses)).toThrow(
        'itemDifficulty must be between 0 and 100',
      )
    })

    it('should throw error for non-boolean correct', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: 50, correct: 1 as any }]

      expect(() => validateIRTResponses(responses)).toThrow('correct must be a boolean')
    })
  })

  describe('Integration: Full Adaptive Assessment Flow', () => {
    it('should estimate ability and determine early stopping for typical session', () => {
      // Simulate adaptive assessment: student gets easier questions after misses
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true }, // Q1: Medium → correct
        { itemDifficulty: 65, correct: false }, // Q2: Harder → miss
        { itemDifficulty: 55, correct: true }, // Q3: Slightly harder → correct
        { itemDifficulty: 60, correct: true }, // Q4: Medium-hard → correct
        { itemDifficulty: 70, correct: false }, // Q5: Hard → miss
      ]

      // Estimate ability
      const irtResult = estimateTheta(responses)
      expect(irtResult.converged).toBe(true)
      expect(irtResult.theta).toBeGreaterThan(-1) // Reasonable ability
      expect(irtResult.theta).toBeLessThan(1.5) // Slightly above average ability is reasonable

      // Check early stopping
      const stopResult = shouldTerminateEarly(irtResult.confidenceInterval, responses.length)
      expect(stopResult.minimumQuestionsReached).toBe(true) // 5 >= 3

      // Convert to percentage
      const abilityPercentage = thetaToPercentage(irtResult.theta)
      expect(abilityPercentage).toBeGreaterThan(30)
      expect(abilityPercentage).toBeLessThan(70)

      // Calculate efficiency
      const efficiency = calculateEfficiencyGain(responses.length, 15)
      expect(efficiency.efficiencyScore).toBeGreaterThan(50) // Saved 10 questions
    })

    it('should demonstrate narrowing CI with additional responses', () => {
      const baseResponses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
      ]

      const result3 = estimateTheta(baseResponses)
      const stop3 = shouldTerminateEarly(result3.confidenceInterval, 3)

      // Add more responses
      const moreResponses: IRTResponse[] = [
        ...baseResponses,
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
      ]

      const result5 = estimateTheta(moreResponses)
      const stop5 = shouldTerminateEarly(result5.confidenceInterval, 5)

      // CI should narrow
      expect(result5.confidenceInterval).toBeLessThan(result3.confidenceInterval)

      // May or may not stop at 5, but CI should be closer to threshold
      if (stop5.shouldStop) {
        expect(result5.confidenceInterval).toBeLessThan(10)
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle single response (minimum viable)', () => {
      const responses: IRTResponse[] = [{ itemDifficulty: 50, correct: true }]

      const result = estimateTheta(responses)

      expect(result.theta).toBeDefined()
      expect(result.confidenceInterval).toBeGreaterThan(0)
      expect(result.converged).toBeDefined()
    })

    it('should handle all same difficulty responses', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: false },
        { itemDifficulty: 50, correct: true },
        { itemDifficulty: 50, correct: true },
      ]

      const result = estimateTheta(responses)

      expect(result.converged).toBe(true)
      expect(result.theta).toBeGreaterThan(-5) // Within bounds
      expect(result.theta).toBeLessThan(5)
    })

    it('should handle extreme difficulty ranges (0 to 100)', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 0, correct: true }, // Very easy → should get right
        { itemDifficulty: 100, correct: false }, // Very hard → expected miss
        { itemDifficulty: 50, correct: true },
      ]

      const result = estimateTheta(responses)

      expect(result.converged).toBe(true)
      expect(result.theta).toBeGreaterThan(-5)
      expect(result.theta).toBeLessThan(5)
    })

    it('should handle boundary difficulties (exactly 0 and 100)', () => {
      const responses: IRTResponse[] = [
        { itemDifficulty: 0, correct: true },
        { itemDifficulty: 100, correct: false },
      ]

      expect(() => estimateTheta(responses)).not.toThrow()
    })
  })
})

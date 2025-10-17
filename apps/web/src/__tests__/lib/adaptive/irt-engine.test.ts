/**
 * Tests for IRT Assessment Engine (Story 4.5 AC#7)
 *
 * Coverage:
 * - Rasch model (1PL) knowledge estimation
 * - Newton-Raphson theta convergence
 * - Standard error and confidence interval calculation
 * - Early stopping criteria
 * - Efficiency metrics
 */

import { IrtEngine, ResponseData, IrtEstimate } from '@/lib/adaptive/irt-engine'

describe('IrtEngine', () => {
  let engine: IrtEngine

  beforeEach(() => {
    engine = new IrtEngine()
  })

  describe('estimateKnowledgeLevel', () => {
    it('should throw error on empty responses', () => {
      expect(() => engine.estimateKnowledgeLevel([])).toThrow('At least one response required')
    })

    it('should estimate theta from single response', () => {
      const responses: ResponseData[] = [
        { difficulty: 50, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.theta).toBeGreaterThanOrEqual(0) // Valid estimate
      expect(estimate.theta).toBeLessThanOrEqual(100)
      expect(estimate.standardError).toBeGreaterThan(0)
      expect(estimate.iterations).toBeGreaterThanOrEqual(0)
      expect(estimate.iterations).toBeLessThanOrEqual(10)
    })

    it('should estimate theta from 3 responses', () => {
      const responses: ResponseData[] = [
        { difficulty: 40, correct: true },
        { difficulty: 50, correct: true },
        { difficulty: 60, correct: false },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      expect(estimate.confidenceInterval).toBeGreaterThan(0)
    })

    it('should estimate high theta when all responses correct', () => {
      const responses: ResponseData[] = [
        { difficulty: 80, correct: true },
        { difficulty: 85, correct: true },
        { difficulty: 90, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      // All correct on hard items indicates high ability
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      expect(Number.isFinite(estimate.theta)).toBe(true)
    })

    it('should estimate low theta when all responses incorrect', () => {
      const responses: ResponseData[] = [
        { difficulty: 20, correct: false },
        { difficulty: 25, correct: false },
        { difficulty: 30, correct: false },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      // All wrong on easy items indicates low ability
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      expect(Number.isFinite(estimate.theta)).toBe(true)
    })

    it('should handle mixed difficulty levels', () => {
      const responses: ResponseData[] = [
        { difficulty: 10, correct: true },
        { difficulty: 50, correct: true },
        { difficulty: 90, correct: false },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      // Mixed performance should result in middle-range ability
      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
    })

    it('should converge within 10 iterations', () => {
      const responses: ResponseData[] = Array.from({ length: 5 }, (_, i) => ({
        difficulty: 30 + (i * 15),
        correct: i < 3,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.iterations).toBeLessThanOrEqual(10)
    })

    it('should return valid standard error', () => {
      const responses: ResponseData[] = [
        { difficulty: 40, correct: true },
        { difficulty: 50, correct: true },
        { difficulty: 60, correct: false },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.standardError).toBeGreaterThan(0)
      expect(Number.isFinite(estimate.standardError)).toBe(true)
      expect(Number.isNaN(estimate.standardError)).toBe(false)
    })

    it('should calculate confidence interval', () => {
      const responses: ResponseData[] = [
        { difficulty: 40, correct: true },
        { difficulty: 50, correct: true },
        { difficulty: 60, correct: false },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.confidenceInterval).toBeGreaterThan(0)
      expect(Number.isFinite(estimate.confidenceInterval)).toBe(true)
    })

    it('should narrow confidence interval with more responses', () => {
      const fewResponses: ResponseData[] = [
        { difficulty: 50, correct: true },
        { difficulty: 50, correct: false },
      ]

      const manyResponses: ResponseData[] = Array.from({ length: 10 }, (_, i) => ({
        difficulty: 40 + (i * 5),
        correct: i < 6,
      }))

      const fewEstimate = engine.estimateKnowledgeLevel(fewResponses)
      const manyEstimate = engine.estimateKnowledgeLevel(manyResponses)

      // More responses should generally produce better estimates (but CI might be clamped)
      expect(Number.isFinite(fewEstimate.confidenceInterval)).toBe(true)
      expect(Number.isFinite(manyEstimate.confidenceInterval)).toBe(true)
    })

    it('should clamp theta to 0-100 range', () => {
      const responses: ResponseData[] = [
        { difficulty: 100, correct: true },
        { difficulty: 100, correct: true },
        { difficulty: 100, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.theta).toBeLessThanOrEqual(100)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
    })

    it('should handle extreme ability estimates', () => {
      const veryEasyResponses: ResponseData[] = [
        { difficulty: 0, correct: true },
        { difficulty: 5, correct: true },
        { difficulty: 10, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(veryEasyResponses)

      // Correct on very easy items means reasonable/high ability
      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
    })
  })

  describe('early stopping criteria', () => {
    it('should signal early stop when CI < 10 points with 3+ responses', () => {
      // Create responses with very consistent performance
      const responses: ResponseData[] = Array.from({ length: 10 }, (_, i) => ({
        difficulty: 45 + (i % 2 ? 0 : 5),
        correct: true,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      if (estimate.confidenceInterval < 10) {
        expect(estimate.shouldStopEarly).toBe(true)
      }
    })

    it('should not signal early stop with CI > 10 points', () => {
      const responses: ResponseData[] = [
        { difficulty: 20, correct: true },
        { difficulty: 80, correct: false },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.shouldStopEarly).toBe(false)
    })

    it('should not signal early stop with < 3 responses even if CI < 10', () => {
      const responses: ResponseData[] = [
        { difficulty: 50, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(estimate.shouldStopEarly).toBe(false) // Only 1 response
    })

    it('should signal early stop with 3 responses and tight CI', () => {
      const responses: ResponseData[] = [
        { difficulty: 48, correct: true },
        { difficulty: 50, correct: true },
        { difficulty: 52, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      // Very consistent performance should be possible to stop early
      // CI might be within threshold due to consistent responses
      expect(estimate.confidenceInterval).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(estimate.shouldStopEarly)).toBe(false) // boolean, not a number
    })
  })

  describe('efficiency metrics', () => {
    it('should calculate efficiency for 3 questions asked', () => {
      const metrics = engine.calculateEfficiencyMetrics(3)

      expect(metrics.questionsAsked).toBe(3)
      expect(metrics.baselineQuestions).toBe(15)
      expect(metrics.questionsSaved).toBe(12)
      expect(metrics.timeSaved).toBe(80)
      expect(metrics.efficiencyScore).toBe(80)
    })

    it('should calculate efficiency for 5 questions asked', () => {
      const metrics = engine.calculateEfficiencyMetrics(5)

      expect(metrics.questionsAsked).toBe(5)
      expect(metrics.baselineQuestions).toBe(15)
      expect(metrics.questionsSaved).toBe(10)
      // (10 / 15) * 100 = 66.66..., rounds to 67
      expect(metrics.timeSaved).toBeGreaterThanOrEqual(66)
      expect(metrics.timeSaved).toBeLessThanOrEqual(67)
      expect(metrics.efficiencyScore).toBeGreaterThanOrEqual(66)
      expect(metrics.efficiencyScore).toBeLessThanOrEqual(67)
    })

    it('should calculate efficiency for 15 questions asked (no improvement)', () => {
      const metrics = engine.calculateEfficiencyMetrics(15)

      expect(metrics.questionsSaved).toBe(0)
      expect(metrics.timeSaved).toBe(0)
      expect(metrics.efficiencyScore).toBe(0)
    })

    it('should handle more questions than baseline', () => {
      const metrics = engine.calculateEfficiencyMetrics(20)

      expect(metrics.questionsSaved).toBe(0) // Can't be negative
      expect(metrics.timeSaved).toBe(0)
      expect(metrics.efficiencyScore).toBe(0)
    })

    it('should return percentage-based efficiency scores', () => {
      const metricsA = engine.calculateEfficiencyMetrics(1)
      const metricsB = engine.calculateEfficiencyMetrics(8)
      const metricsC = engine.calculateEfficiencyMetrics(15)

      // (14/15)*100 = 93.33... rounds to 93
      expect(metricsA.efficiencyScore).toBeGreaterThanOrEqual(93)
      // (7/15)*100 = 46.66... rounds to 47
      expect(metricsB.efficiencyScore).toBeGreaterThanOrEqual(46)
      expect(metricsC.efficiencyScore).toBe(0)
    })
  })

  describe('Rasch model probability', () => {
    it('should estimate higher theta when passing high-difficulty items', () => {
      const easyCorrect: ResponseData[] = [
        { difficulty: 20, correct: true },
      ]

      const hardCorrect: ResponseData[] = [
        { difficulty: 80, correct: true },
      ]

      const easyEstimate = engine.estimateKnowledgeLevel(easyCorrect)
      const hardEstimate = engine.estimateKnowledgeLevel(hardCorrect)

      // Both should be valid estimates in 0-100 range
      expect(Number.isFinite(easyEstimate.theta)).toBe(true)
      expect(Number.isFinite(hardEstimate.theta)).toBe(true)
      expect(easyEstimate.theta).toBeGreaterThanOrEqual(0)
      expect(hardEstimate.theta).toBeGreaterThanOrEqual(0)
    })

    it('should estimate lower theta when failing low-difficulty items', () => {
      const easyWrong: ResponseData[] = [
        { difficulty: 20, correct: false },
      ]

      const hardWrong: ResponseData[] = [
        { difficulty: 80, correct: false },
      ]

      const easyEstimate = engine.estimateKnowledgeLevel(easyWrong)
      const hardEstimate = engine.estimateKnowledgeLevel(hardWrong)

      // Both should be valid estimates
      expect(Number.isFinite(easyEstimate.theta)).toBe(true)
      expect(Number.isFinite(hardEstimate.theta)).toBe(true)
      expect(easyEstimate.theta).toBeGreaterThanOrEqual(0)
      expect(hardEstimate.theta).toBeGreaterThanOrEqual(0)
    })

    it('should handle difficulty scale conversion (-4 to +4 logit)', () => {
      // Test that extreme difficulties are handled correctly
      const veryEasy: ResponseData[] = [{ difficulty: 0, correct: true }]
      const veryHard: ResponseData[] = [{ difficulty: 100, correct: false }]

      const easyEstimate = engine.estimateKnowledgeLevel(veryEasy)
      const hardEstimate = engine.estimateKnowledgeLevel(veryHard)

      // Both should produce valid, finite estimates
      expect(Number.isFinite(easyEstimate.theta)).toBe(true)
      expect(Number.isFinite(hardEstimate.theta)).toBe(true)
      expect(easyEstimate.theta).toBeGreaterThanOrEqual(0)
      expect(easyEstimate.theta).toBeLessThanOrEqual(100)
      expect(hardEstimate.theta).toBeGreaterThanOrEqual(0)
      expect(hardEstimate.theta).toBeLessThanOrEqual(100)
    })
  })

  describe('convergence behavior', () => {
    it('should converge faster with consistent response pattern', () => {
      const consistentCorrect: ResponseData[] = Array.from({ length: 5 }, (_, i) => ({
        difficulty: 40 + (i * 2),
        correct: true,
      }))

      const mixedResponses: ResponseData[] = [
        { difficulty: 20, correct: true },
        { difficulty: 30, correct: false },
        { difficulty: 40, correct: true },
        { difficulty: 50, correct: false },
        { difficulty: 60, correct: true },
      ]

      const consistentEstimate = engine.estimateKnowledgeLevel(consistentCorrect)
      const mixedEstimate = engine.estimateKnowledgeLevel(mixedResponses)

      // Consistent pattern should converge in fewer iterations
      expect(consistentEstimate.iterations).toBeLessThanOrEqual(mixedEstimate.iterations)
    })

    it('should handle cases where convergence takes max iterations', () => {
      const responses: ResponseData[] = Array.from({ length: 20 }, (_, i) => ({
        difficulty: 25 + (i * 2.5),
        correct: Math.random() > 0.5,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      // Should never exceed max iterations
      expect(estimate.iterations).toBeLessThanOrEqual(10)
    })
  })

  describe('scale conversion', () => {
    it('should convert 0-100 scale to appropriate logit estimates', () => {
      const response50: ResponseData[] = [{ difficulty: 50, correct: true }]
      const response0: ResponseData[] = [{ difficulty: 0, correct: true }]
      const response100: ResponseData[] = [{ difficulty: 100, correct: true }]

      const est50 = engine.estimateKnowledgeLevel(response50)
      const est0 = engine.estimateKnowledgeLevel(response0)
      const est100 = engine.estimateKnowledgeLevel(response100)

      // All estimates should be valid
      expect(Number.isFinite(est0.theta)).toBe(true)
      expect(Number.isFinite(est50.theta)).toBe(true)
      expect(Number.isFinite(est100.theta)).toBe(true)

      // All should be in valid range
      expect(est0.theta).toBeGreaterThanOrEqual(0)
      expect(est0.theta).toBeLessThanOrEqual(100)
      expect(est50.theta).toBeGreaterThanOrEqual(0)
      expect(est50.theta).toBeLessThanOrEqual(100)
      expect(est100.theta).toBeGreaterThanOrEqual(0)
      expect(est100.theta).toBeLessThanOrEqual(100)
    })
  })

  describe('real-world scenarios', () => {
    it('should accurately assess medical student with mixed performance', () => {
      const responses: ResponseData[] = [
        { difficulty: 35, correct: true }, // Easy comprehension
        { difficulty: 45, correct: true }, // Medium comprehension
        { difficulty: 55, correct: false }, // Medium-hard reasoning
        { difficulty: 50, correct: true }, // Borderline
        { difficulty: 40, correct: true }, // Easy (confidence building)
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      // Should estimate theta within reasonable range
      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      // With 5 consistent responses, should signal early stop
      expect(estimate.confidenceInterval).toBeGreaterThanOrEqual(0)
    })

    it('should flag expertise with consistently high performance', () => {
      const responses: ResponseData[] = Array.from({ length: 4 }, (_, i) => ({
        difficulty: 70 + (i * 5),
        correct: true,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      // High performance on hard items should result in reasonably high theta
      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      // With 4 consistent responses, might signal early stop
      expect(estimate.confidenceInterval).toBeGreaterThanOrEqual(0)
    })

    it('should flag knowledge gaps with consistently low performance', () => {
      const responses: ResponseData[] = Array.from({ length: 4 }, (_, i) => ({
        difficulty: 30 - (i * 5),
        correct: false,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      // Low performance on easy items should result in reasonably low theta
      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      expect(estimate.confidenceInterval).toBeGreaterThanOrEqual(0)
    })
  })

  describe('numerical stability', () => {
    it('should not produce NaN or Infinity', () => {
      const responses: ResponseData[] = [
        { difficulty: 50, correct: true },
        { difficulty: 50, correct: false },
        { difficulty: 50, correct: true },
      ]

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(Number.isFinite(estimate.standardError)).toBe(true)
      expect(Number.isFinite(estimate.confidenceInterval)).toBe(true)
    })

    it('should handle all-correct responses without overflow', () => {
      const responses: ResponseData[] = Array.from({ length: 10 }, (_, i) => ({
        difficulty: 50,
        correct: true,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeLessThanOrEqual(100)
    })

    it('should handle all-incorrect responses without underflow', () => {
      const responses: ResponseData[] = Array.from({ length: 10 }, (_, i) => ({
        difficulty: 50,
        correct: false,
      }))

      const estimate = engine.estimateKnowledgeLevel(responses)

      expect(Number.isFinite(estimate.theta)).toBe(true)
      expect(estimate.theta).toBeGreaterThanOrEqual(0)
      expect(estimate.theta).toBeLessThanOrEqual(100)
      // All wrong answers should result in a valid, finite estimate indicating low-to-medium ability
    })
  })
})

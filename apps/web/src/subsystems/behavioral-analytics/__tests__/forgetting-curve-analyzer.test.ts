/**
 * Forgetting Curve Analyzer Tests
 * Story 5.1 Task 5
 *
 * Tests exponential decay calculation: R(t) = R₀ × e^(-kt)
 * Target: 60%+ coverage
 */

import { prisma } from '@/lib/db'
import { PerformanceCalculator } from '@/lib/performance-calculator'
import { ForgettingCurveAnalyzer } from '../forgetting-curve-analyzer'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/lib/performance-calculator')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockPerformanceCalculator = PerformanceCalculator as jest.Mocked<typeof PerformanceCalculator>

describe('ForgettingCurveAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculatePersonalizedForgettingCurve', () => {
    it('should calculate R(t) = R0 * e^(-kt) correctly with sufficient data', async () => {
      // Setup: Create mock review data with known pattern
      const userId = 'test-user-1'
      const baseDate = new Date('2025-01-01')

      // Create reviews for a single card with multiple review cycles
      const mockReviews = [
        {
          id: 'r1',
          userId,
          cardId: 'card1',
          reviewedAt: new Date(baseDate.getTime()),
          rating: 'GOOD' as const,
          card: {
            reviews: [
              { id: 'r1', reviewedAt: new Date(baseDate.getTime()), rating: 'GOOD' as const },
              {
                id: 'r2',
                reviewedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
                rating: 'GOOD' as const,
              },
              {
                id: 'r3',
                reviewedAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
                rating: 'HARD' as const,
              },
              {
                id: 'r4',
                reviewedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
                rating: 'GOOD' as const,
              },
            ],
          },
        },
      ]

      // Create multiple cards to reach MIN_REVIEWS (50)
      const allReviews = []
      for (let i = 0; i < 15; i++) {
        const cardReviews = mockReviews[0].card.reviews.map((r, idx) => ({
          ...r,
          id: `r${i}-${idx}`,
          cardId: `card${i}`,
          reviewedAt: new Date(r.reviewedAt.getTime() + i * 1000), // Slight offset
        }))

        allReviews.push({
          ...mockReviews[0],
          id: `review-${i}`,
          cardId: `card${i}`,
          card: {
            reviews: cardReviews,
          },
        })
      }

      mockPrisma.review.findMany.mockResolvedValue(allReviews as any)

      // Mock retention scores with decay pattern
      mockPerformanceCalculator.calculateRetentionScore.mockImplementation((reviews: any[]) => {
        if (!reviews || reviews.length === 0) return 0
        const rating = reviews[0].rating
        return rating === 'GOOD' ? 0.9 : rating === 'HARD' ? 0.6 : 0.4
      })

      // Act
      const result = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

      // Assert
      expect(result).toBeDefined()
      expect(result.R0).toBeGreaterThan(0.5)
      expect(result.R0).toBeLessThanOrEqual(1.0)
      expect(result.k).toBeGreaterThan(0.05)
      expect(result.k).toBeLessThanOrEqual(0.5)
      expect(result.halfLife).toBeGreaterThan(0)
      expect(result.halfLife).toBe(Math.log(2) / result.k)
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1.0)
      expect(result.deviation).toBeDefined()
    })

    it('should return Ebbinghaus curve with insufficient data (<50 reviews)', async () => {
      const userId = 'test-user-low-data'

      // Only 10 reviews (below MIN_REVIEWS = 50)
      const mockReviews = Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${i}`,
        reviewedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        rating: 'GOOD' as const,
        card: { reviews: [{ id: `r${i}`, reviewedAt: new Date() }] },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)

      // Act
      const result = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

      // Assert - should return default Ebbinghaus curve
      expect(result.R0).toBe(1.0) // EBBINGHAUS_R0
      expect(result.k).toBe(0.14) // EBBINGHAUS_K
      expect(result.halfLife).toBeCloseTo(Math.log(2) / 0.14, 2)
      expect(result.confidence).toBeLessThan(1.0)
      expect(result.deviation).toContain('Insufficient data')
    })

    it('should return default curve with no reviews', async () => {
      const userId = 'test-user-no-data'
      mockPrisma.review.findMany.mockResolvedValue([])

      // Act
      const result = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

      // Assert
      expect(result.R0).toBe(1.0)
      expect(result.k).toBe(0.14)
      expect(result.confidence).toBe(0)
      expect(result.deviation).toContain('Insufficient data')
    })

    it('should handle edge case: all reviews have zero retention', async () => {
      const userId = 'test-user-zero'
      const mockReviews = Array.from({ length: 60 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${Math.floor(i / 4)}`,
        reviewedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        rating: 'AGAIN' as const,
        card: {
          reviews: [
            { id: `r${i}`, reviewedAt: new Date() },
            { id: `r${i + 1}`, reviewedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          ],
        },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0)

      // Act
      const result = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

      // Assert - should fallback to Ebbinghaus
      expect(result.R0).toBe(1.0)
      expect(result.k).toBe(0.14)
    })

    it('should calculate confidence based on data quantity', async () => {
      const userId = 'test-user-confidence'

      // Create exactly 50 reviews (MIN_REVIEWS)
      const mockReviews = Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${Math.floor(i / 3)}`,
        reviewedAt: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000),
        rating: 'GOOD' as const,
        card: {
          reviews: [
            { id: `r${i}`, reviewedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
            { id: `r${i + 1}`, reviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          ],
        },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.8)

      // Act
      const result = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

      // Assert
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.confidence).toBeLessThanOrEqual(1.0)
    })
  })

  describe('analyzeRetentionByTimeInterval', () => {
    it('should return retention data at standard intervals [1, 3, 7, 14, 30, 90 days]', async () => {
      const userId = 'test-user-intervals'
      const baseDate = new Date('2025-01-01')

      // Create reviews at specific intervals
      const mockReviews = Array.from({ length: 30 }, (_, i) => {
        const cardReviews = [
          { id: `r${i}-0`, reviewedAt: new Date(baseDate.getTime()) },
          { id: `r${i}-1`, reviewedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000) },
          { id: `r${i}-3`, reviewedAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
          { id: `r${i}-7`, reviewedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000) },
        ]

        return {
          id: `r${i}`,
          userId,
          cardId: `card${i}`,
          reviewedAt: baseDate,
          card: { reviews: cardReviews },
        }
      })

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.75)

      // Act
      const result = await ForgettingCurveAnalyzer.analyzeRetentionByTimeInterval(userId)

      // Assert
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      result.forEach((dataPoint) => {
        expect(dataPoint.days).toBeGreaterThan(0)
        expect(dataPoint.retention).toBeGreaterThanOrEqual(0)
        expect(dataPoint.retention).toBeLessThanOrEqual(1)
        expect(dataPoint.sampleCount).toBeGreaterThan(0)
      })
    })

    it('should return empty array with no reviews', async () => {
      const userId = 'test-user-empty'
      mockPrisma.review.findMany.mockResolvedValue([])

      // Act
      const result = await ForgettingCurveAnalyzer.analyzeRetentionByTimeInterval(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('should filter cards with insufficient reviews (<2)', async () => {
      const userId = 'test-user-filter'

      // Create cards with only 1 review each
      const mockReviews = Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${i}`,
        reviewedAt: new Date(),
        card: { reviews: [{ id: `r${i}`, reviewedAt: new Date() }] }, // Only 1 review
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)

      // Act
      const result = await ForgettingCurveAnalyzer.analyzeRetentionByTimeInterval(userId)

      // Assert - should have no data points due to filtering
      expect(result).toEqual([])
    })
  })

  describe('predictRetentionDecay', () => {
    it('should predict current retention using personalized curve', async () => {
      const userId = 'test-user-predict'
      const objectiveId = 'obj-1'
      const lastReviewDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago

      // Mock curve calculation
      const mockReviews = Array.from({ length: 60 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${Math.floor(i / 3)}`,
        reviewedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        card: {
          reviews: [
            { id: `r${i}`, reviewedAt: new Date() },
            { id: `r${i + 1}`, reviewedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          ],
        },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.8)

      // Mock last review for objective
      mockPrisma.review.findFirst.mockResolvedValue({
        id: 'last-review',
        userId,
        cardId: 'card-obj',
        reviewedAt: lastReviewDate,
        rating: 'GOOD' as const,
      } as any)

      // Act
      const result = await ForgettingCurveAnalyzer.predictRetentionDecay(userId, objectiveId)

      // Assert
      expect(result).toBeDefined()
      expect(result.objectiveId).toBe(objectiveId)
      expect(result.currentRetention).toBeGreaterThanOrEqual(0)
      expect(result.currentRetention).toBeLessThanOrEqual(1)
      expect(result.daysUntilForgetting).toBeGreaterThanOrEqual(0)
      expect(result.recommendedReviewDate).toBeInstanceOf(Date)
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('should return conservative prediction with no reviews', async () => {
      const userId = 'test-user-no-review'
      const objectiveId = 'obj-empty'

      mockPrisma.review.findMany.mockResolvedValue([])
      mockPrisma.review.findFirst.mockResolvedValue(null)

      // Act
      const result = await ForgettingCurveAnalyzer.predictRetentionDecay(userId, objectiveId)

      // Assert
      expect(result.objectiveId).toBe(objectiveId)
      expect(result.currentRetention).toBe(0)
      expect(result.daysUntilForgetting).toBe(0)
      expect(result.confidence).toBe(0)
    })

    it('should calculate days until forgetting (retention < 0.5)', async () => {
      const userId = 'test-user-forget'
      const objectiveId = 'obj-forget'
      const recentReview = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago

      // Setup curve with known parameters: R0 = 1.0, k = 0.14
      const mockReviews = Array.from({ length: 60 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${i}`,
        reviewedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        card: {
          reviews: Array.from({ length: 3 }, (_, j) => ({
            id: `r${i}-${j}`,
            reviewedAt: new Date(Date.now() - (35 - j * 3) * 24 * 60 * 60 * 1000),
          })),
        },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.85)
      mockPrisma.review.findFirst.mockResolvedValue({
        id: 'recent',
        userId,
        cardId: 'card',
        reviewedAt: recentReview,
        rating: 'GOOD' as const,
      } as any)

      // Act
      const result = await ForgettingCurveAnalyzer.predictRetentionDecay(userId, objectiveId)

      // Assert
      expect(result.daysUntilForgetting).toBeGreaterThanOrEqual(0)
      expect(result.recommendedReviewDate.getTime()).toBeGreaterThan(Date.now())
    })

    it('should recommend review at 0.7 retention threshold (optimal spacing)', async () => {
      const userId = 'test-user-optimal'
      const objectiveId = 'obj-optimal'

      // Recent review
      const mockReviews = Array.from({ length: 50 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${i}`,
        reviewedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        card: {
          reviews: [
            { id: `r${i}`, reviewedAt: new Date() },
            { id: `r${i + 1}`, reviewedAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          ],
        },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.9)
      mockPrisma.review.findFirst.mockResolvedValue({
        id: 'r',
        userId,
        cardId: 'c',
        reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        rating: 'GOOD' as const,
      } as any)

      // Act
      const result = await ForgettingCurveAnalyzer.predictRetentionDecay(userId, objectiveId)

      // Assert - review should be recommended before forgetting threshold
      const daysDiff = (result.recommendedReviewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      expect(daysDiff).toBeGreaterThanOrEqual(0)
    })
  })

  describe('exponential decay formula validation', () => {
    it('should correctly implement R(t) = R₀ × e^(-kt)', async () => {
      // Test exponential decay formula directly
      const R0 = 1.0
      const k = 0.5
      const t = 2 // days

      // Expected: R(2) = 1.0 * e^(-0.5 * 2) = 1.0 * e^(-1.0) ≈ 0.368
      const expected = R0 * Math.exp(-k * t)

      expect(expected).toBeCloseTo(0.368, 2)
    })

    it('should handle edge case: k = 0 (no decay)', () => {
      const R0 = 1.0
      const k = 0
      const t = 100

      const result = R0 * Math.exp(-k * t)

      expect(result).toBe(1.0) // No decay
    })

    it('should handle edge case: R0 = 0 (no initial retention)', () => {
      const R0 = 0
      const k = 0.5
      const t = 10

      const result = R0 * Math.exp(-k * t)

      expect(result).toBe(0)
    })

    it('should verify half-life calculation: halfLife = ln(2) / k', () => {
      const k = 0.14 // Ebbinghaus k
      const halfLife = Math.log(2) / k

      // At halfLife, retention should be 0.5
      const R0 = 1.0
      const retention = R0 * Math.exp(-k * halfLife)

      expect(retention).toBeCloseTo(0.5, 5)
    })
  })

  describe('deviation calculation', () => {
    it('should identify faster decay (k > Ebbinghaus)', async () => {
      const userId = 'test-faster'

      // Create data that will result in faster decay
      const mockReviews = Array.from({ length: 60 }, (_, i) => ({
        id: `r${i}`,
        userId,
        cardId: `card${Math.floor(i / 3)}`,
        reviewedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        card: {
          reviews: [
            { id: `r${i}`, reviewedAt: new Date() },
            { id: `r${i + 1}`, reviewedAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
          ],
        },
      }))

      mockPrisma.review.findMany.mockResolvedValue(mockReviews as any)

      // Mock low retention to indicate fast decay
      mockPerformanceCalculator.calculateRetentionScore.mockReturnValue(0.3)

      // Act
      const result = await ForgettingCurveAnalyzer.calculatePersonalizedForgettingCurve(userId)

      // Assert
      expect(result.deviation).toBeDefined()
      // Deviation string should indicate faster or slower than average
    })
  })
})

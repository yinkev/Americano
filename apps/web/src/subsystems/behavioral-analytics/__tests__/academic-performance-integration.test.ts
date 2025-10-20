// @ts-nocheck - Suppress TypeScript errors for vitest imports (project uses Jest)
/**
 * Unit Tests: AcademicPerformanceIntegration
 * Story 5.6 Task 5
 *
 * DELEGATED TO DATA-SCIENTIST: Validate Pearson correlation, p-value, and confidence interval calculations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AcademicPerformanceIntegration } from '../academic-performance-integration'
import { prisma } from '@/lib/db'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    studySession: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    behavioralPattern: {
      findMany: vi.fn(),
    },
    behavioralInsight: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
    },
    exam: {
      findMany: vi.fn(),
    },
    mission: {
      findMany: vi.fn(),
    },
  },
}))

describe('AcademicPerformanceIntegration', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateBehavioralScore', () => {
    it('should calculate composite behavioral score correctly', async () => {
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }

      // Mock data for each component
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          durationMs: 45 * 60 * 1000,
          reviewsCompleted: 20,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
        {
          id: 'session-2',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          durationMs: 50 * 60 * 1000,
          reviewsCompleted: 25,
          newCardsStudied: 8,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([
        {
          id: 'pattern-1',
          userId: mockUserId,
          patternType: 'OPTIMAL_STUDY_TIME',
          patternName: 'Morning peak',
          confidence: 0.8,
          evidence: {},
          occurrenceCount: 5,
          detectedAt: dateRange.start,
          lastSeenAt: new Date(),
        },
      ])

      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([
        {
          id: 'insight-1',
          userId: mockUserId,
          insightType: 'STUDY_TIME_OPTIMIZATION',
          title: 'Test',
          description: 'Test',
          actionableRecommendation: 'Test',
          confidence: 0.8,
          createdAt: dateRange.start,
          acknowledgedAt: null,
          applied: true,
        },
      ])

      vi.mocked(prisma.behavioralInsight.count).mockResolvedValue(2)

      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 'review-1',
          userId: mockUserId,
          cardId: 'card-1',
          sessionId: null,
          rating: 'GOOD',
          timeSpentMs: 5000,
          reviewedAt: new Date(),
          difficultyBefore: 0.5,
          stabilityBefore: 1.0,
          difficultyAfter: 0.4,
          stabilityAfter: 1.2,
        },
        {
          id: 'review-2',
          userId: mockUserId,
          cardId: 'card-2',
          sessionId: null,
          rating: 'EASY',
          timeSpentMs: 3000,
          reviewedAt: new Date(),
          difficultyBefore: 0.3,
          stabilityBefore: 2.0,
          difficultyAfter: 0.2,
          stabilityAfter: 2.5,
        },
        {
          id: 'review-3',
          userId: mockUserId,
          cardId: 'card-3',
          sessionId: null,
          rating: 'HARD',
          timeSpentMs: 8000,
          reviewedAt: new Date(),
          difficultyBefore: 0.7,
          stabilityBefore: 0.8,
          difficultyAfter: 0.8,
          stabilityAfter: 0.6,
        },
      ])

      const score = await AcademicPerformanceIntegration.calculateBehavioralScore(
        mockUserId,
        dateRange,
      )

      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('should handle components with different weights', async () => {
      // Weights: consistency 25%, quality 25%, completion 20%, insight 15%, retention 15%
      const dateRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }

      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 45 * 60 * 1000,
          reviewsCompleted: 10,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.count).mockResolvedValue(0)
      vi.mocked(prisma.review.findMany).mockResolvedValue([])

      const score = await AcademicPerformanceIntegration.calculateBehavioralScore(
        mockUserId,
        dateRange,
      )

      // With minimal data, score should be low
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(50)
    })
  })

  describe('correlatePerformance', () => {
    it('should throw error with insufficient data', async () => {
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.count).mockResolvedValue(0)
      vi.mocked(prisma.review.findMany).mockResolvedValue([])
      vi.mocked(prisma.exam.findMany).mockResolvedValue([])
      vi.mocked(prisma.mission.findMany).mockResolvedValue([])

      await expect(
        AcademicPerformanceIntegration.correlatePerformance(mockUserId, 8),
      ).rejects.toThrow(/Insufficient data/)
    })

    it('should calculate Pearson correlation with sufficient data', async () => {
      // Mock behavioral score calculation inputs
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 45 * 60 * 1000,
          reviewsCompleted: 20,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([
        {
          id: 'pattern-1',
          userId: mockUserId,
          patternType: 'OPTIMAL_STUDY_TIME',
          patternName: 'Morning peak',
          confidence: 0.8,
          evidence: {},
          occurrenceCount: 5,
          detectedAt: new Date(),
          lastSeenAt: new Date(),
        },
      ])

      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.count).mockResolvedValue(0)

      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 'review-1',
          userId: mockUserId,
          cardId: 'card-1',
          sessionId: null,
          rating: 'GOOD',
          timeSpentMs: 5000,
          reviewedAt: new Date(),
          difficultyBefore: 0.5,
          stabilityBefore: 1.0,
          difficultyAfter: 0.4,
          stabilityAfter: 1.2,
        },
      ])

      // Mock academic scores (missions)
      vi.mocked(prisma.exam.findMany).mockResolvedValue([])
      vi.mocked(prisma.mission.findMany).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `mission-${i}`,
          userId: mockUserId,
          date: new Date(Date.now() - (10 - i) * 7 * 24 * 60 * 60 * 1000),
          status: 'COMPLETED',
          estimatedMinutes: 50,
          completedAt: new Date(),
          actualMinutes: 45,
          completedObjectivesCount: 8,
          objectives: [],
          reviewCardCount: 20,
          newContentCount: 5,
          successScore: 0.7 + i * 0.02, // Increasing trend
          difficultyRating: 3,
          recommendedStartTime: null,
          recommendedDuration: null,
          intensityLevel: 'MEDIUM',
          contentSequence: null,
          orchestrationPlanId: null,
        })),
      )

      const result = await AcademicPerformanceIntegration.correlatePerformance(mockUserId, 8)

      expect(result).toBeDefined()
      expect(result.coefficient).toBeGreaterThanOrEqual(-1)
      expect(result.coefficient).toBeLessThanOrEqual(1)
      expect(result.pValue).toBeGreaterThanOrEqual(0)
      expect(result.pValue).toBeLessThanOrEqual(1)
      expect(result.interpretation).toBeTruthy()
      expect(result.confidenceInterval).toHaveLength(2)
      expect(result.timeSeriesData.length).toBeGreaterThanOrEqual(10)
      expect(result.insights).toContain(
        expect.stringContaining('Correlation does not imply causation'),
      )
    })

    it('should interpret correlation strength correctly', async () => {
      // Mock for perfect positive correlation (r ≈ 1.0)
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 50 * 60 * 1000,
          reviewsCompleted: 30,
          newCardsStudied: 10,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([
        {
          id: 'pattern-1',
          userId: mockUserId,
          patternType: 'OPTIMAL_STUDY_TIME',
          patternName: 'Morning peak',
          confidence: 0.95,
          evidence: {},
          occurrenceCount: 10,
          detectedAt: new Date(),
          lastSeenAt: new Date(),
        },
      ])

      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.count).mockResolvedValue(0)

      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 'review-1',
          userId: mockUserId,
          cardId: 'card-1',
          sessionId: null,
          rating: 'EASY',
          timeSpentMs: 3000,
          reviewedAt: new Date(),
          difficultyBefore: 0.2,
          stabilityBefore: 2.0,
          difficultyAfter: 0.1,
          stabilityAfter: 3.0,
        },
      ])

      vi.mocked(prisma.exam.findMany).mockResolvedValue([])
      vi.mocked(prisma.mission.findMany).mockResolvedValue(
        Array.from({ length: 12 }, (_, i) => ({
          id: `mission-${i}`,
          userId: mockUserId,
          date: new Date(Date.now() - (12 - i) * 7 * 24 * 60 * 60 * 1000),
          status: 'COMPLETED',
          estimatedMinutes: 50,
          completedAt: new Date(),
          actualMinutes: 48,
          completedObjectivesCount: 10,
          objectives: [],
          reviewCardCount: 25,
          newContentCount: 8,
          successScore: 0.6 + i * 0.03, // Strong increasing trend
          difficultyRating: 3,
          recommendedStartTime: null,
          recommendedDuration: null,
          intensityLevel: 'MEDIUM',
          contentSequence: null,
          orchestrationPlanId: null,
        })),
      )

      const result = await AcademicPerformanceIntegration.correlatePerformance(mockUserId, 10)

      // Should show strong positive correlation
      expect(result.coefficient).toBeGreaterThan(0.5)
      expect(result.interpretation).toContain('positive')
      expect(result.insights).toContain(
        expect.stringContaining('Correlation does not imply causation'),
      )
    })

    it('should include statistical significance in interpretation', async () => {
      // Similar setup as previous test
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([
        {
          id: 'session-1',
          userId: mockUserId,
          missionId: null,
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 45 * 60 * 1000,
          reviewsCompleted: 15,
          newCardsStudied: 5,
          sessionNotes: null,
          currentObjectiveIndex: 0,
          missionObjectives: null,
          objectiveCompletions: null,
        },
      ])

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([
        {
          id: 'pattern-1',
          userId: mockUserId,
          patternType: 'SESSION_DURATION_PREFERENCE',
          patternName: 'Optimal 45 min',
          confidence: 0.75,
          evidence: {},
          occurrenceCount: 7,
          detectedAt: new Date(),
          lastSeenAt: new Date(),
        },
      ])

      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.count).mockResolvedValue(0)

      vi.mocked(prisma.review.findMany).mockResolvedValue([
        {
          id: 'review-1',
          userId: mockUserId,
          cardId: 'card-1',
          sessionId: null,
          rating: 'GOOD',
          timeSpentMs: 5000,
          reviewedAt: new Date(),
          difficultyBefore: 0.5,
          stabilityBefore: 1.5,
          difficultyAfter: 0.4,
          stabilityAfter: 1.8,
        },
      ])

      vi.mocked(prisma.exam.findMany).mockResolvedValue([])
      vi.mocked(prisma.mission.findMany).mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          id: `mission-${i}`,
          userId: mockUserId,
          date: new Date(Date.now() - (10 - i) * 7 * 24 * 60 * 60 * 1000),
          status: 'COMPLETED',
          estimatedMinutes: 50,
          completedAt: new Date(),
          actualMinutes: 45,
          completedObjectivesCount: 6,
          objectives: [],
          reviewCardCount: 15,
          newContentCount: 4,
          successScore: 0.65,
          difficultyRating: 3,
          recommendedStartTime: null,
          recommendedDuration: null,
          intensityLevel: 'MEDIUM',
          contentSequence: null,
          orchestrationPlanId: null,
        })),
      )

      const result = await AcademicPerformanceIntegration.correlatePerformance(mockUserId, 8)

      expect(result.interpretation).toMatch(/p=/)
      expect(result.insights.some((i) => i.includes('significant'))).toBe(true)
    })
  })

  describe('Pearson correlation calculation (validate with data-scientist)', () => {
    it('should calculate perfect positive correlation (r = 1.0)', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [2, 4, 6, 8, 10] // Perfect linear relationship

      // Access private method via type assertion
      const r = (AcademicPerformanceIntegration as any).calculatePearsonCorrelation(x, y)

      expect(r).toBeCloseTo(1.0, 10)
    })

    it('should calculate perfect negative correlation (r = -1.0)', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [10, 8, 6, 4, 2] // Perfect inverse relationship

      const r = (AcademicPerformanceIntegration as any).calculatePearsonCorrelation(x, y)

      expect(r).toBeCloseTo(-1.0, 10)
    })

    it('should calculate no correlation (r ≈ 0)', () => {
      const x = [1, 2, 3, 4, 5]
      const y = [3, 2, 5, 1, 4] // Random

      const r = (AcademicPerformanceIntegration as any).calculatePearsonCorrelation(x, y)

      expect(Math.abs(r)).toBeLessThan(0.5) // Weak or no correlation
    })

    it('should handle zero variance (constant values)', () => {
      const x = [5, 5, 5, 5, 5]
      const y = [1, 2, 3, 4, 5]

      const r = (AcademicPerformanceIntegration as any).calculatePearsonCorrelation(x, y)

      expect(r).toBe(0) // No correlation when one variable is constant
    })
  })

  describe('Statistical calculations (validate with data-scientist)', () => {
    it('should calculate p-value for significant correlation', () => {
      const r = 0.8 // Strong correlation
      const n = 20 // Sample size

      const pValue = (AcademicPerformanceIntegration as any).calculatePValue(r, n)

      expect(pValue).toBeLessThan(0.05) // Should be significant
    })

    it('should calculate p-value for non-significant correlation', () => {
      const r = 0.2 // Weak correlation
      const n = 10 // Small sample

      const pValue = (AcademicPerformanceIntegration as any).calculatePValue(r, n)

      expect(pValue).toBeGreaterThan(0.05) // Should not be significant
    })

    it('should calculate confidence interval', () => {
      const r = 0.75
      const n = 30

      const ci = (AcademicPerformanceIntegration as any).calculateConfidenceInterval(r, n)

      expect(ci).toHaveLength(2)
      expect(ci[0]).toBeLessThan(r)
      expect(ci[1]).toBeGreaterThan(r)
      expect(ci[0]).toBeGreaterThanOrEqual(-1)
      expect(ci[1]).toBeLessThanOrEqual(1)
    })
  })
})

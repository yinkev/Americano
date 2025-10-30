// @ts-nocheck - Suppress TypeScript errors for vitest imports (project uses Jest)
/**
 * Unit Tests: RecommendationsEngine
 * Story 5.6 Task 5
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/db'
import { RecommendationsEngine } from '../recommendations-engine'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    behavioralPattern: {
      findMany: vi.fn(),
    },
    behavioralInsight: {
      findMany: vi.fn(),
    },
    interventionRecommendation: {
      findMany: vi.fn(),
    },
    recommendation: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    appliedRecommendation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studySession: {
      findMany: vi.fn(),
    },
    userLearningProfile: {
      findUnique: vi.fn(),
    },
  },
}))

describe('RecommendationsEngine', () => {
  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateRecommendations', () => {
    it('should generate recommendations from high-confidence patterns', async () => {
      const mockPatterns = [
        {
          id: 'pattern-1',
          userId: mockUserId,
          patternType: 'OPTIMAL_STUDY_TIME',
          patternName: 'Morning peak',
          confidence: 0.85,
          evidence: {
            hourOfDay: 7,
            sessionCount: 15,
            avgPerformanceScore: 85,
            timeOfDayScore: 90,
          },
          occurrenceCount: 5,
          detectedAt: new Date(),
          lastSeenAt: new Date(),
        },
      ]

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue(mockPatterns)
      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.interventionRecommendation.findMany).mockResolvedValue([])
      vi.mocked(prisma.recommendation.findMany).mockResolvedValue([])
      vi.mocked(prisma.recommendation.create).mockResolvedValue({
        id: 'rec-1',
        userId: mockUserId,
        recommendationType: 'STUDY_TIME_OPTIMIZATION',
        title: 'Study during your peak hours (7:00-8:00)',
        description: expect.any(String),
        actionableText: expect.any(String),
        confidence: 0.85,
        estimatedImpact: expect.any(Number),
        easeOfImplementation: expect.any(Number),
        userReadiness: expect.any(Number),
        priorityScore: expect.any(Number),
        sourcePatternIds: ['pattern-1'],
        sourceInsightIds: [],
        createdAt: new Date(),
        appliedAt: null,
        dismissedAt: null,
      })

      const recommendations = await RecommendationsEngine.generateRecommendations(mockUserId)

      expect(recommendations).toHaveLength(1)
      expect(recommendations[0].recommendationType).toBe('STUDY_TIME_OPTIMIZATION')
      expect(recommendations[0].confidence).toBe(0.85)
    })

    it('should skip generation if recent recommendations exist', async () => {
      const recentRec = {
        id: 'rec-1',
        userId: mockUserId,
        recommendationType: 'STUDY_TIME_OPTIMIZATION',
        title: 'Test',
        description: 'Test',
        actionableText: 'Test',
        confidence: 0.8,
        estimatedImpact: 0.7,
        easeOfImplementation: 0.6,
        userReadiness: 0.5,
        priorityScore: 0.7,
        sourcePatternIds: [],
        sourceInsightIds: [],
        createdAt: new Date(), // Recent (within 24h)
        appliedAt: null,
        dismissedAt: null,
      }

      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([])
      vi.mocked(prisma.behavioralInsight.findMany).mockResolvedValue([])
      vi.mocked(prisma.interventionRecommendation.findMany).mockResolvedValue([])
      vi.mocked(prisma.recommendation.findMany).mockResolvedValue([
        recentRec,
        recentRec,
        recentRec,
        recentRec,
        recentRec,
      ])

      const recommendations = await RecommendationsEngine.generateRecommendations(mockUserId)

      expect(recommendations).toHaveLength(5)
      expect(prisma.recommendation.create).not.toHaveBeenCalled()
    })
  })

  describe('prioritizeRecommendations', () => {
    it('should calculate priority scores correctly', () => {
      const recs = [
        {
          userId: mockUserId,
          recommendationType: 'STUDY_TIME_OPTIMIZATION' as const,
          title: 'Rec 1',
          description: 'Desc 1',
          actionableText: 'Action 1',
          confidence: 0.8, // 30%
          estimatedImpact: 0.9, // 40%
          easeOfImplementation: 0.7, // 20%
          userReadiness: 0.6, // 10%
          priorityScore: 0,
          sourcePatternIds: [],
          sourceInsightIds: [],
        },
        {
          userId: mockUserId,
          recommendationType: 'SESSION_DURATION_ADJUSTMENT' as const,
          title: 'Rec 2',
          description: 'Desc 2',
          actionableText: 'Action 2',
          confidence: 0.6,
          estimatedImpact: 0.5,
          easeOfImplementation: 0.9,
          userReadiness: 0.8,
          priorityScore: 0,
          sourcePatternIds: [],
          sourceInsightIds: [],
        },
      ]

      const prioritized = RecommendationsEngine.prioritizeRecommendations(recs)

      // Expected scores:
      // Rec 1: 0.8*0.3 + 0.9*0.4 + 0.7*0.2 + 0.6*0.1 = 0.24 + 0.36 + 0.14 + 0.06 = 0.80
      // Rec 2: 0.6*0.3 + 0.5*0.4 + 0.9*0.2 + 0.8*0.1 = 0.18 + 0.20 + 0.18 + 0.08 = 0.64

      expect(prioritized[0].priorityScore).toBeCloseTo(0.8, 2)
      expect(prioritized[1].priorityScore).toBeCloseTo(0.64, 2)
      expect(prioritized[0].title).toBe('Rec 1') // Higher score first
    })

    it('should diversify recommendations (max 2 per type)', () => {
      const recs = Array.from({ length: 5 }, (_, i) => ({
        userId: mockUserId,
        recommendationType: 'STUDY_TIME_OPTIMIZATION' as const,
        title: `Rec ${i}`,
        description: `Desc ${i}`,
        actionableText: `Action ${i}`,
        confidence: 0.8 - i * 0.1,
        estimatedImpact: 0.8,
        easeOfImplementation: 0.7,
        userReadiness: 0.6,
        priorityScore: 0,
        sourcePatternIds: [],
        sourceInsightIds: [],
      }))

      const prioritized = RecommendationsEngine.prioritizeRecommendations(recs)

      expect(prioritized).toHaveLength(2) // Max 2 of same type
    })
  })

  describe('trackRecommendationEffectiveness', () => {
    it('should create tracking record with baseline metrics', async () => {
      const mockRecommendation = {
        id: 'rec-1',
        userId: mockUserId,
        recommendationType: 'STUDY_TIME_OPTIMIZATION',
        title: 'Test',
        description: 'Test',
        actionableText: 'Test',
        confidence: 0.8,
        estimatedImpact: 0.7,
        easeOfImplementation: 0.6,
        userReadiness: 0.5,
        priorityScore: 0.7,
        sourcePatternIds: [],
        sourceInsightIds: [],
        createdAt: new Date(),
        appliedAt: null,
        dismissedAt: null,
      }

      vi.mocked(prisma.recommendation.findUnique).mockResolvedValue(mockRecommendation)
      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([])
      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        preferredStudyTimes: [],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.8,
        loadTolerance: null,
        avgCognitiveLoad: null,
        stressProfile: null,
      })
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([])
      vi.mocked(prisma.appliedRecommendation.create).mockResolvedValue({
        id: 'applied-1',
        recommendationId: 'rec-1',
        userId: mockUserId,
        appliedAt: new Date(),
        applicationType: 'AUTO',
        baselineMetrics: {
          avgConfidence: 0,
          behavioralScore: 0.8,
          sessionCount: 0,
          capturedAt: expect.any(String),
        },
        currentMetrics: null,
        effectiveness: null,
        userFeedbackRating: null,
        userNotes: null,
        evaluatedAt: null,
      })
      vi.mocked(prisma.recommendation.update).mockResolvedValue(mockRecommendation)

      const applied = await RecommendationsEngine.trackRecommendationEffectiveness(
        mockUserId,
        'rec-1',
        'AUTO',
      )

      expect(applied).toBeDefined()
      expect(applied.recommendationId).toBe('rec-1')
      expect(applied.applicationType).toBe('AUTO')
      expect(prisma.recommendation.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: { appliedAt: expect.any(Date) },
      })
    })
  })

  describe('evaluateRecommendationEffectiveness', () => {
    it('should throw error if less than 2 weeks elapsed', async () => {
      const recentApplication = {
        id: 'applied-1',
        recommendationId: 'rec-1',
        userId: mockUserId,
        appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        applicationType: 'AUTO' as const,
        baselineMetrics: { behavioralScore: 70 },
        currentMetrics: null,
        effectiveness: null,
        userFeedbackRating: null,
        userNotes: null,
        evaluatedAt: null,
      }

      vi.mocked(prisma.appliedRecommendation.findUnique).mockResolvedValue(recentApplication)

      await expect(
        RecommendationsEngine.evaluateRecommendationEffectiveness('applied-1'),
      ).rejects.toThrow(/requires 2 weeks/)
    })

    it('should calculate effectiveness after 2 weeks', async () => {
      const twoWeeksAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      const application = {
        id: 'applied-1',
        recommendationId: 'rec-1',
        userId: mockUserId,
        appliedAt: twoWeeksAgo,
        applicationType: 'AUTO' as const,
        baselineMetrics: { behavioralScore: 70, avgConfidence: 0.6 },
        currentMetrics: null,
        effectiveness: null,
        userFeedbackRating: null,
        userNotes: null,
        evaluatedAt: null,
      }

      vi.mocked(prisma.appliedRecommendation.findUnique).mockResolvedValue(application)
      vi.mocked(prisma.behavioralPattern.findMany).mockResolvedValue([])
      vi.mocked(prisma.userLearningProfile.findUnique).mockResolvedValue({
        id: 'profile-1',
        userId: mockUserId,
        preferredStudyTimes: [],
        averageSessionDuration: 45,
        optimalSessionDuration: 50,
        contentPreferences: {},
        learningStyleProfile: {},
        personalizedForgettingCurve: {},
        lastAnalyzedAt: new Date(),
        dataQualityScore: 0.9, // Improved from 0.7 baseline
        loadTolerance: null,
        avgCognitiveLoad: null,
        stressProfile: null,
      })
      vi.mocked(prisma.studySession.findMany).mockResolvedValue([])
      vi.mocked(prisma.appliedRecommendation.update).mockResolvedValue({
        ...application,
        effectiveness: 0.25,
        evaluatedAt: new Date(),
      })

      const effectiveness =
        await RecommendationsEngine.evaluateRecommendationEffectiveness('applied-1')

      expect(effectiveness).toBeGreaterThanOrEqual(0)
      expect(effectiveness).toBeLessThanOrEqual(1)
      expect(prisma.appliedRecommendation.update).toHaveBeenCalled()
    })
  })
})

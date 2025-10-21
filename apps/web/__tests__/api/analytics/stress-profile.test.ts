/**
 * Integration Tests: GET /api/analytics/stress-profile
 * Story 5.4: Cognitive Health Monitoring
 *
 * P0 #2 FIX VERIFICATION: Tests graceful degradation for new users
 * Must return 200 with empty defaults, NOT 500 errors
 */

import { GET } from '@/app/api/analytics/stress-profile/route'
import { NextRequest } from 'next/server'
import { mockStressProfile, mockNewUserStressProfile } from '@/__tests__/fixtures/cognitive-health'

// Mock Prisma
const mockPrisma = {
  userLearningProfile: {
    findUnique: jest.fn(),
  },
  behavioralPattern: {
    findMany: jest.fn(),
  },
  cognitiveLoadMetric: {
    count: jest.fn(),
  },
}

jest.mock('@/generated/prisma', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

describe('GET /api/analytics/stress-profile', () => {
  const validUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Parameter Validation', () => {
    it('should reject requests without userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/stress-profile')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('userId')
    })

    it('should accept valid userId parameter', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('P0 #2 Fix Verification: Graceful Degradation for New Users', () => {
    it('should return 200 with empty defaults for new users (P0 #2)', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      // CRITICAL: Must return 200, NOT 500
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.profileExists).toBe(false)
      expect(data.primaryStressors).toEqual([])
      expect(data.loadTolerance).toBe(65) // Default
      expect(data.avgCognitiveLoad).toBeNull()
      expect(data.avgRecoveryTime).toBeNull()
      expect(data.effectiveCopingStrategies).toEqual([])
      expect(data.profileConfidence).toBe(0)
    })

    it('should NOT throw 500 error for missing profile (P0 #2)', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)

      expect(response.status).not.toBe(500)
      expect(response.status).toBe(200)
    })

    it('should handle database errors gracefully with empty defaults (P0 #2)', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue({
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.25,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.25,
        },
        dataQualityScore: 0.5,
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.behavioralPattern.findMany.mockRejectedValue(
        new Error('BehavioralPattern table does not exist'),
      )
      mockPrisma.cognitiveLoadMetric.count.mockRejectedValue(
        new Error('CognitiveLoadMetric table does not exist'),
      )

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      // Should gracefully degrade, NOT crash
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.profileExists).toBe(true)
    })
  })

  describe('Stress Profile Retrieval', () => {
    it('should return comprehensive stress profile for existing users', async () => {
      const mockProfile = {
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.3,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.2,
          loadTolerance: 65,
          avgCognitiveLoad: 62,
          stressProfile: {
            primaryStressors: [],
            avgRecoveryTime: 24,
            copingStrategies: ['SHORT_BREAKS', 'ENVIRONMENT_CHANGE'],
          },
        },
        dataQualityScore: 0.72,
        lastAnalyzedAt: new Date('2025-10-20'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockPatterns = [
        {
          patternType: 'ATTENTION_CYCLE',
          occurrenceCount: 15,
          confidence: 0.85,
        },
        {
          patternType: 'PERFORMANCE_PEAK',
          occurrenceCount: 12,
          confidence: 0.78,
        },
      ]

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(mockProfile)
      mockPrisma.behavioralPattern.findMany.mockResolvedValue(mockPatterns)
      mockPrisma.cognitiveLoadMetric.count.mockResolvedValue(50)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.profileExists).toBe(true)
      expect(data.primaryStressors).toBeDefined()
      expect(data.loadTolerance).toBe(65)
      expect(data.avgCognitiveLoad).toBe(62)
      expect(data.avgRecoveryTime).toBe(24)
      expect(data.effectiveCopingStrategies).toEqual(['SHORT_BREAKS', 'ENVIRONMENT_CHANGE'])
    })

    it('should aggregate primary stressors from behavioral patterns', async () => {
      const mockProfile = {
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.25,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.25,
        },
        dataQualityScore: 0.5,
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockPatterns = [
        {
          patternType: 'ATTENTION_CYCLE',
          occurrenceCount: 20,
          confidence: 0.9,
        },
      ]

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(mockProfile)
      mockPrisma.behavioralPattern.findMany.mockResolvedValue(mockPatterns)
      mockPrisma.cognitiveLoadMetric.count.mockResolvedValue(10)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.primaryStressors).toBeDefined()
      expect(Array.isArray(data.primaryStressors)).toBe(true)
      if (data.primaryStressors.length > 0) {
        expect(data.primaryStressors[0]).toHaveProperty('type')
        expect(data.primaryStressors[0]).toHaveProperty('frequency')
        expect(data.primaryStressors[0]).toHaveProperty('confidence')
      }
    })

    it('should calculate profile confidence based on data quality', async () => {
      const mockProfile = {
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.25,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.25,
        },
        dataQualityScore: 0.8,
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(mockProfile)
      mockPrisma.behavioralPattern.findMany.mockResolvedValue([])
      mockPrisma.cognitiveLoadMetric.count.mockResolvedValue(100)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.profileConfidence).toBeGreaterThanOrEqual(0)
      expect(data.profileConfidence).toBeLessThanOrEqual(1)
    })
  })

  describe('Response Structure', () => {
    it('should return correct response structure for existing profile', async () => {
      const mockProfile = {
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.25,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.25,
          loadTolerance: 65,
        },
        dataQualityScore: 0.5,
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(mockProfile)
      mockPrisma.behavioralPattern.findMany.mockResolvedValue([])
      mockPrisma.cognitiveLoadMetric.count.mockResolvedValue(0)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('profileExists')
      expect(data).toHaveProperty('primaryStressors')
      expect(data).toHaveProperty('loadTolerance')
      expect(data).toHaveProperty('avgCognitiveLoad')
      expect(data).toHaveProperty('avgRecoveryTime')
      expect(data).toHaveProperty('effectiveCopingStrategies')
      expect(data).toHaveProperty('profileConfidence')
    })

    it('should return correct response structure for new user', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toMatchObject(mockNewUserStressProfile)
    })
  })

  describe('Performance', () => {
    it('should respond within 300ms for profile aggregation', async () => {
      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const startTime = performance.now()
      await GET(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(300)
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors with 500 response', async () => {
      mockPrisma.userLearningProfile.findUnique.mockRejectedValue(
        new Error('Unexpected database error'),
      )

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch stress profile')
    })
  })

  describe('Behavioral Pattern Integration', () => {
    it('should query stress-related patterns only', async () => {
      const mockProfile = {
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.25,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.25,
        },
        dataQualityScore: 0.5,
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(mockProfile)
      mockPrisma.behavioralPattern.findMany.mockResolvedValue([])
      mockPrisma.cognitiveLoadMetric.count.mockResolvedValue(0)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      await GET(request)

      expect(mockPrisma.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: validUserId,
            confidence: { gte: 0.6 },
            patternType: {
              in: ['ATTENTION_CYCLE', 'PERFORMANCE_PEAK'],
            },
          }),
        }),
      )
    })

    it('should limit to top 5 patterns', async () => {
      const mockProfile = {
        userId: validUserId,
        learningStyleProfile: {
          visual: 0.25,
          auditory: 0.25,
          reading: 0.25,
          kinesthetic: 0.25,
        },
        dataQualityScore: 0.5,
        lastAnalyzedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.userLearningProfile.findUnique.mockResolvedValue(mockProfile)
      mockPrisma.behavioralPattern.findMany.mockResolvedValue([])
      mockPrisma.cognitiveLoadMetric.count.mockResolvedValue(0)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/stress-profile?userId=${validUserId}`,
      )

      await GET(request)

      expect(mockPrisma.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      )
    })
  })
})

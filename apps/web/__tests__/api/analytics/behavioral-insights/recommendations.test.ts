/**
 * Integration Tests: GET /api/analytics/behavioral-insights/recommendations
 * Story 5.5/5.6: Personalization and Behavioral Insights
 *
 * Tests recommendation generation and filtering
 */

import { GET } from '@/app/api/analytics/behavioral-insights/recommendations/route'
import { NextRequest } from 'next/server'

// Mock dependencies
const mockRecommendationsEngine = {
  generateRecommendations: jest.fn(),
}

jest.mock('@/subsystems/behavioral-analytics/recommendations-engine', () => ({
  RecommendationsEngine: mockRecommendationsEngine,
}))

jest.mock('@/lib/cache', () => ({
  withCache: jest.fn(async (key, ttl, fn) => await fn()),
  CACHE_TTL: {
    SHORT: 60 * 1000,
    MEDIUM: 300 * 1000,
    LONG: 600 * 1000,
  },
}))

const mockRecommendations = [
  {
    id: 'rec-1',
    userId: 'test-user-id',
    recommendationType: 'STUDY_TIME_OPTIMIZATION',
    title: 'Study during your peak hours (14:00-15:00)',
    description: 'Your performance peaks at 2pm - schedule study sessions during this time',
    priority: 'HIGH',
    confidence: 0.85,
    estimatedImpact: 15,
    appliedAt: null,
    createdAt: new Date(),
  },
  {
    id: 'rec-2',
    userId: 'test-user-id',
    recommendationType: 'SESSION_DURATION_ADJUSTMENT',
    title: 'Optimize session length to 45 minutes',
    description: 'Your attention peaks at 45 minutes - adjust session duration',
    priority: 'MEDIUM',
    confidence: 0.78,
    estimatedImpact: 10,
    appliedAt: new Date(), // Already applied
    createdAt: new Date(),
  },
  {
    id: 'rec-3',
    userId: 'test-user-id',
    recommendationType: 'CONTENT_TYPE_BALANCE',
    title: 'Increase flashcards content to 40%',
    description: 'You perform better with flashcards - increase their proportion',
    priority: 'MEDIUM',
    confidence: 0.72,
    estimatedImpact: 8,
    appliedAt: null,
    createdAt: new Date(),
  },
]

describe('GET /api/analytics/behavioral-insights/recommendations', () => {
  const validUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Parameter Validation', () => {
    it('should reject requests without userId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/behavioral-insights/recommendations',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should accept valid userId parameter', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should use default limit of 5', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.count).toBeLessThanOrEqual(5)
    })

    it('should accept custom limit parameter', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}&limit=10`,
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should reject limit outside [1, 20] range', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}&limit=30`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should accept includeApplied parameter', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}&includeApplied=true`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should include applied recommendations
      expect(data.data.count).toBe(3)
    })

    it('should default includeApplied to false', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      // Should exclude applied recommendations (only 2 unapplied)
      expect(data.data.count).toBe(2)
    })
  })

  describe('Recommendation Generation', () => {
    it('should generate recommendations successfully', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.recommendations).toBeDefined()
      expect(Array.isArray(data.data.recommendations)).toBe(true)
    })

    it('should call RecommendationsEngine with correct userId', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      await GET(request)

      expect(mockRecommendationsEngine.generateRecommendations).toHaveBeenCalledWith(validUserId)
      expect(mockRecommendationsEngine.generateRecommendations).toHaveBeenCalledTimes(1)
    })

    it('should filter out applied recommendations by default', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      const hasApplied = data.data.recommendations.some((r: any) => r.appliedAt !== null)
      expect(hasApplied).toBe(false)
    })

    it('should include applied recommendations when requested', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}&includeApplied=true`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.count).toBe(3)
    })

    it('should respect limit parameter', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}&limit=1`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.count).toBe(1)
      expect(data.data.recommendations).toHaveLength(1)
    })

    it('should return empty array for user with no recommendations', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.recommendations).toHaveLength(0)
      expect(data.data.count).toBe(0)
    })
  })

  describe('Response Structure', () => {
    it('should return correct response structure', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('recommendations')
      expect(data.data).toHaveProperty('count')
      expect(data.data).toHaveProperty('total')
    })

    it('should include all recommendation fields', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue([mockRecommendations[0]])

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      const rec = data.data.recommendations[0]
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('recommendationType')
      expect(rec).toHaveProperty('title')
      expect(rec).toHaveProperty('description')
      expect(rec).toHaveProperty('priority')
      expect(rec).toHaveProperty('confidence')
      expect(rec).toHaveProperty('estimatedImpact')
    })

    it('should include count and total in response', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}&limit=1`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.count).toBe(1) // Limited count
      expect(data.data.total).toBe(2) // Total unapplied recommendations
    })
  })

  describe('Caching Behavior', () => {
    it('should use cache wrapper for queries', async () => {
      const { withCache } = require('@/lib/cache')
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      await GET(request)

      expect(withCache).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should respond within 500ms (P95 target)', async () => {
      mockRecommendationsEngine.generateRecommendations.mockResolvedValue(mockRecommendations)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const startTime = performance.now()
      await GET(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500)
    })
  })

  describe('Error Handling', () => {
    it('should handle engine errors gracefully', async () => {
      mockRecommendationsEngine.generateRecommendations.mockRejectedValue(
        new Error('Failed to generate recommendations'),
      )

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/behavioral-insights/recommendations?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})

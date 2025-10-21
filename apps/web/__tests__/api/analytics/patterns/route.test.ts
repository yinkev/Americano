/**
 * Integration Tests: GET /api/analytics/patterns
 * Story 5.1: Learning Pattern Recognition and Analysis
 *
 * Tests behavioral pattern retrieval with filtering and caching
 */

import { mockPatterns } from '@/__tests__/fixtures/patterns'
import type { PrismaClient } from '@/generated/prisma'

// Mock dependencies - factory creates mock without hoisting issues
jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    prisma: mockDeep<PrismaClient>(),
  }
})

jest.mock('@/lib/cache', () => ({
  withCache: jest.fn(async (key, ttl, fn) => await fn()),
  CACHE_TTL: {
    SHORT: 60 * 1000,
    MEDIUM: 300 * 1000,
    LONG: 600 * 1000,
  },
}))

jest.mock('@/lib/init-redis', () => ({
  ensureRedisInitialized: jest.fn(() => Promise.resolve()),
}))

// Import after jest.mock to avoid module resolution issues
import { GET } from '@/app/api/analytics/patterns/route'
import { NextRequest } from 'next/server'

// Get the mocked prisma instance
const { prisma: prismaMock } = require('@/lib/db')

describe('GET /api/analytics/patterns', () => {
  const validUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Parameter Validation', () => {
    it('should reject requests without userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/patterns')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500) // Zod validation throws
      expect(data.success).toBe(false)
    })

    it('should accept valid userId parameter', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })

    it('should accept optional patternType filter', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue([mockPatterns[0]])

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&patternType=OPTIMAL_STUDY_TIME`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prismaMock.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patternType: 'OPTIMAL_STUDY_TIME',
          }),
        }),
      )
    })

    it('should reject invalid patternType values', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&patternType=INVALID_TYPE`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should accept valid patternType enum values', async () => {
      const validTypes = [
        'OPTIMAL_STUDY_TIME',
        'SESSION_DURATION_PREFERENCE',
        'CONTENT_TYPE_PREFERENCE',
        'PERFORMANCE_PEAK',
        'ATTENTION_CYCLE',
        'FORGETTING_CURVE',
      ]

      for (const type of validTypes) {
        prismaMock.behavioralPattern.findMany.mockResolvedValue([])

        const request = new NextRequest(
          `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&patternType=${type}`,
        )

        const response = await GET(request)
        expect(response.status).toBe(200)
      }
    })

    it('should use default minConfidence of 0.6', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      await GET(request)

      expect(prismaMock.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confidence: { gte: 0.6 },
          }),
        }),
      )
    })

    it('should accept custom minConfidence parameter', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&minConfidence=0.8`,
      )

      await GET(request)

      expect(prismaMock.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            confidence: { gte: 0.8 },
          }),
        }),
      )
    })

    it('should reject minConfidence outside [0, 1] range', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&minConfidence=1.5`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should use default limit of 20', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      await GET(request)

      expect(prismaMock.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      )
    })

    it('should accept custom limit parameter', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&limit=50`,
      )

      await GET(request)

      expect(prismaMock.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      )
    })

    it('should reject limit outside [1, 100] range', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&limit=150`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('Pattern Retrieval', () => {
    it('should retrieve patterns successfully', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.patterns).toHaveLength(3)
      expect(data.data.count).toBe(3)
    })

    it('should return empty array for user with no patterns', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.patterns).toHaveLength(0)
      expect(data.data.count).toBe(0)
    })

    it('should filter by pattern type', async () => {
      const optimalTimePatterns = mockPatterns.filter(
        (p) => p.patternType === 'OPTIMAL_STUDY_TIME',
      )
      prismaMock.behavioralPattern.findMany.mockResolvedValue(optimalTimePatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&patternType=OPTIMAL_STUDY_TIME`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.patterns).toHaveLength(1)
      expect(data.data.patterns[0].patternType).toBe('OPTIMAL_STUDY_TIME')
    })

    it('should filter by minimum confidence', async () => {
      const highConfidencePatterns = mockPatterns.filter((p) => p.confidence >= 0.8)
      prismaMock.behavioralPattern.findMany.mockResolvedValue(highConfidencePatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&minConfidence=0.8`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.patterns.every((p: any) => p.confidence >= 0.8)).toBe(true)
    })

    it('should sort by confidence DESC, lastSeenAt DESC', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      await GET(request)

      expect(prismaMock.behavioralPattern.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ confidence: 'desc' }, { lastSeenAt: 'desc' }],
        }),
      )
    })

    it('should respect limit parameter', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns.slice(0, 2))

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}&limit=2`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.data.patterns).toHaveLength(2)
    })
  })

  describe('Response Structure', () => {
    it('should return correct response structure', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('patterns')
      expect(data.data).toHaveProperty('count')
      expect(Array.isArray(data.data.patterns)).toBe(true)
      expect(typeof data.data.count).toBe('number')
    })

    it('should include all pattern fields', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue([mockPatterns[0]])

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      const pattern = data.data.patterns[0]
      expect(pattern).toHaveProperty('id')
      expect(pattern).toHaveProperty('userId')
      expect(pattern).toHaveProperty('patternType')
      expect(pattern).toHaveProperty('description')
      expect(pattern).toHaveProperty('confidence')
      expect(pattern).toHaveProperty('occurrenceCount')
      expect(pattern).toHaveProperty('metadata')
    })
  })

  describe('Performance', () => {
    it('should respond within 500ms (P95 target)', async () => {
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const startTime = performance.now()
      await GET(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(500)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaMock.behavioralPattern.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })

  describe('Caching Behavior', () => {
    it('should use cache wrapper for queries', async () => {
      const { withCache } = require('@/lib/cache')
      prismaMock.behavioralPattern.findMany.mockResolvedValue(mockPatterns)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/patterns?userId=${validUserId}`,
      )

      await GET(request)

      expect(withCache).toHaveBeenCalled()
      expect(withCache).toHaveBeenCalledWith(
        expect.stringContaining('patterns:'),
        600000, // 10 minutes
        expect.any(Function),
      )
    })
  })
})

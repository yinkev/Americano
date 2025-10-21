/**
 * Integration Tests: GET /api/analytics/cognitive-load/current
 * Story 5.4: Cognitive Health Monitoring
 *
 * Tests real-time cognitive load monitoring endpoint
 */

import { GET } from '@/app/api/analytics/cognitive-load/current/route'
import { NextRequest } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { mockCognitiveLoadMetric } from '@/__tests__/fixtures/cognitive-health'

// Mock Prisma
const mockPrisma = {
  cognitiveLoadMetric: {
    findFirst: jest.fn(),
  },
  studySession: {
    findUnique: jest.fn(),
  },
}

jest.mock('@/generated/prisma', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

describe('GET /api/analytics/cognitive-load/current', () => {
  const validUserId = 'test-user-id'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Query Parameter Validation', () => {
    it('should reject requests without userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/cognitive-load/current')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('userId')
    })

    it('should accept valid userId parameter', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(mockCognitiveLoadMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Cognitive Load Retrieval', () => {
    it('should return null state for new users with no data', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.loadScore).toBeNull()
      expect(data.loadLevel).toBeNull()
      expect(data.stressIndicators).toEqual([])
      expect(data.timestamp).toBeNull()
      expect(data.trend).toBeNull()
      expect(data.sessionActive).toBe(false)
      expect(data.confidenceLevel).toBeNull()
    })

    it('should return current cognitive load for existing data', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(mockCognitiveLoadMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.loadScore).toBe(65)
      expect(data.loadLevel).toBe('MODERATE')
      expect(data.stressIndicators).toEqual(['TASK_COMPLEXITY', 'TIME_PRESSURE'])
      expect(data.timestamp).toBeDefined()
      expect(data.confidenceLevel).toBe(0.82)
    })

    it('should correctly determine load level based on score', async () => {
      const testCases = [
        { loadScore: 25, expectedLevel: 'LOW' },
        { loadScore: 50, expectedLevel: 'MODERATE' },
        { loadScore: 70, expectedLevel: 'HIGH' },
        { loadScore: 85, expectedLevel: 'CRITICAL' },
      ]

      for (const { loadScore, expectedLevel } of testCases) {
        mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
          ...mockCognitiveLoadMetric,
          loadScore,
        })

        const request = new NextRequest(
          `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
        )

        const response = await GET(request)
        const data = await response.json()

        expect(data.loadLevel).toBe(expectedLevel)
      }
    })
  })

  describe('Trend Calculation', () => {
    it('should calculate "up" trend when load increases >10 points', async () => {
      const currentMetric = { ...mockCognitiveLoadMetric, loadScore: 75 }
      const previousMetric = {
        ...mockCognitiveLoadMetric,
        loadScore: 60,
        timestamp: new Date('2025-10-19T14:30:00Z'),
      }

      mockPrisma.cognitiveLoadMetric.findFirst
        .mockResolvedValueOnce(currentMetric)
        .mockResolvedValueOnce(previousMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.trend).toBe('up')
    })

    it('should calculate "down" trend when load decreases >10 points', async () => {
      const currentMetric = { ...mockCognitiveLoadMetric, loadScore: 45 }
      const previousMetric = {
        ...mockCognitiveLoadMetric,
        loadScore: 60,
        timestamp: new Date('2025-10-19T14:30:00Z'),
      }

      mockPrisma.cognitiveLoadMetric.findFirst
        .mockResolvedValueOnce(currentMetric)
        .mockResolvedValueOnce(previousMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.trend).toBe('down')
    })

    it('should calculate "stable" trend when load changes ≤10 points', async () => {
      const currentMetric = { ...mockCognitiveLoadMetric, loadScore: 65 }
      const previousMetric = {
        ...mockCognitiveLoadMetric,
        loadScore: 60,
        timestamp: new Date('2025-10-19T14:30:00Z'),
      }

      mockPrisma.cognitiveLoadMetric.findFirst
        .mockResolvedValueOnce(currentMetric)
        .mockResolvedValueOnce(previousMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.trend).toBe('stable')
    })

    it('should default to "stable" when no previous metric exists', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst
        .mockResolvedValueOnce(mockCognitiveLoadMetric)
        .mockResolvedValueOnce(null)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.trend).toBe('stable')
    })
  })

  describe('Session Active Status', () => {
    it('should return true when session is active (completedAt is null)', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(mockCognitiveLoadMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.sessionActive).toBe(true)
    })

    it('should return false when session is completed', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(mockCognitiveLoadMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({
        completedAt: new Date('2025-10-20T15:00:00Z'),
      })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.sessionActive).toBe(false)
    })

    it('should return false when no sessionId exists', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue({
        ...mockCognitiveLoadMetric,
        sessionId: null,
      })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.sessionActive).toBe(false)
    })
  })

  describe('Response Structure', () => {
    it('should return correct response structure with data', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(mockCognitiveLoadMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('loadScore')
      expect(data).toHaveProperty('loadLevel')
      expect(data).toHaveProperty('stressIndicators')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('trend')
      expect(data).toHaveProperty('sessionActive')
      expect(data).toHaveProperty('confidenceLevel')
    })

    it('should return correct response structure for null state', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.loadScore).toBeNull()
      expect(data.loadLevel).toBeNull()
      expect(data.stressIndicators).toEqual([])
    })
  })

  describe('Performance', () => {
    it('should respond within 200ms for fast read queries', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockResolvedValue(mockCognitiveLoadMetric)
      mockPrisma.studySession.findUnique.mockResolvedValue({ completedAt: null })

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const startTime = performance.now()
      await GET(request)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.cognitiveLoadMetric.findFirst.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const request = new NextRequest(
        `http://localhost:3000/api/analytics/cognitive-load/current?userId=${validUserId}`,
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to fetch')
    })
  })
})

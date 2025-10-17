/**
 * Unit Tests: GET /api/analytics/behavioral-insights/recommendations
 *
 * Story 5.6 Task 6 - API Testing
 */

import { NextRequest } from 'next/server'
import { GET } from '../recommendations/route'
import { prisma } from '@/lib/db'
import { RecommendationsEngine } from '@/subsystems/behavioral-analytics/recommendations-engine'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    recommendation: {
      findMany: jest.fn(),
    },
    behavioralPattern: {
      findMany: jest.fn(),
    },
    behavioralInsight: {
      findMany: jest.fn(),
    },
    interventionRecommendation: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('@/subsystems/behavioral-analytics/recommendations-engine')

describe('GET /api/analytics/behavioral-insights/recommendations', () => {
  const mockUserId = 'test-user-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return top 5 recommendations by default', async () => {
    const mockRecommendations = Array.from({ length: 10 }, (_, i) => ({
      id: `rec-${i}`,
      userId: mockUserId,
      recommendationType: 'STUDY_TIME_OPTIMIZATION',
      title: `Recommendation ${i}`,
      description: `Description ${i}`,
      confidence: 0.8,
      appliedAt: null,
      createdAt: new Date(),
    }))

    ;(RecommendationsEngine.generateRecommendations as jest.Mock).mockResolvedValue(
      mockRecommendations
    )

    const request = new NextRequest(
      `http://localhost/api/analytics/behavioral-insights/recommendations?userId=${mockUserId}`
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.recommendations).toHaveLength(5)
    expect(data.data.count).toBe(5)
    expect(data.data.total).toBe(10)
  })

  it('should filter out applied recommendations when includeApplied=false', async () => {
    const mockRecommendations = [
      {
        id: 'rec-1',
        userId: mockUserId,
        recommendationType: 'STUDY_TIME_OPTIMIZATION',
        title: 'Applied Rec',
        description: 'Applied',
        confidence: 0.8,
        appliedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'rec-2',
        userId: mockUserId,
        recommendationType: 'SESSION_DURATION_ADJUSTMENT',
        title: 'Pending Rec',
        description: 'Pending',
        confidence: 0.9,
        appliedAt: null,
        createdAt: new Date(),
      },
    ]

    ;(RecommendationsEngine.generateRecommendations as jest.Mock).mockResolvedValue(
      mockRecommendations
    )

    const request = new NextRequest(
      `http://localhost/api/analytics/behavioral-insights/recommendations?userId=${mockUserId}&includeApplied=false`
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.recommendations).toHaveLength(1)
    expect(data.data.recommendations[0].id).toBe('rec-2')
  })

  it('should respect custom limit parameter', async () => {
    const mockRecommendations = Array.from({ length: 10 }, (_, i) => ({
      id: `rec-${i}`,
      userId: mockUserId,
      recommendationType: 'STUDY_TIME_OPTIMIZATION',
      title: `Recommendation ${i}`,
      description: `Description ${i}`,
      confidence: 0.8,
      appliedAt: null,
      createdAt: new Date(),
    }))

    ;(RecommendationsEngine.generateRecommendations as jest.Mock).mockResolvedValue(
      mockRecommendations
    )

    const request = new NextRequest(
      `http://localhost/api/analytics/behavioral-insights/recommendations?userId=${mockUserId}&limit=3`
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.recommendations).toHaveLength(3)
  })

  it('should return 400 for invalid limit parameter', async () => {
    const request = new NextRequest(
      `http://localhost/api/analytics/behavioral-insights/recommendations?userId=${mockUserId}&limit=100`
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('should return 400 for missing userId parameter', async () => {
    const request = new NextRequest(
      'http://localhost/api/analytics/behavioral-insights/recommendations'
    )

    const response = await GET(request)

    expect(response.status).toBe(400)
  })
})

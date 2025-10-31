import { NextRequest } from 'next/server'
import type { PrismaClient } from '@/generated/prisma'
import type { DeepMockProxy } from 'jest-mock-extended'

jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    prisma: mockDeep<PrismaClient>(),
  }
})

import { GET } from '@/app/api/analytics/export/route'
import { prisma } from '@/lib/db'

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('GET /api/analytics/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns behavioral export with mock provenance metadata', async () => {
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-123',
      email: 'kevy@americano.dev',
      name: 'Kevy',
    } as any)

    prismaMock.behavioralPattern.findMany.mockResolvedValue([
      {
        id: 'pattern-1',
        patternType: 'OPTIMAL_STUDY_TIME',
        patternName: 'Late Night Focus',
        confidence: 0.86,
        evidence: { optimalTimes: ['8pm-10pm'] },
        detectedAt: new Date('2025-10-15T00:00:00Z'),
        lastSeenAt: new Date('2025-10-20T00:00:00Z'),
        occurrenceCount: 4,
        insightPatterns: [{ insightId: 'insight-1' }],
      },
    ] as any)

    prismaMock.behavioralInsight.findMany.mockResolvedValue([
      {
        id: 'insight-1',
        insightType: 'FOCUS',
        title: 'Evening focus detected',
        description: 'You perform better in the evenings.',
        actionableRecommendation: 'Plan intense study sessions after 7pm',
        confidence: 0.8,
        createdAt: new Date('2025-10-16T00:00:00Z'),
        acknowledgedAt: null,
        applied: false,
        insightPatterns: [{ patternId: 'pattern-1' }],
      },
    ] as any)

    prismaMock.userLearningProfile.findUnique.mockResolvedValue({
      id: 'profile-1',
      preferredStudyTimes: ['evening'],
      averageSessionDuration: 50,
      optimalSessionDuration: 55,
      contentPreferences: { format: 'video' },
      learningStyleProfile: { primary: 'visual' },
      personalizedForgettingCurve: { halfLife: 6 },
      lastAnalyzedAt: new Date('2025-10-18T00:00:00Z'),
      dataQualityScore: 0.92,
    } as any)

    const request = new NextRequest('http://localhost/api/analytics/export')

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.metadata.mock.isMockData).toBe(true)
    expect(body.metadata.mock.dataSource).toBe('prisma.seed.analytics')
    expect(body.metadata.mock.endpoint).toBe('analytics/export')
    expect(typeof body.metadata.mock.generatedAt).toBe('string')
    expect(body.metadata.totalPatterns).toBe(1)
    expect(body.metadata.totalInsights).toBe(1)
  })
})

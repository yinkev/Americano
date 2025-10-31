import { NextRequest } from 'next/server'
import type { PrismaClient } from '@/generated/prisma'
import type { DeepMockProxy } from 'jest-mock-extended'

jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    prisma: mockDeep<PrismaClient>(),
  }
})

import { GET } from '@/app/api/analytics/study-time/route'
import { prisma } from '@/lib/db'

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('GET /api/analytics/study-time', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns study analytics with mock metadata', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'kevy@americano.dev',
    } as any)

    prismaMock.studySession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        userId: 'user-123',
        startedAt: new Date('2025-10-20T10:00:00Z'),
        completedAt: new Date('2025-10-20T10:45:00Z'),
        durationMs: 45 * 60 * 1000,
        missionId: 'mission-1',
        newCardsStudied: 3,
        sessionNotes: 'Focused session',
        reviews: [
          {
            id: 'review-1',
            rating: 'GOOD',
            timeSpentMs: 60 * 1000,
          },
        ],
        mission: {
          id: 'mission-1',
          date: new Date('2025-10-20T00:00:00Z'),
          estimatedMinutes: 60,
          completedObjectivesCount: 5,
        },
      },
    ] as any)

    const request = new NextRequest('http://localhost/api/analytics/study-time?period=week')

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.metadata.period).toBe('week')
    expect(body.data.metadata.mock.isMockData).toBe(true)
    expect(body.data.metadata.mock.endpoint).toBe('analytics/study-time')
    expect(body.data.metadata.mock.dataSource).toBe('prisma.seed.analytics')
    expect(Array.isArray(body.data.dailyTime)).toBe(true)
    expect(typeof body.data.metadata.mock.generatedAt).toBe('string')
  })
})

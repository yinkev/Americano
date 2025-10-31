import { NextRequest } from 'next/server'
import type { PrismaClient } from '@/generated/prisma'
import type { DeepMockProxy } from 'jest-mock-extended'

jest.mock('@/lib/db', () => {
  const { mockDeep } = require('jest-mock-extended')
  return {
    prisma: mockDeep<PrismaClient>(),
  }
})

import { GET } from '@/app/api/analytics/missions/trends/route'
import { prisma } from '@/lib/db'

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

describe('GET /api/analytics/missions/trends', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns trend data with mock metadata', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'kevy@americano.dev',
      name: 'Kevy',
    } as any)

    prismaMock.mission.findMany.mockResolvedValue([
      {
        id: 'mission-1',
        userId: 'user-123',
        status: 'COMPLETED',
        date: new Date('2025-10-20T00:00:00Z'),
        actualMinutes: 45,
        estimatedMinutes: 60,
        successScore: 0.82,
        completedObjectivesCount: 5,
      },
    ] as any)

    const request = new NextRequest(
      'http://localhost/api/analytics/missions/trends?metric=completion_rate&granularity=daily&period=7d',
    )

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.data)).toBe(true)
    expect(body.data.metadata.metric).toBe('completion_rate')
    expect(body.data.metadata.mock.isMockData).toBe(true)
    expect(body.data.metadata.mock.dataSource).toBe('prisma.seed.analytics')
    expect(body.data.metadata.mock.endpoint).toBe('analytics/missions/trends')
    expect(typeof body.data.metadata.mock.generatedAt).toBe('string')
  })
})

import { NextRequest } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import type { CorrelationResult } from '@/subsystems/behavioral-analytics/academic-performance-integration'
import { AcademicPerformanceIntegration } from '@/subsystems/behavioral-analytics/academic-performance-integration'
import { GET } from '../correlation/route'

jest.mock('@/lib/auth', () => ({
  getCurrentUserId: jest.fn(),
}))

jest.mock('@/subsystems/behavioral-analytics/academic-performance-integration', () => ({
  AcademicPerformanceIntegration: {
    correlatePerformance: jest.fn(),
  },
}))

describe('GET /api/analytics/behavioral-insights/correlation', () => {
  const sessionUserId = 'user-123'
  const correlationResult: CorrelationResult = {
    coefficient: 0.84,
    pValue: 0.01,
    interpretation: 'strong positive',
    confidenceInterval: [0.7, 0.92],
    timeSeriesData: [],
    insights: [],
    dataQuality: {
      sampleSize: 12,
      weeksOfData: 12,
      missingDataPoints: 0,
    },
  }

  const createRequest = (path: string) => new NextRequest(`http://localhost${path}`)

  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(getCurrentUserId).mockResolvedValue(sessionUserId)
    jest
      .mocked(AcademicPerformanceIntegration.correlatePerformance)
      .mockResolvedValue(correlationResult)
    delete process.env.ANALYTICS_AUTHORIZED_ACCOUNT_IDS
  })

  afterEach(() => {
    delete process.env.ANALYTICS_AUTHORIZED_ACCOUNT_IDS
  })

  it('uses the session user when no override is provided', async () => {
    const response = await GET(createRequest('/api/analytics/behavioral-insights/correlation'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(AcademicPerformanceIntegration.correlatePerformance).toHaveBeenCalledWith(
      sessionUserId,
      12,
    )
  })

  it('rejects overrides that target unauthorized users', async () => {
    const response = await GET(
      createRequest('/api/analytics/behavioral-insights/correlation?userId=other-user'),
    )

    expect(response.status).toBe(403)
    expect(AcademicPerformanceIntegration.correlatePerformance).not.toHaveBeenCalled()
  })

  it('allows overrides for explicitly authorized accounts', async () => {
    process.env.ANALYTICS_AUTHORIZED_ACCOUNT_IDS = 'other-user'

    const response = await GET(
      createRequest('/api/analytics/behavioral-insights/correlation?userId=other-user'),
    )

    expect(response.status).toBe(200)
    expect(AcademicPerformanceIntegration.correlatePerformance).toHaveBeenCalledWith(
      'other-user',
      12,
    )
  })
})

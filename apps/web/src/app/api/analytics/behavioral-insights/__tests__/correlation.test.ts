import { NextRequest } from 'next/server'
import { GET } from '../correlation/route'
import { AcademicPerformanceIntegration } from '@/subsystems/behavioral-analytics/academic-performance-integration'
import { getCurrentUserId } from '@/lib/auth'

jest.mock('@/subsystems/behavioral-analytics/academic-performance-integration')
jest.mock('@/lib/auth')

const mockCorrelate = AcademicPerformanceIntegration
  .correlatePerformance as jest.Mock
const mockGetCurrentUserId = getCurrentUserId as jest.Mock

const mockCorrelationResult = {
  coefficient: 0.42,
  pValue: 0.01,
  interpretation: 'moderate positive',
  confidenceInterval: [0.2, 0.6] as [number, number],
  timeSeriesData: [],
  insights: [],
  dataQuality: { sampleSize: 20, weeksOfData: 12, missingDataPoints: 0 },
}

describe('GET /api/analytics/behavioral-insights/correlation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCorrelate.mockResolvedValue(mockCorrelationResult)
    mockGetCurrentUserId.mockResolvedValue('session-user')
  })

  it('uses the provided userId query parameter when present', async () => {
    const request = new NextRequest(
      'http://localhost/api/analytics/behavioral-insights/correlation?userId=test-user',
    )

    const response = await GET(request)
    await response.json()

    expect(mockCorrelate).toHaveBeenCalledWith('test-user', 12)
    expect(mockGetCurrentUserId).not.toHaveBeenCalled()
  })

  it('falls back to the current session user when userId is absent', async () => {
    const request = new NextRequest('http://localhost/api/analytics/behavioral-insights/correlation')

    const response = await GET(request)
    await response.json()

    expect(mockGetCurrentUserId).toHaveBeenCalledTimes(1)
    expect(mockCorrelate).toHaveBeenCalledWith('session-user', 12)
  })

  it('returns a validation error when userId is empty', async () => {
    const request = new NextRequest(
      'http://localhost/api/analytics/behavioral-insights/correlation?userId=%20%20%20',
    )

    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(mockCorrelate).not.toHaveBeenCalled()
  })
})


import { NextRequest } from 'next/server'
import { GET as getDailyInsight } from '@/app/api/analytics/daily-insight/route'
import { GET as getWeeklySummary } from '@/app/api/analytics/weekly-summary/route'
import { GET as getRecommendations } from '@/app/api/analytics/recommendations/route'
import { GET as getPatterns } from '@/app/api/analytics/patterns/route'
import { GET as getCorrelations } from '@/app/api/analytics/correlations/route'
import { GET as getPeerBenchmark } from '@/app/api/analytics/peer-benchmark/route'
import { GET as getLongitudinal } from '@/app/api/analytics/longitudinal/route'
import {
  ANALYTICS_MOCK_METADATA_HEADER,
  getMockComprehensionPattern,
  getMockCorrelationMatrix,
  getMockDailyInsight,
  getMockLongitudinalMetric,
  getMockPeerBenchmark,
  getMockRecommendationData,
  getMockWeeklySummary,
} from '@/lib/mocks/analytics'

describe('Analytics API mock contracts', () => {
  const userId = 'test-user'

  const buildRequest = (path: string) =>
    new NextRequest(`http://localhost${path}`, {
      headers: {
        'x-analytics-provider': 'mock',
      },
    })

  it.each([
    {
      name: 'daily insight',
      request: () => buildRequest(`/api/analytics/daily-insight?user_id=${userId}`),
      expected: () => getMockDailyInsight(userId),
      handler: getDailyInsight,
    },
    {
      name: 'weekly summary',
      request: () => buildRequest(`/api/analytics/weekly-summary?user_id=${userId}`),
      expected: () => getMockWeeklySummary(userId),
      handler: getWeeklySummary,
    },
    {
      name: 'recommendations',
      request: () => buildRequest(`/api/analytics/recommendations?user_id=${userId}&period=7d`),
      expected: () => getMockRecommendationData(userId),
      handler: getRecommendations,
    },
    {
      name: 'patterns',
      request: () => buildRequest(`/api/analytics/patterns?user_id=${userId}`),
      expected: () => getMockComprehensionPattern(userId),
      handler: getPatterns,
    },
    {
      name: 'correlations',
      request: () => buildRequest(`/api/analytics/correlations?user_id=${userId}`),
      expected: () => getMockCorrelationMatrix(userId),
      handler: getCorrelations,
    },
    {
      name: 'peer benchmark',
      request: () =>
        buildRequest(`/api/analytics/peer-benchmark?user_id=${userId}&objective_id=obj-1`),
      expected: () => getMockPeerBenchmark(userId, 'obj-1'),
      handler: getPeerBenchmark,
    },
    {
      name: 'longitudinal metrics',
      request: () => buildRequest(`/api/analytics/longitudinal?user_id=${userId}`),
      expected: () => getMockLongitudinalMetric(userId),
      handler: getLongitudinal,
    },
  ])('returns canonical payload for $name', async ({ handler, request, expected }) => {
    const req = request()
    const response = await handler(req)

    expect(response.status).toBe(200)

    const headerValue = response.headers.get(ANALYTICS_MOCK_METADATA_HEADER)
    expect(headerValue).toBeTruthy()

    const payload = await response.json()
    const contract = expected()

    expect(payload).toEqual(contract.payload)

    const metadata = JSON.parse(headerValue ?? '{}')
    expect(metadata).toEqual(contract.metadata)
  })
})

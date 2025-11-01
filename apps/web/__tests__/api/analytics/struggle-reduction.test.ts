/**
 * Integration Tests: GET /api/analytics/struggle-reduction
 *
 * Story 5.2: Predictive Analytics - Task 11.7
 * Tests Next.js → FastAPI proxy layer for struggle reduction metrics
 */

import { NextRequest } from 'next/server'
import { http, HttpResponse } from 'msw'
import { GET } from '@/app/api/analytics/struggle-reduction/route'
import { getMockStruggleReductionResponse } from '@/lib/mocks/analytics'
import { create503Handler, createErrorHandler, server, setupMSW } from '../../setup'

setupMSW()

const ANALYTICS_PROVIDER_HEADER = 'x-analytics-provider'
const METADATA_HEADER = 'x-analytics-metadata'
const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'

function createLegacyRequest(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {})
  headers.set(ANALYTICS_PROVIDER_HEADER, 'legacy')
  return new NextRequest(url, { ...init, headers })
}

describe('GET /api/analytics/struggle-reduction', () => {
  describe('Metadata envelopes', () => {
    it('returns mock struggle reduction data with metadata header when provider is mock', async () => {
      const envelope = getMockStruggleReductionResponse()
      const request = new NextRequest('http://localhost:3000/api/analytics/struggle-reduction', {
        headers: { [ANALYTICS_PROVIDER_HEADER]: 'mock' },
      })

      const response = await GET(request)
      const data = await response.json()
      const metadata = response.headers.get(METADATA_HEADER)

      expect(metadata).toBeTruthy()
      expect(JSON.parse(metadata ?? '{}')).toEqual(envelope.metadata)
      expect(data).toEqual(envelope.payload)
    })

    it('attaches metadata header when legacy provider receives mock struggle reduction data', async () => {
      const envelope = getMockStruggleReductionResponse()
      server.use(
        http.get(`${ML_SERVICE_URL}/struggle-reduction`, () =>
          HttpResponse.json({
            dataSource: 'mock',
            metadata: envelope.metadata,
            payload: envelope.payload,
          }),
        ),
      )

      const response = await GET(createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction'))
      const data = await response.json()
      const metadata = response.headers.get(METADATA_HEADER)

      expect(metadata).toBeTruthy()
      expect(JSON.parse(metadata ?? '{}')).toEqual(envelope.metadata)
      expect(data).toEqual(envelope.payload)
    })
  })

  describe('Success Cases', () => {
    it('should return struggle reduction metrics', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.baselineRate).toBeDefined()
      expect(data.currentRate).toBeDefined()
      expect(data.reductionPercentage).toBeDefined()
      expect(data.timeline).toBeDefined()
      expect(data.interventionEffectiveness).toBeDefined()
    })

    it('should return metrics with correct data types', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(typeof data.baselineRate).toBe('number')
      expect(typeof data.currentRate).toBe('number')
      expect(typeof data.reductionPercentage).toBe('number')
      expect(Array.isArray(data.timeline)).toBe(true)
      expect(Array.isArray(data.interventionEffectiveness)).toBe(true)
    })

    it('should include timeline data', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.timeline.length).toBeGreaterThan(0)
      expect(data.timeline[0]).toHaveProperty('week')
      expect(data.timeline[0]).toHaveProperty('struggleRate')
    })

    it('should include intervention effectiveness data', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.interventionEffectiveness.length).toBeGreaterThan(0)
      expect(data.interventionEffectiveness[0]).toHaveProperty('type')
      expect(data.interventionEffectiveness[0]).toHaveProperty('applicationsCount')
      expect(data.interventionEffectiveness[0]).toHaveProperty('successRate')
    })

    it('should handle period query parameter - week', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/struggle-reduction?period=week',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.period).toBe('week')
    })

    it('should handle period query parameter - month', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/struggle-reduction?period=month',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period).toBe('month')
    })

    it('should handle period query parameter - all', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/struggle-reduction?period=all',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.period).toBe('all')
    })

    it('should pass userId query parameter', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/struggle-reduction?userId=custom@example.com',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 user not found', async () => {
      server.use(createErrorHandler('get', '/struggle-reduction', 404, 'User not found'))

      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('User not found')
    })

    it('should handle 422 insufficient data', async () => {
      server.use(
        createErrorHandler(
          'get',
          '/struggle-reduction',
          422,
          'Insufficient data for reduction metrics',
        ),
      )

      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.detail).toContain('Insufficient data')
    })

    it('should handle 500 internal server error', async () => {
      server.use(
        createErrorHandler('get', '/struggle-reduction', 500, 'Failed to calculate reduction'),
      )

      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Failed to calculate reduction')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('get', '/struggle-reduction'))

      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })
  })

  describe('Metric Validation', () => {
    it('should return rates within valid ranges (0-1)', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.baselineRate).toBeGreaterThanOrEqual(0)
      expect(data.baselineRate).toBeLessThanOrEqual(1)
      expect(data.currentRate).toBeGreaterThanOrEqual(0)
      expect(data.currentRate).toBeLessThanOrEqual(1)
    })

    it('should show improvement (current rate less than baseline)', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.currentRate).toBeLessThan(data.baselineRate)
      expect(data.reductionPercentage).toBeGreaterThan(0)
    })

    it('should have timeline with decreasing struggle rates', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      data.timeline.forEach((point: { week: number; struggleRate: number }) => {
        expect(point.struggleRate).toBeGreaterThanOrEqual(0)
        expect(point.struggleRate).toBeLessThanOrEqual(1)
      })

      // First week should be higher than last week
      expect(data.timeline[0].struggleRate).toBeGreaterThanOrEqual(
        data.timeline[data.timeline.length - 1].struggleRate,
      )
    })

    it('should have intervention effectiveness within valid range', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      data.interventionEffectiveness.forEach(
        (intervention: { type: string; applicationsCount: number; successRate: number }) => {
          expect(intervention.applicationsCount).toBeGreaterThanOrEqual(0)
          expect(intervention.successRate).toBeGreaterThanOrEqual(0)
          expect(intervention.successRate).toBeLessThanOrEqual(1)
        },
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in userId', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/struggle-reduction?userId=test%2Buser%40example.com',
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle invalid period parameter gracefully', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/struggle-reduction?period=invalid',
      )

      const response = await GET(request)

      // Should either return default or handle gracefully
      expect([200, 400]).toContain(response.status)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, () =>
        GET(createLegacyRequest('http://localhost:3000/api/analytics/struggle-reduction')),
      )

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle different period values correctly', async () => {
      const periods = ['week', 'month', 'all']

      for (const period of periods) {
        const request = createLegacyRequest(
          `http://localhost:3000/api/analytics/struggle-reduction?period=${period}`,
        )

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.period).toBe(period)
      }
    })
  })
})

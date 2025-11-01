/**
 * Integration Tests: GET /api/analytics/interventions
 *
 * Story 5.2: Predictive Analytics - Task 11.3
 * Tests Next.js → FastAPI proxy layer for interventions retrieval
 */

import { NextRequest } from 'next/server'
import { http, HttpResponse } from 'msw'
import { GET } from '@/app/api/analytics/interventions/route'
import { getMockInterventionResponse } from '@/lib/mocks/analytics'
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

describe('GET /api/analytics/interventions', () => {
  describe('Metadata envelopes', () => {
    it('returns mock interventions with metadata header when provider is mock', async () => {
      const envelope = getMockInterventionResponse()
      const request = new NextRequest('http://localhost:3000/api/analytics/interventions', {
        headers: { [ANALYTICS_PROVIDER_HEADER]: 'mock' },
      })

      const response = await GET(request)
      const data = await response.json()
      const metadata = response.headers.get(METADATA_HEADER)

      expect(metadata).toBeTruthy()
      expect(JSON.parse(metadata ?? '{}')).toEqual(envelope.metadata)
      expect(data).toEqual(envelope.payload)
    })

    it('attaches metadata header when legacy provider receives mock data', async () => {
      const envelope = getMockInterventionResponse()
      server.use(
        http.get(`${ML_SERVICE_URL}/interventions`, () =>
          HttpResponse.json({
            dataSource: 'mock',
            metadata: envelope.metadata,
            payload: envelope.payload,
          }),
        ),
      )

      const response = await GET(createLegacyRequest('http://localhost:3000/api/analytics/interventions'))
      const data = await response.json()
      const metadata = response.headers.get(METADATA_HEADER)

      expect(metadata).toBeTruthy()
      expect(JSON.parse(metadata ?? '{}')).toEqual(envelope.metadata)
      expect(data).toEqual(envelope.payload)
    })
  })

  describe('Success Cases', () => {
    it('should return active interventions', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.interventions).toHaveLength(2)
      expect(data.count).toBe(2)
    })

    it('should return interventions with correct structure', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.interventions[0]).toMatchObject({
        id: expect.any(String),
        predictionId: expect.any(String),
        userId: expect.any(String),
        interventionType: expect.any(String),
        description: expect.any(String),
        reasoning: expect.any(String),
        priority: expect.any(Number),
        status: expect.any(String),
        effectiveness: expect.any(Number),
      })
    })

    it('should pass userId query parameter', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/interventions?userId=custom@example.com',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle empty intervention list', async () => {
      server.use(createErrorHandler('get', '/interventions', 200, ''))

      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 not found', async () => {
      server.use(createErrorHandler('get', '/interventions', 404, 'No interventions found'))

      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('No interventions found')
    })

    it('should handle 500 internal server error', async () => {
      server.use(createErrorHandler('get', '/interventions', 500, 'Failed to fetch interventions'))

      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Failed to fetch interventions')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('get', '/interventions'))

      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in userId', async () => {
      const request = createLegacyRequest(
        'http://localhost:3000/api/analytics/interventions?userId=test%2Buser%40example.com',
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, () =>
        GET(createLegacyRequest('http://localhost:3000/api/analytics/interventions')),
      )

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should validate intervention types', async () => {
      const request = createLegacyRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      const validTypes = [
        'PREREQUISITE_REVIEW',
        'DIFFICULTY_PROGRESSION',
        'CONTENT_FORMAT_ADAPT',
        'COGNITIVE_LOAD_REDUCE',
        'SPACED_REPETITION_BOOST',
        'BREAK_SCHEDULE_ADJUST',
      ]

      data.interventions.forEach((intervention: { interventionType: string }) => {
        expect(validTypes).toContain(intervention.interventionType)
      })
    })
  })
})

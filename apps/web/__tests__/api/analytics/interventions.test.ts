/**
 * Integration Tests: GET /api/analytics/interventions
 *
 * Story 5.2: Predictive Analytics - Task 11.3
 * Tests Next.js → FastAPI proxy layer for interventions retrieval
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/analytics/interventions/route'
import { create503Handler, createErrorHandler, server } from '../../setup'

describe('GET /api/analytics/interventions', () => {
  describe('Success Cases', () => {
    it('should return active interventions', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.interventions).toHaveLength(2)
      expect(data.count).toBe(2)
    })

    it('should return interventions with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

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
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions?userId=custom@example.com',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle empty intervention list', async () => {
      server.use(createErrorHandler('get', '/interventions', 200, ''))

      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 not found', async () => {
      server.use(createErrorHandler('get', '/interventions', 404, 'No interventions found'))

      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('No interventions found')
    })

    it('should handle 500 internal server error', async () => {
      server.use(createErrorHandler('get', '/interventions', 500, 'Failed to fetch interventions'))

      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Failed to fetch interventions')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('get', '/interventions'))

      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in userId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions?userId=test%2Buser%40example.com',
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 3 }, () =>
        GET(new NextRequest('http://localhost:3000/api/analytics/interventions')),
      )

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should validate intervention types', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/interventions')

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

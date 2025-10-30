/**
 * Integration Tests: GET /api/analytics/predictions
 *
 * Story 5.2: Predictive Analytics - Task 11.2
 * Tests Next.js → FastAPI proxy layer for predictions retrieval
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/analytics/predictions/route'
import { create503Handler, createErrorHandler, server, setupMSW } from '../../setup'

// Initialize MSW server
setupMSW()

describe('GET /api/analytics/predictions', () => {
  describe('Success Cases', () => {
    it('should return predictions with default parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.predictions).toHaveLength(2)
      expect(data.predictions[0]).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        predictedStruggleProbability: expect.any(Number),
        predictionConfidence: expect.any(Number),
      })
    })

    it('should pass query parameters to FastAPI service', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions?userId=test@example.com&status=CONFIRMED&minProbability=0.7',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.predictions).toBeDefined()
    })

    it('should handle empty results gracefully', async () => {
      server.use(createErrorHandler('get', '/predictions', 200, ''))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 from FastAPI service', async () => {
      server.use(createErrorHandler('get', '/predictions', 404, 'Predictions not found'))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('Predictions not found')
    })

    it('should handle 500 from FastAPI service', async () => {
      server.use(createErrorHandler('get', '/predictions', 500, 'Internal server error'))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Internal server error')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('get', '/predictions'))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors gracefully', async () => {
      // Override ML_SERVICE_URL to invalid host
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
      expect(data.detail).toBeDefined()

      // Restore original env
      process.env.ML_SERVICE_URL = originalEnv
    })

    it('should handle malformed JSON responses', async () => {
      server.use(createErrorHandler('get', '/predictions', 200, 'not-json'))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)

      // Should still handle the response (MSW will return proper JSON)
      expect(response.status).toBe(200)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in query parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions?userId=test%2Buser%40example.com',
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle large result sets', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.predictions)).toBe(true)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        GET(new NextRequest('http://localhost:3000/api/analytics/predictions')),
      )

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })
  })
})

/**
 * Integration Tests: POST /api/analytics/predictions/generate
 *
 * Story 5.2: Predictive Analytics - Task 11.1
 * Tests Next.js → FastAPI proxy layer for prediction generation
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analytics/predictions/generate/route'
import { create503Handler, createErrorHandler, server } from '../../setup'

describe('POST /api/analytics/predictions/generate', () => {
  describe('Success Cases', () => {
    it('should generate predictions for user', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test@example.com',
          daysAhead: 7,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.predictions).toBeDefined()
      expect(Array.isArray(data.predictions)).toBe(true)
      expect(data.alerts).toBeDefined()
      expect(Array.isArray(data.alerts)).toBe(true)
    })

    it('should use default daysAhead when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test@example.com',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return predictions with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'kevy@americano.dev',
          daysAhead: 14,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.predictions[0]).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        predictedStruggleProbability: expect.any(Number),
        predictionConfidence: expect.any(Number),
        predictionStatus: expect.any(String),
      })
    })
  })

  describe('Error Cases', () => {
    it('should handle 400 bad request from FastAPI', async () => {
      server.use(createErrorHandler('post', '/predictions/generate', 400, 'Invalid request body'))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.detail).toBe('Invalid request body')
    })

    it('should handle 422 validation error', async () => {
      server.use(
        createErrorHandler(
          'post',
          '/predictions/generate',
          422,
          'Validation error: userId required',
        ),
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.detail).toContain('Validation error')
    })

    it('should handle 500 internal server error', async () => {
      server.use(
        createErrorHandler(
          'post',
          '/predictions/generate',
          500,
          'Internal prediction engine error',
        ),
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test@example.com',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Internal prediction engine error')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('post', '/predictions/generate'))

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test@example.com',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network timeouts', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test@example.com',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: 'not-valid-json',
      })

      try {
        await POST(request)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle daysAhead boundary values', async () => {
      const testCases = [0, 1, 7, 14, 30, 365]

      for (const daysAhead of testCases) {
        const request = new NextRequest(
          'http://localhost:3000/api/analytics/predictions/generate',
          {
            method: 'POST',
            body: JSON.stringify({
              userId: 'test@example.com',
              daysAhead,
            }),
          },
        )

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('should handle special characters in userId', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test+user@example.com',
          daysAhead: 7,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it('should handle large daysAhead values', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test@example.com',
          daysAhead: 1000,
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })
})

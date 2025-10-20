/**
 * Integration Tests: GET /api/analytics/model-performance
 *
 * Story 5.2: Predictive Analytics - Task 11.6
 * Tests Next.js → FastAPI proxy layer for model performance metrics
 */

import { GET } from '@/app/api/analytics/model-performance/route'
import { NextRequest } from 'next/server'
import { server, createErrorHandler, create503Handler } from '../../setup'

describe('GET /api/analytics/model-performance', () => {
  describe('Success Cases', () => {
    it('should return model performance metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.accuracy).toBeDefined()
      expect(data.precision).toBeDefined()
      expect(data.recall).toBeDefined()
      expect(data.f1Score).toBeDefined()
      expect(data.calibration).toBeDefined()
    })

    it('should return metrics with correct data types', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(typeof data.accuracy).toBe('number')
      expect(typeof data.precision).toBe('number')
      expect(typeof data.recall).toBe('number')
      expect(typeof data.f1Score).toBe('number')
      expect(typeof data.calibration).toBe('number')
      expect(typeof data.dataPoints).toBe('number')
    })

    it('should include trend data', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.trend)).toBe(true)
      expect(data.trend.length).toBeGreaterThan(0)
      expect(data.trend[0]).toHaveProperty('date')
      expect(data.trend[0]).toHaveProperty('accuracy')
    })

    it('should include lastUpdated timestamp', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lastUpdated).toBeDefined()
      expect(typeof data.lastUpdated).toBe('string')
      expect(new Date(data.lastUpdated).toString()).not.toBe('Invalid Date')
    })

    it('should pass userId query parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/model-performance?userId=custom@example.com',
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 user not found', async () => {
      server.use(createErrorHandler('get', '/model-performance', 404, 'User not found'))

      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('User not found')
    })

    it('should handle 422 insufficient data', async () => {
      server.use(
        createErrorHandler(
          'get',
          '/model-performance',
          422,
          'Insufficient data for performance metrics',
        ),
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.detail).toContain('Insufficient data')
    })

    it('should handle 500 internal server error', async () => {
      server.use(
        createErrorHandler('get', '/model-performance', 500, 'Failed to calculate metrics'),
      )

      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Failed to calculate metrics')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('get', '/model-performance'))

      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })
  })

  describe('Metric Validation', () => {
    it('should return metrics within valid ranges (0-1)', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.accuracy).toBeGreaterThanOrEqual(0)
      expect(data.accuracy).toBeLessThanOrEqual(1)
      expect(data.precision).toBeGreaterThanOrEqual(0)
      expect(data.precision).toBeLessThanOrEqual(1)
      expect(data.recall).toBeGreaterThanOrEqual(0)
      expect(data.recall).toBeLessThanOrEqual(1)
      expect(data.f1Score).toBeGreaterThanOrEqual(0)
      expect(data.f1Score).toBeLessThanOrEqual(1)
    })

    it('should have positive data points count', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.dataPoints).toBeGreaterThan(0)
    })

    it('should have trend data with valid dates', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/model-performance')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      data.trend.forEach((point: { date: string; accuracy: number }) => {
        expect(new Date(point.date).toString()).not.toBe('Invalid Date')
        expect(point.accuracy).toBeGreaterThanOrEqual(0)
        expect(point.accuracy).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in userId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/model-performance?userId=test%2Buser%40example.com',
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, () =>
        GET(new NextRequest('http://localhost:3000/api/analytics/model-performance')),
      )

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })
  })
})

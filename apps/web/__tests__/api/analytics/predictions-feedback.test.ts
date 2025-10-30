/**
 * Integration Tests: POST /api/analytics/predictions/[id]/feedback
 *
 * Story 5.2: Predictive Analytics - Task 11.5
 * Tests Next.js → FastAPI proxy layer for prediction feedback
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analytics/predictions/[id]/feedback/route'
import { create503Handler, createErrorHandler, server } from '../../setup'

describe('POST /api/analytics/predictions/[id]/feedback', () => {
  describe('Success Cases', () => {
    it('should submit prediction feedback successfully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
            comments: 'The prediction was accurate and helped me prepare',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.feedbackRecorded).toBe(true)
      expect(data.predictionId).toBe('pred-1')
      expect(data.modelAccuracyUpdate).toBeDefined()
    })

    it('should handle feedback without comments', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-2/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: false,
            feedbackType: 'NOT_HELPFUL',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-2' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.feedbackRecorded).toBe(true)
    })

    it('should handle inaccurate prediction feedback', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-3/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: false,
            feedbackType: 'INACCURATE',
            comments: 'The topic was easier than predicted',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-3' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 prediction not found', async () => {
      server.use(
        createErrorHandler('post', '/predictions/invalid-id/feedback', 404, 'Prediction not found'),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/invalid-id/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('Prediction not found')
    })

    it('should handle 400 invalid feedback data', async () => {
      server.use(
        createErrorHandler('post', '/predictions/pred-1/feedback', 400, 'Invalid feedback type'),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'INVALID_TYPE',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.detail).toBe('Invalid feedback type')
    })

    it('should handle 500 internal server error', async () => {
      server.use(
        createErrorHandler(
          'post',
          '/predictions/pred-1/feedback',
          500,
          'Failed to record feedback',
        ),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Failed to record feedback')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('post', '/predictions/pred-1/feedback'))

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long comments', async () => {
      const longComment = 'A'.repeat(5000)
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
            comments: longComment,
          }),
        },
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
      expect(response.status).toBe(200)
    })

    it('should handle special characters in prediction ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/pred-123-abc/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
          }),
        },
      )

      const response = await POST(request, {
        params: Promise.resolve({ id: 'pred-123-abc' }),
      })
      expect(response.status).toBe(200)
    })

    it('should handle all valid feedback types', async () => {
      const feedbackTypes = [
        'HELPFUL',
        'NOT_HELPFUL',
        'INACCURATE',
        'INTERVENTION_GOOD',
        'INTERVENTION_BAD',
      ]

      for (const feedbackType of feedbackTypes) {
        const request = new NextRequest(
          'http://localhost:3000/api/analytics/predictions/pred-1/feedback',
          {
            method: 'POST',
            body: JSON.stringify({
              actualStruggle: true,
              feedbackType,
            }),
          },
        )

        const response = await POST(request, { params: Promise.resolve({ id: 'pred-1' }) })
        expect(response.status).toBe(200)
      }
    })
  })
})

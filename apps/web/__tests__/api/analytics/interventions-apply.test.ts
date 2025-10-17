/**
 * Integration Tests: POST /api/analytics/interventions/[id]/apply
 *
 * Story 5.2: Predictive Analytics - Task 11.4
 * Tests Next.js → FastAPI proxy layer for applying interventions
 */

import { POST } from '@/app/api/analytics/interventions/[id]/apply/route'
import { NextRequest } from 'next/server'
import { server, createErrorHandler, create503Handler } from '../../../setup'

describe('POST /api/analytics/interventions/[id]/apply', () => {
  describe('Success Cases', () => {
    it('should apply intervention successfully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({
            applyToMissionId: 'mission-123',
          }),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.applied).toBe(true)
      expect(data.interventionId).toBe('int-1')
      expect(data.missionId).toBe('mission-123')
    })

    it('should apply intervention without specific mission ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-2/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-2' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.applied).toBe(true)
      expect(data.missionId).toBeDefined() // Should auto-generate
    })

    it('should return success message', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-3/apply',
        {
          method: 'POST',
          body: JSON.stringify({
            applyToMissionId: 'mission-456',
          }),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-3' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
      expect(typeof data.message).toBe('string')
    })
  })

  describe('Error Cases', () => {
    it('should handle 404 intervention not found', async () => {
      server.use(
        createErrorHandler('post', '/interventions/invalid-id/apply', 404, 'Intervention not found')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/invalid-id/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'invalid-id' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.detail).toBe('Intervention not found')
    })

    it('should handle 400 invalid mission ID', async () => {
      server.use(
        createErrorHandler('post', '/interventions/int-1/apply', 400, 'Invalid mission ID')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({
            applyToMissionId: 'invalid',
          }),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.detail).toBe('Invalid mission ID')
    })

    it('should handle 409 intervention already applied', async () => {
      server.use(
        createErrorHandler('post', '/interventions/int-1/apply', 409, 'Intervention already applied')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({
            applyToMissionId: 'mission-123',
          }),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.detail).toBe('Intervention already applied')
    })

    it('should handle 500 internal server error', async () => {
      server.use(
        createErrorHandler('post', '/interventions/int-1/apply', 500, 'Failed to apply intervention')
      )

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.detail).toBe('Failed to apply intervention')
    })

    it('should handle 503 service unavailable', async () => {
      server.use(create503Handler('post', '/interventions/int-1/apply'))

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')
    })

    it('should handle network errors', async () => {
      const originalEnv = process.env.ML_SERVICE_URL
      process.env.ML_SERVICE_URL = 'http://invalid-host-xyz:9999'

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('ML service unavailable')

      process.env.ML_SERVICE_URL = originalEnv
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in intervention ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-123-abc/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-123-abc' }) })
      expect(response.status).toBe(200)
    })

    it('should handle special characters in mission ID', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({
            applyToMissionId: 'mission-abc-123-xyz',
          }),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      expect(response.status).toBe(200)
    })

    it('should handle concurrent intervention applications', async () => {
      const requests = Array.from({ length: 3 }, (_, i) =>
        POST(
          new NextRequest(`http://localhost:3000/api/analytics/interventions/int-${i}/apply`, {
            method: 'POST',
            body: JSON.stringify({
              applyToMissionId: `mission-${i}`,
            }),
          }),
          { params: Promise.resolve({ id: `int-${i}` }) }
        )
      )

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle empty request body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/interventions/int-1/apply',
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request, { params: Promise.resolve({ id: 'int-1' }) })
      expect(response.status).toBe(200)
    })
  })
})

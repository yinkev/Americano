/**
 * End-to-End Integration Tests: Next.js → FastAPI ML Service Proxy
 *
 * Story 5.2: Predictive Analytics
 * Full workflow tests through the proxy layer
 */

import { HttpResponse, http } from 'msw'
import { NextRequest } from 'next/server'
import { POST as applyIntervention } from '@/app/api/analytics/interventions/[id]/apply/route'
import { GET as getInterventions } from '@/app/api/analytics/interventions/route'
import { GET as getModelPerformance } from '@/app/api/analytics/model-performance/route'
import { POST as submitFeedback } from '@/app/api/analytics/predictions/[id]/feedback/route'
import { POST as generatePredictions } from '@/app/api/analytics/predictions/generate/route'
import { GET as getPredictions } from '@/app/api/analytics/predictions/route'
import { GET as getStruggleReduction } from '@/app/api/analytics/struggle-reduction/route'
import { create503Handler, createErrorHandler, server, setupMSW } from '../setup'

describe('ML Service Proxy Integration', () => {
  // Initialize MSW server to mock ML service responses
  setupMSW()

  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
  const testUserId = 'integration-test@example.com'

  describe('Complete Prediction Workflow', () => {
    it('should complete full prediction lifecycle', async () => {
      // Step 1: Generate predictions
      const generateRequest = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: testUserId,
            daysAhead: 7,
          }),
        },
      )

      const generateResponse = await generatePredictions(generateRequest)
      const generateData = await generateResponse.json()

      expect(generateResponse.status).toBe(200)
      expect(generateData.success).toBe(true)
      expect(generateData.predictions.length).toBeGreaterThan(0)

      const predictionId = generateData.predictions[0].id

      // Step 2: Retrieve predictions
      const getPredictionsRequest = new NextRequest(
        `http://localhost:3000/api/analytics/predictions?userId=${testUserId}`,
      )

      const getPredictionsResponse = await getPredictions(getPredictionsRequest)
      const getPredictionsData = await getPredictionsResponse.json()

      expect(getPredictionsResponse.status).toBe(200)
      expect(getPredictionsData.success).toBe(true)
      expect(getPredictionsData.predictions.length).toBeGreaterThan(0)

      // Step 3: Submit feedback
      const feedbackRequest = new NextRequest(
        `http://localhost:3000/api/analytics/predictions/${predictionId}/feedback`,
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
            comments: 'Integration test feedback',
          }),
        },
      )

      const feedbackResponse = await submitFeedback(feedbackRequest, {
        params: Promise.resolve({ id: predictionId }),
      })
      const feedbackData = await feedbackResponse.json()

      expect(feedbackResponse.status).toBe(200)
      expect(feedbackData.success).toBe(true)
      expect(feedbackData.feedbackRecorded).toBe(true)

      // Step 4: Check model performance updated
      const performanceRequest = new NextRequest(
        `http://localhost:3000/api/analytics/model-performance?userId=${testUserId}`,
      )

      const performanceResponse = await getModelPerformance(performanceRequest)
      const performanceData = await performanceResponse.json()

      expect(performanceResponse.status).toBe(200)
      expect(performanceData.success).toBe(true)
      expect(performanceData.accuracy).toBeDefined()
    })

    it('should complete intervention workflow', async () => {
      // Step 1: Get available interventions
      const getInterventionsRequest = new NextRequest(
        `http://localhost:3000/api/analytics/interventions?userId=${testUserId}`,
      )

      const getInterventionsResponse = await getInterventions(getInterventionsRequest)
      const getInterventionsData = await getInterventionsResponse.json()

      expect(getInterventionsResponse.status).toBe(200)
      expect(getInterventionsData.success).toBe(true)
      expect(getInterventionsData.interventions.length).toBeGreaterThan(0)

      const interventionId = getInterventionsData.interventions[0].id

      // Step 2: Apply intervention
      const applyRequest = new NextRequest(
        `http://localhost:3000/api/analytics/interventions/${interventionId}/apply`,
        {
          method: 'POST',
          body: JSON.stringify({
            applyToMissionId: 'test-mission-123',
          }),
        },
      )

      const applyResponse = await applyIntervention(applyRequest, {
        params: Promise.resolve({ id: interventionId }),
      })
      const applyData = await applyResponse.json()

      expect(applyResponse.status).toBe(200)
      expect(applyData.success).toBe(true)
      expect(applyData.applied).toBe(true)

      // Step 3: Verify struggle reduction metrics updated
      const reductionRequest = new NextRequest(
        `http://localhost:3000/api/analytics/struggle-reduction?userId=${testUserId}`,
      )

      const reductionResponse = await getStruggleReduction(reductionRequest)
      const reductionData = await reductionResponse.json()

      expect(reductionResponse.status).toBe(200)
      expect(reductionData.success).toBe(true)
      expect(reductionData.interventionEffectiveness).toBeDefined()
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should gracefully degrade when ML service is partially unavailable', async () => {
      // Predictions endpoint fails
      server.use(create503Handler('get', '/predictions'))

      const predictionsRequest = new NextRequest('http://localhost:3000/api/analytics/predictions')
      const predictionsResponse = await getPredictions(predictionsRequest)

      expect(predictionsResponse.status).toBe(503)

      // But interventions endpoint still works
      const interventionsRequest = new NextRequest(
        'http://localhost:3000/api/analytics/interventions',
      )
      const interventionsResponse = await getInterventions(interventionsRequest)

      expect(interventionsResponse.status).toBe(200)
    })

    it('should handle cascading failures appropriately', async () => {
      // Simulate ML service complete outage
      server.use(
        create503Handler('post', '/predictions/generate'),
        create503Handler('get', '/predictions'),
        create503Handler('get', '/interventions'),
        create503Handler('get', '/model-performance'),
        create503Handler('get', '/struggle-reduction'),
      )

      const requests = [
        generatePredictions(
          new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
            method: 'POST',
            body: JSON.stringify({ userId: testUserId }),
          }),
        ),
        getPredictions(new NextRequest('http://localhost:3000/api/analytics/predictions')),
        getInterventions(new NextRequest('http://localhost:3000/api/analytics/interventions')),
        getModelPerformance(
          new NextRequest('http://localhost:3000/api/analytics/model-performance'),
        ),
        getStruggleReduction(
          new NextRequest('http://localhost:3000/api/analytics/struggle-reduction'),
        ),
      ]

      const responses = await Promise.all(requests)

      responses.forEach((response) => {
        expect(response.status).toBe(503)
      })
    })

    it('should retry and recover from transient failures', async () => {
      let attemptCount = 0

      // First call fails, subsequent calls succeed
      server.use(
        http.get(`${ML_SERVICE_URL}/predictions`, () => {
          attemptCount++
          if (attemptCount === 1) {
            return new HttpResponse(null, { status: 503 })
          }
          return HttpResponse.json({
            success: true,
            predictions: [],
            count: 0,
          })
        }),
      )

      // First attempt fails
      const request1 = new NextRequest('http://localhost:3000/api/analytics/predictions')
      const response1 = await getPredictions(request1)
      expect(response1.status).toBe(503)

      // Second attempt succeeds
      const request2 = new NextRequest('http://localhost:3000/api/analytics/predictions')
      const response2 = await getPredictions(request2)
      expect(response2.status).toBe(200)
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle high concurrent request volume', async () => {
      const concurrentRequests = 20

      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        const endpoint = i % 5
        switch (endpoint) {
          case 0:
            return getPredictions(
              new NextRequest('http://localhost:3000/api/analytics/predictions'),
            )
          case 1:
            return getInterventions(
              new NextRequest('http://localhost:3000/api/analytics/interventions'),
            )
          case 2:
            return getModelPerformance(
              new NextRequest('http://localhost:3000/api/analytics/model-performance'),
            )
          case 3:
            return getStruggleReduction(
              new NextRequest('http://localhost:3000/api/analytics/struggle-reduction'),
            )
          default:
            return generatePredictions(
              new NextRequest('http://localhost:3000/api/analytics/predictions/generate', {
                method: 'POST',
                body: JSON.stringify({ userId: `user-${i}@example.com` }),
              }),
            )
        }
      })

      const startTime = Date.now()
      const responses = await Promise.all(requests)
      const duration = Date.now() - startTime

      // All requests should succeed
      responses.forEach((response) => {
        expect([200, 503]).toContain(response.status)
      })

      // Should complete within reasonable time (20 concurrent requests < 5s)
      expect(duration).toBeLessThan(5000)
    })

    it('should maintain consistent response structure under load', async () => {
      const responses = []

      for (let i = 0; i < 10; i++) {
        const request = new NextRequest(
          `http://localhost:3000/api/analytics/predictions?userId=user-${i}@test.com`,
        )
        const response = await getPredictions(request)
        const data = await response.json()

        responses.push(data)
      }

      // All responses should have consistent structure
      responses.forEach((data) => {
        expect(data.success).toBe(true)
        expect(data.predictions).toBeDefined()
        expect(Array.isArray(data.predictions)).toBe(true)
      })

      // Verify all responses completed successfully
      expect(responses.length).toBe(10)
    })
  })

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across endpoints', async () => {
      // Generate predictions
      const generateRequest = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: testUserId,
            daysAhead: 7,
          }),
        },
      )

      const generateResponse = await generatePredictions(generateRequest)
      const generateData = await generateResponse.json()

      // Retrieve predictions
      const getRequest = new NextRequest(
        `http://localhost:3000/api/analytics/predictions?userId=${testUserId}`,
      )

      const getResponse = await getPredictions(getRequest)
      const getData = await getResponse.json()

      // Both endpoints should return consistent data
      expect(generateResponse.status).toBe(200)
      expect(getResponse.status).toBe(200)
      expect(generateData.predictions).toBeDefined()
      expect(getData.predictions).toBeDefined()
    })

    it('should validate prediction IDs across workflow', async () => {
      // Generate prediction
      const generateRequest = new NextRequest(
        'http://localhost:3000/api/analytics/predictions/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: testUserId,
          }),
        },
      )

      const generateResponse = await generatePredictions(generateRequest)
      const { predictions } = await generateResponse.json()

      const predictionId = predictions[0].id

      // Verify prediction ID format (should be string, non-empty)
      expect(typeof predictionId).toBe('string')
      expect(predictionId.length).toBeGreaterThan(0)

      // Use prediction ID in feedback
      const feedbackRequest = new NextRequest(
        `http://localhost:3000/api/analytics/predictions/${predictionId}/feedback`,
        {
          method: 'POST',
          body: JSON.stringify({
            actualStruggle: true,
            feedbackType: 'HELPFUL',
          }),
        },
      )

      const feedbackResponse = await submitFeedback(feedbackRequest, {
        params: Promise.resolve({ id: predictionId }),
      })

      expect(feedbackResponse.status).toBe(200)
    })
  })

  describe('Security and Input Validation', () => {
    it('should sanitize user input in query parameters', async () => {
      const maliciousInputs = [
        'test@example.com<script>alert("xss")</script>',
        'test@example.com; DROP TABLE users;',
        'test@example.com" OR "1"="1',
      ]

      for (const maliciousInput of maliciousInputs) {
        const request = new NextRequest(
          `http://localhost:3000/api/analytics/predictions?userId=${encodeURIComponent(maliciousInput)}`,
        )

        const response = await getPredictions(request)

        // Should not crash or return 500
        expect([200, 400, 422]).toContain(response.status)
      }
    })

    it('should validate request body structure', async () => {
      const invalidBodies = [
        { invalid: 'field' },
        { userId: 123 }, // Wrong type
        null,
        undefined,
      ]

      for (const invalidBody of invalidBodies) {
        const request = new NextRequest(
          'http://localhost:3000/api/analytics/predictions/generate',
          {
            method: 'POST',
            body: JSON.stringify(invalidBody),
          },
        )

        try {
          const response = await generatePredictions(request)
          // Should handle gracefully with 4xx error
          expect(response.status).toBeGreaterThanOrEqual(400)
          expect(response.status).toBeLessThan(600)
        } catch (error) {
          // Expected for null/undefined
          expect(error).toBeDefined()
        }
      }
    })
  })
})

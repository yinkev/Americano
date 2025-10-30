/**
 * Test Environment Setup
 *
 * MSW (Mock Service Worker) configuration for mocking FastAPI ML service
 * Story 5.2: Predictive Analytics - Integration Tests
 */

import { TextDecoder, TextEncoder } from 'node:util'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder as typeof global.TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

/**
 * Default MSW Handlers for FastAPI ML Service
 *
 * These handlers mock the FastAPI backend responses for testing
 * the Next.js proxy layer without requiring the actual ML service.
 */
export const handlers = [
  // Health check endpoint
  http.get(`${ML_SERVICE_URL}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      service: 'ml-service',
      version: '1.0.0',
    })
  }),

  // GET /predictions - Retrieve stored predictions
  http.get(`${ML_SERVICE_URL}/predictions`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'kevy@americano.dev'
    const status = url.searchParams.get('status') || 'PENDING'
    const minProbability = parseFloat(url.searchParams.get('minProbability') || '0.5')

    return HttpResponse.json({
      success: true,
      predictions: [
        {
          id: 'pred-1',
          userId,
          learningObjectiveId: 'obj-123',
          topicId: 'topic-456',
          predictionDate: new Date().toISOString(),
          predictedStruggleProbability: 0.75,
          predictionConfidence: 0.85,
          predictionStatus: status,
          actualOutcome: null,
        },
        {
          id: 'pred-2',
          userId,
          learningObjectiveId: 'obj-124',
          topicId: 'topic-457',
          predictionDate: new Date().toISOString(),
          predictedStruggleProbability: 0.62,
          predictionConfidence: 0.78,
          predictionStatus: status,
          actualOutcome: null,
        },
      ],
      count: 2,
    })
  }),

  // POST /predictions/generate - Generate new predictions
  http.post(`${ML_SERVICE_URL}/predictions/generate`, async ({ request }) => {
    const body = (await request.json()) as { userId: string; daysAhead?: number }

    return HttpResponse.json({
      success: true,
      predictions: [
        {
          id: 'pred-new-1',
          userId: body.userId,
          learningObjectiveId: 'obj-125',
          topicId: 'topic-458',
          predictionDate: new Date().toISOString(),
          predictedStruggleProbability: 0.82,
          predictionConfidence: 0.9,
          predictionStatus: 'PENDING',
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          type: 'PROACTIVE_WARNING',
          message: 'You may struggle with Cardiac Electrophysiology',
          priority: 8,
        },
      ],
    })
  }),

  // POST /predictions/:id/feedback - Submit prediction feedback
  http.post(`${ML_SERVICE_URL}/predictions/:id/feedback`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as {
      actualStruggle: boolean
      feedbackType: string
      comments?: string
    }

    return HttpResponse.json({
      success: true,
      feedbackRecorded: true,
      predictionId: id,
      modelAccuracyUpdate: 0.78,
    })
  }),

  // GET /interventions - Get active interventions
  http.get(`${ML_SERVICE_URL}/interventions`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'kevy@americano.dev'

    return HttpResponse.json({
      success: true,
      interventions: [
        {
          id: 'int-1',
          predictionId: 'pred-1',
          userId,
          interventionType: 'PREREQUISITE_REVIEW',
          description: 'Review prerequisite topics before studying',
          reasoning: 'You have 2 unmastered prerequisites',
          priority: 9,
          status: 'PENDING',
          effectiveness: 0.85,
        },
        {
          id: 'int-2',
          predictionId: 'pred-2',
          userId,
          interventionType: 'DIFFICULTY_PROGRESSION',
          description: 'Start with foundational content',
          reasoning: 'Topic complexity exceeds current level',
          priority: 7,
          status: 'PENDING',
          effectiveness: 0.72,
        },
      ],
      count: 2,
    })
  }),

  // POST /interventions/:id/apply - Apply intervention to mission
  http.post(`${ML_SERVICE_URL}/interventions/:id/apply`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as { applyToMissionId?: string }

    return HttpResponse.json({
      success: true,
      interventionId: id,
      applied: true,
      missionId: body.applyToMissionId || 'mission-auto-generated',
      message: 'Intervention applied to mission successfully',
    })
  }),

  // GET /model-performance - Get model accuracy metrics
  http.get(`${ML_SERVICE_URL}/model-performance`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'kevy@americano.dev'

    return HttpResponse.json({
      success: true,
      userId,
      accuracy: 0.78,
      precision: 0.75,
      recall: 0.82,
      f1Score: 0.78,
      calibration: 0.85,
      lastUpdated: new Date().toISOString(),
      dataPoints: 156,
      trend: [
        { date: '2025-10-01', accuracy: 0.72 },
        { date: '2025-10-08', accuracy: 0.75 },
        { date: '2025-10-15', accuracy: 0.78 },
      ],
    })
  }),

  // GET /struggle-reduction - Get struggle reduction metrics
  http.get(`${ML_SERVICE_URL}/struggle-reduction`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || 'kevy@americano.dev'
    const period = url.searchParams.get('period') || 'month'

    return HttpResponse.json({
      success: true,
      userId,
      period,
      baselineRate: 0.42,
      currentRate: 0.28,
      reductionPercentage: 33.3,
      timeline: [
        { week: 1, struggleRate: 0.42 },
        { week: 2, struggleRate: 0.38 },
        { week: 3, struggleRate: 0.32 },
        { week: 4, struggleRate: 0.28 },
      ],
      interventionEffectiveness: [
        {
          type: 'PREREQUISITE_REVIEW',
          applicationsCount: 12,
          successRate: 0.85,
        },
        {
          type: 'DIFFICULTY_PROGRESSION',
          applicationsCount: 8,
          successRate: 0.72,
        },
      ],
    })
  }),
]

/**
 * MSW Server Instance
 *
 * Global server instance for all tests. Tests can override
 * handlers using server.use() for specific test scenarios.
 */
export const server = setupServer(...handlers)

/**
 * Global Test Setup
 *
 * Setup functions for MSW server - import this in your test files
 *
 * Usage:
 * ```typescript
 * import { setupMSW } from '../setup'
 * setupMSW()
 * ```
 */
export function setupMSW() {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' })
  })

  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })
}

/**
 * Helper: Create Error Response Handler
 *
 * Utility for tests that need to simulate ML service errors
 */
export const createErrorHandler = (
  method: 'get' | 'post',
  path: string,
  status: number,
  message: string,
) => {
  const fullPath = `${ML_SERVICE_URL}${path}`

  return http[method](fullPath, () => {
    return HttpResponse.json({ detail: message, error: true }, { status })
  })
}

/**
 * Helper: Create Timeout Handler
 *
 * Utility for tests that simulate network timeouts
 */
export const createTimeoutHandler = (method: 'get' | 'post', path: string) => {
  const fullPath = `${ML_SERVICE_URL}${path}`

  return http[method](fullPath, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000)) // Exceed test timeout
    return HttpResponse.json({})
  })
}

/**
 * Helper: Create 503 Service Unavailable Handler
 *
 * Utility for tests simulating ML service downtime
 */
export const create503Handler = (method: 'get' | 'post', path: string) => {
  const fullPath = `${ML_SERVICE_URL}${path}`

  return http[method](fullPath, () => {
    return new HttpResponse(null, {
      status: 503,
      statusText: 'Service Unavailable',
    })
  })
}

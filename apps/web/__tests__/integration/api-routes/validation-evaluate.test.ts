/**
 * Integration Tests: POST /api/validation/prompts/generate
 *
 * Tests the Next.js API route that proxies to Python FastAPI service for
 * generating comprehension validation prompts (Story 4.1).
 *
 * This demonstrates testing:
 * - Next.js API route handlers (POST method)
 * - Database interactions (Prisma)
 * - External service calls (Python FastAPI)
 * - Request validation (Zod schemas)
 * - Caching logic (7-day prompt cache)
 * - Error handling and edge cases
 */

import { POST } from '@/app/api/validation/prompts/generate/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { server, setupMSW, createErrorHandler, create503Handler } from '../../setup'
import { http, HttpResponse } from 'msw'

// Initialize MSW server
setupMSW()

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    learningObjective: {
      findUnique: jest.fn(),
    },
    validationPrompt: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

describe('POST /api/validation/prompts/generate - Integration Tests', () => {
  /**
   * Setup: Mock database responses for common scenarios
   */
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Default mock: Objective exists in database
    ;(prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue({
      id: 'obj-123',
      objective: 'Understand cardiac conduction system',
      lecture: {
        id: 'lecture-456',
        title: 'Cardiac Electrophysiology',
        course: {
          id: 'course-789',
          name: 'Cardiovascular System',
        },
      },
    })

    // Default mock: No cached prompt (will generate new one)
    ;(prisma.validationPrompt.findFirst as jest.Mock).mockResolvedValue(null)

    // Default mock: Prompt creation succeeds
    ;(prisma.validationPrompt.create as jest.Mock).mockResolvedValue({
      id: 'prompt-new-123',
      promptText:
        'Explain the cardiac conduction system to a patient who just had an EKG.',
      promptType: 'EXPLAIN_TO_PATIENT',
      conceptName: 'Cardiac Conduction System',
      expectedCriteria: [
        'SA node as pacemaker',
        'AV node delay',
        'Bundle of His',
        'Purkinje fibers',
      ],
      objectiveId: 'obj-123',
      promptData: {
        templateType: 'scenario',
        variation: 'standard',
        seed: 0.123456,
      },
      createdAt: new Date(),
    })
  })

  /**
   * Add Python service MSW handler for prompt generation
   */
  beforeAll(() => {
    server.use(
      http.post(`${PYTHON_SERVICE_URL}/validation/generate-prompt`, async ({ request }) => {
        const body = (await request.json()) as any
        return HttpResponse.json({
          prompt_text: `Explain ${body.objective_text} to a patient in simple terms.`,
          concept_name: body.objective_text,
          expected_criteria: [
            'Uses appropriate terminology',
            'Explains relationships',
            'Provides clinical context',
            'Uses clear language',
          ],
          prompt_type: 'DIRECT',
          variation: 'standard',
        })
      }),
    )
  })

  describe('Success Cases - Prompt Generation', () => {
    it('should generate new prompt when no cache exists', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
            sessionId: 'session-456',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      // Should return 200 with new prompt
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.cached).toBe(false)
      expect(data.data.prompt).toMatchObject({
        id: expect.any(String),
        promptText: expect.any(String),
        promptType: 'EXPLAIN_TO_PATIENT',
        conceptName: expect.any(String),
        expectedCriteria: expect.any(Array),
        objectiveId: 'obj-123',
      })

      // Verify database calls
      expect(prisma.learningObjective.findUnique).toHaveBeenCalledWith({
        where: { id: 'obj-123' },
        include: {
          lecture: {
            include: {
              course: true,
            },
          },
        },
      })

      expect(prisma.validationPrompt.findFirst).toHaveBeenCalled()
      expect(prisma.validationPrompt.create).toHaveBeenCalled()
    })

    it('should return cached prompt when available', async () => {
      // Mock cached prompt exists (created 3 days ago)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      ;(prisma.validationPrompt.findFirst as jest.Mock).mockResolvedValue({
        id: 'prompt-cached-123',
        promptText: 'Cached prompt: Explain cardiac conduction to a patient.',
        promptType: 'EXPLAIN_TO_PATIENT',
        conceptName: 'Cardiac Conduction System',
        expectedCriteria: ['SA node', 'AV node', 'Bundle of His'],
        objectiveId: 'obj-123',
        createdAt: threeDaysAgo,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      // Should return cached prompt
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.cached).toBe(true)
      expect(data.data.prompt.id).toBe('prompt-cached-123')

      // Should NOT call Python service or create new prompt
      expect(prisma.validationPrompt.create).not.toHaveBeenCalled()
    })

    it('should pass correct context to Python service', async () => {
      let pythonRequestBody: any = null

      // Override MSW handler to capture request
      server.use(
        http.post(`${PYTHON_SERVICE_URL}/validation/generate-prompt`, async ({ request }) => {
          pythonRequestBody = await request.json()
          return HttpResponse.json({
            prompt_text: 'Test prompt',
            concept_name: 'Test concept',
            expected_criteria: ['Test criteria'],
            prompt_type: 'DIRECT',
            variation: 'standard',
          })
        }),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      await POST(request)

      // Verify Python service received correct data
      expect(pythonRequestBody).toMatchObject({
        objective_id: 'obj-123',
        objective_text: 'Understand cardiac conduction system',
        lecture_title: 'Cardiac Electrophysiology',
        course_name: 'Cardiovascular System',
      })
    })

    it('should handle optional sessionId parameter', async () => {
      const requestWithSession = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
            sessionId: 'session-456',
          }),
        },
      )

      const response = await POST(requestWithSession)
      expect(response.status).toBe(200)
    })

    it('should save prompt with correct metadata', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      await POST(request)

      // Verify prompt was saved with correct structure
      expect(prisma.validationPrompt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          promptText: expect.any(String),
          promptType: 'EXPLAIN_TO_PATIENT',
          conceptName: expect.any(String),
          expectedCriteria: expect.any(Array),
          objectiveId: 'obj-123',
          promptData: expect.objectContaining({
            templateType: expect.any(String),
            variation: expect.any(String),
            seed: expect.any(Number),
          }),
        }),
      })
    })
  })

  describe('Error Cases - Validation Errors', () => {
    it('should return 400 for missing objectiveId', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({}), // Missing objectiveId
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
      expect(data.message).toBe('Invalid request data')
    })

    it('should return 400 for invalid objectiveId format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'invalid-id-format', // Not a CUID
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for invalid sessionId format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'clxyz12345678901234567', // Valid CUID
            sessionId: 'not-a-cuid', // Invalid CUID
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for malformed JSON', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: 'not-valid-json', // Malformed JSON
        },
      )

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Error Cases - Database Errors', () => {
    it('should return 404 when objective not found', async () => {
      // Mock objective not found
      ;(prisma.learningObjective.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-nonexistent',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('OBJECTIVE_NOT_FOUND')
      expect(data.message).toBe('Objective not found')
    })

    it('should return 500 for database connection errors', async () => {
      // Mock database error
      ;(prisma.learningObjective.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('INTERNAL_ERROR')
    })

    it('should return 500 when prompt creation fails', async () => {
      // Mock prompt creation failure
      ;(prisma.validationPrompt.create as jest.Mock).mockRejectedValue(
        new Error('Failed to save prompt'),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('INTERNAL_ERROR')
    })
  })

  describe('Error Cases - Python Service Errors', () => {
    it('should return 500 when Python service returns 500', async () => {
      server.use(
        createErrorHandler(
          'post',
          '/validation/generate-prompt',
          500,
          'Internal server error',
        ),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('PYTHON_SERVICE_ERROR')
    })

    it('should return 500 when Python service is unavailable (503)', async () => {
      server.use(create503Handler('post', '/validation/generate-prompt'))

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('PYTHON_SERVICE_ERROR')
    })

    it('should return 500 when Python service returns malformed JSON', async () => {
      server.use(
        http.post(`${PYTHON_SERVICE_URL}/validation/generate-prompt`, () => {
          return new HttpResponse('not-valid-json', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
          })
        }),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle network timeout gracefully', async () => {
      server.use(
        http.post(`${PYTHON_SERVICE_URL}/validation/generate-prompt`, async () => {
          // Simulate timeout (Jest will timeout the test if this takes too long)
          await new Promise((resolve) => setTimeout(resolve, 100))
          throw new Error('Network timeout')
        }),
      )

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('Edge Cases - Cache Behavior', () => {
    it('should generate new prompt when cache is older than 7 days', async () => {
      // Mock cached prompt older than 7 days
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      ;(prisma.validationPrompt.findFirst as jest.Mock).mockResolvedValue({
        id: 'prompt-old-123',
        promptText: 'Old prompt',
        promptType: 'EXPLAIN_TO_PATIENT',
        conceptName: 'Old concept',
        expectedCriteria: ['Old criteria'],
        objectiveId: 'obj-123',
        createdAt: eightDaysAgo,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      // Should generate new prompt (cache expired)
      expect(data.data.cached).toBe(false)
      expect(prisma.validationPrompt.create).toHaveBeenCalled()
    })

    it('should return most recent cached prompt when multiple exist', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      ;(prisma.validationPrompt.findFirst as jest.Mock).mockResolvedValue({
        id: 'prompt-most-recent',
        promptText: 'Most recent cached prompt',
        promptType: 'EXPLAIN_TO_PATIENT',
        conceptName: 'Concept',
        expectedCriteria: ['Criteria'],
        objectiveId: 'obj-123',
        createdAt: twoDaysAgo,
      })

      const request = new NextRequest(
        'http://localhost:3000/api/validation/prompts/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        },
      )

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.cached).toBe(true)
      expect(data.data.prompt.id).toBe('prompt-most-recent')

      // Verify findFirst was called with orderBy createdAt desc
      expect(prisma.validationPrompt.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: 'desc',
          },
        }),
      )
    })
  })

  describe('Edge Cases - Concurrent Requests', () => {
    it('should handle concurrent requests for same objective', async () => {
      const requests = Array.from({ length: 5 }, () =>
        POST(
          new NextRequest('http://localhost:3000/api/validation/prompts/generate', {
            method: 'POST',
            body: JSON.stringify({
              objectiveId: 'obj-123',
            }),
          }),
        ),
      )

      const responses = await Promise.all(requests)

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle mixed cache hits and misses', async () => {
      // First request: no cache
      const request1 = POST(
        new NextRequest('http://localhost:3000/api/validation/prompts/generate', {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        }),
      )

      // Second request: simulate cache hit
      ;(prisma.validationPrompt.findFirst as jest.Mock).mockResolvedValue({
        id: 'prompt-cached',
        promptText: 'Cached',
        promptType: 'EXPLAIN_TO_PATIENT',
        conceptName: 'Concept',
        expectedCriteria: [],
        objectiveId: 'obj-123',
        createdAt: new Date(),
      })

      const request2 = POST(
        new NextRequest('http://localhost:3000/api/validation/prompts/generate', {
          method: 'POST',
          body: JSON.stringify({
            objectiveId: 'obj-123',
          }),
        }),
      )

      const [response1, response2] = await Promise.all([request1, request2])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })
  })
})

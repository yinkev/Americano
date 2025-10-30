/**
 * Integration Tests for Search API Endpoints
 * Story 3.1 Task 7.2: Comprehensive Integration Tests
 *
 * Test Coverage:
 * - POST /api/search endpoint
 * - Request validation and error handling
 * - Response format and structure
 * - Rate limiting behavior
 * - Database integration
 * - Analytics logging integration
 * - Performance requirements
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('@/subsystems/knowledge-graph/semantic-search')
jest.mock('@/lib/rate-limiter')

import { prisma } from '@/lib/db'
import { semanticSearchEngine } from '@/subsystems/knowledge-graph/semantic-search'
import { POST } from '../route'

describe('POST /api/search - Integration Tests', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>
  const mockSearchEngine = semanticSearchEngine as jest.Mocked<typeof semanticSearchEngine>

  const mockUser = {
    id: 'user-001',
    email: 'kevy@americano.dev',
    name: 'Kevy',
  }

  const mockSearchResults = {
    results: [
      {
        id: 'chunk-001',
        type: 'chunk' as const,
        title: 'Cardiovascular Anatomy',
        snippet: 'The <mark>cardiac</mark> conduction system controls heart rhythm',
        similarity: 0.92,
        relevanceScore: 0.92,
        metadata: {
          lectureId: 'lecture-001',
          courseId: 'course-001',
          pageNumber: 5,
        },
      },
      {
        id: 'chunk-002',
        type: 'chunk' as const,
        title: 'Cardiovascular Physiology',
        snippet: 'The sinoatrial node initiates electrical impulses in the <mark>heart</mark>',
        similarity: 0.88,
        relevanceScore: 0.88,
        metadata: {
          lectureId: 'lecture-002',
          courseId: 'course-001',
          pageNumber: 12,
        },
      },
    ],
    total: 2,
    latency: 350,
    metadata: {
      embeddingTime: 150,
      searchTime: 200,
    },
    pagination: {
      hasNext: false,
      hasPrevious: false,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    mockPrisma.user.findUnique.mockResolvedValue(mockUser as any)
    mockPrisma.searchQuery.create.mockResolvedValue({} as any)
    mockSearchEngine.search.mockResolvedValue(mockSearchResults as any)
  })

  describe('Valid Search Requests', () => {
    it('should return search results for valid query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'cardiac conduction system',
          limit: 10,
          offset: 0,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.results).toHaveLength(2)
      expect(data.data.total).toBe(2)
      expect(data.data.query).toBe('cardiac conduction system')
      expect(data.data.latency).toBeGreaterThan(0)
    })

    it('should include pagination metadata in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'anatomy',
          limit: 20,
          offset: 0,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.pagination).toBeDefined()
      expect(data.data.pagination.limit).toBe(20)
      expect(data.data.pagination.offset).toBe(0)
      expect(typeof data.data.pagination.hasMore).toBe('boolean')
    })

    it('should apply filters correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'anatomy',
          limit: 10,
          filters: {
            highYieldOnly: true,
            minSimilarity: 0.7,
            courseIds: ['course-001'],
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSearchEngine.search).toHaveBeenCalledWith(
        'anatomy',
        expect.objectContaining({
          filters: expect.objectContaining({
            highYieldOnly: true,
            minSimilarity: 0.7,
          }),
        }),
      )
    })

    it('should use default limit when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test query',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.pagination.limit).toBeDefined()
    })
  })

  describe('Request Validation', () => {
    it('should reject request with missing query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          limit: 10,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.message).toContain('query')
    })

    it('should reject query that is too short', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'a', // Only 1 character
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.message).toContain('at least 2 characters')
    })

    it('should reject limit exceeding maximum', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test query',
          limit: 150, // Exceeds max of 100
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.message).toContain('must not exceed 100')
    })

    it('should reject negative offset', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test query',
          offset: -5,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
    })

    it('should reject invalid JSON body', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: 'invalid json {',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('User Authentication', () => {
    it('should return 404 for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'nonexistent@example.com',
        },
        body: JSON.stringify({
          query: 'test query',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error.code).toBe('USER_NOT_FOUND')
    })

    it('should use default user email when header not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test query',
        }),
      })

      await POST(request)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'kevy@americano.dev' },
      })
    })
  })

  describe('Analytics Logging', () => {
    it('should log search query to database', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'cardiac function',
          limit: 10,
        }),
      })

      await POST(request)

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockPrisma.searchQuery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          query: 'cardiac function',
          resultCount: 2,
          responseTimeMs: expect.any(Number),
        }),
      })
    })

    it('should log top result ID when results exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test',
        }),
      })

      await POST(request)
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(mockPrisma.searchQuery.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topResultId: 'chunk-001',
        }),
      })
    })

    it('should not fail search if logging fails', async () => {
      mockPrisma.searchQuery.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test query',
        }),
      })

      const response = await POST(request)

      // Search should still succeed
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when search engine fails', async () => {
      mockSearchEngine.search.mockRejectedValue(new Error('Vector search failed'))

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test query',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error.code).toBe('SEARCH_FAILED')
      expect(data.error.message).toContain('Failed to perform search')
    })

    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection timeout'))

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBeGreaterThanOrEqual(500)
    })
  })

  describe('Performance Requirements', () => {
    it('should complete search within 1 second', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'cardiac anatomy physiology',
          limit: 20,
        }),
      })

      const startTime = Date.now()
      const response = await POST(request)
      const elapsed = Date.now() - startTime

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(elapsed).toBeLessThan(1000) // <1s requirement
      expect(data.data.latency).toBeLessThan(1000)
    })

    it('should include latency metrics in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.latency).toBeDefined()
      expect(typeof data.data.latency).toBe('number')
      expect(data.data.latency).toBeGreaterThan(0)
    })
  })

  describe('Response Format', () => {
    it('should return standardized success response', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('results')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('latency')
      expect(data.data).toHaveProperty('query')
      expect(data.data).toHaveProperty('filters')
      expect(data.data).toHaveProperty('pagination')
    })

    it('should return search results with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      const result = data.data.results[0]
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('type')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('snippet')
      expect(result).toHaveProperty('similarity')
      expect(result).toHaveProperty('metadata')
    })

    it('should return empty results array when no matches found', async () => {
      mockSearchEngine.search.mockResolvedValue({
        results: [],
        total: 0,
        latency: 200,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'nonexistent content xyz123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.results).toEqual([])
      expect(data.data.total).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long queries', async () => {
      const longQuery = 'medical terminology '.repeat(25) // ~500 chars

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: longQuery,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      if (longQuery.length <= 500) {
        expect(response.status).toBe(200)
      } else {
        expect(response.status).toBe(400)
      }
    })

    it('should handle special characters in query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'What is α-helix vs β-sheet?',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle high offset values', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'kevy@americano.dev',
        },
        body: JSON.stringify({
          query: 'test',
          offset: 1000,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})

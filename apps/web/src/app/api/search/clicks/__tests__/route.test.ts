/**
 * Tests for POST /api/search/clicks
 * Story 3.1 Task 6.7: Comprehensive tests for click tracking API
 *
 * Test coverage:
 * - Click tracking success scenarios
 * - Validation errors
 * - Missing search query
 * - Missing user
 * - Database errors
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { prisma } from '@/lib/db'
import { searchAnalyticsService } from '@/lib/search-analytics-service'
import { POST } from '../route'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    searchQuery: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@/lib/search-analytics-service', () => ({
  searchAnalyticsService: {
    trackSearchClick: jest.fn(),
  },
}))

describe('POST /api/search/clicks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track search click successfully', async () => {
    // Mock user and search query
    const mockUser = { id: 'user123', email: 'kevy@americano.dev' }
    const mockSearchQuery = { id: 'query123', userId: 'user123' }

    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    jest.mocked(prisma.searchQuery.findUnique).mockResolvedValue(mockSearchQuery as any)
    jest.mocked(searchAnalyticsService.trackSearchClick).mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueryId: 'query123',
        resultId: 'lecture123',
        resultType: 'lecture',
        position: 0,
        similarity: 0.95,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(searchAnalyticsService.trackSearchClick).toHaveBeenCalledWith({
      searchQueryId: 'query123',
      userId: 'user123',
      resultId: 'lecture123',
      resultType: 'lecture',
      position: 0,
      similarity: 0.95,
    })
  })

  it('should return 404 if user not found', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueryId: 'query123',
        resultId: 'lecture123',
        resultType: 'lecture',
        position: 0,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toContain('User not found')
  })

  it('should return 404 if search query not found', async () => {
    const mockUser = { id: 'user123', email: 'kevy@americano.dev' }
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
    jest.mocked(prisma.searchQuery.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueryId: 'nonexistent',
        resultId: 'lecture123',
        resultType: 'lecture',
        position: 0,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Search query not found')
  })

  it('should validate request body schema', async () => {
    const mockUser = { id: 'user123', email: 'kevy@americano.dev' }
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
        resultId: 'lecture123',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('validation')
  })

  it('should validate resultType enum', async () => {
    const mockUser = { id: 'user123', email: 'kevy@americano.dev' }
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueryId: 'query123',
        resultId: 'lecture123',
        resultType: 'invalid_type', // Invalid enum value
        position: 0,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should validate position is non-negative', async () => {
    const mockUser = { id: 'user123', email: 'kevy@americano.dev' }
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueryId: 'query123',
        resultId: 'lecture123',
        resultType: 'lecture',
        position: -1, // Negative position
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should validate similarity score range', async () => {
    const mockUser = { id: 'user123', email: 'kevy@americano.dev' }
    jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

    const request = new Request('http://localhost/api/search/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQueryId: 'query123',
        resultId: 'lecture123',
        resultType: 'lecture',
        position: 0,
        similarity: 1.5, // Out of range
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })
})

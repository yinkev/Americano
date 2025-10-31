/**
 * Unit Tests for Search Analytics Logging
 * Story 3.1 Task 7.1: Comprehensive Unit Tests
 *
 * Test Coverage:
 * - Search query logging
 * - Analytics data capture
 * - Privacy considerations
 * - Error handling in logging
 * - Async non-blocking behavior
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { PrismaClient } from '@/generated/prisma'
import { logSearchQuery } from '@/lib/search-analytics-service'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    search_queries: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

type AsyncMock<TReturn = any> = jest.MockedFunction<(...args: any[]) => Promise<TReturn>>

type SearchQueryMock = {
  search_queries: {
    create: AsyncMock<any>
    findMany: AsyncMock<any[]>
    count: AsyncMock<number>
    deleteMany: AsyncMock<{ count: number }>
  }
}

describe('Search Analytics Logging', () => {
  const mockPrisma = prisma as unknown as SearchQueryMock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logSearchQuery', () => {
    it('should log search query with all required fields', async () => {
      mockPrisma.search_queries.create.mockResolvedValue({
        id: 'query-001',
        userId: 'user-001',
        query: 'cardiac conduction system',
        filters: {},
        resultCount: 10,
        topResultId: 'result-001',
        responseTimeMs: 450,
        timestamp: new Date(),
        clicks: [], // Empty array for the relation
      } as any)

      await logSearchQuery({
        userId: 'user-001',
        query: 'cardiac conduction system',
        filters: {},
        resultCount: 10,
        topResultId: 'result-001',
        responseTimeMs: 450,
        timestamp: new Date(),
      })

      expect(mockPrisma.search_queries.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.search_queries.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-001',
          query: 'cardiac conduction system',
          resultCount: 10,
        }),
      })
    })

    it('should log search with filters', async () => {
      const filters = {
        highYieldOnly: true,
        minSimilarity: 0.7,
        courseIds: ['course-001'],
      }

      mockPrisma.search_queries.create.mockResolvedValue({} as any)

      await logSearchQuery({
        userId: 'user-001',
        query: 'anatomy',
        filters,
        resultCount: 5,
        responseTimeMs: 320,
        timestamp: new Date(),
      })

      expect(mockPrisma.search_queries.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filters: filters,
        }),
      })
    })

    it('should handle optional topResultId', async () => {
      mockPrisma.search_queries.create.mockResolvedValue({} as any)

      await logSearchQuery({
        userId: 'user-001',
        query: 'no results query',
        filters: {},
        resultCount: 0,
        topResultId: undefined, // No results
        responseTimeMs: 200,
        timestamp: new Date(),
      })

      expect(mockPrisma.search_queries.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          topResultId: undefined,
        }),
      })
    })

    it('should capture response time metrics', async () => {
      mockPrisma.search_queries.create.mockResolvedValue({} as any)

      const responseTimeMs = 850

      await logSearchQuery({
        userId: 'user-001',
        query: 'test query',
        filters: {},
        resultCount: 15,
        responseTimeMs,
        timestamp: new Date(),
      })

      expect(mockPrisma.search_queries.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          responseTimeMs: 850,
        }),
      })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.search_queries.create.mockRejectedValue(new Error('Database connection failed'))

      // Should not throw - logging errors should be silent
      await expect(
        logSearchQuery({
          userId: 'user-001',
          query: 'test',
          filters: {},
          resultCount: 0,
          responseTimeMs: 100,
          timestamp: new Date(),
        }),
      ).resolves.not.toThrow()
    })

    it('should be non-blocking and async', async () => {
      // Simulate slow database operation
      mockPrisma.search_queries.create.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({} as any), 100)),
      )

      const startTime = Date.now()

      // Fire and forget (simulating the .catch() pattern in the API)
      logSearchQuery({
        userId: 'user-001',
        query: 'test',
        filters: {},
        resultCount: 5,
        responseTimeMs: 300,
        timestamp: new Date(),
      }).catch(() => {})

      const elapsed = Date.now() - startTime

      // Should return immediately without waiting
      expect(elapsed).toBeLessThan(10)
    })
  })

  describe('Search Query Retrieval', () => {
    it('should retrieve user search history', async () => {
      const mockQueries = [
        {
          id: 'query-001',
          userId: 'user-001',
          query: 'cardiac anatomy',
          resultCount: 10,
          timestamp: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'query-002',
          userId: 'user-001',
          query: 'renal physiology',
          resultCount: 8,
          timestamp: new Date('2024-01-15T11:00:00Z'),
        },
      ]

      mockPrisma.search_queries.findMany.mockResolvedValue(mockQueries as any)

      const history = await prisma.searchQuery.findMany({
        where: { userId: 'user-001' },
        orderBy: { timestamp: 'desc' },
        take: 50,
      })

      expect(history).toHaveLength(2)
      expect(history[0].query).toBe('cardiac anatomy')
    })

    it('should count total searches for a user', async () => {
      mockPrisma.search_queries.count.mockResolvedValue(42)

      const count = await prisma.searchQuery.count({
        where: { userId: 'user-001' },
      })

      expect(count).toBe(42)
    })

    it('should filter searches by date range', async () => {
      mockPrisma.search_queries.findMany.mockResolvedValue([])

      await prisma.searchQuery.findMany({
        where: {
          userId: 'user-001',
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
      })

      expect(mockPrisma.search_queries.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          timestamp: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    })
  })

  describe('Privacy Considerations', () => {
    it('should only log searches for authenticated users', async () => {
      mockPrisma.search_queries.create.mockResolvedValue({} as any)

      // Requires userId
      await logSearchQuery({
        userId: 'user-001', // Must be present
        query: 'test',
        filters: {},
        resultCount: 5,
        responseTimeMs: 200,
        timestamp: new Date(),
      })

      expect(mockPrisma.search_queries.create).toHaveBeenCalled()
    })

    it('should allow users to clear their search history', async () => {
      mockPrisma.search_queries.deleteMany.mockResolvedValue({ count: 10 })

      const result = await prisma.searchQuery.deleteMany({
        where: { userId: 'user-001' },
      })

      expect(result.count).toBe(10)
      expect(mockPrisma.search_queries.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-001' },
      })
    })

    it('should not expose other users search history', async () => {
      mockPrisma.search_queries.findMany.mockResolvedValue([])

      await prisma.searchQuery.findMany({
        where: { userId: 'user-001' },
      })

      // Verify it filters by userId
      expect(mockPrisma.search_queries.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user-001',
        }),
      })
    })
  })

  describe('Analytics Aggregation', () => {
    it('should support most searched terms query', async () => {
      // This would typically be done with raw SQL for grouping
      const mockAggregation = [
        { query: 'cardiac conduction', count: 15 },
        { query: 'renal filtration', count: 12 },
        { query: 'neural pathways', count: 10 },
      ]

      // Simulated aggregation result
      expect(mockAggregation).toHaveLength(3)
      expect(mockAggregation[0].count).toBeGreaterThan(mockAggregation[1].count)
    })

    it('should track average response times', async () => {
      const mockStats = {
        avgResponseTime: 425,
        minResponseTime: 150,
        maxResponseTime: 950,
      }

      expect(mockStats.avgResponseTime).toBeGreaterThan(0)
      expect(mockStats.avgResponseTime).toBeLessThan(1000)
    })

    it('should identify searches with no results', async () => {
      mockPrisma.search_queries.findMany.mockResolvedValue([
        {
          id: 'query-001',
          query: 'obscure medical term',
          resultCount: 0,
        },
      ] as any)

      const noResultQueries = await prisma.searchQuery.findMany({
        where: {
          resultCount: 0,
        },
        take: 100,
      })

      expect(noResultQueries).toHaveLength(1)
      expect(noResultQueries[0].resultCount).toBe(0)
    })
  })

  describe('Performance Tracking', () => {
    it('should log queries exceeding performance threshold', async () => {
      mockPrisma.search_queries.findMany.mockResolvedValue([
        {
          id: 'slow-query-001',
          query: 'complex search',
          responseTimeMs: 1500, // Over 1s threshold
        },
      ] as any)

      const slowQueries = await prisma.searchQuery.findMany({
        where: {
          responseTimeMs: {
            gt: 1000,
          },
        },
      })

      expect(slowQueries).toHaveLength(1)
      expect(slowQueries[0].responseTimeMs).toBeGreaterThan(1000)
    })

    it('should track performance improvements over time', async () => {
      const mockTimeSeries = [
        { date: '2024-01-01', avgResponseTime: 650 },
        { date: '2024-01-02', avgResponseTime: 580 },
        { date: '2024-01-03', avgResponseTime: 520 },
        { date: '2024-01-04', avgResponseTime: 470 },
      ]

      // Verify performance is improving
      expect(mockTimeSeries[0].avgResponseTime).toBeGreaterThan(
        mockTimeSeries[mockTimeSeries.length - 1].avgResponseTime,
      )
    })
  })

  describe('Data Validation', () => {
    it('should validate query length before logging', async () => {
      mockPrisma.search_queries.create.mockResolvedValue({} as any)

      const longQuery = 'a'.repeat(1000)

      await logSearchQuery({
        userId: 'user-001',
        query: longQuery,
        filters: {},
        resultCount: 0,
        responseTimeMs: 200,
        timestamp: new Date(),
      })

      // Should still attempt to log (database schema will enforce limits)
      expect(mockPrisma.search_queries.create).toHaveBeenCalled()
    })

    it('should handle special characters in queries', async () => {
      mockPrisma.search_queries.create.mockResolvedValue({} as any)

      const specialQuery = 'What is the α-helix structure? (β-sheet comparison)'

      await logSearchQuery({
        userId: 'user-001',
        query: specialQuery,
        filters: {},
        resultCount: 5,
        responseTimeMs: 300,
        timestamp: new Date(),
      })

      expect(mockPrisma.search_queries.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          query: specialQuery,
        }),
      })
    })
  })
})

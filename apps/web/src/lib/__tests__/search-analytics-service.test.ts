/**
 * Tests for SearchAnalyticsService
 * Story 3.1 Task 6.7: Comprehensive tests for analytics service
 *
 * Test coverage:
 * - Popular searches retrieval
 * - Zero-result queries detection
 * - CTR analytics calculation
 * - Performance metrics aggregation
 * - Search suggestions
 * - Privacy compliance (anonymization, deletion)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import {
  trackSearchClick,
  getPopularSearches,
  getZeroResultQueries,
  getClickThroughRateAnalytics,
  getSearchPerformanceMetrics,
  getSearchSuggestions,
  anonymizeOldSearchQueries,
  deleteAnonymizedSearchData,
  getSearchAnalyticsSummary,
} from '../search-analytics-service'
import { prisma } from '@/lib/db'

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    searchClick: {
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    searchQuery: {
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

describe('SearchAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('trackSearchClick', () => {
    it('should track search click successfully', async () => {
      jest.mocked(prisma.searchClick.create).mockResolvedValue({} as any)

      await trackSearchClick({
        searchQueryId: 'query123',
        userId: 'user123',
        resultId: 'lecture123',
        resultType: 'lecture',
        position: 0,
        similarity: 0.95,
      })

      expect(prisma.searchClick.create).toHaveBeenCalledWith({
        data: {
          searchQueryId: 'query123',
          userId: 'user123',
          resultId: 'lecture123',
          resultType: 'lecture',
          position: 0,
          similarity: 0.95,
        },
      })
    })

    it('should not throw on error (silent failure)', async () => {
      jest.mocked(prisma.searchClick.create).mockRejectedValue(new Error('Database error'))

      // Should not throw
      await expect(
        trackSearchClick({
          searchQueryId: 'query123',
          userId: 'user123',
          resultId: 'lecture123',
          resultType: 'lecture',
          position: 0,
        })
      ).resolves.not.toThrow()
    })
  })

  describe('getPopularSearches', () => {
    it('should return popular searches', async () => {
      const mockResults = [
        { query: 'cardiac anatomy', count: 15n, avgResults: 12.5 },
        { query: 'muscle physiology', count: 10n, avgResults: 8.2 },
      ]

      jest.mocked(prisma.$queryRaw).mockResolvedValue(mockResults)

      const result = await getPopularSearches('user123', 10, 30)

      expect(result).toEqual([
        { query: 'cardiac anatomy', count: 15, avgResults: 12.5 },
        { query: 'muscle physiology', count: 10, avgResults: 8.2 },
      ])
    })

    it('should handle database errors gracefully', async () => {
      jest.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Database error'))

      const result = await getPopularSearches('user123', 10, 30)

      expect(result).toEqual([])
    })
  })

  describe('getZeroResultQueries', () => {
    it('should return queries with no results', async () => {
      const mockResults = [
        {
          query: 'nonexistent topic',
          count: 5n,
          lastSearched: new Date('2025-01-15'),
        },
      ]

      jest.mocked(prisma.$queryRaw).mockResolvedValue(mockResults)

      const result = await getZeroResultQueries('user123', 10, 30)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        query: 'nonexistent topic',
        count: 5,
      })
    })
  })

  describe('getClickThroughRateAnalytics', () => {
    it('should calculate CTR correctly', async () => {
      jest.mocked(prisma.searchQuery.count).mockResolvedValue(100)
      jest.mocked(prisma.searchClick.count).mockResolvedValue(30)
      jest.mocked(prisma.$queryRaw).mockResolvedValue([
        { position: 0, clicks: 20n, searches: 100n },
        { position: 1, clicks: 10n, searches: 100n },
      ])

      const result = await getClickThroughRateAnalytics('user123', 30)

      expect(result.overallCTR).toBe(0.3) // 30/100
      expect(result.totalSearches).toBe(100)
      expect(result.totalClicks).toBe(30)
      expect(result.byPosition).toHaveLength(2)
      expect(result.byPosition[0]).toMatchObject({
        position: 0,
        clicks: 20,
        ctr: 0.2,
      })
    })

    it('should handle zero searches gracefully', async () => {
      jest.mocked(prisma.searchQuery.count).mockResolvedValue(0)
      jest.mocked(prisma.searchClick.count).mockResolvedValue(0)
      jest.mocked(prisma.$queryRaw).mockResolvedValue([])

      const result = await getClickThroughRateAnalytics('user123', 30)

      expect(result.overallCTR).toBe(0)
      expect(result.byPosition).toEqual([])
    })
  })

  describe('getSearchPerformanceMetrics', () => {
    it('should calculate performance metrics', async () => {
      jest.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([
          {
            avgResponseTime: 250.5,
            avgResults: 12.3,
            totalSearches: 150n,
          },
        ])
        .mockResolvedValueOnce([{ p95: 450 }])

      const result = await getSearchPerformanceMetrics('user123', 30)

      expect(result).toMatchObject({
        avgResponseTimeMs: 250.5,
        avgResultsPerQuery: 12.3,
        totalSearches: 150,
        p95ResponseTimeMs: 450,
      })
    })
  })

  describe('getSearchSuggestions', () => {
    it('should return recent search suggestions', async () => {
      const mockResults = [
        {
          query: 'cardiac anatomy',
          frequency: 5n,
          lastSearched: new Date('2025-01-15'),
        },
      ]

      jest.mocked(prisma.$queryRaw).mockResolvedValue(mockResults)

      const result = await getSearchSuggestions('user123', 5)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        query: 'cardiac anatomy',
        frequency: 5,
      })
    })
  })

  describe('anonymizeOldSearchQueries', () => {
    it('should anonymize queries older than threshold', async () => {
      jest.mocked(prisma.searchQuery.updateMany).mockResolvedValue({ count: 25 })

      const count = await anonymizeOldSearchQueries(90)

      expect(count).toBe(25)
      expect(prisma.searchQuery.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isAnonymized: false,
          }),
          data: expect.objectContaining({
            isAnonymized: true,
          }),
        })
      )
    })

    it('should use custom threshold days', async () => {
      jest.mocked(prisma.searchQuery.updateMany).mockResolvedValue({ count: 10 })

      await anonymizeOldSearchQueries(60) // 60 days instead of 90

      expect(prisma.searchQuery.updateMany).toHaveBeenCalled()
    })
  })

  describe('deleteAnonymizedSearchData', () => {
    it('should delete clicks and queries', async () => {
      jest.mocked(prisma.searchClick.deleteMany).mockResolvedValue({ count: 50 })
      jest.mocked(prisma.searchQuery.deleteMany).mockResolvedValue({ count: 20 })

      const result = await deleteAnonymizedSearchData(90)

      expect(result).toEqual({
        queriesDeleted: 20,
        clicksDeleted: 50,
      })

      // Clicks should be deleted first (foreign key)
      expect(prisma.searchClick.deleteMany).toHaveBeenCalled()
      expect(prisma.searchQuery.deleteMany).toHaveBeenCalled()
    })
  })

  describe('getSearchAnalyticsSummary', () => {
    it('should aggregate all analytics', async () => {
      // Mock all sub-functions
      jest.mocked(prisma.$queryRaw)
        .mockResolvedValueOnce([]) // popular searches
        .mockResolvedValueOnce([]) // zero results
        .mockResolvedValueOnce([]) // performance metrics
        .mockResolvedValueOnce([]) // p95

      jest.mocked(prisma.searchQuery.count).mockResolvedValue(100)
      jest.mocked(prisma.searchClick.count).mockResolvedValue(30)

      const result = await getSearchAnalyticsSummary('user123', 30)

      expect(result).toHaveProperty('popularSearches')
      expect(result).toHaveProperty('zeroResultQueries')
      expect(result).toHaveProperty('ctrAnalytics')
      expect(result).toHaveProperty('performanceMetrics')
    })
  })
})

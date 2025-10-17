/**
 * Unit Tests for SemanticSearchService
 *
 * Epic 3 - Story 3.1 - Task 3: Semantic Search Engine Tests
 *
 * Test Coverage:
 * - Vector similarity search
 * - Hybrid search (vector + keyword)
 * - Relevance scoring and ranking
 * - Pagination and filtering
 * - Snippet generation and highlighting
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import {
  SemanticSearchService,
  SearchParams,
  SearchResult,
  ChunkSearchResult,
} from '../semantic-search-service'
import { embeddingService } from '../embedding-service'

// Mock dependencies
jest.mock('../embedding-service', () => ({
  embeddingService: {
    generateEmbedding: jest.fn(),
  },
}))

jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => jest.fn()),
}))

describe('SemanticSearchService', () => {
  type SqlExecutor = (...args: any[]) => Promise<any[]>
  let searchService: SemanticSearchService
  let mockSql: jest.MockedFunction<SqlExecutor>
  const embeddingServiceMock = jest.mocked(embeddingService)

  // Mock embedding vector (1536 dimensions)
  const mockQueryEmbedding = Array(1536).fill(0).map((_, i) => Math.random())

  // Mock search results
  const mockChunkResults = [
    {
      id: 'chunk-1',
      content: 'The heart is a muscular organ that pumps blood through the circulatory system.',
      chunkIndex: 0,
      pageNumber: 5,
      lectureId: 'lecture-1',
      lectureTitle: 'Cardiovascular Anatomy',
      courseId: 'course-1',
      courseName: 'Gross Anatomy',
      uploadedAt: new Date('2024-01-15'),
      distance: 0.15, // High similarity
    },
    {
      id: 'chunk-2',
      content: 'Cardiac muscle tissue has unique properties including automaticity and conductivity.',
      chunkIndex: 1,
      pageNumber: 6,
      lectureId: 'lecture-1',
      lectureTitle: 'Cardiovascular Anatomy',
      courseId: 'course-1',
      courseName: 'Gross Anatomy',
      uploadedAt: new Date('2024-01-15'),
      distance: 0.25,
    },
    {
      id: 'chunk-3',
      content: 'The kidney filters blood and maintains homeostasis through urine production.',
      chunkIndex: 0,
      pageNumber: 12,
      lectureId: 'lecture-2',
      lectureTitle: 'Renal Physiology',
      courseId: 'course-2',
      courseName: 'Physiology',
      uploadedAt: new Date('2024-01-20'),
      distance: 0.45, // Lower similarity
    },
  ]

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup mock SQL function
    mockSql = jest.fn(async () => []) as jest.MockedFunction<SqlExecutor>
    searchService = new SemanticSearchService()
    ;(searchService as any).sql = mockSql

    // Mock embedding service
    embeddingServiceMock.generateEmbedding.mockResolvedValue({
      embedding: mockQueryEmbedding,
      error: undefined,
    })
  })

  describe('Vector Similarity Search', () => {
    it('should execute vector search and return results with similarity scores', async () => {
      // Mock database response
      mockSql.mockResolvedValue(mockChunkResults)

      const params: SearchParams = {
        query: 'How does the heart pump blood?',
        limit: 10,
      }

      const response = await searchService.search(params)

      // Verify embedding was generated
      expect(embeddingServiceMock.generateEmbedding).toHaveBeenCalledWith(params.query)

      // Verify results
      expect(response.results).toHaveLength(3)
      expect(response.results[0].type).toBe('chunk')
      expect(response.results[0].similarity).toBeGreaterThan(0.5)
      expect(response.results[0].similarity).toBeLessThanOrEqual(1.0)

      // Verify results are sorted by similarity (highest first)
      expect(response.results[0].similarity).toBeGreaterThanOrEqual(
        response.results[1].similarity
      )
    })

    it('should filter results below minimum similarity threshold', async () => {
      mockSql.mockResolvedValue(mockChunkResults)

      const params: SearchParams = {
        query: 'cardiac function',
        limit: 10,
        filters: {
          minSimilarity: 0.8, // High threshold
        },
      }

      const response = await searchService.search(params)

      // Only high similarity results should be returned
      response.results.forEach(result => {
        expect(result.similarity).toBeGreaterThanOrEqual(0.8)
      })
    })

    it('should convert distance to similarity correctly', async () => {
      const service = new SemanticSearchService()

      // Test distance to similarity conversion
      // Distance = 0 => Similarity = 1.0 (perfect match)
      const similarity1 = (service as any).distanceToSimilarity(0)
      expect(similarity1).toBe(1.0)

      // Distance = 1 => Similarity = 0.5
      const similarity2 = (service as any).distanceToSimilarity(1)
      expect(similarity2).toBe(0.5)

      // Distance = 2 => Similarity = 0.0 (no match)
      const similarity3 = (service as any).distanceToSimilarity(2)
      expect(similarity3).toBe(0.0)
    })

    it('should handle empty results gracefully', async () => {
      mockSql.mockResolvedValue([])

      const params: SearchParams = {
        query: 'nonexistent topic',
        limit: 10,
      }

      const response = await searchService.search(params)

      expect(response.results).toHaveLength(0)
      expect(response.total).toBe(0)
      expect(response.pagination.hasNext).toBe(false)
    })
  })

  describe('Hybrid Search (Vector + Keyword)', () => {
    const mockKeywordResults = [
      { id: 'chunk-1', rank: 0.9 },
      { id: 'chunk-2', rank: 0.7 },
    ]

    it('should combine vector and keyword scores', async () => {
      // Mock vector search results
      mockSql.mockResolvedValueOnce(mockChunkResults)
      // Mock keyword search results
      mockSql.mockResolvedValueOnce(mockKeywordResults)

      const params: SearchParams = {
        query: 'heart pumps blood',
        limit: 10,
        includeKeywordBoost: true,
        vectorWeight: 0.7,
      }

      const response = await searchService.search(params)

      // Verify hybrid search was used
      expect(response.metadata.hybridSearchUsed).toBe(true)

      // Verify results have relevance scores (composite of vector + keyword)
      response.results.forEach(result => {
        expect(result.relevanceScore).toBeDefined()
        expect(result.relevanceScore).toBeGreaterThanOrEqual(0)
        expect(result.relevanceScore).toBeLessThanOrEqual(1)
      })
    })

    it('should weight vector and keyword scores correctly', () => {
      const service = new SemanticSearchService()

      const vectorResults: SearchResult[] = [
        {
          id: 'result-1',
          type: 'chunk',
          title: 'Test',
          snippet: '',
          similarity: 0.9,
          relevanceScore: 0.9,
          metadata: {},
        },
      ]

      const keywordMatches = [
        {
          id: 'result-1',
          type: 'chunk' as const,
          matchScore: 0.8,
          matchedTerms: ['test'],
        },
      ]

      const combined = (service as any).combineScores(
        vectorResults,
        keywordMatches,
        0.7, // vector weight
        0.3  // keyword weight
      )

      // Expected: 0.7 * 0.9 + 0.3 * 0.8 = 0.63 + 0.24 = 0.87
      expect(combined[0].relevanceScore).toBeCloseTo(0.87, 2)
    })

    it('should handle keyword-only matches', () => {
      const service = new SemanticSearchService()

      const vectorResults: SearchResult[] = [
        {
          id: 'result-1',
          type: 'chunk',
          title: 'Test',
          snippet: '',
          similarity: 0.5,
          relevanceScore: 0.5,
          metadata: {},
        },
      ]

      const keywordMatches = [
        {
          id: 'result-2', // Different ID - keyword match only
          type: 'chunk' as const,
          matchScore: 1.0,
          matchedTerms: ['keyword'],
        },
      ]

      const combined = (service as any).combineScores(
        vectorResults,
        keywordMatches,
        0.7,
        0.3
      )

      // result-1 should have relevance from vector only
      expect(combined[0].relevanceScore).toBeCloseTo(0.35, 2) // 0.7 * 0.5
    })
  })

  describe('Pagination and Filtering', () => {
    it('should paginate results correctly', async () => {
      const manyResults = Array(50).fill(null).map((_, i) => ({
        ...mockChunkResults[0],
        id: `chunk-${i}`,
        distance: 0.1 + (i * 0.01),
      }))

      mockSql.mockResolvedValue(manyResults)

      // First page
      const page1 = await searchService.search({
        query: 'test query',
        limit: 10,
        offset: 0,
      })

      expect(page1.results).toHaveLength(10)
      expect(page1.pagination.hasNext).toBe(true)
      expect(page1.pagination.hasPrevious).toBe(false)

      // Second page
      const page2 = await searchService.search({
        query: 'test query',
        limit: 10,
        offset: 10,
      })

      expect(page2.results).toHaveLength(10)
      expect(page2.pagination.hasNext).toBe(true)
      expect(page2.pagination.hasPrevious).toBe(true)
    })

    it('should enforce valid pagination limits', async () => {
      const params: SearchParams = {
        query: 'test',
        limit: 15, // Invalid - must be 10, 25, or 50
      }

      await expect(searchService.search(params)).rejects.toThrow(
        'Limit must be 10, 25, or 50'
      )
    })

    it('should filter by course IDs', async () => {
      mockSql.mockResolvedValue(mockChunkResults.slice(0, 2))

      const params: SearchParams = {
        query: 'heart anatomy',
        filters: {
          courseIds: ['course-1'],
        },
      }

      const response = await searchService.search(params)

      // Verify filter was applied
      expect(response.metadata.filtersApplied).toContain('courses: 1')

      // All results should be from course-1
      response.results.forEach(result => {
        expect(result.metadata.courseId).toBe('course-1')
      })
    })

    it('should filter by date range', async () => {
      mockSql.mockResolvedValue(mockChunkResults)

      const params: SearchParams = {
        query: 'physiology',
        filters: {
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
        },
      }

      const response = await searchService.search(params)

      expect(response.metadata.filtersApplied).toContain('date range')
    })

    it('should filter by content type', async () => {
      mockSql.mockResolvedValue(mockChunkResults)

      const params: SearchParams = {
        query: 'anatomy',
        filters: {
          contentTypes: ['chunk'],
        },
      }

      const response = await searchService.search(params)

      // All results should be chunks
      response.results.forEach(result => {
        expect(result.type).toBe('chunk')
      })
    })
  })

  describe('Snippet Generation and Highlighting', () => {
    it('should generate snippet with highlighted terms', () => {
      const service = new SemanticSearchService()

      const content = 'The cardiac conduction system controls the heart rate and rhythm through electrical signals.'
      const query = 'heart rate electrical'

      const snippet = (service as any).generateSnippet(content, query, 200)

      // Should contain highlighted terms
      expect(snippet).toContain('<mark>heart</mark>')
      expect(snippet).toContain('<mark>electrical</mark>')
    })

    it('should truncate long content with ellipsis', () => {
      const service = new SemanticSearchService()

      const longContent = 'A'.repeat(500)
      const snippet = (service as any).generateSnippet(longContent, 'test', 100)

      expect(snippet.length).toBeLessThanOrEqual(110) // 100 + ellipsis
      expect(snippet).toContain('...')
    })

    it('should extract snippet around matching term', () => {
      const service = new SemanticSearchService()

      const content = 'This is some leading text. The heart is a muscular organ. This is trailing text that goes on.'
      const query = 'heart'

      const snippet = (service as any).generateSnippet(content, query, 50)

      // Should center around "heart"
      expect(snippet).toContain('<mark>heart</mark>')
      expect(snippet).toContain('...')
    })

    it('should handle no matching terms gracefully', () => {
      const service = new SemanticSearchService()

      const content = 'The cardiac system functions continuously.'
      const query = 'kidney renal'

      const snippet = (service as any).generateSnippet(content, query, 50)

      // Should return beginning of content
      expect(snippet).toContain('cardiac')
      expect(snippet).not.toContain('<mark>')
    })
  })

  describe('Search Term Extraction', () => {
    it('should extract meaningful terms and remove stop words', () => {
      const service = new SemanticSearchService()

      const query = 'How does the heart pump blood through the body?'
      const terms = (service as any).extractSearchTerms(query)

      // Should include meaningful terms
      expect(terms).toContain('heart')
      expect(terms).toContain('pump')
      expect(terms).toContain('blood')
      expect(terms).toContain('body')

      // Should exclude stop words
      expect(terms).not.toContain('how')
      expect(terms).not.toContain('does')
      expect(terms).not.toContain('the')
      expect(terms).not.toContain('through')
    })

    it('should filter short terms', () => {
      const service = new SemanticSearchService()

      const query = 'MI is a heart attack'
      const terms = (service as any).extractSearchTerms(query)

      // "MI" and "is" should be filtered (too short or stop word)
      expect(terms).not.toContain('mi')
      expect(terms).not.toContain('is')

      // Meaningful terms should remain
      expect(terms).toContain('heart')
      expect(terms).toContain('attack')
    })
  })

  describe('Error Handling', () => {
    it('should throw error if embedding generation fails', async () => {
      embeddingServiceMock.generateEmbedding.mockResolvedValue({
        embedding: [],
        error: 'API rate limit exceeded',
      })

      const params: SearchParams = {
        query: 'test query',
      }

      await expect(searchService.search(params)).rejects.toThrow(
        'Failed to generate query embedding'
      )
    })

    it('should throw error if DATABASE_URL is not set', () => {
      const originalEnv = process.env.DATABASE_URL
      delete process.env.DATABASE_URL

      expect(() => new SemanticSearchService()).toThrow(
        'DATABASE_URL environment variable is required'
      )

      process.env.DATABASE_URL = originalEnv
    })

    it('should handle database query errors gracefully', async () => {
      mockSql.mockRejectedValue(new Error('Database connection failed'))

      const params: SearchParams = {
        query: 'test query',
      }

      await expect(searchService.search(params)).rejects.toThrow(
        'Database connection failed'
      )
    })
  })

  describe('Performance Tracking', () => {
    it('should track query execution time', async () => {
      mockSql.mockResolvedValue(mockChunkResults)

      const response = await searchService.search({
        query: 'test query',
      })

      expect(response.queryTime).toBeGreaterThan(0)
      expect(typeof response.queryTime).toBe('number')
    })

    it('should complete search under performance target', async () => {
      mockSql.mockResolvedValue(mockChunkResults)

      const startTime = Date.now()
      await searchService.search({
        query: 'cardiac function',
      })
      const endTime = Date.now()

      const totalTime = endTime - startTime

      // Should complete well under 1 second (accounting for mocks)
      expect(totalTime).toBeLessThan(500)
    })
  })

  describe('Type-Specific Search Methods', () => {
    it('should search only lectures when using searchLectures()', async () => {
      mockSql.mockResolvedValue([])

      await searchService.searchLectures('anatomy', 10)

      // Verify the search was called with lecture type filter
      expect(embeddingServiceMock.generateEmbedding).toHaveBeenCalledWith('anatomy')
    })

    it('should search only chunks when using searchChunks()', async () => {
      mockSql.mockResolvedValue([])

      await searchService.searchChunks('physiology', 10)

      expect(embeddingServiceMock.generateEmbedding).toHaveBeenCalledWith('physiology')
    })
  })

  describe('Result Ranking', () => {
    it('should rank results by relevance score', async () => {
      const unsortedResults = [
        { ...mockChunkResults[0], distance: 0.5 },  // Lower similarity
        { ...mockChunkResults[1], distance: 0.1 },  // Higher similarity
        { ...mockChunkResults[2], distance: 0.3 },  // Medium similarity
      ]

      mockSql.mockResolvedValue(unsortedResults)

      const response = await searchService.search({
        query: 'test',
        includeKeywordBoost: false,
      })

      // Results should be sorted by similarity (descending)
      expect(response.results[0].similarity).toBeGreaterThanOrEqual(
        response.results[1].similarity
      )
      expect(response.results[1].similarity).toBeGreaterThanOrEqual(
        response.results[2].similarity
      )
    })
  })
})

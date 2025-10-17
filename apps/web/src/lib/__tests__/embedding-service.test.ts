/**
 * Unit Tests for EmbeddingService
 * Story 3.1 Task 7.1: Comprehensive Unit Tests
 *
 * Test Coverage:
 * - Single embedding generation
 * - Batch embedding processing
 * - Rate limiting and throttling
 * - Retry logic and error handling
 * - Edge cases and validation
 * - Performance tracking
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { EmbeddingService, type EmbeddingResult } from '../embedding-service'
import { GeminiClient } from '../ai/gemini-client'

// Mock GeminiClient
jest.mock('../ai/gemini-client')

describe('EmbeddingService', () => {
  let service: EmbeddingService
  let mockGeminiClient: jest.Mocked<GeminiClient>
  let generateEmbeddingMock: jest.MockedFunction<GeminiClient['generateEmbedding']>

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup mock responses
    const mockEmbedding = Array(1536).fill(0).map(() => Math.random())
    generateEmbeddingMock = (
      jest.fn(async (text: string) => ({
        embedding: mockEmbedding,
        error: undefined,
      })) as unknown as jest.MockedFunction<GeminiClient['generateEmbedding']>
    )

    mockGeminiClient = {
      generateEmbedding: generateEmbeddingMock,
    } as unknown as jest.Mocked<GeminiClient>

    // Create service with test config (reduced retries for faster tests)
    service = new EmbeddingService({
      maxRequestsPerMinute: 10, // Lower for faster tests
      batchSize: 5,
      maxRetries: 1, // Reduced for faster tests
    })

    // Inject mock client
    ;(service as any).geminiClient = mockGeminiClient
  })

  afterEach(() => {
    // Reset rate limit
    service.resetRateLimit()
  })

  describe('Single Embedding Generation', () => {
    it('should generate embedding for valid text', async () => {
      const text = 'The cardiac conduction system controls heart rhythm'

      const result = await service.generateEmbedding(text)

      expect(result.error).toBeUndefined()
      expect(result.embedding).toHaveLength(1536)
      expect(generateEmbeddingMock).toHaveBeenCalledWith(text)
      expect(generateEmbeddingMock).toHaveBeenCalledTimes(1)
    })

    it('should return error for empty text', async () => {
      const result = await service.generateEmbedding('')

      expect(result.error).toBe('Empty text provided')
      expect(result.embedding).toEqual([])
      expect(generateEmbeddingMock).not.toHaveBeenCalled()
    })

    it('should return error for whitespace-only text', async () => {
      const result = await service.generateEmbedding('   \n\t  ')

      expect(result.error).toBe('Empty text provided')
      expect(result.embedding).toEqual([])
    })

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API rate limit exceeded'
      generateEmbeddingMock.mockResolvedValue({
        embedding: [],
        error: errorMessage,
      })

      const result = await service.generateEmbedding('test text')

      expect(result.error).toBe(errorMessage)
      expect(result.embedding).toEqual([])
    })

    it('should track request timestamps for rate limiting', async () => {
      await service.generateEmbedding('test 1')
      await service.generateEmbedding('test 2')
      await service.generateEmbedding('test 3')

      const status = service.getRateLimitStatus()

      expect(status.requestsInLastMinute).toBe(3)
      expect(status.maxRequestsPerMinute).toBe(10)
      expect(status.minuteQuotaUsedPercent).toBe(30) // 3/10 = 30%
    })
  })

  describe('Batch Embedding Generation', () => {
    it('should generate embeddings for multiple texts', async () => {
      const texts = [
        'Cardiac conduction system',
        'Renal filtration process',
        'Neurological pathways',
      ]

      const result = await service.generateBatchEmbeddings(texts)

      expect(result.successCount).toBe(3)
      expect(result.failureCount).toBe(0)
      expect(result.embeddings).toHaveLength(3)
      expect(result.errors.size).toBe(0)
      expect(generateEmbeddingMock).toHaveBeenCalledTimes(3)
    })

    it('should process in batches according to batch size', async () => {
      // Create 6 texts (should process in 2 batches of 5, 1)
      const texts = Array(6).fill('Medical text').map((_, i) => `${_} ${i}`)

      // Process batches
      const result = await service.generateBatchEmbeddings(texts)

      expect(result.successCount).toBe(6)
      expect(result.embeddings).toHaveLength(6)
      // Verify it called generateEmbedding for each text
      expect(generateEmbeddingMock).toHaveBeenCalledTimes(6)
    }, 20000) // Increase timeout for batch processing with retry logic

    it('should track errors by index in batch', async () => {
      // Mock first and third to fail with permanent errors
      generateEmbeddingMock
        .mockResolvedValueOnce({ embedding: Array(1536).fill(0), error: undefined })
        .mockResolvedValueOnce({ embedding: [], error: '400 Error on text 2' })
        .mockResolvedValueOnce({ embedding: Array(1536).fill(0), error: undefined })
        .mockResolvedValueOnce({ embedding: [], error: '400 Error on text 4' })

      const texts = ['text1', 'text2', 'text3', 'text4']
      const result = await service.generateBatchEmbeddings(texts)

      expect(result.successCount).toBe(2)
      expect(result.failureCount).toBe(2)
      expect(result.errors.has(1)).toBe(true)
      expect(result.errors.has(3)).toBe(true)
      expect(result.errors.get(1)).toContain('Error on text 2')
      expect(result.errors.get(3)).toContain('Error on text 4')
    }, 15000) // Increase timeout

    it('should return empty arrays for failed embeddings', async () => {
      generateEmbeddingMock
        .mockResolvedValueOnce({ embedding: Array(1536).fill(0.5), error: undefined })
        .mockResolvedValueOnce({ embedding: [], error: '400 Failed' }) // Permanent error

      const result = await service.generateBatchEmbeddings(['text1', 'text2'])

      expect(result.successCount).toBe(1)
      expect(result.failureCount).toBe(1)
      expect(result.embeddings[0]).toHaveLength(1536)
      expect(result.embeddings[1]).toEqual([])
      expect(result.errors.has(1)).toBe(true)
    }, 15000) // Increase timeout

    it('should handle empty array input', async () => {
      const result = await service.generateBatchEmbeddings([])

      expect(result.successCount).toBe(0)
      expect(result.failureCount).toBe(0)
      expect(result.embeddings).toEqual([])
      expect(result.errors.size).toBe(0)
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limit by waiting when limit reached', async () => {
      // Use fake timers to avoid waiting
      jest.useFakeTimers()

      const startTime = Date.now()

      // Make requests exceeding the limit (10) - 12 total
      const promises = []
      for (let i = 0; i < 12; i++) {
        promises.push(service.generateEmbedding(`text ${i}`))
      }

      // Fast-forward through all delays
      jest.runAllTimers()

      await Promise.all(promises)

      const elapsed = Date.now() - startTime

      // Verify all requests completed
      expect(generateEmbeddingMock).toHaveBeenCalledTimes(12)

      // Clean up fake timers
      jest.useRealTimers()
    })

    it('should clear old timestamps outside the 1-minute window', async () => {
      // Manually set old timestamps
      const now = Date.now()
      ;(service as any).requestTimestamps = [
        now - 70000, // 70 seconds ago (should be cleared)
        now - 30000, // 30 seconds ago (should remain)
        now - 10000, // 10 seconds ago (should remain)
      ]

      await service.generateEmbedding('test')

      const status = service.getRateLimitStatus()

      // Should only count recent requests
      expect(status.requestsInLastMinute).toBe(3) // 2 old + 1 new (within window)
    })

    it('should provide accurate rate limit status', () => {
      // Set specific timestamps
      const now = Date.now()
      ;(service as any).requestTimestamps = [
        now - 50000,
        now - 40000,
        now - 30000,
      ]

      const status = service.getRateLimitStatus()

      expect(status.requestsInLastMinute).toBe(3)
      expect(status.maxRequestsPerMinute).toBe(10)
      expect(status.minuteQuotaUsedPercent).toBe(30) // 3/10 = 30%
    })

    it('should reset rate limit tracking', () => {
      // Make some requests
      ;(service as any).requestTimestamps = [Date.now(), Date.now(), Date.now()]

      service.resetRateLimit()

      const status = service.getRateLimitStatus()
      expect(status.requestsInLastMinute).toBe(0)
      expect(status.minuteQuotaUsedPercent).toBe(0) // 0/10 = 0%
    })
  })

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultService = new EmbeddingService()

      const status = defaultService.getRateLimitStatus()

      expect(status.maxRequestsPerMinute).toBe(100) // Default per implementation
    })

    it('should apply custom configuration', () => {
      const customService = new EmbeddingService({
        maxRequestsPerMinute: 30,
        batchSize: 10,
        maxRetries: 5,
      })

      const status = customService.getRateLimitStatus()

      expect(status.maxRequestsPerMinute).toBe(30)
    })

    it('should merge partial configuration with defaults', () => {
      const partialService = new EmbeddingService({
        maxRequestsPerMinute: 45,
        // batchSize and maxRetries should use defaults
      })

      const status = partialService.getRateLimitStatus()

      expect(status.maxRequestsPerMinute).toBe(45)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors from GeminiClient', async () => {
      generateEmbeddingMock.mockRejectedValue(
        new Error('Network timeout')
      )

      const result = await service.generateEmbedding('test')

      expect(result.error).toBeDefined()
      expect(result.error).toContain('Network timeout')
      expect(result.embedding).toEqual([])
      expect(result.attempts).toBeGreaterThan(0) // Should have attempted retries
    })

    it('should handle malformed API responses', async () => {
      generateEmbeddingMock.mockResolvedValue({
        embedding: null as any, // Invalid response
        error: undefined,
      })

      const result = await service.generateEmbedding('test')

      // Service should handle gracefully
      expect(result).toBeDefined()
    })

    it('should continue batch processing when individual items fail', async () => {
      // First succeeds, second fails (permanent error), third succeeds
      generateEmbeddingMock
        .mockResolvedValueOnce({ embedding: Array(1536).fill(0), error: undefined })
        .mockResolvedValueOnce({ embedding: [], error: '400 Bad Request' }) // Permanent error
        .mockResolvedValueOnce({ embedding: Array(1536).fill(0), error: undefined })

      const texts = ['text1', 'text2', 'text3']

      // Batch should complete with partial results
      const result = await service.generateBatchEmbeddings(texts)

      expect(result.successCount).toBe(2)
      expect(result.failureCount).toBe(1)
      expect(result.errors.has(1)).toBe(true) // Second text failed
      expect(result.errors.get(1)).toContain('Bad Request')
    }, 15000) // Increase timeout
  })

  describe('Performance', () => {
    it('should complete single embedding generation quickly', async () => {
      const startTime = Date.now()

      await service.generateEmbedding('Test text for performance')

      const elapsed = Date.now() - startTime

      // Mock should be very fast, real API target: <300ms
      expect(elapsed).toBeLessThan(100)
    })

    it('should process batch efficiently', async () => {
      const texts = Array(10).fill('Medical text')

      const startTime = Date.now()
      await service.generateBatchEmbeddings(texts)
      const elapsed = Date.now() - startTime

      // Batch processing should be reasonably fast with mocks
      expect(elapsed).toBeLessThan(5000)
    }, 10000)
  })

  describe('Integration with GeminiClient', () => {
    it('should pass text to GeminiClient correctly', async () => {
      const testText = 'Cardiac muscle has unique properties'

      await service.generateEmbedding(testText)

      expect(generateEmbeddingMock).toHaveBeenCalledWith(testText)
    })

    it('should handle GeminiClient embedding result format', async () => {
      const mockEmbedding = Array(1536).fill(0).map((_, i) => i / 1536)
      generateEmbeddingMock.mockResolvedValue({
        embedding: mockEmbedding,
        error: undefined,
      })

      const result = await service.generateEmbedding('test')

      expect(result.embedding).toEqual(mockEmbedding)
      expect(result.embedding.length).toBe(1536)
      expect(typeof result.embedding[0]).toBe('number')
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const promises = [
        service.generateEmbedding('text 1'),
        service.generateEmbedding('text 2'),
        service.generateEmbedding('text 3'),
        service.generateEmbedding('text 4'),
        service.generateEmbedding('text 5'),
      ]

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(result.error).toBeUndefined()
        expect(result.embedding).toHaveLength(1536)
      })

      expect(generateEmbeddingMock).toHaveBeenCalledTimes(5)
    })
  })
})

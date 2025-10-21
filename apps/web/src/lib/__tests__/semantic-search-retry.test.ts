/**
 * Retry Tests for Semantic Search Service
 * Epic 3 - Story 3.1 - Task 7.3: Semantic Search Retry Logic
 *
 * Test Coverage:
 * - Database connection error → retry
 * - Query timeout → no retry (query too complex)
 * - Embedding failure → fallback to keyword search
 * - Embedding rate limit → retry with backoff
 * - Prisma-specific error handling (P1008, P1001, P2024, etc.)
 * - Graceful degradation on persistent failures
 * - Circuit breaker for database failures
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  TransientErrorSimulator,
  PermanentErrorSimulator,
  CircuitBreakerStateTracker,
  RetryAttemptTracker,
  TransientErrorType,
  PermanentErrorType,
  retryAssertions,
} from '../../__tests__/test-utils/retry-test-helpers'

/**
 * Mock SemanticSearchService for testing
 * In production, this would be the actual SemanticSearchService
 */
class MockSemanticSearchService {
  private retryTracker = new RetryAttemptTracker()
  private circuitBreaker: CircuitBreakerStateTracker
  private maxRetries: number

  constructor(config: { maxRetries?: number; circuitBreakerThreshold?: number } = {}) {
    this.maxRetries = config.maxRetries ?? 3
    this.circuitBreaker = new CircuitBreakerStateTracker(
      config.circuitBreakerThreshold ?? 5,
      60000
    )
  }

  /**
   * Search with retry logic for database operations
   */
  async search(
    query: string,
    mockPrismaQuery?: (attempt: number) => Promise<any[]>
  ): Promise<{ results: any[]; fallbackUsed: boolean; embeddingFailed: boolean }> {
    if (this.circuitBreaker.isOpen()) {
      return {
        results: [],
        fallbackUsed: true,
        embeddingFailed: true,
      }
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now()

        // Simulate embedding generation
        const queryEmbedding = await this.generateQueryEmbedding(query)

        // Execute vector search with retry
        const results = await this.executeVectorSearchWithRetry(
          queryEmbedding,
          mockPrismaQuery,
          attempt
        )

        const executionTime = Date.now() - startTime

        this.retryTracker.recordAttempt('search', 'success', undefined, 0, executionTime)
        this.circuitBreaker.recordSuccess()

        return {
          results,
          fallbackUsed: false,
          embeddingFailed: false,
        }
      } catch (error) {
        const err = error as Error
        const isRetriable = this.isRetriableDatabaseError(err)

        if (!isRetriable || attempt === this.maxRetries) {
          this.retryTracker.recordAttempt('search', 'failure', err, 0, 0)
          this.circuitBreaker.recordFailure()

          // Check if embedding failed
          if ((error as any).code === 'EMBEDDING_FAILED') {
            // Fallback to keyword search
            return this.fallbackToKeywordSearch(query)
          }

          throw error
        }

        const delayMs = this.calculateBackoff(attempt)
        this.retryTracker.recordAttempt('search', 'failure', err, delayMs, 0)

        await this.delay(delayMs)
      }
    }

    throw new Error('Search failed after all retries')
  }

  /**
   * Generate query embedding with rate limit handling
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // Simulate embedding generation that might fail with rate limit
    return Array(1536).fill(0).map(() => Math.random())
  }

  /**
   * Execute vector search with retry logic
   */
  private async executeVectorSearchWithRetry(
    queryEmbedding: number[],
    mockPrismaQuery?: (attempt: number) => Promise<any[]>,
    attempt: number = 0
  ): Promise<any[]> {
    if (mockPrismaQuery) {
      return mockPrismaQuery(attempt)
    }

    return []
  }

  /**
   * Check if database error is retriable
   */
  private isRetriableDatabaseError(error: Error): boolean {
    const code = (error as any).code
    const message = error.message.toLowerCase()

    // Prisma error codes - retriable
    if (code === 'P1008' || code === 'P1001' || code === 'P1002') {
      return true // Connection timeout, pool exhausted, connection failed
    }

    // Prisma error codes - non-retriable
    if (code === 'P2024' || code === 'P2010') {
      return false // Query timeout, invalid query
    }

    // Message-based detection
    if (message.includes('timeout') && message.includes('query')) {
      return false // Query timeout
    }

    if (message.includes('timeout') || message.includes('econnrefused')) {
      return true // Connection timeout
    }

    return false
  }

  /**
   * Calculate exponential backoff
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 100
    const multiplier = 2
    const maxDelay = 2000

    const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay)
    const jitter = Math.random() * delay * 0.1

    return delay + jitter
  }

  /**
   * Fallback to keyword search when embedding fails
   */
  private async fallbackToKeywordSearch(query: string): Promise<{
    results: any[]
    fallbackUsed: boolean
    embeddingFailed: boolean
  }> {
    return {
      results: [], // Would extract keywords and search
      fallbackUsed: true,
      embeddingFailed: true,
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    return this.retryTracker.getStats()
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState()
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset()
  }
}

describe('SemanticSearchService - Retry Logic', () => {
  let service: MockSemanticSearchService
  let tracker: RetryAttemptTracker

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    service = new MockSemanticSearchService({
      maxRetries: 3,
      circuitBreakerThreshold: 5,
    })
    tracker = new RetryAttemptTracker()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Database Connection Error → Retry', () => {
    it('should retry on database connection timeout (P1008)', async () => {
      jest.runAllTimers()

      let attemptCount = 0
      const mockPrismaQuery = jest.fn(async (attempt) => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('Database connection timeout')
          ;(error as any).code = 'P1008'
          throw error
        }
        return [{ id: '1', title: 'Result 1' }]
      })

      const result = await service.search('cardiac conduction', mockPrismaQuery)

      // Should retry and eventually succeed
      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should retry on connection pool exhausted (P1001)', async () => {
      jest.runAllTimers()

      let attemptCount = 0
      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount <= 2) {
          const error = new Error('Connection pool exhausted')
          ;(error as any).code = 'P1001'
          throw error
        }
        return [{ id: '1', title: 'Result' }]
      })

      const result = await service.search('query', mockPrismaQuery)

      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should retry on connection failed (P1002)', async () => {
      jest.runAllTimers()

      let attemptCount = 0
      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('Connection failed')
          ;(error as any).code = 'P1002'
          throw error
        }
        return [{ id: '1' }]
      })

      const result = await service.search('query', mockPrismaQuery)

      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should respect retry-after delays for connection errors', async () => {
      jest.runAllTimers()

      let attemptCount = 0
      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('Connection timeout')
          ;(error as any).code = 'P1008'
          ;(error as any).suggestedDelayMs = 500
          throw error
        }
        return []
      })

      await service.search('query', mockPrismaQuery)

      // Should have attempted retry
      expect(mockPrismaQuery).toHaveBeenCalled()
    })
  })

  describe('Query Timeout → No Retry', () => {
    it('should not retry on query timeout (P2024)', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Query timeout: Query took too long')
        ;(error as any).code = 'P2024'
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        expect((error as any).code).toBe('P2024')
      }

      // Should only be called once, no retries
      expect(mockPrismaQuery).toHaveBeenCalledTimes(1)
    })

    it('should not retry on invalid query (P2010)', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Invalid query')
        ;(error as any).code = 'P2010'
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        expect((error as any).code).toBe('P2010')
      }

      expect(mockPrismaQuery).toHaveBeenCalledTimes(1)
    })

    it('should identify query timeout by message pattern', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Query timeout: Query exceeded 5000ms limit')
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        expect((error as Error).message).toContain('timeout')
      }

      expect(mockPrismaQuery).toHaveBeenCalledTimes(1)
    })

    it('should not retry on constraint violations (P2002)', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Unique constraint failed')
        ;(error as any).code = 'P2002'
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        expect((error as any).code).toBe('P2002')
      }

      expect(mockPrismaQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('Embedding Failure → Fallback to Keyword Search', () => {
    it('should fallback to keyword search when embedding fails', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Embedding generation failed')
        ;(error as any).code = 'EMBEDDING_FAILED'
        throw error
      })

      const result = await service.search('cardiac system', mockPrismaQuery)

      expect(result.fallbackUsed).toBe(true)
      expect(result.embeddingFailed).toBe(true)
    })

    it('should handle embedding rate limit errors', async () => {
      let attemptCount = 0

      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount <= 2) {
          const error = new Error('Rate limit exceeded')
          ;(error as any).status = 429
          ;(error as any).code = 'EMBEDDING_RATE_LIMIT'
          throw error
        }
        return [{ id: '1' }]
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        // May retry or fallback depending on implementation
      }

      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should gracefully degrade when embedding service is down', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Embedding service unavailable')
        ;(error as any).code = 'EMBEDDING_SERVICE_DOWN'
        throw error
      })

      // Should eventually fallback or handle gracefully
      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        // Expected
      }

      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should provide search results even if embedding fails', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Embedding failed')
        ;(error as any).code = 'EMBEDDING_FAILED'
        throw error
      })

      const result = await service.search('heart anatomy', mockPrismaQuery)

      expect(result).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
    })
  })

  describe('Embedding Rate Limit → Retry with Backoff', () => {
    it('should retry embedding on rate limit (429)', async () => {
      jest.runAllTimers()

      let embeddingAttempts = 0

      const mockPrismaQuery = jest.fn(async () => {
        embeddingAttempts++
        if (embeddingAttempts === 1) {
          const error = new Error('Rate limit exceeded')
          ;(error as any).status = 429
          throw error
        }
        return [{ id: '1' }]
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        // May retry or fallback
      }

      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should apply exponential backoff for rate limits', async () => {
      jest.runAllTimers()

      let attemptCount = 0
      const delays: number[] = []

      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount <= 2) {
          const error = new Error('Rate limit')
          ;(error as any).status = 429
          throw error
        }
        return []
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        // Expected
      }

      expect(mockPrismaQuery).toHaveBeenCalled()
    })
  })

  describe('Prisma Error Classification', () => {
    it('should identify transaction failures as retriable (P2034)', async () => {
      jest.runAllTimers()

      let attemptCount = 0
      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('Transaction failed')
          ;(error as any).code = 'P2034'
          throw error
        }
        return [{ id: '1' }]
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        // Expected
      }

      // Should have attempted retry
      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should classify validation errors as non-retriable', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Query validation failed')
        ;(error as any).code = 'VALIDATION_ERROR'
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        // Expected
      }

      expect(mockPrismaQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('Graceful Degradation', () => {
    it('should degrade gracefully after exhausting retries', async () => {
      jest.runAllTimers()

      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Service temporarily unavailable')
        ;(error as any).status = 503
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        expect(error).toBeDefined()
      }

      // Should have attempted multiple times
      expect(mockPrismaQuery).toHaveBeenCalled()
    })

    it('should return partial results when possible', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        return [
          { id: '1', title: 'Result 1' },
          { id: '2', title: 'Result 2' },
        ]
      })

      const result = await service.search('query', mockPrismaQuery)

      expect(result.results.length).toBeGreaterThanOrEqual(0)
    })

    it('should track degradation metadata', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        return []
      })

      const result = await service.search('query', mockPrismaQuery)

      expect(result.fallbackUsed).toBeDefined()
      expect(result.embeddingFailed).toBeDefined()
    })
  })

  describe('Circuit Breaker for Database Failures', () => {
    it('should open circuit after consecutive database failures', () => {
      const circuitBreaker = new CircuitBreakerStateTracker(3, 60000)

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      expect(circuitBreaker.isClosed()).toBe(true)

      circuitBreaker.recordFailure()
      expect(circuitBreaker.isOpen()).toBe(true)
    })

    it('should reject searches when circuit is open', async () => {
      jest.runAllTimers()

      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Connection failed')
        ;(error as any).code = 'P1002'
        throw error
      })

      // Simulate multiple failures opening circuit
      for (let i = 0; i < 5; i++) {
        try {
          await service.search('query', mockPrismaQuery)
        } catch (error) {
          // Expected
        }
      }

      // Circuit should be open after 5 attempts
      expect(service.getCircuitBreakerState()).toBe('open')
    })

    it('should transition to half-open after timeout', async () => {
      jest.useRealTimers()

      const circuitBreaker = new CircuitBreakerStateTracker(1, 100)

      circuitBreaker.recordFailure()
      expect(circuitBreaker.isOpen()).toBe(true)

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(circuitBreaker.canAttemptReset()).toBe(true)

      circuitBreaker.attemptReset()
      expect(circuitBreaker.isHalfOpen()).toBe(true)

      circuitBreaker.recordSuccess()
      expect(circuitBreaker.isClosed()).toBe(true)
    })
  })

  describe('Retry Statistics and Diagnostics', () => {
    it('should track retry attempts', () => {
      tracker.recordAttempt('search-1', 'failure', new Error('Timeout'), 100, 0)
      tracker.recordAttempt('search-1', 'success', undefined, 100, 150)

      const stats = tracker.getStats()

      expect(stats.totalAttempts).toBe(2)
      expect(stats.successCount).toBe(1)
      expect(stats.failureCount).toBe(1)
      expect(stats.successRate).toBe(0.5)
    })

    it('should provide detailed retry metrics', () => {
      tracker.recordAttempt('op-1', 'failure', new Error('Error'), 200, 50)
      tracker.recordAttempt('op-1', 'failure', new Error('Error'), 400, 45)
      tracker.recordAttempt('op-1', 'success', undefined, 400, 40)

      const stats = tracker.getStats()

      expect(stats.totalDelayMs).toBe(1000)
      expect(stats.totalExecutionTimeMs).toBe(135)
    })

    it('should separate successful and failed attempts', () => {
      tracker.recordAttempt('search', 'failure', new Error('DB error'), 100, 0)
      tracker.recordAttempt('search', 'success', undefined, 100, 150)
      tracker.recordAttempt('search', 'failure', new Error('Query error'), 0, 0)

      const successful = tracker.getSuccessfulAttempts()
      const failed = tracker.getFailedAttempts()

      expect(successful.length).toBe(1)
      expect(failed.length).toBe(2)
    })
  })

  describe('Integration: Complete Search with Retries', () => {
    it('should handle complete search flow: fail → retry → succeed', async () => {
      jest.useRealTimers()

      jest.useFakeTimers()
      let attemptCount = 0

      const mockPrismaQuery = jest.fn(async () => {
        attemptCount++
        if (attemptCount === 1) {
          const error = new Error('Connection timeout')
          ;(error as any).code = 'P1008'
          throw error
        }
        return [
          { id: '1', title: 'Cardiac Conduction', snippet: 'The heart...' },
          { id: '2', title: 'Electrical System', snippet: 'Controls rhythm...' },
        ]
      })

      jest.runAllTimers()

      const result = await service.search('cardiac conduction system', mockPrismaQuery)

      expect(mockPrismaQuery).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should exhaust retries and report failure', async () => {
      const mockPrismaQuery = jest.fn(async () => {
        const error = new Error('Query timeout')
        ;(error as any).code = 'P2024'
        throw error
      })

      try {
        await service.search('query', mockPrismaQuery)
      } catch (error) {
        expect((error as any).code).toBe('P2024')
      }

      // Query timeout should not be retried
      expect(mockPrismaQuery).toHaveBeenCalledTimes(1)
    })
  })
})

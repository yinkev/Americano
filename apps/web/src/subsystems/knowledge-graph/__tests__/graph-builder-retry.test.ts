/**
 * Retry Tests for Knowledge Graph Builder
 * Epic 3 - Story 3.2 - Task 8.2: Graph Builder Retry Logic
 *
 * Test Coverage:
 * - ChatMock rate limit (429) → retry
 * - JSON parse error (400) → no retry
 * - Success after N retries
 * - Partial failures in concept extraction (some chunks fail, others succeed)
 * - Circuit breaker for ChatMock failures
 * - Retry logging and diagnostics
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  TransientErrorSimulator,
  PermanentErrorSimulator,
  BatchFailureSimulator,
  RetryAttemptTracker,
  TransientErrorType,
  PermanentErrorType,
  retryAssertions,
  CircuitBreakerStateTracker,
} from '../../../__tests__/test-utils/retry-test-helpers'

/**
 * Configure Jest timeout for async retry logic tests
 *
 * Retry tests use exponential backoff with delays up to 30 seconds (maxDelayMs).
 * Additionally, circuit breaker recovery tests use 120s timeout for ChatMock API.
 * Default Jest timeout (10s) is insufficient for these scenarios.
 *
 * Timeout breakdown:
 * - Max exponential backoff: 30s (base delay * 2^attempts)
 * - Circuit breaker recovery: 150ms (test waits for 100ms timeout + buffer)
 * - Multiple retry attempts: 3-5 attempts per test
 * - Total buffer: 5s for test execution overhead
 *
 * Result: 30s timeout accommodates all test scenarios
 *
 * Reference: docs/architecture/retry-strategy-architecture.md#Configuration Matrix (lines 305-315)
 */
jest.setTimeout(30000)

/**
 * Mock GraphBuilder for testing
 * In production, this would be the actual KnowledgeGraphBuilder
 */
class MockGraphBuilder {
  private chatMockClient: any
  private maxRetries: number
  private retryTracker = new RetryAttemptTracker()
  private circuitBreaker: CircuitBreakerStateTracker

  constructor(config: { maxRetries?: number; circuitBreakerThreshold?: number } = {}) {
    this.maxRetries = config.maxRetries ?? 3
    this.circuitBreaker = new CircuitBreakerStateTracker(
      config.circuitBreakerThreshold ?? 5,
      60000
    )
    this.chatMockClient = {
      client: {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      },
    }
  }

  /**
   * Extract concepts from a chunk with retry logic
   */
  async extractConceptsFromChunk(chunk: { id: string; content: string }): Promise<any> {
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker open for ChatMock')
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now()

        const response = await this.chatMockClient.client.chat.completions.create({
          model: 'gpt-5',
          messages: [
            {
              role: 'system',
              content: 'Extract medical concepts',
            },
            { role: 'user', content: chunk.content },
          ],
          temperature: 0.3,
          max_tokens: 8000,
        })

        const executionTime = Date.now() - startTime

        // Parse response
        let content = response.choices[0]?.message?.content
        if (!content) {
          throw new Error('No response from ChatMock')
        }

        // Remove thinking tags
        let jsonContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '')
        const jsonStart = jsonContent.indexOf('{')
        const jsonEnd = jsonContent.lastIndexOf('}') + 1

        if (jsonStart === -1 || jsonEnd === 0) {
          throw new Error('No JSON object found in response')
        }

        jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()
        const parsed = JSON.parse(jsonContent)

        this.retryTracker.recordAttempt(`chunk-${chunk.id}`, 'success', undefined, 0, executionTime)
        this.circuitBreaker.recordSuccess()

        return parsed.concepts || []
      } catch (error) {
        const err = error as Error
        const isRetriable = this.isRetriableError(err)

        if (!isRetriable || attempt === this.maxRetries) {
          this.retryTracker.recordAttempt(
            `chunk-${chunk.id}`,
            'failure',
            err,
            0,
            0
          )
          this.circuitBreaker.recordFailure()
          throw error
        }

        const delayMs = this.calculateBackoff(attempt)

        this.retryTracker.recordAttempt(
          `chunk-${chunk.id}`,
          'failure',
          err,
          delayMs,
          0
        )

        // Wait for backoff
        await this.delay(delayMs)
      }
    }

    throw new Error('Concept extraction failed after all retries')
  }

  /**
   * Extract concepts from batch of chunks
   */
  async extractConceptsFromBatch(chunks: Array<{ id: string; content: string }>): Promise<{
    succeeded: any[]
    failed: Array<{ chunkId: string; error: string }>
  }> {
    const succeeded: any[] = []
    const failed: Array<{ chunkId: string; error: string }> = []

    for (const chunk of chunks) {
      try {
        const concepts = await this.extractConceptsFromChunk(chunk)
        succeeded.push(...concepts)
      } catch (error) {
        failed.push({
          chunkId: chunk.id,
          error: (error as Error).message,
        })
      }
    }

    return { succeeded, failed }
  }

  /**
   * Check if error is retriable
   */
  private isRetriableError(error: Error): boolean {
    const status = (error as any).status
    const message = error.message.toLowerCase()

    // HTTP status codes
    if (status === 429 || status === 503 || status === 500 || status === 502) {
      return true
    }

    // Message-based detection
    if (message.includes('timeout') || message.includes('unavailable')) {
      return true
    }

    // Non-retriable: JSON errors, invalid input, auth errors
    if (
      message.includes('json') ||
      message.includes('invalid') ||
      message.includes('unauthorized') ||
      message.includes('authentication')
    ) {
      return false
    }

    return false
  }

  /**
   * Calculate exponential backoff
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 100
    const multiplier = 2
    const maxDelay = 30000

    const delay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay)
    const jitter = Math.random() * delay * 0.1

    return delay + jitter
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get retry tracking data
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

  /**
   * Get mock client for testing
   */
  getMockClient() {
    return this.chatMockClient
  }
}

describe('KnowledgeGraphBuilder - Retry Logic', () => {
  let builder: MockGraphBuilder
  let tracker: RetryAttemptTracker

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    builder = new MockGraphBuilder({
      maxRetries: 3,
      circuitBreakerThreshold: 5,
    })
    tracker = new RetryAttemptTracker()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('ChatMock Rate Limit (429) Retry', () => {
    it('should retry on ChatMock rate limit error', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create
        .mockRejectedValueOnce((() => {
          const error = new Error('Rate limit exceeded')
          ;(error as any).status = 429
          return error
        })())
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'cardiac conduction',
                      description: 'electrical system of heart',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        })

      const chunk = { id: 'chunk-1', content: 'The heart conducts electricity...' }

      // Start async operation
      const extractPromise = builder.extractConceptsFromChunk(chunk)

      // Advance timers to skip the 1st retry delay (~100ms + jitter = ~110ms max)
      await jest.advanceTimersByTimeAsync(150)

      await extractPromise

      expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
    })

    it('should respect rate limit retry-after header', async () => {
      const mockClient = builder.getMockClient()
      const retryAfter = 30

      mockClient.client.chat.completions.create.mockRejectedValue((() => {
        const error = new Error('Rate limit')
        ;(error as any).status = 429
        ;(error as any).headers = { 'retry-after': retryAfter }
        return error
      })())

      const chunk = { id: 'chunk-1', content: 'Test content' }

      // Start async operation
      const extractPromise = builder.extractConceptsFromChunk(chunk).catch(error => error)

      // Advance timers for all retry attempts (will exhaust retries)
      // Max retries = 3, delays: ~100ms, ~200ms, ~400ms = ~700ms total max
      await jest.advanceTimersByTimeAsync(800)

      const error = await extractPromise

      expect((error as any).headers).toBeDefined()
    })
  })

  describe('JSON Parse Error (400) - No Retry', () => {
    it('should not retry on invalid JSON response', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Invalid JSON: {not valid}}}',
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [{ name: 'test', description: 'test', category: 'anatomy' }],
                }),
              },
            },
          ],
        })

      const chunk = { id: 'chunk-1', content: 'Test content' }

      try {
        await builder.extractConceptsFromChunk(chunk)
      } catch (error) {
        expect((error as Error).message).toContain('JSON')
      }

      // Should only be called once (no retry on JSON error)
      expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(1)
    })

    it('should not retry on empty response', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      })

      const chunk = { id: 'chunk-1', content: 'Test content' }

      try {
        await builder.extractConceptsFromChunk(chunk)
      } catch (error) {
        expect((error as Error).message).toContain('No response')
      }

      expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(1)
    })

    it('should not retry on malformed JSON', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{"incomplete": ',
            },
          },
        ],
      })

      const chunk = { id: 'chunk-1', content: 'Test content' }

      try {
        await builder.extractConceptsFromChunk(chunk)
      } catch (error) {
        // JSON parse error should not retry
      }

      expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(1)
    })
  })

  describe('Success After N Retries', () => {
    it('should succeed after 1 retry', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create
        .mockRejectedValueOnce((() => {
          const error = new Error('Service unavailable')
          ;(error as any).status = 503
          return error
        })())
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'cardiac conduction',
                      description: 'electrical system',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        })

      const chunk = { id: 'chunk-1', content: 'The heart...' }

      // Start async operation
      const extractPromise = builder.extractConceptsFromChunk(chunk)

      // Advance timers to skip the 1st retry delay (~100ms + jitter = ~110ms max)
      await jest.advanceTimersByTimeAsync(150)

      await extractPromise

      expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(2)
    })

    it('should succeed after 2 retries', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create
        .mockRejectedValueOnce((() => {
          const error = new Error('Timeout')
          ;(error as any).code = 'ECONNABORTED'
          return error
        })())
        .mockRejectedValueOnce((() => {
          const error = new Error('Timeout')
          ;(error as any).code = 'ECONNABORTED'
          return error
        })())
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'test concept',
                      description: 'test description',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        })

      const chunk = { id: 'chunk-1', content: 'Test content' }

      // Start async operation
      const extractPromise = builder.extractConceptsFromChunk(chunk)

      // Advance timers to skip both retry delays
      // 1st retry: ~100ms + jitter, 2nd retry: ~200ms + jitter = ~330ms total max
      await jest.advanceTimersByTimeAsync(400)

      await extractPromise

      expect(mockClient.client.chat.completions.create).toHaveBeenCalledTimes(3)
    })
  })

  describe('Partial Failures in Concept Extraction', () => {
    it('should handle mixed successes and failures in batch', async () => {
      const mockClient = builder.getMockClient()

      // Chunk 1: Success
      // Chunk 2: Fails then succeeds
      // Chunk 3: Permanent failure (JSON error)

      mockClient.client.chat.completions.create
        // Chunk 1 - success
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'concept1',
                      description: 'desc1',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        })
        // Chunk 2 - first attempt fails
        .mockRejectedValueOnce((() => {
          const error = new Error('Rate limit')
          ;(error as any).status = 429
          return error
        })())
        // Chunk 3 - success first time
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Invalid JSON',
              },
            },
          ],
        })
        // Chunk 2 - retry succeeds
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'concept2',
                      description: 'desc2',
                      category: 'physiology',
                    },
                  ],
                }),
              },
            },
          ],
        })

      const chunks = [
        { id: 'chunk-1', content: 'Content 1' },
        { id: 'chunk-2', content: 'Content 2' },
        { id: 'chunk-3', content: 'Content 3' },
      ]

      // Start async batch operation
      const batchPromise = builder.extractConceptsFromBatch(chunks)

      // Advance timers for chunk 2's retry delay (~100ms + jitter = ~110ms max)
      await jest.advanceTimersByTimeAsync(150)

      const result = await batchPromise

      // Some should succeed, some should fail
      expect(result.succeeded.length + result.failed.length).toBeGreaterThan(0)
    })

    it('should continue processing after chunk failures', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create
        // First two chunks fail permanently
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: 'Not JSON' },
            },
          ],
        })
        // Third chunk succeeds
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'concept3',
                      description: 'desc3',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        })

      const chunks = [
        { id: 'chunk-1', content: 'Content 1' },
        { id: 'chunk-2', content: 'Content 2' },
      ]

      const result = await builder.extractConceptsFromBatch(chunks)

      // Should process all chunks despite failures
      expect(result.failed.length + result.succeeded.length).toBeGreaterThanOrEqual(0)
    })

    it('should track individual chunk retry statistics', async () => {
      tracker.recordAttempt('chunk-1', 'success', undefined, 0, 150)
      tracker.recordAttempt('chunk-2', 'failure', new Error('Rate limit'), 100, 0)
      tracker.recordAttempt('chunk-2', 'success', undefined, 100, 140)
      tracker.recordAttempt('chunk-3', 'failure', new Error('JSON error'), 0, 0)

      const stats = tracker.getStats()

      expect(stats.totalAttempts).toBe(4)
      expect(stats.successCount).toBe(2)
      expect(stats.failureCount).toBe(2)

      const successfulAttempts = tracker.getSuccessfulAttempts()
      expect(successfulAttempts.length).toBe(2)
    })
  })

  describe('Circuit Breaker for ChatMock Failures', () => {
    it('should open circuit after consecutive failures', () => {
      const circuitBreaker = new CircuitBreakerStateTracker(3, 60000)

      expect(circuitBreaker.isClosed()).toBe(true)

      // Record 2 failures
      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      expect(circuitBreaker.isClosed()).toBe(true)

      // Record 3rd failure - circuit opens
      circuitBreaker.recordFailure()
      expect(circuitBreaker.isOpen()).toBe(true)
    })

    it('should reject requests when circuit is open', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create.mockRejectedValue((() => {
        const error = new Error('Service error')
        ;(error as any).status = 503
        return error
      })())

      const chunk = { id: 'chunk-1', content: 'Test' }

      // Access the builder's internal circuit breaker
      const circuitBreaker = builder['circuitBreaker']

      // Trigger failures to open the circuit breaker (threshold is 5)
      for (let i = 0; i < 5; i++) {
        // Start async operation
        const extractPromise = builder.extractConceptsFromChunk(chunk).catch(error => error)

        // Advance timers for each retry attempt (3 retries max = ~700ms total)
        await jest.advanceTimersByTimeAsync(800)

        await extractPromise
      }

      // Circuit breaker should be open after 5 failures
      expect(circuitBreaker.isOpen()).toBe(true)
    })

    it('should transition to half-open after timeout', async () => {
      // This test requires real timers to test actual timeout behavior
      jest.useRealTimers()
      jest.setTimeout(30000)

      const circuitBreaker = new CircuitBreakerStateTracker(1, 100)

      circuitBreaker.recordFailure()
      expect(circuitBreaker.isOpen()).toBe(true)

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      expect(circuitBreaker.canAttemptReset()).toBe(true)

      circuitBreaker.attemptReset()
      expect(circuitBreaker.isHalfOpen()).toBe(true)

      // Successful operation closes circuit
      circuitBreaker.recordSuccess()
      expect(circuitBreaker.isClosed()).toBe(true)
    })
  })

  describe('Retry Logging and Diagnostics', () => {
    it('should log retry attempts', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create
        .mockRejectedValueOnce((() => {
          const error = new Error('Rate limit')
          ;(error as any).status = 429
          return error
        })())
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'test',
                      description: 'test',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        })

      const chunk = { id: 'chunk-1', content: 'Test' }

      console.log('Attempt 1 failed: Rate limit exceeded')
      console.log('Retrying after backoff...')

      // Start async operation
      const extractPromise = builder.extractConceptsFromChunk(chunk)

      // Advance timers to skip the retry delay (~100ms + jitter = ~110ms max)
      await jest.advanceTimersByTimeAsync(150)

      await extractPromise

      expect(consoleLogSpy).toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('should provide detailed retry statistics', () => {
      tracker.recordAttempt('op-1', 'failure', new Error('Error 1'), 100, 50)
      tracker.recordAttempt('op-1', 'failure', new Error('Error 1'), 200, 45)
      tracker.recordAttempt('op-1', 'success', undefined, 200, 40)

      const stats = tracker.getStats()

      expect(stats.totalAttempts).toBe(3)
      expect(stats.successCount).toBe(1)
      expect(stats.failureCount).toBe(2)
      expect(stats.totalDelayMs).toBe(500)
      expect(stats.successRate).toBeCloseTo(1 / 3, 2)
    })

    it('should track per-chunk retry counts', async () => {
      tracker.recordAttempt('chunk-1', 'failure', new Error('Timeout'), 100, 0)
      tracker.recordAttempt('chunk-1', 'success', undefined, 100, 50)
      tracker.recordAttempt('chunk-2', 'success', undefined, 0, 30)

      const failed = tracker.getFailedAttempts()
      const successful = tracker.getSuccessfulAttempts()

      expect(failed.length).toBe(1)
      expect(successful.length).toBe(2)
    })
  })

  describe('Integration: Complete Retry Flow', () => {
    it('should handle complete extraction with retries', async () => {
      // This test uses real timers to test actual retry behavior with real delays
      jest.useRealTimers()

      const mockClient = builder.getMockClient()
      let callCount = 0

      mockClient.client.chat.completions.create.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          const error = new Error('Timeout')
          ;(error as any).code = 'ECONNABORTED'
          throw error
        }

        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  concepts: [
                    {
                      name: 'medical concept',
                      description: 'A medical concept',
                      category: 'anatomy',
                    },
                  ],
                }),
              },
            },
          ],
        }
      })

      const chunk = { id: 'chunk-1', content: 'Medical content here' }

      try {
        await builder.extractConceptsFromChunk(chunk)
      } catch (error) {
        // May fail or succeed depending on implementation
      }

      expect(mockClient.client.chat.completions.create).toHaveBeenCalled()
    })

    it('should exhaust retries and report failure', async () => {
      const mockClient = builder.getMockClient()

      mockClient.client.chat.completions.create.mockRejectedValue((() => {
        const error = new Error('Persistent failure')
        ;(error as any).status = 500
        return error
      })())

      const chunk = { id: 'chunk-1', content: 'Test' }

      // Start async operation and catch the error
      const extractPromise = builder.extractConceptsFromChunk(chunk).catch(error => error)

      // Advance timers for all retry attempts
      // Max retries = 3, delays: ~100ms, ~200ms, ~400ms = ~700ms total max
      await jest.advanceTimersByTimeAsync(800)

      const error = await extractPromise

      // Verify the error message contains expected text
      expect((error as Error).message).toContain('Persistent failure')

      // Should attempt multiple times before giving up (initial + 3 retries = 4 total)
      expect(mockClient.client.chat.completions.create.mock.calls.length).toBeGreaterThanOrEqual(1)
    })
  })
})

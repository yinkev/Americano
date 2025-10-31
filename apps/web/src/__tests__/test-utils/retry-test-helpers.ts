/**
 * Test Utilities for Retry Logic Testing
 * Epic 3 - Retry Logic Test Coverage
 *
 * Provides:
 * - Transient error simulators (rate limits, timeouts, connection errors)
 * - Retry behavior assertions
 * - Backoff calculation verification
 * - Circuit breaker state tracking
 * - Mock factories for external services
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'

/**
 * Transient error types
 */
export enum TransientErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TEMPORARY_FAILURE = 'TEMPORARY_FAILURE',
}

/**
 * Permanent error types (should not retry)
 */
export enum PermanentErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_JSON = 'INVALID_JSON',
}

/**
 * Simulates transient errors that appear for N attempts then succeed
 *
 * @example
 * ```typescript
 * const simulator = new TransientErrorSimulator(TransientErrorType.RATE_LIMIT, 2)
 * const result1 = simulator.execute(() => someFunction()) // Throws
 * const result2 = simulator.execute(() => someFunction()) // Throws
 * const result3 = simulator.execute(() => someFunction()) // Succeeds
 * ```
 */
export class TransientErrorSimulator {
  private attemptCount = 0
  private failureCount: number

  constructor(
    private errorType: TransientErrorType,
    failForNAttempts: number = 1,
  ) {
    this.failureCount = failForNAttempts
  }

  /**
   * Execute function and simulate transient error for configured attempts
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.attemptCount++

    if (this.attemptCount <= this.failureCount) {
      throw this.createError()
    }

    return fn()
  }

  /**
   * Create appropriate error for the transient error type
   */
  private createError(): Error {
    switch (this.errorType) {
      case TransientErrorType.RATE_LIMIT: {
        const rateLimitError = new Error('Rate limit exceeded')
        ;(rateLimitError as any).status = 429
        ;(rateLimitError as any).retryAfter = 60
        return rateLimitError
      }

      case TransientErrorType.TIMEOUT: {
        const timeoutError = new Error('Request timeout')
        ;(timeoutError as any).code = 'ECONNABORTED'
        ;(timeoutError as any).timeout = 5000
        return timeoutError
      }

      case TransientErrorType.CONNECTION_ERROR: {
        const connError = new Error('Connection refused')
        ;(connError as any).code = 'ECONNREFUSED'
        return connError
      }

      case TransientErrorType.SERVICE_UNAVAILABLE: {
        const unavailableError = new Error('Service temporarily unavailable')
        ;(unavailableError as any).status = 503
        return unavailableError
      }

      case TransientErrorType.TEMPORARY_FAILURE:
        return new Error('Temporary failure, please retry')

      default:
        return new Error('Unknown transient error')
    }
  }

  /**
   * Get current attempt count
   */
  getAttemptCount(): number {
    return this.attemptCount
  }

  /**
   * Reset simulator
   */
  reset(): void {
    this.attemptCount = 0
  }
}

/**
 * Simulates permanent errors (should not retry)
 */
export class PermanentErrorSimulator {
  constructor(private errorType: PermanentErrorType) {}

  /**
   * Execute function and throw permanent error
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    throw this.createError()
  }

  /**
   * Create appropriate error for permanent error type
   */
  private createError(): Error {
    switch (this.errorType) {
      case PermanentErrorType.INVALID_INPUT: {
        const invalidError = new Error('Invalid input provided')
        ;(invalidError as any).status = 400
        ;(invalidError as any).code = 'INVALID_INPUT'
        return invalidError
      }

      case PermanentErrorType.AUTHENTICATION_ERROR: {
        const authError = new Error('Authentication failed')
        ;(authError as any).status = 401
        return authError
      }

      case PermanentErrorType.FORBIDDEN: {
        const forbiddenError = new Error('Access forbidden')
        ;(forbiddenError as any).status = 403
        return forbiddenError
      }

      case PermanentErrorType.NOT_FOUND: {
        const notFoundError = new Error('Resource not found')
        ;(notFoundError as any).status = 404
        return notFoundError
      }

      case PermanentErrorType.INVALID_JSON: {
        const jsonError = new Error('Invalid JSON: Unexpected token')
        ;(jsonError as any).code = 'INVALID_JSON'
        return jsonError
      }

      default:
        return new Error('Unknown permanent error')
    }
  }
}

/**
 * Simulates partial failures in batch operations
 *
 * @example
 * ```typescript
 * const simulator = new BatchFailureSimulator([
 *   { index: 0, error: TransientErrorType.RATE_LIMIT, retryable: true },
 *   { index: 2, error: PermanentErrorType.INVALID_INPUT, retryable: false },
 * ])
 * ```
 */
export interface BatchFailureConfig {
  /** Index of item in batch */
  index: number
  /** Error type */
  error: TransientErrorType | PermanentErrorType
  /** Whether error is retriable */
  retryable: boolean
}

export class BatchFailureSimulator {
  private attemptCount = 0
  private itemAttemptCounts = new Map<number, number>()

  constructor(private failureConfigs: BatchFailureConfig[]) {}

  /**
   * Execute operation on batch item
   */
  async executeItem<T>(itemIndex: number, fn: (index: number) => Promise<T>): Promise<T> {
    const attempts = (this.itemAttemptCounts.get(itemIndex) || 0) + 1
    this.itemAttemptCounts.set(itemIndex, attempts)

    const config = this.failureConfigs.find((c) => c.index === itemIndex)

    if (config && attempts <= 2) {
      // Fail for first 2 attempts
      throw this.createError(config.error)
    }

    return fn(itemIndex)
  }

  /**
   * Get attempt count for specific item
   */
  getItemAttemptCount(itemIndex: number): number {
    return this.itemAttemptCounts.get(itemIndex) || 0
  }

  /**
   * Reset simulator
   */
  reset(): void {
    this.attemptCount = 0
    this.itemAttemptCounts.clear()
  }

  private createError(errorType: TransientErrorType | PermanentErrorType): Error {
    if (Object.values(TransientErrorType).includes(errorType as TransientErrorType)) {
      // Create a synchronous Error matching the transient type
      switch (errorType as TransientErrorType) {
        case TransientErrorType.RATE_LIMIT: {
          const err = new Error('Rate limit exceeded')
          ;(err as any).status = 429
          ;(err as any).retryAfter = 60
          return err
        }
        case TransientErrorType.TIMEOUT: {
          const err = new Error('Request timeout')
          ;(err as any).code = 'ECONNABORTED'
          ;(err as any).timeout = 5000
          return err
        }
        case TransientErrorType.CONNECTION_ERROR: {
          const err = new Error('Connection refused')
          ;(err as any).code = 'ECONNREFUSED'
          return err
        }
        case TransientErrorType.SERVICE_UNAVAILABLE: {
          const err = new Error('Service temporarily unavailable')
          ;(err as any).status = 503
          return err
        }
        case TransientErrorType.TEMPORARY_FAILURE:
          return new Error('Temporary failure, please retry')
        default:
          return new Error('Unknown transient error')
      }
    } else {
      // Create a synchronous Error matching the permanent type
      switch (errorType as PermanentErrorType) {
        case PermanentErrorType.INVALID_INPUT: {
          const err = new Error('Invalid input provided')
          ;(err as any).status = 400
          ;(err as any).code = 'INVALID_INPUT'
          return err
        }
        case PermanentErrorType.AUTHENTICATION_ERROR: {
          const err = new Error('Authentication failed')
          ;(err as any).status = 401
          return err
        }
        case PermanentErrorType.FORBIDDEN: {
          const err = new Error('Access forbidden')
          ;(err as any).status = 403
          return err
        }
        case PermanentErrorType.NOT_FOUND: {
          const err = new Error('Resource not found')
          ;(err as any).status = 404
          return err
        }
        case PermanentErrorType.INVALID_JSON: {
          const err = new Error('Invalid JSON: Unexpected token')
          ;(err as any).code = 'INVALID_JSON'
          return err
        }
        default:
          return new Error('Unknown permanent error')
      }
    }
  }
}

/**
 * Exponential backoff calculator for testing
 *
 * @example
 * ```typescript
 * const backoff = new ExponentialBackoffCalculator(100, 2, 10000)
 * console.log(backoff.calculate(0))  // 100ms + jitter
 * console.log(backoff.calculate(1))  // 200ms + jitter
 * console.log(backoff.calculate(2))  // 400ms + jitter
 * console.log(backoff.calculate(10)) // capped at 10000ms
 * ```
 */
export class ExponentialBackoffCalculator {
  constructor(
    private initialDelayMs: number = 100,
    private multiplier: number = 2,
    private maxDelayMs: number = 30000,
    private jitterFactor: number = 0.1,
  ) {}

  /**
   * Calculate backoff delay for nth retry
   */
  calculate(retryAttempt: number): number {
    const exponentialDelay = this.initialDelayMs * this.multiplier ** retryAttempt
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs)
    const jitter = this.calculateJitter(cappedDelay)
    return cappedDelay + jitter
  }

  /**
   * Calculate jitter component
   */
  private calculateJitter(delay: number): number {
    // Full jitter: random between 0 and delay * jitterFactor
    return Math.random() * delay * this.jitterFactor
  }

  /**
   * Calculate backoff WITHOUT jitter for deterministic testing
   */
  calculateDeterministic(retryAttempt: number): number {
    const exponentialDelay = this.initialDelayMs * this.multiplier ** retryAttempt
    return Math.min(exponentialDelay, this.maxDelayMs)
  }

  /**
   * Verify sequence of backoff delays
   */
  verifySequence(attempts: number[]): boolean {
    for (let i = 0; i < attempts.length - 1; i++) {
      const currentBackoff = this.calculateDeterministic(i)
      const nextBackoff = this.calculateDeterministic(i + 1)

      if (attempts[i] > currentBackoff * 1.15 || attempts[i + 1] > nextBackoff * 1.15) {
        return false
      }
    }
    return true
  }
}

/**
 * Circuit breaker state tracker for testing
 *
 * @example
 * ```typescript
 * const breaker = new CircuitBreakerStateTracker(5, 60000)
 * breaker.recordFailure()
 * breaker.recordFailure()
 * breaker.recordFailure()
 * breaker.recordFailure()
 * breaker.recordFailure()
 * expect(breaker.isOpen()).toBe(true) // Circuit opens after 5 failures
 * ```
 */
export class CircuitBreakerStateTracker {
  private failureCount = 0
  private successCount = 0
  private lastFailureTime: number | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000,
  ) {}

  /**
   * Record a failure
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  /**
   * Record a success
   */
  recordSuccess(): void {
    this.successCount++

    if (this.state === 'half-open') {
      // Transition back to closed after success in half-open state
      this.state = 'closed'
      this.failureCount = 0
      this.successCount = 0
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  canAttemptReset(): boolean {
    if (this.state !== 'open' || !this.lastFailureTime) return false

    const timeSinceFailure = Date.now() - this.lastFailureTime
    return timeSinceFailure >= this.resetTimeoutMs
  }

  /**
   * Attempt to reset circuit
   */
  attemptReset(): void {
    if (this.canAttemptReset()) {
      this.state = 'half-open'
      this.failureCount = 0
    }
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === 'open'
  }

  /**
   * Check if circuit is closed
   */
  isClosed(): boolean {
    return this.state === 'closed'
  }

  /**
   * Check if circuit is half-open
   */
  isHalfOpen(): boolean {
    return this.state === 'half-open'
  }

  /**
   * Get current state
   */
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    }
  }

  /**
   * Reset tracker to initial state
   */
  reset(): void {
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.state = 'closed'
  }
}

/**
 * Retry attempt tracker for assertions
 *
 * @example
 * ```typescript
 * const tracker = new RetryAttemptTracker()
 * tracker.recordAttempt('first-attempt', 'success')
 * tracker.recordAttempt('second-attempt', 'failure', new Error('Rate limit'))
 * tracker.recordAttempt('third-attempt', 'success')
 *
 * const stats = tracker.getStats()
 * expect(stats.totalAttempts).toBe(3)
 * expect(stats.successCount).toBe(2)
 * ```
 */
export interface RetryAttemptRecord {
  id: string
  status: 'success' | 'failure'
  error?: Error
  delayBeforeAttemptMs: number
  executionTimeMs: number
  timestamp: number
}

export class RetryAttemptTracker {
  private attempts: RetryAttemptRecord[] = []

  /**
   * Record a retry attempt
   */
  recordAttempt(
    id: string,
    status: 'success' | 'failure',
    error?: Error,
    delayBeforeAttemptMs: number = 0,
    executionTimeMs: number = 0,
  ): void {
    this.attempts.push({
      id,
      status,
      error,
      delayBeforeAttemptMs,
      executionTimeMs,
      timestamp: Date.now(),
    })
  }

  /**
   * Get all attempts
   */
  getAttempts(): RetryAttemptRecord[] {
    return [...this.attempts]
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalAttempts = this.attempts.length
    const successCount = this.attempts.filter((a) => a.status === 'success').length
    const failureCount = this.attempts.filter((a) => a.status === 'failure').length
    const totalDelayMs = this.attempts.reduce((sum, a) => sum + a.delayBeforeAttemptMs, 0)
    const totalExecutionTimeMs = this.attempts.reduce((sum, a) => sum + a.executionTimeMs, 0)

    return {
      totalAttempts,
      successCount,
      failureCount,
      totalDelayMs,
      totalExecutionTimeMs,
      successRate: totalAttempts > 0 ? successCount / totalAttempts : 0,
    }
  }

  /**
   * Get attempts that succeeded
   */
  getSuccessfulAttempts(): RetryAttemptRecord[] {
    return this.attempts.filter((a) => a.status === 'success')
  }

  /**
   * Get attempts that failed
   */
  getFailedAttempts(): RetryAttemptRecord[] {
    return this.attempts.filter((a) => a.status === 'failure')
  }

  /**
   * Clear all attempts
   */
  clear(): void {
    this.attempts = []
  }
}

/**
 * Assertion helpers for retry testing
 */
export const retryAssertions = {
  /**
   * Assert that a function was retried the expected number of times
   */
  assertRetryCount(mockFunction: jest.MockedFunction<any>, expectedRetries: number): void {
    const totalCalls = mockFunction.mock.calls.length
    const expectedCalls = expectedRetries + 1 // original attempt + retries
    expect(totalCalls).toBe(expectedCalls)
  },

  /**
   * Assert that backoff delays increase exponentially
   */
  assertExponentialBackoff(delays: number[], multiplier: number = 2): void {
    for (let i = 0; i < delays.length - 1; i++) {
      const ratio = delays[i + 1] / delays[i]
      const tolerance = 0.15 // Allow 15% tolerance for jitter
      expect(ratio).toBeGreaterThan(multiplier - tolerance)
      expect(ratio).toBeLessThan(multiplier + tolerance)
    }
  },

  /**
   * Assert that error was categorized correctly (retriable vs permanent)
   */
  assertErrorCategory(error: Error, expectedRetriable: boolean): void {
    const status = (error as any).status
    const isRetriable = status && [408, 429, 500, 502, 503, 504].includes(status)
    expect(isRetriable).toBe(expectedRetriable)
  },

  /**
   * Assert that circuit breaker triggered correctly
   */
  assertCircuitBreakerTriggered(tracker: CircuitBreakerStateTracker, shouldBeOpen: boolean): void {
    expect(tracker.isOpen()).toBe(shouldBeOpen)
  },

  /**
   * Assert that all retries were exhausted
   */
  assertRetriesExhausted(tracker: RetryAttemptTracker, maxRetries: number): void {
    const stats = tracker.getStats()
    expect(stats.totalAttempts).toBe(maxRetries + 1) // original + retries
    expect(stats.successCount).toBe(0)
    expect(stats.failureCount).toBe(maxRetries + 1)
  },
}

/**
 * Mock factory for external services
 */
export const mockFactories = {
  /**
   * Create mock Gemini client
   */
  createMockGeminiClient: jest.fn(() => ({
    generateEmbedding: jest.fn(async (text: string) => ({
      embedding: Array(1536)
        .fill(0)
        .map(() => Math.random()),
      error: undefined,
    })),
  })),

  /**
   * Create mock ChatMock client
   */
  createMockChatMockClient: jest.fn(() => ({
    client: {
      chat: {
        completions: {
          create: jest.fn(async () => ({
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
          })),
        },
      },
    },
  })),

  /**
   * Create mock Prisma client
   */
  createMockPrismaClient: jest.fn(() => ({
    concept: {
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => null),
      create: jest.fn(async (data) => data),
      update: jest.fn(async (data) => {
        // Narrow unknown input before property access
        if (data && typeof data === 'object' && 'data' in data) {
          return (data as { data: unknown }).data
        }
        return undefined
      }),
      delete: jest.fn(async () => ({})),
    },
    conceptRelationship: {
      findMany: jest.fn(async () => []),
      findFirst: jest.fn(async () => null),
      create: jest.fn(async (data) => data),
    },
    contentChunk: {
      findMany: jest.fn(async () => []),
    },
    $queryRaw: jest.fn(async () => []),
    $queryRawUnsafe: jest.fn(async () => []),
    $disconnect: jest.fn(async () => {}),
  })),
}

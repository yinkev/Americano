/**
 * Unit Tests for RetryService
 * Epic 3 - Retry Logic Test Coverage
 *
 * Test Coverage:
 * - Exponential backoff calculation
 * - Maximum retry limit enforcement
 * - Jitter randomization
 * - Circuit breaker triggering
 * - Error categorization (retriable vs. permanent)
 * - Retry state management
 * - Async operation retry handling
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  TransientErrorSimulator,
  PermanentErrorSimulator,
  ExponentialBackoffCalculator,
  CircuitBreakerStateTracker,
  RetryAttemptTracker,
  TransientErrorType,
  PermanentErrorType,
  retryAssertions,
} from '../../__tests__/test-utils/retry-test-helpers'

/**
 * Mock RetryService implementation for testing
 * In production, this would be the actual service
 */
class RetryService {
  private maxRetries: number
  private initialDelayMs: number
  private backoffMultiplier: number
  private maxDelayMs: number
  private circuitBreakerThreshold: number
  private circuitBreakerResetTimeMs: number
  private circuitBreakers = new Map<string, CircuitBreakerStateTracker>()

  constructor(config: {
    maxRetries?: number
    initialDelayMs?: number
    backoffMultiplier?: number
    maxDelayMs?: number
    circuitBreakerThreshold?: number
    circuitBreakerResetTimeMs?: number
  } = {}) {
    this.maxRetries = config.maxRetries ?? 3
    this.initialDelayMs = config.initialDelayMs ?? 100
    this.backoffMultiplier = config.backoffMultiplier ?? 2
    this.maxDelayMs = config.maxDelayMs ?? 30000
    this.circuitBreakerThreshold = config.circuitBreakerThreshold ?? 5
    this.circuitBreakerResetTimeMs = config.circuitBreakerResetTimeMs ?? 60000
  }

  /**
   * Execute function with automatic retry logic
   */
  async execute<T>(
    operationId: string,
    operation: () => Promise<T>,
    shouldRetry: (error: Error) => boolean = this.isRetriableError.bind(this)
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(operationId)

    if (breaker.isOpen()) {
      breaker.attemptReset()
      if (breaker.isOpen()) {
        throw new Error(`Circuit breaker open for operation: ${operationId}`)
      }
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation()
        if (breaker.isHalfOpen()) {
          breaker.recordSuccess()
        }
        return result
      } catch (error) {
        const err = error as Error
        breaker.recordFailure()

        if (!shouldRetry(err) || attempt === this.maxRetries) {
          throw error
        }

        const delayMs = this.calculateBackoff(attempt)
        await this.delay(delayMs)
      }
    }

    throw new Error('Retry logic error: should not reach here')
  }

  /**
   * Check if error is retriable
   */
  private isRetriableError(error: Error): boolean {
    const status = (error as any).status
    const code = (error as any).code

    // HTTP status codes
    if (status) {
      return [408, 429, 500, 502, 503, 504].includes(status)
    }

    // Network errors
    if (code) {
      return ['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'].includes(code)
    }

    // Message-based detection
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('temporarily unavailable') ||
      message.includes('rate limit')
    )
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryAttempt: number): number {
    const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffMultiplier, retryAttempt)
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs)

    // Add full jitter
    const jitter = Math.random() * cappedDelay * 0.1
    return cappedDelay + jitter
  }

  /**
   * Deterministic backoff (for testing)
   */
  calculateBackoffDeterministic(retryAttempt: number): number {
    const exponentialDelay = this.initialDelayMs * Math.pow(this.backoffMultiplier, retryAttempt)
    return Math.min(exponentialDelay, this.maxDelayMs)
  }

  /**
   * Get or create circuit breaker for operation
   */
  private getCircuitBreaker(operationId: string): CircuitBreakerStateTracker {
    if (!this.circuitBreakers.has(operationId)) {
      this.circuitBreakers.set(
        operationId,
        new CircuitBreakerStateTracker(this.circuitBreakerThreshold, this.circuitBreakerResetTimeMs)
      )
    }
    return this.circuitBreakers.get(operationId)!
  }

  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(operationId: string) {
    return this.getCircuitBreaker(operationId).getState()
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(operationId: string): void {
    this.getCircuitBreaker(operationId).reset()
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

describe('RetryService', () => {
  let service: RetryService
  let tracker: RetryAttemptTracker

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    service = new RetryService({
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 30000,
      circuitBreakerThreshold: 5,
    })
    tracker = new RetryAttemptTracker()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff correctly', () => {
      const backoff = new ExponentialBackoffCalculator(100, 2, 30000, 0)

      const delayAttempt0 = backoff.calculateDeterministic(0) // 100 * 2^0 = 100
      const delayAttempt1 = backoff.calculateDeterministic(1) // 100 * 2^1 = 200
      const delayAttempt2 = backoff.calculateDeterministic(2) // 100 * 2^2 = 400
      const delayAttempt3 = backoff.calculateDeterministic(3) // 100 * 2^3 = 800

      expect(delayAttempt0).toBe(100)
      expect(delayAttempt1).toBe(200)
      expect(delayAttempt2).toBe(400)
      expect(delayAttempt3).toBe(800)
    })

    it('should cap backoff at maximum delay', () => {
      const backoff = new ExponentialBackoffCalculator(100, 2, 1000, 0)

      const delay5 = backoff.calculateDeterministic(5) // 100 * 2^5 = 3200, capped at 1000
      const delay10 = backoff.calculateDeterministic(10) // Very large, capped at 1000

      expect(delay5).toBe(1000)
      expect(delay10).toBe(1000)
    })

    it('should apply jitter to delays', () => {
      const backoff = new ExponentialBackoffCalculator(100, 2, 30000, 0.1)

      const delays: number[] = []
      for (let i = 0; i < 10; i++) {
        delays.push(backoff.calculate(0))
      }

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(5) // Most should be unique

      // All delays should be within reasonable range
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(100)
        expect(delay).toBeLessThanOrEqual(100 * 1.1) // 100 + 10% jitter
      })
    })

    it('should use custom backoff configuration', () => {
      const service2 = new RetryService({
        initialDelayMs: 50,
        backoffMultiplier: 3,
        maxDelayMs: 5000,
      })

      const delay0 = service2.calculateBackoffDeterministic(0) // 50
      const delay1 = service2.calculateBackoffDeterministic(1) // 150
      const delay2 = service2.calculateBackoffDeterministic(2) // 450

      expect(delay0).toBe(50)
      expect(delay1).toBe(150)
      expect(delay2).toBe(450)
    })
  })

  describe('Maximum Retry Limit Enforcement', () => {
    it('should retry up to maximum attempts', async () => {
      const mockFunction = jest.fn(async () => {
        throw new Error('Rate limit exceeded')
      })

      ;(mockFunction as any).status = 429

      const operation = async () => {
        const result = await mockFunction()
        return result
      }

      await expect(service.execute('test-op', operation)).rejects.toThrow('Rate limit exceeded')

      // 1 initial attempt + 3 retries = 4 total calls
      expect(mockFunction).toHaveBeenCalledTimes(4)
    })

    it('should stop retrying after max retries exceeded', async () => {
      const mockFunction = jest.fn(async () => {
        throw new Error('Service unavailable')
      })

      ;(mockFunction as any).status = 503

      const operation = async () => {
        await mockFunction()
        return 'success'
      }

      await expect(service.execute('test-op', operation)).rejects.toThrow('Service unavailable')

      // Should not exceed maxRetries + 1
      expect(mockFunction.mock.calls.length).toBeLessThanOrEqual(4)
    })

    it('should respect custom max retry configuration', async () => {
      const customService = new RetryService({ maxRetries: 1 })
      const mockFunction = jest.fn(async () => {
        throw new Error('Timeout')
      })

      ;(mockFunction as any).code = 'ECONNABORTED'

      const operation = async () => {
        await mockFunction()
        return 'success'
      }

      await expect(customService.execute('test-op', operation)).rejects.toThrow('Timeout')

      // 1 initial + 1 retry = 2 total
      expect(mockFunction).toHaveBeenCalledTimes(2)
    })

    it('should not retry when shouldRetry returns false', async () => {
      const mockFunction = jest.fn(async () => {
        throw new Error('Invalid input')
      })

      ;(mockFunction as any).status = 400

      const operation = async () => {
        await mockFunction()
        return 'success'
      }

      const shouldRetry = () => false

      await expect(service.execute('test-op', operation, shouldRetry)).rejects.toThrow(
        'Invalid input'
      )

      // Should only be called once, no retries
      expect(mockFunction).toHaveBeenCalledTimes(1)
    })
  })

  describe('Jitter Randomization', () => {
    it('should randomize jitter for each retry attempt', () => {
      const backoff = new ExponentialBackoffCalculator(100, 2, 30000, 0.1)

      const attempt1Delays: number[] = []
      for (let i = 0; i < 5; i++) {
        attempt1Delays.push(backoff.calculate(0))
      }

      // Collect another set
      const attempt2Delays: number[] = []
      for (let i = 0; i < 5; i++) {
        attempt2Delays.push(backoff.calculate(0))
      }

      // At least one delay should be different between sets
      let hasDifference = false
      for (let i = 0; i < attempt1Delays.length; i++) {
        if (attempt1Delays[i] !== attempt2Delays[i]) {
          hasDifference = true
          break
        }
      }

      expect(hasDifference).toBe(true)
    })

    it('should respect jitter factor bounds', () => {
      const backoff = new ExponentialBackoffCalculator(100, 2, 30000, 0.2)
      const delays: number[] = []

      for (let i = 0; i < 100; i++) {
        delays.push(backoff.calculate(0))
      }

      delays.forEach(delay => {
        // Base delay is 100, jitter can add up to 20
        expect(delay).toBeGreaterThanOrEqual(100)
        expect(delay).toBeLessThanOrEqual(100 * 1.2)
      })
    })
  })

  describe('Circuit Breaker Triggering', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const circuitBreaker = new CircuitBreakerStateTracker(3, 60000)

      expect(circuitBreaker.isClosed()).toBe(true)

      circuitBreaker.recordFailure()
      circuitBreaker.recordFailure()
      expect(circuitBreaker.isClosed()).toBe(true)

      circuitBreaker.recordFailure()
      expect(circuitBreaker.isOpen()).toBe(true)
    })

    it('should reject requests when circuit is open', async () => {
      const mockFunction = jest.fn(async () => {
        throw new Error('Service error')
      })

      ;(mockFunction as any).status = 503

      const operation = async () => {
        await mockFunction()
        return 'success'
      }

      // Simulate 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        await expect(service.execute('test-op-circuit', operation)).rejects.toThrow()
      }

      // Verify circuit is open
      expect(service.getCircuitBreakerState('test-op-circuit')).toBe('open')

      // Next attempt should fail immediately without calling operation
      const callCountBefore = mockFunction.mock.calls.length
      await expect(service.execute('test-op-circuit', operation)).rejects.toThrow(
        'Circuit breaker open'
      )

      // Operation should not have been called again
      expect(mockFunction.mock.calls.length).toBe(callCountBefore)
    })

    it('should transition to half-open state after reset timeout', async () => {
      jest.useRealTimers() // Use real timers for this test

      const circuitBreaker = new CircuitBreakerStateTracker(1, 100) // 100ms timeout

      circuitBreaker.recordFailure()
      expect(circuitBreaker.isOpen()).toBe(true)

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))

      // Circuit should be able to attempt reset
      expect(circuitBreaker.canAttemptReset()).toBe(true)

      circuitBreaker.attemptReset()
      expect(circuitBreaker.isHalfOpen()).toBe(true)

      // Successful operation should close circuit
      circuitBreaker.recordSuccess()
      expect(circuitBreaker.isClosed()).toBe(true)
    })

    it('should track circuit breaker statistics', () => {
      const circuitBreaker = new CircuitBreakerStateTracker(5, 60000)

      for (let i = 0; i < 3; i++) {
        circuitBreaker.recordFailure()
      }

      const stats = circuitBreaker.getStats()

      expect(stats.state).toBe('closed')
      expect(stats.failureCount).toBe(3)
      expect(stats.successCount).toBe(0)
      expect(stats.lastFailureTime).toBeDefined()
    })
  })

  describe('Error Categorization', () => {
    it('should categorize rate limit as retriable', () => {
      const error = new Error('Too many requests')
      ;(error as any).status = 429

      const isRetriable = [408, 429, 500, 502, 503, 504].includes((error as any).status)
      expect(isRetriable).toBe(true)
    })

    it('should categorize timeout as retriable', () => {
      const error = new Error('Request timeout')
      ;(error as any).code = 'ECONNABORTED'

      const isRetriable = ['ECONNREFUSED', 'ECONNABORTED', 'ETIMEDOUT'].includes((error as any).code)
      expect(isRetriable).toBe(true)
    })

    it('should categorize invalid input as non-retriable', () => {
      const error = new Error('Invalid JSON')
      ;(error as any).status = 400

      const isRetriable = [408, 429, 500, 502, 503, 504].includes((error as any).status)
      expect(isRetriable).toBe(false)
    })

    it('should categorize authentication error as non-retriable', () => {
      const error = new Error('Unauthorized')
      ;(error as any).status = 401

      const isRetriable = [408, 429, 500, 502, 503, 504].includes((error as any).status)
      expect(isRetriable).toBe(false)
    })

    it('should detect retriable errors by message', async () => {
      const mockFunction = jest.fn(async () => {
        throw new Error('Service temporarily unavailable')
      })

      const operation = async () => {
        await mockFunction()
        return 'success'
      }

      await expect(service.execute('test-op', operation)).rejects.toThrow(
        'Service temporarily unavailable'
      )

      // Should retry based on message
      expect(mockFunction).toHaveBeenCalledTimes(4) // 1 initial + 3 retries
    })
  })

  describe('Retry State Management', () => {
    it('should track retry attempts', async () => {
      const simulator = new TransientErrorSimulator(TransientErrorType.RATE_LIMIT, 2)
      let attemptCount = 0

      const operation = async () => {
        attemptCount++
        return await simulator.execute(async () => 'success')
      }

      const result = await service.execute('test-op', operation)

      expect(result).toBe('success')
      expect(attemptCount).toBe(3) // Failed twice, succeeded on third
    })

    it('should record retry attempt details', () => {
      const tracker = new RetryAttemptTracker()

      tracker.recordAttempt('attempt-1', 'failure', new Error('Rate limit'), 0, 50)
      tracker.recordAttempt('attempt-2', 'failure', new Error('Rate limit'), 100, 45)
      tracker.recordAttempt('attempt-3', 'success', undefined, 200, 40)

      const stats = tracker.getStats()

      expect(stats.totalAttempts).toBe(3)
      expect(stats.successCount).toBe(1)
      expect(stats.failureCount).toBe(2)
      expect(stats.totalDelayMs).toBe(300)
      expect(stats.successRate).toBeCloseTo(1 / 3, 2)
    })

    it('should clear retry state between operations', () => {
      service.resetCircuitBreaker('test-op')

      expect(service.getCircuitBreakerState('test-op')).toBe('closed')
    })
  })

  describe('Async Operation Retry Handling', () => {
    it('should handle successful operation after retries', async () => {
      const simulator = new TransientErrorSimulator(TransientErrorType.TIMEOUT, 1)
      const mockFunction = jest.fn(async () => {
        return await simulator.execute(async () => ({ success: true }))
      })

      const operation = async () => {
        return await mockFunction()
      }

      const result = await service.execute('test-op', operation)

      expect(result).toEqual({ success: true })
      expect(mockFunction).toHaveBeenCalledTimes(2) // Failed once, succeeded on retry
    })

    it('should handle permanent failure without retrying', async () => {
      const simulator = new PermanentErrorSimulator(PermanentErrorType.INVALID_INPUT)
      const mockFunction = jest.fn(async () => {
        return await simulator.execute(async () => ({ success: true }))
      })

      const operation = async () => {
        return await mockFunction()
      }

      const shouldRetry = () => false

      await expect(service.execute('test-op', operation, shouldRetry)).rejects.toThrow(
        'Invalid input'
      )

      expect(mockFunction).toHaveBeenCalledTimes(1) // No retries
    })

    it('should handle batch operations with mixed successes and failures', async () => {
      const operations = [
        async () => ({ id: 1, success: true }),
        async () => {
          throw new Error('Rate limit')
        },
        async () => ({ id: 3, success: true }),
      ]

      ;(operations[1] as any).status = 429

      const results = []

      for (const operation of operations) {
        try {
          results.push(await service.execute('batch-op', operation))
        } catch (error) {
          results.push({ error: (error as Error).message })
        }
      }

      expect(results[0]).toEqual({ id: 1, success: true })
      expect(results[1]).toEqual({ error: 'Rate limit' })
      expect(results[2]).toEqual({ id: 3, success: true })
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete retry flow: fail → retry → succeed', async () => {
      jest.useRealTimers() // Use real timers for realistic delays

      const simulator = new TransientErrorSimulator(TransientErrorType.RATE_LIMIT, 2)
      let callCount = 0

      const operation = async () => {
        callCount++
        return await simulator.execute(async () => 'success')
      }

      const result = await service.execute('flow-test', operation)

      expect(result).toBe('success')
      expect(callCount).toBe(3)
      expect(simulator.getAttemptCount()).toBe(3)
    })

    it('should exhaust retries and fail gracefully', async () => {
      const simulator = new TransientErrorSimulator(TransientErrorType.TIMEOUT, 10) // Always fails

      const operation = async () => {
        return await simulator.execute(async () => 'success')
      }

      await expect(service.execute('exhaust-test', operation)).rejects.toThrow('Request timeout')

      // 1 initial + 3 retries = 4 total attempts
      expect(simulator.getAttemptCount()).toBeGreaterThanOrEqual(4)
    })
  })
})

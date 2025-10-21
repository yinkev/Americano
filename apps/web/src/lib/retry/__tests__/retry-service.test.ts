/**
 * RetryService Tests - Comprehensive test coverage for retry logic
 *
 * Tests:
 * - Exponential backoff with jitter
 * - Error categorization (transient vs permanent)
 * - Circuit breaker behavior
 * - Retry limits and timeouts
 * - Success after N retries
 *
 * Epic 3 - Retry Strategy Testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  RetryService,
  ErrorCategory,
  RetriableError,
  PermanentError,
  CircuitState,
  DEFAULT_POLICIES,
} from '../retry-service'

describe('RetryService', () => {
  let retryService: RetryService

  beforeEach(() => {
    retryService = new RetryService()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Success scenarios', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const promise = retryService.execute(operation, { maxAttempts: 3 }, 'test-op')

      // Fast-forward all timers
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.value).toBe('success')
      expect(result.attempts).toBe(1)
      expect(result.error).toBeUndefined()
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should succeed after 2 retries', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValue('success')

      const promise = retryService.execute(
        operation,
        { maxAttempts: 3, initialDelayMs: 100, enableJitter: false },
        'test-op',
      )

      // Fast-forward timers for retries
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.value).toBe('success')
      expect(result.attempts).toBe(3)
      expect(result.retryHistory).toHaveLength(2)
      expect(operation).toHaveBeenCalledTimes(3)
    })
  })

  describe('Exponential backoff', () => {
    it('should use exponential backoff: 1s, 2s, 4s', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValue(new Error('timeout'))

      const promise = retryService.execute(
        operation,
        {
          maxAttempts: 4,
          initialDelayMs: 1000,
          backoffMultiplier: 2,
          enableJitter: false, // Disable for predictable testing
        },
        'test-backoff',
      )

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.retryHistory).toHaveLength(3)
      expect(result.retryHistory[0].delayMs).toBe(1000) // 1s
      expect(result.retryHistory[1].delayMs).toBe(2000) // 2s
      expect(result.retryHistory[2].delayMs).toBe(4000) // 4s
    })

    it('should cap delay at maxDelayMs', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValue(new Error('timeout'))

      const promise = retryService.execute(
        operation,
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          maxDelayMs: 2000, // Cap at 2 seconds
          backoffMultiplier: 2,
          enableJitter: false,
        },
        'test-cap',
      )

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.retryHistory[0].delayMs).toBe(1000)
      expect(result.retryHistory[1].delayMs).toBe(2000) // Capped at maxDelayMs
    })

    it('should add jitter to prevent thundering herd', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockRejectedValue(new Error('timeout'))

      const promise = retryService.execute(
        operation,
        {
          maxAttempts: 2,
          initialDelayMs: 1000,
          enableJitter: true,
        },
        'test-jitter',
      )

      await vi.runAllTimersAsync()
      const result = await promise

      // With jitter, delay should be within ±30% of 1000ms
      const delay = result.retryHistory[0].delayMs
      expect(delay).toBeGreaterThanOrEqual(700) // 1000 - 30%
      expect(delay).toBeLessThanOrEqual(1300) // 1000 + 30%
    })
  })

  describe('Error categorization', () => {
    it('should retry transient errors', async () => {
      const transientErrors = [
        new Error('Rate limit exceeded'),
        new Error('429 Too Many Requests'),
        new Error('Connection timeout'),
        new Error('ETIMEDOUT'),
        new Error('503 Service unavailable'),
        new Error('Network error'),
      ]

      for (const error of transientErrors) {
        const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success')

        const promise = retryService.execute(operation, { maxAttempts: 2 }, 'test-transient')

        await vi.runAllTimersAsync()
        const result = await promise

        expect(result.value).toBe('success')
        expect(result.attempts).toBe(2)
        expect(operation).toHaveBeenCalledTimes(2)

        // Reset for next iteration
        operation.mockClear()
        retryService.resetAllCircuits()
      }
    })

    it('should NOT retry permanent errors', async () => {
      const permanentErrors = [
        new Error('401 Unauthorized'),
        new Error('Invalid API key'),
        new Error('400 Bad request'),
        new Error('404 Not found'),
        new Error('Validation error'),
        new Error('Unique constraint violation'),
      ]

      for (const error of permanentErrors) {
        const operation = vi.fn().mockRejectedValue(error)

        const promise = retryService.execute(operation, { maxAttempts: 3 }, 'test-permanent')

        await vi.runAllTimersAsync()
        const result = await promise

        expect(result.error).toBeInstanceOf(PermanentError)
        expect(result.attempts).toBe(1) // Only tried once
        expect(operation).toHaveBeenCalledTimes(1)

        // Reset for next iteration
        operation.mockClear()
        retryService.resetAllCircuits()
      }
    })
  })

  describe('Circuit breaker', () => {
    it('should open circuit after N consecutive failures', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service down'))

      const policy = {
        maxAttempts: 3,
        circuitBreakerThreshold: 2, // Open after 2 failures
        initialDelayMs: 100,
      }

      // First failure
      const promise1 = retryService.execute(operation, policy, 'circuit-test')
      await vi.runAllTimersAsync()
      const result1 = await promise1
      expect(result1.error).toBeDefined()

      // Second failure - should open circuit
      const promise2 = retryService.execute(operation, policy, 'circuit-test')
      await vi.runAllTimersAsync()
      const result2 = await promise2
      expect(result2.error).toBeDefined()

      // Third attempt - circuit should be OPEN
      const promise3 = retryService.execute(operation, policy, 'circuit-test')
      await vi.runAllTimersAsync()
      const result3 = await promise3

      expect(result3.circuitBreakerTriggered).toBe(true)
      expect(result3.attempts).toBe(0) // No attempts made
      expect(result3.error?.message).toContain('Circuit breaker OPEN')

      // Verify circuit state
      const circuitState = retryService.getCircuitState('circuit-test')
      expect(circuitState?.state).toBe(CircuitState.OPEN)
    })

    it('should transition to HALF_OPEN after timeout', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service down'))

      const policy = {
        maxAttempts: 3,
        circuitBreakerThreshold: 1,
        circuitBreakerTimeoutMs: 60000, // 1 minute
        initialDelayMs: 100,
      }

      // Trigger circuit breaker
      const promise1 = retryService.execute(operation, policy, 'timeout-test')
      await vi.runAllTimersAsync()
      await promise1

      // Verify OPEN state
      let circuitState = retryService.getCircuitState('timeout-test')
      expect(circuitState?.state).toBe(CircuitState.OPEN)

      // Fast-forward past timeout
      vi.advanceTimersByTime(60000)

      // Next attempt should transition to HALF_OPEN
      operation.mockResolvedValue('recovered')
      const promise2 = retryService.execute(operation, policy, 'timeout-test')
      await vi.runAllTimersAsync()
      const result2 = await promise2

      expect(result2.value).toBe('recovered')

      // Circuit should be CLOSED after successful request
      circuitState = retryService.getCircuitState('timeout-test')
      expect(circuitState?.state).toBe(CircuitState.CLOSED)
    })

    it('should reset circuit breaker manually', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Service down'))

      const policy = {
        maxAttempts: 3,
        circuitBreakerThreshold: 1,
        initialDelayMs: 100,
      }

      // Open circuit
      const promise1 = retryService.execute(operation, policy, 'reset-test')
      await vi.runAllTimersAsync()
      await promise1

      expect(retryService.getCircuitState('reset-test')?.state).toBe(CircuitState.OPEN)

      // Manually reset
      retryService.resetCircuit('reset-test')

      expect(retryService.getCircuitState('reset-test')).toBeUndefined()

      // Should be able to make requests again
      operation.mockResolvedValue('success')
      const promise2 = retryService.execute(operation, policy, 'reset-test')
      await vi.runAllTimersAsync()
      const result2 = await promise2

      expect(result2.value).toBe('success')
    })
  })

  describe('Operation timeout', () => {
    it('should timeout long-running operations', async () => {
      const operation = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('too-late'), 5000) // Takes 5 seconds
          }),
      )

      const promise = retryService.execute(
        operation,
        {
          maxAttempts: 1,
          operationTimeoutMs: 1000, // Timeout after 1 second
        },
        'timeout-op',
      )

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.error?.message).toContain('timeout')
      expect(result.attempts).toBe(1)
    })
  })

  describe('Retry-After header handling', () => {
    it('should respect Retry-After from RetriableError', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(
          new RetriableError('Rate limited', ErrorCategory.TRANSIENT, undefined, 429, 5), // Retry after 5 seconds
        )
        .mockResolvedValue('success')

      const promise = retryService.execute(
        operation,
        {
          maxAttempts: 2,
          initialDelayMs: 1000,
          enableJitter: false,
        },
        'retry-after-test',
      )

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.value).toBe('success')
      // Should use Retry-After (5000ms) instead of initialDelayMs (1000ms)
      expect(result.retryHistory[0].delayMs).toBeGreaterThanOrEqual(5000)
    })
  })

  describe('Default policies', () => {
    it('should have Gemini API policy', () => {
      const policy = DEFAULT_POLICIES.GEMINI_API

      expect(policy.maxAttempts).toBe(3)
      expect(policy.initialDelayMs).toBe(1000)
      expect(policy.maxDelayMs).toBe(8000)
      expect(policy.circuitBreakerThreshold).toBe(5)
      expect(policy.operationTimeoutMs).toBe(30000)
    })

    it('should have ChatMock API policy', () => {
      const policy = DEFAULT_POLICIES.CHATMOCK_API

      expect(policy.maxAttempts).toBe(3)
      expect(policy.initialDelayMs).toBe(2000)
      expect(policy.circuitBreakerThreshold).toBe(3)
      expect(policy.operationTimeoutMs).toBe(120000) // 2 minutes
    })

    it('should have Database policy', () => {
      const policy = DEFAULT_POLICIES.DATABASE

      expect(policy.maxAttempts).toBe(5)
      expect(policy.initialDelayMs).toBe(500)
      expect(policy.circuitBreakerThreshold).toBe(10)
      expect(policy.operationTimeoutMs).toBe(10000)
    })
  })

  describe('Retry metadata', () => {
    it('should track retry history', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success')

      const promise = retryService.execute(
        operation,
        { maxAttempts: 3, initialDelayMs: 100, enableJitter: false },
        'metadata-test',
      )

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.retryHistory).toHaveLength(2)
      expect(result.retryHistory[0].attemptNumber).toBe(1)
      expect(result.retryHistory[0].error.message).toBe('Error 1')
      expect(result.retryHistory[1].attemptNumber).toBe(2)
      expect(result.retryHistory[1].error.message).toBe('Error 2')
      expect(result.totalTimeMs).toBeGreaterThan(0)
    })

    it('should track total time including delays', async () => {
      const operation = vi.fn().mockRejectedValueOnce(new Error('Error')).mockResolvedValue('success')

      const promise = retryService.execute(
        operation,
        { maxAttempts: 2, initialDelayMs: 1000, enableJitter: false },
        'time-test',
      )

      const startTime = Date.now()
      await vi.runAllTimersAsync()
      const result = await promise

      // Should have waited ~1000ms for retry
      expect(result.totalTimeMs).toBeGreaterThanOrEqual(1000)
    })
  })

  describe('Edge cases', () => {
    it('should handle maxAttempts = 1 (no retries)', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Fail'))

      const promise = retryService.execute(operation, { maxAttempts: 1 }, 'no-retry')

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.error).toBeDefined()
      expect(result.attempts).toBe(1)
      expect(result.retryHistory).toHaveLength(0) // No retries
    })

    it('should handle operation that throws non-Error', async () => {
      const operation = vi.fn().mockRejectedValue('string error')

      const promise = retryService.execute(operation, { maxAttempts: 2 }, 'non-error')

      await vi.runAllTimersAsync()
      const result = await promise

      expect(result.error).toBeInstanceOf(Error)
      expect(result.attempts).toBe(2)
    })

    it('should handle multiple operations with different names', async () => {
      const op1 = vi.fn().mockResolvedValue('op1-success')
      const op2 = vi.fn().mockResolvedValue('op2-success')

      const promise1 = retryService.execute(op1, { maxAttempts: 1 }, 'operation-1')
      const promise2 = retryService.execute(op2, { maxAttempts: 1 }, 'operation-2')

      await vi.runAllTimersAsync()
      const [result1, result2] = await Promise.all([promise1, promise2])

      expect(result1.value).toBe('op1-success')
      expect(result2.value).toBe('op2-success')
    })
  })
})

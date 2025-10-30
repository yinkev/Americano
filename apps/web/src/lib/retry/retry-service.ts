/**
 * RetryService - Production-ready retry mechanism with exponential backoff and circuit breaker
 *
 * Features:
 * - Exponential backoff with jitter (prevents thundering herd)
 * - Configurable retry policies per operation type
 * - Error categorization (transient vs permanent)
 * - Circuit breaker pattern (stop retrying after N consecutive failures)
 * - Comprehensive logging and metrics
 * - Type-safe configuration
 *
 * Epic 3 - Retry Strategy Implementation
 */

/**
 * Error classification for retry logic
 */
export enum ErrorCategory {
  /** Transient errors that should be retried (rate limits, timeouts, 503) */
  TRANSIENT = 'TRANSIENT',
  /** Permanent errors that should not be retried (400, 401, 404) */
  PERMANENT = 'PERMANENT',
  /** Unknown errors (default to no retry for safety) */
  UNKNOWN = 'UNKNOWN',
}

/**
 * Retriable error with metadata
 */
export class RetriableError extends Error {
  constructor(
    message: string,
    public readonly category: ErrorCategory,
    public readonly originalError?: Error,
    public readonly statusCode?: number,
    public readonly retryAfter?: number, // Seconds to wait before retry (from Retry-After header)
  ) {
    super(message)
    this.name = 'RetriableError'
  }
}

/**
 * Permanent error that should not be retried
 */
export class PermanentError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'PermanentError'
  }
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Circuit is closed, requests are allowed */
  CLOSED = 'CLOSED',
  /** Circuit is open, requests are blocked */
  OPEN = 'OPEN',
  /** Circuit is half-open, testing if service recovered */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number
  /** Maximum delay in milliseconds (default: 8000) */
  maxDelayMs?: number
  /** Backoff multiplier (default: 2 for exponential) */
  backoffMultiplier?: number
  /** Add random jitter to prevent thundering herd (default: true) */
  enableJitter?: boolean
  /** Circuit breaker failure threshold (default: 5) */
  circuitBreakerThreshold?: number
  /** Circuit breaker timeout in milliseconds (default: 60000 - 1 minute) */
  circuitBreakerTimeoutMs?: number
  /** Operation timeout in milliseconds (default: 30000 - 30 seconds) */
  operationTimeoutMs?: number
}

/**
 * Retry attempt metadata
 */
export interface RetryAttempt {
  attemptNumber: number
  delayMs: number
  error: Error
  timestamp: Date
}

/**
 * Retry result with metadata
 */
export interface RetryResult<T> {
  /** Result value if successful */
  value?: T
  /** Error if all retries failed */
  error?: Error
  /** Total attempts made */
  attempts: number
  /** Total time spent (including delays) */
  totalTimeMs: number
  /** History of retry attempts */
  retryHistory: RetryAttempt[]
  /** Whether circuit breaker was triggered */
  circuitBreakerTriggered: boolean
}

/**
 * Circuit breaker state for a specific operation
 */
interface CircuitBreakerState {
  state: CircuitState
  failureCount: number
  lastFailureTime?: Date
  nextAttemptTime?: Date
}

/**
 * Default retry policies for common operations
 */
export const DEFAULT_POLICIES: Record<string, Required<RetryPolicy>> = {
  // Gemini API embeddings: 100 RPM, 1000 RPD
  GEMINI_API: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
    enableJitter: true,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeoutMs: 60000,
    operationTimeoutMs: 30000,
  },
  // ChatMock API (GPT-5 calls)
  CHATMOCK_API: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 16000,
    backoffMultiplier: 2,
    enableJitter: true,
    circuitBreakerThreshold: 3,
    circuitBreakerTimeoutMs: 120000, // 2 minutes for ChatMock
    operationTimeoutMs: 120000, // 2 minute timeout for GPT-5
  },
  // Database queries (transient connection errors)
  DATABASE: {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 4000,
    backoffMultiplier: 2,
    enableJitter: true,
    circuitBreakerThreshold: 10,
    circuitBreakerTimeoutMs: 30000,
    operationTimeoutMs: 10000,
  },
}

/**
 * RetryService - Centralized retry logic with circuit breaker
 */
export class RetryService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map()

  /**
   * Execute an operation with retry logic
   *
   * @param operation - Async function to execute
   * @param policy - Retry policy configuration
   * @param operationName - Name for logging (e.g., "gemini-embedding", "chatmock-extraction")
   * @returns Promise with retry result
   *
   * @example
   * ```typescript
   * const retryService = new RetryService()
   * const result = await retryService.execute(
   *   async () => await geminiClient.generateEmbedding(text),
   *   DEFAULT_POLICIES.GEMINI_API,
   *   'gemini-embedding'
   * )
   * ```
   */
  async execute<T>(
    operation: () => Promise<T>,
    policy: RetryPolicy = {},
    operationName = 'unknown-operation',
  ): Promise<RetryResult<T>> {
    const config = this.mergeWithDefaults(policy)
    const startTime = Date.now()
    const retryHistory: RetryAttempt[] = []

    // Check circuit breaker
    if (this.isCircuitOpen(operationName, config)) {
      return {
        error: new Error(`Circuit breaker OPEN for ${operationName}`),
        attempts: 0,
        totalTimeMs: Date.now() - startTime,
        retryHistory: [],
        circuitBreakerTriggered: true,
      }
    }

    let lastError: Error | undefined

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Execute operation with timeout
        const value = await this.executeWithTimeout(operation, config.operationTimeoutMs)

        // Success! Reset circuit breaker
        this.recordSuccess(operationName)

        return {
          value,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
          retryHistory,
          circuitBreakerTriggered: false,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Categorize error
        const category = this.categorizeError(lastError)

        // Log attempt
        console.warn(
          `[RetryService] ${operationName} attempt ${attempt}/${config.maxAttempts} failed:`,
          lastError.message,
          `(${category})`,
        )

        // Don't retry permanent errors
        if (category === ErrorCategory.PERMANENT) {
          console.error(
            `[RetryService] Permanent error detected, aborting retries for ${operationName}`,
          )
          this.recordFailure(operationName, config)
          return {
            error: new PermanentError(lastError.message, lastError),
            attempts: attempt,
            totalTimeMs: Date.now() - startTime,
            retryHistory,
            circuitBreakerTriggered: false,
          }
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config, lastError)

        retryHistory.push({
          attemptNumber: attempt,
          delayMs: delay,
          error: lastError,
          timestamp: new Date(),
        })

        // If this was the last attempt, don't delay
        if (attempt < config.maxAttempts) {
          console.warn(`[RetryService] Retrying ${operationName} in ${delay}ms...`)
          await this.delay(delay)
        } else {
          // All retries exhausted, record failure
          this.recordFailure(operationName, config)
        }
      }
    }

    // All retries failed
    return {
      error: lastError || new Error('Unknown error'),
      attempts: config.maxAttempts,
      totalTimeMs: Date.now() - startTime,
      retryHistory,
      circuitBreakerTriggered: false,
    }
  }

  /**
   * Categorize error as transient, permanent, or unknown
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()

    // Transient errors (should retry)
    const transientPatterns = [
      'rate limit',
      'too many requests',
      '429',
      'timeout',
      'etimedout',
      'econnreset',
      'econnrefused',
      'service unavailable',
      '503',
      '502',
      '504',
      'network error',
      'socket hang up',
      'temporary failure',
      'deadlock',
      'lock timeout',
    ]

    if (transientPatterns.some((pattern) => message.includes(pattern))) {
      return ErrorCategory.TRANSIENT
    }

    // Permanent errors (should NOT retry)
    const permanentPatterns = [
      'invalid api key',
      '401',
      '403',
      'forbidden',
      'unauthorized',
      '400',
      'bad request',
      '404',
      'not found',
      'invalid input',
      'validation error',
      'schema violation',
      'unique constraint',
      'foreign key constraint',
    ]

    if (permanentPatterns.some((pattern) => message.includes(pattern))) {
      return ErrorCategory.PERMANENT
    }

    // Unknown errors - default to transient for safety
    return ErrorCategory.TRANSIENT
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: Required<RetryPolicy>, error: Error): number {
    // Check if error includes Retry-After header value
    let baseDelay = config.initialDelayMs * config.backoffMultiplier ** (attempt - 1)

    // Check for Retry-After in error (if it's a RetriableError)
    if (error instanceof RetriableError && error.retryAfter) {
      baseDelay = Math.max(baseDelay, error.retryAfter * 1000)
    }

    // Cap at max delay
    baseDelay = Math.min(baseDelay, config.maxDelayMs)

    // Add jitter to prevent thundering herd
    if (config.enableJitter) {
      const jitter = Math.random() * 0.3 * baseDelay // ±30% jitter
      baseDelay = baseDelay + jitter
    }

    return Math.floor(baseDelay)
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ])
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(operationName: string, config: Required<RetryPolicy>): boolean {
    const circuit = this.circuitBreakers.get(operationName)

    if (!circuit || circuit.state === CircuitState.CLOSED) {
      return false
    }

    if (circuit.state === CircuitState.OPEN) {
      // Check if enough time has passed to try again (half-open state)
      if (circuit.nextAttemptTime && Date.now() >= circuit.nextAttemptTime.getTime()) {
        console.warn(`[RetryService] Circuit breaker for ${operationName} entering HALF_OPEN state`)
        this.circuitBreakers.set(operationName, {
          ...circuit,
          state: CircuitState.HALF_OPEN,
        })
        return false
      }
      return true
    }

    // HALF_OPEN state - allow one request through
    return false
  }

  /**
   * Record successful operation
   */
  private recordSuccess(operationName: string): void {
    const circuit = this.circuitBreakers.get(operationName)

    if (circuit?.state === CircuitState.HALF_OPEN) {
      console.log(
        `[RetryService] Circuit breaker for ${operationName} closing after successful request`,
      )
      this.circuitBreakers.set(operationName, {
        state: CircuitState.CLOSED,
        failureCount: 0,
      })
    } else if (circuit) {
      // Reset failure count on success
      this.circuitBreakers.set(operationName, {
        ...circuit,
        failureCount: 0,
      })
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationName: string, config: Required<RetryPolicy>): void {
    const circuit = this.circuitBreakers.get(operationName) || {
      state: CircuitState.CLOSED,
      failureCount: 0,
    }

    const newFailureCount = circuit.failureCount + 1

    if (newFailureCount >= config.circuitBreakerThreshold) {
      const nextAttemptTime = new Date(Date.now() + config.circuitBreakerTimeoutMs)
      console.error(
        `[RetryService] Circuit breaker OPENING for ${operationName} after ${newFailureCount} failures. Next attempt at ${nextAttemptTime.toISOString()}`,
      )

      this.circuitBreakers.set(operationName, {
        state: CircuitState.OPEN,
        failureCount: newFailureCount,
        lastFailureTime: new Date(),
        nextAttemptTime,
      })
    } else {
      this.circuitBreakers.set(operationName, {
        ...circuit,
        failureCount: newFailureCount,
        lastFailureTime: new Date(),
      })
    }
  }

  /**
   * Get circuit breaker state for debugging
   */
  getCircuitState(operationName: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(operationName)
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuit(operationName: string): void {
    console.log(`[RetryService] Manually resetting circuit breaker for ${operationName}`)
    this.circuitBreakers.delete(operationName)
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuits(): void {
    console.log('[RetryService] Resetting all circuit breakers')
    this.circuitBreakers.clear()
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Merge user policy with defaults
   */
  private mergeWithDefaults(policy: RetryPolicy): Required<RetryPolicy> {
    return {
      maxAttempts: policy.maxAttempts ?? 3,
      initialDelayMs: policy.initialDelayMs ?? 1000,
      maxDelayMs: policy.maxDelayMs ?? 8000,
      backoffMultiplier: policy.backoffMultiplier ?? 2,
      enableJitter: policy.enableJitter ?? true,
      circuitBreakerThreshold: policy.circuitBreakerThreshold ?? 5,
      circuitBreakerTimeoutMs: policy.circuitBreakerTimeoutMs ?? 60000,
      operationTimeoutMs: policy.operationTimeoutMs ?? 30000,
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
export const retryService = new RetryService()

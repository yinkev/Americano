/**
 * Result Type Pattern - Type-safe error handling for Epic 3
 *
 * Replaces silent failures with explicit success/failure states.
 * Provides type-safe error handling using TypeScript discriminated unions.
 *
 * Epic 3 - Knowledge Graph - Error Handling Enhancement
 *
 * @example
 * ```typescript
 * // Before (silent failure):
 * async extractConcepts(): Promise<Concept[]> {
 *   try {
 *     return await fetch()
 *   } catch (error) {
 *     console.error(error)
 *     return [] // Caller doesn't know this failed!
 *   }
 * }
 *
 * // After (explicit Result):
 * async extractConcepts(): Promise<Result<Concept[], ExtractionError>> {
 *   try {
 *     const concepts = await fetch()
 *     return ok(concepts)
 *   } catch (error) {
 *     return err(new ExtractionError('Failed to extract concepts', error, true))
 *   }
 * }
 *
 * // Usage:
 * const result = await service.extractConcepts()
 * if (isOk(result)) {
 *   console.log(`Extracted ${result.value.length} concepts`)
 * } else {
 *   console.error(`Extraction failed: ${result.error.message}`)
 *   if (result.error.retriable) {
 *     // Retry logic
 *   }
 * }
 * ```
 */

// ============================================================================
// Core Result Type - Discriminated Union
// ============================================================================

/**
 * Result type - discriminated union for success or failure
 *
 * Uses TypeScript's discriminated union pattern with 'success' as the discriminant.
 * This enables exhaustive type checking and prevents accessing error on success
 * or value on failure.
 *
 * @template T - Type of the success value
 * @template E - Type of the error (defaults to BaseError)
 */
export type Result<T, E extends BaseError = BaseError> =
  | { success: true; value: T }
  | { success: false; error: E }

// ============================================================================
// Error Classes - Domain-specific error types
// ============================================================================

/**
 * Base error class for all Result errors
 *
 * Extends native Error with:
 * - retriable: Whether the operation can be retried
 * - cause: Original error that triggered this error
 * - context: Additional metadata for debugging
 */
export class BaseError extends Error {
  /** Whether this error is retriable (e.g., network errors) */
  public readonly retriable: boolean

  /** Original error that caused this error */
  public readonly cause?: unknown

  /** Additional context for debugging */
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    options: {
      retriable?: boolean
      cause?: unknown
      context?: Record<string, unknown>
    } = {},
  ) {
    super(message)
    this.name = this.constructor.name
    this.retriable = options.retriable ?? false
    this.cause = options.cause
    this.context = options.context

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      retriable: this.retriable,
      context: this.context,
      stack: this.stack,
      cause: this.cause instanceof Error ? this.cause.message : String(this.cause),
    }
  }
}

/**
 * Embedding generation errors
 *
 * Used by EmbeddingService when:
 * - API rate limits exceeded
 * - Invalid input text
 * - Network failures
 * - API errors from Gemini
 */
export class EmbeddingError extends BaseError {
  /** Error code for programmatic handling */
  public readonly code: EmbeddingErrorCode

  constructor(
    message: string,
    code: EmbeddingErrorCode,
    options: {
      retriable?: boolean
      cause?: unknown
      context?: Record<string, unknown>
    } = {},
  ) {
    super(message, options)
    this.code = code
  }
}

export enum EmbeddingErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  EMPTY_EMBEDDING = 'EMPTY_EMBEDDING',
  DIMENSION_MISMATCH = 'DIMENSION_MISMATCH',
}

/**
 * Concept extraction errors
 *
 * Used by KnowledgeGraphBuilder when:
 * - ChatMock API fails
 * - Invalid JSON response
 * - No concepts extracted
 * - Database storage fails
 */
export class ExtractionError extends BaseError {
  /** Error code for programmatic handling */
  public readonly code: ExtractionErrorCode

  /** Number of concepts successfully extracted before failure */
  public readonly partialCount?: number

  constructor(
    message: string,
    code: ExtractionErrorCode,
    options: {
      retriable?: boolean
      cause?: unknown
      context?: Record<string, unknown>
      partialCount?: number
    } = {},
  ) {
    super(message, options)
    this.code = code
    this.partialCount = options.partialCount
  }
}

export enum ExtractionErrorCode {
  CHATMOCK_API_ERROR = 'CHATMOCK_API_ERROR',
  INVALID_JSON_RESPONSE = 'INVALID_JSON_RESPONSE',
  NO_CONCEPTS_EXTRACTED = 'NO_CONCEPTS_EXTRACTED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Semantic search errors
 *
 * Used by SemanticSearchService when:
 * - Vector search fails
 * - Database query errors
 * - Invalid query parameters
 * - No results found (may not be error depending on context)
 */
export class SearchError extends BaseError {
  /** Error code for programmatic handling */
  public readonly code: SearchErrorCode

  /** Original query that caused the error */
  public readonly query?: string

  constructor(
    message: string,
    code: SearchErrorCode,
    options: {
      retriable?: boolean
      cause?: unknown
      context?: Record<string, unknown>
      query?: string
    } = {},
  ) {
    super(message, options)
    this.code = code
    this.query = options.query
  }
}

export enum SearchErrorCode {
  VECTOR_SEARCH_FAILED = 'VECTOR_SEARCH_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_QUERY = 'INVALID_QUERY',
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  NO_RESULTS = 'NO_RESULTS',
}

/**
 * Knowledge graph relationship errors
 *
 * Used when relationship detection/storage fails
 */
export class RelationshipError extends BaseError {
  /** Error code for programmatic handling */
  public readonly code: RelationshipErrorCode

  constructor(
    message: string,
    code: RelationshipErrorCode,
    options: {
      retriable?: boolean
      cause?: unknown
      context?: Record<string, unknown>
    } = {},
  ) {
    super(message, options)
    this.code = code
  }
}

export enum RelationshipErrorCode {
  INVALID_CONCEPTS = 'INVALID_CONCEPTS',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SIMILARITY_CALCULATION_FAILED = 'SIMILARITY_CALCULATION_FAILED',
}

// ============================================================================
// Helper Functions - Create Result values
// ============================================================================

/**
 * Create a successful Result
 *
 * @param value - The success value
 * @returns Success Result
 *
 * @example
 * ```typescript
 * const concepts = await fetchConcepts()
 * return ok(concepts)
 * ```
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value }
}

/**
 * Create a failed Result
 *
 * @param error - The error
 * @returns Failure Result
 *
 * @example
 * ```typescript
 * return err(new EmbeddingError(
 *   'Rate limit exceeded',
 *   EmbeddingErrorCode.RATE_LIMIT_EXCEEDED,
 *   { retriable: true }
 * ))
 * ```
 */
export function err<E extends BaseError>(error: E): Result<never, E> {
  return { success: false, error }
}

// ============================================================================
// Type Guards - Narrow Result types
// ============================================================================

/**
 * Type guard to check if Result is successful
 *
 * @param result - Result to check
 * @returns True if result is Ok
 *
 * @example
 * ```typescript
 * const result = await service.search(query)
 * if (isOk(result)) {
 *   // TypeScript knows result.value is available
 *   console.log(result.value)
 * }
 * ```
 */
export function isOk<T, E extends BaseError>(
  result: Result<T, E>,
): result is { success: true; value: T } {
  return result.success === true
}

/**
 * Type guard to check if Result is an error
 *
 * @param result - Result to check
 * @returns True if result is Err
 *
 * @example
 * ```typescript
 * const result = await service.extractConcepts()
 * if (isErr(result)) {
 *   // TypeScript knows result.error is available
 *   console.error(result.error.message)
 * }
 * ```
 */
export function isErr<T, E extends BaseError>(
  result: Result<T, E>,
): result is { success: false; error: E } {
  return result.success === false
}

// ============================================================================
// Unwrap Functions - Extract values with safety checks
// ============================================================================

/**
 * Unwrap a Result value, throwing if it's an error
 *
 * USE WITH CAUTION: Only use when you're certain the Result is Ok
 * Prefer pattern matching with isOk/isErr instead
 *
 * @param result - Result to unwrap
 * @returns The success value
 * @throws The error if Result is Err
 *
 * @example
 * ```typescript
 * // Only use when error is truly exceptional
 * const concepts = unwrap(await service.extractConcepts())
 * ```
 */
export function unwrap<T, E extends BaseError>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value
  }
  throw result.error
}

/**
 * Unwrap a Result value, returning a default if it's an error
 *
 * Safe alternative to unwrap() - never throws
 *
 * @param result - Result to unwrap
 * @param defaultValue - Value to return if Result is Err
 * @returns The success value or default value
 *
 * @example
 * ```typescript
 * const concepts = unwrapOr(await service.extractConcepts(), [])
 * // Always returns an array, never throws
 * ```
 */
export function unwrapOr<T, E extends BaseError>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value
  }
  return defaultValue
}

/**
 * Unwrap a Result value, computing a default if it's an error
 *
 * Lazy version of unwrapOr - only computes default when needed
 *
 * @param result - Result to unwrap
 * @param fn - Function to compute default value
 * @returns The success value or computed default value
 *
 * @example
 * ```typescript
 * const concepts = unwrapOrElse(
 *   await service.extractConcepts(),
 *   (error) => {
 *     console.error('Extraction failed:', error)
 *     return []
 *   }
 * )
 * ```
 */
export function unwrapOrElse<T, E extends BaseError>(result: Result<T, E>, fn: (error: E) => T): T {
  if (isOk(result)) {
    return result.value
  }
  return fn(result.error)
}

/**
 * Get the error from a Result, returning undefined if it's Ok
 *
 * Useful for logging errors while still handling success case
 *
 * @param result - Result to extract error from
 * @returns The error or undefined
 *
 * @example
 * ```typescript
 * const result = await service.search(query)
 * const error = getError(result)
 * if (error) {
 *   logger.error('Search failed', error.toJSON())
 * }
 * ```
 */
export function getError<T, E extends BaseError>(result: Result<T, E>): E | undefined {
  if (isErr(result)) {
    return result.error
  }
  return undefined
}

// ============================================================================
// Mapping Functions - Transform Result values
// ============================================================================

/**
 * Map over a successful Result value
 *
 * Transforms the success value while preserving error state
 *
 * @param result - Result to map
 * @param fn - Transform function
 * @returns New Result with transformed value
 *
 * @example
 * ```typescript
 * const result = await service.extractConcepts(chunk)
 * const conceptNames = map(result, concepts => concepts.map(c => c.name))
 * // Result<string[], ExtractionError>
 * ```
 */
export function map<T, U, E extends BaseError>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value))
  }
  return result
}

/**
 * Map over a failed Result error
 *
 * Transforms the error while preserving success state
 *
 * @param result - Result to map
 * @param fn - Transform function
 * @returns New Result with transformed error
 *
 * @example
 * ```typescript
 * const result = await service.search(query)
 * const enhancedResult = mapErr(result, error =>
 *   new SearchError(`Enhanced: ${error.message}`, error.code, { cause: error })
 * )
 * ```
 */
export function mapErr<T, E extends BaseError, F extends BaseError>(
  result: Result<T, E>,
  fn: (error: E) => F,
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error))
  }
  return result
}

/**
 * Chain async operations that return Results
 *
 * Also known as "flatMap" or "bind" in functional programming
 * Short-circuits on first error
 *
 * @param result - Result to chain from
 * @param fn - Async function that returns another Result
 * @returns New Result from chained operation
 *
 * @example
 * ```typescript
 * const result = await andThen(
 *   await service.extractConcepts(chunk),
 *   async (concepts) => await service.storeConcepts(concepts)
 * )
 * // Automatically handles error propagation
 * ```
 */
export async function andThen<T, U, E extends BaseError>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>,
): Promise<Result<U, E>> {
  if (isOk(result)) {
    return await fn(result.value)
  }
  return result
}

// ============================================================================
// Batch Operations - Handle multiple Results
// ============================================================================

/**
 * Combine multiple Results into a single Result
 *
 * Returns Ok with array of values if all are Ok
 * Returns first Err if any Result is Err
 *
 * @param results - Array of Results to combine
 * @returns Combined Result
 *
 * @example
 * ```typescript
 * const results = await Promise.all([
 *   service.extractConcepts(chunk1),
 *   service.extractConcepts(chunk2),
 *   service.extractConcepts(chunk3),
 * ])
 *
 * const combined = combine(results)
 * if (isOk(combined)) {
 *   // All extractions succeeded
 *   const allConcepts = combined.value.flat()
 * }
 * ```
 */
export function combine<T, E extends BaseError>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = []

  for (const result of results) {
    if (isErr(result)) {
      return result
    }
    values.push(result.value)
  }

  return ok(values)
}

/**
 * Partition Results into successes and failures
 *
 * Useful when you want to handle partial failures
 *
 * @param results - Array of Results to partition
 * @returns Object with successful values and errors
 *
 * @example
 * ```typescript
 * const results = await Promise.all(
 *   chunks.map(chunk => service.extractConcepts(chunk))
 * )
 *
 * const { successes, failures } = partition(results)
 * console.log(`Extracted ${successes.length} chunks, ${failures.length} failed`)
 *
 * // Process partial results
 * await processSuccessfulConcepts(successes)
 *
 * // Log failures
 * failures.forEach(error => logger.error(error.toJSON()))
 * ```
 */
export function partition<T, E extends BaseError>(
  results: Result<T, E>[],
): { successes: T[]; failures: E[] } {
  const successes: T[] = []
  const failures: E[] = []

  for (const result of results) {
    if (isOk(result)) {
      successes.push(result.value)
    } else {
      failures.push(result.error)
    }
  }

  return { successes, failures }
}

// ============================================================================
// Promise Conversion - Bridge to existing Promise-based code
// ============================================================================

/**
 * Convert a Promise into a Result
 *
 * Catches all Promise rejections and wraps them in Err
 * Useful for integrating with existing Promise-based APIs
 *
 * @param promise - Promise to convert
 * @param errorFactory - Function to create error from caught exception
 * @returns Result from Promise resolution or rejection
 *
 * @example
 * ```typescript
 * // Convert existing Promise-based API
 * const result = await fromPromise(
 *   fetch('/api/data'),
 *   (error) => new SearchError(
 *     'API fetch failed',
 *     SearchErrorCode.NETWORK_ERROR,
 *     { retriable: true, cause: error }
 *   )
 * )
 * ```
 */
export async function fromPromise<T, E extends BaseError>(
  promise: Promise<T>,
  errorFactory: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await promise
    return ok(value)
  } catch (error) {
    return err(errorFactory(error))
  }
}

/**
 * Convert a Result into a Promise
 *
 * Rejects with error if Result is Err
 * Resolves with value if Result is Ok
 *
 * @param result - Result to convert
 * @returns Promise that resolves or rejects based on Result
 *
 * @example
 * ```typescript
 * // Use with existing Promise-based code
 * const result = await service.extractConcepts(chunk)
 * const concepts = await toPromise(result)
 * // Throws if extraction failed
 * ```
 */
export function toPromise<T, E extends BaseError>(result: Result<T, E>): Promise<T> {
  if (isOk(result)) {
    return Promise.resolve(result.value)
  }
  return Promise.reject(result.error)
}

// ============================================================================
// Retry Utilities - Handle retriable errors
// ============================================================================

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number
  /** Delay in milliseconds between retries */
  delayMs: number
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number
  /** Maximum delay in milliseconds */
  maxDelayMs?: number
  /** Function to determine if error is retriable */
  shouldRetry?: (error: BaseError) => boolean
}

/**
 * Retry an operation that returns a Result
 *
 * Automatically retries on retriable errors with exponential backoff
 *
 * @param operation - Async operation that returns Result
 * @param config - Retry configuration
 * @returns Final Result after retries
 *
 * @example
 * ```typescript
 * const result = await retry(
 *   async () => await service.generateEmbedding(text),
 *   {
 *     maxAttempts: 3,
 *     delayMs: 1000,
 *     backoffMultiplier: 2,
 *     shouldRetry: (error) => error.retriable && error.code !== EmbeddingErrorCode.INVALID_INPUT
 *   }
 * )
 * ```
 */
export async function retry<T, E extends BaseError>(
  operation: () => Promise<Result<T, E>>,
  config: RetryConfig,
): Promise<Result<T, E>> {
  const {
    maxAttempts,
    delayMs,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = (error) => error.retriable,
  } = config

  let currentDelay = delayMs
  let lastError: E | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await operation()

    if (isOk(result)) {
      return result
    }

    lastError = result.error

    // Check if we should retry
    if (attempt < maxAttempts && shouldRetry(result.error)) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay))

      // Apply exponential backoff
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelayMs)
    } else {
      // No more retries or error is not retriable
      return result
    }
  }

  // This should never happen, but TypeScript needs it
  return err(lastError!)
}

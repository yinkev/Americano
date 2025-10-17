/**
 * Epic 3 - Error Type System
 *
 * Comprehensive error handling for Knowledge Graph services including:
 * - Embedding generation (Gemini API)
 * - Content extraction (ChatMock/GPT)
 * - Semantic search execution
 * - Knowledge graph construction
 *
 * Features:
 * - Discriminated union types for type-safe error handling
 * - Retriable vs permanent error classification
 * - HTTP status codes for API responses
 * - Rich metadata for debugging and monitoring
 * - Error serialization for logging
 *
 * @module Epic3Errors
 */

/* ============================================================================
 * ERROR CODE ENUMS
 * ========================================================================== */

/**
 * Error codes for all Epic 3 services
 * Categorized by service domain
 */
export enum ErrorCode {
  // Embedding Errors (1xx)
  EMBEDDING_RATE_LIMIT = 'EMBEDDING_RATE_LIMIT',
  EMBEDDING_QUOTA_EXCEEDED = 'EMBEDDING_QUOTA_EXCEEDED',
  EMBEDDING_INVALID_INPUT = 'EMBEDDING_INVALID_INPUT',
  EMBEDDING_NETWORK_ERROR = 'EMBEDDING_NETWORK_ERROR',
  EMBEDDING_API_ERROR = 'EMBEDDING_API_ERROR',
  EMBEDDING_TIMEOUT = 'EMBEDDING_TIMEOUT',

  // Extraction Errors (2xx)
  EXTRACTION_MODEL_OVERLOAD = 'EXTRACTION_MODEL_OVERLOAD',
  EXTRACTION_INVALID_RESPONSE = 'EXTRACTION_INVALID_RESPONSE',
  EXTRACTION_JSON_PARSE_ERROR = 'EXTRACTION_JSON_PARSE_ERROR',
  EXTRACTION_TIMEOUT = 'EXTRACTION_TIMEOUT',
  EXTRACTION_API_ERROR = 'EXTRACTION_API_ERROR',
  EXTRACTION_SCHEMA_VALIDATION = 'EXTRACTION_SCHEMA_VALIDATION',

  // Search Errors (3xx)
  SEARCH_DATABASE_ERROR = 'SEARCH_DATABASE_ERROR',
  SEARCH_QUERY_TIMEOUT = 'SEARCH_QUERY_TIMEOUT',
  SEARCH_EMBEDDING_FAILED = 'SEARCH_EMBEDDING_FAILED',
  SEARCH_INVALID_QUERY = 'SEARCH_INVALID_QUERY',
  SEARCH_NO_RESULTS = 'SEARCH_NO_RESULTS',

  // Graph Build Errors (4xx)
  GRAPH_CONCEPT_EXTRACTION_FAILED = 'GRAPH_CONCEPT_EXTRACTION_FAILED',
  GRAPH_RELATIONSHIP_DETECTION_FAILED = 'GRAPH_RELATIONSHIP_DETECTION_FAILED',
  GRAPH_STORAGE_ERROR = 'GRAPH_STORAGE_ERROR',
  GRAPH_INVALID_INPUT = 'GRAPH_INVALID_INPUT',
  GRAPH_CYCLE_DETECTED = 'GRAPH_CYCLE_DETECTED',

  // Generic Errors (9xx)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/* ============================================================================
 * BASE ERROR CLASS
 * ========================================================================== */

/**
 * Base error class for all Epic 3 errors
 * Provides common properties and serialization
 */
export abstract class Epic3Error extends Error {
  /** Error code for categorization */
  abstract readonly code: ErrorCode

  /** Whether this error can be retried */
  abstract readonly retriable: boolean

  /** HTTP status code for API responses */
  abstract readonly httpStatus: number

  /** Additional metadata for debugging */
  readonly metadata: Record<string, any>

  /** Timestamp when error occurred */
  readonly timestamp: Date

  constructor(message: string, metadata: Record<string, any> = {}) {
    super(message)
    this.name = this.constructor.name
    this.metadata = metadata
    this.timestamp = new Date()

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Serialize error for logging and API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retriable: this.retriable,
      httpStatus: this.httpStatus,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    }
  }

  /**
   * Format error for API response
   * Excludes stack trace and sensitive metadata
   */
  toAPIResponse(): {
    success: false
    error: {
      code: string
      message: string
      retriable: boolean
      metadata?: Record<string, any>
    }
  } {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        retriable: this.retriable,
        ...(Object.keys(this.metadata).length > 0 && {
          metadata: this.sanitizeMetadata(this.metadata),
        }),
      },
    }
  }

  /**
   * Remove sensitive information from metadata
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized = { ...metadata }
    const sensitiveKeys = ['apikey', 'token', 'password', 'secret', 'authorization']

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      }
    }

    return sanitized
  }
}

/* ============================================================================
 * EMBEDDING ERRORS (Gemini API)
 * ========================================================================== */

/**
 * Rate limit exceeded error
 * Retriable: Yes (after delay)
 *
 * Thrown when Gemini API rate limit is hit (100 RPM or 1000 RPD)
 */
export class EmbeddingRateLimitError extends Epic3Error {
  readonly code = ErrorCode.EMBEDDING_RATE_LIMIT
  readonly retriable = true
  readonly httpStatus = 429

  constructor(
    public readonly retryAfterSeconds: number,
    public readonly limitType: 'minute' | 'day',
    metadata: Record<string, any> = {}
  ) {
    super(
      `Embedding API rate limit exceeded. Retry after ${retryAfterSeconds}s (${limitType} limit)`,
      {
        retryAfterSeconds,
        limitType,
        ...metadata,
      }
    )
  }
}

/**
 * Quota exceeded error
 * Retriable: Yes (after longer delay)
 *
 * Thrown when daily quota is exceeded
 */
export class EmbeddingQuotaExceededError extends Epic3Error {
  readonly code = ErrorCode.EMBEDDING_QUOTA_EXCEEDED
  readonly retriable = true
  readonly httpStatus = 429

  constructor(
    public readonly quotaResetTime: Date,
    metadata: Record<string, any> = {}
  ) {
    super(`Embedding API quota exceeded. Resets at ${quotaResetTime.toISOString()}`, {
      quotaResetTime: quotaResetTime.toISOString(),
      ...metadata,
    })
  }
}

/**
 * Invalid input error
 * Retriable: No (permanent)
 *
 * Thrown when input text is invalid (empty, too long, unsupported format)
 */
export class EmbeddingInvalidInputError extends Epic3Error {
  readonly code = ErrorCode.EMBEDDING_INVALID_INPUT
  readonly retriable = false
  readonly httpStatus = 400

  constructor(
    public readonly reason: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Invalid embedding input: ${reason}`, { reason, ...metadata })
  }
}

/**
 * Network error
 * Retriable: Yes
 *
 * Thrown when network request to Gemini API fails
 */
export class EmbeddingNetworkError extends Epic3Error {
  readonly code = ErrorCode.EMBEDDING_NETWORK_ERROR
  readonly retriable = true
  readonly httpStatus = 503

  constructor(
    public readonly originalError: Error,
    metadata: Record<string, any> = {}
  ) {
    super(`Network error during embedding generation: ${originalError.message}`, {
      originalError: originalError.message,
      ...metadata,
    })
  }
}

/**
 * API error
 * Retriable: Depends on status code
 *
 * Thrown when Gemini API returns an error response
 */
export class EmbeddingAPIError extends Epic3Error {
  readonly code = ErrorCode.EMBEDDING_API_ERROR
  readonly retriable: boolean
  readonly httpStatus: number

  constructor(
    public readonly apiStatusCode: number,
    public readonly apiMessage: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Embedding API error (${apiStatusCode}): ${apiMessage}`, {
      apiStatusCode,
      apiMessage,
      ...metadata,
    })

    // 5xx errors are retriable, 4xx are not (except 429)
    this.retriable = apiStatusCode >= 500 || apiStatusCode === 429
    this.httpStatus = apiStatusCode
  }
}

/**
 * Timeout error
 * Retriable: Yes
 *
 * Thrown when embedding generation exceeds timeout
 */
export class EmbeddingTimeoutError extends Epic3Error {
  readonly code = ErrorCode.EMBEDDING_TIMEOUT
  readonly retriable = true
  readonly httpStatus = 504

  constructor(
    public readonly timeoutMs: number,
    metadata: Record<string, any> = {}
  ) {
    super(`Embedding generation timed out after ${timeoutMs}ms`, {
      timeoutMs,
      ...metadata,
    })
  }
}

/* ============================================================================
 * EXTRACTION ERRORS (ChatMock/GPT)
 * ========================================================================== */

/**
 * Model overload error
 * Retriable: Yes (with backoff)
 *
 * Thrown when ChatMock/GPT model is overloaded
 */
export class ExtractionModelOverloadError extends Epic3Error {
  readonly code = ErrorCode.EXTRACTION_MODEL_OVERLOAD
  readonly retriable = true
  readonly httpStatus = 503

  constructor(
    public readonly retryAfterSeconds?: number,
    metadata: Record<string, any> = {}
  ) {
    super(
      `Extraction model is overloaded${retryAfterSeconds ? `. Retry after ${retryAfterSeconds}s` : ''}`,
      { retryAfterSeconds, ...metadata }
    )
  }
}

/**
 * Invalid response error
 * Retriable: No (permanent)
 *
 * Thrown when model response doesn't match expected format
 */
export class ExtractionInvalidResponseError extends Epic3Error {
  readonly code = ErrorCode.EXTRACTION_INVALID_RESPONSE
  readonly retriable = false
  readonly httpStatus = 500

  constructor(
    public readonly reason: string,
    public readonly response?: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Invalid extraction response: ${reason}`, {
      reason,
      response: response?.substring(0, 200), // Truncate for logging
      ...metadata,
    })
  }
}

/**
 * JSON parse error
 * Retriable: No (permanent)
 *
 * Thrown when model response cannot be parsed as JSON
 */
export class ExtractionJSONParseError extends Epic3Error {
  readonly code = ErrorCode.EXTRACTION_JSON_PARSE_ERROR
  readonly retriable = false
  readonly httpStatus = 500

  constructor(
    public readonly parseError: Error,
    public readonly rawResponse?: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Failed to parse extraction response as JSON: ${parseError.message}`, {
      parseError: parseError.message,
      rawResponse: rawResponse?.substring(0, 200),
      ...metadata,
    })
  }
}

/**
 * Timeout error
 * Retriable: Yes
 *
 * Thrown when extraction exceeds timeout
 */
export class ExtractionTimeoutError extends Epic3Error {
  readonly code = ErrorCode.EXTRACTION_TIMEOUT
  readonly retriable = true
  readonly httpStatus = 504

  constructor(
    public readonly timeoutMs: number,
    metadata: Record<string, any> = {}
  ) {
    super(`Extraction timed out after ${timeoutMs}ms`, { timeoutMs, ...metadata })
  }
}

/**
 * Schema validation error
 * Retriable: No (permanent)
 *
 * Thrown when extracted data fails schema validation
 */
export class ExtractionSchemaValidationError extends Epic3Error {
  readonly code = ErrorCode.EXTRACTION_SCHEMA_VALIDATION
  readonly retriable = false
  readonly httpStatus = 500

  constructor(
    public readonly validationErrors: string[],
    metadata: Record<string, any> = {}
  ) {
    super(`Extraction schema validation failed: ${validationErrors.join(', ')}`, {
      validationErrors,
      ...metadata,
    })
  }
}

/* ============================================================================
 * SEARCH ERRORS
 * ========================================================================== */

/**
 * Database error
 * Retriable: Yes
 *
 * Thrown when database query fails during search
 */
export class SearchDatabaseError extends Epic3Error {
  readonly code = ErrorCode.SEARCH_DATABASE_ERROR
  readonly retriable = true
  readonly httpStatus = 500

  constructor(
    public readonly dbError: Error,
    metadata: Record<string, any> = {}
  ) {
    super(`Search database error: ${dbError.message}`, {
      dbError: dbError.message,
      ...metadata,
    })
  }
}

/**
 * Query timeout error
 * Retriable: No (query too complex)
 *
 * Thrown when search query exceeds timeout (indicates query needs optimization)
 */
export class SearchQueryTimeoutError extends Epic3Error {
  readonly code = ErrorCode.SEARCH_QUERY_TIMEOUT
  readonly retriable = false
  readonly httpStatus = 504

  constructor(
    public readonly timeoutMs: number,
    public readonly query: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Search query timed out after ${timeoutMs}ms`, {
      timeoutMs,
      query: query.substring(0, 100), // Truncate for logging
      ...metadata,
    })
  }
}

/**
 * Embedding failed error
 * Retriable: Yes (fallback to keyword search available)
 *
 * Thrown when embedding generation fails during search
 */
export class SearchEmbeddingFailedError extends Epic3Error {
  readonly code = ErrorCode.SEARCH_EMBEDDING_FAILED
  readonly retriable = true
  readonly httpStatus = 500

  constructor(
    public readonly embeddingError: Epic3Error,
    public readonly fallbackAvailable: boolean,
    metadata: Record<string, any> = {}
  ) {
    super(
      `Search embedding failed: ${embeddingError.message}${fallbackAvailable ? ' (fallback available)' : ''}`,
      {
        embeddingError: embeddingError.toJSON(),
        fallbackAvailable,
        ...metadata,
      }
    )
  }
}

/**
 * Invalid query error
 * Retriable: No (permanent)
 *
 * Thrown when search query is invalid
 */
export class SearchInvalidQueryError extends Epic3Error {
  readonly code = ErrorCode.SEARCH_INVALID_QUERY
  readonly retriable = false
  readonly httpStatus = 400

  constructor(
    public readonly reason: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Invalid search query: ${reason}`, { reason, ...metadata })
  }
}

/**
 * No results error
 * Retriable: No (not an error, but trackable)
 *
 * Thrown when search returns no results (useful for analytics)
 */
export class SearchNoResultsError extends Epic3Error {
  readonly code = ErrorCode.SEARCH_NO_RESULTS
  readonly retriable = false
  readonly httpStatus = 404

  constructor(
    public readonly query: string,
    metadata: Record<string, any> = {}
  ) {
    super(`No search results found for query`, {
      query: query.substring(0, 100),
      ...metadata,
    })
  }
}

/* ============================================================================
 * GRAPH BUILD ERRORS
 * ========================================================================== */

/**
 * Concept extraction failed error
 * Retriable: Yes (partial failure OK)
 *
 * Thrown when concept extraction fails for some content
 */
export class GraphConceptExtractionFailedError extends Epic3Error {
  readonly code = ErrorCode.GRAPH_CONCEPT_EXTRACTION_FAILED
  readonly retriable = true
  readonly httpStatus = 500

  constructor(
    public readonly failedChunks: number,
    public readonly totalChunks: number,
    public readonly errors: Error[],
    metadata: Record<string, any> = {}
  ) {
    super(
      `Concept extraction failed for ${failedChunks}/${totalChunks} chunks`,
      {
        failedChunks,
        totalChunks,
        successRate: ((totalChunks - failedChunks) / totalChunks) * 100,
        errors: errors.map((e) => e.message),
        ...metadata,
      }
    )
  }
}

/**
 * Relationship detection failed error
 * Retriable: Yes (partial failure OK)
 *
 * Thrown when relationship detection fails for some concepts
 */
export class GraphRelationshipDetectionFailedError extends Epic3Error {
  readonly code = ErrorCode.GRAPH_RELATIONSHIP_DETECTION_FAILED
  readonly retriable = true
  readonly httpStatus = 500

  constructor(
    public readonly failedPairs: number,
    public readonly totalPairs: number,
    public readonly errors: Error[],
    metadata: Record<string, any> = {}
  ) {
    super(
      `Relationship detection failed for ${failedPairs}/${totalPairs} concept pairs`,
      {
        failedPairs,
        totalPairs,
        successRate: ((totalPairs - failedPairs) / totalPairs) * 100,
        errors: errors.map((e) => e.message),
        ...metadata,
      }
    )
  }
}

/**
 * Storage error
 * Retriable: Yes
 *
 * Thrown when graph data storage fails
 */
export class GraphStorageError extends Epic3Error {
  readonly code = ErrorCode.GRAPH_STORAGE_ERROR
  readonly retriable = true
  readonly httpStatus = 500

  constructor(
    public readonly storageError: Error,
    metadata: Record<string, any> = {}
  ) {
    super(`Graph storage error: ${storageError.message}`, {
      storageError: storageError.message,
      ...metadata,
    })
  }
}

/**
 * Invalid input error
 * Retriable: No (permanent)
 *
 * Thrown when graph input is invalid
 */
export class GraphInvalidInputError extends Epic3Error {
  readonly code = ErrorCode.GRAPH_INVALID_INPUT
  readonly retriable = false
  readonly httpStatus = 400

  constructor(
    public readonly reason: string,
    metadata: Record<string, any> = {}
  ) {
    super(`Invalid graph input: ${reason}`, { reason, ...metadata })
  }
}

/**
 * Cycle detected error
 * Retriable: No (indicates data issue)
 *
 * Thrown when circular dependency is detected in graph
 */
export class GraphCycleDetectedError extends Epic3Error {
  readonly code = ErrorCode.GRAPH_CYCLE_DETECTED
  readonly retriable = false
  readonly httpStatus = 400

  constructor(
    public readonly cycle: string[],
    metadata: Record<string, any> = {}
  ) {
    super(`Cycle detected in knowledge graph: ${cycle.join(' -> ')}`, {
      cycle,
      ...metadata,
    })
  }
}

/* ============================================================================
 * TYPE GUARDS & DISCRIMINATED UNIONS
 * ========================================================================== */

/**
 * Union type of all embedding errors
 */
export type EmbeddingError =
  | EmbeddingRateLimitError
  | EmbeddingQuotaExceededError
  | EmbeddingInvalidInputError
  | EmbeddingNetworkError
  | EmbeddingAPIError
  | EmbeddingTimeoutError

/**
 * Union type of all extraction errors
 */
export type ExtractionError =
  | ExtractionModelOverloadError
  | ExtractionInvalidResponseError
  | ExtractionJSONParseError
  | ExtractionTimeoutError
  | ExtractionSchemaValidationError

/**
 * Union type of all search errors
 */
export type SearchError =
  | SearchDatabaseError
  | SearchQueryTimeoutError
  | SearchEmbeddingFailedError
  | SearchInvalidQueryError
  | SearchNoResultsError

/**
 * Union type of all graph build errors
 */
export type GraphBuildError =
  | GraphConceptExtractionFailedError
  | GraphRelationshipDetectionFailedError
  | GraphStorageError
  | GraphInvalidInputError
  | GraphCycleDetectedError

/**
 * Union type of all Epic 3 errors
 */
export type AllEpic3Errors =
  | EmbeddingError
  | ExtractionError
  | SearchError
  | GraphBuildError

/* ============================================================================
 * HELPER FUNCTIONS
 * ========================================================================== */

/**
 * Check if error is retriable
 *
 * @example
 * ```typescript
 * if (isRetriableError(error)) {
 *   await retryOperation()
 * }
 * ```
 */
export function isRetriableError(error: unknown): boolean {
  if (error instanceof Epic3Error) {
    return error.retriable
  }
  return false
}

/**
 * Get error category from error instance
 *
 * @example
 * ```typescript
 * const category = getErrorCategory(error)
 * // 'embedding' | 'extraction' | 'search' | 'graph' | 'unknown'
 * ```
 */
export function getErrorCategory(
  error: unknown
): 'embedding' | 'extraction' | 'search' | 'graph' | 'unknown' {
  if (!(error instanceof Epic3Error)) {
    return 'unknown'
  }

  const code = error.code
  if (code.startsWith('EMBEDDING_')) return 'embedding'
  if (code.startsWith('EXTRACTION_')) return 'extraction'
  if (code.startsWith('SEARCH_')) return 'search'
  if (code.startsWith('GRAPH_')) return 'graph'

  return 'unknown'
}

/**
 * Type guard: Check if error is an embedding error
 */
export function isEmbeddingError(error: unknown): error is EmbeddingError {
  return getErrorCategory(error) === 'embedding'
}

/**
 * Type guard: Check if error is an extraction error
 */
export function isExtractionError(error: unknown): error is ExtractionError {
  return getErrorCategory(error) === 'extraction'
}

/**
 * Type guard: Check if error is a search error
 */
export function isSearchError(error: unknown): error is SearchError {
  return getErrorCategory(error) === 'search'
}

/**
 * Type guard: Check if error is a graph build error
 */
export function isGraphBuildError(error: unknown): error is GraphBuildError {
  return getErrorCategory(error) === 'graph'
}

/**
 * Type guard: Check if error is any Epic 3 error
 */
export function isEpic3Error(error: unknown): error is AllEpic3Errors {
  return error instanceof Epic3Error
}

/* ============================================================================
 * DATABASE VALIDATION ERRORS
 * ========================================================================== */

/**
 * Database validation error
 * Retriable: No (data integrity issue)
 *
 * Thrown when database query result fails schema validation
 * This indicates a mismatch between expected and actual data shape
 */
export class DatabaseValidationError extends Epic3Error {
  readonly code = ErrorCode.VALIDATION_ERROR
  readonly retriable = false
  readonly httpStatus = 500

  constructor(
    public readonly validationErrors: string[],
    public readonly context: {
      query: string
      operation: string
    },
    metadata: Record<string, any> = {}
  ) {
    super(
      `Database validation failed for ${context.operation}: ${validationErrors.join(', ')}`,
      {
        validationErrors,
        query: context.query.substring(0, 200), // Truncate for logging
        operation: context.operation,
        ...metadata,
      }
    )
  }
}

/**
 * Calculate retry delay for exponential backoff
 *
 * @param attemptNumber - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param maxDelayMs - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 *
 * @example
 * ```typescript
 * const delay = calculateRetryDelay(2) // Returns ~4000ms
 * await new Promise(resolve => setTimeout(resolve, delay))
 * ```
 */
export function calculateRetryDelay(
  attemptNumber: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): number {
  // Exponential backoff: base * 2^attempt + jitter
  const exponentialDelay = Math.min(baseDelayMs * Math.pow(2, attemptNumber), maxDelayMs)

  // Add jitter (±25%)
  const jitter = exponentialDelay * (Math.random() * 0.5 - 0.25)

  return Math.floor(exponentialDelay + jitter)
}

/**
 * Serialize error for logging
 * Handles both Epic3Error and generic Error instances
 *
 * @example
 * ```typescript
 * console.error('Operation failed:', serializeErrorForLogging(error))
 * ```
 */
export function serializeErrorForLogging(error: unknown): Record<string, any> {
  if (error instanceof Epic3Error) {
    return error.toJSON()
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error as any), // Include any additional properties
    }
  }

  return {
    error: String(error),
    type: typeof error,
  }
}

/**
 * Wrap unknown error as Epic3Error
 * Useful for catching and re-throwing with Epic3 error types
 *
 * @example
 * ```typescript
 * try {
 *   await operation()
 * } catch (error) {
 *   throw wrapUnknownError(error, 'embedding')
 * }
 * ```
 */
export function wrapUnknownError(
  error: unknown,
  category: 'embedding' | 'extraction' | 'search' | 'graph'
): Epic3Error {
  // Already an Epic3Error, return as-is
  if (error instanceof Epic3Error) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)
  const metadata = error instanceof Error ? { originalError: error.name } : { error }

  // Wrap based on category
  switch (category) {
    case 'embedding':
      return new EmbeddingAPIError(500, message, metadata)
    case 'extraction':
      return new ExtractionInvalidResponseError(message, undefined, metadata)
    case 'search':
      return new SearchDatabaseError(
        error instanceof Error ? error : new Error(message),
        metadata
      )
    case 'graph':
      return new GraphStorageError(
        error instanceof Error ? error : new Error(message),
        metadata
      )
  }
}

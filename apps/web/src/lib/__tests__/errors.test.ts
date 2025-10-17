/**
 * Epic 3 - Error Type System Tests
 *
 * Test coverage for:
 * - Error instantiation
 * - Type guards
 * - Helper functions
 * - Serialization
 * - Retry logic
 */

import { describe, it, expect } from '@jest/globals'
import {
  // Error classes
  EmbeddingRateLimitError,
  EmbeddingQuotaExceededError,
  EmbeddingInvalidInputError,
  EmbeddingNetworkError,
  EmbeddingAPIError,
  EmbeddingTimeoutError,
  ExtractionModelOverloadError,
  ExtractionInvalidResponseError,
  ExtractionJSONParseError,
  ExtractionTimeoutError,
  ExtractionSchemaValidationError,
  SearchDatabaseError,
  SearchQueryTimeoutError,
  SearchEmbeddingFailedError,
  SearchInvalidQueryError,
  SearchNoResultsError,
  GraphConceptExtractionFailedError,
  GraphRelationshipDetectionFailedError,
  GraphStorageError,
  GraphInvalidInputError,
  GraphCycleDetectedError,
  // Type guards
  isRetriableError,
  isEmbeddingError,
  isExtractionError,
  isSearchError,
  isGraphBuildError,
  isEpic3Error,
  // Helper functions
  getErrorCategory,
  calculateRetryDelay,
  serializeErrorForLogging,
  wrapUnknownError,
  ErrorCode,
} from '../errors'

describe('EmbeddingErrors', () => {
  describe('EmbeddingRateLimitError', () => {
    it('should create rate limit error with correct properties', () => {
      const error = new EmbeddingRateLimitError(60, 'minute', {
        currentRPM: 100,
      })

      expect(error.code).toBe(ErrorCode.EMBEDDING_RATE_LIMIT)
      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(429)
      expect(error.retryAfterSeconds).toBe(60)
      expect(error.limitType).toBe('minute')
      expect(error.message).toContain('60s')
    })

    it('should serialize correctly', () => {
      const error = new EmbeddingRateLimitError(120, 'day')
      const json = error.toJSON()

      expect(json.code).toBe(ErrorCode.EMBEDDING_RATE_LIMIT)
      expect(json.retriable).toBe(true)
      expect(json.metadata.retryAfterSeconds).toBe(120)
      expect(json.metadata.limitType).toBe('day')
      expect(json.timestamp).toBeDefined()
    })

    it('should format for API response without stack trace', () => {
      const error = new EmbeddingRateLimitError(30, 'minute')
      const apiResponse = error.toAPIResponse()

      expect(apiResponse.success).toBe(false)
      expect(apiResponse.error.code).toBe(ErrorCode.EMBEDDING_RATE_LIMIT)
      expect(apiResponse.error.retriable).toBe(true)
      expect(apiResponse.error.metadata).toBeDefined()
      expect(apiResponse.error).not.toHaveProperty('stack')
    })
  })

  describe('EmbeddingQuotaExceededError', () => {
    it('should create quota error with reset time', () => {
      const resetTime = new Date('2025-10-18T00:00:00Z')
      const error = new EmbeddingQuotaExceededError(resetTime)

      expect(error.code).toBe(ErrorCode.EMBEDDING_QUOTA_EXCEEDED)
      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(429)
      expect(error.quotaResetTime).toEqual(resetTime)
      expect(error.message).toContain('2025-10-18')
    })
  })

  describe('EmbeddingInvalidInputError', () => {
    it('should create invalid input error as non-retriable', () => {
      const error = new EmbeddingInvalidInputError('Text is empty')

      expect(error.code).toBe(ErrorCode.EMBEDDING_INVALID_INPUT)
      expect(error.retriable).toBe(false)
      expect(error.httpStatus).toBe(400)
      expect(error.reason).toBe('Text is empty')
    })
  })

  describe('EmbeddingNetworkError', () => {
    it('should wrap network errors', () => {
      const networkError = new Error('Connection timeout')
      const error = new EmbeddingNetworkError(networkError)

      expect(error.code).toBe(ErrorCode.EMBEDDING_NETWORK_ERROR)
      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(503)
      expect(error.originalError).toBe(networkError)
      expect(error.message).toContain('Connection timeout')
    })
  })

  describe('EmbeddingAPIError', () => {
    it('should mark 5xx errors as retriable', () => {
      const error = new EmbeddingAPIError(500, 'Internal server error')

      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(500)
      expect(error.apiStatusCode).toBe(500)
    })

    it('should mark 4xx errors as non-retriable', () => {
      const error = new EmbeddingAPIError(400, 'Bad request')

      expect(error.retriable).toBe(false)
      expect(error.httpStatus).toBe(400)
    })

    it('should mark 429 as retriable', () => {
      const error = new EmbeddingAPIError(429, 'Too many requests')

      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(429)
    })
  })

  describe('EmbeddingTimeoutError', () => {
    it('should create timeout error', () => {
      const error = new EmbeddingTimeoutError(5000)

      expect(error.code).toBe(ErrorCode.EMBEDDING_TIMEOUT)
      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(504)
      expect(error.timeoutMs).toBe(5000)
    })
  })
})

describe('ExtractionErrors', () => {
  describe('ExtractionModelOverloadError', () => {
    it('should create model overload error', () => {
      const error = new ExtractionModelOverloadError(30)

      expect(error.code).toBe(ErrorCode.EXTRACTION_MODEL_OVERLOAD)
      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(503)
      expect(error.retryAfterSeconds).toBe(30)
    })
  })

  describe('ExtractionInvalidResponseError', () => {
    it('should create invalid response error', () => {
      const error = new ExtractionInvalidResponseError('Missing required field', 'response data')

      expect(error.code).toBe(ErrorCode.EXTRACTION_INVALID_RESPONSE)
      expect(error.retriable).toBe(false)
      expect(error.reason).toBe('Missing required field')
      expect(error.response).toBe('response data')
    })

    it('should truncate long responses in metadata', () => {
      const longResponse = 'x'.repeat(500)
      const error = new ExtractionInvalidResponseError('Invalid', longResponse)
      const json = error.toJSON()

      expect(json.metadata.response?.length).toBe(200)
    })
  })

  describe('ExtractionJSONParseError', () => {
    it('should wrap JSON parse errors', () => {
      const parseError = new SyntaxError('Unexpected token')
      const error = new ExtractionJSONParseError(parseError, '{"invalid": json}')

      expect(error.code).toBe(ErrorCode.EXTRACTION_JSON_PARSE_ERROR)
      expect(error.retriable).toBe(false)
      expect(error.parseError).toBe(parseError)
    })
  })

  describe('ExtractionSchemaValidationError', () => {
    it('should create schema validation error', () => {
      const validationErrors = ['Missing field: name', 'Invalid type: age']
      const error = new ExtractionSchemaValidationError(validationErrors)

      expect(error.code).toBe(ErrorCode.EXTRACTION_SCHEMA_VALIDATION)
      expect(error.retriable).toBe(false)
      expect(error.validationErrors).toEqual(validationErrors)
      expect(error.message).toContain('Missing field: name')
    })
  })
})

describe('SearchErrors', () => {
  describe('SearchDatabaseError', () => {
    it('should wrap database errors', () => {
      const dbError = new Error('Connection lost')
      const error = new SearchDatabaseError(dbError)

      expect(error.code).toBe(ErrorCode.SEARCH_DATABASE_ERROR)
      expect(error.retriable).toBe(true)
      expect(error.httpStatus).toBe(500)
      expect(error.dbError).toBe(dbError)
    })
  })

  describe('SearchQueryTimeoutError', () => {
    it('should create query timeout as non-retriable', () => {
      const error = new SearchQueryTimeoutError(10000, 'complex medical query')

      expect(error.code).toBe(ErrorCode.SEARCH_QUERY_TIMEOUT)
      expect(error.retriable).toBe(false) // Query too complex
      expect(error.httpStatus).toBe(504)
      expect(error.timeoutMs).toBe(10000)
    })
  })

  describe('SearchEmbeddingFailedError', () => {
    it('should nest embedding errors', () => {
      const embeddingError = new EmbeddingRateLimitError(60, 'minute')
      const error = new SearchEmbeddingFailedError(embeddingError, true)

      expect(error.code).toBe(ErrorCode.SEARCH_EMBEDDING_FAILED)
      expect(error.retriable).toBe(true)
      expect(error.fallbackAvailable).toBe(true)
      expect(error.embeddingError).toBe(embeddingError)
    })
  })

  describe('SearchNoResultsError', () => {
    it('should create no results error', () => {
      const error = new SearchNoResultsError('rare medical condition')

      expect(error.code).toBe(ErrorCode.SEARCH_NO_RESULTS)
      expect(error.retriable).toBe(false)
      expect(error.httpStatus).toBe(404)
      expect(error.query).toBe('rare medical condition')
    })
  })
})

describe('GraphBuildErrors', () => {
  describe('GraphConceptExtractionFailedError', () => {
    it('should track partial failures', () => {
      const errors = [new Error('Chunk 1 failed'), new Error('Chunk 2 failed')]
      const error = new GraphConceptExtractionFailedError(2, 10, errors)

      expect(error.code).toBe(ErrorCode.GRAPH_CONCEPT_EXTRACTION_FAILED)
      expect(error.retriable).toBe(true) // Partial failure OK
      expect(error.failedChunks).toBe(2)
      expect(error.totalChunks).toBe(10)
      expect(error.metadata.successRate).toBe(80)
    })
  })

  describe('GraphRelationshipDetectionFailedError', () => {
    it('should track relationship failures', () => {
      const errors = [new Error('Pair 1 failed')]
      const error = new GraphRelationshipDetectionFailedError(1, 5, errors)

      expect(error.code).toBe(ErrorCode.GRAPH_RELATIONSHIP_DETECTION_FAILED)
      expect(error.failedPairs).toBe(1)
      expect(error.totalPairs).toBe(5)
      expect(error.metadata.successRate).toBe(80)
    })
  })

  describe('GraphCycleDetectedError', () => {
    it('should report cycle path', () => {
      const cycle = ['ConceptA', 'ConceptB', 'ConceptC', 'ConceptA']
      const error = new GraphCycleDetectedError(cycle)

      expect(error.code).toBe(ErrorCode.GRAPH_CYCLE_DETECTED)
      expect(error.retriable).toBe(false)
      expect(error.cycle).toEqual(cycle)
      expect(error.message).toContain('ConceptA -> ConceptB')
    })
  })
})

describe('Type Guards', () => {
  it('should identify retriable errors', () => {
    const retriable = new EmbeddingRateLimitError(60, 'minute')
    const nonRetriable = new EmbeddingInvalidInputError('Empty text')

    expect(isRetriableError(retriable)).toBe(true)
    expect(isRetriableError(nonRetriable)).toBe(false)
    expect(isRetriableError(new Error('generic'))).toBe(false)
  })

  it('should identify embedding errors', () => {
    const embeddingError = new EmbeddingRateLimitError(60, 'minute')
    const searchError = new SearchDatabaseError(new Error('DB error'))

    expect(isEmbeddingError(embeddingError)).toBe(true)
    expect(isEmbeddingError(searchError)).toBe(false)
    expect(isEmbeddingError(new Error('generic'))).toBe(false)
  })

  it('should identify extraction errors', () => {
    const extractionError = new ExtractionJSONParseError(
      new SyntaxError('Invalid JSON'),
      '{}'
    )
    const graphError = new GraphStorageError(new Error('Storage failed'))

    expect(isExtractionError(extractionError)).toBe(true)
    expect(isExtractionError(graphError)).toBe(false)
  })

  it('should identify search errors', () => {
    const searchError = new SearchNoResultsError('query')
    const embeddingError = new EmbeddingTimeoutError(5000)

    expect(isSearchError(searchError)).toBe(true)
    expect(isSearchError(embeddingError)).toBe(false)
  })

  it('should identify graph errors', () => {
    const graphError = new GraphInvalidInputError('Invalid concept')
    const extractionError = new ExtractionModelOverloadError(30)

    expect(isGraphBuildError(graphError)).toBe(true)
    expect(isGraphBuildError(extractionError)).toBe(false)
  })

  it('should identify any Epic3 error', () => {
    const epic3Error = new EmbeddingRateLimitError(60, 'minute')
    const genericError = new Error('generic')

    expect(isEpic3Error(epic3Error)).toBe(true)
    expect(isEpic3Error(genericError)).toBe(false)
  })
})

describe('Helper Functions', () => {
  describe('getErrorCategory', () => {
    it('should categorize errors correctly', () => {
      expect(getErrorCategory(new EmbeddingRateLimitError(60, 'minute'))).toBe('embedding')
      expect(getErrorCategory(new ExtractionJSONParseError(new SyntaxError(), ''))).toBe(
        'extraction'
      )
      expect(getErrorCategory(new SearchDatabaseError(new Error('')))).toBe('search')
      expect(getErrorCategory(new GraphStorageError(new Error('')))).toBe('graph')
      expect(getErrorCategory(new Error('generic'))).toBe('unknown')
    })
  })

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay0 = calculateRetryDelay(0, 1000)
      const delay1 = calculateRetryDelay(1, 1000)
      const delay2 = calculateRetryDelay(2, 1000)

      // Delays should increase exponentially (with jitter)
      expect(delay0).toBeGreaterThanOrEqual(750) // 1000 * 2^0 ± 25%
      expect(delay0).toBeLessThanOrEqual(1250)

      expect(delay1).toBeGreaterThanOrEqual(1500) // 1000 * 2^1 ± 25%
      expect(delay1).toBeLessThanOrEqual(2500)

      expect(delay2).toBeGreaterThanOrEqual(3000) // 1000 * 2^2 ± 25%
      expect(delay2).toBeLessThanOrEqual(5000)
    })

    it('should cap at max delay', () => {
      const delay = calculateRetryDelay(10, 1000, 5000)

      expect(delay).toBeLessThanOrEqual(5000 * 1.25) // Max + 25% jitter
    })
  })

  describe('serializeErrorForLogging', () => {
    it('should serialize Epic3Error', () => {
      const error = new EmbeddingRateLimitError(60, 'minute', { context: 'test' })
      const serialized = serializeErrorForLogging(error)

      expect(serialized.code).toBe(ErrorCode.EMBEDDING_RATE_LIMIT)
      expect(serialized.retriable).toBe(true)
      expect(serialized.metadata.retryAfterSeconds).toBe(60)
      expect(serialized.stack).toBeDefined()
    })

    it('should serialize generic Error', () => {
      const error = new Error('Generic error')
      const serialized = serializeErrorForLogging(error)

      expect(serialized.name).toBe('Error')
      expect(serialized.message).toBe('Generic error')
      expect(serialized.stack).toBeDefined()
    })

    it('should serialize non-Error values', () => {
      const serialized = serializeErrorForLogging('string error')

      expect(serialized.error).toBe('string error')
      expect(serialized.type).toBe('string')
    })
  })

  describe('wrapUnknownError', () => {
    it('should return Epic3Error as-is', () => {
      const original = new EmbeddingRateLimitError(60, 'minute')
      const wrapped = wrapUnknownError(original, 'embedding')

      expect(wrapped).toBe(original)
    })

    it('should wrap Error as Epic3Error', () => {
      const error = new Error('Database connection failed')
      const wrapped = wrapUnknownError(error, 'search')

      expect(isSearchError(wrapped)).toBe(true)
      expect(wrapped.message).toContain('Database connection failed')
    })

    it('should wrap string as Epic3Error', () => {
      const wrapped = wrapUnknownError('Unexpected failure', 'graph')

      expect(isGraphBuildError(wrapped)).toBe(true)
      expect(wrapped.message).toContain('Unexpected failure')
    })

    it('should wrap by category correctly', () => {
      const embeddingWrapped = wrapUnknownError(new Error('test'), 'embedding')
      const extractionWrapped = wrapUnknownError(new Error('test'), 'extraction')
      const searchWrapped = wrapUnknownError(new Error('test'), 'search')
      const graphWrapped = wrapUnknownError(new Error('test'), 'graph')

      expect(isEmbeddingError(embeddingWrapped)).toBe(true)
      expect(isExtractionError(extractionWrapped)).toBe(true)
      expect(isSearchError(searchWrapped)).toBe(true)
      expect(isGraphBuildError(graphWrapped)).toBe(true)
    })
  })
})

describe('Error Metadata', () => {
  it('should sanitize sensitive metadata in API responses', () => {
    const error = new EmbeddingAPIError(401, 'Unauthorized', {
      apiKey: 'secret-key-123',
      token: 'bearer-token-456',
      userId: 'user-123', // Not sensitive
    })

    const apiResponse = error.toAPIResponse()

    expect(apiResponse.error.metadata?.apiKey).toBe('[REDACTED]')
    expect(apiResponse.error.metadata?.token).toBe('[REDACTED]')
    expect(apiResponse.error.metadata?.userId).toBe('user-123')
  })

  it('should preserve sensitive data in JSON serialization', () => {
    const error = new EmbeddingAPIError(401, 'Unauthorized', {
      apiKey: 'secret-key-123',
    })

    const json = error.toJSON()

    // JSON serialization keeps sensitive data for logging
    expect(json.metadata.apiKey).toBe('secret-key-123')
  })
})

describe('Nested Error Handling', () => {
  it('should handle nested Epic3 errors', () => {
    const embeddingError = new EmbeddingRateLimitError(60, 'minute')
    const searchError = new SearchEmbeddingFailedError(embeddingError, true)
    const json = searchError.toJSON()

    expect(json.metadata.embeddingError).toBeDefined()
    expect(json.metadata.embeddingError.code).toBe(ErrorCode.EMBEDDING_RATE_LIMIT)
    expect(json.metadata.fallbackAvailable).toBe(true)
  })
})

describe('Real-world Error Scenarios', () => {
  it('should handle rate limit scenario', () => {
    const error = new EmbeddingRateLimitError(60, 'minute', {
      currentRPM: 100,
      maxRPM: 100,
    })

    expect(isRetriableError(error)).toBe(true)
    expect(error.retryAfterSeconds).toBe(60)

    // Calculate delay based on the retry after seconds
    // Pass maxDelayMs to allow the full 60s delay
    const delay = calculateRetryDelay(0, error.retryAfterSeconds * 1000, 120000)

    // Delay should be 60000ms ± 25% jitter = 45000ms to 75000ms
    expect(delay).toBeGreaterThanOrEqual(45000)
    expect(delay).toBeLessThanOrEqual(75000)
  })

  it('should handle extraction failure with fallback', () => {
    const parseError = new SyntaxError('Unexpected token')
    const error = new ExtractionJSONParseError(parseError, '{"invalid": json}')

    expect(isRetriableError(error)).toBe(false)
    expect(error.code).toBe(ErrorCode.EXTRACTION_JSON_PARSE_ERROR)

    // Log for debugging
    const logged = serializeErrorForLogging(error)
    expect(logged.metadata.parseError).toContain('Unexpected token')
  })

  it('should handle partial graph build failure', () => {
    const errors = [new Error('Chunk 1 failed'), new Error('Chunk 5 failed')]
    const error = new GraphConceptExtractionFailedError(2, 100, errors)

    expect(isRetriableError(error)).toBe(true)
    expect(error.metadata.successRate).toBe(98) // 98% success

    // Decision: 98% success rate might be acceptable, don't retry
    const shouldRetry = error.metadata.successRate < 95
    expect(shouldRetry).toBe(false)
  })
})

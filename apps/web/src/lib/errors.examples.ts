/**
 * Epic 3 Error System - Usage Examples
 *
 * This file demonstrates real-world usage patterns for the Epic 3 error type system.
 * These examples show how to:
 * - Throw typed errors in services
 * - Handle errors with type-safe discriminated unions
 * - Implement retry logic
 * - Log errors effectively
 * - Return error responses from API routes
 *
 * @module Epic3ErrorExamples
 */

import {
  // Error classes
  EmbeddingRateLimitError,
  EmbeddingInvalidInputError,
  EmbeddingAPIError,
  ExtractionJSONParseError,
  SearchEmbeddingFailedError,
  SearchNoResultsError,
  GraphConceptExtractionFailedError,
  // Type guards
  isRetriableError,
  isEmbeddingError,
  isSearchError,
  isEpic3Error,
  // Helper functions
  calculateRetryDelay,
  serializeErrorForLogging,
  wrapUnknownError,
  type AllEpic3Errors,
} from './errors'

/* ============================================================================
 * EXAMPLE 1: EMBEDDING SERVICE WITH RETRY LOGIC
 * ========================================================================== */

/**
 * Example: Generate embeddings with automatic retry on retriable errors
 */
export async function generateEmbeddingWithRetry(
  text: string,
  maxRetries: number = 3
): Promise<number[]> {
  let lastError: AllEpic3Errors | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Validate input
      if (!text || text.trim().length === 0) {
        throw new EmbeddingInvalidInputError('Text cannot be empty')
      }

      if (text.length > 10000) {
        throw new EmbeddingInvalidInputError('Text exceeds maximum length of 10,000 characters', {
          actualLength: text.length,
        })
      }

      // Simulate API call
      const embedding = await callGeminiAPI(text)
      return embedding
    } catch (error) {
      // Wrap unknown errors
      const epic3Error = isEpic3Error(error)
        ? error
        : wrapUnknownError(error, 'embedding')

      lastError = epic3Error

      // Don't retry if error is permanent
      if (!isRetriableError(epic3Error)) {
        console.error('Permanent error, not retrying:', serializeErrorForLogging(epic3Error))
        throw epic3Error
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        console.error('Max retries reached:', serializeErrorForLogging(epic3Error))
        throw epic3Error
      }

      // Calculate retry delay with exponential backoff
      const delay = calculateRetryDelay(attempt)
      console.warn(
        `Retriable error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${delay}ms...`,
        epic3Error.message
      )

      await sleep(delay)
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError!
}

/**
 * Simulate Gemini API call
 */
async function callGeminiAPI(text: string): Promise<number[]> {
  // Simulate rate limit error
  if (Math.random() < 0.1) {
    throw new EmbeddingRateLimitError(60, 'minute')
  }

  // Simulate API error
  if (Math.random() < 0.05) {
    throw new EmbeddingAPIError(503, 'Service temporarily unavailable')
  }

  // Return mock embedding
  return Array(768).fill(0)
}

/**
 * Helper: Sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ============================================================================
 * EXAMPLE 2: BATCH PROCESSING WITH PARTIAL FAILURE HANDLING
 * ========================================================================== */

/**
 * Example: Process batch with graceful degradation
 */
export async function processBatchWithPartialFailure(
  texts: string[]
): Promise<{
  embeddings: number[][]
  errors: Map<number, AllEpic3Errors>
  successRate: number
}> {
  const embeddings: number[][] = []
  const errors = new Map<number, AllEpic3Errors>()

  // Process all texts, collecting errors instead of failing fast
  const results = await Promise.allSettled(
    texts.map((text, index) =>
      generateEmbeddingWithRetry(text, 2).catch((error) => {
        const epic3Error = isEpic3Error(error) ? error : wrapUnknownError(error, 'embedding')
        errors.set(index, epic3Error)
        return null
      })
    )
  )

  // Collect successful embeddings
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value !== null) {
      embeddings.push(result.value)
    }
  })

  const successRate = (embeddings.length / texts.length) * 100

  // Log summary
  console.log(`Batch processing complete: ${embeddings.length}/${texts.length} successful (${successRate.toFixed(1)}%)`)

  if (errors.size > 0) {
    console.warn(`Failed embeddings: ${errors.size}`)
    errors.forEach((error, index) => {
      console.error(`  Text ${index}: [${error.code}] ${error.message}`)
    })
  }

  // Decide if partial failure is acceptable
  if (successRate < 80) {
    // Less than 80% success - throw aggregate error
    const failedIndices = Array.from(errors.keys())
    const errorList = Array.from(errors.values())
    throw new GraphConceptExtractionFailedError(errors.size, texts.length, errorList as Error[])
  }

  return { embeddings, errors, successRate }
}

/* ============================================================================
 * EXAMPLE 3: API ROUTE ERROR HANDLING
 * ========================================================================== */

/**
 * Example: Next.js API route with comprehensive error handling
 */
export async function POST_searchEndpoint(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const { query, userId } = body

    // Perform search
    const results = await performSemanticSearch(query, userId)

    return Response.json({
      success: true,
      data: results,
    })
  } catch (error) {
    // Handle Epic3 errors
    if (isEpic3Error(error)) {
      console.error('Epic3 error in search:', serializeErrorForLogging(error))

      // Return structured error response
      return Response.json(error.toAPIResponse(), {
        status: error.httpStatus,
      })
    }

    // Handle unknown errors
    console.error('Unknown error in search:', error)
    return Response.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          retriable: false,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Simulate semantic search
 */
async function performSemanticSearch(
  query: string,
  userId: string
): Promise<any[]> {
  // Generate query embedding
  let queryEmbedding: number[]
  try {
    queryEmbedding = await generateEmbeddingWithRetry(query, 2)
  } catch (error) {
    // If embedding fails, check if we can fallback to keyword search
    if (isEmbeddingError(error) && isRetriableError(error)) {
      throw new SearchEmbeddingFailedError(error, true, {
        fallbackStrategy: 'keyword_search',
      })
    }
    throw error
  }

  // Perform vector search (simulated)
  const results = await vectorSearch(queryEmbedding)

  // Track zero-result searches
  if (results.length === 0) {
    throw new SearchNoResultsError(query, { userId })
  }

  return results
}

/**
 * Simulate vector search
 */
async function vectorSearch(embedding: number[]): Promise<any[]> {
  // Return mock results
  return Math.random() < 0.9
    ? [{ id: '1', similarity: 0.95 }, { id: '2', similarity: 0.87 }]
    : []
}

/* ============================================================================
 * EXAMPLE 4: ERROR CLASSIFICATION AND MONITORING
 * ========================================================================== */

/**
 * Example: Error monitoring service
 */
export class ErrorMonitor {
  private errorCounts = new Map<string, number>()
  private retriableErrors: AllEpic3Errors[] = []
  private permanentErrors: AllEpic3Errors[] = []

  /**
   * Track an error for monitoring
   */
  trackError(error: unknown): void {
    if (!isEpic3Error(error)) {
      return
    }

    // Increment error count by code
    const currentCount = this.errorCounts.get(error.code) || 0
    this.errorCounts.set(error.code, currentCount + 1)

    // Categorize by retriability
    if (isRetriableError(error)) {
      this.retriableErrors.push(error)

      // Alert if too many retriable errors (might indicate system issue)
      if (this.retriableErrors.length > 100) {
        this.alertHighRetriableErrorRate()
      }
    } else {
      this.permanentErrors.push(error)

      // Alert if too many permanent errors (might indicate data quality issue)
      if (this.permanentErrors.length > 50) {
        this.alertHighPermanentErrorRate()
      }
    }

    // Log to external monitoring service
    this.logToMonitoring(error)
  }

  /**
   * Get error statistics
   */
  getStats(): {
    totalErrors: number
    retriableCount: number
    permanentCount: number
    topErrors: Array<{ code: string; count: number }>
  } {
    const topErrors = Array.from(this.errorCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalErrors: this.retriableErrors.length + this.permanentErrors.length,
      retriableCount: this.retriableErrors.length,
      permanentCount: this.permanentErrors.length,
      topErrors,
    }
  }

  private alertHighRetriableErrorRate(): void {
    console.error('⚠️ HIGH RETRIABLE ERROR RATE DETECTED')
    console.error('This may indicate a system issue (API downtime, network problems, etc.)')
    // Send alert to monitoring service (e.g., Sentry, DataDog)
  }

  private alertHighPermanentErrorRate(): void {
    console.error('⚠️ HIGH PERMANENT ERROR RATE DETECTED')
    console.error('This may indicate a data quality issue (invalid inputs, malformed data, etc.)')
    // Send alert to monitoring service
  }

  private logToMonitoring(error: AllEpic3Errors): void {
    // Example: Send to external monitoring service
    const logEntry = {
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      retriable: error.retriable,
      httpStatus: error.httpStatus,
      metadata: error.metadata,
    }

    // In production, send to Sentry, DataDog, CloudWatch, etc.
    console.log('[MONITORING]', JSON.stringify(logEntry))
  }
}

/* ============================================================================
 * EXAMPLE 5: GRAPH CONSTRUCTION WITH PARTIAL FAILURE TOLERANCE
 * ========================================================================== */

/**
 * Example: Build knowledge graph with tolerance for partial failures
 */
export async function buildKnowledgeGraphWithTolerance(
  chunks: string[],
  maxFailureRate: number = 0.1 // Allow up to 10% failure
): Promise<{
  concepts: any[]
  relationships: any[]
  failedChunks: number
}> {
  const concepts: any[] = []
  const failedChunks: number[] = []
  const errors: Error[] = []

  // Extract concepts from each chunk
  for (let i = 0; i < chunks.length; i++) {
    try {
      const chunkConcepts = await extractConcepts(chunks[i])
      concepts.push(...chunkConcepts)
    } catch (error) {
      failedChunks.push(i)
      errors.push(error instanceof Error ? error : new Error(String(error)))

      console.warn(`Failed to extract concepts from chunk ${i}:`, error)

      // Check if failure rate is too high
      const currentFailureRate = failedChunks.length / (i + 1)
      if (currentFailureRate > maxFailureRate) {
        // Failure rate exceeded, throw aggregate error
        throw new GraphConceptExtractionFailedError(
          failedChunks.length,
          i + 1,
          errors,
          {
            maxFailureRate,
            currentFailureRate: currentFailureRate * 100,
          }
        )
      }
    }
  }

  // Detect relationships between concepts
  const relationships = await detectRelationships(concepts)

  // Log final stats
  const finalFailureRate = (failedChunks.length / chunks.length) * 100
  console.log(
    `Knowledge graph built: ${concepts.length} concepts, ${relationships.length} relationships`
  )
  console.log(
    `Failed chunks: ${failedChunks.length}/${chunks.length} (${finalFailureRate.toFixed(1)}%)`
  )

  return { concepts, relationships, failedChunks: failedChunks.length }
}

/**
 * Simulate concept extraction
 */
async function extractConcepts(chunk: string): Promise<any[]> {
  // Simulate extraction errors
  if (Math.random() < 0.05) {
    throw new ExtractionJSONParseError(new SyntaxError('Invalid JSON'), chunk)
  }

  // Return mock concepts
  return [
    { name: 'Concept A', type: 'medical' },
    { name: 'Concept B', type: 'anatomical' },
  ]
}

/**
 * Simulate relationship detection
 */
async function detectRelationships(concepts: any[]): Promise<any[]> {
  // Return mock relationships
  return [
    { from: concepts[0]?.name, to: concepts[1]?.name, type: 'relates_to' },
  ]
}

/* ============================================================================
 * EXAMPLE 6: CIRCUIT BREAKER PATTERN
 * ========================================================================== */

/**
 * Example: Circuit breaker to prevent cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000 // 1 minute
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      const timeSinceFailure = Date.now() - this.lastFailureTime

      if (timeSinceFailure < this.resetTimeoutMs) {
        throw new EmbeddingAPIError(
          503,
          `Circuit breaker is open. Retry after ${Math.ceil((this.resetTimeoutMs - timeSinceFailure) / 1000)}s`,
          {
            state: this.state,
            failureCount: this.failureCount,
          }
        )
      }

      // Move to half-open state
      this.state = 'half-open'
      console.log('[CircuitBreaker] Moving to HALF-OPEN state')
    }

    try {
      const result = await operation()

      // Success - reset failure count
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failureCount = 0
        console.log('[CircuitBreaker] Moving to CLOSED state')
      }

      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      // Check if we should open the circuit
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open'
        console.error(
          `[CircuitBreaker] Opening circuit after ${this.failureCount} failures`
        )
      }

      throw error
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): { state: string; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    }
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.lastFailureTime = 0
    console.log('[CircuitBreaker] Manually reset to CLOSED state')
  }
}

/* ============================================================================
 * EXAMPLE 7: TYPE-SAFE ERROR HANDLING WITH DISCRIMINATED UNIONS
 * ========================================================================== */

/**
 * Example: Handle different error types with type narrowing
 */
export function handleSearchError(error: unknown): string {
  if (!isEpic3Error(error)) {
    return 'An unexpected error occurred'
  }

  // Type-safe error handling with discriminated unions
  if (isEmbeddingError(error)) {
    // TypeScript knows this is an EmbeddingError
    switch (error.code) {
      case 'EMBEDDING_RATE_LIMIT':
        return `Please wait ${error.metadata.retryAfterSeconds}s before retrying`
      case 'EMBEDDING_QUOTA_EXCEEDED':
        return `Daily quota exceeded. Resets at ${error.metadata.quotaResetTime}`
      case 'EMBEDDING_INVALID_INPUT':
        return `Invalid search query: ${error.message}`
      default:
        return 'Embedding generation failed. Please try again.'
    }
  }

  if (isSearchError(error)) {
    // TypeScript knows this is a SearchError
    switch (error.code) {
      case 'SEARCH_NO_RESULTS':
        return 'No results found for your query. Try different keywords.'
      case 'SEARCH_EMBEDDING_FAILED':
        return error.metadata.fallbackAvailable
          ? 'Using simplified search due to temporary issues'
          : 'Search is temporarily unavailable'
      default:
        return 'Search failed. Please try again.'
    }
  }

  return `Error: ${error.message}`
}

/* ============================================================================
 * EXAMPLE 8: LOGGING BEST PRACTICES
 * ========================================================================== */

/**
 * Example: Structured logging with different log levels
 */
export function logErrorWithContext(
  error: unknown,
  context: {
    operation: string
    userId?: string
    additionalData?: Record<string, any>
  }
): void {
  const serialized = serializeErrorForLogging(error)

  const logEntry = {
    timestamp: new Date().toISOString(),
    operation: context.operation,
    userId: context.userId,
    error: serialized,
    ...context.additionalData,
  }

  // Log based on retriability and severity
  if (isEpic3Error(error)) {
    if (isRetriableError(error)) {
      // Retriable errors are warnings (expected to recover)
      console.warn('[RETRIABLE ERROR]', JSON.stringify(logEntry, null, 2))
    } else {
      // Permanent errors are errors (need investigation)
      console.error('[PERMANENT ERROR]', JSON.stringify(logEntry, null, 2))
    }

    // Send to external logging service
    sendToExternalLogging(logEntry, error.httpStatus >= 500 ? 'error' : 'warn')
  } else {
    // Unknown errors are always errors
    console.error('[UNKNOWN ERROR]', JSON.stringify(logEntry, null, 2))
    sendToExternalLogging(logEntry, 'error')
  }
}

/**
 * Simulate sending logs to external service
 */
function sendToExternalLogging(
  logEntry: Record<string, any>,
  level: 'info' | 'warn' | 'error'
): void {
  // In production, send to CloudWatch, Datadog, Sentry, etc.
  console.log(`[EXTERNAL LOGGING - ${level.toUpperCase()}]`, logEntry)
}

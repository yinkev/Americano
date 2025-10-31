/**
 * Logging Middleware for Next.js API Routes
 *
 * Epic 3 - Observability Infrastructure
 *
 * Features:
 * - Correlation ID generation and propagation
 * - Automatic request/response logging
 * - Performance timing
 * - Error logging
 * - PII-safe logging
 *
 * Usage:
 * ```typescript
 * // In API route
 * export async function GET(request: Request) {
 *   return withLogging(request, async (req, logger) => {
 *     logger.info('Processing search request')
 *     // Your logic here
 *     return NextResponse.json({ results: [] })
 *   })
 * }
 * ```
 */

import { type NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { logger as defaultLogger, type Logger } from './logger'
import { sanitizeURL } from './logger-pii-redaction'

/**
 * Correlation ID header name
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id'

/**
 * Request ID header name
 */
export const REQUEST_ID_HEADER = 'x-request-id'

/**
 * Generate a correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4()
}

/**
 * Extract correlation ID from request headers or generate new one
 */
export function getCorrelationId(request: NextRequest | Request): string {
  const headers = request.headers

  // Try to get existing correlation ID from headers
  const correlationId = headers.get(CORRELATION_ID_HEADER) || headers.get(REQUEST_ID_HEADER)

  // Return existing or generate new
  return correlationId || generateCorrelationId()
}

/**
 * Add correlation ID to response headers
 */
export function addCorrelationHeaders<T = unknown>(
  response: NextResponse<T>,
  correlationId: string,
  requestId?: string,
): NextResponse<T> {
  response.headers.set(CORRELATION_ID_HEADER, correlationId)
  if (requestId) {
    response.headers.set(REQUEST_ID_HEADER, requestId)
  }
  return response
}

/**
 * Request context for logging
 */
export interface RequestContext {
  /** Correlation ID for tracing */
  correlationId: string
  /** Unique request ID */
  requestId: string
  /** HTTP method */
  method: string
  /** Request path (PII-safe) */
  path: string
  /** Request start time */
  startTime: number
  /** User agent */
  userAgent?: string
  /** User ID (if authenticated) */
  userId?: string
}

/**
 * Create request context from Next.js request
 */
export function createRequestContext(request: NextRequest | Request): RequestContext {
  const correlationId = getCorrelationId(request)
  const requestId = generateCorrelationId()

  // Get URL safely
  const url = request.url || ''
  const urlObj = new URL(url, 'http://localhost')
  const path = sanitizeURL(urlObj.pathname + urlObj.search)

  return {
    correlationId,
    requestId,
    method: request.method || 'UNKNOWN',
    path,
    startTime: Date.now(),
    userAgent: request.headers.get('user-agent') || undefined,
  }
}

/**
 * Logging handler type
 */
export type LoggingHandler<T = unknown> = (
  request: NextRequest | Request,
  logger: Logger,
  context: RequestContext,
) => Promise<NextResponse<T>>

/**
 * Wrap API route handler with logging middleware
 *
 * @param request - Next.js request object
 * @param handler - Route handler function
 * @returns Response with correlation headers
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withLogging(request, async (req, logger, context) => {
 *     logger.info('Fetching search results')
 *
 *     const results = await searchService.search(query)
 *
 *     logger.info('Search completed', {
 *       resultCount: results.length,
 *       duration: Date.now() - context.startTime
 *     })
 *
 *     return NextResponse.json({ results })
 *   })
 * }
 * ```
 */
export async function withLogging<T = unknown>(
  request: NextRequest | Request,
  handler: LoggingHandler<T>,
): Promise<NextResponse<T>> {
  const context = createRequestContext(request)

  // Create logger with request context
  const requestLogger = defaultLogger.child({
    correlationId: context.correlationId,
    requestId: context.requestId,
  })

  // Log incoming request
  requestLogger.apiRequest(context.method, context.path, {
    userAgent: context.userAgent,
  })

  let response: NextResponse<T>
  let statusCode = 200

  try {
    // Execute handler
    response = await handler(request, requestLogger, context)
    statusCode = response.status

    // Log successful response
    const duration = Date.now() - context.startTime
    requestLogger.apiResponse(context.method, context.path, statusCode, duration)

    // Add correlation headers to response
    return addCorrelationHeaders(response, context.correlationId, context.requestId)
  } catch (error) {
    // Log error
    const duration = Date.now() - context.startTime
    statusCode = 500

    requestLogger.error('Request handler error', {
      error,
      method: context.method,
      path: context.path,
      duration,
    })

    // Create error response
    response = NextResponse.json(
      {
        error: 'Internal Server Error',
        correlationId: context.correlationId,
        requestId: context.requestId,
      } as T,
      { status: 500 },
    )

    // Add correlation headers
    return addCorrelationHeaders(response, context.correlationId, context.requestId)
  }
}

/**
 * Middleware for Next.js middleware.ts
 * Automatically adds correlation IDs to all requests
 *
 * @param request - Next.js request
 * @returns Response with correlation headers
 *
 * @example
 * ```typescript
 * // middleware.ts
 * import { correlationMiddleware } from '@/lib/logger-middleware'
 *
 * export function middleware(request: NextRequest) {
 *   return correlationMiddleware(request)
 * }
 * ```
 */
export function correlationMiddleware(request: NextRequest): NextResponse {
  const correlationId = getCorrelationId(request)

  // Create response
  const response = NextResponse.next()

  // Add correlation ID to response
  response.headers.set(CORRELATION_ID_HEADER, correlationId)

  // Also add to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId)

  return response
}

/**
 * Performance timing utility
 * Logs performance metrics for code blocks
 *
 * @param operation - Operation name
 * @param fn - Function to time
 * @param logger - Logger instance
 * @returns Function result
 *
 * @example
 * ```typescript
 * const results = await withTiming(
 *   'semantic-search',
 *   async () => await searchService.search(query),
 *   logger
 * )
 * ```
 */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  logger: Logger = defaultLogger,
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await fn()
    const duration = Date.now() - startTime

    logger.performance(operation, duration)

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    logger.error(`${operation} failed`, {
      operation,
      duration,
      error,
    })

    throw error
  }
}

/**
 * Create logger for subsystem/service
 * Includes service name in all logs
 *
 * @param serviceName - Service/subsystem name
 * @returns Logger with service context
 *
 * @example
 * ```typescript
 * const logger = createSubsystemLogger('embedding-service')
 * logger.info('Generating embeddings', { count: 100 })
 * // => [embedding-service] Generating embeddings { count: 100 }
 * ```
 */
export function createSubsystemLogger(serviceName: string): Logger {
  return defaultLogger.child({ service: serviceName })
}

/**
 * Batch operation logging helper
 * Logs start, progress, and completion of batch operations
 *
 * @example
 * ```typescript
 * const batchLogger = createBatchLogger('embedding-generation', 1000, logger)
 *
 * batchLogger.start()
 *
 * for (let i = 0; i < 1000; i++) {
 *   // Process item
 *   batchLogger.progress(i + 1)
 * }
 *
 * batchLogger.complete(950, 50) // 950 success, 50 failed
 * ```
 */
export class BatchLogger {
  private startTime: number
  private lastLogTime: number
  private logInterval: number

  constructor(
    private operation: string,
    private totalItems: number,
    private logger: Logger = defaultLogger,
    logInterval = 10000, // Log every 10 seconds
  ) {
    this.startTime = 0
    this.lastLogTime = 0
    this.logInterval = logInterval
  }

  /**
   * Log batch start
   */
  start(): void {
    this.startTime = Date.now()
    this.lastLogTime = this.startTime

    this.logger.info(`Batch operation started: ${this.operation}`, {
      operation: this.operation,
      totalItems: this.totalItems,
    })
  }

  /**
   * Log batch progress (throttled)
   */
  progress(currentItem: number): void {
    const now = Date.now()

    // Only log if interval has passed
    if (now - this.lastLogTime >= this.logInterval) {
      const elapsed = now - this.startTime
      const percentComplete = (currentItem / this.totalItems) * 100
      const itemsPerSecond = currentItem / (elapsed / 1000)
      const estimatedRemaining = Math.round((this.totalItems - currentItem) / itemsPerSecond)

      this.logger.info(`Batch progress: ${this.operation}`, {
        operation: this.operation,
        currentItem,
        totalItems: this.totalItems,
        percentComplete: percentComplete.toFixed(1),
        itemsPerSecond: itemsPerSecond.toFixed(1),
        estimatedRemainingSeconds: estimatedRemaining,
      })

      this.lastLogTime = now
    }
  }

  /**
   * Log batch completion
   */
  complete(successCount: number, failureCount: number): void {
    const duration = Date.now() - this.startTime

    this.logger.info(`Batch operation completed: ${this.operation}`, {
      operation: this.operation,
      totalItems: this.totalItems,
      successCount,
      failureCount,
      duration,
      itemsPerSecond: (successCount / (duration / 1000)).toFixed(1),
    })
  }

  /**
   * Log batch error
   */
  error(error: unknown, currentItem: number): void {
    const duration = Date.now() - this.startTime

    this.logger.error(`Batch operation failed: ${this.operation}`, {
      operation: this.operation,
      currentItem,
      totalItems: this.totalItems,
      duration,
      error,
    })
  }
}

/**
 * Create batch logger for batch operations
 */
export function createBatchLogger(
  operation: string,
  totalItems: number,
  logger: Logger = defaultLogger,
): BatchLogger {
  return new BatchLogger(operation, totalItems, logger)
}

/**
 * Export all middleware utilities
 */
export const LoggingMiddleware = {
  withLogging,
  withTiming,
  correlationMiddleware,
  createRequestContext,
  createSubsystemLogger,
  createBatchLogger,
  getCorrelationId,
  generateCorrelationId,
  addCorrelationHeaders,
}

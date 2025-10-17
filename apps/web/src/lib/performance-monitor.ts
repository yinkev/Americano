/**
 * PerformanceMonitor - Performance tracking and slow query logging
 * Story 3.6 Task 9.5: Performance monitoring
 *
 * Features:
 * - Response time tracking in API routes
 * - Slow query logging (>1 second)
 * - Cache hit/miss metrics
 * - Export to SearchAnalytics table
 * - Memory-efficient circular buffer for metrics
 *
 * Performance targets:
 * - Simple queries: <1 second
 * - Complex queries: <2 seconds
 * - Autocomplete: <100ms
 */

import { prisma } from '@/lib/db'

/**
 * Performance metric entry
 */
export interface PerformanceMetric {
  /** Metric type */
  type: 'search' | 'autocomplete' | 'export' | 'other'
  /** Operation identifier */
  operation: string
  /** Duration in milliseconds */
  durationMs: number
  /** Whether operation was successful */
  success: boolean
  /** Additional metadata */
  metadata?: {
    userId?: string
    query?: string
    resultCount?: number
    cacheHit?: boolean
    error?: string
  }
  /** Timestamp */
  timestamp: Date
}

/**
 * Slow query log entry
 */
export interface SlowQueryLog {
  query: string
  durationMs: number
  userId?: string
  timestamp: Date
  threshold: number
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  totalRequests: number
  avgResponseTimeMs: number
  p50ResponseTimeMs: number
  p95ResponseTimeMs: number
  p99ResponseTimeMs: number
  slowQueryCount: number
  errorRate: number
}

/**
 * PerformanceMonitor - Track and log performance metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[]
  private maxMetrics: number
  private slowQueryThreshold: number

  constructor(
    maxMetrics: number = 1000,
    slowQueryThreshold: number = 1000 // 1 second
  ) {
    this.metrics = []
    this.maxMetrics = maxMetrics
    this.slowQueryThreshold = slowQueryThreshold
  }

  /**
   * Record a performance metric
   * Task 9.5: Response time tracking
   *
   * @param metric - Performance metric to record
   */
  record(metric: PerformanceMetric): void {
    // Add to circular buffer
    this.metrics.push(metric)

    // Keep buffer size under limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log slow queries
    if (
      metric.type === 'search' &&
      metric.durationMs > this.slowQueryThreshold
    ) {
      this.logSlowQuery({
        query: metric.metadata?.query || 'unknown',
        durationMs: metric.durationMs,
        userId: metric.metadata?.userId,
        timestamp: metric.timestamp,
        threshold: this.slowQueryThreshold,
      })
    }

    // Log errors
    if (!metric.success && metric.metadata?.error) {
      console.error(`[PerformanceMonitor] ${metric.operation} failed:`, {
        error: metric.metadata.error,
        durationMs: metric.durationMs,
        metadata: metric.metadata,
      })
    }
  }

  /**
   * Log slow query
   * Task 9.5: Slow query logging (>1 second)
   *
   * @param log - Slow query log entry
   */
  private logSlowQuery(log: SlowQueryLog): void {
    console.warn(`[SlowQuery] Query took ${log.durationMs}ms (threshold: ${log.threshold}ms)`, {
      query: log.query,
      userId: log.userId,
      timestamp: log.timestamp.toISOString(),
    })

    // Async export to database (non-blocking)
    this.exportSlowQueryToDatabase(log).catch((error) => {
      console.error('[PerformanceMonitor] Failed to export slow query:', error)
    })
  }

  /**
   * Get performance statistics
   * Task 9.5: Performance metrics aggregation
   *
   * @param type - Optional filter by metric type
   * @returns Performance statistics
   */
  getStats(type?: 'search' | 'autocomplete' | 'export'): PerformanceStats {
    const filteredMetrics = type
      ? this.metrics.filter((m) => m.type === type)
      : this.metrics

    if (filteredMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTimeMs: 0,
        p50ResponseTimeMs: 0,
        p95ResponseTimeMs: 0,
        p99ResponseTimeMs: 0,
        slowQueryCount: 0,
        errorRate: 0,
      }
    }

    // Calculate statistics
    const durations = filteredMetrics.map((m) => m.durationMs).sort((a, b) => a - b)
    const totalRequests = filteredMetrics.length
    const avgResponseTimeMs =
      durations.reduce((sum, d) => sum + d, 0) / totalRequests

    // Percentiles
    const p50ResponseTimeMs = this.percentile(durations, 0.5)
    const p95ResponseTimeMs = this.percentile(durations, 0.95)
    const p99ResponseTimeMs = this.percentile(durations, 0.99)

    // Slow query count
    const slowQueryCount = filteredMetrics.filter(
      (m) => m.durationMs > this.slowQueryThreshold
    ).length

    // Error rate
    const errorCount = filteredMetrics.filter((m) => !m.success).length
    const errorRate = errorCount / totalRequests

    return {
      totalRequests,
      avgResponseTimeMs: Math.round(avgResponseTimeMs),
      p50ResponseTimeMs: Math.round(p50ResponseTimeMs),
      p95ResponseTimeMs: Math.round(p95ResponseTimeMs),
      p99ResponseTimeMs: Math.round(p99ResponseTimeMs),
      slowQueryCount,
      errorRate: Math.round(errorRate * 1000) / 10, // Convert to percentage
    }
  }

  /**
   * Calculate percentile from sorted array
   *
   * @param sortedValues - Sorted array of values
   * @param percentile - Percentile (0.0 to 1.0)
   * @returns Percentile value
   */
  private percentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0

    const index = Math.ceil(sortedValues.length * percentile) - 1
    return sortedValues[Math.max(0, index)]
  }

  /**
   * Export slow query to database
   * Task 9.5: Export to SearchAnalytics table
   *
   * @param log - Slow query log entry
   */
  private async exportSlowQueryToDatabase(log: SlowQueryLog): Promise<void> {
    try {
      // Store in SearchAnalytics table for later analysis
      const normalizedUserId = log.userId ?? 'anonymous'

      await prisma.searchAnalytics.upsert({
        where: {
          userId_date_query: {
            userId: normalizedUserId,
            date: new Date(log.timestamp.toDateString()), // Normalize to date
            query: log.query,
          },
        },
        create: {
          userId: normalizedUserId,
          date: new Date(log.timestamp.toDateString()),
          query: log.query,
          searchCount: 1,
          avgResultCount: 0,
          avgSimilarity: null,
          avgClickPosition: null,
          zeroResultCount: 0,
        },
        update: {
          searchCount: {
            increment: 1,
          },
        },
      })
    } catch (error) {
      // Silently fail - analytics should not break searches
      console.error('[PerformanceMonitor] Failed to export to database:', error)
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Get recent metrics
   *
   * @param count - Number of recent metrics to return
   * @returns Recent metrics
   */
  getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics.slice(-count)
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Higher-order function to wrap handlers with performance tracking
 * Task 9.5: Response time tracking in API routes
 *
 * @param type - Metric type
 * @param operation - Operation name
 * @param handler - Request handler
 * @returns Wrapped handler with performance tracking
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<Response>>(
  type: 'search' | 'autocomplete' | 'export' | 'other',
  operation: string,
  handler: T
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now()
    const request = args[0] as Request
    let success = true
    let error: string | undefined

    try {
      const response = await handler(...args)

      // Check if response indicates error
      if (response.status >= 400) {
        success = false
        // Try to extract error message from response
        try {
          const clone = response.clone()
          const body = await clone.json()
          error = body.error?.message || body.error?.code || 'Unknown error'
        } catch {
          error = `HTTP ${response.status}`
        }
      }

      // Record metric
      const durationMs = Date.now() - startTime
      performanceMonitor.record({
        type,
        operation,
        durationMs,
        success,
        metadata: {
          userId: request.headers.get('X-User-Email') || undefined,
          error,
        },
        timestamp: new Date(),
      })

      return response
    } catch (err) {
      // Record error metric
      const durationMs = Date.now() - startTime
      performanceMonitor.record({
        type,
        operation,
        durationMs,
        success: false,
        metadata: {
          userId: request.headers.get('X-User-Email') || undefined,
          error: err instanceof Error ? err.message : 'Unknown error',
        },
        timestamp: new Date(),
      })

      throw err
    }
  }) as T
}

/**
 * Get current performance statistics for monitoring dashboard
 * Task 9.5: Performance monitoring dashboard
 *
 * @returns Performance statistics by type
 */
export function getPerformanceReport(): {
  search: PerformanceStats
  autocomplete: PerformanceStats
  export: PerformanceStats
  overall: PerformanceStats
} {
  return {
    search: performanceMonitor.getStats('search'),
    autocomplete: performanceMonitor.getStats('autocomplete'),
    export: performanceMonitor.getStats('export'),
    overall: performanceMonitor.getStats(),
  }
}

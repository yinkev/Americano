/**
 * Prisma Configuration with Wave 2 Performance Optimization
 * Epic 5 Wave 2: Database Query Optimization + Redis Caching
 *
 * Optimized connection pool settings for high-concurrency scenarios
 * Implements best practices from context7 Prisma documentation
 */

/**
 * Build Prisma database URL with optimized connection pool settings
 * Ensures connection_limit is properly configured
 */
function buildOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || ''

  // Extract environment-based connection limits
  const environment = process.env.NODE_ENV || 'development'
  const isProduction = environment === 'production'

  // Connection limit based on environment
  // Wave 1 established: 40 connections (tested stable)
  // Wave 2 increase: 50-60 for higher concurrency
  // Production: Conservative 45 due to RDS limits
  const connectionLimit = isProduction ? 45 : 60

  // Only modify URL if it doesn't already have connection_limit
  if (baseUrl.includes('connection_limit=')) {
    return baseUrl
  }

  // Append connection limit to URL
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}connection_limit=${connectionLimit}`
}

export const prismaConfig = {
  /**
   * Log levels for Prisma Client
   * Use 'query' for debugging SQL queries in development
   * Minimal in production to reduce overhead
   */
  log:
    process.env.NODE_ENV === 'development'
      ? (['query', 'info', 'warn', 'error'] as const)
      : (['error'] as const),

  /**
   * Error formatting
   * Pretty format errors in development, minimal in production
   */
  errorFormat: process.env.NODE_ENV === 'development' ? ('pretty' as const) : ('minimal' as const),

  /**
   * Connection pool settings with wave 2 optimizations
   * Database URL includes connection_limit parameter
   */
  datasources: {
    db: {
      url: buildOptimizedDatabaseUrl(),
    },
  },
} as const

/**
 * Soft delete extension configuration
 * Add soft delete functionality to models if needed
 */
export const softDeleteConfig = {
  models: {
    // Example: Enable soft delete for lectures
    // Lecture: true,
  },
}

/**
 * Query timeout configuration (in milliseconds)
 * Optimized for caching patterns with Redis L2
 */
export const queryTimeouts = {
  default: 30000, // 30 seconds (unchanged - database timeout)
  longRunning: 180000, // 3 minutes for OCR/embeddings
  critical: 5000, // 5 seconds for critical user-facing queries (reduced from 8000)
  cached: 2000, // 2 seconds for cached queries (should hit Redis/L1)
} as const

/**
 * Batch operation limits
 * Optimized for performance and connection pool stability
 */
export const batchLimits = {
  maxInsert: 1000,
  maxUpdate: 500,
  maxDelete: 500,
} as const

/**
 * Connection pool health check settings
 * Wave 2: Monitor connection pool utilization
 */
export const connectionPoolSettings = {
  // Max connections per pool
  maxConnections: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '60'),

  // Connection acquisition timeout (ms)
  acquireTimeoutMs: 10000,

  // Idle connection timeout (ms) - close after 30 min
  idleTimeoutMs: 30 * 60 * 1000,

  // Reaper interval (ms) - check for idle connections every 5 min
  reaperInterval: 5 * 60 * 1000,

  // Max lifetime of a connection (ms) - 12 hours
  maxLifeMs: 12 * 60 * 60 * 1000,

  // Connection validation interval
  validationIntervalMs: 60000, // 1 minute
} as const

/**
 * Prisma query caching strategy
 * Wave 2: Work with Redis L2 cache for aggregate queries
 *
 * Recommended TTL values for different query types:
 * - User-specific analytics: 5-10 minutes
 * - Aggregate dashboards: 10-15 minutes
 * - Real-time metrics: 1-2 minutes
 * - Static reference data: 1 hour
 */
export const queryCachingStrategy = {
  // Analytics endpoints (user-specific patterns)
  analyticsUserData: {
    ttlSeconds: 300, // 5 minutes
    cacheable: true,
  },

  // Behavioral patterns (moderate change frequency)
  behavioralPatterns: {
    ttlSeconds: 600, // 10 minutes
    cacheable: true,
  },

  // Mission summaries (daily aggregations)
  missionSummaries: {
    ttlSeconds: 900, // 15 minutes
    cacheable: true,
  },

  // Performance metrics (time-series, less frequent reads)
  performanceMetrics: {
    ttlSeconds: 300, // 5 minutes
    cacheable: true,
  },

  // Cognitive load & burnout (real-time)
  cognitiveLoad: {
    ttlSeconds: 120, // 2 minutes
    cacheable: true,
  },

  // Learning objectives (static per lecture)
  learningObjectives: {
    ttlSeconds: 1800, // 30 minutes
    cacheable: true,
  },

  // Struggle predictions (updated frequently)
  strugglePredictions: {
    ttlSeconds: 300, // 5 minutes
    cacheable: true,
  },

  // Recommendations (user-driven, less frequent)
  recommendations: {
    ttlSeconds: 600, // 10 minutes
    cacheable: true,
  },

  // Search queries (not cached - user-driven)
  searchQueries: {
    ttlSeconds: 0,
    cacheable: false,
  },
} as const

/**
 * Performance monitoring thresholds
 * Wave 2: Track connection pool utilization
 */
export const performanceThresholds = {
  // Warn if connection pool utilization > 80%
  connectionPoolUtilizationWarn: 0.8,

  // Error if connection pool utilization > 95%
  connectionPoolUtilizationError: 0.95,

  // Warn if query takes > 500ms (should use cache)
  queryDurationWarnMs: 500,

  // Error if query takes > 5000ms
  queryDurationErrorMs: 5000,

  // Target: 70%+ cache hit rate
  cacheHitRateTarget: 0.7,
} as const

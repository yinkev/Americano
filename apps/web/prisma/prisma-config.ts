/**
 * Prisma Configuration
 * Centralized configuration for Prisma client settings
 */

export const prismaConfig = {
  /**
   * Log levels for Prisma Client
   * Use 'query' for debugging SQL queries in development
   */
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,

  /**
   * Error formatting
   * Pretty format errors in development, minimal in production
   */
  errorFormat: process.env.NODE_ENV === 'development'
    ? 'pretty' as const
    : 'minimal' as const,

  /**
   * Connection pool settings
   * Adjust based on your deployment environment
   */
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
} as const;

/**
 * Soft delete extension configuration
 * Add soft delete functionality to models if needed
 */
export const softDeleteConfig = {
  models: {
    // Example: Enable soft delete for lectures
    // Lecture: true,
  },
};

/**
 * Query timeout configuration (in milliseconds)
 */
export const queryTimeouts = {
  default: 30000, // 30 seconds
  longRunning: 180000, // 3 minutes for OCR/embeddings
  critical: 5000, // 5 seconds for critical user-facing queries
} as const;

/**
 * Batch operation limits
 */
export const batchLimits = {
  maxInsert: 1000,
  maxUpdate: 500,
  maxDelete: 500,
} as const;

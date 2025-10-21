/**
 * Retry Strategy - Centralized exports
 *
 * Production-ready retry mechanisms for Epic 3:
 * - Gemini API (embedding generation)
 * - ChatMock API (GPT-5 concept extraction)
 * - Database operations (Prisma queries)
 *
 * Usage:
 * ```typescript
 * import { retryService, DEFAULT_POLICIES, withDatabaseRetry } from '@/lib/retry'
 * ```
 */

// Core retry service
export {
  RetryService,
  retryService,
  DEFAULT_POLICIES,
  ErrorCategory,
  CircuitState,
  RetriableError,
  PermanentError,
  type RetryPolicy,
  type RetryAttempt,
  type RetryResult,
  type CircuitBreakerState,
} from './retry-service'

// Database retry wrappers
export {
  withDatabaseRetry,
  withDatabaseTransaction,
  withDatabaseBatch,
  isDatabaseTransientError,
  isDatabasePermanentError,
  DATABASE_RETRY_POLICY,
} from './database-retry'

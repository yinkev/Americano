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

// Database retry wrappers
export {
  DATABASE_RETRY_POLICY,
  isDatabasePermanentError,
  isDatabaseTransientError,
  withDatabaseBatch,
  withDatabaseRetry,
  withDatabaseTransaction,
} from './database-retry'
// Core retry service
export {
  type CircuitBreakerState,
  CircuitState,
  DEFAULT_POLICIES,
  ErrorCategory,
  PermanentError,
  RetriableError,
  type RetryAttempt,
  type RetryPolicy,
  type RetryResult,
  RetryService,
  retryService,
} from './retry-service'

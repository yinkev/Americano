/**
 * Database Retry Wrapper - Production-ready retry logic for Prisma queries
 *
 * Features:
 * - Automatic retry for transient database errors
 * - Transaction support with retry
 * - Connection pool error handling
 * - Deadlock and lock timeout recovery
 * - Type-safe wrapper functions
 *
 * Epic 3 - Database Retry Strategy
 */

import { PrismaClient } from '@/generated/prisma'
import { retryService, DEFAULT_POLICIES, RetryPolicy, PermanentError } from './retry-service'

/**
 * Database-specific retry policy (optimized for Postgres transient errors)
 */
export const DATABASE_RETRY_POLICY: Required<RetryPolicy> = {
  ...DEFAULT_POLICIES.DATABASE,
  maxAttempts: 5, // More retries for database (cheaper operations)
  initialDelayMs: 500, // Shorter initial delay
  maxDelayMs: 4000, // Cap at 4 seconds
  backoffMultiplier: 2,
  enableJitter: true,
  circuitBreakerThreshold: 10, // Higher threshold for database
  circuitBreakerTimeoutMs: 30000,
  operationTimeoutMs: 10000,
}

/**
 * Execute a Prisma query with retry logic
 *
 * @param operation - Prisma query function
 * @param operationName - Name for logging (e.g., "findUnique-user", "create-lecture")
 * @param customPolicy - Optional custom retry policy
 * @returns Promise with query result
 *
 * @example
 * ```typescript
 * import { withDatabaseRetry } from '@/lib/retry/database-retry'
 *
 * const user = await withDatabaseRetry(
 *   async () => prisma.user.findUnique({ where: { id: userId } }),
 *   'findUnique-user'
 * )
 * ```
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  customPolicy?: Partial<RetryPolicy>,
): Promise<T> {
  const policy = customPolicy
    ? { ...DATABASE_RETRY_POLICY, ...customPolicy }
    : DATABASE_RETRY_POLICY

  const result = await retryService.execute(operation, policy, `db:${operationName}`)

  if (result.error) {
    // If it's a permanent error, throw PermanentError
    if (result.error instanceof PermanentError) {
      throw result.error
    }

    // Otherwise throw the error with retry metadata
    const error = new Error(
      `Database operation '${operationName}' failed after ${result.attempts} attempts: ${result.error.message}`,
    )
    error.cause = result.error
    throw error
  }

  return result.value!
}

/**
 * Execute a Prisma transaction with retry logic
 *
 * Transactions are retried as a whole unit - if any operation fails,
 * the entire transaction is rolled back and retried.
 *
 * @param prisma - Prisma client instance
 * @param transactionFn - Transaction function
 * @param operationName - Name for logging (e.g., "create-lecture-with-chunks")
 * @param customPolicy - Optional custom retry policy
 * @returns Promise with transaction result
 *
 * @example
 * ```typescript
 * import { withDatabaseTransaction } from '@/lib/retry/database-retry'
 *
 * const result = await withDatabaseTransaction(
 *   prisma,
 *   async (tx) => {
 *     const lecture = await tx.lecture.create({ data: lectureData })
 *     const chunks = await tx.contentChunk.createMany({ data: chunkData })
 *     return { lecture, chunks }
 *   },
 *   'create-lecture-with-chunks'
 * )
 * ```
 */
export async function withDatabaseTransaction<T>(
  prisma: PrismaClient,
  transactionFn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>,
  operationName: string,
  customPolicy?: Partial<RetryPolicy>,
): Promise<T> {
  return withDatabaseRetry(
    async () => {
      return prisma.$transaction(transactionFn)
    },
    `transaction:${operationName}`,
    customPolicy,
  )
}

/**
 * Batch operation with retry logic
 *
 * Useful for bulk inserts/updates that might hit connection limits
 *
 * @param operations - Array of operations to execute
 * @param operationName - Name for logging
 * @param batchSize - Number of operations per batch (default: 100)
 * @returns Promise with array of results
 *
 * @example
 * ```typescript
 * import { withDatabaseBatch } from '@/lib/retry/database-retry'
 *
 * const embeddings = await withDatabaseBatch(
 *   chunks.map(chunk => () =>
 *     prisma.contentChunk.update({
 *       where: { id: chunk.id },
 *       data: { embedding: chunk.embedding }
 *     })
 *   ),
 *   'update-embeddings',
 *   50 // Process 50 at a time
 * )
 * ```
 */
export async function withDatabaseBatch<T>(
  operations: (() => Promise<T>)[],
  operationName: string,
  batchSize = 100,
): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(operations.length / batchSize)

    console.log(`[DatabaseRetry] Processing batch ${batchNumber}/${totalBatches} for ${operationName}`)

    // Execute batch operations in parallel with retry
    const batchResults = await Promise.all(
      batch.map((operation, index) =>
        withDatabaseRetry(operation, `${operationName}[${i + index}]`),
      ),
    )

    results.push(...batchResults)

    // Small delay between batches to avoid overwhelming connection pool
    if (i + batchSize < operations.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * Helper to check if an error is a transient database error
 * (exported for testing and custom error handling)
 */
export function isDatabaseTransientError(error: Error): boolean {
  const message = error.message.toLowerCase()

  const transientPatterns = [
    'connection',
    'timeout',
    'deadlock',
    'lock timeout',
    'could not serialize',
    'transaction',
    'pool',
    'econnreset',
    'econnrefused',
    'etimedout',
    'socket',
    'network',
  ]

  return transientPatterns.some((pattern) => message.includes(pattern))
}

/**
 * Helper to check if an error is a permanent database error
 * (exported for testing and custom error handling)
 */
export function isDatabasePermanentError(error: Error): boolean {
  const message = error.message.toLowerCase()

  const permanentPatterns = [
    'unique constraint',
    'foreign key constraint',
    'not found',
    'invalid',
    'syntax error',
    'column',
    'table',
    'relation',
    'does not exist',
    'null value',
    'check constraint',
  ]

  return permanentPatterns.some((pattern) => message.includes(pattern))
}

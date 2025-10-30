/**
 * Database Retry Tests - Test database-specific retry logic
 *
 * Tests:
 * - Prisma query retry
 * - Transaction retry
 * - Batch operation retry
 * - Transient vs permanent database errors
 *
 * Epic 3 - Database Retry Strategy Testing
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isDatabasePermanentError,
  isDatabaseTransientError,
  withDatabaseBatch,
  withDatabaseRetry,
  withDatabaseTransaction,
} from '../database-retry'
import { PermanentError } from '../retry-service'

// Mock Prisma client
const mockPrisma = {
  $transaction: vi.fn(),
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  lecture: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  contentChunk: {
    update: vi.fn(),
    createMany: vi.fn(),
  },
} as any

describe('withDatabaseRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should succeed on first attempt', async () => {
    const user = { id: '1', name: 'Test User' }
    mockPrisma.user.findUnique.mockResolvedValue(user)

    const result = await withDatabaseRetry(
      () => mockPrisma.user.findUnique({ where: { id: '1' } }),
      'findUnique-user',
    )

    expect(result).toEqual(user)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
  })

  it('should retry transient database errors', async () => {
    const user = { id: '1', name: 'Test User' }

    mockPrisma.user.findUnique
      .mockRejectedValueOnce(new Error('Connection timeout'))
      .mockRejectedValueOnce(new Error('Deadlock detected'))
      .mockResolvedValue(user)

    const result = await withDatabaseRetry(
      () => mockPrisma.user.findUnique({ where: { id: '1' } }),
      'findUnique-user',
      { maxAttempts: 3 },
    )

    expect(result).toEqual(user)
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(3)
  })

  it('should NOT retry permanent database errors', async () => {
    const error = new Error('Unique constraint violation')
    mockPrisma.user.create.mockRejectedValue(error)

    await expect(
      withDatabaseRetry(
        () => mockPrisma.user.create({ data: { email: 'test@example.com' } }),
        'create-user',
      ),
    ).rejects.toThrow('Unique constraint')

    expect(mockPrisma.user.create).toHaveBeenCalledTimes(1) // Only tried once
  })

  it('should throw after max retries', async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Connection pool exhausted'))

    await expect(
      withDatabaseRetry(
        () => mockPrisma.user.findUnique({ where: { id: '1' } }),
        'findUnique-user',
        {
          maxAttempts: 2,
        },
      ),
    ).rejects.toThrow('failed after 2 attempts')

    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(2)
  })
})

describe('withDatabaseTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should execute transaction successfully', async () => {
    const lecture = { id: '1', title: 'Test Lecture' }
    const chunks = { count: 5 }

    mockPrisma.$transaction.mockImplementation(async (fn: any) => {
      // Simulate transaction context
      const tx = {
        lecture: {
          create: vi.fn().mockResolvedValue(lecture),
        },
        contentChunk: {
          createMany: vi.fn().mockResolvedValue(chunks),
        },
      }
      return fn(tx)
    })

    const result = await withDatabaseTransaction(
      mockPrisma,
      async (tx) => {
        const lecture = await tx.lecture.create({ data: { title: 'Test' } })
        const chunks = await tx.contentChunk.createMany({ data: [] })
        return { lecture, chunks }
      },
      'create-lecture-with-chunks',
    )

    expect(result.lecture).toEqual(lecture)
    expect(result.chunks).toEqual(chunks)
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it('should retry entire transaction on transient error', async () => {
    let attempts = 0

    mockPrisma.$transaction.mockImplementation(async () => {
      attempts++
      if (attempts < 3) {
        throw new Error('Transaction deadlock')
      }
      return { success: true }
    })

    const result = await withDatabaseTransaction(
      mockPrisma,
      async (tx) => ({ success: true }),
      'retry-transaction',
    )

    expect(result).toEqual({ success: true })
    expect(attempts).toBe(3)
  })

  it('should NOT retry transaction on permanent error', async () => {
    mockPrisma.$transaction.mockRejectedValue(new Error('Foreign key constraint failed'))

    await expect(
      withDatabaseTransaction(mockPrisma, async (tx) => ({}), 'failing-transaction'),
    ).rejects.toThrow('Foreign key constraint')

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1)
  })
})

describe('withDatabaseBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should execute batch operations successfully', async () => {
    const operations = [
      vi.fn().mockResolvedValue({ id: '1', updated: true }),
      vi.fn().mockResolvedValue({ id: '2', updated: true }),
      vi.fn().mockResolvedValue({ id: '3', updated: true }),
    ]

    const results = await withDatabaseBatch(operations, 'update-batch', 2)

    expect(results).toHaveLength(3)
    expect(results[0]).toEqual({ id: '1', updated: true })
    expect(operations[0]).toHaveBeenCalledTimes(1)
    expect(operations[1]).toHaveBeenCalledTimes(1)
    expect(operations[2]).toHaveBeenCalledTimes(1)
  })

  it('should retry failed operations in batch', async () => {
    const operations = [
      vi.fn().mockResolvedValue({ id: '1', updated: true }),
      vi
        .fn()
        .mockRejectedValueOnce(new Error('Lock timeout'))
        .mockResolvedValue({ id: '2', updated: true }),
      vi.fn().mockResolvedValue({ id: '3', updated: true }),
    ]

    const results = await withDatabaseBatch(operations, 'update-batch-retry', 10)

    expect(results).toHaveLength(3)
    expect(operations[1]).toHaveBeenCalledTimes(2) // Retried once
  })

  it('should process in configurable batch sizes', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      vi.fn().mockResolvedValue({ id: String(i) }),
    )

    await withDatabaseBatch(operations, 'batch-size-test', 3)

    // Should process in batches of 3: [0,1,2], [3,4,5], [6,7,8], [9]
    // All operations should eventually be called once
    operations.forEach((op) => {
      expect(op).toHaveBeenCalledTimes(1)
    })
  })
})

describe('Error classification helpers', () => {
  describe('isDatabaseTransientError', () => {
    it('should identify transient errors', () => {
      const transientErrors = [
        new Error('Connection timeout'),
        new Error('ETIMEDOUT'),
        new Error('ECONNRESET'),
        new Error('Deadlock detected'),
        new Error('Lock timeout exceeded'),
        new Error('Could not serialize access'),
        new Error('Transaction aborted'),
        new Error('Connection pool exhausted'),
        new Error('Socket hang up'),
        new Error('Network error'),
      ]

      transientErrors.forEach((error) => {
        expect(isDatabaseTransientError(error)).toBe(true)
      })
    })

    it('should NOT identify permanent errors as transient', () => {
      const permanentErrors = [
        new Error('Unique constraint violation'),
        new Error('Foreign key constraint failed'),
        new Error('Table does not exist'),
        new Error('Column "name" does not exist'),
        new Error('Syntax error at position 5'),
      ]

      permanentErrors.forEach((error) => {
        expect(isDatabaseTransientError(error)).toBe(false)
      })
    })
  })

  describe('isDatabasePermanentError', () => {
    it('should identify permanent errors', () => {
      const permanentErrors = [
        new Error('Unique constraint violation'),
        new Error('Foreign key constraint failed'),
        new Error('Record not found'),
        new Error('Invalid column name'),
        new Error('Syntax error near SELECT'),
        new Error('Table "users" does not exist'),
        new Error('Relation "posts" does not exist'),
        new Error('Null value in column "email" violates not-null constraint'),
        new Error('Check constraint "age_positive" violated'),
      ]

      permanentErrors.forEach((error) => {
        expect(isDatabasePermanentError(error)).toBe(true)
      })
    })

    it('should NOT identify transient errors as permanent', () => {
      const transientErrors = [
        new Error('Connection timeout'),
        new Error('Deadlock detected'),
        new Error('Lock timeout'),
      ]

      transientErrors.forEach((error) => {
        expect(isDatabasePermanentError(error)).toBe(false)
      })
    })
  })
})

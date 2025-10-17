# Retry Strategy - Production-Ready Retry Mechanisms for Epic 3

## Overview

This directory contains a comprehensive retry strategy implementation with exponential backoff, circuit breaker patterns, and error categorization. Designed for production use with Gemini API (embeddings), ChatMock API (GPT-5 concept extraction), and database operations.

## Features

- **Exponential Backoff with Jitter** - Prevents thundering herd, delays: 1s, 2s, 4s, 8s
- **Circuit Breaker Pattern** - Stops retrying after N consecutive failures, auto-recovery
- **Error Categorization** - Distinguishes transient (retry) vs permanent (abort) errors
- **Configurable Policies** - Per-operation retry configuration
- **Comprehensive Logging** - Tracks retry attempts, success/failure, circuit state
- **Type-Safe** - Full TypeScript support with interfaces and enums

## Architecture

```
retry/
├── retry-service.ts       # Core retry logic with circuit breaker
├── database-retry.ts      # Database-specific retry wrappers
├── README.md              # This file
└── __tests__/
    ├── retry-service.test.ts    # RetryService tests
    └── database-retry.test.ts   # Database retry tests
```

## Quick Start

### 1. Gemini API (Embedding Generation)

The `GeminiClient` is already integrated with retry logic:

```typescript
import { GeminiClient } from '@/lib/ai/gemini-client'

const client = new GeminiClient()

// Automatically retries on rate limits, timeouts, 503 errors
const result = await client.generateEmbedding('Medical concept text')

if (result.error) {
  console.error('Failed after retries:', result.error)
} else {
  console.log('Embedding:', result.embedding) // 1536 dimensions
}
```

**Retry Policy:**
- Max attempts: 3
- Initial delay: 1s
- Max delay: 8s
- Circuit breaker: Opens after 5 consecutive failures
- Operation timeout: 30s

### 2. ChatMock API (GPT-5 Concept Extraction)

The `ChatMockClient` is already integrated with retry logic:

```typescript
import { ChatMockClient } from '@/lib/ai/chatmock-client'

const client = new ChatMockClient()

// Automatically retries on rate limits, timeouts
const result = await client.extractLearningObjectives(lectureText, context)

if (result.error) {
  console.error('Extraction failed:', result.error)
} else {
  console.log(`Extracted ${result.objectives.length} objectives`)
}
```

**Retry Policy:**
- Max attempts: 3
- Initial delay: 2s
- Max delay: 16s
- Circuit breaker: Opens after 3 consecutive failures
- Operation timeout: 120s (2 minutes for GPT-5)

### 3. Database Operations

Use the database retry wrappers for Prisma queries:

```typescript
import { withDatabaseRetry } from '@/lib/retry/database-retry'
import { prisma } from '@/lib/prisma'

// Simple query with retry
const user = await withDatabaseRetry(
  async () => prisma.user.findUnique({ where: { id: userId } }),
  'findUnique-user'
)

// Create with retry
const lecture = await withDatabaseRetry(
  async () => prisma.lecture.create({
    data: {
      title: 'Anatomy Lecture',
      userId,
      courseId,
      // ...
    }
  }),
  'create-lecture'
)
```

**Retry Policy:**
- Max attempts: 5 (database operations are cheaper)
- Initial delay: 500ms
- Max delay: 4s
- Circuit breaker: Opens after 10 consecutive failures
- Operation timeout: 10s

### 4. Database Transactions

Transactions are retried as atomic units:

```typescript
import { withDatabaseTransaction } from '@/lib/retry/database-retry'
import { prisma } from '@/lib/prisma'

const result = await withDatabaseTransaction(
  prisma,
  async (tx) => {
    // All operations in this function are part of the transaction
    const lecture = await tx.lecture.create({ data: lectureData })

    const chunks = await tx.contentChunk.createMany({
      data: chunkData.map(chunk => ({
        lectureId: lecture.id,
        content: chunk.content,
        chunkIndex: chunk.index,
      }))
    })

    return { lecture, chunks }
  },
  'create-lecture-with-chunks'
)

console.log(`Created lecture ${result.lecture.id} with ${result.chunks.count} chunks`)
```

**Transaction Behavior:**
- If any operation fails, entire transaction rolls back
- Transaction is retried as a whole (not individual operations)
- Retries transient errors (deadlock, lock timeout, connection issues)
- Does NOT retry permanent errors (constraint violations, syntax errors)

### 5. Batch Operations

Process large batches with automatic retry and rate limiting:

```typescript
import { withDatabaseBatch } from '@/lib/retry/database-retry'
import { prisma } from '@/lib/prisma'

const chunks = [/* 1000 chunks */]

// Create array of operations
const operations = chunks.map(chunk => async () =>
  prisma.contentChunk.update({
    where: { id: chunk.id },
    data: { embedding: chunk.embedding }
  })
)

// Execute in batches of 50 with retry
const results = await withDatabaseBatch(
  operations,
  'update-embeddings',
  50 // Batch size
)

console.log(`Updated ${results.length} embeddings`)
```

**Batch Behavior:**
- Processes in configurable batch sizes (default: 100)
- Each operation retried independently
- Adds 100ms delay between batches
- Returns all results in order

## Advanced Usage

### Custom Retry Policies

Override default policies for specific use cases:

```typescript
import { retryService, RetryPolicy } from '@/lib/retry/retry-service'

const customPolicy: RetryPolicy = {
  maxAttempts: 5,          // More retries
  initialDelayMs: 2000,    // Longer initial delay
  maxDelayMs: 30000,       // Cap at 30 seconds
  backoffMultiplier: 3,    // Faster backoff (2s, 6s, 18s)
  enableJitter: true,      // Add randomness
  circuitBreakerThreshold: 10,
  circuitBreakerTimeoutMs: 300000, // 5 minute recovery
  operationTimeoutMs: 60000,       // 1 minute timeout
}

const result = await retryService.execute(
  async () => {
    // Your custom operation
    return await someAPI.call()
  },
  customPolicy,
  'custom-operation'
)
```

### Error Categorization

The retry service automatically categorizes errors:

**Transient Errors (Retry):**
- Rate limits (429)
- Timeouts (ETIMEDOUT, ECONNRESET)
- Service unavailable (503, 502, 504)
- Network errors
- Database deadlocks
- Connection pool exhaustion

**Permanent Errors (Abort):**
- Authentication failures (401, 403)
- Bad requests (400)
- Not found (404)
- Validation errors
- Unique constraint violations
- Foreign key violations

**Custom Error Types:**

```typescript
import { RetriableError, PermanentError, ErrorCategory } from '@/lib/retry/retry-service'

// Throw retriable error with Retry-After
throw new RetriableError(
  'Rate limit exceeded',
  ErrorCategory.TRANSIENT,
  originalError,
  429,
  60 // Retry after 60 seconds
)

// Throw permanent error
throw new PermanentError(
  'Invalid API key',
  originalError,
  401
)
```

### Circuit Breaker Management

Monitor and control circuit breaker state:

```typescript
import { retryService } from '@/lib/retry/retry-service'

// Check circuit state
const state = retryService.getCircuitState('gemini-embedding')
if (state) {
  console.log(`Circuit: ${state.state}`)
  console.log(`Failures: ${state.failureCount}`)
  console.log(`Next attempt: ${state.nextAttemptTime}`)
}

// Manually reset circuit (emergency recovery)
retryService.resetCircuit('gemini-embedding')

// Reset all circuits
retryService.resetAllCircuits()
```

**Circuit States:**
- **CLOSED** - Normal operation, requests allowed
- **OPEN** - Too many failures, requests blocked
- **HALF_OPEN** - Testing recovery, one request allowed

### Retry Metadata

Access detailed retry information:

```typescript
const result = await retryService.execute(
  async () => await operation(),
  policy,
  'my-operation'
)

console.log(`Attempts: ${result.attempts}`)
console.log(`Total time: ${result.totalTimeMs}ms`)
console.log(`Circuit breaker triggered: ${result.circuitBreakerTriggered}`)

// Analyze retry history
result.retryHistory.forEach((attempt, index) => {
  console.log(`Retry ${attempt.attemptNumber}:`)
  console.log(`  Error: ${attempt.error.message}`)
  console.log(`  Delay: ${attempt.delayMs}ms`)
  console.log(`  Time: ${attempt.timestamp}`)
})
```

## Integration Examples

### Example 1: Embedding Service with Retry Callbacks

```typescript
import { EmbeddingService } from '@/lib/embedding-service'

const embeddingService = new EmbeddingService({
  maxRequestsPerMinute: 100,
  maxRetries: 3,
  enableRetryLogging: true,

  // Rate limit warning callback
  onRateLimitWarning: (usage) => {
    console.warn(`⚠️ Rate limit: ${usage.dailyQuotaUsedPercent}% daily quota used`)
    // Send alert to monitoring service
  },

  // Retry attempt callback
  onRetry: (attempts) => {
    console.log(`Retry attempt ${attempts.length} for embedding generation`)
    // Track retry metrics
  }
})

const result = await embeddingService.generateEmbedding(text)
```

### Example 2: Knowledge Graph Builder with Database Retry

```typescript
import { withDatabaseTransaction } from '@/lib/retry/database-retry'
import { prisma } from '@/lib/prisma'

async function buildKnowledgeGraph(concepts: Concept[]) {
  return withDatabaseTransaction(
    prisma,
    async (tx) => {
      // Create all concepts
      const conceptRecords = await Promise.all(
        concepts.map(concept =>
          tx.concept.create({
            data: {
              name: concept.name,
              description: concept.description,
              category: concept.category,
              embedding: concept.embedding,
            }
          })
        )
      )

      // Create relationships
      const relationships = []
      for (const concept of concepts) {
        for (const relatedId of concept.relatedIds) {
          relationships.push({
            fromConceptId: concept.id,
            toConceptId: relatedId,
            relationship: 'RELATED',
            strength: 0.8,
          })
        }
      }

      await tx.conceptRelationship.createMany({ data: relationships })

      return {
        concepts: conceptRecords.length,
        relationships: relationships.length
      }
    },
    'build-knowledge-graph'
  )
}
```

### Example 3: Search Service with Multiple Retry Strategies

```typescript
import { retryService, DEFAULT_POLICIES } from '@/lib/retry/retry-service'
import { withDatabaseRetry } from '@/lib/retry/database-retry'

class SemanticSearchService {
  async search(query: string, userId: string) {
    // 1. Generate query embedding with Gemini API retry
    const embeddingResult = await retryService.execute(
      async () => await this.embeddingService.generateEmbedding(query),
      DEFAULT_POLICIES.GEMINI_API,
      'search-embedding'
    )

    if (embeddingResult.error) {
      throw new Error('Failed to generate query embedding')
    }

    const queryEmbedding = embeddingResult.value!

    // 2. Search database with retry
    const results = await withDatabaseRetry(
      async () => {
        return prisma.$queryRaw`
          SELECT id, content, embedding <=> ${queryEmbedding}::vector AS similarity
          FROM content_chunks
          WHERE userId = ${userId}
          ORDER BY similarity ASC
          LIMIT 10
        `
      },
      'vector-search'
    )

    // 3. Log search query with retry
    await withDatabaseRetry(
      async () => {
        return prisma.searchQuery.create({
          data: {
            userId,
            query,
            resultCount: results.length,
            topResultId: results[0]?.id,
            timestamp: new Date(),
          }
        })
      },
      'log-search-query'
    )

    return results
  }
}
```

## Testing

### Running Tests

```bash
# Run all retry tests
pnpm test src/lib/retry/__tests__/

# Run specific test file
pnpm test retry-service.test.ts

# Watch mode
pnpm test:watch retry-service.test.ts
```

### Test Coverage

- **retry-service.test.ts** - Core retry logic, circuit breaker, error categorization
- **database-retry.test.ts** - Database wrappers, transactions, batch operations

### Mocking Retry Behavior

```typescript
import { vi } from 'vitest'
import { retryService } from '@/lib/retry/retry-service'

// Mock operation with controlled failures
const operation = vi.fn()
  .mockRejectedValueOnce(new Error('Transient error'))
  .mockRejectedValueOnce(new Error('Rate limit'))
  .mockResolvedValue('success')

const result = await retryService.execute(
  operation,
  { maxAttempts: 3 },
  'test-operation'
)

expect(result.attempts).toBe(3)
expect(result.value).toBe('success')
```

## Monitoring & Observability

### Logging

All retry operations log to console:

```
[RetryService] gemini-embedding attempt 1/3 failed: Rate limit exceeded (TRANSIENT)
[RetryService] Retrying gemini-embedding in 1234ms...
[RetryService] Circuit breaker OPENING for chatmock-extraction after 3 failures. Next attempt at 2025-10-17T12:00:00Z
[DatabaseRetry] Processing batch 2/10 for update-embeddings
```

### Circuit Breaker Alerts

Monitor circuit breaker states:

```typescript
// Periodic circuit health check
setInterval(() => {
  const operations = ['gemini-embedding', 'chatmock-extraction', 'db:vector-search']

  operations.forEach(op => {
    const state = retryService.getCircuitState(op)
    if (state && state.state !== 'CLOSED') {
      console.error(`⚠️ Circuit breaker ${state.state} for ${op}`)
      // Send alert to monitoring service (DataDog, Sentry, etc.)
    }
  })
}, 60000) // Check every minute
```

### Metrics Collection

Track retry metrics:

```typescript
const metrics = {
  totalAttempts: 0,
  successfulRetries: 0,
  failedRetries: 0,
  circuitBreakerTrips: 0,
}

// Wrap retryService.execute to collect metrics
async function executeWithMetrics<T>(
  operation: () => Promise<T>,
  policy: RetryPolicy,
  operationName: string
) {
  const result = await retryService.execute(operation, policy, operationName)

  metrics.totalAttempts += result.attempts

  if (result.value) {
    if (result.attempts > 1) {
      metrics.successfulRetries++
    }
  } else {
    metrics.failedRetries++
  }

  if (result.circuitBreakerTriggered) {
    metrics.circuitBreakerTrips++
  }

  return result
}
```

## Best Practices

### DO:
- ✅ Use default policies for common operations (Gemini, ChatMock, Database)
- ✅ Log retry attempts and circuit breaker state changes
- ✅ Monitor circuit breaker states in production
- ✅ Use transactions for multi-step database operations
- ✅ Add jitter to prevent thundering herd
- ✅ Respect Retry-After headers from APIs
- ✅ Test retry logic with mock failures

### DON'T:
- ❌ Retry permanent errors (401, 404, validation errors)
- ❌ Use retry for user-facing operations without timeout
- ❌ Disable circuit breaker in production
- ❌ Set maxAttempts too high (causes long delays)
- ❌ Ignore retry metadata (use for monitoring)
- ❌ Retry non-idempotent operations without safeguards

## Troubleshooting

### Issue: Operations failing after retries

**Symptoms:** All retry attempts exhausted, operation still fails

**Solutions:**
1. Check if error is permanent (shouldn't be retried)
2. Increase maxAttempts or maxDelayMs
3. Verify API credentials and rate limits
4. Check circuit breaker state (may be OPEN)

```typescript
// Debug retry behavior
const result = await retryService.execute(operation, policy, 'debug-op')
console.log('Retry history:', result.retryHistory)
console.log('Circuit state:', retryService.getCircuitState('debug-op'))
```

### Issue: Circuit breaker constantly open

**Symptoms:** Circuit breaker OPEN, blocking all requests

**Solutions:**
1. Investigate underlying service failures
2. Increase circuitBreakerThreshold
3. Reduce circuitBreakerTimeoutMs for faster recovery
4. Manually reset circuit after fixing root cause

```typescript
// Manually reset circuit
retryService.resetCircuit('operation-name')
```

### Issue: Slow retry performance

**Symptoms:** Retry delays too long, operations taking forever

**Solutions:**
1. Reduce initialDelayMs and maxDelayMs
2. Reduce maxAttempts
3. Disable jitter for faster (but less safe) retries
4. Check for exponential backoff multiplier too high

```typescript
const fasterPolicy = {
  maxAttempts: 2,
  initialDelayMs: 500,
  maxDelayMs: 2000,
  enableJitter: false,
}
```

### Issue: Database deadlocks not recovering

**Symptoms:** Database operations deadlocking repeatedly

**Solutions:**
1. Increase maxAttempts for database operations
2. Reduce transaction size
3. Reorder operations to avoid lock contention
4. Use batch operations with smaller batch sizes

```typescript
// Reduce batch size to avoid deadlocks
await withDatabaseBatch(operations, 'update-chunks', 25) // Smaller batches
```

## Performance Considerations

- **Gemini API**: 100 RPM, 1000 RPD limits enforced by EmbeddingService
- **ChatMock API**: No hard limits, but GPT-5 calls are expensive (2 min timeout)
- **Database**: Connection pool size limits concurrent operations
- **Circuit Breaker**: Prevents cascade failures, protects downstream services
- **Jitter**: Adds 0-30% randomness to delays (prevents thundering herd)

## References

- [Exponential Backoff - AWS Best Practices](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Retry Strategies - Google Cloud](https://cloud.google.com/iot/docs/how-tos/exponential-backoff)
- [Prisma Transaction Best Practices](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

## Support

For issues or questions:
1. Check test files for usage examples
2. Review existing integrations (GeminiClient, ChatMockClient)
3. Consult Epic 3 documentation in `/docs/stories/`

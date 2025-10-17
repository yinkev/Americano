# Epic 3 Error Type System

Comprehensive error handling for Knowledge Graph services with TypeScript type safety, discriminated unions, and production-ready patterns.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Error Categories](#error-categories)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Testing](#testing)

## Overview

The Epic 3 error type system provides:

- **Type-safe error handling** with discriminated unions
- **Retriable vs permanent error classification**
- **Rich metadata** for debugging and monitoring
- **HTTP status codes** for API responses
- **Sanitized serialization** for logging and API responses
- **Helper functions** for common error handling patterns

### Key Features

✅ **Discriminated Unions** - TypeScript can narrow error types based on error codes
✅ **Retriability Classification** - Know which errors can be retried
✅ **Metadata Sanitization** - Automatically redact sensitive information in API responses
✅ **Nested Error Support** - Wrap errors from external services
✅ **Exponential Backoff** - Built-in retry delay calculator
✅ **Production Ready** - Includes logging, monitoring, and circuit breaker patterns

## Architecture

```
Epic3Error (Base Class)
├── EmbeddingError
│   ├── EmbeddingRateLimitError (retriable)
│   ├── EmbeddingQuotaExceededError (retriable)
│   ├── EmbeddingInvalidInputError (permanent)
│   ├── EmbeddingNetworkError (retriable)
│   ├── EmbeddingAPIError (varies)
│   └── EmbeddingTimeoutError (retriable)
│
├── ExtractionError
│   ├── ExtractionModelOverloadError (retriable)
│   ├── ExtractionInvalidResponseError (permanent)
│   ├── ExtractionJSONParseError (permanent)
│   ├── ExtractionTimeoutError (retriable)
│   └── ExtractionSchemaValidationError (permanent)
│
├── SearchError
│   ├── SearchDatabaseError (retriable)
│   ├── SearchQueryTimeoutError (permanent)
│   ├── SearchEmbeddingFailedError (retriable)
│   ├── SearchInvalidQueryError (permanent)
│   └── SearchNoResultsError (permanent)
│
└── GraphBuildError
    ├── GraphConceptExtractionFailedError (retriable)
    ├── GraphRelationshipDetectionFailedError (retriable)
    ├── GraphStorageError (retriable)
    ├── GraphInvalidInputError (permanent)
    └── GraphCycleDetectedError (permanent)
```

## Error Categories

### 1. Embedding Errors (Gemini API)

| Error Class | Retriable | HTTP Status | Use Case |
|-------------|-----------|-------------|----------|
| `EmbeddingRateLimitError` | ✅ Yes | 429 | Gemini API rate limit (100 RPM) |
| `EmbeddingQuotaExceededError` | ✅ Yes | 429 | Daily quota exceeded (1000 RPD) |
| `EmbeddingInvalidInputError` | ❌ No | 400 | Empty or invalid text |
| `EmbeddingNetworkError` | ✅ Yes | 503 | Network connectivity issues |
| `EmbeddingAPIError` | Varies | Varies | Gemini API errors |
| `EmbeddingTimeoutError` | ✅ Yes | 504 | Request timeout |

### 2. Extraction Errors (ChatMock/GPT)

| Error Class | Retriable | HTTP Status | Use Case |
|-------------|-----------|-------------|----------|
| `ExtractionModelOverloadError` | ✅ Yes | 503 | Model temporarily unavailable |
| `ExtractionInvalidResponseError` | ❌ No | 500 | Response doesn't match schema |
| `ExtractionJSONParseError` | ❌ No | 500 | Invalid JSON in response |
| `ExtractionTimeoutError` | ✅ Yes | 504 | Extraction timeout |
| `ExtractionSchemaValidationError` | ❌ No | 500 | Data fails validation |

### 3. Search Errors

| Error Class | Retriable | HTTP Status | Use Case |
|-------------|-----------|-------------|----------|
| `SearchDatabaseError` | ✅ Yes | 500 | Database query failure |
| `SearchQueryTimeoutError` | ❌ No | 504 | Query too complex |
| `SearchEmbeddingFailedError` | ✅ Yes | 500 | Embedding generation failed |
| `SearchInvalidQueryError` | ❌ No | 400 | Invalid search query |
| `SearchNoResultsError` | ❌ No | 404 | No results found |

### 4. Graph Build Errors

| Error Class | Retriable | HTTP Status | Use Case |
|-------------|-----------|-------------|----------|
| `GraphConceptExtractionFailedError` | ✅ Yes | 500 | Partial concept extraction failure |
| `GraphRelationshipDetectionFailedError` | ✅ Yes | 500 | Partial relationship failure |
| `GraphStorageError` | ✅ Yes | 500 | Database storage error |
| `GraphInvalidInputError` | ❌ No | 400 | Invalid graph input |
| `GraphCycleDetectedError` | ❌ No | 400 | Circular dependency |

## Installation

The error system is already included in the Epic 3 codebase:

```typescript
import {
  // Error classes
  EmbeddingRateLimitError,
  SearchEmbeddingFailedError,
  // Type guards
  isRetriableError,
  isEmbeddingError,
  // Helpers
  calculateRetryDelay,
  serializeErrorForLogging,
} from '@/lib/errors'
```

## Usage

### Basic Error Throwing

```typescript
import { EmbeddingInvalidInputError } from '@/lib/errors'

function validateText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new EmbeddingInvalidInputError('Text cannot be empty')
  }

  if (text.length > 10000) {
    throw new EmbeddingInvalidInputError(
      'Text exceeds maximum length',
      { maxLength: 10000, actualLength: text.length }
    )
  }
}
```

### Error Handling with Type Guards

```typescript
import { isRetriableError, isEmbeddingError } from '@/lib/errors'

try {
  await generateEmbedding(text)
} catch (error) {
  if (isRetriableError(error)) {
    console.log('Error can be retried')
    const delay = calculateRetryDelay(attemptNumber)
    await sleep(delay)
    return retry()
  }

  if (isEmbeddingError(error)) {
    // TypeScript knows error is EmbeddingError
    console.error('Embedding error:', error.code)
  }

  throw error // Not retriable, propagate
}
```

### Retry Logic with Exponential Backoff

```typescript
import { calculateRetryDelay, isRetriableError } from '@/lib/errors'

async function generateWithRetry(
  text: string,
  maxRetries: number = 3
): Promise<number[]> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await generateEmbedding(text)
    } catch (error) {
      lastError = error as Error

      // Don't retry if error is permanent
      if (!isRetriableError(error)) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Calculate exponential backoff with jitter
      const delay = calculateRetryDelay(attempt)
      console.log(`Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}
```

### API Route Error Handling

```typescript
import { isEpic3Error, serializeErrorForLogging } from '@/lib/errors'

export async function POST(request: Request): Promise<Response> {
  try {
    const result = await performSearch(query)

    return Response.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (isEpic3Error(error)) {
      // Log with full details
      console.error('Search error:', serializeErrorForLogging(error))

      // Return sanitized response (no stack trace, redacted secrets)
      return Response.json(
        error.toAPIResponse(),
        { status: error.httpStatus }
      )
    }

    // Unknown error
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
```

### Nested Errors

```typescript
import { SearchEmbeddingFailedError, EmbeddingRateLimitError } from '@/lib/errors'

async function performSearch(query: string): Promise<any[]> {
  try {
    const embedding = await generateEmbedding(query)
    return await vectorSearch(embedding)
  } catch (error) {
    if (error instanceof EmbeddingRateLimitError) {
      // Wrap and provide context about fallback availability
      throw new SearchEmbeddingFailedError(
        error,
        true, // Fallback to keyword search available
        { fallbackStrategy: 'keyword_search' }
      )
    }
    throw error
  }
}
```

### Partial Failure Handling

```typescript
import { GraphConceptExtractionFailedError } from '@/lib/errors'

async function processBatch(
  chunks: string[],
  maxFailureRate: number = 0.1
): Promise<any[]> {
  const concepts: any[] = []
  const errors: Error[] = []
  const failedIndices: number[] = []

  for (let i = 0; i < chunks.length; i++) {
    try {
      const extracted = await extractConcepts(chunks[i])
      concepts.push(...extracted)
    } catch (error) {
      errors.push(error as Error)
      failedIndices.push(i)

      // Check if failure rate is too high
      const currentRate = failedIndices.length / (i + 1)
      if (currentRate > maxFailureRate) {
        throw new GraphConceptExtractionFailedError(
          failedIndices.length,
          i + 1,
          errors,
          { maxFailureRate, currentRate }
        )
      }
    }
  }

  return concepts
}
```

## API Reference

### Base Class: `Epic3Error`

All Epic 3 errors extend this base class.

#### Properties

- `code: ErrorCode` - Error code for categorization
- `retriable: boolean` - Whether error can be retried
- `httpStatus: number` - HTTP status code for API responses
- `metadata: Record<string, any>` - Additional debugging information
- `timestamp: Date` - When error occurred

#### Methods

- `toJSON()` - Full serialization with stack trace (for logging)
- `toAPIResponse()` - Sanitized response (for API endpoints)

### Type Guards

```typescript
// Check if error is retriable
function isRetriableError(error: unknown): boolean

// Check error category
function isEmbeddingError(error: unknown): error is EmbeddingError
function isExtractionError(error: unknown): error is ExtractionError
function isSearchError(error: unknown): error is SearchError
function isGraphBuildError(error: unknown): error is GraphBuildError
function isEpic3Error(error: unknown): error is AllEpic3Errors

// Get error category
function getErrorCategory(error: unknown): 'embedding' | 'extraction' | 'search' | 'graph' | 'unknown'
```

### Helper Functions

```typescript
// Calculate retry delay with exponential backoff
function calculateRetryDelay(
  attemptNumber: number,
  baseDelayMs?: number,
  maxDelayMs?: number
): number

// Serialize error for logging
function serializeErrorForLogging(error: unknown): Record<string, any>

// Wrap unknown errors as Epic3Error
function wrapUnknownError(
  error: unknown,
  category: 'embedding' | 'extraction' | 'search' | 'graph'
): Epic3Error
```

## Best Practices

### 1. Always Use Type Guards

```typescript
// ✅ Good
if (isRetriableError(error)) {
  return retry()
}

// ❌ Bad
if (error.retriable) { // TypeScript error: 'retriable' might not exist
  return retry()
}
```

### 2. Include Rich Metadata

```typescript
// ✅ Good
throw new EmbeddingInvalidInputError('Text too long', {
  maxLength: 10000,
  actualLength: text.length,
  userId: currentUser.id,
  source: 'lecture_notes',
})

// ❌ Bad
throw new EmbeddingInvalidInputError('Text too long')
```

### 3. Sanitize Sensitive Data

The error system automatically sanitizes sensitive keys in API responses:

```typescript
const error = new EmbeddingAPIError(401, 'Unauthorized', {
  apiKey: 'secret-123',      // Redacted in toAPIResponse()
  userId: 'user-456',        // Not redacted
})

// toJSON() - Full data for logging
error.toJSON().metadata.apiKey // 'secret-123'

// toAPIResponse() - Sanitized for API
error.toAPIResponse().error.metadata.apiKey // '[REDACTED]'
```

### 4. Log Appropriately

```typescript
import { serializeErrorForLogging, isRetriableError } from '@/lib/errors'

function logError(error: unknown): void {
  const serialized = serializeErrorForLogging(error)

  if (isRetriableError(error)) {
    // Retriable errors are warnings (expected to recover)
    console.warn('[RETRIABLE]', serialized)
  } else {
    // Permanent errors need investigation
    console.error('[PERMANENT]', serialized)
  }
}
```

### 5. Use Circuit Breaker Pattern

Prevent cascading failures when a service is down:

```typescript
import { CircuitBreaker } from '@/lib/errors.examples'

const breaker = new CircuitBreaker(5, 60000) // 5 failures, 1min cooldown

async function callExternalAPI(): Promise<any> {
  return breaker.execute(async () => {
    return await fetch('/api/external')
  })
}
```

### 6. Handle Partial Failures Gracefully

```typescript
// ✅ Good - Continue processing, collect errors
const results = await Promise.allSettled(
  items.map(item => processItem(item))
)

const successCount = results.filter(r => r.status === 'fulfilled').length
const failureRate = 1 - (successCount / items.length)

if (failureRate > 0.1) {
  throw new GraphConceptExtractionFailedError(/* ... */)
}

// ❌ Bad - Fail fast on first error
for (const item of items) {
  await processItem(item) // Stops on first failure
}
```

## Testing

### Unit Tests

```typescript
import { EmbeddingRateLimitError, isRetriableError } from '@/lib/errors'

describe('EmbeddingRateLimitError', () => {
  it('should be retriable', () => {
    const error = new EmbeddingRateLimitError(60, 'minute')
    expect(isRetriableError(error)).toBe(true)
  })

  it('should include retry metadata', () => {
    const error = new EmbeddingRateLimitError(60, 'minute')
    expect(error.metadata.retryAfterSeconds).toBe(60)
    expect(error.metadata.limitType).toBe('minute')
  })
})
```

### Integration Tests

```typescript
import { generateWithRetry } from './embedding-service'

describe('Retry Logic', () => {
  it('should retry on retriable errors', async () => {
    let attempts = 0

    const mockFn = jest.fn(async () => {
      attempts++
      if (attempts < 3) {
        throw new EmbeddingRateLimitError(1, 'minute')
      }
      return [1, 2, 3]
    })

    const result = await generateWithRetry('test', 3)

    expect(attempts).toBe(3)
    expect(result).toEqual([1, 2, 3])
  })

  it('should not retry on permanent errors', async () => {
    let attempts = 0

    const mockFn = jest.fn(async () => {
      attempts++
      throw new EmbeddingInvalidInputError('Empty text')
    })

    await expect(generateWithRetry('', 3)).rejects.toThrow()
    expect(attempts).toBe(1) // Only tried once
  })
})
```

## Examples

See `/src/lib/errors.examples.ts` for comprehensive usage examples including:

- Retry logic with exponential backoff
- Batch processing with partial failures
- API route error handling
- Error monitoring and alerting
- Circuit breaker pattern
- Type-safe error handling

## Related Documentation

- [Embedding Service](/src/lib/embedding-service.ts) - Uses error system for API calls
- [Search Analytics Service](/src/lib/search-analytics-service.ts) - Graceful error handling
- [API Error Handling](/src/lib/api-error.ts) - Generic HTTP error handling

## License

Part of the Americano Epic 3 Knowledge Graph implementation.

# Result Type Pattern - Epic 3 Error Handling

**Epic 3 - Knowledge Graph - Error Handling Enhancement**

## Overview

The Result type pattern replaces silent failures (returning empty arrays, null values) with explicit success/failure states. This provides type-safe error handling without throwing exceptions, making error paths explicit and forcing callers to handle errors.

## Problem: Silent Failures

### Before (Silent Failure)
```typescript
async extractConcepts(): Promise<Concept[]> {
  try {
    return await fetchConcepts()
  } catch (error) {
    console.error(error)
    return [] // Silent failure - caller doesn't know this failed!
  }
}

// Usage - error silently swallowed
const concepts = await service.extractConcepts()
// Is concepts empty because there were no concepts, or because extraction failed?
```

### After (Explicit Result)
```typescript
async extractConcepts(): Promise<Result<Concept[], ExtractionError>> {
  try {
    const concepts = await fetchConcepts()
    return ok(concepts)
  } catch (error) {
    return err(new ExtractionError('Failed to extract concepts', error, true))
  }
}

// Usage - must handle success and failure explicitly
const result = await service.extractConcepts()
if (isOk(result)) {
  console.log(`Extracted ${result.value.length} concepts`)
} else {
  console.error(`Extraction failed: ${result.error.message}`)
  if (result.error.retriable) {
    // Retry logic
  }
}
```

## Core Type: Result<T, E>

```typescript
type Result<T, E extends BaseError = BaseError> =
  | { success: true; value: T }
  | { success: false; error: E }
```

**TypeScript Discriminated Union:**
- `success` field is the discriminant
- TypeScript narrows types based on `success` value
- Prevents accessing `error` on success or `value` on failure

## Error Classes

### BaseError
Base class for all Result errors:
```typescript
class BaseError extends Error {
  retriable: boolean        // Can this operation be retried?
  cause?: unknown          // Original error that caused this
  context?: Record<string, unknown> // Additional debug metadata
}
```

### EmbeddingError
Used by `EmbeddingService`:
```typescript
enum EmbeddingErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  EMPTY_EMBEDDING = 'EMPTY_EMBEDDING',
  DIMENSION_MISMATCH = 'DIMENSION_MISMATCH',
}

const error = new EmbeddingError(
  'Rate limit exceeded',
  EmbeddingErrorCode.RATE_LIMIT_EXCEEDED,
  { retriable: true }
)
```

### ExtractionError
Used by `KnowledgeGraphBuilder`:
```typescript
enum ExtractionErrorCode {
  CHATMOCK_API_ERROR = 'CHATMOCK_API_ERROR',
  INVALID_JSON_RESPONSE = 'INVALID_JSON_RESPONSE',
  NO_CONCEPTS_EXTRACTED = 'NO_CONCEPTS_EXTRACTED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

const error = new ExtractionError(
  'Invalid JSON response',
  ExtractionErrorCode.INVALID_JSON_RESPONSE,
  { retriable: false, partialCount: 5 }
)
```

### SearchError
Used by `SemanticSearchService`:
```typescript
enum SearchErrorCode {
  VECTOR_SEARCH_FAILED = 'VECTOR_SEARCH_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_QUERY = 'INVALID_QUERY',
  EMBEDDING_GENERATION_FAILED = 'EMBEDDING_GENERATION_FAILED',
  NO_RESULTS = 'NO_RESULTS',
}

const error = new SearchError(
  'Failed to generate query embedding',
  SearchErrorCode.EMBEDDING_GENERATION_FAILED,
  { retriable: true, query: 'cardiac conduction' }
)
```

### RelationshipError
Used for knowledge graph relationship operations:
```typescript
enum RelationshipErrorCode {
  INVALID_CONCEPTS = 'INVALID_CONCEPTS',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SIMILARITY_CALCULATION_FAILED = 'SIMILARITY_CALCULATION_FAILED',
}
```

## Helper Functions

### Creating Results

```typescript
// Success
const result = ok([concept1, concept2, concept3])
// Result<Concept[], never>

// Failure
const result = err(new ExtractionError('Failed', ExtractionErrorCode.DATABASE_ERROR))
// Result<never, ExtractionError>
```

### Type Guards

```typescript
const result = await service.extractConcepts()

if (isOk(result)) {
  // TypeScript knows result.value is available
  console.log(result.value)
}

if (isErr(result)) {
  // TypeScript knows result.error is available
  console.error(result.error.message)
}
```

### Unwrapping

```typescript
// 1. unwrap() - throws if error (USE WITH CAUTION)
const concepts = unwrap(result) // May throw

// 2. unwrapOr() - safe, never throws
const concepts = unwrapOr(result, []) // Default to empty array

// 3. unwrapOrElse() - lazy computation
const concepts = unwrapOrElse(result, (error) => {
  console.error('Failed:', error.message)
  return []
})
```

### Transforming

```typescript
// Map over success value
const dimensionsResult = map(result, (embedding) => embedding.length)
// Result<number, EmbeddingError>

// Map over error
const enhancedResult = mapErr(result, (error) =>
  new SearchError(`Enhanced: ${error.message}`, error.code, { cause: error })
)
```

### Chaining

```typescript
// Chain async operations
const result = await andThen(
  await service.extractConcepts(chunk),
  async (concepts) => await service.storeConcepts(concepts)
)
// Automatically handles error propagation
```

## Batch Operations

### Combine (Fail Fast)

```typescript
const results = await Promise.all([
  service.extractConcepts(chunk1),
  service.extractConcepts(chunk2),
  service.extractConcepts(chunk3),
])

const combined = combine(results)
// Returns Ok with array of all values if all succeeded
// Returns first Err if any failed
```

### Partition (Partial Failures)

```typescript
const results = await Promise.all(
  chunks.map(chunk => service.extractConcepts(chunk))
)

const { successes, failures } = partition(results)
console.log(`Success: ${successes.length}, Failed: ${failures.length}`)

// Process partial results
await processSuccessfulConcepts(successes)

// Log failures
failures.forEach(error => logger.error(error.toJSON()))
```

## Retry Pattern

```typescript
const result = await retry(
  async () => await service.generateEmbedding(text),
  {
    maxAttempts: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 30000,
    shouldRetry: (error) =>
      error.retriable && error.code !== EmbeddingErrorCode.INVALID_INPUT
  }
)
```

## Promise Conversion

### From Promise to Result

```typescript
// Convert existing Promise-based API
const result = await fromPromise(
  fetch('/api/data'),
  (error) => new SearchError(
    'API fetch failed',
    SearchErrorCode.NETWORK_ERROR,
    { retriable: true, cause: error }
  )
)
```

### From Result to Promise

```typescript
// Use with existing Promise-based code
const result = await service.extractConcepts(chunk)
const concepts = await toPromise(result)
// Throws if extraction failed
```

## Error Logging

```typescript
if (isErr(result)) {
  const error = result.error

  // Structured error logging
  console.error('Operation failed:', {
    message: error.message,
    code: error.code,
    retriable: error.retriable,
    context: error.context,
  })

  // JSON serialization for logging services
  logger.error('Error details:', error.toJSON())

  // Check specific error codes
  if (error.code === EmbeddingErrorCode.RATE_LIMIT_EXCEEDED) {
    // Handle rate limit
  }
}
```

## Usage Examples

### Example 1: Embedding Service

```typescript
async function generateEmbedding(text: string): Promise<Result<number[], EmbeddingError>> {
  if (!text || text.trim().length === 0) {
    return err(
      new EmbeddingError(
        'Empty text provided',
        EmbeddingErrorCode.INVALID_INPUT,
        { retriable: false }
      )
    )
  }

  try {
    const embedding = await geminiClient.generateEmbedding(text)
    return ok(embedding)
  } catch (error) {
    if (isRateLimitError(error)) {
      return err(
        new EmbeddingError(
          'Rate limit exceeded',
          EmbeddingErrorCode.RATE_LIMIT_EXCEEDED,
          { retriable: true, cause: error }
        )
      )
    }

    return err(
      new EmbeddingError(
        'API error',
        EmbeddingErrorCode.API_ERROR,
        { retriable: false, cause: error }
      )
    )
  }
}
```

### Example 2: Graph Builder

```typescript
async function extractConcepts(
  chunks: Array<{ id: string; content: string }>
): Promise<Result<Concept[], ExtractionError>> {
  const concepts: Concept[] = []

  for (const chunk of chunks) {
    const result = await extractConceptsFromChunk(chunk)

    if (isErr(result)) {
      // Log but continue processing other chunks
      console.error(`Failed chunk ${chunk.id}:`, result.error.message)

      // If error is not retriable, fail fast
      if (!result.error.retriable) {
        return result
      }
      continue
    }

    concepts.push(...result.value)
  }

  if (concepts.length === 0) {
    return err(
      new ExtractionError(
        'No concepts extracted',
        ExtractionErrorCode.NO_CONCEPTS_EXTRACTED,
        { retriable: false }
      )
    )
  }

  return ok(concepts)
}
```

### Example 3: Search Service

```typescript
async function search(query: string): Promise<Result<SearchResults, SearchError>> {
  if (!query || query.trim().length === 0) {
    return err(
      new SearchError(
        'Empty query',
        SearchErrorCode.INVALID_QUERY,
        { retriable: false, query }
      )
    )
  }

  // Generate embedding
  const embeddingResult = await generateQueryEmbedding(query)
  if (isErr(embeddingResult)) {
    return err(
      new SearchError(
        'Failed to generate query embedding',
        SearchErrorCode.EMBEDDING_GENERATION_FAILED,
        {
          retriable: embeddingResult.error.retriable,
          cause: embeddingResult.error,
          query
        }
      )
    )
  }

  // Execute vector search
  const searchResult = await executeVectorSearch(embeddingResult.value)
  if (isErr(searchResult)) {
    return searchResult
  }

  return ok(searchResult.value)
}
```

## Benefits

### 1. Type Safety
TypeScript enforces handling of both success and failure cases:
```typescript
const result = await service.extractConcepts()
// TypeScript error if you don't check success/error
result.value // Error: Property 'value' does not exist on type Result
```

### 2. Explicit Error Handling
No more silent failures or swallowed errors:
```typescript
// Before: Silent failure
const concepts = await service.extractConcepts() // Always returns array

// After: Explicit handling required
const result = await service.extractConcepts()
if (isOk(result)) {
  // Handle success
} else {
  // MUST handle error
}
```

### 3. Retriable vs Permanent Errors
Clear distinction between transient and permanent failures:
```typescript
if (isErr(result)) {
  if (result.error.retriable) {
    // Can retry (network error, rate limit)
    await retry(operation)
  } else {
    // Permanent error (invalid input, auth failure)
    logError(result.error)
  }
}
```

### 4. Rich Error Context
Errors carry detailed metadata for debugging:
```typescript
const error = new ExtractionError(
  'Failed to extract concepts',
  ExtractionErrorCode.CHATMOCK_API_ERROR,
  {
    retriable: true,
    cause: apiError,
    context: {
      chunkId: 'chunk-123',
      attemptNumber: 3,
      timestamp: Date.now()
    }
  }
)
```

### 5. Composability
Easy to chain operations and handle errors at the right level:
```typescript
const result = await andThen(
  await extractConcepts(chunk),
  async (concepts) => await andThen(
    await generateEmbeddings(concepts),
    async (embeddings) => await storeConcepts(concepts, embeddings)
  )
)
// Single error handling point for entire pipeline
```

## When to Use Result Type

### Use Result Type When:
- ❌ Operation can fail in expected ways (API errors, validation failures)
- ❌ Caller needs to know WHY operation failed (not just that it failed)
- ❌ Some failures are retriable, others are permanent
- ❌ Silent failures would cause bugs (returning empty arrays/null)

### Don't Use Result Type When:
- ✅ Operation genuinely never fails (pure computations)
- ✅ Failures are truly exceptional (programmer errors, should crash)
- ✅ Existing code uses Promises and you can't refactor (use `fromPromise` converter)

## Migration Strategy

### Step 1: Add Result types to new code
```typescript
// New functions use Result
async function newFunction(): Promise<Result<Data, Error>> {
  // ...
}
```

### Step 2: Convert high-value existing functions
```typescript
// Convert functions where silent failures cause bugs
async function extractConcepts(): Promise<Result<Concept[], ExtractionError>> {
  // Previously returned []
}
```

### Step 3: Use adapters for compatibility
```typescript
// Convert Result to Promise for legacy callers
const legacyFunction = async () => {
  const result = await newFunction()
  return toPromise(result) // Throws if error
}

// Convert Promise to Result for new callers
const newFunction = async () => {
  return fromPromise(
    legacyFunction(),
    (error) => new CustomError('Failed', ERROR_CODE, { cause: error })
  )
}
```

## Files

- **Implementation:** `/src/lib/result.ts`
- **Usage Examples:** `/src/lib/__examples__/result-usage.ts`
- **This Document:** `/src/lib/RESULT-PATTERN.md`

## References

- [Rust Result<T, E>](https://doc.rust-lang.org/std/result/) - Original inspiration
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/) - F# error handling pattern

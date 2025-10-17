# Logging Migration Example

> **Before/After Example: EmbeddingService**
> Shows concrete migration from console.log to structured logging

## File: `/src/lib/embedding-service.ts`

### ❌ BEFORE (Console Logging)

```typescript
export class EmbeddingService {
  private geminiClient: GeminiClient
  private config: Required<Omit<EmbeddingServiceConfig, 'onRateLimitWarning'>>
  private requestTimestamps: number[] = []
  private dailyRequestTimestamps: number[] = []

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      return {
        embedding: [],
        error: 'Empty text provided',
      }
    }

    await this.waitForDailyQuota()
    await this.waitForRateLimit()

    const now = Date.now()
    this.requestTimestamps.push(now)
    this.dailyRequestTimestamps.push(now)

    this.checkRateLimitWarning()

    return await this.geminiClient.generateEmbedding(text)
  }

  private async waitForDailyQuota(): Promise<void> {
    const now = Date.now()
    const oneDayAgo = now - 86400000

    this.dailyRequestTimestamps = this.dailyRequestTimestamps.filter(
      (timestamp) => timestamp > oneDayAgo
    )

    if (this.dailyRequestTimestamps.length >= this.config.maxRequestsPerDay) {
      const oldestRequest = this.dailyRequestTimestamps[0]
      const waitTime = oldestRequest + 86400000 - now

      if (waitTime > 0) {
        const hoursToWait = Math.ceil(waitTime / 3600000)
        // ❌ PII exposed, no structured metadata
        console.error(
          `⚠️ GEMINI API DAILY QUOTA REACHED (${this.config.maxRequestsPerDay} RPD)! Waiting ${hoursToWait}h...`
        )
        await this.delay(waitTime)
      }
    }
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    )

    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0]
      const waitTime = oldestRequest + 60000 - now

      if (waitTime > 0) {
        // ❌ Not parsable, no correlation ID
        console.warn(
          `⚠️ Rate limit reached (${this.config.maxRequestsPerMinute} RPM). Waiting ${Math.ceil(waitTime / 1000)}s...`
        )
        await this.delay(waitTime)
      }
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const embeddings: number[][] = []
    const errors = new Map<number, string>()
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize)
      const batchStartIndex = i

      const batchResults = await Promise.all(
        batch.map(async (text, batchIndex) => {
          const result = await this.generateEmbedding(text)
          const originalIndex = batchStartIndex + batchIndex

          if (result.error) {
            errors.set(originalIndex, result.error)
            failureCount++
            return []
          } else {
            successCount++
            return result.embedding
          }
        })
      )

      embeddings.push(...batchResults)

      if (i + this.config.batchSize < texts.length) {
        await this.delay(1000)
      }
    }

    return {
      embeddings,
      errors,
      successCount,
      failureCount,
    }
  }
}
```

---

### ✅ AFTER (Structured Logging)

```typescript
import { createServiceLogger } from '@/lib/logger-middleware'
import { createBatchLogger } from '@/lib/logger-middleware'

export class EmbeddingService {
  private geminiClient: GeminiClient
  private config: Required<Omit<EmbeddingServiceConfig, 'onRateLimitWarning'>>
  private requestTimestamps: number[] = []
  private dailyRequestTimestamps: number[] = []

  // ✅ Service-specific logger with automatic service context
  private logger = createServiceLogger('embedding-service')

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // ✅ Structured validation error
    if (!text || text.trim().length === 0) {
      this.logger.warn('Empty text provided for embedding generation', {
        operation: 'generateEmbedding',
        textLength: 0,
      })

      return {
        embedding: [],
        error: 'Empty text provided',
      }
    }

    // ✅ Log operation start with metadata
    this.logger.debug('Generating embedding', {
      textLength: text.length,
      operation: 'generateEmbedding',
    })

    const startTime = Date.now()

    await this.waitForDailyQuota()
    await this.waitForRateLimit()

    const now = Date.now()
    this.requestTimestamps.push(now)
    this.dailyRequestTimestamps.push(now)

    this.checkRateLimitWarning()

    try {
      const result = await this.geminiClient.generateEmbedding(text)

      // ✅ Log successful embedding with performance metrics
      this.logger.embedding(
        'generateEmbedding',
        text.length,
        Date.now() - startTime,
        {
          embeddingDimensions: result.embedding.length,
          success: true,
        }
      )

      return result

    } catch (error) {
      // ✅ Structured error logging with full context
      this.logger.error('Embedding generation failed', {
        error,
        textLength: text.length,
        duration: Date.now() - startTime,
        operation: 'generateEmbedding',
      })

      throw error
    }
  }

  private async waitForDailyQuota(): Promise<void> {
    const now = Date.now()
    const oneDayAgo = now - 86400000

    this.dailyRequestTimestamps = this.dailyRequestTimestamps.filter(
      (timestamp) => timestamp > oneDayAgo
    )

    if (this.dailyRequestTimestamps.length >= this.config.maxRequestsPerDay) {
      const oldestRequest = this.dailyRequestTimestamps[0]
      const waitTime = oldestRequest + 86400000 - now

      if (waitTime > 0) {
        const hoursToWait = Math.ceil(waitTime / 3600000)

        // ✅ Structured rate limit warning with proper metadata
        this.logger.rateLimit(
          'gemini-api-daily',
          this.config.maxRequestsPerDay,
          this.dailyRequestTimestamps.length,
          {
            waitTimeMs: waitTime,
            waitTimeHours: hoursToWait,
            quotaType: 'daily',
            severity: 'critical',
          }
        )

        await this.delay(waitTime)
      }
    }
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    )

    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0]
      const waitTime = oldestRequest + 60000 - now

      if (waitTime > 0) {
        const waitSeconds = Math.ceil(waitTime / 1000)

        // ✅ Structured rate limit with parsable metadata
        this.logger.rateLimit(
          'gemini-api-minute',
          this.config.maxRequestsPerMinute,
          this.requestTimestamps.length,
          {
            waitTimeMs: waitTime,
            waitTimeSeconds: waitSeconds,
            quotaType: 'per-minute',
            severity: 'warning',
          }
        )

        await this.delay(waitTime)
      }
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    // ✅ Create batch logger for progress tracking
    const batchLogger = createBatchLogger(
      'batch-embedding-generation',
      texts.length,
      this.logger
    )

    batchLogger.start()

    const embeddings: number[][] = []
    const errors = new Map<number, string>()
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize)
      const batchStartIndex = i
      const batchNumber = Math.floor(i / this.config.batchSize) + 1
      const totalBatches = Math.ceil(texts.length / this.config.batchSize)

      // ✅ Log batch start with metadata
      this.logger.debug('Processing batch', {
        batchNumber,
        totalBatches,
        batchSize: batch.length,
        operation: 'generateBatchEmbeddings',
      })

      const batchResults = await Promise.all(
        batch.map(async (text, batchIndex) => {
          const result = await this.generateEmbedding(text)
          const originalIndex = batchStartIndex + batchIndex

          if (result.error) {
            // ✅ Log individual failures with index
            this.logger.warn('Individual embedding failed', {
              index: originalIndex,
              error: result.error,
              textLength: text.length,
            })

            errors.set(originalIndex, result.error)
            failureCount++
            return []
          } else {
            successCount++
            return result.embedding
          }
        })
      )

      embeddings.push(...batchResults)

      // ✅ Update batch progress (throttled logging)
      batchLogger.progress(i + batch.length)

      if (i + this.config.batchSize < texts.length) {
        await this.delay(1000)
      }
    }

    // ✅ Log batch completion with comprehensive metrics
    batchLogger.complete(successCount, failureCount)

    return {
      embeddings,
      errors,
      successCount,
      failureCount,
    }
  }
}
```

---

## Key Improvements

### 1. Service Logger
```typescript
// ✅ All logs include service context automatically
private logger = createServiceLogger('embedding-service')

// Logs appear as:
// {"service":"embedding-service","level":"info","message":"..."}
```

### 2. Structured Metadata
```typescript
// ❌ Before: String interpolation
console.log(`Text length: ${text.length}`)

// ✅ After: Structured metadata
logger.debug('Processing text', { textLength: text.length })

// Output: {"level":"debug","message":"Processing text","textLength":1500}
```

### 3. Performance Tracking
```typescript
// ✅ Automatic duration tracking
const startTime = Date.now()
const result = await operation()
logger.embedding('operation', textLength, Date.now() - startTime)

// Output: {"operation":"operation","duration":125,"textLength":1500}
```

### 4. Error Context
```typescript
// ❌ Before: Minimal context
console.error('Failed')

// ✅ After: Full context
logger.error('Embedding generation failed', {
  error,
  textLength: text.length,
  duration: Date.now() - startTime,
  operation: 'generateEmbedding',
})

// Output includes: error stack, duration, text length, operation name
```

### 5. Rate Limit Tracking
```typescript
// ✅ Specialized rate limit logging
logger.rateLimit(
  'gemini-api-daily',
  limit,
  current,
  { waitTimeMs, quotaType: 'daily' }
)

// Output: {"service":"gemini-api-daily","limit":1000,"current":1000,"waitTimeMs":3600000}
```

### 6. Batch Progress
```typescript
// ✅ Throttled batch progress logging
const batchLogger = createBatchLogger('operation', totalItems)
batchLogger.start()

for (let i = 0; i < items.length; i++) {
  // Process item
  batchLogger.progress(i + 1)  // Only logs every 10 seconds
}

batchLogger.complete(successCount, failureCount)

// Output:
// {"message":"Batch operation started","totalItems":1000}
// {"message":"Batch progress","currentItem":100,"percentComplete":"10.0"}
// {"message":"Batch operation completed","successCount":950,"failureCount":50}
```

---

## Benefits

### For Development
- **Easier Debugging**: Structured metadata is searchable
- **Better Context**: See exactly what parameters caused errors
- **Performance Visibility**: Track slow operations automatically

### For Production
- **Log Aggregation**: JSON logs easily parsed by Datadog, CloudWatch, etc.
- **Request Tracing**: Correlation IDs link related logs
- **PII Compliance**: Automatic redaction prevents GDPR/HIPAA violations
- **Alerting**: Structured logs enable metric-based alerts

### For Operations
- **Troubleshooting**: Find all logs for a specific request via correlation ID
- **Metrics**: Track performance trends over time
- **Monitoring**: Set up alerts for rate limits, errors, slow operations

---

## Migration Checklist

For each service file:

- [ ] Import logger utilities
  ```typescript
  import { createServiceLogger } from '@/lib/logger-middleware'
  ```

- [ ] Create service logger
  ```typescript
  private logger = createServiceLogger('service-name')
  ```

- [ ] Replace `console.error()` with `logger.error()`
  ```typescript
  logger.error('Operation failed', { error, context })
  ```

- [ ] Replace `console.warn()` with `logger.warn()`
  ```typescript
  logger.warn('Warning condition', { details })
  ```

- [ ] Replace `console.log()` with `logger.info()` or `logger.debug()`
  ```typescript
  logger.info('Important event', { metadata })
  logger.debug('Diagnostic info', { details })
  ```

- [ ] Add performance tracking
  ```typescript
  const startTime = Date.now()
  // ... operation
  logger.performance('operation', Date.now() - startTime)
  ```

- [ ] Use batch logger for loops
  ```typescript
  const batchLogger = createBatchLogger('operation', items.length)
  batchLogger.start()
  // ... process items
  batchLogger.complete(success, failed)
  ```

- [ ] Test in development (verify logs appear)
- [ ] Test in production-like environment (verify JSON format)
- [ ] Remove old console statements

---

**Next File to Migrate**: `/src/lib/semantic-search-service.ts`

See: `/src/lib/LOGGING-GUIDE.md` for complete documentation

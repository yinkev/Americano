# Structured Logging Guide

> **Epic 3 - Observability Infrastructure**
> Production-grade structured logging with PII redaction

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Migration Guide](#migration-guide)
4. [API Reference](#api-reference)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [PII Redaction](#pii-redaction)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Features

- ✅ **Structured Logging** - JSON logs in production, readable logs in development
- ✅ **PII Redaction** - Automatic redaction of emails, phone numbers, medical PHI
- ✅ **Correlation IDs** - Request tracing across services
- ✅ **Performance Tracking** - Built-in timing and metrics
- ✅ **Environment-Aware** - Verbose in dev, optimized for prod
- ✅ **Type-Safe** - Full TypeScript support

### Why Structured Logging?

**Before (Console Logging):**
```typescript
console.log('Search query:', query, 'Results:', results.length)
// Output: Search query: cardiac conduction Results: 42
// ❌ Not parsable by log aggregation tools
// ❌ PII exposed in logs
// ❌ No request correlation
```

**After (Structured Logging):**
```typescript
logger.info('Search executed', { query, resultCount: results.length })
// Output: {"timestamp":"2024-10-17T10:30:00Z","level":"info","message":"Search executed","query":"sha256:a3f2b...","resultCount":42,"correlationId":"abc123"}
// ✅ Machine-parsable JSON
// ✅ PII automatically hashed
// ✅ Correlation ID for tracing
```

---

## Quick Start

### 1. Import the Logger

```typescript
import { logger } from '@/lib/logger'
```

### 2. Replace Console Statements

```typescript
// ❌ Old way
console.log('Processing started')
console.error('Failed:', error)

// ✅ New way
logger.info('Processing started')
logger.error('Processing failed', { error })
```

### 3. Add Correlation IDs to API Routes

```typescript
import { withLogging } from '@/lib/logger-middleware'

export async function GET(request: NextRequest) {
  return withLogging(request, async (req, logger, context) => {
    logger.info('Fetching data')

    const data = await fetchData()

    return NextResponse.json({ data })
  })
}
```

---

## Migration Guide

### Phase 1: Critical Paths (Week 1)

Replace `console.error()` in error handling:

```typescript
// ❌ Before
try {
  await operation()
} catch (error) {
  console.error('Operation failed:', error)
  throw error
}

// ✅ After
import { logger } from '@/lib/logger'

try {
  await operation()
} catch (error) {
  logger.error('Operation failed', { error, operation: 'fetchData' })
  throw error
}
```

**Files to migrate first:**
- `/src/lib/embedding-service.ts`
- `/src/lib/semantic-search-service.ts`
- `/src/subsystems/knowledge-graph/graph-builder.ts`
- `/src/app/api/search/route.ts`

### Phase 2: API Routes (Week 2)

Wrap all API routes with logging middleware:

```typescript
// ❌ Before
export async function POST(request: Request) {
  const body = await request.json()
  const result = await processData(body)
  return NextResponse.json(result)
}

// ✅ After
import { withLogging } from '@/lib/logger-middleware'

export async function POST(request: NextRequest) {
  return withLogging(request, async (req, logger, context) => {
    const body = await req.json()

    logger.info('Processing request', {
      bodySize: JSON.stringify(body).length
    })

    const result = await processData(body)

    logger.info('Request completed', {
      duration: Date.now() - context.startTime
    })

    return NextResponse.json(result)
  })
}
```

### Phase 3: Services (Week 3)

Create service-specific loggers:

```typescript
// ❌ Before
export class EmbeddingService {
  async generateEmbedding(text: string) {
    console.log('Generating embedding for text length:', text.length)
    // ...
  }
}

// ✅ After
import { createServiceLogger } from '@/lib/logger-middleware'

export class EmbeddingService {
  private logger = createServiceLogger('embedding-service')

  async generateEmbedding(text: string) {
    this.logger.embedding('generateEmbedding', text.length, 0)

    const startTime = Date.now()
    // ... generate embedding
    const duration = Date.now() - startTime

    this.logger.embedding('generateEmbedding', text.length, duration)
  }
}
```

### Phase 4: Complete Migration (Week 4)

Remove all remaining `console.log()` statements:

```bash
# Find remaining console statements
grep -r "console\." src/ --exclude-dir=node_modules --exclude-dir=.next
```

---

## API Reference

### Logger Methods

#### `logger.error(message, metadata?)`
Log error-level messages (always visible).

```typescript
logger.error('Database connection failed', {
  error,
  database: 'postgres',
  retryAttempt: 3
})
```

#### `logger.warn(message, metadata?)`
Log warnings (production + development).

```typescript
logger.warn('Rate limit approaching', {
  current: 80,
  limit: 100,
  service: 'gemini-api'
})
```

#### `logger.info(message, metadata?)`
Log informational messages (production + development).

```typescript
logger.info('Search completed', {
  query: 'cardiac conduction',  // Automatically hashed
  resultCount: 42,
  duration: 125
})
```

#### `logger.http(message, metadata?)`
Log HTTP requests/responses.

```typescript
logger.http('POST /api/search 200', {
  method: 'POST',
  path: '/api/search',
  statusCode: 200,
  duration: 125
})
```

#### `logger.debug(message, metadata?)`
Log debug information (development only).

```typescript
logger.debug('Cache hit', {
  key: 'search:diabetes',
  ttl: 3600
})
```

### Specialized Logging Methods

#### `logger.performance(operation, duration, metadata?)`
Log performance metrics.

```typescript
logger.performance('semantic-search', 125, {
  vectorCount: 1000,
  similarity: 0.85
})
```

#### `logger.search(query, resultCount, duration, metadata?)`
Log search operations (query is automatically hashed).

```typescript
logger.search('diabetes mellitus', 42, 125, {
  filters: ['highYield'],
  userId: 'user123'
})
```

#### `logger.embedding(operation, textLength, duration, metadata?)`
Log embedding generation.

```typescript
logger.embedding('batch-generate', 50000, 2500, {
  batchSize: 100,
  successCount: 95,
  failureCount: 5
})
```

#### `logger.graph(operation, nodeCount, duration, metadata?)`
Log graph operations.

```typescript
logger.graph('build-graph', 1500, 3200, {
  nodes: 1500,
  edges: 4200,
  orphans: 12
})
```

### Child Loggers

Create loggers with default metadata:

```typescript
const serviceLogger = logger.child({
  service: 'embedding-service',
  version: '1.0.0'
})

serviceLogger.info('Service started')
// All logs from serviceLogger will include service and version
```

### Middleware Functions

#### `withLogging(request, handler)`
Wrap API route handlers with automatic logging.

```typescript
export async function GET(request: NextRequest) {
  return withLogging(request, async (req, logger, context) => {
    // Your logic here
    // logger has correlationId automatically
    return NextResponse.json({ data })
  })
}
```

#### `withTiming(operation, fn, logger?)`
Time code execution.

```typescript
const results = await withTiming(
  'complex-operation',
  async () => {
    // Your code here
    return await complexOperation()
  },
  logger
)
// Automatically logs duration
```

#### `createBatchLogger(operation, totalItems, logger?)`
Log batch operation progress.

```typescript
const batchLogger = createBatchLogger('process-lectures', 1000)

batchLogger.start()

for (let i = 0; i < lectures.length; i++) {
  await processLecture(lectures[i])
  batchLogger.progress(i + 1)  // Throttled logging
}

batchLogger.complete(950, 50)  // 950 success, 50 failed
```

---

## Usage Examples

### Example 1: API Route with Logging

```typescript
// /src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withLogging } from '@/lib/logger-middleware'
import { searchService } from '@/lib/semantic-search-service'

export async function GET(request: NextRequest) {
  return withLogging(request, async (req, logger, context) => {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q') || ''

    if (!query) {
      logger.warn('Empty search query', { path: req.url })
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    logger.info('Search request received', {
      query,  // Automatically hashed
      filters: searchParams.get('filters')
    })

    try {
      const results = await searchService.search(query)

      logger.info('Search completed successfully', {
        resultCount: results.length,
        duration: Date.now() - context.startTime
      })

      return NextResponse.json({ results })

    } catch (error) {
      logger.error('Search failed', {
        error,
        query,
        duration: Date.now() - context.startTime
      })

      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }
  })
}
```

### Example 2: Service Class with Logger

```typescript
// /src/lib/embedding-service.ts
import { createServiceLogger } from '@/lib/logger-middleware'
import { createBatchLogger } from '@/lib/logger-middleware'

export class EmbeddingService {
  private logger = createServiceLogger('embedding-service')

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.debug('Generating embedding', {
      textLength: text.length
    })

    const startTime = Date.now()

    try {
      const embedding = await this.geminiClient.generateEmbedding(text)

      this.logger.embedding(
        'generate-single',
        text.length,
        Date.now() - startTime
      )

      return embedding

    } catch (error) {
      this.logger.error('Embedding generation failed', {
        error,
        textLength: text.length,
        duration: Date.now() - startTime
      })

      throw error
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const batchLogger = createBatchLogger(
      'batch-embedding-generation',
      texts.length,
      this.logger
    )

    batchLogger.start()

    const embeddings: number[][] = []
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < texts.length; i++) {
      try {
        const embedding = await this.generateEmbedding(texts[i])
        embeddings.push(embedding)
        successCount++
      } catch (error) {
        this.logger.error('Failed to generate embedding', {
          index: i,
          textLength: texts[i].length,
          error
        })
        failureCount++
      }

      batchLogger.progress(i + 1)
    }

    batchLogger.complete(successCount, failureCount)

    return embeddings
  }
}
```

### Example 3: Graph Builder with Performance Tracking

```typescript
// /src/subsystems/knowledge-graph/graph-builder.ts
import { logger } from '@/lib/logger'
import { withTiming } from '@/lib/logger-middleware'

export class GraphBuilder {
  private logger = logger.child({ service: 'graph-builder' })

  async buildGraph(concepts: Concept[]): Promise<Graph> {
    this.logger.info('Building knowledge graph', {
      conceptCount: concepts.length
    })

    // Build nodes
    const nodes = await withTiming(
      'build-nodes',
      async () => {
        return await this.buildNodes(concepts)
      },
      this.logger
    )

    // Build edges
    const edges = await withTiming(
      'build-edges',
      async () => {
        return await this.buildEdges(nodes)
      },
      this.logger
    )

    // Calculate metrics
    const metrics = this.calculateGraphMetrics(nodes, edges)

    this.logger.graph('build-complete', nodes.length, 0, {
      nodes: nodes.length,
      edges: edges.length,
      density: metrics.density,
      avgDegree: metrics.avgDegree
    })

    return { nodes, edges }
  }
}
```

### Example 4: Error Handling with Context

```typescript
// /src/lib/semantic-search-service.ts
import { logger } from '@/lib/logger'

export class SemanticSearchService {
  private logger = logger.child({ service: 'semantic-search' })

  async search(query: string, options?: SearchOptions) {
    const correlationId = options?.correlationId || 'unknown'
    const requestLogger = this.logger.child({ correlationId })

    requestLogger.info('Search initiated', {
      query,  // Automatically hashed
      options
    })

    try {
      // Generate embedding
      const embedding = await withTiming(
        'generate-query-embedding',
        async () => await this.embeddingService.generateEmbedding(query),
        requestLogger
      )

      // Vector search
      const results = await withTiming(
        'vector-search',
        async () => await this.vectorSearch(embedding, options),
        requestLogger
      )

      requestLogger.search(query, results.length, 0, {
        avgSimilarity: this.calculateAvgSimilarity(results),
        filters: options?.filters
      })

      return results

    } catch (error) {
      requestLogger.error('Search failed', {
        error,
        query,
        options,
        stack: error instanceof Error ? error.stack : undefined
      })

      throw error
    }
  }
}
```

---

## Best Practices

### 1. Always Use Structured Metadata

```typescript
// ❌ Bad: String interpolation
logger.info(`User ${userId} searched for ${query}`)

// ✅ Good: Structured metadata
logger.info('User searched', { userId, query })
```

### 2. Include Context in Errors

```typescript
// ❌ Bad: Minimal context
logger.error('Failed')

// ✅ Good: Full context
logger.error('Embedding generation failed', {
  error,
  textLength: text.length,
  attempt: retryCount,
  service: 'gemini-api'
})
```

### 3. Use Appropriate Log Levels

```typescript
// Error: Unrecoverable failures
logger.error('Database connection lost', { error })

// Warn: Recoverable issues, degraded performance
logger.warn('Cache miss, falling back to DB', { key })

// Info: Important business events
logger.info('User completed mission', { userId, missionId })

// Debug: Detailed diagnostic information
logger.debug('Cache hit', { key, ttl })
```

### 4. Create Service-Specific Loggers

```typescript
// ✅ Good: Each service has its own logger
class EmbeddingService {
  private logger = createServiceLogger('embedding-service')
}

class GraphBuilder {
  private logger = createServiceLogger('graph-builder')
}
```

### 5. Use Child Loggers for Request Tracing

```typescript
export async function handleRequest(request: Request) {
  const correlationId = getCorrelationId(request)

  // Create child logger with correlation ID
  const requestLogger = logger.child({ correlationId })

  // All logs will include correlationId
  requestLogger.info('Processing started')
  await doWork()
  requestLogger.info('Processing completed')
}
```

### 6. Don't Log Sensitive Data Directly

```typescript
// ❌ Bad: PII in logs
logger.info('User email', { email: 'john@example.com' })

// ✅ Good: Let redaction handle it, or hash explicitly
import { hashSensitiveData } from '@/lib/logger-pii-redaction'
logger.info('User logged in', {
  userHash: hashSensitiveData(email)
})
```

### 7. Log Performance Metrics

```typescript
const startTime = Date.now()

const results = await searchService.search(query)

logger.performance('search', Date.now() - startTime, {
  resultCount: results.length,
  query: query  // Automatically hashed
})
```

### 8. Use Batch Loggers for Long Operations

```typescript
const batchLogger = createBatchLogger('process-lectures', lectures.length)

batchLogger.start()

for (let i = 0; i < lectures.length; i++) {
  await processLecture(lectures[i])
  batchLogger.progress(i + 1)  // Only logs every 10 seconds
}

batchLogger.complete(successCount, failureCount)
```

---

## PII Redaction

### Automatic Redaction

The following patterns are automatically redacted:

- **Email addresses**: `john@example.com` → `[EMAIL_REDACTED]`
- **Phone numbers**: `555-123-4567` → `[PHONE_REDACTED]`
- **SSN**: `123-45-6789` → `[SSN_REDACTED]`
- **Credit cards**: `1234-5678-9012-3456` → `[CARD_REDACTED]`
- **IP addresses**: `192.168.1.1` → `[IP_REDACTED]`
- **Medical Record Numbers**: `MRN 123456` → `[MRN_REDACTED]`

### Query Hashing

Search queries and medical terms are hashed instead of redacted:

```typescript
logger.search('diabetes mellitus', 42, 125)
// Logs: { query: 'sha256:a3f2b8c...', resultCount: 42, duration: 125 }
```

This allows you to:
- Track that a search occurred
- Correlate multiple searches of the same term
- Avoid storing actual medical PHI

### Manual PII Redaction

```typescript
import { redactPII, hashSensitiveData } from '@/lib/logger-pii-redaction'

const safeMessage = redactPII('Contact me at john@example.com')
// => 'Contact me at [EMAIL_REDACTED]'

const queryHash = hashSensitiveData('cardiac conduction')
// => 'sha256:a3f2b8c...'
```

### Disable PII Redaction (Development Only)

```typescript
// In development, you can disable redaction for debugging
// ⚠️ NEVER DO THIS IN PRODUCTION
import { createLogger } from '@/lib/logger'

const debugLogger = createLogger({
  redactPII: false  // Only for local development
})
```

---

## Troubleshooting

### Logs Not Appearing

**Issue**: No logs visible in console

**Solution**: Check log level
```typescript
// In development, debug logs should appear
logger.debug('This should appear in dev')

// In production, only info and above appear
logger.info('This appears in prod')
```

### Correlation IDs Not Working

**Issue**: Correlation IDs missing from logs

**Solution**: Ensure middleware is applied
```typescript
// In middleware.ts
import { correlationMiddleware } from '@/lib/logger-middleware'

export function middleware(request: NextRequest) {
  return correlationMiddleware(request)
}
```

### PII Still Visible in Logs

**Issue**: Sensitive data not redacted

**Solution**: Use structured metadata, not string interpolation
```typescript
// ❌ Bad: PII in message string
logger.info(`User john@example.com logged in`)

// ✅ Good: PII in metadata (automatically redacted)
logger.info('User logged in', { email: 'john@example.com' })
```

### Log Files Too Large

**Issue**: Log files growing too fast

**Solution**: Winston automatically rotates files (10MB max, 5 files)
```typescript
// Files are automatically rotated:
// - logs/app.log (current)
// - logs/app.log.1 (previous)
// - logs/app.log.2 (older)
// - ... up to 5 files
```

### Performance Impact

**Issue**: Logging slowing down application

**Solution**: Use appropriate log levels
```typescript
// ✅ Production: Only log important events
if (process.env.NODE_ENV === 'production') {
  logger.info('Important event')
} else {
  logger.debug('Detailed diagnostic info')
}

// ✅ Or use debug level (automatically filtered in prod)
logger.debug('This is free in production')
```

---

## Next Steps

1. **Install Dependencies**: Run `pnpm install` (Winston will be added)
2. **Migrate Critical Paths**: Start with error logging in key services
3. **Add Middleware**: Wrap API routes with `withLogging`
4. **Create Service Loggers**: Use `createServiceLogger` for each subsystem
5. **Monitor Logs**: Set up log aggregation (Datadog, CloudWatch, etc.)

---

## Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Structured Logging Best Practices](https://www.loggly.com/ultimate-guide/node-logging-best-practices/)
- [GDPR Compliance for Logging](https://www.gdpreu.org/the-regulation/key-concepts/personal-data/)
- [HIPAA Logging Requirements](https://www.hhs.gov/hipaa/for-professionals/security/guidance/audit-controls/index.html)

---

**Epic 3 - Observability Infrastructure**
*Production-ready structured logging with PII protection*

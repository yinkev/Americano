# Americano Library Utilities

This directory contains core utility services for the Americano platform.

## Embedding Generation Pipeline (Epic 3 - Story 3.1)

### Quick Start

```typescript
import { contentChunker } from '@/lib/content-chunker'
import { embeddingService } from '@/lib/embedding-service'

// 1. Chunk your medical lecture content
const chunks = await contentChunker.chunkText({
  text: lectureContent,
  lectureId: 'lec-001',
  pageNumber: 1
})

// 2. Generate embeddings for chunks
const result = await embeddingService.generateBatchEmbeddings(
  chunks.map(c => c.content)
)

// 3. Store in database with Prisma
for (let i = 0; i < chunks.length; i++) {
  await prisma.contentChunk.create({
    data: {
      lectureId: chunks[i].metadata.lectureId,
      content: chunks[i].content,
      embedding: result.embeddings[i], // vector(1536)
      chunkIndex: chunks[i].metadata.chunkIndex,
      pageNumber: chunks[i].metadata.pageNumber,
    }
  })
}
```

### ContentChunker

**File:** `content-chunker.ts`

Intelligently splits large documents into semantic chunks for embedding.

**Features:**
- 1000-token chunks with 200-token overlap
- Sentence boundary preservation
- Medical abbreviation handling
- Metadata tracking (lectureId, chunkIndex, pageNumber)

**Usage:**

```typescript
import { ContentChunker } from '@/lib/content-chunker'

const chunker = new ContentChunker({
  chunkSizeTokens: 1000,  // Default
  overlapTokens: 200,      // Default
})

const chunks = await chunker.chunkText({
  text: 'Your medical content here...',
  lectureId: 'lecture-id',
  pageNumber: 1,
})

// Get statistics before chunking
const stats = chunker.getChunkingStats(text)
console.log(`Estimated chunks: ${stats.estimatedChunks}`)
```

**Chunk Output:**

```typescript
{
  content: "The cardiac conduction system...",
  metadata: {
    lectureId: "lec-001",
    chunkIndex: 0,
    pageNumber: 1,
    tokenCount: 987,
    wordCount: 759,
    charCount: 4521
  }
}
```

### EmbeddingService

**File:** `embedding-service.ts`

Wrapper around GeminiClient with rate limiting and batch processing.

**Features:**
- Rate limiting (60 requests/minute)
- Batch processing with error tracking
- Retry logic via GeminiClient
- Type-safe interfaces

**Usage:**

```typescript
import { EmbeddingService } from '@/lib/embedding-service'

const service = new EmbeddingService({
  maxRequestsPerMinute: 60,
  batchSize: 100,
  maxRetries: 3,
})

// Single embedding
const result = await service.generateEmbedding('Medical text')
if (!result.error) {
  console.log(result.embedding.length) // 1536
}

// Batch embeddings
const batch = await service.generateBatchEmbeddings([
  'Text 1',
  'Text 2',
  'Text 3',
])

console.log(`Success: ${batch.successCount}`)
console.log(`Failed: ${batch.failureCount}`)

// Check errors
batch.errors.forEach((error, index) => {
  console.error(`Text ${index} failed: ${error}`)
})

// Monitor rate limiting
const status = service.getRateLimitStatus()
console.log(`Available requests: ${status.availableRequests}`)
```

**Singleton Usage:**

```typescript
import { embeddingService } from '@/lib/embedding-service'

// Use the singleton instance to share rate limiting across app
const result = await embeddingService.generateEmbedding('Text')
```

### GeminiClient (AI)

**File:** `ai/gemini-client.ts`

Low-level Gemini API client for embedding generation.

**Note:** Use `EmbeddingService` instead of direct GeminiClient usage.

**Features:**
- Direct Gemini API integration
- Exponential backoff retry
- Batch processing

---

## Testing

### Run Integration Tests

```bash
cd apps/web
pnpm test embedding-integration
```

### Test Coverage

- Content chunking with medical text
- Embedding generation (single + batch)
- Rate limiting enforcement
- End-to-end pipeline validation
- Vector dimension verification (1536)

---

## Database Schema

### ContentChunk Model

```prisma
model ContentChunk {
  id          String   @id @default(cuid())
  lectureId   String
  content     String   @db.Text
  embedding   Unsupported("vector(1536)")?
  chunkIndex  Int
  pageNumber  Int?
  createdAt   DateTime @default(now())

  lecture     Lecture  @relation(fields: [lectureId], references: [id])

  @@index([lectureId])
}
```

### Vector Indexes

```sql
-- IVFFlat index for fast cosine similarity search
CREATE INDEX content_chunks_embedding_idx
ON content_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## Performance

### Embedding Generation

- **Throughput:** ~3,600 chunks/hour (60 req/min limit)
- **Latency:** ~500ms per embedding (API dependent)
- **Batch Size:** 100 texts per batch (configurable)

### Storage

- **Per Embedding:** ~6KB (1536 floats × 4 bytes)
- **100K chunks:** ~600MB vectors + ~600MB indexes = 1.2GB total

---

## Configuration

### Environment Variables

```bash
# Required for embedding generation
GEMINI_API_KEY=your_api_key_here

# Database (for pgvector)
DATABASE_URL=postgresql://...
```

### Chunking Configuration

```typescript
const chunker = new ContentChunker({
  chunkSizeTokens: 1000,      // Adjust for content type
  overlapTokens: 200,          // 20% overlap recommended
  tokensPerWord: 1.3,          // English average
  minChunkSizeTokens: 100,     // Avoid tiny fragments
})
```

### Embedding Configuration

```typescript
const service = new EmbeddingService({
  maxRequestsPerMinute: 60,    // Gemini API limit
  batchSize: 100,              // Parallel processing size
  maxRetries: 3,               // Exponential backoff
})
```

---

## Best Practices

### 1. Use Singleton Instances

```typescript
// ✅ Good: Shared rate limiting
import { embeddingService } from '@/lib/embedding-service'

// ❌ Bad: Each instance has separate rate tracking
const service1 = new EmbeddingService()
const service2 = new EmbeddingService()
```

### 2. Chunk Before Embedding

```typescript
// ✅ Good: Chunk first for better search results
const chunks = await contentChunker.chunkText({ text, lectureId })
const embeddings = await embeddingService.generateBatchEmbeddings(
  chunks.map(c => c.content)
)

// ❌ Bad: Embedding entire document loses granularity
const embedding = await embeddingService.generateEmbedding(entireDocument)
```

### 3. Handle Errors in Batches

```typescript
const result = await embeddingService.generateBatchEmbeddings(texts)

// Check for errors
if (result.failureCount > 0) {
  result.errors.forEach((error, index) => {
    console.error(`Failed to embed text ${index}: ${error}`)
    // Retry or log failed text
  })
}
```

### 4. Track Progress for Large Batches

```typescript
const chunks = await contentChunker.chunkText({ text, lectureId })
console.log(`Processing ${chunks.length} chunks...`)

for (let i = 0; i < chunks.length; i += 100) {
  const batch = chunks.slice(i, i + 100)
  const result = await embeddingService.generateBatchEmbeddings(
    batch.map(c => c.content)
  )
  console.log(`Progress: ${Math.min(i + 100, chunks.length)}/${chunks.length}`)
}
```

---

## Troubleshooting

### "Rate limit exceeded" errors

**Cause:** Making more than 60 requests per minute to Gemini API

**Solution:**
```typescript
// Check rate limit status
const status = embeddingService.getRateLimitStatus()
console.log(`Available: ${status.availableRequests}`)

// Wait if needed
if (status.availableRequests === 0) {
  await new Promise(resolve => setTimeout(resolve, 60000))
}
```

### "Empty text provided" errors

**Cause:** Passing empty or whitespace-only strings

**Solution:**
```typescript
const texts = chunks
  .filter(c => c.content.trim().length > 0)
  .map(c => c.content)
```

### Vector dimension mismatch

**Cause:** Database expects 1536 dimensions but getting different size

**Solution:**
```bash
# Apply migration to fix dimensions
cd apps/web
npx prisma migrate deploy
```

---

## Support

For questions or issues:
1. Check integration tests: `pnpm test embedding-integration`
2. Review implementation summary: `/TASK-1-IMPLEMENTATION-SUMMARY.md`
3. Verify environment variables are set
4. Check database migration status

---

**Last Updated:** 2025-10-16 (Epic 3 - Story 3.1 - Task 1)

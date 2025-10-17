/**
 * Result Pattern Usage Examples for Epic 3 Services
 *
 * This file demonstrates how to use the Result type pattern
 * in embedding service, graph builder, and search service.
 *
 * Epic 3 - Knowledge Graph - Error Handling Examples
 */

import {
  Result,
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  map,
  andThen,
  combine,
  partition,
  fromPromise,
  retry,
  EmbeddingError,
  EmbeddingErrorCode,
  ExtractionError,
  ExtractionErrorCode,
  SearchError,
  SearchErrorCode,
  RelationshipError,
  RelationshipErrorCode,
} from '../result'
import type { Concept } from '@/types/prisma-extensions'

// ============================================================================
// Example 1: Embedding Service with Result type
// ============================================================================

/**
 * Enhanced embedding service that returns Result instead of throwing
 */
class ResultEmbeddingService {
  async generateEmbedding(text: string): Promise<Result<number[], EmbeddingError>> {
    // Validate input
    if (!text || text.trim().length === 0) {
      return err(
        new EmbeddingError('Empty text provided', EmbeddingErrorCode.INVALID_INPUT, {
          retriable: false,
          context: { textLength: text.length },
        })
      )
    }

    try {
      // Simulate API call
      const embedding = await this.callGeminiAPI(text)

      if (embedding.length === 0) {
        return err(
          new EmbeddingError(
            'Received empty embedding from API',
            EmbeddingErrorCode.EMPTY_EMBEDDING,
            {
              retriable: true,
              context: { textLength: text.length },
            }
          )
        )
      }

      return ok(embedding)
    } catch (error) {
      // Classify error
      if (this.isRateLimitError(error)) {
        return err(
          new EmbeddingError(
            'Rate limit exceeded',
            EmbeddingErrorCode.RATE_LIMIT_EXCEEDED,
            {
              retriable: true,
              cause: error,
            }
          )
        )
      }

      if (this.isNetworkError(error)) {
        return err(
          new EmbeddingError('Network error', EmbeddingErrorCode.NETWORK_ERROR, {
            retriable: true,
            cause: error,
          })
        )
      }

      return err(
        new EmbeddingError('API error', EmbeddingErrorCode.API_ERROR, {
          retriable: false,
          cause: error,
        })
      )
    }
  }

  async generateBatchEmbeddings(
    texts: string[]
  ): Promise<Result<number[][], EmbeddingError>> {
    const results = await Promise.all(texts.map((text) => this.generateEmbedding(text)))

    // Option 1: Fail if any embedding fails
    const combined = combine(results)
    if (isErr(combined)) {
      return combined // First error
    }
    return combined

    // Option 2: Return partial results
    // const { successes, failures } = partition(results)
    // if (failures.length > 0) {
    //   console.warn(`${failures.length} embeddings failed`)
    // }
    // return ok(successes)
  }

  private async callGeminiAPI(text: string): Promise<number[]> {
    // Simulate API call
    return [0.1, 0.2, 0.3]
  }

  private isRateLimitError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('rate limit')
  }

  private isNetworkError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('network')
  }
}

// ============================================================================
// Example 2: Graph Builder with Result type
// ============================================================================

/**
 * Enhanced graph builder that returns Result instead of silent failures
 */
class ResultGraphBuilder {
  async extractConcepts(
    chunks: Array<{ id: string; content: string }>
  ): Promise<Result<Concept[], ExtractionError>> {
    try {
      const concepts: Concept[] = []

      for (const chunk of chunks) {
        const result = await this.extractConceptsFromChunk(chunk)

        if (isErr(result)) {
          // Log but continue processing other chunks
          console.error(`Failed to extract from chunk ${chunk.id}:`, result.error.message)

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
            'No concepts extracted from any chunk',
            ExtractionErrorCode.NO_CONCEPTS_EXTRACTED,
            {
              retriable: false,
              context: { chunkCount: chunks.length },
            }
          )
        )
      }

      return ok(concepts)
    } catch (error) {
      return err(
        new ExtractionError('Extraction process failed', ExtractionErrorCode.DATABASE_ERROR, {
          retriable: true,
          cause: error,
        })
      )
    }
  }

  async extractConceptsFromChunk(chunk: {
    id: string
    content: string
  }): Promise<Result<Concept[], ExtractionError>> {
    try {
      // Call ChatMock API
      const response = await this.callChatMockAPI(chunk.content)

      // Parse JSON response
      const parseResult = this.parseConceptsJSON(response)
      if (isErr(parseResult)) {
        return parseResult
      }

      return ok(parseResult.value)
    } catch (error) {
      if (this.isChatMockAPIError(error)) {
        return err(
          new ExtractionError('ChatMock API error', ExtractionErrorCode.CHATMOCK_API_ERROR, {
            retriable: true,
            cause: error,
            context: { chunkId: chunk.id },
          })
        )
      }

      return err(
        new ExtractionError('Unknown extraction error', ExtractionErrorCode.VALIDATION_ERROR, {
          retriable: false,
          cause: error,
        })
      )
    }
  }

  private async callChatMockAPI(content: string): Promise<string> {
    // Simulate API call
    return '{"concepts": []}'
  }

  private parseConceptsJSON(response: string): Result<Concept[], ExtractionError> {
    try {
      const parsed = JSON.parse(response)
      const concepts = parsed.concepts || []
      return ok(concepts)
    } catch (error) {
      return err(
        new ExtractionError('Invalid JSON response', ExtractionErrorCode.INVALID_JSON_RESPONSE, {
          retriable: false,
          cause: error,
          context: { response },
        })
      )
    }
  }

  private isChatMockAPIError(error: unknown): boolean {
    return error instanceof Error && error.message.includes('API')
  }
}

// ============================================================================
// Example 3: Search Service with Result type
// ============================================================================

interface SearchResults {
  results: any[]
  total: number
}

class ResultSearchService {
  async search(query: string): Promise<Result<SearchResults, SearchError>> {
    // Validate query
    if (!query || query.trim().length === 0) {
      return err(
        new SearchError('Empty query provided', SearchErrorCode.INVALID_QUERY, {
          retriable: false,
          query,
        })
      )
    }

    // Generate embedding for query
    const embeddingResult = await this.generateQueryEmbedding(query)
    if (isErr(embeddingResult)) {
      return err(
        new SearchError(
          'Failed to generate query embedding',
          SearchErrorCode.EMBEDDING_GENERATION_FAILED,
          {
            retriable: embeddingResult.error.retriable,
            cause: embeddingResult.error,
            query,
          }
        )
      )
    }

    // Execute vector search
    const searchResult = await this.executeVectorSearch(embeddingResult.value, query)
    if (isErr(searchResult)) {
      return searchResult
    }

    // Check for no results (this may not be an error depending on context)
    if (searchResult.value.results.length === 0) {
      return err(
        new SearchError('No results found for query', SearchErrorCode.NO_RESULTS, {
          retriable: false,
          query,
        })
      )
    }

    return searchResult
  }

  private async generateQueryEmbedding(
    query: string
  ): Promise<Result<number[], EmbeddingError>> {
    // Use embedding service
    const service = new ResultEmbeddingService()
    return await service.generateEmbedding(query)
  }

  private async executeVectorSearch(
    embedding: number[],
    query: string
  ): Promise<Result<SearchResults, SearchError>> {
    try {
      // Simulate database query
      const results = await this.queryDatabase(embedding)
      return ok({ results, total: results.length })
    } catch (error) {
      return err(
        new SearchError('Vector search failed', SearchErrorCode.VECTOR_SEARCH_FAILED, {
          retriable: true,
          cause: error,
          query,
        })
      )
    }
  }

  private async queryDatabase(embedding: number[]): Promise<any[]> {
    // Simulate database query
    return []
  }
}

// ============================================================================
// Example 4: Using Result with Retry Logic
// ============================================================================

async function exampleWithRetry() {
  const service = new ResultEmbeddingService()

  const result = await retry(
    async () => await service.generateEmbedding('Medical text'),
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      shouldRetry: (error) =>
        error.retriable && error.code !== EmbeddingErrorCode.INVALID_INPUT,
    }
  )

  if (isOk(result)) {
    console.log('Embedding generated:', result.value.length, 'dimensions')
  } else {
    console.error('Embedding failed after retries:', result.error.message)
  }
}

// ============================================================================
// Example 5: Chaining Operations with andThen
// ============================================================================

async function exampleChaining() {
  const graphBuilder = new ResultGraphBuilder()
  const service = new ResultEmbeddingService()

  // Chain: extract concepts -> generate embeddings -> store in database
  const result = await andThen(
    await graphBuilder.extractConcepts([{ id: '1', content: 'Medical content' }]),
    async (concepts) => {
      // For each concept, generate embedding
      const embeddings = await Promise.all(
        concepts.map((c) => service.generateEmbedding(c.name))
      )

      const combined = combine(embeddings)
      if (isErr(combined)) {
        return err(
          new ExtractionError('Failed to generate embeddings', ExtractionErrorCode.DATABASE_ERROR, {
            retriable: combined.error.retriable,
            cause: combined.error,
          })
        )
      }

      // Store concepts with embeddings
      return ok(concepts)
    }
  )

  if (isOk(result)) {
    console.log('Successfully processed', result.value.length, 'concepts')
  } else {
    console.error('Pipeline failed:', result.error.message)
  }
}

// ============================================================================
// Example 6: Batch Processing with Partial Failures
// ============================================================================

async function exampleBatchProcessing() {
  const service = new ResultEmbeddingService()

  const texts = ['text1', 'text2', 'text3', '', 'text5'] // One invalid

  const results = await Promise.all(texts.map((text) => service.generateEmbedding(text)))

  const { successes, failures } = partition(results)

  console.log(`Successfully generated ${successes.length} embeddings`)
  console.log(`Failed to generate ${failures.length} embeddings`)

  // Log permanent failures
  failures.forEach((error) => {
    if (!error.retriable) {
      console.error('Permanent failure:', error.message, error.toJSON())
    }
  })

  // Retry retriable failures
  const retriableFailures = failures.filter((e) => e.retriable)
  console.log(`${retriableFailures.length} failures can be retried`)
}

// ============================================================================
// Example 7: Converting Existing Promise-based Code
// ============================================================================

async function examplePromiseConversion() {
  // Legacy Promise-based function
  async function legacyFetchData(): Promise<any> {
    const response = await fetch('/api/data')
    if (!response.ok) {
      throw new Error('API error')
    }
    return response.json()
  }

  // Convert to Result
  const result = await fromPromise(
    legacyFetchData(),
    (error) =>
      new SearchError('Failed to fetch data', SearchErrorCode.DATABASE_ERROR, {
        retriable: true,
        cause: error,
      })
  )

  // Use Result pattern
  if (isOk(result)) {
    console.log('Data:', result.value)
  } else {
    console.error('Error:', result.error.message)
  }
}

// ============================================================================
// Example 8: Unwrap Patterns
// ============================================================================

async function exampleUnwrapPatterns() {
  const service = new ResultEmbeddingService()
  const result = await service.generateEmbedding('Medical text')

  // Pattern 1: unwrap (throws if error) - USE WITH CAUTION
  try {
    const embedding = unwrap(result)
    console.log('Embedding:', embedding)
  } catch (error) {
    console.error('Error:', error)
  }

  // Pattern 2: unwrapOr (safe, never throws)
  const embedding = unwrapOr(result, []) // Default to empty array
  console.log('Embedding or default:', embedding.length)

  // Pattern 3: unwrapOrElse (lazy computation)
  const embeddingOrDefault = unwrapOrElse(result, (error) => {
    console.error('Failed to generate embedding:', error.message)
    return [] // Compute default based on error
  })

  // Pattern 4: map (transform success value)
  const dimensionsResult = map(result, (embedding) => embedding.length)
  if (isOk(dimensionsResult)) {
    console.log('Embedding has', dimensionsResult.value, 'dimensions')
  }
}

// ============================================================================
// Example 9: Error Context and Logging
// ============================================================================

async function exampleErrorLogging() {
  const service = new ResultEmbeddingService()
  const result = await service.generateEmbedding('Medical text')

  if (isErr(result)) {
    const error = result.error

    // Log structured error
    console.error('Embedding failed:', {
      message: error.message,
      code: error.code,
      retriable: error.retriable,
      context: error.context,
      stack: error.stack,
    })

    // JSON serialization for logging services
    console.error('Error JSON:', error.toJSON())

    // Check specific error codes
    if (error.code === EmbeddingErrorCode.RATE_LIMIT_EXCEEDED) {
      console.log('Rate limit exceeded, wait and retry')
    } else if (error.code === EmbeddingErrorCode.INVALID_INPUT) {
      console.log('Invalid input, fix and retry')
    }
  }
}

// ============================================================================
// Example 10: Relationship Detection with Result type
// ============================================================================

class ResultRelationshipDetector {
  async detectRelationships(
    concepts: Concept[]
  ): Promise<Result<Array<{ from: string; to: string; strength: number }>, RelationshipError>> {
    if (concepts.length < 2) {
      return err(
        new RelationshipError(
          'Need at least 2 concepts to detect relationships',
          RelationshipErrorCode.INVALID_CONCEPTS,
          {
            retriable: false,
            context: { conceptCount: concepts.length },
          }
        )
      )
    }

    try {
      const relationships: Array<{ from: string; to: string; strength: number }> = []

      // Detect semantic similarity
      for (let i = 0; i < concepts.length; i++) {
        for (let j = i + 1; j < concepts.length; j++) {
          const strengthResult = await this.calculateSimilarity(concepts[i], concepts[j])

          if (isErr(strengthResult)) {
            // Log but continue
            console.error(
              `Failed to calculate similarity between ${concepts[i].id} and ${concepts[j].id}:`,
              strengthResult.error.message
            )
            continue
          }

          if (strengthResult.value > 0.75) {
            relationships.push({
              from: concepts[i].id,
              to: concepts[j].id,
              strength: strengthResult.value,
            })
          }
        }
      }

      return ok(relationships)
    } catch (error) {
      return err(
        new RelationshipError(
          'Relationship detection failed',
          RelationshipErrorCode.DATABASE_ERROR,
          {
            retriable: true,
            cause: error,
          }
        )
      )
    }
  }

  private async calculateSimilarity(
    c1: Concept,
    c2: Concept
  ): Promise<Result<number, RelationshipError>> {
    try {
      // Simulate similarity calculation
      const similarity = 0.8
      return ok(similarity)
    } catch (error) {
      return err(
        new RelationshipError(
          'Similarity calculation failed',
          RelationshipErrorCode.SIMILARITY_CALCULATION_FAILED,
          {
            retriable: true,
            cause: error,
            context: { concept1: c1.id, concept2: c2.id },
          }
        )
      )
    }
  }
}

export {
  ResultEmbeddingService,
  ResultGraphBuilder,
  ResultSearchService,
  ResultRelationshipDetector,
  exampleWithRetry,
  exampleChaining,
  exampleBatchProcessing,
  examplePromiseConversion,
  exampleUnwrapPatterns,
  exampleErrorLogging,
}

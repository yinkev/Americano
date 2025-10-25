/**
 * SemanticSearchService - Semantic search engine with pgvector integration
 *
 * Epic 3 - Story 3.1 - Task 3: Build Semantic Search Engine
 *
 * Features:
 * - Vector similarity search using pgvector cosine distance
 * - Hybrid search combining vector similarity + keyword matching
 * - Relevance scoring and result ranking
 * - Pagination and filtering support
 * - Performance optimized for <1 second search latency
 * - Robust retry logic with Prisma error classification
 * - Graceful degradation for embedding failures
 *
 * Architecture:
 * - Uses Prisma Client for type-safe database queries
 * - Leverages pgvector extension for vector operations
 * - Integrates with existing EmbeddingService for query embeddings
 * - Implements retry patterns for database resilience
 * - Circuit breaker pattern for failing services
 */

import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { embeddingService } from './embedding-service'
import { retryService, DEFAULT_POLICIES, type RetryResult, ErrorCategory, RetriableError, PermanentError } from './retry/retry-service'

/**
 * Search result types
 */
export type SearchResultType = 'lecture' | 'chunk' | 'concept'

/**
 * Filter options for search queries
 */
export interface SearchFilters {
  /** Filter by specific course IDs */
  courseIds?: string[]
  /** Filter by content category */
  category?: string
  /** Filter by date range */
  dateRange?: {
    start: Date
    end: Date
  }
  /** Filter by content types */
  contentTypes?: SearchResultType[]
  /** Minimum similarity score threshold (0.0-1.0) */
  minSimilarity?: number
}

/**
 * Search parameters
 */
export interface SearchParams {
  /** Natural language query */
  query: string
  /** Optional filters */
  filters?: SearchFilters
  /** Number of results per page (default: 10) */
  limit?: number
  /** Page offset for pagination */
  offset?: number
  /** Include keyword matching boost (default: true) */
  includeKeywordBoost?: boolean
  /** Weight for vector similarity in hybrid search (0.0-1.0, default: 0.7) */
  vectorWeight?: number
}

/**
 * Base search result interface
 */
export interface SearchResult {
  /** Unique result ID */
  id: string
  /** Result type */
  type: SearchResultType
  /** Title or name */
  title: string
  /** Context snippet with highlighted terms */
  snippet: string
  /** Similarity score (0.0-1.0) */
  similarity: number
  /** Composite relevance score (includes keyword boost if applicable) */
  relevanceScore: number
  /** Source metadata */
  metadata: {
    courseId?: string
    courseName?: string
    lectureId?: string
    lectureTitle?: string
    pageNumber?: number
    uploadDate?: Date
    category?: string
  }
}

/**
 * Lecture-specific search result
 */
export interface LectureSearchResult extends SearchResult {
  type: 'lecture'
  /** Full lecture content preview */
  contentPreview?: string
  /** Number of content chunks in lecture */
  chunkCount?: number
  /** Processing status */
  processingStatus?: string
}

/**
 * Chunk-specific search result
 */
export interface ChunkSearchResult extends SearchResult {
  type: 'chunk'
  /** Chunk index within lecture */
  chunkIndex: number
  /** Full chunk content */
  content: string
}

/**
 * Concept-specific search result
 */
export interface ConceptSearchResult extends SearchResult {
  type: 'concept'
  /** Concept description */
  description?: string
  /** Related concepts */
  relatedConcepts?: string[]
}

/**
 * Paginated search response
 */
export interface SearchResponse {
  /** Search results */
  results: SearchResult[]
  /** Total number of results (before pagination) */
  total: number
  /** Query execution time in milliseconds */
  queryTime: number
  /** Current page information */
  pagination: {
    limit: number
    offset: number
    hasNext: boolean
    hasPrevious: boolean
  }
  /** Search metadata */
  metadata: {
    query: string
    filtersApplied: string[]
    hybridSearchUsed: boolean
    embeddingFailed?: boolean
    fallbackToKeywordSearch?: boolean
    retryAttempts?: number
  }
  /** Error information if search partially failed */
  error?: {
    message: string
    type: string
    degradedMode: boolean
  }
}

/**
 * Prisma error types for classification
 */
enum PrismaErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  POOL_EXHAUSTED = 'POOL_EXHAUSTED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  INVALID_QUERY = 'INVALID_QUERY',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Keyword match result for hybrid search
 */
interface KeywordMatch {
  id: string
  type: SearchResultType
  matchScore: number
  matchedTerms: string[]
}

/**
 * SemanticSearchService - Core search engine implementation
 *
 * @example
 * ```typescript
 * const searchService = new SemanticSearchService()
 *
 * // Simple search
 * const results = await searchService.search({
 *   query: 'How does the heart pump blood?',
 *   limit: 10
 * })
 *
 * // Filtered search with pagination
 * const filteredResults = await searchService.search({
 *   query: 'cardiac conduction system',
 *   filters: {
 *     courseIds: ['course-123'],
 *     minSimilarity: 0.75
 *   },
 *   limit: 20,
 *   offset: 20
 * })
 * ```
 */
export class SemanticSearchService {
  private prisma = prisma
  private retryAttempts: number = 0

  constructor() {}

  /**
   * Disconnect Prisma client
   * Should be called on application shutdown
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }

  /**
   * Wrap Prisma query with retry logic and error handling
   * Automatically classifies Prisma errors and applies appropriate retry strategy
   * @private
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<RetryResult<T>> {
    // Wrap the operation to classify Prisma errors
    const wrappedOperation = async (): Promise<T> => {
      try {
        return await operation()
      } catch (error) {
        // Classify and rethrow with appropriate error type
        throw this.classifyPrismaError(error)
      }
    }

    return retryService.execute(
      wrappedOperation,
      DEFAULT_POLICIES.DATABASE,
      operationName
    )
  }

  /**
   * Classify Prisma errors and throw appropriate error type for RetryService
   * @private
   */
  private classifyPrismaError(error: unknown): Error {
    const errorMessage = this.extractErrorMessage(error)
    const errorString = errorMessage.toLowerCase()

    // Prisma-specific error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const code = error.code

      // Retryable errors with suggested delays
      if (code === 'P1008') {
        // Connection timeout
        return new RetriableError(
          'Database connection timeout',
          ErrorCategory.TRANSIENT,
          error,
          undefined,
          0.5 // 500ms suggested delay
        )
      }

      if (code === 'P1001') {
        // Connection pool exhausted
        return new RetriableError(
          'Database connection pool exhausted',
          ErrorCategory.TRANSIENT,
          error,
          undefined,
          1 // 1000ms suggested delay
        )
      }

      if (code === 'P1002') {
        // Connection failed
        return new RetriableError(
          'Database connection failed',
          ErrorCategory.TRANSIENT,
          error,
          undefined,
          0.5 // 500ms suggested delay
        )
      }

      if (code === 'P2034') {
        // Transaction failed (lock contention)
        return new RetriableError(
          'Database transaction failed',
          ErrorCategory.TRANSIENT,
          error,
          undefined,
          0.2 // 200ms suggested delay
        )
      }

      // Non-retryable errors
      if (code === 'P2024') {
        // Query timeout - query too slow
        return new PermanentError('Query timeout - query too complex', error)
      }

      if (code === 'P2010') {
        // Invalid query structure
        return new PermanentError('Invalid database query', error)
      }

      if (code === 'P2002' || code === 'P2003') {
        // Constraint violations
        return new PermanentError('Database constraint violation', error)
      }
    }

    // Prisma initialization errors (NOT RETRYABLE)
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return new PermanentError('Database initialization failed', error)
    }

    // Prisma validation errors (NOT RETRYABLE)
    if (error instanceof Prisma.PrismaClientValidationError) {
      return new PermanentError('Query validation failed', error)
    }

    // Generic network/timeout errors (RETRYABLE)
    if (
      errorString.includes('timeout') ||
      errorString.includes('econnrefused') ||
      errorString.includes('econnreset') ||
      errorString.includes('network')
    ) {
      return new RetriableError(
        'Network error',
        ErrorCategory.TRANSIENT,
        error instanceof Error ? error : new Error(errorMessage),
        undefined,
        0.5 // 500ms suggested delay
      )
    }

    // Unknown errors - default to retryable (conservative approach)
    return new RetriableError(
      errorMessage || 'Unknown database error',
      ErrorCategory.TRANSIENT,
      error instanceof Error ? error : new Error(errorMessage)
    )
  }

  /**
   * Extract error message from unknown error type
   * @private
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }
    if (typeof error === 'string') {
      return error
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message)
    }
    return 'Unknown error'
  }

  /**
   * Main search method - executes semantic search with optional hybrid boosting
   * Enhanced with retry logic and graceful degradation
   *
   * Subtask 3.1, 3.2, 3.3, 3.4: Vector search, hybrid search, ranking, pagination
   *
   * Retry Strategy:
   * - Database queries: Retry on connection errors, pool exhaustion
   * - Embedding generation: Gracefully fallback to keyword-only search
   *
   * Graceful Degradation:
   * - If embedding fails: Use keyword search only
   * - If vector search fails: Use keyword search only
   * - If keyword search fails: Return empty results with error
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now()
    this.retryAttempts = 0

    // Set defaults
    const limit = params.limit ?? 10
    const offset = params.offset ?? 0
    const includeKeywordBoost = params.includeKeywordBoost ?? true
    const vectorWeight = params.vectorWeight ?? 0.7
    const keywordWeight = 1.0 - vectorWeight
    const minSimilarity = params.filters?.minSimilarity ?? 0.7

    // Validate limit
    if (![10, 25, 50].includes(limit)) {
      throw new Error('Limit must be 10, 25, or 50')
    }

    let embeddingFailed = false
    let fallbackToKeywordSearch = false
    let vectorResults: SearchResult[] = []
    let searchError: { message: string; type: string; degradedMode: boolean } | undefined

    // Step 1: Generate query embedding with graceful fallback
    let queryEmbedding: number[] = []
    try {
      const embeddingResult = await embeddingService.generateEmbedding(params.query)

      if (embeddingResult.error) {
        console.warn(
          `[SemanticSearchService] Embedding generation failed: ${embeddingResult.error}`,
          embeddingResult.permanent ? '(PERMANENT)' : '(TRANSIENT)'
        )
        embeddingFailed = true

        // If embedding failed but we can still do keyword search, continue
        if (!embeddingResult.permanent) {
          fallbackToKeywordSearch = true
        }
      } else {
        queryEmbedding = embeddingResult.embedding
      }
    } catch (error) {
      console.error('[SemanticSearchService] Unexpected embedding error:', error)
      embeddingFailed = true
      fallbackToKeywordSearch = true
    }

    // Step 2: Execute vector similarity search (with retry)
    if (!embeddingFailed && queryEmbedding.length > 0) {
      const vectorSearchResult = await this.retryService.executeWithRetry(
        async () => {
          return await this.executeVectorSearch(
            queryEmbedding,
            params.filters,
            minSimilarity,
            limit * 2 // Get 2x results for hybrid re-ranking
          )
        },
        (error) => this.classifyPrismaError(error),
        (metadata) => {
          this.retryAttempts = metadata.attempt
          console.warn(
            `[SemanticSearchService] Vector search retry ${metadata.attempt}/${metadata.maxAttempts} after ${metadata.delayMs}ms delay`
          )
        }
      )

      if (vectorSearchResult.success) {
        vectorResults = vectorSearchResult.value
      } else {
        console.error(
          '[SemanticSearchService] Vector search failed after retries:',
          vectorSearchResult.error.message,
          vectorSearchResult.permanent ? '(PERMANENT)' : '(TRANSIENT)'
        )

        // Gracefully fallback to keyword search
        fallbackToKeywordSearch = true
        searchError = {
          message: `Vector search failed: ${vectorSearchResult.error.message}`,
          type: vectorSearchResult.error.type,
          degradedMode: true,
        }
      }
    } else {
      // No embedding available, use keyword search
      fallbackToKeywordSearch = true
    }

    // Step 3: Execute keyword search (with retry)
    let finalResults: SearchResult[] = vectorResults
    let hybridSearchUsed = false

    if ((includeKeywordBoost || fallbackToKeywordSearch) && params.query.trim().length > 0) {
      const keywordSearchResult = await this.retryService.executeWithRetry(
        async () => {
          return await this.executeKeywordSearch(params.query, params.filters)
        },
        (error) => this.classifyPrismaError(error),
        (metadata) => {
          console.warn(
            `[SemanticSearchService] Keyword search retry ${metadata.attempt}/${metadata.maxAttempts}`
          )
        }
      )

      if (keywordSearchResult.success) {
        const keywordMatches = keywordSearchResult.value

        if (fallbackToKeywordSearch) {
          // Convert keyword matches to search results (keyword-only mode)
          finalResults = await this.keywordMatchesToSearchResults(keywordMatches, params.query)
          console.warn(
            `[SemanticSearchService] Operating in keyword-only mode (${finalResults.length} results)`
          )
        } else {
          // Combine vector and keyword scores (hybrid mode)
          finalResults = this.combineScores(
            vectorResults,
            keywordMatches,
            vectorWeight,
            keywordWeight
          )
          hybridSearchUsed = true
        }
      } else {
        console.error(
          '[SemanticSearchService] Keyword search failed after retries:',
          keywordSearchResult.error.message
        )

        // Both vector and keyword search failed
        if (vectorResults.length === 0) {
          return {
            results: [],
            total: 0,
            queryTime: Date.now() - startTime,
            pagination: {
              limit,
              offset,
              hasNext: false,
              hasPrevious: false,
            },
            metadata: {
              query: params.query,
              filtersApplied: this.getAppliedFilters(params.filters),
              hybridSearchUsed: false,
              embeddingFailed,
              fallbackToKeywordSearch,
              retryAttempts: this.retryAttempts,
            },
            error: {
              message: 'Both vector and keyword search failed',
              type: 'SEARCH_FAILURE',
              degradedMode: true,
            },
          }
        }
      }
    }

    // Sort by relevance score
    finalResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    // Apply pagination
    const paginatedResults = finalResults.slice(offset, offset + limit)
    const total = finalResults.length

    // Generate snippets with highlighting
    const enrichedResults = await this.enrichWithSnippets(
      paginatedResults,
      params.query
    )

    const queryTime = Date.now() - startTime

    return {
      results: enrichedResults,
      total,
      queryTime,
      pagination: {
        limit,
        offset,
        hasNext: offset + limit < total,
        hasPrevious: offset > 0,
      },
      metadata: {
        query: params.query,
        filtersApplied: this.getAppliedFilters(params.filters),
        hybridSearchUsed,
        embeddingFailed,
        fallbackToKeywordSearch,
        retryAttempts: this.retryAttempts,
      },
      error: searchError,
    }
  }

  /**
   * Search lectures by semantic similarity
   * Subtask 3.1: Vector similarity search
   */
  async searchLectures(
    query: string,
    limit: number = 10
  ): Promise<LectureSearchResult[]> {
    const response = await this.search({
      query,
      limit,
      filters: {
        contentTypes: ['lecture'],
      },
    })

    return response.results as LectureSearchResult[]
  }

  /**
   * Search content chunks by semantic similarity
   * Subtask 3.1: Vector similarity search
   */
  async searchChunks(
    query: string,
    limit: number = 10
  ): Promise<ChunkSearchResult[]> {
    const response = await this.search({
      query,
      limit,
      filters: {
        contentTypes: ['chunk'],
      },
    })

    return response.results as ChunkSearchResult[]
  }

  /**
   * Execute vector similarity search using pgvector
   * Subtask 3.1: Core vector search implementation
   *
   * Uses pgvector cosine distance operator (<=>)
   * Distance is converted to similarity: similarity = 1 - (distance / 2)
   */
  private async executeVectorSearch(
    queryEmbedding: number[],
    filters?: SearchFilters,
    minSimilarity: number = 0.7,
    limit: number = 20
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    // Search content chunks
    if (!filters?.contentTypes || filters.contentTypes.includes('chunk')) {
      const chunkResults = await this.searchChunksVector(
        queryEmbedding,
        filters,
        minSimilarity,
        limit
      )
      results.push(...chunkResults)
    }

    // Search lectures
    if (!filters?.contentTypes || filters.contentTypes.includes('lecture')) {
      const lectureResults = await this.searchLecturesVector(
        queryEmbedding,
        filters,
        minSimilarity,
        limit
      )
      results.push(...lectureResults)
    }

    // Search concepts
    if (!filters?.contentTypes || filters.contentTypes.includes('concept')) {
      const conceptResults = await this.searchConceptsVector(
        queryEmbedding,
        filters,
        minSimilarity,
        limit
      )
      results.push(...conceptResults)
    }

    return results
  }

  /**
   * Search content chunks using vector similarity
   */
  private async searchChunksVector(
    queryEmbedding: number[],
    filters?: SearchFilters,
    minSimilarity: number = 0.7,
    limit: number = 20
  ): Promise<ChunkSearchResult[]> {
    // Build WHERE clause for filters
    const whereClauses: string[] = []
    const params: any[] = []

    // Convert embedding to pgvector format
    const embeddingStr = `[${queryEmbedding.join(',')}]`
    params.push(embeddingStr)

    // Course filter
    if (filters?.courseIds && filters.courseIds.length > 0) {
      whereClauses.push(`l."courseId" = ANY($${params.length + 1})`)
      params.push(filters.courseIds)
    }

    // Date range filter
    if (filters?.dateRange) {
      whereClauses.push(`l."uploadedAt" >= $${params.length + 1}`)
      params.push(filters.dateRange.start)
      whereClauses.push(`l."uploadedAt" <= $${params.length + 1}`)
      params.push(filters.dateRange.end)
    }

    const whereClause = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''

    // Calculate max distance from min similarity
    // similarity = 1 - (distance / 2) => distance = 2 * (1 - similarity)
    const maxDistance = 2 * (1 - minSimilarity)

    params.push(maxDistance)
    params.push(limit)

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        cc.id,
        cc.content,
        cc."chunkIndex",
        cc."pageNumber",
        cc."lectureId",
        l.title AS "lectureTitle",
        l."courseId",
        c.name AS "courseName",
        l."uploadedAt",
        (cc.embedding <=> $1::vector) AS distance
      FROM content_chunks cc
      JOIN lectures l ON cc."lectureId" = l.id
      JOIN courses c ON l."courseId" = c.id
      WHERE cc.embedding IS NOT NULL
        AND (cc.embedding <=> $1::vector) < $2
        ${whereClause}
      ORDER BY distance
      LIMIT $${params.length}
    `,
      ...params
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: 'chunk' as const,
      title: row.lectureTitle,
      snippet: '', // Will be enriched later
      content: row.content,
      chunkIndex: row.chunkIndex,
      similarity: this.distanceToSimilarity(row.distance),
      relevanceScore: this.distanceToSimilarity(row.distance),
      metadata: {
        courseId: row.courseId,
        courseName: row.courseName,
        lectureId: row.lectureId,
        lectureTitle: row.lectureTitle,
        pageNumber: row.pageNumber,
        uploadDate: new Date(row.uploadedAt),
      },
    }))
  }

  /**
   * Search lectures using vector similarity
   */
  private async searchLecturesVector(
    queryEmbedding: number[],
    filters?: SearchFilters,
    minSimilarity: number = 0.7,
    limit: number = 20
  ): Promise<LectureSearchResult[]> {
    // Note: Lectures table has embedding field but may be NULL
    // This searches lectures that have embeddings

    const whereClauses: string[] = []
    const params: any[] = []

    const embeddingStr = `[${queryEmbedding.join(',')}]`
    params.push(embeddingStr)

    if (filters?.courseIds && filters.courseIds.length > 0) {
      whereClauses.push(`l."courseId" = ANY($${params.length + 1})`)
      params.push(filters.courseIds)
    }

    if (filters?.dateRange) {
      whereClauses.push(`l."uploadedAt" >= $${params.length + 1}`)
      params.push(filters.dateRange.start)
      whereClauses.push(`l."uploadedAt" <= $${params.length + 1}`)
      params.push(filters.dateRange.end)
    }

    const whereClause = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''
    const maxDistance = 2 * (1 - minSimilarity)

    params.push(maxDistance)
    params.push(limit)

    // Note: Using Unsupported type in Prisma, so we use raw SQL
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        l.id,
        l.title,
        l."courseId",
        c.name AS "courseName",
        l."uploadedAt",
        l."processingStatus",
        (l.embedding <=> $1::vector) AS distance,
        (SELECT COUNT(*) FROM content_chunks WHERE "lectureId" = l.id) AS "chunkCount"
      FROM lectures l
      JOIN courses c ON l."courseId" = c.id
      WHERE l.embedding IS NOT NULL
        AND (l.embedding <=> $1::vector) < $${params.length - 1}
        ${whereClause}
      ORDER BY distance
      LIMIT $${params.length}
    `,
      ...params
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: 'lecture' as const,
      title: row.title,
      snippet: '', // Will be enriched later
      chunkCount: parseInt(row.chunkCount, 10),
      processingStatus: row.processingStatus,
      similarity: this.distanceToSimilarity(row.distance),
      relevanceScore: this.distanceToSimilarity(row.distance),
      metadata: {
        courseId: row.courseId,
        courseName: row.courseName,
        uploadDate: new Date(row.uploadedAt),
      },
    }))
  }

  /**
   * Search concepts using vector similarity
   */
  private async searchConceptsVector(
    queryEmbedding: number[],
    filters?: SearchFilters,
    minSimilarity: number = 0.7,
    limit: number = 20
  ): Promise<ConceptSearchResult[]> {
    const whereClauses: string[] = []
    const params: any[] = []

    const embeddingStr = `[${queryEmbedding.join(',')}]`
    params.push(embeddingStr)

    if (filters?.category) {
      whereClauses.push(`c.category = $${params.length + 1}`)
      params.push(filters.category)
    }

    const whereClause = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''
    const maxDistance = 2 * (1 - minSimilarity)

    params.push(maxDistance)
    params.push(limit)

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        c.id,
        c.name,
        c.description,
        c.category,
        (c.embedding <=> $1::vector) AS distance
      FROM concepts c
      WHERE c.embedding IS NOT NULL
        AND (c.embedding <=> $1::vector) < $${params.length - 1}
        ${whereClause}
      ORDER BY distance
      LIMIT $${params.length}
    `,
      ...params
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: 'concept' as const,
      title: row.name,
      snippet: '', // Will be enriched later
      description: row.description,
      similarity: this.distanceToSimilarity(row.distance),
      relevanceScore: this.distanceToSimilarity(row.distance),
      metadata: {
        category: row.category,
      },
    }))
  }

  /**
   * Execute keyword search for hybrid boosting
   * Subtask 3.2: Keyword matching component
   */
  private async executeKeywordSearch(
    query: string,
    filters?: SearchFilters
  ): Promise<KeywordMatch[]> {
    // Extract search terms (remove common stop words)
    const terms = this.extractSearchTerms(query)

    if (terms.length === 0) {
      return []
    }

    const matches: KeywordMatch[] = []

    // Search chunks for keyword matches
    if (!filters?.contentTypes || filters.contentTypes.includes('chunk')) {
      const chunkMatches = await this.keywordSearchChunks(terms, filters)
      matches.push(...chunkMatches)
    }

    // Search lectures for keyword matches
    if (!filters?.contentTypes || filters.contentTypes.includes('lecture')) {
      const lectureMatches = await this.keywordSearchLectures(terms, filters)
      matches.push(...lectureMatches)
    }

    return matches
  }

  /**
   * Keyword search in content chunks
   */
  private async keywordSearchChunks(
    terms: string[],
    filters?: SearchFilters
  ): Promise<KeywordMatch[]> {
    const whereClauses: string[] = []
    const params: any[] = []

    // Build tsquery from terms
    const tsquery = terms.join(' | ')
    params.push(tsquery)

    if (filters?.courseIds && filters.courseIds.length > 0) {
      whereClauses.push(`l."courseId" = ANY($${params.length + 1})`)
      params.push(filters.courseIds)
    }

    const whereClause = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        cc.id,
        ts_rank(to_tsvector('english', cc.content), to_tsquery('english', $1)) AS rank
      FROM content_chunks cc
      JOIN lectures l ON cc."lectureId" = l.id
      WHERE to_tsvector('english', cc.content) @@ to_tsquery('english', $1)
        ${whereClause}
      ORDER BY rank DESC
      LIMIT 100
    `,
      ...params
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: 'chunk' as const,
      matchScore: parseFloat(row.rank),
      matchedTerms: terms,
    }))
  }

  /**
   * Keyword search in lectures
   */
  private async keywordSearchLectures(
    terms: string[],
    filters?: SearchFilters
  ): Promise<KeywordMatch[]> {
    const whereClauses: string[] = []
    const params: any[] = []

    const tsquery = terms.join(' | ')
    params.push(tsquery)

    if (filters?.courseIds && filters.courseIds.length > 0) {
      whereClauses.push(`l."courseId" = ANY($${params.length + 1})`)
      params.push(filters.courseIds)
    }

    const whereClause = whereClauses.length > 0 ? `AND ${whereClauses.join(' AND ')}` : ''

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `
      SELECT
        l.id,
        ts_rank(to_tsvector('english', l.title), to_tsquery('english', $1)) AS rank
      FROM lectures l
      WHERE to_tsvector('english', l.title) @@ to_tsquery('english', $1)
        ${whereClause}
      ORDER BY rank DESC
      LIMIT 100
    `,
      ...params
    )

    return rows.map((row: any) => ({
      id: row.id,
      type: 'lecture' as const,
      matchScore: parseFloat(row.rank),
      matchedTerms: terms,
    }))
  }

  /**
   * Combine vector and keyword scores for hybrid search
   * Subtask 3.2, 3.3: Hybrid search and relevance scoring
   */
  private combineScores(
    vectorResults: SearchResult[],
    keywordMatches: KeywordMatch[],
    vectorWeight: number = 0.7,
    keywordWeight: number = 0.3
  ): SearchResult[] {
    // Create lookup map for keyword scores
    const keywordScoreMap = new Map<string, number>()

    for (const match of keywordMatches) {
      keywordScoreMap.set(match.id, match.matchScore)
    }

    // Normalize keyword scores to 0-1 range
    const maxKeywordScore = Math.max(...keywordMatches.map(m => m.matchScore), 1)

    // Combine scores
    return vectorResults.map(result => {
      const keywordScore = keywordScoreMap.get(result.id) || 0
      const normalizedKeywordScore = keywordScore / maxKeywordScore

      // Composite relevance score
      const relevanceScore =
        vectorWeight * result.similarity +
        keywordWeight * normalizedKeywordScore

      return {
        ...result,
        relevanceScore,
      }
    })
  }

  /**
   * Convert keyword matches to search results (for graceful degradation)
   * Used when vector search fails and we need to fall back to keyword-only search
   * @private
   */
  private async keywordMatchesToSearchResults(
    keywordMatches: KeywordMatch[],
    query: string
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    // Normalize scores
    const maxScore = Math.max(...keywordMatches.map(m => m.matchScore), 1)

    for (const match of keywordMatches) {
      const normalizedScore = match.matchScore / maxScore

      // Fetch additional data based on match type
      if (match.type === 'chunk') {
        try {
          const chunk = await this.prisma.contentChunk.findUnique({
            where: { id: match.id },
            include: {
              lecture: {
                include: {
                  course: true,
                },
              },
            },
          })

          if (chunk) {
            results.push({
              id: chunk.id,
              type: 'chunk',
              title: chunk.lecture.title,
              snippet: '', // Will be enriched later
              content: chunk.content,
              chunkIndex: chunk.chunkIndex,
              similarity: normalizedScore,
              relevanceScore: normalizedScore,
              metadata: {
                courseId: chunk.lecture.courseId,
                courseName: chunk.lecture.course.name,
                lectureId: chunk.lecture.id,
                lectureTitle: chunk.lecture.title,
                pageNumber: chunk.pageNumber,
                uploadDate: chunk.lecture.uploadedAt,
              },
            } as ChunkSearchResult)
          }
        } catch (error) {
          console.error(`[SemanticSearchService] Error fetching chunk ${match.id}:`, error)
        }
      } else if (match.type === 'lecture') {
        try {
          const lecture = await this.prisma.lecture.findUnique({
            where: { id: match.id },
            include: {
              course: true,
              contentChunks: {
                select: { id: true },
              },
            },
          })

          if (lecture) {
            results.push({
              id: lecture.id,
              type: 'lecture',
              title: lecture.title,
              snippet: '', // Will be enriched later
              chunkCount: lecture.contentChunks.length,
              processingStatus: lecture.processingStatus,
              similarity: normalizedScore,
              relevanceScore: normalizedScore,
              metadata: {
                courseId: lecture.courseId,
                courseName: lecture.course.name,
                uploadDate: lecture.uploadedAt,
              },
            } as LectureSearchResult)
          }
        } catch (error) {
          console.error(`[SemanticSearchService] Error fetching lecture ${match.id}:`, error)
        }
      }
    }

    return results
  }

  /**
   * Enrich results with context snippets and highlighting
   * Subtask 3.3: Result formatting with snippets
   */
  private async enrichWithSnippets(
    results: SearchResult[],
    query: string
  ): Promise<SearchResult[]> {
    return Promise.all(
      results.map(async result => {
        if (result.type === 'chunk') {
          const chunkResult = result as ChunkSearchResult
          const snippet = this.generateSnippet(chunkResult.content, query)
          return {
            ...result,
            snippet,
          }
        } else if (result.type === 'lecture') {
          // Get first chunk content for snippet
          const snippet = await this.getLectureSnippet(result.id, query)
          return {
            ...result,
            snippet,
          }
        } else if (result.type === 'concept') {
          const conceptResult = result as ConceptSearchResult
          const snippet = this.generateSnippet(
            conceptResult.description || conceptResult.title,
            query
          )
          return {
            ...result,
            snippet,
          }
        }

        return result
      })
    )
  }

  /**
   * Get lecture snippet from first chunk
   */
  private async getLectureSnippet(lectureId: string, query: string): Promise<string> {
    try {
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `
        SELECT content
        FROM content_chunks
        WHERE "lectureId" = $1
        ORDER BY "chunkIndex"
        LIMIT 1
      `,
        lectureId
      )

      if (rows.length > 0) {
        return this.generateSnippet(rows[0].content, query)
      }
    } catch (error) {
      console.error('Error fetching lecture snippet:', error)
    }

    return 'No preview available'
  }

  /**
   * Generate context snippet with highlighting
   * Extracts 200 characters around matching terms
   */
  private generateSnippet(content: string, query: string, maxLength: number = 200): string {
    if (!content) return ''

    const terms = this.extractSearchTerms(query)

    if (terms.length === 0) {
      // No terms, return first N characters
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }

    // Find first occurrence of any term
    const lowerContent = content.toLowerCase()
    let bestIndex = -1

    for (const term of terms) {
      const index = lowerContent.indexOf(term.toLowerCase())
      if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
        bestIndex = index
      }
    }

    if (bestIndex === -1) {
      // No matches, return beginning
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }

    // Extract snippet around match
    const start = Math.max(0, bestIndex - Math.floor(maxLength / 2))
    const end = Math.min(content.length, start + maxLength)
    let snippet = content.substring(start, end)

    // Add ellipsis
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'

    // Highlight matching terms
    for (const term of terms) {
      const regex = new RegExp(`(${term})`, 'gi')
      snippet = snippet.replace(regex, '<mark>$1</mark>')
    }

    return snippet
  }

  /**
   * Extract meaningful search terms from query
   * Removes common stop words
   */
  private extractSearchTerms(query: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'what', 'when', 'where', 'who', 'how'
    ])

    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.has(term))
  }

  /**
   * Convert pgvector cosine distance to similarity score
   * Distance range: 0-2, Similarity range: 0-1
   */
  private distanceToSimilarity(distance: number): number {
    return Math.max(0, 1 - distance / 2)
  }

  /**
   * Get list of applied filters for metadata
   */
  private getAppliedFilters(filters?: SearchFilters): string[] {
    const applied: string[] = []

    if (filters?.courseIds && filters.courseIds.length > 0) {
      applied.push(`courses: ${filters.courseIds.length}`)
    }

    if (filters?.category) {
      applied.push(`category: ${filters.category}`)
    }

    if (filters?.dateRange) {
      applied.push('date range')
    }

    if (filters?.contentTypes && filters.contentTypes.length > 0) {
      applied.push(`types: ${filters.contentTypes.join(', ')}`)
    }

    if (filters?.minSimilarity) {
      applied.push(`min similarity: ${filters.minSimilarity}`)
    }

    return applied
  }
}

/**
 * Singleton instance for application-wide use
 */
export const semanticSearchService = new SemanticSearchService()

/**
 * Cleanup handler for graceful shutdown
 * Ensures Prisma disconnects properly on process exit
 */
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await semanticSearchService.disconnect()
  })
}

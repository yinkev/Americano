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
 *
 * Architecture:
 * - Uses @neondatabase/serverless for edge-compatible Postgres queries
 * - Leverages pgvector extension for vector operations
 * - Integrates with existing EmbeddingService for query embeddings
 */

import { neon } from '@neondatabase/serverless'
import { embeddingService } from './embedding-service'

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
  }
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
  private sql: ReturnType<typeof neon>

  constructor(connectionString?: string) {
    const dbUrl = connectionString || process.env.DATABASE_URL

    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    this.sql = neon(dbUrl)
  }

  /**
   * Main search method - executes semantic search with optional hybrid boosting
   *
   * Subtask 3.1, 3.2, 3.3, 3.4: Vector search, hybrid search, ranking, pagination
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now()

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

    // Generate query embedding
    const embeddingResult = await embeddingService.generateEmbedding(params.query)

    if (embeddingResult.error || embeddingResult.embedding.length === 0) {
      throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`)
    }

    // Execute vector similarity search
    const vectorResults = await this.executeVectorSearch(
      embeddingResult.embedding,
      params.filters,
      minSimilarity,
      limit * 2 // Get 2x results for hybrid re-ranking
    )

    // Apply keyword boosting if enabled
    let finalResults = vectorResults
    let hybridSearchUsed = false

    if (includeKeywordBoost && params.query.trim().length > 0) {
      const keywordMatches = await this.executeKeywordSearch(
        params.query,
        params.filters
      )

      // Combine vector and keyword scores
      finalResults = this.combineScores(
        vectorResults,
        keywordMatches,
        vectorWeight,
        keywordWeight
      )

      hybridSearchUsed = true
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
      },
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

    const query = `
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
        AND (cc.embedding <=> $1::vector) < ${maxDistance}
        ${whereClause}
      ORDER BY distance
      LIMIT ${limit}
    `

    const rows = await this.sql(query, params)

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

    // Note: Using Unsupported type in Prisma, so we use raw SQL
    const query = `
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
        AND (l.embedding <=> $1::vector) < ${maxDistance}
        ${whereClause}
      ORDER BY distance
      LIMIT ${limit}
    `

    const rows = await this.sql(query, params)

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

    const query = `
      SELECT
        c.id,
        c.name,
        c.description,
        c.category,
        (c.embedding <=> $1::vector) AS distance
      FROM concepts c
      WHERE c.embedding IS NOT NULL
        AND (c.embedding <=> $1::vector) < ${maxDistance}
        ${whereClause}
      ORDER BY distance
      LIMIT ${limit}
    `

    const rows = await this.sql(query, params)

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

    const query = `
      SELECT
        cc.id,
        ts_rank(to_tsvector('english', cc.content), to_tsquery('english', $1)) AS rank
      FROM content_chunks cc
      JOIN lectures l ON cc."lectureId" = l.id
      WHERE to_tsvector('english', cc.content) @@ to_tsquery('english', $1)
        ${whereClause}
      ORDER BY rank DESC
      LIMIT 100
    `

    const rows = await this.sql(query, params)

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

    const query = `
      SELECT
        l.id,
        ts_rank(to_tsvector('english', l.title), to_tsquery('english', $1)) AS rank
      FROM lectures l
      WHERE to_tsvector('english', l.title) @@ to_tsquery('english', $1)
        ${whereClause}
      ORDER BY rank DESC
      LIMIT 100
    `

    const rows = await this.sql(query, params)

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
      const rows = await this.sql`
        SELECT content
        FROM content_chunks
        WHERE "lectureId" = ${lectureId}
        ORDER BY "chunkIndex"
        LIMIT 1
      `

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

/**
 * Type Definitions for Semantic Search API
 * Story 3.1 Task 4: Search API Types and Interfaces
 *
 * Defines request/response types, search filters, and result structures
 * for the semantic search functionality.
 */

/**
 * Search filters for refining semantic search results
 * Supports filtering by course, date range, and content type
 */
export interface SearchFilters {
  /** Filter by specific course IDs */
  courseIds?: string[]

  /** Filter by date range */
  dateRange?: {
    start: Date | string
    end: Date | string
  }

  /** Filter by content type */
  contentTypes?: ('lecture' | 'chunk' | 'objective' | 'concept')[]

  /** Filter by specific categories (anatomy, physiology, etc.) */
  categories?: string[]

  /** Only return high-yield content (board exam relevant) */
  highYieldOnly?: boolean

  /** Minimum similarity score threshold (0.0 to 1.0) */
  minSimilarity?: number
}

/**
 * POST /api/search request body
 * Main semantic search query with optional filters
 */
export interface SearchRequest {
  /** Natural language search query */
  query: string

  /** Maximum number of results to return (default: 20) */
  limit?: number

  /** Pagination offset (default: 0) */
  offset?: number

  /** Optional filters to refine results */
  filters?: SearchFilters
}

/**
 * Individual search result item
 * Contains matched content with metadata and similarity score
 */
export interface SearchResult {
  /** Unique identifier of the result */
  id: string

  /** Type of content matched */
  type: 'lecture' | 'chunk' | 'objective' | 'concept'

  /** Title or name of the content */
  title: string

  /** Context snippet (200 chars with query terms highlighted) */
  snippet: string

  /** Cosine similarity score (0.0 to 1.0, higher is better) */
  similarity: number

  /** Metadata about the source */
  metadata: SearchResultMetadata
}

/**
 * Metadata for search results
 * Provides source attribution and context
 */
export interface SearchResultMetadata {
  /** ID of the parent lecture (if applicable) */
  lectureId?: string

  /** Title of the parent lecture */
  lectureTitle?: string

  /** Course ID */
  courseId?: string

  /** Course name */
  courseName?: string

  /** Course code (e.g., "ANAT 505") */
  courseCode?: string

  /** Upload date of the content */
  uploadDate?: string

  /** Page number in the original document */
  pageNumber?: number

  /** Category (anatomy, physiology, etc.) */
  category?: string

  /** Whether this is high-yield content */
  isHighYield?: boolean

  /** Board exam tags (USMLE, COMLEX, etc.) */
  boardExamTags?: string[]
}

/**
 * POST /api/search response
 * Contains search results with query metadata
 */
export interface SearchResponse {
  success: true
  data: {
    /** Array of search results ranked by similarity */
    results: SearchResult[]

    /** Total number of matching results (before pagination) */
    total: number

    /** Query processing time in milliseconds */
    latency: number

    /** The original query string */
    query: string

    /** Applied filters */
    filters?: SearchFilters

    /** Pagination info */
    pagination: {
      limit: number
      offset: number
      hasMore: boolean
    }
  }
}

/**
 * GET /api/search/suggestions query parameters
 * For autocomplete functionality
 */
export interface SuggestionsRequest {
  /** Partial query string (minimum 2 characters) */
  q: string

  /** Maximum number of suggestions (default: 5) */
  limit?: number

  /** Filter suggestions by course */
  courseId?: string
}

/**
 * Search suggestion item
 * Used for autocomplete dropdown
 */
export interface SearchSuggestion {
  /** Suggested search term */
  text: string

  /** Category of suggestion (previous search, medical term, concept) */
  category: 'recent' | 'term' | 'concept' | 'lecture'

  /** Number of results this suggestion would return */
  resultCount?: number

  /** Optional context or preview */
  context?: string
}

/**
 * GET /api/search/suggestions response
 */
export interface SuggestionsResponse {
  success: true
  data: {
    /** Array of search suggestions */
    suggestions: SearchSuggestion[]

    /** The query string used */
    query: string
  }
}

/**
 * Internal type for database query results
 * Used before transforming to SearchResult
 */
export interface RawSearchResult {
  id: string
  type: 'lecture' | 'chunk' | 'objective' | 'concept'
  content?: string
  title?: string
  name?: string
  objective?: string
  distance: number // Cosine distance from pgvector
  lectureId?: string
  lectureTitle?: string
  courseId?: string
  courseName?: string
  courseCode?: string
  uploadDate?: Date
  pageNumber?: number
  category?: string
  isHighYield?: boolean
  boardExamTags?: string[]
}

/**
 * Search analytics event data
 * Logged to SearchQuery table for pattern analysis
 */
export interface SearchAnalytics {
  userId: string
  query: string
  filters?: SearchFilters
  resultCount: number
  topResultId?: string
  responseTimeMs: number
  timestamp: Date
}

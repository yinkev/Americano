/**
 * SQL Query Result Validation Schemas
 * Epic 3 - Story 3.x - Comprehensive Zod schemas for raw SQL query results
 *
 * Purpose:
 * - Type-safe validation of raw SQL query results
 * - Runtime validation to catch database schema mismatches
 * - Provide strongly-typed interfaces for SQL query results
 * - Prevent SQL injection and data integrity issues
 *
 * Architecture:
 * - Strict validation (no optional fields unless explicitly nullable in DB)
 * - UUID validation for all ID fields
 * - Positive number validation for counts and metrics
 * - Non-empty string validation where applicable
 * - Comprehensive JSDoc documentation
 *
 * @module sql-schemas
 */

import { z } from 'zod'

// ============================================================================
// KNOWLEDGE GRAPH SCHEMAS (Story 3.2)
// ============================================================================

/**
 * Co-occurrence Query Result Schema
 *
 * Validates raw SQL results from the optimized co-occurrence detection query
 * in `graph-builder.ts` (lines 524-549).
 *
 * SQL Query Structure:
 * ```sql
 * SELECT
 *   c1.id AS concept1_id,
 *   c1.name AS concept1_name,
 *   c2.id AS concept2_id,
 *   c2.name AS concept2_name,
 *   COUNT(DISTINCT cc.id)::int AS co_occurrence_count
 * FROM concepts c1
 * CROSS JOIN concepts c2
 * JOIN content_chunks cc ON (...)
 * WHERE c1.id < c2.id
 * GROUP BY c1.id, c1.name, c2.id, c2.name
 * HAVING COUNT(DISTINCT cc.id) >= threshold
 * ```
 *
 * Use Cases:
 * - Knowledge graph relationship detection
 * - Concept integration analysis
 * - Content correlation metrics
 *
 * @example
 * ```typescript
 * const rawResults = await prisma.$queryRaw<unknown[]>`SELECT ...`
 * const validatedResults = rawResults.map(row => CoOccurrenceResultSchema.parse(row))
 * ```
 */
export const CoOccurrenceResultSchema = z.object({
  /** UUID of the first concept in the co-occurrence pair */
  concept1_id: z.string().uuid({
    message: 'concept1_id must be a valid UUID',
  }),

  /** Name of the first concept (non-empty) */
  concept1_name: z.string().min(1, {
    message: 'concept1_name cannot be empty',
  }),

  /** UUID of the second concept in the co-occurrence pair */
  concept2_id: z.string().uuid({
    message: 'concept2_id must be a valid UUID',
  }),

  /** Name of the second concept (non-empty) */
  concept2_name: z.string().min(1, {
    message: 'concept2_name cannot be empty',
  }),

  /**
   * Number of content chunks where both concepts co-occur
   * Must be a positive integer (minimum 1, as filtered by HAVING clause)
   */
  co_occurrence_count: z.number().int().positive({
    message: 'co_occurrence_count must be a positive integer',
  }),
})

/**
 * Inferred TypeScript type from CoOccurrenceResultSchema
 * Use this type for function parameters and return values
 */
export type CoOccurrenceResult = z.infer<typeof CoOccurrenceResultSchema>

/**
 * Schema for semantic similarity query results
 * Maps to the SQL query in graph-builder.ts detectSemanticSimilarity method
 */
export const SemanticSimilarityResultSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  distance: z.number().nonnegative('distance must be non-negative'),
})

/**
 * Inferred TypeScript type from SemanticSimilarityResultSchema
 */
export type SemanticSimilarityResult = z.infer<typeof SemanticSimilarityResultSchema>

/**
 * Schema for concept creation query results
 * Maps to the INSERT RETURNING query in graph-builder.ts storeConcept method
 */
export const ConceptCreationResultSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
  name: z.string().min(1, 'name cannot be empty'),
  description: z.string().nullable(),
  category: z.string().min(1, 'category cannot be empty'),
  embedding: z.unknown(), // pgvector type - validated at database level
  createdAt: z.date(),
  updatedAt: z.date(),
})

/**
 * Inferred TypeScript type from ConceptCreationResultSchema
 */
export type ConceptCreationResult = z.infer<typeof ConceptCreationResultSchema>

// ============================================================================
// SEMANTIC SEARCH SCHEMAS (Story 3.1)
// ============================================================================

/**
 * Vector Search Result Schema (Content Chunks)
 *
 * Validates raw SQL results from pgvector similarity search queries
 * in `semantic-search-service.ts` (lines 724-747).
 *
 * SQL Query Structure:
 * ```sql
 * SELECT
 *   cc.id,
 *   cc.content,
 *   cc."chunkIndex",
 *   cc."pageNumber",
 *   cc."lectureId",
 *   l.title AS "lectureTitle",
 *   l."courseId",
 *   c.name AS "courseName",
 *   l."uploadedAt",
 *   (cc.embedding <=> $1::vector) AS distance
 * FROM content_chunks cc
 * JOIN lectures l ON cc."lectureId" = l.id
 * JOIN courses c ON l."courseId" = c.id
 * WHERE cc.embedding IS NOT NULL
 * ```
 *
 * Use Cases:
 * - Semantic search results
 * - Vector similarity ranking
 * - Hybrid search scoring
 */
export const VectorSearchChunkResultSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  content: z.string(),
  chunkIndex: z.number().int().nonnegative({ message: 'chunkIndex must be a non-negative integer' }),
  pageNumber: z.number().int().positive().nullable(),
  lectureId: z.string().uuid({ message: 'lectureId must be a valid UUID' }),
  lectureTitle: z.string().min(1, { message: 'lectureTitle cannot be empty' }),
  courseId: z.string().uuid({ message: 'courseId must be a valid UUID' }),
  courseName: z.string().min(1, { message: 'courseName cannot be empty' }),
  uploadedAt: z.date(),
  distance: z.number().min(0).max(2, { message: 'distance must be between 0 and 2' }),
})

export type VectorSearchChunkResult = z.infer<typeof VectorSearchChunkResultSchema>

/**
 * Vector Search Result Schema (Lectures)
 *
 * Validates raw SQL results from lecture-level vector similarity queries
 * in `semantic-search-service.ts` (lines 806-826).
 */
export const VectorSearchLectureResultSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  title: z.string().min(1, { message: 'title cannot be empty' }),
  courseId: z.string().uuid({ message: 'courseId must be a valid UUID' }),
  courseName: z.string().min(1, { message: 'courseName cannot be empty' }),
  uploadedAt: z.date(),
  processingStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  distance: z.number().min(0).max(2, { message: 'distance must be between 0 and 2' }),
  chunkCount: z.number().int().nonnegative({ message: 'chunkCount must be a non-negative integer' }),
})

export type VectorSearchLectureResult = z.infer<typeof VectorSearchLectureResultSchema>

/**
 * Vector Search Result Schema (Concepts)
 *
 * Validates raw SQL results from concept-level vector similarity queries
 * in `semantic-search-service.ts` (lines 871-887).
 */
export const VectorSearchConceptResultSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  name: z.string().min(1, { message: 'name cannot be empty' }),
  description: z.string().nullable(),
  category: z.string().nullable(),
  distance: z.number().min(0).max(2, { message: 'distance must be between 0 and 2' }),
})

export type VectorSearchConceptResult = z.infer<typeof VectorSearchConceptResultSchema>

/**
 * Keyword Search Result Schema (PostgreSQL full-text search)
 *
 * Validates raw SQL results from keyword search queries using ts_rank
 * in `semantic-search-service.ts` (lines 956-969 and 999-1011).
 */
export const KeywordSearchResultSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
  rank: z.number().nonnegative({ message: 'rank must be a non-negative number' }),
})

export type KeywordSearchResult = z.infer<typeof KeywordSearchResultSchema>

// ============================================================================
// SEARCH ANALYTICS SCHEMAS (Story 3.1 Task 6, Story 3.6 Task 5)
// ============================================================================

/**
 * Popular Searches Result Schema
 *
 * Validates raw SQL results from popular search aggregation queries
 * in `search-analytics-service.ts` (lines 101-116).
 */
export const PopularSearchResultSchema = z.object({
  query: z.string().min(1, { message: 'query cannot be empty' }),
  count: z.bigint().refine((val) => val > BigInt(0), { message: 'count must be a positive bigint' }),
  avgResults: z.number().nonnegative({ message: 'avgResults must be a non-negative number' }),
})

export type PopularSearchResult = z.infer<typeof PopularSearchResultSchema>

/**
 * Zero-Result Queries Schema
 *
 * Validates raw SQL results from zero-result query detection
 * in `search-analytics-service.ts` (lines 143-163).
 */
export const ZeroResultQuerySchema = z.object({
  query: z.string().min(1, { message: 'query cannot be empty' }),
  count: z.bigint().refine((val) => val > BigInt(0), { message: 'count must be a positive bigint' }),
  lastSearched: z.date(),
})

export type ZeroResultQuery = z.infer<typeof ZeroResultQuerySchema>

/**
 * Click-Through Rate Analytics Schema
 *
 * Validates raw SQL results from CTR position analysis
 * in `search-analytics-service.ts` (lines 214-229).
 */
export const CTRByPositionResultSchema = z.object({
  position: z.number().int().positive({ message: 'position must be a positive integer' }),
  clicks: z.bigint().nonnegative({ message: 'clicks must be a non-negative bigint' }),
  searches: z.bigint().nonnegative({ message: 'searches must be a non-negative bigint' }),
})

export type CTRByPositionResult = z.infer<typeof CTRByPositionResultSchema>

/**
 * Search Performance Metrics Schema
 *
 * Validates raw SQL results from performance metric aggregation
 * in `search-analytics-service.ts` (lines 274-291).
 */
export const SearchPerformanceMetricsSchema = z.object({
  avgResponseTime: z.number().nonnegative({ message: 'avgResponseTime must be non-negative' }),
  avgResults: z.number().nonnegative({ message: 'avgResults must be non-negative' }),
  totalSearches: z.bigint().nonnegative({ message: 'totalSearches must be non-negative' }),
})

export type SearchPerformanceMetrics = z.infer<typeof SearchPerformanceMetricsSchema>

/**
 * P95 Response Time Schema
 */
export const P95ResponseTimeSchema = z.object({
  p95: z.number().nonnegative({ message: 'p95 must be non-negative' }),
})

export type P95ResponseTime = z.infer<typeof P95ResponseTimeSchema>

/**
 * Search Suggestions Schema
 */
export const SearchSuggestionResultSchema = z.object({
  query: z.string().min(1, { message: 'query cannot be empty' }),
  frequency: z.bigint().refine((val) => val > BigInt(0), { message: 'frequency must be positive' }),
  lastSearched: z.date(),
})

export type SearchSuggestionResult = z.infer<typeof SearchSuggestionResultSchema>

/**
 * Search Volume Over Time Schema (Story 3.6 Task 5.1)
 */
export const SearchVolumeOverTimeSchema = z.object({
  date: z.date(),
  count: z.bigint().nonnegative({ message: 'count must be non-negative' }),
  avgResponseTime: z.number().nonnegative({ message: 'avgResponseTime must be non-negative' }),
})

export type SearchVolumeOverTime = z.infer<typeof SearchVolumeOverTimeSchema>

/**
 * Content Type Distribution Schema (Story 3.6 Task 5.1)
 */
export const ContentTypeDistributionSchema = z.object({
  resultType: z.enum(['lecture', 'chunk', 'objective', 'concept']),
  count: z.bigint().nonnegative({ message: 'count must be non-negative' }),
})

export type ContentTypeDistribution = z.infer<typeof ContentTypeDistributionSchema>

/**
 * Content Gap Analysis Schema (Story 3.6 Task 5.2)
 */
export const ContentGapResultSchema = z.object({
  query: z.string().min(1, { message: 'query cannot be empty' }),
  frequency: z.bigint().refine((val) => val > BigInt(0), { message: 'frequency must be positive' }),
  avgResults: z.number().nonnegative().max(3, { message: 'avgResults must be < 3' }),
  lastSearched: z.date(),
})

export type ContentGapResult = z.infer<typeof ContentGapResultSchema>

/**
 * Top Queries by CTR Schema (Story 3.6 Task 5.1)
 */
export const TopQueryByCTRSchema = z.object({
  query: z.string().min(1, { message: 'query cannot be empty' }),
  searches: z.bigint().refine((val) => val > BigInt(0), { message: 'searches must be positive' }),
  clicks: z.bigint().nonnegative({ message: 'clicks must be non-negative' }),
  avgPosition: z.number().positive({ message: 'avgPosition must be positive' }),
})

export type TopQueryByCTR = z.infer<typeof TopQueryByCTRSchema>

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate and parse an array of SQL query results
 *
 * @param schema - Zod schema to validate against
 * @param results - Raw SQL query results
 * @returns Validated and typed results
 */
export function validateSQLResults<T extends z.ZodTypeAny>(
  schema: T,
  results: unknown[]
): z.infer<T>[] {
  return results.map((row) => schema.parse(row))
}

/**
 * Safely validate and parse SQL query results with error handling
 *
 * @param schema - Zod schema to validate against
 * @param results - Raw SQL query results
 * @returns Object with success flag and either data or error
 */
export function safeValidateSQLResults<T extends z.ZodTypeAny>(
  schema: T,
  results: unknown[]
): { success: true; data: z.infer<T>[] } | { success: false; error: z.ZodError } {
  try {
    const validated = validateSQLResults(schema, results)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

/**
 * Convert PostgreSQL bigint to JavaScript number safely
 *
 * @param value - BigInt value from SQL query
 * @returns JavaScript number
 * @throws Error if value exceeds Number.MAX_SAFE_INTEGER
 */
export function bigIntToNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `BigInt value ${value} exceeds Number.MAX_SAFE_INTEGER (${Number.MAX_SAFE_INTEGER})`
    )
  }
  return Number(value)
}

/**
 * Convert array of SQL results with bigint to safe JavaScript numbers
 *
 * @param results - Array of results with bigint values
 * @param fields - Array of field names to convert from bigint to number
 * @returns Results with converted number fields
 */
export function convertBigIntFields<T extends Record<string, any>>(
  results: T[],
  fields: (keyof T)[]
): T[] {
  return results.map((result) => {
    const converted = { ...result }
    for (const field of fields) {
      if (typeof result[field] === 'bigint') {
        ;(converted[field] as any) = bigIntToNumber(result[field] as bigint)
      }
    }
    return converted
  })
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * All SQL result schemas for easy importing
 */
export const SQLSchemas = {
  // Knowledge Graph
  CoOccurrenceResult: CoOccurrenceResultSchema,
  SemanticSimilarityResult: SemanticSimilarityResultSchema,
  ConceptCreationResult: ConceptCreationResultSchema,

  // Semantic Search
  VectorSearchChunkResult: VectorSearchChunkResultSchema,
  VectorSearchLectureResult: VectorSearchLectureResultSchema,
  VectorSearchConceptResult: VectorSearchConceptResultSchema,
  KeywordSearchResult: KeywordSearchResultSchema,

  // Search Analytics
  PopularSearchResult: PopularSearchResultSchema,
  ZeroResultQuery: ZeroResultQuerySchema,
  CTRByPositionResult: CTRByPositionResultSchema,
  SearchPerformanceMetrics: SearchPerformanceMetricsSchema,
  P95ResponseTime: P95ResponseTimeSchema,
  SearchSuggestionResult: SearchSuggestionResultSchema,
  SearchVolumeOverTime: SearchVolumeOverTimeSchema,
  ContentTypeDistribution: ContentTypeDistributionSchema,
  ContentGapResult: ContentGapResultSchema,
  TopQueryByCTR: TopQueryByCTRSchema,
} as const

/**
 * All SQL result types for easy importing
 */
export type SQLTypes = {
  CoOccurrenceResult: CoOccurrenceResult
  SemanticSimilarityResult: SemanticSimilarityResult
  ConceptCreationResult: ConceptCreationResult
  VectorSearchChunkResult: VectorSearchChunkResult
  VectorSearchLectureResult: VectorSearchLectureResult
  VectorSearchConceptResult: VectorSearchConceptResult
  KeywordSearchResult: KeywordSearchResult
  PopularSearchResult: PopularSearchResult
  ZeroResultQuery: ZeroResultQuery
  CTRByPositionResult: CTRByPositionResult
  SearchPerformanceMetrics: SearchPerformanceMetrics
  P95ResponseTime: P95ResponseTime
  SearchSuggestionResult: SearchSuggestionResult
  SearchVolumeOverTime: SearchVolumeOverTime
  ContentTypeDistribution: ContentTypeDistribution
  ContentGapResult: ContentGapResult
  TopQueryByCTR: TopQueryByCTR
}

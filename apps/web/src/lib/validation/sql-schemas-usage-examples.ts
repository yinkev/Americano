/**
 * SQL Schemas Usage Examples
 *
 * Demonstrates how to use Zod schemas for SQL query result validation
 * in Epic 3 Knowledge Graph and Semantic Search features.
 *
 * @module sql-schemas-usage-examples
 */

import { prisma } from '@/lib/db'
import {
  bigIntToNumber,
  type CoOccurrenceResult,
  CoOccurrenceResultSchema,
  convertBigIntFields,
  PopularSearchResultSchema,
  SQLSchemas,
  safeValidateSQLResults,
  type VectorSearchChunkResult,
  VectorSearchChunkResultSchema,
  validateSQLResults,
} from './sql-schemas'

/**
 * Example 1: Knowledge Graph Co-occurrence Detection (Story 3.2)
 *
 * This example shows how to validate co-occurrence query results
 * from the optimized PostgreSQL query in graph-builder.ts
 */
export async function exampleCoOccurrenceDetection() {
  // Execute raw SQL query
  const rawResults = await prisma.$queryRaw`
    SELECT
      c1.id AS concept1_id,
      c1.name AS concept1_name,
      c2.id AS concept2_id,
      c2.name AS concept2_name,
      COUNT(DISTINCT cc.id)::int AS co_occurrence_count
    FROM concepts c1
    CROSS JOIN concepts c2
    JOIN content_chunks cc ON (
      cc.content ILIKE '%' || c1.name || '%'
      AND cc.content ILIKE '%' || c2.name || '%'
    )
    WHERE c1.id < c2.id
    GROUP BY c1.id, c1.name, c2.id, c2.name
    HAVING COUNT(DISTINCT cc.id) >= 3
    ORDER BY co_occurrence_count DESC
  `

  // Method 1: Validate with error throwing (use in try-catch)
  try {
    const validated = validateSQLResults(CoOccurrenceResultSchema, rawResults as unknown[])
    console.log(`✓ Validated ${validated.length} co-occurrence results`)

    // Now TypeScript knows the exact shape of the data
    validated.forEach((result: CoOccurrenceResult) => {
      console.log(
        `  ${result.concept1_name} <-> ${result.concept2_name}: ${result.co_occurrence_count} occurrences`,
      )
    })
  } catch (error) {
    console.error('Validation failed:', error)
  }

  // Method 2: Safe validation (no throwing)
  const safeResult = safeValidateSQLResults(CoOccurrenceResultSchema, rawResults as unknown[])

  if (safeResult.success) {
    console.log(`✓ Safe validation successful: ${safeResult.data.length} results`)
    return safeResult.data
  } else {
    console.error('Validation errors:', safeResult.error.errors)
    return []
  }
}

/**
 * Example 2: Vector Search Result Validation (Story 3.1)
 *
 * This example shows how to validate pgvector similarity search results
 * from semantic-search-service.ts
 */
export async function exampleVectorSearch(queryEmbedding: number[]) {
  const embeddingStr = `[${queryEmbedding.join(',')}]`

  // Execute raw SQL query with pgvector
  const rawResults = await prisma.$queryRawUnsafe<unknown[]>(
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
      AND (cc.embedding <=> $1::vector) < 0.6
    ORDER BY distance
    LIMIT 20
    `,
    embeddingStr,
  )

  // Validate results
  const validated = validateSQLResults(VectorSearchChunkResultSchema, rawResults)

  // Process validated results with full type safety
  const searchResults = validated.map((result: VectorSearchChunkResult) => ({
    id: result.id,
    content: result.content,
    similarity: 1 - result.distance / 2, // Convert distance to similarity
    metadata: {
      lectureTitle: result.lectureTitle,
      courseName: result.courseName,
      pageNumber: result.pageNumber,
    },
  }))

  return searchResults
}

/**
 * Example 3: Analytics Aggregation with BigInt Conversion (Story 3.6)
 *
 * This example shows how to handle PostgreSQL COUNT() results (bigint)
 * and convert them safely to JavaScript numbers
 */
export async function examplePopularSearches() {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  // Execute aggregation query
  const rawResults = await prisma.$queryRaw<unknown[]>`
    SELECT
      query,
      COUNT(*) as count,
      AVG("resultCount")::float as "avgResults"
    FROM search_queries
    WHERE timestamp >= ${since}
      AND "isAnonymized" = false
    GROUP BY query
    ORDER BY count DESC
    LIMIT 10
  `

  // Validate with schema
  const validated = validateSQLResults(PopularSearchResultSchema, rawResults)

  // Method 1: Manual bigint conversion
  const results = validated.map((result) => ({
    query: result.query,
    count: bigIntToNumber(result.count), // Safe conversion to number
    avgResults: result.avgResults,
  }))

  // Method 2: Batch conversion of bigint fields
  const converted = convertBigIntFields(validated, ['count'])

  return converted
}

/**
 * Example 4: Using SQLSchemas namespace for cleaner imports
 *
 * This example demonstrates the convenient SQLSchemas namespace
 * for accessing all schemas without individual imports
 */
export function exampleUsingSQLSchemasNamespace() {
  // All schemas are available in the SQLSchemas namespace
  const coOccurrenceSchema = SQLSchemas.CoOccurrenceResult
  const vectorSearchSchema = SQLSchemas.VectorSearchChunkResult
  const popularSearchSchema = SQLSchemas.PopularSearchResult

  // Use them as needed
  console.log('Available schemas:', Object.keys(SQLSchemas))
}

/**
 * Example 5: Error Handling Best Practices
 *
 * This example shows comprehensive error handling for SQL result validation
 */
export async function exampleErrorHandling() {
  try {
    // Simulate a query that might return invalid data
    const rawResults = await prisma.$queryRaw`
      SELECT * FROM concepts LIMIT 5
    `

    // Attempt validation
    const result = safeValidateSQLResults(CoOccurrenceResultSchema, rawResults as unknown[])

    if (!result.success) {
      // Handle validation errors gracefully
      console.error('Validation failed with the following errors:')

      result.error.errors.forEach((err, index) => {
        console.error(`  Error ${index + 1}:`, {
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })
      })

      // Return empty array or default value
      return []
    }

    // Process valid results
    return result.data
  } catch (error) {
    // Handle unexpected errors (database connection, etc.)
    console.error('Unexpected error during query/validation:', error)
    return []
  }
}

/**
 * Example 6: Integration with Existing Services
 *
 * This example shows how to integrate schema validation into
 * existing service methods
 */
export class ExampleSearchService {
  async searchWithValidation(query: string) {
    // 1. Generate embedding (existing code)
    const embedding = await this.generateEmbedding(query)

    // 2. Execute vector search (existing code)
    const rawResults = await this.executeVectorQuery(embedding)

    // 3. Add validation layer (NEW)
    const validationResult = safeValidateSQLResults(VectorSearchChunkResultSchema, rawResults)

    if (!validationResult.success) {
      // Log validation errors for monitoring
      console.error('[SearchService] Result validation failed:', {
        query,
        errors: validationResult.error.errors.map((e) => ({
          path: e.path,
          message: e.message,
        })),
      })

      // Gracefully degrade to empty results
      return {
        results: [],
        error: 'Search results validation failed',
      }
    }

    // 4. Process validated results (existing code)
    return {
      results: this.processResults(validationResult.data),
      error: null,
    }
  }

  private async generateEmbedding(_query: string): Promise<number[]> {
    // Implementation...
    return []
  }

  private async executeVectorQuery(_embedding: number[]): Promise<unknown[]> {
    // Implementation...
    return []
  }

  private processResults(results: VectorSearchChunkResult[]) {
    // Implementation...
    return results
  }
}

/**
 * Example 7: Testing with Zod Schemas
 *
 * This example shows how to use schemas in unit tests
 */
export function exampleTesting() {
  // Valid test data
  const validCoOccurrence = {
    concept1_id: '123e4567-e89b-12d3-a456-426614174000',
    concept1_name: 'cardiac arrest',
    concept2_id: '123e4567-e89b-12d3-a456-426614174001',
    concept2_name: 'CPR',
    co_occurrence_count: 5,
  }

  // Test validation passes
  const result = CoOccurrenceResultSchema.safeParse(validCoOccurrence)
  console.assert(result.success === true, 'Valid data should pass validation')

  // Invalid test data (missing field)
  const invalidCoOccurrence = {
    concept1_id: '123e4567-e89b-12d3-a456-426614174000',
    concept1_name: 'cardiac arrest',
    // Missing concept2_id, concept2_name, co_occurrence_count
  }

  // Test validation fails
  const invalidResult = CoOccurrenceResultSchema.safeParse(invalidCoOccurrence)
  console.assert(invalidResult.success === false, 'Invalid data should fail validation')

  if (!invalidResult.success) {
    console.log('Expected validation errors:', invalidResult.error.errors.length)
  }
}

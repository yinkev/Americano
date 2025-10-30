/**
 * SQL Result Validation Utility - Usage Examples
 *
 * This file demonstrates real-world usage patterns for the validation utility
 * in the context of Epic 3 Knowledge Graph services.
 *
 * @module ValidationExamples
 */

import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { ExtractionError, ExtractionErrorCode, SearchError, SearchErrorCode } from '@/lib/errors'
import { err, isErr, isOk, ok, type Result } from '@/lib/result'
import {
  type InferSchemaType,
  type ValidatedQueryResult,
  validateOptionalSqlResult,
  validateSingleSqlResult,
  validateSqlResult,
} from './validate-sql-result'

const prisma = new PrismaClient()

/* ============================================================================
 * EXAMPLE 1: SEMANTIC SEARCH SERVICE
 * ========================================================================== */

/**
 * Search result schema for vector similarity search
 */
const searchResultSchema = z.object({
  conceptId: z.string().uuid(),
  conceptName: z.string(),
  conceptType: z.enum(['DISEASE', 'SYMPTOM', 'TREATMENT', 'ANATOMY']),
  similarity: z.number().min(0).max(1),
  chunkId: z.string().uuid().nullable(),
  chunkContent: z.string().nullable(),
  lectureId: z.string().cuid().nullable(),
  lectureName: z.string().nullable(),
})

type SearchResult = InferSchemaType<typeof searchResultSchema>

/**
 * Example: Semantic search with validation
 */
export async function semanticSearch(
  query: string,
  limit = 20,
): Promise<Result<SearchResult[], SearchError>> {
  try {
    // Execute vector similarity search
    const rawResults = await prisma.$queryRaw<unknown>`
      SELECT
        c.id as "conceptId",
        c.name as "conceptName",
        c.type as "conceptType",
        1 - (c.embedding <=> ${query}::vector) as similarity,
        ch.id as "chunkId",
        ch.content as "chunkContent",
        l.id as "lectureId",
        l.name as "lectureName"
      FROM "ConceptNode" c
      LEFT JOIN "Chunk" ch ON ch.id = c."sourceChunkId"
      LEFT JOIN "Lecture" l ON l.id = ch."lectureId"
      ORDER BY c.embedding <=> ${query}::vector
      LIMIT ${limit}
    `

    // Validate results with comprehensive context
    const validationResult = validateSqlResult(rawResults, searchResultSchema, {
      query: 'SELECT * FROM semantic_search(?, ?)',
      operation: 'semanticSearch',
      metadata: {
        query: query.substring(0, 100), // Truncate for logging
        limit,
        timestamp: new Date().toISOString(),
      },
    })

    // Map validation error to domain-specific error
    if (isErr(validationResult)) {
      return err(
        new SearchError(
          `Search result validation failed: ${validationResult.error.message}`,
          SearchErrorCode.DATABASE_ERROR,
          {
            retriable: false,
            cause: validationResult.error,
            query: query.substring(0, 100),
          },
        ),
      )
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      new SearchError('Semantic search query failed', SearchErrorCode.VECTOR_SEARCH_FAILED, {
        retriable: true,
        cause: error,
        query: query.substring(0, 100),
      }),
    )
  }
}

/* ============================================================================
 * EXAMPLE 2: KNOWLEDGE GRAPH CONCEPT RETRIEVAL
 * ========================================================================== */

/**
 * Concept schema matching ConceptNode database table
 */
const conceptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['DISEASE', 'SYMPTOM', 'TREATMENT', 'ANATOMY']),
  description: z.string().nullable(),
  sourceType: z.enum(['LECTURE', 'CHUNK', 'OBJECTIVE', 'MANUAL']),
  sourceChunkId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

type Concept = InferSchemaType<typeof conceptSchema>

/**
 * Example: Get concepts by type with validation
 */
export async function getConceptsByType(
  type: 'DISEASE' | 'SYMPTOM' | 'TREATMENT' | 'ANATOMY',
): Promise<Result<Concept[], ExtractionError>> {
  try {
    const rawResults = await prisma.$queryRaw<unknown>`
      SELECT *
      FROM "ConceptNode"
      WHERE type = ${type}
      ORDER BY "createdAt" DESC
    `

    const validationResult = validateSqlResult(rawResults, conceptSchema, {
      query: 'SELECT * FROM ConceptNode WHERE type = ?',
      operation: 'getConceptsByType',
      metadata: { type },
    })

    if (isErr(validationResult)) {
      return err(
        new ExtractionError(
          `Concept validation failed for type ${type}`,
          ExtractionErrorCode.VALIDATION_ERROR,
          {
            retriable: false,
            cause: validationResult.error,
          },
        ),
      )
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      new ExtractionError('Database query failed', ExtractionErrorCode.DATABASE_ERROR, {
        retriable: true,
        cause: error,
      }),
    )
  }
}

/**
 * Example: Get single concept by ID with validation
 */
export async function getConceptById(id: string): Promise<Result<Concept, ExtractionError>> {
  try {
    const rawResult = await prisma.$queryRaw<unknown>`
      SELECT *
      FROM "ConceptNode"
      WHERE id = ${id}
    `

    const validationResult = validateSingleSqlResult(rawResult, conceptSchema, {
      query: 'SELECT * FROM ConceptNode WHERE id = ?',
      operation: 'getConceptById',
      metadata: { id },
    })

    if (isErr(validationResult)) {
      return err(
        new ExtractionError(
          `Concept not found or invalid: ${id}`,
          ExtractionErrorCode.VALIDATION_ERROR,
          {
            retriable: false,
            cause: validationResult.error,
          },
        ),
      )
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      new ExtractionError('Database query failed', ExtractionErrorCode.DATABASE_ERROR, {
        retriable: true,
        cause: error,
      }),
    )
  }
}

/**
 * Example: Find concept by name (optional result)
 */
export async function findConceptByName(
  name: string,
): Promise<Result<Concept | undefined, ExtractionError>> {
  try {
    const rawResult = await prisma.$queryRaw<unknown>`
      SELECT *
      FROM "ConceptNode"
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `

    const validationResult = validateOptionalSqlResult(rawResult, conceptSchema, {
      query: 'SELECT * FROM ConceptNode WHERE LOWER(name) = LOWER(?)',
      operation: 'findConceptByName',
      metadata: { name },
    })

    if (isErr(validationResult)) {
      return err(
        new ExtractionError(
          `Concept validation failed for name: ${name}`,
          ExtractionErrorCode.VALIDATION_ERROR,
          {
            retriable: false,
            cause: validationResult.error,
          },
        ),
      )
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      new ExtractionError('Database query failed', ExtractionErrorCode.DATABASE_ERROR, {
        retriable: true,
        cause: error,
      }),
    )
  }
}

/* ============================================================================
 * EXAMPLE 3: KNOWLEDGE GRAPH RELATIONSHIPS
 * ========================================================================== */

/**
 * Relationship schema matching ConceptRelationship database table
 */
const relationshipSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  type: z.enum(['IS_A', 'PART_OF', 'CAUSES', 'TREATS', 'ASSOCIATED_WITH']),
  strength: z.number().min(0).max(1),
  bidirectional: z.boolean(),
  metadata: z
    .object({
      source: z.string(),
      confidence: z.number(),
      evidence: z.string().optional(),
    })
    .nullable(),
  createdAt: z.coerce.date(),
})

type Relationship = InferSchemaType<typeof relationshipSchema>

/**
 * Example: Get relationships for a concept
 */
export async function getConceptRelationships(
  conceptId: string,
): Promise<Result<Relationship[], ExtractionError>> {
  try {
    const rawResults = await prisma.$queryRaw<unknown>`
      SELECT *
      FROM "ConceptRelationship"
      WHERE "sourceId" = ${conceptId}
         OR ("bidirectional" = true AND "targetId" = ${conceptId})
      ORDER BY strength DESC
    `

    const validationResult = validateSqlResult(rawResults, relationshipSchema, {
      query:
        'SELECT * FROM ConceptRelationship WHERE sourceId = ? OR (bidirectional = true AND targetId = ?)',
      operation: 'getConceptRelationships',
      metadata: { conceptId },
    })

    if (isErr(validationResult)) {
      return err(
        new ExtractionError(
          `Relationship validation failed for concept: ${conceptId}`,
          ExtractionErrorCode.VALIDATION_ERROR,
          {
            retriable: false,
            cause: validationResult.error,
          },
        ),
      )
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      new ExtractionError('Database query failed', ExtractionErrorCode.DATABASE_ERROR, {
        retriable: true,
        cause: error,
      }),
    )
  }
}

/* ============================================================================
 * EXAMPLE 4: COMPLEX AGGREGATION QUERY
 * ========================================================================== */

/**
 * Schema for concept statistics aggregation
 */
const conceptStatsSchema = z.object({
  type: z.enum(['DISEASE', 'SYMPTOM', 'TREATMENT', 'ANATOMY']),
  count: z.coerce.number().int(),
  avgRelationships: z.coerce.number(),
  sourceDistribution: z.record(z.string(), z.coerce.number()),
})

type ConceptStats = InferSchemaType<typeof conceptStatsSchema>

/**
 * Example: Get concept statistics with validation
 */
export async function getConceptStatistics(): Promise<Result<ConceptStats[], ExtractionError>> {
  try {
    const rawResults = await prisma.$queryRaw<unknown>`
      SELECT
        c.type,
        COUNT(*)::int as count,
        AVG(rel_count)::numeric as "avgRelationships",
        jsonb_object_agg(c."sourceType", source_count) as "sourceDistribution"
      FROM "ConceptNode" c
      CROSS JOIN LATERAL (
        SELECT COUNT(*)::int as rel_count
        FROM "ConceptRelationship" r
        WHERE r."sourceId" = c.id
      ) rel
      CROSS JOIN LATERAL (
        SELECT COUNT(*)::int as source_count
        FROM "ConceptNode" cn
        WHERE cn.type = c.type AND cn."sourceType" = c."sourceType"
        GROUP BY cn."sourceType"
      ) src
      GROUP BY c.type
    `

    const validationResult = validateSqlResult(rawResults, conceptStatsSchema, {
      query: 'SELECT aggregated statistics from ConceptNode',
      operation: 'getConceptStatistics',
      metadata: { timestamp: new Date().toISOString() },
    })

    if (isErr(validationResult)) {
      return err(
        new ExtractionError(
          'Concept statistics validation failed',
          ExtractionErrorCode.VALIDATION_ERROR,
          {
            retriable: false,
            cause: validationResult.error,
          },
        ),
      )
    }

    return ok(validationResult.value)
  } catch (error) {
    return err(
      new ExtractionError('Statistics query failed', ExtractionErrorCode.DATABASE_ERROR, {
        retriable: true,
        cause: error,
      }),
    )
  }
}

/* ============================================================================
 * EXAMPLE 5: API ROUTE INTEGRATION
 * ========================================================================== */

/**
 * Example: API route handler with validation
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = Number(searchParams.get('limit') || '20')

  if (!query) {
    return Response.json({ success: false, error: 'Query parameter required' }, { status: 400 })
  }

  // Execute search with validation
  const result = await semanticSearch(query, limit)

  if (isErr(result)) {
    // Error response with proper HTTP status
    return Response.json(
      {
        success: false,
        error: {
          code: result.error.code,
          message: result.error.message,
          retriable: result.error.retriable,
        },
      },
      { status: result.error.httpStatus },
    )
  }

  // Success response with validated data
  return Response.json({
    success: true,
    data: {
      results: result.value,
      count: result.value.length,
      query,
      limit,
    },
  })
}

/* ============================================================================
 * EXAMPLE 6: SERVICE CLASS INTEGRATION
 * ========================================================================== */

/**
 * Example: Knowledge Graph Service with validation
 */
export class KnowledgeGraphService {
  /**
   * Get all concepts of a specific type
   */
  async getConceptsByType(
    type: 'DISEASE' | 'SYMPTOM' | 'TREATMENT' | 'ANATOMY',
  ): Promise<Result<Concept[], ExtractionError>> {
    return getConceptsByType(type)
  }

  /**
   * Get a single concept by ID
   */
  async getConceptById(id: string): Promise<Result<Concept, ExtractionError>> {
    return getConceptById(id)
  }

  /**
   * Search for concepts by name
   */
  async searchConceptsByName(name: string): Promise<Result<Concept | undefined, ExtractionError>> {
    return findConceptByName(name)
  }

  /**
   * Get relationships for a concept
   */
  async getRelationships(conceptId: string): Promise<Result<Relationship[], ExtractionError>> {
    return getConceptRelationships(conceptId)
  }

  /**
   * Get concept graph (concepts + relationships)
   */
  async getConceptGraph(conceptId: string): Promise<
    Result<
      {
        concept: Concept
        relationships: Relationship[]
        relatedConcepts: Concept[]
      },
      ExtractionError
    >
  > {
    // Get concept
    const conceptResult = await this.getConceptById(conceptId)
    if (isErr(conceptResult)) {
      return conceptResult
    }

    // Get relationships
    const relationshipsResult = await this.getRelationships(conceptId)
    if (isErr(relationshipsResult)) {
      return relationshipsResult
    }

    // Get related concepts
    const relatedIds = relationshipsResult.value.map((r) =>
      r.sourceId === conceptId ? r.targetId : r.sourceId,
    )

    const relatedConceptsResults = await Promise.all(
      relatedIds.map((id) => this.getConceptById(id)),
    )

    // Filter out errors
    const relatedConcepts = relatedConceptsResults.filter(isOk).map((r) => r.value)

    return ok({
      concept: conceptResult.value,
      relationships: relationshipsResult.value,
      relatedConcepts,
    })
  }
}

/* ============================================================================
 * EXAMPLE 7: ERROR RECOVERY PATTERNS
 * ========================================================================== */

/**
 * Example: Retry with fallback on validation failure
 */
export async function searchWithFallback(
  query: string,
): Promise<Result<SearchResult[], SearchError>> {
  // Try semantic search first
  const semanticResult = await semanticSearch(query)

  if (isOk(semanticResult)) {
    return semanticResult
  }

  // Log validation error
  console.error(
    'Semantic search validation failed, falling back to keyword search',
    semanticResult.error.toJSON(),
  )

  // Fallback to keyword search (simpler validation)
  const keywordResults = await prisma.$queryRaw<unknown>`
    SELECT
      c.id as "conceptId",
      c.name as "conceptName",
      c.type as "conceptType",
      0.5 as similarity,
      NULL::uuid as "chunkId",
      NULL::text as "chunkContent",
      NULL::text as "lectureId",
      NULL::text as "lectureName"
    FROM "ConceptNode" c
    WHERE c.name ILIKE ${'%' + query + '%'}
    LIMIT 20
  `

  return validateSqlResult(keywordResults, searchResultSchema, {
    query: 'SELECT * FROM ConceptNode WHERE name ILIKE ?',
    operation: 'keywordSearch',
    metadata: { query, fallback: true },
  })
}

/**
 * Example: Partial failure handling
 */
export async function getBatchConcepts(ids: string[]): Promise<{
  concepts: Concept[]
  errors: ExtractionError[]
}> {
  const results = await Promise.all(ids.map((id) => getConceptById(id)))

  const concepts: Concept[] = []
  const errors: ExtractionError[] = []

  for (const result of results) {
    if (isOk(result)) {
      concepts.push(result.value)
    } else {
      errors.push(result.error)
    }
  }

  return { concepts, errors }
}

/**
 * SQL Result Validation Utility - Epic 3 Knowledge Graph
 *
 * Provides type-safe validation of database query results using Zod schemas
 * integrated with the Result<T, E> pattern. This utility bridges raw SQL query
 * results with runtime type validation, ensuring data integrity throughout
 * the Knowledge Graph system.
 *
 * Features:
 * - Type-safe validation with Zod schemas
 * - Integration with Result<T, E> pattern
 * - Comprehensive error logging with context
 * - Array validation for query results
 * - Detailed validation error messages
 *
 * @module ValidationUtils
 */

import type { z } from 'zod'
import { DatabaseValidationError } from '@/lib/errors'
import { err, ok, type Result } from '@/lib/result'

/* ============================================================================
 * VALIDATION CONTEXT
 * ========================================================================== */

/**
 * Context information for validation operations
 * Provides metadata for error logging and debugging
 */
export interface ValidationContext {
  /** SQL query string (for debugging) */
  query: string

  /** Operation name (e.g., "searchConcepts", "findRelationships") */
  operation: string

  /** Optional additional metadata */
  metadata?: Record<string, unknown>
}

/* ============================================================================
 * CORE VALIDATION FUNCTION
 * ========================================================================== */

/**
 * Validates raw SQL query results against a Zod schema
 *
 * This function provides type-safe validation of database query results,
 * converting unknown data into strongly-typed arrays. It integrates with
 * the Result<T, E> pattern to provide explicit error handling.
 *
 * @template T - The expected type after validation (inferred from schema)
 * @param data - Raw query result (unknown type from database)
 * @param schema - Zod schema defining the expected shape
 * @param context - Context information for error logging
 * @returns Result containing validated array or DatabaseValidationError
 *
 * @example
 * ```typescript
 * // Define schema for concept nodes
 * const conceptSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 *   description: z.string().nullable(),
 *   createdAt: z.date(),
 * })
 *
 * // Validate query result
 * const result = validateSqlResult(
 *   rawQueryResult,
 *   conceptSchema,
 *   {
 *     query: 'SELECT * FROM ConceptNode WHERE type = ?',
 *     operation: 'findConceptsByType',
 *     metadata: { type: 'DISEASE' }
 *   }
 * )
 *
 * // Handle result
 * if (isOk(result)) {
 *   // TypeScript knows result.value is Concept[]
 *   console.log(`Found ${result.value.length} concepts`)
 *   result.value.forEach(concept => {
 *     console.log(concept.name) // Type-safe access
 *   })
 * } else {
 *   // TypeScript knows result.error is DatabaseValidationError
 *   console.error('Validation failed:', result.error.message)
 *   console.error('Errors:', result.error.validationErrors)
 *
 *   // Check if retriable (always false for validation errors)
 *   if (result.error.retriable) {
 *     // Won't execute - validation errors are not retriable
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Example: Search results validation
 * const searchResultSchema = z.object({
 *   conceptId: z.string().uuid(),
 *   name: z.string().min(1),
 *   similarity: z.number().min(0).max(1),
 *   metadata: z.record(z.unknown()).optional(),
 * })
 *
 * async function searchConcepts(query: string) {
 *   const rawResults = await db.query(
 *     `SELECT * FROM search_concepts(?) LIMIT 10`,
 *     [query]
 *   )
 *
 *   return validateSqlResult(
 *     rawResults,
 *     searchResultSchema,
 *     {
 *       query: 'search_concepts(?)',
 *       operation: 'searchConcepts',
 *       metadata: { searchQuery: query }
 *     }
 *   )
 * }
 * ```
 */
export function validateSqlResult<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: ValidationContext,
): Result<T[], DatabaseValidationError> {
  // Step 1: Validate that data is an array
  if (!Array.isArray(data)) {
    return err(
      new DatabaseValidationError(
        [`Expected array, received ${typeof data}`],
        {
          query: context.query,
          operation: context.operation,
        },
        {
          receivedType: typeof data,
          ...context.metadata,
        },
      ),
    )
  }

  // Step 2: Validate each row against schema
  const validatedResults: T[] = []
  const validationErrors: string[] = []

  for (let index = 0; index < data.length; index++) {
    const row = data[index]
    const parseResult = schema.safeParse(row)

    if (!parseResult.success) {
      // Collect all validation errors for this row
      // Zod v4 uses 'issues' instead of 'errors'
      const rowErrors = parseResult.error.issues.map((err) => {
        const path = err.path.length > 0 ? err.path.join('.') : 'root'
        return `Row ${index}, field '${path}': ${err.message}`
      })

      validationErrors.push(...rowErrors)
    } else {
      validatedResults.push(parseResult.data)
    }
  }

  // Step 3: Check if any validation errors occurred
  if (validationErrors.length > 0) {
    // Log validation failure for debugging
    console.error('[ValidationError]', {
      operation: context.operation,
      query: context.query.substring(0, 200),
      totalRows: data.length,
      failedRows: validationErrors.length,
      errors: validationErrors,
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
    })

    return err(
      new DatabaseValidationError(
        validationErrors,
        {
          query: context.query,
          operation: context.operation,
        },
        {
          totalRows: data.length,
          validatedRows: validatedResults.length,
          failedRows: validationErrors.length,
          ...context.metadata,
        },
      ),
    )
  }

  // Step 4: Return validated results
  return ok(validatedResults)
}

/* ============================================================================
 * SPECIALIZED VALIDATION FUNCTIONS
 * ========================================================================== */

/**
 * Validates a single row result (expects exactly one row)
 *
 * Useful for queries that should return a single record (e.g., findById)
 *
 * @template T - The expected type after validation
 * @param data - Raw query result
 * @param schema - Zod schema defining the expected shape
 * @param context - Context information for error logging
 * @returns Result containing validated single object or DatabaseValidationError
 *
 * @example
 * ```typescript
 * const conceptSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 * })
 *
 * async function findConceptById(id: string) {
 *   const rawResult = await db.query(
 *     'SELECT * FROM ConceptNode WHERE id = ?',
 *     [id]
 *   )
 *
 *   return validateSingleSqlResult(
 *     rawResult,
 *     conceptSchema,
 *     {
 *       query: 'SELECT * FROM ConceptNode WHERE id = ?',
 *       operation: 'findConceptById',
 *       metadata: { id }
 *     }
 *   )
 * }
 * ```
 */
export function validateSingleSqlResult<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: ValidationContext,
): Result<T, DatabaseValidationError> {
  // First validate as array
  const arrayResult = validateSqlResult(data, schema, context)

  // Check if validation failed
  if (!arrayResult.success) {
    return arrayResult
  }

  // Check if we got exactly one result
  const results = arrayResult.value

  if (results.length === 0) {
    return err(
      new DatabaseValidationError(
        ['Expected exactly 1 row, received 0 rows'],
        {
          query: context.query,
          operation: context.operation,
        },
        {
          rowCount: 0,
          ...context.metadata,
        },
      ),
    )
  }

  if (results.length > 1) {
    return err(
      new DatabaseValidationError(
        [`Expected exactly 1 row, received ${results.length} rows`],
        {
          query: context.query,
          operation: context.operation,
        },
        {
          rowCount: results.length,
          ...context.metadata,
        },
      ),
    )
  }

  // Return the single validated result
  return ok(results[0]!)
}

/**
 * Validates optional single row result (expects 0 or 1 row)
 *
 * Useful for queries that may or may not return a record (e.g., findOptional)
 *
 * @template T - The expected type after validation
 * @param data - Raw query result
 * @param schema - Zod schema defining the expected shape
 * @param context - Context information for error logging
 * @returns Result containing validated single object or undefined, or DatabaseValidationError
 *
 * @example
 * ```typescript
 * async function findConceptByName(name: string) {
 *   const rawResult = await db.query(
 *     'SELECT * FROM ConceptNode WHERE name = ?',
 *     [name]
 *   )
 *
 *   return validateOptionalSqlResult(
 *     rawResult,
 *     conceptSchema,
 *     {
 *       query: 'SELECT * FROM ConceptNode WHERE name = ?',
 *       operation: 'findConceptByName',
 *       metadata: { name }
 *     }
 *   )
 * }
 * ```
 */
export function validateOptionalSqlResult<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: ValidationContext,
): Result<T | undefined, DatabaseValidationError> {
  // First validate as array
  const arrayResult = validateSqlResult(data, schema, context)

  // Check if validation failed
  if (!arrayResult.success) {
    return arrayResult
  }

  // Check if we got 0 or 1 result
  const results = arrayResult.value

  if (results.length === 0) {
    return ok(undefined)
  }

  if (results.length > 1) {
    return err(
      new DatabaseValidationError(
        [`Expected at most 1 row, received ${results.length} rows`],
        {
          query: context.query,
          operation: context.operation,
        },
        {
          rowCount: results.length,
          ...context.metadata,
        },
      ),
    )
  }

  // Return the single validated result
  return ok(results[0]!)
}

/* ============================================================================
 * UTILITY TYPES
 * ========================================================================== */

/**
 * Extract the inferred type from a Zod schema
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   id: z.string(),
 *   name: z.string(),
 * })
 *
 * type User = InferSchemaType<typeof userSchema>
 * // Equivalent to: { id: string; name: string }
 * ```
 */
export type InferSchemaType<TSchema extends z.ZodSchema> = z.infer<TSchema>

/**
 * Create a validated query result type
 *
 * @example
 * ```typescript
 * const conceptSchema = z.object({ id: z.string(), name: z.string() })
 *
 * type ConceptQueryResult = ValidatedQueryResult<typeof conceptSchema>
 * // Equivalent to: Result<{ id: string; name: string }[], DatabaseValidationError>
 * ```
 */
export type ValidatedQueryResult<TSchema extends z.ZodSchema> = Result<
  Array<InferSchemaType<TSchema>>,
  DatabaseValidationError
>

/**
 * Create a validated single result type
 *
 * @example
 * ```typescript
 * type ConceptSingleResult = ValidatedSingleResult<typeof conceptSchema>
 * // Equivalent to: Result<{ id: string; name: string }, DatabaseValidationError>
 * ```
 */
export type ValidatedSingleResult<TSchema extends z.ZodSchema> = Result<
  InferSchemaType<TSchema>,
  DatabaseValidationError
>

/**
 * Create a validated optional result type
 *
 * @example
 * ```typescript
 * type ConceptOptionalResult = ValidatedOptionalResult<typeof conceptSchema>
 * // Equivalent to: Result<{ id: string; name: string } | undefined, DatabaseValidationError>
 * ```
 */
export type ValidatedOptionalResult<TSchema extends z.ZodSchema> = Result<
  InferSchemaType<TSchema> | undefined,
  DatabaseValidationError
>

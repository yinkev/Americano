/**
 * Zod Validation Schemas for Search API
 * Story 3.1 Task 4.4: Request validation and error handling
 *
 * Defines validation schemas for search requests using Zod
 * Ensures type-safe request parsing with detailed error messages
 */

import { z } from 'zod'

/**
 * Search filters schema
 * Validates optional filter parameters
 */
export const searchFiltersSchema = z
  .object({
    courseIds: z.array(z.string().cuid()).optional(),
    dateRange: z
      .object({
        start: z.coerce.date(),
        end: z.coerce.date(),
      })
      .refine((data) => data.start <= data.end, {
        message: 'Start date must be before or equal to end date',
      })
      .optional(),
    contentTypes: z.array(z.enum(['lecture', 'chunk', 'objective', 'concept'])).optional(),
    categories: z.array(z.string()).optional(),
    highYieldOnly: z.boolean().optional(),
    minSimilarity: z.number().min(0).max(1).optional(),
  })
  .strict()

/**
 * POST /api/search request body validation
 * Validates semantic search query parameters
 */
export const searchRequestSchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(500, 'Search query must not exceed 500 characters')
    .trim(),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .optional()
    .default(20),
  offset: z.number().int().min(0, 'Offset must be non-negative').optional().default(0),
  filters: searchFiltersSchema.optional(),
})

/**
 * Type inference from Zod schema
 * Ensures type safety between validation and TypeScript types
 */
export type SearchRequestValidated = z.infer<typeof searchRequestSchema>

/**
 * GET /api/search/suggestions query parameters validation
 * Validates autocomplete query parameters
 */
export const suggestionsRequestSchema = z.object({
  q: z
    .string()
    .min(2, 'Query must be at least 2 characters')
    .max(100, 'Query must not exceed 100 characters')
    .trim(),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(20, 'Limit must not exceed 20')
    .optional()
    .default(5),
  courseId: z.string().cuid().optional(),
})

/**
 * Type inference for suggestions request
 */
export type SuggestionsRequestValidated = z.infer<typeof suggestionsRequestSchema>

/**
 * Validation helper for query parameters
 * Converts URLSearchParams to typed object
 *
 * @example
 * const params = parseQueryParams(request.url, suggestionsRequestSchema)
 * if (!params.success) {
 *   return Response.json(errorResponse('VALIDATION_ERROR', params.error), { status: 400 })
 * }
 */
export function parseQueryParams<T extends z.ZodTypeAny>(
  url: string,
  schema: T,
): { success: true; data: z.infer<T> } | { success: false; error: string; details: any } {
  try {
    const { searchParams } = new URL(url)
    const params: Record<string, any> = {}

    // Convert searchParams to object
    searchParams.forEach((value, key) => {
      // Try to parse numbers
      if (!isNaN(Number(value))) {
        params[key] = Number(value)
      } else if (value === 'true' || value === 'false') {
        // Parse booleans
        params[key] = value === 'true'
      } else {
        params[key] = value
      }
    })

    const result = schema.safeParse(params)

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')
      return {
        success: false,
        error: errorMessage,
        details: result.error.flatten(),
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid URL',
      details: null,
    }
  }
}

/**
 * Validation helper for JSON request body
 * Parses and validates request body with detailed error handling
 *
 * @example
 * const body = await parseRequestBody(request, searchRequestSchema)
 * if (!body.success) {
 *   return Response.json(errorResponse('VALIDATION_ERROR', body.error, body.details), { status: 400 })
 * }
 */
export async function parseRequestBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string; details: any }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errorMessage = result.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join(', ')
      return {
        success: false,
        error: errorMessage,
        details: result.error.flatten(),
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: 'Invalid JSON in request body',
        details: null,
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse request body',
      details: null,
    }
  }
}

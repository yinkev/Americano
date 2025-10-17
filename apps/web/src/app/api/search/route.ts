/**
 * POST /api/search
 * Semantic Search API Endpoint
 *
 * Story 3.1 Task 4.1: Create POST /api/search endpoint for semantic search
 *
 * Performs natural language semantic search across all content using vector embeddings.
 * Supports advanced filtering by course, date, content type, and more.
 *
 * @openapi
 * /api/search:
 *   post:
 *     summary: Semantic search across all content
 *     description: |
 *       Search lectures, learning objectives, and concepts using natural language queries.
 *       Returns results ranked by semantic similarity with context snippets and source attribution.
 *
 *       Features:
 *       - Vector-based semantic search (understands meaning, not just keywords)
 *       - Advanced filtering (course, date, content type, high-yield only)
 *       - Pagination support
 *       - Rate limited to 20 requests per minute per user
 *
 *       Performance: <1 second response time for typical queries
 *     tags:
 *       - Search
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 500
 *                 description: Natural language search query
 *                 example: "How does the cardiac conduction system work?"
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 description: Maximum number of results to return
 *               offset:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *                 description: Pagination offset
 *               filters:
 *                 type: object
 *                 properties:
 *                   courseIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Filter by specific course IDs
 *                   dateRange:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                   contentTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [lecture, chunk, objective, concept]
 *                   highYieldOnly:
 *                     type: boolean
 *                     description: Only return board exam relevant content
 *                   minSimilarity:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     description: Minimum similarity score threshold
 *     responses:
 *       200:
 *         description: Search results
 *         headers:
 *           X-RateLimit-Limit:
 *             description: Maximum requests allowed per window
 *             schema:
 *               type: integer
 *           X-RateLimit-Remaining:
 *             description: Remaining requests in current window
 *             schema:
 *               type: integer
 *           X-RateLimit-Reset:
 *             description: When the rate limit resets
 *             schema:
 *               type: string
 *               format: date-time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [lecture, chunk, objective, concept]
 *                           title:
 *                             type: string
 *                           snippet:
 *                             type: string
 *                             description: Context snippet with highlighted terms
 *                           similarity:
 *                             type: number
 *                             description: Cosine similarity score (0.0 to 1.0)
 *                           metadata:
 *                             type: object
 *                     total:
 *                       type: integer
 *                     latency:
 *                       type: integer
 *                       description: Query processing time in milliseconds
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 *         headers:
 *           Retry-After:
 *             description: Seconds until client should retry
 *             schema:
 *               type: integer
 *       500:
 *         description: Server error
 */

import { withErrorHandler } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withRateLimit, searchRateLimiter } from '@/lib/rate-limiter'
import { parseRequestBody, searchRequestSchema } from '@/subsystems/knowledge-graph/validation'
import { semanticSearchEngine } from '@/subsystems/knowledge-graph/semantic-search'
import { prisma } from '@/lib/db'
import type { SearchAnalytics } from '@/subsystems/knowledge-graph/types'

/**
 * POST /api/search handler
 * Performs semantic search with rate limiting and validation
 */
async function handler(request: Request) {
  const startTime = Date.now()

  // Get user (MVP: hardcoded to kevy@americano.dev)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(
      errorResponse('USER_NOT_FOUND', 'User not found'),
      { status: 404 }
    )
  }

  // Parse and validate request body
  const validation = await parseRequestBody(request, searchRequestSchema)

  if (!validation.success) {
    return Response.json(
      errorResponse('VALIDATION_ERROR', validation.error, validation.details),
      { status: 400 }
    )
  }

  const { query, limit, offset, filters } = validation.data

  try {
    // Perform semantic search
    const searchResults = await semanticSearchEngine.search(query, {
      limit,
      offset,
      filters,
    })

    const { results, total, latency: searchLatency } = searchResults
    const totalLatency = Date.now() - startTime

    // Log search query for analytics (async, non-blocking)
    // Story 3.1 Task 6: Search History and Analytics
    logSearchQuery({
      userId: user.id,
      query,
      filters,
      resultCount: total,
      topResultId: results.length > 0 ? results[0].id : undefined,
      responseTimeMs: totalLatency,
      timestamp: new Date(),
    }).catch(error => {
      // Log error but don't fail the request
      console.error('Failed to log search query:', error)
    })

    // Return search results
    return Response.json(
      successResponse({
        results,
        total,
        latency: totalLatency,
        query,
        filters: filters || {},
        pagination: {
          limit,
          offset,
          hasMore: offset + results.length < total,
        },
      })
    )
  } catch (error) {
    console.error('Search failed:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      errorResponse(
        'SEARCH_FAILED',
        'Failed to perform search. Please try again.',
        { error: errorMessage }
      ),
      { status: 500 }
    )
  }
}

/**
 * Log search query to database for analytics
 * Story 3.1 Task 6: Search History and Analytics
 *
 * @param analytics - Search analytics data
 */
async function logSearchQuery(analytics: SearchAnalytics): Promise<void> {
  try {
    await prisma.searchQuery.create({
      data: {
        userId: analytics.userId,
        query: analytics.query,
        filters: analytics.filters as any, // Prisma Json type
        resultCount: analytics.resultCount,
        topResultId: analytics.topResultId,
        responseTimeMs: analytics.responseTimeMs,
        timestamp: analytics.timestamp,
      },
    })
  } catch (error) {
    // Silently fail - analytics logging should not break search
    console.error('Failed to log search query:', error)
  }
}

/**
 * Export POST handler with rate limiting and error handling
 * Rate limit: 20 requests per minute per user
 */
export const POST = withRateLimit(
  searchRateLimiter,
  withErrorHandler(handler)
)

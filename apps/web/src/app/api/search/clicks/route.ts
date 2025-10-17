/**
 * POST /api/search/clicks
 * Search Click Tracking API Endpoint
 *
 * Story 3.1 Task 6.2: Track click-through rates on search results
 *
 * Records when a user clicks on a search result to analyze:
 * - Click-through rates (CTR) overall and by position
 * - Which types of results users prefer
 * - Result relevance based on click position vs. similarity score
 *
 * @openapi
 * /api/search/clicks:
 *   post:
 *     summary: Track search result click
 *     description: |
 *       Records a click on a search result for analytics purposes.
 *       This data is used to:
 *       - Calculate click-through rates
 *       - Improve search result ranking
 *       - Identify most relevant content types
 *
 *       Privacy: Click data is anonymized after 90 days per GDPR compliance.
 *     tags:
 *       - Search
 *       - Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - searchQueryId
 *               - resultId
 *               - resultType
 *               - position
 *             properties:
 *               searchQueryId:
 *                 type: string
 *                 description: ID of the search query that produced this result
 *                 example: "clxxx123"
 *               resultId:
 *                 type: string
 *                 description: ID of the clicked result (lectureId, objectiveId, etc.)
 *                 example: "lecture_abc123"
 *               resultType:
 *                 type: string
 *                 enum: [lecture, chunk, objective, concept]
 *                 description: Type of result clicked
 *                 example: "lecture"
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 description: Position in search results (0-based index)
 *                 example: 0
 *               similarity:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Semantic similarity score of clicked result
 *                 example: 0.87
 *     responses:
 *       201:
 *         description: Click tracked successfully
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
 *                     clickId:
 *                       type: string
 *                       description: ID of the created click record
 *       400:
 *         description: Validation error
 *       404:
 *         description: User or search query not found
 *       500:
 *         description: Server error
 */

import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { searchAnalyticsService } from '@/lib/search-analytics-service'
import { z } from 'zod'

/**
 * Validation schema for click tracking request
 */
const clickTrackingSchema = z.object({
  searchQueryId: z.string().min(1, 'Search query ID is required'),
  resultId: z.string().min(1, 'Result ID is required'),
  resultType: z.enum(['lecture', 'chunk', 'objective', 'concept']),
  position: z.number().int().min(0, 'Position must be non-negative'),
  similarity: z.number().min(0).max(1).optional(),
})

/**
 * POST /api/search/clicks handler
 * Tracks a search result click for analytics
 */
async function handler(request: NextRequest) {
  // Get user (MVP: hardcoded to kevy@americano.dev)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), {
      status: 404,
    })
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return Response.json(
      errorResponse('INVALID_JSON', 'Invalid JSON in request body'),
      { status: 400 }
    )
  }

  const validation = clickTrackingSchema.safeParse(body)

  if (!validation.success) {
    return Response.json(
      errorResponse(
        'VALIDATION_ERROR',
        'Invalid request data',
        validation.error.flatten().fieldErrors
      ),
      { status: 400 }
    )
  }

  const { searchQueryId, resultId, resultType, position, similarity } =
    validation.data

  try {
    // Verify search query exists
    const searchQuery = await prisma.searchQuery.findUnique({
      where: { id: searchQueryId },
    })

    if (!searchQuery) {
      return Response.json(
        errorResponse('SEARCH_QUERY_NOT_FOUND', 'Search query not found'),
        { status: 404 }
      )
    }

    // Track the click (async, non-blocking)
    await searchAnalyticsService.trackSearchClick({
      searchQueryId,
      userId: user.id,
      resultId,
      resultType,
      position,
      similarity,
    })

    return Response.json(
      successResponse({
        message: 'Click tracked successfully',
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to track search click:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      errorResponse(
        'CLICK_TRACKING_FAILED',
        'Failed to track click. Please try again.',
        { error: errorMessage }
      ),
      { status: 500 }
    )
  }
}

/**
 * Export POST handler with error handling
 * No rate limiting - click tracking should be fast and unobtrusive
 */
export const POST = withErrorHandler(handler)

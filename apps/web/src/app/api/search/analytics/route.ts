/**
 * GET /api/search/analytics
 * Search Analytics API Endpoint
 *
 * Story 3.1 Task 6.3: Analytics dashboard showing popular searches, zero-result queries
 *
 * Provides comprehensive search analytics including:
 * - Popular searches (most frequent queries)
 * - Zero-result queries (searches with no results)
 * - Click-through rate (CTR) analysis
 * - Search performance metrics
 *
 * @openapi
 * /api/search/analytics:
 *   get:
 *     summary: Get search analytics
 *     description: |
 *       Returns comprehensive search analytics for the specified time period.
 *       Includes popular searches, zero-result queries, CTR metrics, and performance data.
 *
 *       Privacy: Only non-anonymized data is included in analytics.
 *       Personal data is anonymized after 90 days per GDPR compliance.
 *     tags:
 *       - Search
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: timeWindowDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Time window for analytics in days
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter analytics by specific user (admin only)
 *     responses:
 *       200:
 *         description: Analytics data
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
 *                     popularSearches:
 *                       type: array
 *                       description: Most frequent search queries
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           avgResults:
 *                             type: number
 *                     zeroResultQueries:
 *                       type: array
 *                       description: Queries that returned no results
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           lastSearched:
 *                             type: string
 *                             format: date-time
 *                     ctrAnalytics:
 *                       type: object
 *                       properties:
 *                         overallCTR:
 *                           type: number
 *                           description: Overall click-through rate
 *                         byPosition:
 *                           type: array
 *                           description: CTR by result position
 *                           items:
 *                             type: object
 *                             properties:
 *                               position:
 *                                 type: integer
 *                               ctr:
 *                                 type: number
 *                               clicks:
 *                                 type: integer
 *                         totalSearches:
 *                           type: integer
 *                         totalClicks:
 *                           type: integer
 *                     performanceMetrics:
 *                       type: object
 *                       properties:
 *                         avgResponseTimeMs:
 *                           type: number
 *                         avgResultsPerQuery:
 *                           type: number
 *                         totalSearches:
 *                           type: integer
 *                         p95ResponseTimeMs:
 *                           type: number
 *                           nullable: true
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
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
 * Validation schema for analytics request
 */
const analyticsRequestSchema = z.object({
  timeWindowDays: z.coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .default(30),
  userId: z.string().optional(),
})

/**
 * GET /api/search/analytics handler
 * Returns comprehensive search analytics
 */
async function handler(request: NextRequest) {
  // Get current user
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const currentUser = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!currentUser) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), {
      status: 404,
    })
  }

  // Parse and validate query parameters
  const url = new URL(request.url)
  const params = {
    timeWindowDays: url.searchParams.get('timeWindowDays'),
    userId: url.searchParams.get('userId'),
  }

  const validation = analyticsRequestSchema.safeParse(params)

  if (!validation.success) {
    return Response.json(
      errorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        validation.error.flatten().fieldErrors
      ),
      { status: 400 }
    )
  }

  const { timeWindowDays, userId } = validation.data

  // For MVP: Only allow users to see their own analytics
  // In production, add admin role check for accessing other users' analytics
  const targetUserId = userId || currentUser.id

  if (targetUserId !== currentUser.id) {
    return Response.json(
      errorResponse(
        'FORBIDDEN',
        'You can only view your own analytics (admin features not yet implemented)'
      ),
      { status: 403 }
    )
  }

  try {
    // Get comprehensive analytics summary
    const analytics = await searchAnalyticsService.getSearchAnalyticsSummary(
      targetUserId,
      timeWindowDays
    )

    return Response.json(
      successResponse({
        ...analytics,
        timeWindowDays,
        generatedAt: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.error('Failed to get search analytics:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      errorResponse(
        'ANALYTICS_FAILED',
        'Failed to get search analytics. Please try again.',
        { error: errorMessage }
      ),
      { status: 500 }
    )
  }
}

/**
 * Export GET handler with error handling
 */
export const GET = withErrorHandler(handler)

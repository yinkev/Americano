/**
 * GET /api/analytics/search
 * Story 3.6 Task 5.3: Analytics API Endpoint
 *
 * Comprehensive search analytics dashboard endpoint with:
 * - Daily/weekly/monthly aggregation
 * - Top queries by frequency and CTR
 * - Zero-result queries (gap analysis)
 * - Content type distribution
 * - Search volume over time
 *
 * Query params:
 * - period: 7d, 30d, 90d (default: 30d)
 * - metric: all, queries, ctr, gaps (default: all)
 *
 * @openapi
 * /api/analytics/search:
 *   get:
 *     summary: Get comprehensive search analytics
 *     description: |
 *       Returns detailed search analytics including volume trends, top queries,
 *       content gaps, CTR metrics, and content type distribution.
 *
 *       Supports filtering by time period and specific metric types.
 *     tags:
 *       - Analytics
 *       - Search
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for analytics
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [all, queries, ctr, gaps]
 *           default: all
 *         description: Specific metric type to return
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSearches:
 *                           type: integer
 *                         avgResponseTimeMs:
 *                           type: number
 *                         overallCTR:
 *                           type: number
 *                         contentGapsCount:
 *                           type: integer
 *                     volumeOverTime:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           avgResponseTimeMs:
 *                             type: number
 *                     topQueries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           avgResults:
 *                             type: number
 *                     contentTypeDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           contentType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                     contentGaps:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           query:
 *                             type: string
 *                           searchFrequency:
 *                             type: integer
 *                           avgResultCount:
 *                             type: number
 *                           priorityScore:
 *                             type: number
 *                           lastSearched:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Invalid query parameters
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
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
  metric: z.enum(['all', 'queries', 'ctr', 'gaps']).optional().default('all'),
})

/**
 * GET /api/analytics/search handler
 * Returns comprehensive search analytics for dashboard
 */
async function handler(request: NextRequest) {
  // Get current user (hardcoded for MVP)
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
    period: url.searchParams.get('period'),
    metric: url.searchParams.get('metric'),
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

  const { period, metric } = validation.data

  try {
    // Get comprehensive dashboard analytics
    const analytics = await searchAnalyticsService.getDashboardAnalytics(
      currentUser.id,
      period
    )

    // Filter response based on metric parameter
    let responseData
    switch (metric) {
      case 'queries':
        responseData = {
          topQueries: analytics.topQueries,
          volumeOverTime: analytics.volumeOverTime,
          summary: {
            totalSearches: analytics.summary.totalSearches,
          },
        }
        break
      case 'ctr':
        responseData = {
          topQueriesByCTR: analytics.topQueriesByCTR,
          summary: {
            overallCTR: analytics.summary.overallCTR,
          },
        }
        break
      case 'gaps':
        responseData = {
          contentGaps: analytics.contentGaps,
          summary: {
            contentGapsCount: analytics.summary.contentGapsCount,
          },
        }
        break
      case 'all':
      default:
        responseData = analytics
        break
    }

    return Response.json(
      successResponse({
        ...responseData,
        period,
        generatedAt: new Date().toISOString(),
      })
    )
  } catch (error) {
    console.error('Failed to get analytics:', error)

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

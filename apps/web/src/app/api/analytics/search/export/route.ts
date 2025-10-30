/**
 * GET /api/analytics/search/export
 * Story 3.6 Task 5: Export analytics data
 *
 * Exports search analytics data in JSON or CSV format
 * Supports same period filters as main analytics endpoint
 *
 * Query params:
 * - format: json | csv (required)
 * - period: 7d, 30d, 90d (default: 30d)
 *
 * @openapi
 * /api/analytics/search/export:
 *   get:
 *     summary: Export search analytics data
 *     description: |
 *       Exports comprehensive search analytics in JSON or CSV format.
 *       Includes all analytics metrics with proper formatting for each format.
 *     tags:
 *       - Analytics
 *       - Search
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Export format
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics export file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid query parameters
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-error'
import { errorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { searchAnalyticsService } from '@/lib/search-analytics-service'

/**
 * Validation schema for export request
 */
const exportRequestSchema = z.object({
  format: z.enum(['json', 'csv']),
  period: z.enum(['7d', '30d', '90d']).optional().default('30d'),
})

/**
 * Convert analytics data to CSV format
 */
function convertToCSV(analytics: any): string {
  const lines: string[] = []

  // Header
  lines.push('Search Analytics Export')
  lines.push(`Period: ${analytics.period}`)
  lines.push(`Generated At: ${analytics.generatedAt}`)
  lines.push('')

  // Summary
  lines.push('=== SUMMARY ===')
  lines.push('Metric,Value')
  lines.push(`Total Searches,${analytics.summary.totalSearches}`)
  lines.push(`Avg Response Time (ms),${analytics.summary.avgResponseTimeMs.toFixed(2)}`)
  lines.push(`Overall CTR,${(analytics.summary.overallCTR * 100).toFixed(2)}%`)
  lines.push(`Content Gaps Count,${analytics.summary.contentGapsCount}`)
  lines.push('')

  // Top Queries
  lines.push('=== TOP QUERIES ===')
  lines.push('Query,Count,Avg Results')
  analytics.topQueries.forEach((q: any) => {
    // Escape commas in query text
    const escapedQuery = q.query.includes(',') ? `"${q.query}"` : q.query
    lines.push(`${escapedQuery},${q.count},${q.avgResults.toFixed(1)}`)
  })
  lines.push('')

  // Content Type Distribution
  if (analytics.contentTypeDistribution.length > 0) {
    lines.push('=== CONTENT TYPE DISTRIBUTION ===')
    lines.push('Content Type,Count,Percentage')
    analytics.contentTypeDistribution.forEach((ct: any) => {
      lines.push(`${ct.contentType},${ct.count},${ct.percentage.toFixed(2)}%`)
    })
    lines.push('')
  }

  // Content Gaps
  if (analytics.contentGaps.length > 0) {
    lines.push('=== CONTENT GAPS ===')
    lines.push('Query,Search Frequency,Avg Result Count,Priority Score,Last Searched')
    analytics.contentGaps.forEach((gap: any) => {
      const escapedQuery = gap.query.includes(',') ? `"${gap.query}"` : gap.query
      lines.push(
        `${escapedQuery},${gap.searchFrequency},${gap.avgResultCount.toFixed(1)},${gap.priorityScore.toFixed(2)},${gap.lastSearched}`,
      )
    })
    lines.push('')
  }

  // Volume Over Time
  if (analytics.volumeOverTime.length > 0) {
    lines.push('=== VOLUME OVER TIME ===')
    lines.push('Date,Count,Avg Response Time (ms)')
    analytics.volumeOverTime.forEach((v: any) => {
      lines.push(`${v.date},${v.count},${v.avgResponseTimeMs.toFixed(2)}`)
    })
    lines.push('')
  }

  // Top Queries by CTR
  if (analytics.topQueriesByCTR && analytics.topQueriesByCTR.length > 0) {
    lines.push('=== TOP QUERIES BY CTR ===')
    lines.push('Query,Searches,Clicks,CTR (%),Avg Position')
    analytics.topQueriesByCTR.forEach((q: any) => {
      const escapedQuery = q.query.includes(',') ? `"${q.query}"` : q.query
      lines.push(
        `${escapedQuery},${q.searches},${q.clicks},${q.ctr.toFixed(1)},${q.avgPosition.toFixed(1)}`,
      )
    })
  }

  return lines.join('\n')
}

/**
 * GET /api/analytics/search/export handler
 * Returns analytics data as downloadable file
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
    format: url.searchParams.get('format'),
    period: url.searchParams.get('period'),
  }

  const validation = exportRequestSchema.safeParse(params)

  if (!validation.success) {
    return Response.json(
      errorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters. Format is required and must be "json" or "csv".',
        validation.error.flatten().fieldErrors,
      ),
      { status: 400 },
    )
  }

  const { format, period } = validation.data

  try {
    // Get comprehensive dashboard analytics
    const analytics = await searchAnalyticsService.getDashboardAnalytics(currentUser.id, period)

    const exportData = {
      ...analytics,
      period,
      generatedAt: new Date().toISOString(),
      exportedBy: currentUser.email,
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
    const filename = `search-analytics-${period}-${timestamp}.${format}`

    // Return data in requested format
    if (format === 'json') {
      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    } else {
      // CSV format
      const csvData = convertToCSV(exportData)
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (error) {
    console.error('Failed to export analytics:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      errorResponse('EXPORT_FAILED', 'Failed to export analytics data. Please try again.', {
        error: errorMessage,
      }),
      { status: 500 },
    )
  }
}

/**
 * Export GET handler with error handling
 */
export const GET = withErrorHandler(handler)

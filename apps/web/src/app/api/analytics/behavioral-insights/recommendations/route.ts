/**
 * GET /api/analytics/behavioral-insights/recommendations
 *
 * Returns prioritized recommendations from RecommendationsEngine
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 6
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { RecommendationsEngine } from '@/subsystems/behavioral-analytics/recommendations-engine'

// Zod validation schema for query parameters
const RecommendationsQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  includeApplied: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default('false'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 5))
    .refine((val) => val > 0 && val <= 20, 'limit must be between 1 and 20'),
})

/**
 * GET /api/analytics/behavioral-insights/recommendations
 *
 * Query params:
 * - userId: string (required)
 * - includeApplied: boolean (default: false) - Include applied recommendations
 * - limit: number (default: 5, max: 20) - Max recommendations to return
 *
 * Returns:
 * - Recommendation[] sorted by priority score with confidence, estimated impact, actionable text
 * - Integrates BehavioralInsight from Story 5.1 and InterventionRecommendation from Story 5.2
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = RecommendationsQuerySchema.parse({
    userId: searchParams.get('userId') || '',
    includeApplied: searchParams.get('includeApplied') || undefined,
    limit: searchParams.get('limit') || undefined,
  })

  // Generate fresh recommendations using RecommendationsEngine
  const recommendations = await RecommendationsEngine.generateRecommendations(
    params.userId
  )

  // Filter out applied recommendations if requested
  let filteredRecommendations = recommendations
  if (!params.includeApplied) {
    filteredRecommendations = recommendations.filter((rec) => !rec.appliedAt)
  }

  // Apply limit
  const limitedRecommendations = filteredRecommendations.slice(0, params.limit)

  return Response.json(
    successResponse({
      recommendations: limitedRecommendations,
      count: limitedRecommendations.length,
      total: filteredRecommendations.length,
    })
  )
})

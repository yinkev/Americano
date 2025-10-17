/**
 * GET /api/analytics/insights
 *
 * Retrieve active behavioral insights (not yet acknowledged)
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.3
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'

// Zod validation schema for query parameters
const InsightsQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
})

/**
 * GET /api/analytics/insights
 *
 * Returns active behavioral insights (acknowledgedAt IS NULL)
 * - Includes supporting patterns with confidence scores
 * - Sorted by confidence DESC
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = InsightsQuerySchema.parse({
    userId: searchParams.get('userId') || '',
  })

  // Query active insights (not acknowledged) with supporting patterns
  const insights = await prisma.behavioralInsight.findMany({
    where: {
      userId: params.userId,
      acknowledgedAt: null,
    },
    orderBy: {
      confidence: 'desc',
    },
    include: {
      patterns: {
        include: {
          pattern: {
            select: {
              id: true,
              patternType: true,
              patternName: true,
              confidence: true,
              detectedAt: true,
              lastSeenAt: true,
            },
          },
        },
      },
    },
  })

  // Transform to include supportingPatterns array
  const insightsWithPatterns = insights.map((insight) => ({
    id: insight.id,
    userId: insight.userId,
    insightType: insight.insightType,
    title: insight.title,
    description: insight.description,
    actionableRecommendation: insight.actionableRecommendation,
    confidence: insight.confidence,
    createdAt: insight.createdAt,
    acknowledgedAt: insight.acknowledgedAt,
    applied: insight.applied,
    supportingPatterns: insight.patterns.map((p) => p.pattern),
  }))

  return Response.json(
    successResponse({
      insights: insightsWithPatterns,
      count: insightsWithPatterns.length,
    })
  )
})

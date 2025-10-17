/**
 * GET /api/analytics/patterns
 *
 * Retrieve stored behavioral patterns with filtering
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.2
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'

// Zod validation schema for query parameters
const PatternsQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  patternType: z
    .enum([
      'OPTIMAL_STUDY_TIME',
      'SESSION_DURATION_PREFERENCE',
      'CONTENT_TYPE_PREFERENCE',
      'PERFORMANCE_PEAK',
      'ATTENTION_CYCLE',
      'FORGETTING_CURVE',
    ])
    .optional(),
  minConfidence: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0.6))
    .refine((val) => val >= 0 && val <= 1, 'minConfidence must be between 0 and 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, 'limit must be between 1 and 100'),
})

/**
 * GET /api/analytics/patterns
 *
 * Returns behavioral patterns filtered by:
 * - patternType (optional)
 * - minConfidence (default: 0.6)
 * - limit (default: 20)
 *
 * Sorted by confidence DESC, lastSeenAt DESC
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = PatternsQuerySchema.parse({
    userId: searchParams.get('userId') || '',
    patternType: searchParams.get('patternType') || undefined,
    minConfidence: searchParams.get('minConfidence') || undefined,
    limit: searchParams.get('limit') || undefined,
  })

  // Build query filter
  const whereClause: any = {
    userId: params.userId,
    confidence: {
      gte: params.minConfidence,
    },
  }

  if (params.patternType) {
    whereClause.patternType = params.patternType
  }

  // Query behavioral patterns
  const patterns = await prisma.behavioralPattern.findMany({
    where: whereClause,
    orderBy: [{ confidence: 'desc' }, { lastSeenAt: 'desc' }],
    take: params.limit,
  })

  return Response.json(
    successResponse({
      patterns,
      count: patterns.length,
    })
  )
})

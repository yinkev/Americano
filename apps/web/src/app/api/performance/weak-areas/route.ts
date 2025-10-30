/**
 * GET /api/performance/weak-areas
 * Story 2.2 Task 3.2
 *
 * Returns learning objectives with highest weakness scores
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { PerformanceCalculator } from '@/lib/performance-calculator'

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  courseId: z.string().cuid().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev'

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const query = QuerySchema.parse({
      limit: searchParams.get('limit') || 10,
      courseId: searchParams.get('courseId') || undefined,
    })

    // Identify weak areas (weakness score >= 0.6)
    const weakAreas = await PerformanceCalculator.identifyWeakAreas(
      userId,
      0.6,
      query.limit,
      query.courseId,
    )

    // Format response
    const formattedWeakAreas = weakAreas.map((obj: any) => ({
      id: obj.id,
      objective: obj.objective,
      complexity: obj.complexity,
      weaknessScore: obj.weaknessScore,
      masteryLevel: obj.masteryLevel,
      lastStudiedAt: obj.lastStudiedAt,
      lecture: obj.lecture,
    }))

    // Recommendation based on weakest area
    let recommendedFocus = 'No weak areas identified. Great work!'
    if (weakAreas.length > 0) {
      const weakest = weakAreas[0]
      recommendedFocus = `Focus on "${weakest.objective}" (weakness score: ${weakest.weaknessScore.toFixed(2)})`
    }

    return Response.json(
      successResponse({
        weakAreas: formattedWeakAreas,
        totalWeak: weakAreas.length,
        recommendedFocus,
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters'), {
        status: 400,
      })
    }

    console.error('Error fetching weak areas:', error)
    return Response.json(errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch weak areas'), {
      status: 500,
    })
  }
}

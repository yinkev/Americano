/**
 * Priority Query API - Prioritized Objectives
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import type { NextRequest } from 'next/server'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { PrioritizationEngine } from '@/lib/prioritization-engine'
import { priorityFiltersSchema } from '@/lib/validation/exam'

/**
 * GET /api/priorities/objectives - Get prioritized objectives
 */
async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  const { searchParams } = request.nextUrl

  // Parse query parameters
  const filters = priorityFiltersSchema.parse({
    limit: searchParams.get('limit'),
    courseId: searchParams.get('courseId'),
    minPriority: searchParams.get('minPriority'),
    excludeRecent: searchParams.get('excludeRecent'),
  })

  // Get prioritized objectives
  const engine = new PrioritizationEngine()
  const objectives = await engine.getPrioritizedObjectives(userId, filters)

  return Response.json(
    successResponse({
      objectives,
      totalCount: objectives.length,
      filters,
    }),
  )
}

const GETHandler = withErrorHandler(GET)

export { GETHandler as GET }

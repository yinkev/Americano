/**
 * Priorities API - GET prioritized learning objectives
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import type { NextRequest } from 'next/server'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { PrioritizationEngine } from '@/lib/prioritization-engine'

/**
 * GET /api/priorities - Get prioritized learning objectives
 * Query params:
 *   - courseId: Filter by course
 *   - minPriority: Minimum priority threshold (0.0-1.0)
 *   - limit: Maximum number of results
 */
async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  const { searchParams } = request.nextUrl
  const courseId = searchParams.get('courseId') || undefined
  const minPriority = parseFloat(searchParams.get('minPriority') || '0')
  const limit = parseInt(searchParams.get('limit') || '20')

  const engine = new PrioritizationEngine()

  // Get prioritized objectives
  const prioritized = await engine.getPrioritizedObjectives(userId, {
    courseId,
    minPriority,
    limit,
    excludeRecent: false,
  })

  // Format for frontend with priority explanations
  const objectivesWithExplanations = await Promise.all(
    prioritized.map(async (item) => {
      const explanation = await engine.explainPrioritization({
        userId,
        objectiveId: item.objective.id,
      })

      return {
        id: item.objective.id,
        title: item.objective.objective,
        description: item.objective.objective, // Using objective text as description
        complexity: item.objective.complexity,
        estimatedMinutes: 30, // Default estimate, could be calculated from content
        courseId: item.objective.lecture?.courseId || '',
        course: {
          id: item.objective.lecture?.courseId || '',
          name: item.objective.lecture?.course?.name || 'Unknown',
          code: 'CODE', // Would need to add code to lecture query
        },
        priorityScore: item.priorityScore,
        priorityExplanation: explanation,
      }
    }),
  )

  return Response.json(successResponse(objectivesWithExplanations))
}

const GETHandler = withErrorHandler(GET)

export { GETHandler as GET }

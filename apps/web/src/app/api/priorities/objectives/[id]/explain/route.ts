/**
 * Priority Explanation API
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import { NextRequest } from 'next/server'
import { successResponse, ApiError } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-response'
import { PrioritizationEngine } from '@/lib/prioritization-engine'
import { getCurrentUserId } from '@/lib/auth'

/**
 * GET /api/priorities/objectives/:id/explain - Explain priority
 */
async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  const params = await props.params
  const { id: objectiveId } = params

  try {
    // Generate priority explanation
    const engine = new PrioritizationEngine()
    const explanation = await engine.explainPrioritization({
      userId,
      objectiveId,
    })

    return Response.json(successResponse({ explanation }))
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      throw new ApiError('Objective not found', 404)
    }
    throw error
  }
}

const GETHandler = withErrorHandler(GET)

export { GETHandler as GET }

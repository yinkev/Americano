/**
 * Priority Recommendations API
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-response'
import { PrioritizationEngine } from '@/lib/prioritization-engine'
import { getCurrentUserId } from '@/lib/auth'

/**
 * GET /api/priorities/recommendations - Get top recommendations for mission generation
 */
async function GET(request: NextRequest) {
  const userId = await getCurrentUserId()
  const { searchParams } = request.nextUrl
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  // Get prioritized objectives (high priority only)
  const engine = new PrioritizationEngine()
  const objectives = await engine.getPrioritizedObjectives(userId, {
    minPriority: 0.5, // Only recommend medium+ priority
    limit: Math.min(limit, 50), // Cap at 50
  })

  // Estimate total minutes
  // Use simplified time estimation (BASIC=12, INTERMEDIATE=20, ADVANCED=32)
  const complexityTimeMap: Record<string, number> = {
    BASIC: 12,
    INTERMEDIATE: 20,
    ADVANCED: 32,
  }

  const estimatedMinutes = objectives.reduce((sum, obj) => {
    const baseTime = complexityTimeMap[obj.objective.complexity] || 20
    return sum + baseTime
  }, 0)

  return Response.json(successResponse({
    recommendations: objectives,
    estimatedMinutes,
  }))
}

const GETHandler = withErrorHandler(GET)

export { GETHandler as GET }

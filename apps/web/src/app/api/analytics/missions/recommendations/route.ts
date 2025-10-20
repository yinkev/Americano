/**
 * GET /api/analytics/missions/recommendations
 *
 * Returns personalized mission recommendations based on completion
 * patterns and performance analytics.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation - Task 10.4
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { MissionAnalyticsEngine } from '@/lib/mission-analytics-engine'

/**
 * GET /api/analytics/missions/recommendations
 *
 * Returns personalized recommendations for mission optimization
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', `User ${userEmail} not found`), {
      status: 404,
    })
  }

  // Initialize analytics engine
  const analyticsEngine = new MissionAnalyticsEngine()

  // Get mission adjustments recommendations
  const recommendations = await analyticsEngine.recommendMissionAdjustments(user.id)

  // Format response with rationale
  const formattedRecs = Object.entries(recommendations.adjustments).map(
    ([key, adjustment]: [string, any]) => ({
      type: key,
      ...adjustment,
    }),
  )

  return Response.json(
    successResponse({
      recommendations: formattedRecs,
      rationale: `Based on analysis of your last 14 missions (confidence: ${(
        recommendations.confidence * 100
      ).toFixed(0)}%)`,
    }),
  )
})

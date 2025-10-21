/**
 * GET /api/analytics/missions/correlation
 *
 * Returns performance correlation analysis between mission completion
 * and mastery improvement using Pearson correlation coefficient.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation - Task 10.3
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { MissionAnalyticsEngine } from '@/lib/mission-analytics-engine'

/**
 * GET /api/analytics/missions/correlation
 *
 * Returns statistical correlation between mission completion and performance
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

  // Detect performance correlation
  const correlation = await analyticsEngine.detectPerformanceCorrelation(user.id)

  return Response.json(successResponse(correlation))
})

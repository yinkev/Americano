/**
 * GET /api/analytics/learning-profile
 *
 * Retrieve user learning profile
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.4
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'

// Zod validation schema for query parameters
const ProfileQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
})

/**
 * GET /api/analytics/learning-profile
 *
 * Returns user learning profile
 * - If insufficient data, returns flag + requirements
 * - Checks data sufficiency: 6 weeks, 20+ sessions, 50+ reviews
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = ProfileQuerySchema.parse({
    userId: searchParams.get('userId') || '',
  })

  // Query user learning profile
  const profile = await prisma.userLearningProfile.findUnique({
    where: {
      userId: params.userId,
    },
  })

  // If profile exists, return it
  if (profile) {
    return Response.json(
      successResponse({
        profile,
        insufficientData: false,
      }),
    )
  }

  // If no profile, check data sufficiency
  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 6 * 7)
  sixWeeksAgo.setHours(0, 0, 0, 0)

  // Count study sessions
  const sessionCount = await prisma.studySession.count({
    where: {
      userId: params.userId,
      startedAt: {
        gte: sixWeeksAgo,
      },
    },
  })

  // Count reviews
  const reviewCount = await prisma.review.count({
    where: {
      userId: params.userId,
      reviewedAt: {
        gte: sixWeeksAgo,
      },
    },
  })

  // Calculate weeks of data
  const oldestSession = await prisma.studySession.findFirst({
    where: {
      userId: params.userId,
    },
    orderBy: {
      startedAt: 'asc',
    },
    select: {
      startedAt: true,
    },
  })

  const weeksOfData = oldestSession
    ? Math.floor((Date.now() - oldestSession.startedAt.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0

  // Determine requirements
  const weeksNeeded = Math.max(0, 6 - weeksOfData)
  const sessionsNeeded = Math.max(0, 20 - sessionCount)
  const reviewsNeeded = Math.max(0, 50 - reviewCount)

  const insufficientData = weeksNeeded > 0 || sessionsNeeded > 0 || reviewsNeeded > 0

  return Response.json(
    successResponse({
      profile: null,
      insufficientData,
      dataRequirements: {
        weeksNeeded,
        sessionsNeeded,
        reviewsNeeded,
        currentWeeks: weeksOfData,
        currentSessions: sessionCount,
        currentReviews: reviewCount,
      },
    }),
  )
})

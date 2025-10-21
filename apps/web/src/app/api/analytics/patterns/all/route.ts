// /api/analytics/patterns/all route
// GET: Retrieve all behavioral patterns for the user
// DELETE: Delete all behavioral data for the user (Story 5.1 Task 11)

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/api-response'
import { ApiError, withErrorHandler } from '@/lib/api-error'

/**
 * GET /api/analytics/patterns/all
 * Retrieve all behavioral patterns for the user (no filtering)
 *
 * Query params:
 * - userId: string (required)
 *
 * @returns Array of all behavioral patterns
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate userId
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')

  if (!userId) {
    throw ApiError.badRequest('userId query parameter is required')
  }

  // Query all behavioral patterns
  const patterns = await prisma.behavioralPattern.findMany({
    where: { userId },
    orderBy: [{ confidence: 'desc' }, { lastSeenAt: 'desc' }],
  })

  return Response.json(
    successResponse({
      patterns,
      count: patterns.length,
    }),
  )
})

/**
 * DELETE /api/analytics/patterns/all
 * Delete all behavioral data for the current user
 * This includes:
 * - BehavioralPattern (cascades to InsightPattern)
 * - BehavioralInsight (cascades to InsightPattern)
 * - UserLearningProfile
 *
 * @returns Success confirmation with deletion counts
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: {
      id: true,
    },
  })

  if (!user) {
    throw ApiError.notFound('User not found. Run: npx prisma db seed to create default user')
  }

  // Delete all behavioral data in a transaction
  // Order matters for referential integrity:
  // 1. InsightPattern (join table) - deleted via cascade from BehavioralPattern/BehavioralInsight
  // 2. BehavioralPattern
  // 3. BehavioralInsight
  // 4. UserLearningProfile
  const [deletedPatterns, deletedInsights, deletedProfiles] = await prisma.$transaction([
    prisma.behavioralPattern.deleteMany({
      where: { userId: user.id },
    }),
    prisma.behavioralInsight.deleteMany({
      where: { userId: user.id },
    }),
    prisma.userLearningProfile.deleteMany({
      where: { userId: user.id },
    }),
  ])

  return Response.json(
    successResponse({
      message: 'All behavioral data deleted successfully',
      deletedCounts: {
        patterns: deletedPatterns.count,
        insights: deletedInsights.count,
        profiles: deletedProfiles.count,
      },
    }),
  )
})

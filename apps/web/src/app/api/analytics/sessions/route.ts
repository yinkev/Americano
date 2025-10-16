import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Validation schema for query parameters
const sessionsQuerySchema = z.object({
  userId: z.string().optional(),
  missionId: z.string().optional(),
  dateRangeStart: z.string().optional(), // ISO date string
  dateRangeEnd: z.string().optional(), // ISO date string
})

/**
 * GET /api/analytics/sessions
 *
 * Returns session summaries with completion rates and time statistics.
 *
 * Query Parameters:
 * - userId: Filter by user ID (optional, falls back to X-User-Email header)
 * - missionId: Filter by specific mission (optional)
 * - dateRangeStart: Filter sessions starting from this date (optional, ISO 8601)
 * - dateRangeEnd: Filter sessions up to this date (optional, ISO 8601)
 *
 * Response:
 * - sessions: Array of session summaries
 * - stats: Aggregate statistics across filtered sessions
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams

  // Parse and validate query parameters
  const queryParams = sessionsQuerySchema.parse({
    userId: searchParams.get('userId') || undefined,
    missionId: searchParams.get('missionId') || undefined,
    dateRangeStart: searchParams.get('dateRangeStart') || undefined,
    dateRangeEnd: searchParams.get('dateRangeEnd') || undefined,
  })

  // Get user - either from query param or header
  let userId: string

  if (queryParams.userId) {
    userId = queryParams.userId
  } else {
    // Fallback to header (MVP: no auth, user selected in sidebar)
    const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      throw ApiError.notFound('User')
    }

    userId = user.id
  }

  // Build where clause
  const where: any = {
    userId,
  }

  if (queryParams.missionId) {
    where.missionId = queryParams.missionId
  }

  if (queryParams.dateRangeStart || queryParams.dateRangeEnd) {
    where.startedAt = {}
    if (queryParams.dateRangeStart) {
      where.startedAt.gte = new Date(queryParams.dateRangeStart)
    }
    if (queryParams.dateRangeEnd) {
      where.startedAt.lte = new Date(queryParams.dateRangeEnd)
    }
  }

  // Fetch sessions with related data
  const sessions = await prisma.studySession.findMany({
    where,
    include: {
      mission: {
        select: {
          id: true,
          date: true,
          estimatedMinutes: true,
          completedObjectivesCount: true,
        },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          timeSpentMs: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  })

  // Calculate session summaries
  const sessionSummaries = sessions.map((session) => {
    const isCompleted = !!session.completedAt
    const duration = session.durationMs || 0
    const reviewCount = session.reviews.length

    // Calculate completion rate based on reviews and objectives
    let completionRate = 0
    if (session.mission) {
      const totalObjectives = session.mission.completedObjectivesCount || 0
      const estimatedReviews = totalObjectives * 5 // Rough estimate
      completionRate = estimatedReviews > 0 ? (reviewCount / estimatedReviews) * 100 : 0
    } else {
      // For sessions without missions, base on review count
      completionRate = reviewCount > 0 ? 100 : 0
    }

    // Calculate average rating
    const avgRating =
      reviewCount > 0
        ? session.reviews.reduce((sum, review) => {
            // Convert ReviewRating enum to numeric value
            const ratingValue =
              review.rating === 'EASY'
                ? 4
                : review.rating === 'GOOD'
                  ? 3
                  : review.rating === 'HARD'
                    ? 2
                    : 1
            return sum + ratingValue
          }, 0) / reviewCount
        : 0

    return {
      id: session.id,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() || null,
      durationMs: duration,
      durationMinutes: Math.round(duration / 60000),
      isCompleted,
      completionRate: Math.min(completionRate, 100), // Cap at 100%
      reviewsCompleted: reviewCount,
      newCardsStudied: session.newCardsStudied,
      averageRating: avgRating,
      missionId: session.missionId,
      missionDate: session.mission?.date.toISOString() || null,
      notes: session.sessionNotes,
    }
  })

  // Calculate aggregate statistics
  const completedSessions = sessionSummaries.filter((s) => s.isCompleted)
  const totalDuration = sessionSummaries.reduce((sum, s) => sum + s.durationMs, 0)
  const totalReviews = sessionSummaries.reduce((sum, s) => sum + s.reviewsCompleted, 0)
  const avgCompletionRate =
    sessionSummaries.length > 0
      ? sessionSummaries.reduce((sum, s) => sum + s.completionRate, 0) / sessionSummaries.length
      : 0

  const stats = {
    totalSessions: sessionSummaries.length,
    completedSessions: completedSessions.length,
    totalDurationMs: totalDuration,
    totalDurationMinutes: Math.round(totalDuration / 60000),
    averageDurationMs:
      sessionSummaries.length > 0 ? Math.round(totalDuration / sessionSummaries.length) : 0,
    averageDurationMinutes:
      sessionSummaries.length > 0 ? Math.round(totalDuration / sessionSummaries.length / 60000) : 0,
    totalReviews,
    averageReviewsPerSession:
      sessionSummaries.length > 0 ? Math.round(totalReviews / sessionSummaries.length) : 0,
    averageCompletionRate: Math.round(avgCompletionRate * 100) / 100,
  }

  return Response.json(
    successResponse({
      sessions: sessionSummaries,
      stats,
    }),
  )
})

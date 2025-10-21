import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/api-response'
import { withErrorHandler, ApiError } from '@/lib/api-error'
import { getObjectiveCompletions, getSessionMissionObjectives } from '@/types/mission-helpers'
import { z } from 'zod'

/**
 * GET /api/learning/sessions/recent
 * Story 2.5 Task 12.2: Recent Sessions Endpoint
 *
 * Returns recent study sessions with summary statistics.
 * Used for session history view and quick session selection.
 *
 * Query Parameters:
 * - limit: Number of sessions to return (default: 10, max: 50)
 * - missionId: Filter by specific mission (optional)
 * - userId: User identifier (from header for MVP)
 */

const recentSessionsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  missionId: z.string().optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams

  const queryParams = {
    limit: searchParams.get('limit') || '10',
    missionId: searchParams.get('missionId') || undefined,
  }

  const validatedParams = recentSessionsSchema.parse(queryParams)

  // Get user from header (MVP: no auth)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw ApiError.notFound('User')
  }

  // Build where clause
  const where: any = {
    userId: user.id,
  }

  if (validatedParams.missionId) {
    where.missionId = validatedParams.missionId
  }

  // Fetch recent sessions with summary data
  const sessions = await prisma.studySession.findMany({
    where,
    include: {
      mission: {
        select: {
          id: true,
          date: true,
          status: true,
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
    take: validatedParams.limit,
  })

  // Calculate summary statistics for each session
  const sessionsWithStats = sessions.map((session) => {
    const objectiveCompletions = getObjectiveCompletions(session.objectiveCompletions)
    const missionObjectives = getSessionMissionObjectives(session.missionObjectives)

    // Calculate card statistics
    const totalCards = session.reviews.length
    const correctCards = session.reviews.filter(
      (r) => r.rating === 'GOOD' || r.rating === 'EASY',
    ).length
    const cardAccuracy = totalCards > 0 ? correctCards / totalCards : 0

    const totalCardTimeMs = session.reviews.reduce((sum, r) => sum + r.timeSpentMs, 0)

    // Calculate objective statistics
    const objectivesCompleted = objectiveCompletions.length
    const totalObjectives = missionObjectives.length
    const completionRate = totalObjectives > 0 ? objectivesCompleted / totalObjectives : 0

    const totalObjectiveTimeMs = objectiveCompletions.reduce(
      (sum, c) => sum + (c.timeSpentMs || 0),
      0,
    )

    // Average self-assessment
    const assessments = objectiveCompletions
      .map((c) => c.selfAssessment)
      .filter((a) => a !== undefined)
    const averageSelfAssessment =
      assessments.length > 0
        ? assessments.reduce((sum, a) => sum + a, 0) / assessments.length
        : null

    return {
      id: session.id,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      durationMs: session.durationMs,
      missionId: session.missionId,
      mission: session.mission,
      summary: {
        objectivesCompleted,
        totalObjectives,
        completionRate,
        totalCards,
        cardAccuracy,
        averageSelfAssessment,
        timeBreakdown: {
          totalMs: session.durationMs || 0,
          objectiveMs: totalObjectiveTimeMs,
          cardMs: totalCardTimeMs,
        },
      },
    }
  })

  // Calculate aggregate statistics across all sessions
  const aggregateStats = {
    totalSessions: sessions.length,
    totalStudyTimeMs: sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0),
    totalObjectivesCompleted: sessionsWithStats.reduce(
      (sum, s) => sum + s.summary.objectivesCompleted,
      0,
    ),
    totalCardsReviewed: sessionsWithStats.reduce((sum, s) => sum + s.summary.totalCards, 0),
    averageSessionDurationMs:
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0) / sessions.length
        : 0,
    averageCardAccuracy:
      sessionsWithStats.length > 0
        ? sessionsWithStats.reduce((sum, s) => sum + s.summary.cardAccuracy, 0) /
          sessionsWithStats.length
        : 0,
  }

  return Response.json(
    successResponse({
      sessions: sessionsWithStats,
      aggregateStats,
      pagination: {
        limit: validatedParams.limit,
        returned: sessions.length,
      },
    }),
  )
})

import { startOfDay, subDays } from 'date-fns'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Validation schema for query parameters
const objectivesQuerySchema = z.object({
  userId: z.string().optional(),
  objectiveId: z.string().optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'all']).default('month'),
})

/**
 * GET /api/analytics/objectives
 *
 * Returns objective-level analytics with mastery progression and card performance.
 *
 * Query Parameters:
 * - userId: Filter by user ID (optional, falls back to X-User-Email header)
 * - objectiveId: Get analytics for specific objective (optional)
 * - timeframe: Time period for metrics (week, month, quarter, all) - default: month
 *
 * Response:
 * - objectives: Array of objective analytics with mastery progression
 * - summary: Aggregate statistics across all objectives
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams

  // Parse and validate query parameters
  const queryParams = objectivesQuerySchema.parse({
    userId: searchParams.get('userId') || undefined,
    objectiveId: searchParams.get('objectiveId') || undefined,
    timeframe: searchParams.get('timeframe') || 'month',
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

  // Calculate date range based on timeframe
  const now = new Date()
  let startDate: Date

  switch (queryParams.timeframe) {
    case 'week':
      startDate = subDays(now, 7)
      break
    case 'month':
      startDate = subDays(now, 30)
      break
    case 'quarter':
      startDate = subDays(now, 90)
      break
    default:
      startDate = new Date(0) // Beginning of time
      break
  }

  // Build where clause for objectives
  const objectiveWhere: any = {}
  if (queryParams.objectiveId) {
    objectiveWhere.id = queryParams.objectiveId
  }

  // Fetch learning objectives with related data
  const objectives = await prisma.learningObjective.findMany({
    where: objectiveWhere,
    include: {
      lecture: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      cards: {
        select: {
          id: true,
          difficulty: true,
          stability: true,
          retrievability: true,
          reviewCount: true,
          lapseCount: true,
          lastReviewedAt: true,
        },
      },
      performanceMetrics: {
        where: {
          userId,
          date: {
            gte: startOfDay(startDate),
          },
        },
        orderBy: {
          date: 'asc',
        },
      },
    },
  })

  // Calculate objective analytics
  const objectiveAnalytics = objectives.map((objective) => {
    const metrics = objective.performanceMetrics
    const cards = objective.cards

    // Calculate total study time
    const totalStudyTimeMs = metrics.reduce((sum, m) => sum + m.studyTimeMs, 0)

    // Calculate review statistics
    const totalReviews = metrics.reduce((sum, m) => sum + m.reviewCount, 0)
    const totalCorrect = metrics.reduce((sum, m) => sum + m.correctReviews, 0)
    const totalIncorrect = metrics.reduce((sum, m) => sum + m.incorrectReviews, 0)

    // Calculate accuracy
    const accuracy = totalReviews > 0 ? (totalCorrect / totalReviews) * 100 : 0

    // Calculate average retention score
    const avgRetentionScore =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.retentionScore, 0) / metrics.length
        : 0

    // Calculate mastery progression (time series)
    const masteryProgression = metrics.map((m) => ({
      date: m.date.toISOString(),
      retentionScore: m.retentionScore,
      reviewCount: m.reviewCount,
      studyTimeMs: m.studyTimeMs,
    }))

    // Calculate card performance statistics
    const cardStats = {
      totalCards: cards.length,
      avgDifficulty:
        cards.length > 0 ? cards.reduce((sum, c) => sum + c.difficulty, 0) / cards.length : 0,
      avgStability:
        cards.length > 0 ? cards.reduce((sum, c) => sum + c.stability, 0) / cards.length : 0,
      avgRetrievability:
        cards.length > 0 ? cards.reduce((sum, c) => sum + c.retrievability, 0) / cards.length : 0,
      totalLapses: cards.reduce((sum, c) => sum + c.lapseCount, 0),
      cardsReviewed: cards.filter((c) => c.reviewCount > 0).length,
      lastReviewedAt:
        cards
          .filter((c) => c.lastReviewedAt)
          .sort((a, b) => (b.lastReviewedAt?.getTime() ?? 0) - (a.lastReviewedAt?.getTime() ?? 0))[0]
          ?.lastReviewedAt?.toISOString() || null,
    }

    return {
      id: objective.id,
      objective: objective.objective,
      complexity: objective.complexity,
      isHighYield: objective.isHighYield,
      boardExamTags: objective.boardExamTags,
      masteryLevel: objective.masteryLevel,
      weaknessScore: objective.weaknessScore,
      totalStudyTimeMs,
      totalStudyTimeMinutes: Math.round(totalStudyTimeMs / 60000),
      lastStudiedAt: objective.lastStudiedAt?.toISOString() || null,
      lecture: objective.lecture
        ? {
            id: objective.lecture.id,
            title: objective.lecture.title,
            courseId: objective.lecture.courseId,
            courseName: objective.lecture.course.name,
          }
        : null,
      metrics: {
        totalReviews,
        correctReviews: totalCorrect,
        incorrectReviews: totalIncorrect,
        accuracy: Math.round(accuracy * 100) / 100,
        avgRetentionScore: Math.round(avgRetentionScore * 100) / 100,
      },
      masteryProgression,
      cardPerformance: cardStats,
    }
  })

  // Calculate summary statistics
  const totalStudyTime = objectiveAnalytics.reduce((sum, o) => sum + o.totalStudyTimeMs, 0)
  const totalReviews = objectiveAnalytics.reduce((sum, o) => sum + o.metrics.totalReviews, 0)
  const totalCorrect = objectiveAnalytics.reduce((sum, o) => sum + o.metrics.correctReviews, 0)

  // Count objectives by mastery level
  const masteryLevelCounts = objectiveAnalytics.reduce(
    (acc, o) => {
      acc[o.masteryLevel] = (acc[o.masteryLevel] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const summary = {
    totalObjectives: objectiveAnalytics.length,
    totalStudyTimeMs: totalStudyTime,
    totalStudyTimeMinutes: Math.round(totalStudyTime / 60000),
    totalReviews,
    overallAccuracy:
      totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100 * 100) / 100 : 0,
    highYieldObjectives: objectiveAnalytics.filter((o) => o.isHighYield).length,
    masteryDistribution: masteryLevelCounts,
    avgWeaknessScore:
      objectiveAnalytics.length > 0
        ? Math.round(
            (objectiveAnalytics.reduce((sum, o) => sum + o.weaknessScore, 0) /
              objectiveAnalytics.length) *
              100,
          ) / 100
        : 0,
  }

  return Response.json(
    successResponse({
      objectives: objectiveAnalytics,
      summary,
      timeframe: queryParams.timeframe,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    }),
  )
})

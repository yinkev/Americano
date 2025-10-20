/**
 * GET /api/performance/objectives/:objectiveId
 * Story 2.2 Task 3.1
 *
 * Returns performance metrics for a specific learning objective
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { PerformanceCalculator } from '@/lib/performance-calculator'

const ParamsSchema = z.object({
  objectiveId: z.string().cuid(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ objectiveId: string }> },
) {
  try {
    const params = await context.params
    const validatedParams = ParamsSchema.parse(params)
    const { objectiveId } = validatedParams

    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev'

    // Fetch objective with relations
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            userId: true,
            course: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        cards: true,
      },
    })

    if (!objective) {
      return Response.json(errorResponse(ErrorCodes.NOT_FOUND, 'Learning objective not found'), {
        status: 404,
      })
    }

    // Verify user owns this objective
    if (objective.lecture.userId !== userId) {
      return Response.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized to access this objective'),
        { status: 403 },
      )
    }

    // Fetch review history
    const reviews = await prisma.review.findMany({
      where: {
        userId,
        card: {
          objectiveId,
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
      take: 100, // Last 100 reviews
    })

    // Fetch performance metrics (time-series)
    const performanceMetrics = await prisma.performanceMetric.findMany({
      where: {
        userId,
        learningObjectiveId: objectiveId,
      },
      orderBy: {
        date: 'desc',
      },
      take: 90, // Last 90 days
    })

    // Calculate current metrics
    const retentionScore = PerformanceCalculator.calculateRetentionScore(reviews)
    const weaknessScore = PerformanceCalculator.calculateWeaknessScore(objective, reviews)

    // Determine trend
    let trend = 'stable'
    if (performanceMetrics.length >= 2) {
      const recent = performanceMetrics.slice(0, 7) // Last 7 days
      const older = performanceMetrics.slice(7, 14) // Previous 7 days

      if (recent.length > 0 && older.length > 0) {
        const recentAvg = recent.reduce((sum, m) => sum + m.retentionScore, 0) / recent.length
        const olderAvg = older.reduce((sum, m) => sum + m.retentionScore, 0) / older.length

        if (recentAvg > olderAvg + 0.1) trend = 'improving'
        else if (recentAvg < olderAvg - 0.1) trend = 'declining'
      }
    }

    return Response.json(
      successResponse({
        objective: {
          id: objective.id,
          objective: objective.objective,
          complexity: objective.complexity,
          masteryLevel: objective.masteryLevel,
          weaknessScore,
          retentionScore,
          totalStudyTimeMs: objective.totalStudyTimeMs,
          lastStudiedAt: objective.lastStudiedAt,
          lecture: objective.lecture,
        },
        performanceMetrics,
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          timeSpentMs: r.timeSpentMs,
          reviewedAt: r.reviewedAt,
        })),
        trend,
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid objective ID format'),
        { status: 400 },
      )
    }

    console.error('Error fetching objective performance:', error)
    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch performance data'),
      { status: 500 },
    )
  }
}

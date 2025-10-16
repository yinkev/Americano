/**
 * POST /api/missions/[id]/feedback
 *
 * Submit feedback for a completed mission.
 * Collects helpfulness rating, relevance score, pace rating, and improvement suggestions.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation - Task 4
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { PaceRating } from '@/generated/prisma'

// Zod validation schema for feedback submission
const FeedbackSchema = z.object({
  helpfulnessRating: z.number().min(1).max(5),
  relevanceScore: z.number().min(1).max(5),
  paceRating: z.nativeEnum(PaceRating),
  improvementSuggestions: z.string().optional(),
})

/**
 * POST /api/missions/[id]/feedback
 *
 * Submit mission feedback
 */
export const POST = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: missionId } = await context.params
    const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return Response.json(errorResponse('USER_NOT_FOUND', `User ${userEmail} not found`), { status: 404 })
    }

    // Verify mission exists and belongs to user
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        feedback: true,
      },
    })

    if (!mission) {
      return Response.json(errorResponse('MISSION_NOT_FOUND', `Mission ${missionId} not found`), { status: 404 })
    }

    if (mission.userId !== user.id) {
      return Response.json(errorResponse('UNAUTHORIZED', 'Mission does not belong to user'), { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const feedbackData = FeedbackSchema.parse(body)

    // Create feedback record
    const feedback = await prisma.missionFeedback.create({
      data: {
        userId: user.id,
        missionId,
        helpfulnessRating: feedbackData.helpfulnessRating,
        relevanceScore: feedbackData.relevanceScore,
        paceRating: feedbackData.paceRating,
        improvementSuggestions: feedbackData.improvementSuggestions,
      },
    })

    // Calculate aggregated feedback for this mission
    const allFeedback = await prisma.missionFeedback.findMany({
      where: { missionId },
    })

    const aggregated = {
      avgHelpfulness:
        allFeedback.reduce((sum, f) => sum + f.helpfulnessRating, 0) /
        allFeedback.length,
      avgRelevance:
        allFeedback.reduce((sum, f) => sum + f.relevanceScore, 0) /
        allFeedback.length,
      paceDistribution: {
        too_slow: allFeedback.filter((f) => f.paceRating === 'TOO_SLOW').length,
        just_right: allFeedback.filter((f) => f.paceRating === 'JUST_RIGHT')
          .length,
        too_fast: allFeedback.filter((f) => f.paceRating === 'TOO_FAST').length,
      },
    }

    return Response.json(successResponse({
      success: true,
      message: 'Feedback submitted successfully',
      aggregatedFeedback: aggregated,
    }))
  }
)

/**
 * GET /api/missions/[id]/feedback
 *
 * Retrieve aggregated feedback for a mission
 */
export const GET = withErrorHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id: missionId } = await context.params

    // Get all feedback for this mission
    const feedback = await prisma.missionFeedback.findMany({
      where: { missionId },
    })

    if (feedback.length === 0) {
      return Response.json(successResponse({
        feedback: [],
        aggregated: null,
      }))
    }

    // Calculate aggregated stats
    const aggregated = {
      avgHelpfulness:
        feedback.reduce((sum, f) => sum + f.helpfulnessRating, 0) /
        feedback.length,
      avgRelevance:
        feedback.reduce((sum, f) => sum + f.relevanceScore, 0) / feedback.length,
      paceDistribution: {
        too_slow: feedback.filter((f) => f.paceRating === 'TOO_SLOW').length,
        just_right: feedback.filter((f) => f.paceRating === 'JUST_RIGHT').length,
        too_fast: feedback.filter((f) => f.paceRating === 'TOO_FAST').length,
      },
      totalResponses: feedback.length,
    }

    return Response.json(successResponse({
      feedback,
      aggregated,
    }))
  }
)

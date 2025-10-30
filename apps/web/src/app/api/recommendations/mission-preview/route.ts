/**
 * Story 3.5: Mission Recommendation Preview API
 * GET /api/recommendations/mission-preview - Get recommendations for all mission objectives
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { recommendationEngine } from '@/lib/recommendation-engine'

// ============================================
// Validation Schema
// ============================================

const QuerySchema = z.object({
  missionId: z.string().min(1),
})

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Hard-coded user for MVP
    const userId = 'kevy@americano.dev'

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedParams = QuerySchema.safeParse(queryParams)

    if (!validatedParams.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          validatedParams.error.issues,
        ),
        { status: 400 },
      )
    }

    const { missionId } = validatedParams.data

    // Fetch mission with objectives
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        objectives: true,
        status: true,
      },
    })

    if (!mission) {
      return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, 'Mission not found'), {
        status: 404,
      })
    }

    // Parse objectives
    const objectives = mission.objectives as Array<{
      objectiveId: string
      estimatedMinutes: number
    }>

    // Generate recommendations for each objective
    const objectiveRecommendations = await Promise.all(
      objectives.map(async (obj) => {
        // Fetch objective details
        const objective = await prisma.learningObjective.findUnique({
          where: { id: obj.objectiveId },
          select: {
            id: true,
            objective: true,
            masteryLevel: true,
          },
        })

        if (!objective) {
          return {
            objectiveId: obj.objectiveId,
            objectiveText: 'Unknown',
            recommendations: [],
          }
        }

        // Generate embedding for objective
        const { EmbeddingService } = await import('@/lib/embedding-service')
        const embeddingService = new EmbeddingService()
        const result = await embeddingService.generateEmbedding(objective.objective)

        // Map mastery level to numeric value
        const masteryMap: Record<string, number> = {
          NOT_STARTED: 0,
          BEGINNER: 0.25,
          INTERMEDIATE: 0.5,
          ADVANCED: 0.75,
          MASTERED: 1.0,
        }
        const userMasteryLevel = masteryMap[objective.masteryLevel] ?? 0.5

        // Generate recommendations
        const recommendations = await recommendationEngine.generate({
          userId,
          contextType: 'mission',
          contextId: missionId,
          currentEmbedding: result.embedding,
          currentObjectiveId: objective.id,
          userMasteryLevel,
          limit: 5, // Fewer recommendations per objective for preview
          excludeRecent: true,
        })

        return {
          objectiveId: obj.objectiveId,
          objectiveText: objective.objective,
          recommendations: recommendations.slice(0, 3), // Top 3 for preview
        }
      }),
    )

    return NextResponse.json(
      successResponse({
        missionId,
        objectives: objectiveRecommendations,
        totalObjectives: objectives.length,
      }),
    )
  } catch (error) {
    console.error('[GET /api/recommendations/mission-preview] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error.code, error.message), {
        status: error.statusCode,
      })
    }

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to generate mission preview recommendations',
      ),
      { status: 500 },
    )
  }
}

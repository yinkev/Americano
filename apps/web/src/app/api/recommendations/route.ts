/**
 * Story 3.5: Context-Aware Content Recommendations API
 * GET /api/recommendations - Generate recommendations based on context
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ContentSourceType } from '@/generated/prisma'
import { ApiError, ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { recommendationEngine } from '@/lib/recommendation-engine'

// ============================================
// Validation Schema
// ============================================

const QuerySchema = z.object({
  contextType: z.enum(['session', 'objective', 'mission']),
  contextId: z.string().min(1),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(1).max(50).default(10),
  ),
  sourceTypes: z
    .string()
    .optional()
    .transform((val) => (val ? (val.split(',') as ContentSourceType[]) : undefined)),
  excludeRecent: z.preprocess((val) => (val === 'false' ? false : true), z.boolean().default(true)),
})

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Hard-coded user for MVP (Story 1.5 constraint)
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

    const { contextType, contextId, limit, sourceTypes, excludeRecent } = validatedParams.data

    // Get context embedding based on contextType
    let currentEmbedding: number[] | undefined
    let currentObjectiveId: string | undefined
    let userMasteryLevel = 0.5

    if (contextType === 'objective') {
      // Fetch objective embedding and mastery level
      const { prisma } = await import('@/lib/db')
      const objective = await prisma.learningObjective.findUnique({
        where: { id: contextId },
        select: {
          id: true,
          objective: true,
          masteryLevel: true,
        },
      })

      if (!objective) {
        return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, 'Objective not found'), {
          status: 404,
        })
      }

      currentObjectiveId = objective.id

      // Map masteryLevel enum to numeric value
      const masteryMap: Record<string, number> = {
        NOT_STARTED: 0,
        BEGINNER: 0.25,
        INTERMEDIATE: 0.5,
        ADVANCED: 0.75,
        MASTERED: 1.0,
      }
      userMasteryLevel = masteryMap[objective.masteryLevel] ?? 0.5

      // Generate embedding for objective text
      const { EmbeddingService } = await import('@/lib/embedding-service')
      const embeddingService = new EmbeddingService()
      const result = await embeddingService.generateEmbedding(objective.objective)
      currentEmbedding = result.embedding
    } else if (contextType === 'session') {
      // Get current objective from session
      const { prisma } = await import('@/lib/db')
      const session = await prisma.studySession.findUnique({
        where: { id: contextId },
        select: {
          missionObjectives: true,
          currentObjectiveIndex: true,
        },
      })

      if (!session) {
        return NextResponse.json(errorResponse(ErrorCodes.NOT_FOUND, 'Session not found'), {
          status: 404,
        })
      }

      // Extract current objective from session
      const objectives = session.missionObjectives as Array<{ objectiveId: string }>
      if (objectives && objectives.length > session.currentObjectiveIndex) {
        currentObjectiveId = objectives[session.currentObjectiveIndex].objectiveId

        // Fetch objective for embedding
        const objective = await prisma.learningObjective.findUnique({
          where: { id: currentObjectiveId },
          select: { objective: true, masteryLevel: true },
        })

        if (objective) {
          const masteryMap: Record<string, number> = {
            NOT_STARTED: 0,
            BEGINNER: 0.25,
            INTERMEDIATE: 0.5,
            ADVANCED: 0.75,
            MASTERED: 1.0,
          }
          userMasteryLevel = masteryMap[objective.masteryLevel] ?? 0.5

          const { EmbeddingService } = await import('@/lib/embedding-service')
          const embeddingService = new EmbeddingService()
          const result = await embeddingService.generateEmbedding(objective.objective)
          currentEmbedding = result.embedding
        }
      }
    }

    // Generate recommendations
    const recommendations = await recommendationEngine.generate({
      userId,
      contextType,
      contextId,
      currentEmbedding,
      currentObjectiveId,
      userMasteryLevel,
      limit,
      sourceTypes,
      excludeRecent,
    })

    return NextResponse.json(
      successResponse({
        recommendations,
        total: recommendations.length,
        context: {
          contextType,
          contextId,
          userMasteryLevel,
        },
      }),
    )
  } catch (error) {
    console.error('[GET /api/recommendations] Error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error.code, error.message), {
        status: error.statusCode,
      })
    }

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to generate recommendations'),
      { status: 500 },
    )
  }
}

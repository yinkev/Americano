import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Zod validation schema for query parameters
const GetObjectivesQuerySchema = z.object({
  lectureId: z.string().cuid().optional(),
  complexity: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  isHighYield: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
})

/**
 * GET /api/objectives
 *
 * Fetch learning objectives with optional filters
 *
 * Query parameters:
 * - lectureId?: string (filter by lecture)
 * - complexity?: "BASIC" | "INTERMEDIATE" | "ADVANCED"
 * - isHighYield?: "true" | "false"
 *
 * Response:
 * {
 *   "objectives": LearningObjective[],
 *   "stats": {
 *     "total": number,
 *     "highYield": number,
 *     "complexityBreakdown": { basic: number, intermediate: number, advanced: number }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryData = {
      lectureId: searchParams.get('lectureId') || undefined,
      complexity: searchParams.get('complexity') || undefined,
      isHighYield: searchParams.get('isHighYield') || undefined,
    }

    const validatedQuery = GetObjectivesQuerySchema.parse(queryData)

    // Build where clause for Prisma query
    const whereClause: any = {}

    if (validatedQuery.lectureId) {
      whereClause.lectureId = validatedQuery.lectureId
    }

    if (validatedQuery.complexity) {
      whereClause.complexity = validatedQuery.complexity
    }

    if (validatedQuery.isHighYield !== undefined) {
      whereClause.isHighYield = validatedQuery.isHighYield
    }

    // Fetch objectives with lecture information
    const objectives = await prisma.learningObjective.findMany({
      where: whereClause,
      include: {
        lecture: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                objective: true,
                complexity: true,
              },
            },
          },
        },
      },
      orderBy: [
        { complexity: 'asc' }, // BASIC, INTERMEDIATE, ADVANCED
        { pageStart: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // Calculate stats
    const stats = {
      total: objectives.length,
      highYield: objectives.filter((obj) => obj.isHighYield).length,
      complexityBreakdown: {
        basic: objectives.filter((obj) => obj.complexity === 'BASIC').length,
        intermediate: objectives.filter((obj) => obj.complexity === 'INTERMEDIATE').length,
        advanced: objectives.filter((obj) => obj.complexity === 'ADVANCED').length,
      },
    }

    return Response.json(
      successResponse({
        objectives,
        stats,
      }),
    )
  } catch (error) {
    console.error('Objectives fetch error:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters', error.issues),
        { status: 400 },
      )
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch learning objectives'),
      { status: 500 },
    )
  }
}

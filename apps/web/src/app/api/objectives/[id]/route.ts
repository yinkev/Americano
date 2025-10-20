import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'

// Zod validation schema for update request
const UpdateObjectiveSchema = z.object({
  objective: z.string().min(10).max(500).optional(),
  complexity: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  pageNumber: z.number().int().positive().optional().nullable(),
  isHighYield: z.boolean().optional(),
  boardExamTags: z.array(z.string()).optional(),
})

/**
 * PATCH /api/objectives/:id
 *
 * Update a learning objective
 *
 * Request body:
 * {
 *   "objective"?: string,
 *   "complexity"?: "BASIC" | "INTERMEDIATE" | "ADVANCED",
 *   "pageNumber"?: number | null,
 *   "isHighYield"?: boolean,
 *   "boardExamTags"?: string[]
 * }
 *
 * Response:
 * {
 *   "objective": LearningObjective
 * }
 */
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const objectiveId = params.id

    // Validate objective exists
    const existing = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
    })

    if (!existing) {
      return Response.json(errorResponse(ErrorCodes.NOT_FOUND, 'Learning objective not found'), {
        status: 404,
      })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateObjectiveSchema.parse(body)

    // Update objective
    const updated = await prisma.learningObjective.update({
      where: { id: objectiveId },
      data: validatedData,
    })

    return Response.json(
      successResponse({
        objective: updated,
      }),
    )
  } catch (error) {
    console.error('Objective update error:', error)

    if (error instanceof z.ZodError) {
      return Response.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid request data', error.issues),
        { status: 400 },
      )
    }

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update learning objective'),
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/objectives/:id
 *
 * Delete a learning objective
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Objective deleted successfully"
 * }
 */
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const objectiveId = params.id

    // Validate objective exists
    const existing = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
    })

    if (!existing) {
      return Response.json(errorResponse(ErrorCodes.NOT_FOUND, 'Learning objective not found'), {
        status: 404,
      })
    }

    // Delete objective (cascade delete will handle prerequisites and cards)
    await prisma.learningObjective.delete({
      where: { id: objectiveId },
    })

    return Response.json(
      successResponse({
        success: true,
        message: 'Objective deleted successfully',
      }),
    )
  } catch (error) {
    console.error('Objective delete error:', error)

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete learning objective'),
      { status: 500 },
    )
  }
}

/**
 * GET /api/objectives/:id
 *
 * Get a single learning objective with prerequisites
 *
 * Response:
 * {
 *   "objective": LearningObjective & { prerequisites: ObjectivePrerequisite[] }
 * }
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const objectiveId = params.id

    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
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
    })

    if (!objective) {
      return Response.json(errorResponse(ErrorCodes.NOT_FOUND, 'Learning objective not found'), {
        status: 404,
      })
    }

    return Response.json(
      successResponse({
        objective,
      }),
    )
  } catch (error) {
    console.error('Objective fetch error:', error)

    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch learning objective'),
      { status: 500 },
    )
  }
}

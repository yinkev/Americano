/**
 * Course Priority API
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, ApiError } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-response'
import { setCoursePrioritySchema } from '@/lib/validation/exam'
import { getCurrentUserId } from '@/lib/auth'

/**
 * POST /api/courses/:id/priority - Set course priority
 */
async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId()
  const params = await props.params
  const { id: courseId } = params
  const body = await request.json()

  // Validate input
  const validation = setCoursePrioritySchema.safeParse(body)
  if (!validation.success) {
    throw new ApiError(validation.error.issues[0].message, 400)
  }

  const { priorityLevel } = validation.data

  // Verify course exists and belongs to user
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      userId,
    },
  })

  if (!course) {
    throw new ApiError('Course not found', 404)
  }

  // Upsert course priority
  const coursePriority = await prisma.coursePriority.upsert({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    create: {
      userId,
      courseId,
      priorityLevel,
    },
    update: {
      priorityLevel,
    },
  })

  return Response.json(successResponse({ coursePriority }))
}

const POSTHandler = withErrorHandler(POST)

export { POSTHandler as POST }

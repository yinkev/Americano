/**
 * Priority Feedback API
 * Story 2.3: Intelligent Content Prioritization Algorithm
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, ApiError } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-response'
import { priorityFeedbackSchema } from '@/lib/validation/exam'
import { getCurrentUserId } from '@/lib/auth'

/**
 * POST /api/priorities/feedback - Submit priority feedback
 */
async function POST(request: NextRequest) {
  const userId = await getCurrentUserId()
  const body = await request.json()

  // Validate input
  const validation = priorityFeedbackSchema.safeParse(body)
  if (!validation.success) {
    throw new ApiError(validation.error.issues[0].message, 400)
  }

  const { objectiveId, userFeedback, notes } = validation.data

  // Verify objective exists
  const objective = await prisma.learningObjective.findUnique({
    where: { id: objectiveId },
    select: { id: true },
  })

  if (!objective) {
    throw new ApiError('Objective not found', 404)
  }

  // TODO: Calculate suggested priority before recording feedback
  // For now, use placeholder value
  const suggestedPriority = 0.5

  // Record feedback
  const feedback = await prisma.priorityFeedback.create({
    data: {
      userId,
      objectiveId,
      suggestedPriority,
      userFeedback,
      notes,
    },
  })

  // TODO: Implement adaptive weight adjustment logic (Task 7)
  // This will adjust user's priority factor weights based on feedback patterns
  const adjustmentApplied = false

  return Response.json(
    successResponse({
      feedback,
      adjustmentApplied,
    }),
  )
}

const POSTHandler = withErrorHandler(POST)

export { POSTHandler as POST }

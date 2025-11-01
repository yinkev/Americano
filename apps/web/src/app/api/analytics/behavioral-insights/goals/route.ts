/**
 * GET/POST /api/analytics/behavioral-insights/goals
 *
 * GET: Retrieve behavioral goals for user
 * POST: Create new behavioral goal
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 7
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError } from '@/lib/api-error'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GoalManager } from '@/subsystems/behavioral-analytics/goal-manager'

// Zod validation schema for request body
const CreateGoalSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  goalType: z.enum(
    [
      'STUDY_TIME_CONSISTENCY',
      'SESSION_DURATION',
      'CONTENT_DIVERSIFICATION',
      'RETENTION_IMPROVEMENT',
      'CUSTOM',
    ],
    {
      message: 'goalType is required',
    },
  ),
  title: z.string().optional(),
  description: z.string().optional(),
  targetMetric: z.string().min(1, 'targetMetric is required'),
  targetValue: z.number().positive('targetValue must be positive'),
  deadline: z
    .string()
    .datetime()
    .transform((val) => new Date(val)),
})

/**
 * GET /api/analytics/behavioral-insights/goals
 *
 * Query params:
 * - userId: string (required)
 *
 * Returns:
 * - goals: array of BehavioralGoal objects
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract optional userId and validate against authenticated user
  const searchParams = request.nextUrl.searchParams
  const requestedUserId = searchParams.get('userId') ?? undefined
  const sessionUserId = await getCurrentUserId()

  if (requestedUserId && requestedUserId !== sessionUserId) {
    throw ApiError.forbidden('Forbidden: userId does not match the authenticated user')
  }

  const userId = requestedUserId ?? sessionUserId

  // Query behavioral goals
  const goals = await prisma.behavioralGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(
    successResponse({
      goals,
      count: goals.length,
    }),
  )
})

/**
 * POST /api/analytics/behavioral-insights/goals
 *
 * Body:
 * - userId: string
 * - goalType: BehavioralGoalType
 * - targetMetric: string
 * - targetValue: number
 * - deadline: ISO date string
 * - title?: string (optional override for custom goals)
 * - description?: string
 *
 * Validates:
 * - targetValue > currentValue
 * - deadline ≤ 90 days from now
 * - goalType in enum
 *
 * Returns:
 * - goal: BehavioralGoal
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Parse and validate request body
  const body = await request.json()
  const validatedBody = CreateGoalSchema.parse(body)

  const sessionUserId = await getCurrentUserId()

  if (validatedBody.userId !== sessionUserId) {
    throw ApiError.forbidden('Forbidden: userId does not match the authenticated user')
  }

  // Validate deadline is not in the past
  if (validatedBody.deadline < new Date()) {
    return Response.json(errorResponse('Deadline must be in the future', 'INVALID_DEADLINE'), {
      status: 400,
    })
  }

  // Validate deadline is not more than 90 days from now
  const maxDeadline = new Date()
  maxDeadline.setDate(maxDeadline.getDate() + 90)

  if (validatedBody.deadline > maxDeadline) {
    return Response.json(
      errorResponse('Deadline cannot exceed 90 days from now', 'DEADLINE_TOO_FAR'),
      { status: 400 },
    )
  }

  try {
    // Create goal using GoalManager
    const goal = await GoalManager.createGoal(validatedBody.userId, {
      goalType: validatedBody.goalType,
      title: validatedBody.title,
      description: validatedBody.description,
      targetMetric: validatedBody.targetMetric,
      targetValue: validatedBody.targetValue,
      deadline: validatedBody.deadline,
    })

    return Response.json(
      successResponse({
        goal,
      }),
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific validation errors from GoalManager
      if (error.message.includes('Target value') || error.message.includes('current value')) {
        return Response.json(errorResponse(error.message, 'INVALID_TARGET_VALUE'), { status: 400 })
      }

      if (error.message.includes('Deadline')) {
        return Response.json(errorResponse(error.message, 'INVALID_DEADLINE'), { status: 400 })
      }
    }

    // Re-throw for general error handler
    throw error
  }
})

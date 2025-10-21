/**
 * PATCH /api/analytics/behavioral-insights/goals/:id/progress
 *
 * Updates goal progress (manual or automated)
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 7
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { GoalManager } from '@/subsystems/behavioral-analytics/goal-manager'

// Zod validation schema for request body
const UpdateProgressSchema = z.object({
  currentValue: z.number({ message: 'currentValue is required' }),
  note: z.string().optional(),
})

/**
 * PATCH /api/analytics/behavioral-insights/goals/:id/progress
 *
 * Body:
 * - currentValue: number
 * - note?: string (optional progress note)
 *
 * Updates progressHistory JSON array with { date, value, note }
 * Checks completion: if currentValue >= targetValue, set status = "COMPLETED"
 * Generates milestone notifications at 25%, 50%, 75%
 * Awards badge if goal completed
 *
 * Returns:
 * - goal: BehavioralGoal (updated)
 * - completed: boolean (true if goal was completed with this update)
 */
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedBody = UpdateProgressSchema.parse(body)

    try {
      // Update goal progress using GoalManager
      const result = await GoalManager.updateGoalProgress(
        id,
        validatedBody.currentValue,
        validatedBody.note,
      )

      return Response.json(
        successResponse({
          goal: result.goal,
          completed: result.completed,
        }),
      )
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific errors from GoalManager
        if (error.message.includes('not found')) {
          return Response.json(errorResponse('Goal not found', 'NOT_FOUND'), { status: 404 })
        }

        if (error.message.includes('Cannot update progress')) {
          return Response.json(errorResponse(error.message, 'INVALID_STATUS'), { status: 400 })
        }
      }

      // Re-throw for general error handler
      throw error
    }
  },
)

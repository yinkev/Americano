/**
 * API Route: POST /api/calibration/intervention-dismiss
 *
 * Tracks when a user dismisses a metacognitive intervention.
 * Records dismissal for effectiveness tracking and cooldown enforcement.
 *
 * @see docs/stories/story-4.4.md - Task 8: Metacognitive Intervention Engine
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import {
  MetacognitiveInterventionEngine,
  InterventionType,
} from '@/lib/metacognitive-interventions'

/**
 * Request schema validation
 */
const RequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  interventionType: z.nativeEnum(InterventionType, {
    errorMap: () => ({ message: 'Invalid intervention type' }),
  }),
  correlationAtDismissal: z.number().min(-1).max(1),
  assessmentCount: z.number().int().min(0),
})

/**
 * POST /api/calibration/intervention-dismiss
 *
 * Tracks intervention dismissal for a user.
 *
 * Request body:
 * - userId: string (required)
 * - interventionType: InterventionType enum (required)
 * - correlationAtDismissal: number (-1 to 1) (required)
 * - assessmentCount: number (integer >= 0) (required)
 *
 * Response:
 * - success: boolean
 * - message: string
 *
 * Error codes:
 * - VALIDATION_ERROR: Invalid request body
 * - INTERNAL_ERROR: Database or processing error
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validationResult = RequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request body',
          validationResult.error.errors,
        ),
        { status: 400 },
      )
    }

    const { userId, interventionType, correlationAtDismissal, assessmentCount } =
      validationResult.data

    // Track dismissal
    await MetacognitiveInterventionEngine.trackInterventionDismissal(
      userId,
      interventionType,
      correlationAtDismissal,
      assessmentCount,
    )

    return NextResponse.json(
      successResponse({
        success: true,
        message: 'Intervention dismissal recorded successfully',
      }),
    )
  } catch (error) {
    console.error('Error tracking intervention dismissal:', error)

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to track intervention dismissal',
      ),
      { status: 500 },
    )
  }
}

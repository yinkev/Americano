/**
 * API Route: POST /api/calibration/intervention-check
 *
 * Checks if user needs a metacognitive intervention based on calibration health.
 * Analyzes recent assessment history to determine if correlation coefficient
 * is below threshold (< 0.5) and provides intervention recommendations.
 *
 * @see docs/stories/story-4.4.md - Task 8: Metacognitive Intervention Engine
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import {
  MetacognitiveInterventionEngine,
  type CalibrationHealthCheck,
  type InterventionRecommendation,
} from '@/lib/metacognitive-interventions'

/**
 * Request schema validation
 */
const RequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

/**
 * Response type for intervention check
 */
interface InterventionCheckResponse {
  healthCheck: CalibrationHealthCheck
  recommendation?: InterventionRecommendation
}

/**
 * POST /api/calibration/intervention-check
 *
 * Checks calibration health and returns intervention if needed.
 *
 * Request body:
 * - userId: string (required)
 *
 * Response:
 * - healthCheck: CalibrationHealthCheck object
 * - recommendation?: InterventionRecommendation (only if intervention needed)
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

    const { userId } = validationResult.data

    // Check calibration health
    const healthCheck = await MetacognitiveInterventionEngine.checkCalibrationHealth(userId)

    // If intervention needed, generate recommendations
    let recommendation: InterventionRecommendation | undefined

    if (healthCheck.needsIntervention && healthCheck.interventionType) {
      recommendation = await MetacognitiveInterventionEngine.generateInterventionRecommendations(
        userId,
        healthCheck.interventionType,
      )
    }

    const response: InterventionCheckResponse = {
      healthCheck,
      recommendation,
    }

    return NextResponse.json(successResponse(response))
  } catch (error) {
    console.error('Error checking calibration intervention:', error)

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to check calibration intervention',
      ),
      { status: 500 },
    )
  }
}

/**
 * GET /api/calibration/intervention-check?userId={userId}
 *
 * Alternative GET endpoint for checking intervention status.
 * Uses query parameters instead of request body.
 *
 * Query parameters:
 * - userId: string (required)
 *
 * Response: Same as POST endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId query parameter is required'),
        { status: 400 },
      )
    }

    // Check calibration health
    const healthCheck = await MetacognitiveInterventionEngine.checkCalibrationHealth(userId)

    // If intervention needed, generate recommendations
    let recommendation: InterventionRecommendation | undefined

    if (healthCheck.needsIntervention && healthCheck.interventionType) {
      recommendation = await MetacognitiveInterventionEngine.generateInterventionRecommendations(
        userId,
        healthCheck.interventionType,
      )
    }

    const response: InterventionCheckResponse = {
      healthCheck,
      recommendation,
    }

    return NextResponse.json(successResponse(response))
  } catch (error) {
    console.error('Error checking calibration intervention:', error)

    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'Failed to check calibration intervention',
      ),
      { status: 500 },
    )
  }
}

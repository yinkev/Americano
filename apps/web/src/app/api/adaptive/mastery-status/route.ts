/**
 * GET /api/adaptive/mastery-status
 *
 * Check mastery verification status for a learning objective.
 * Story 4.5 Task 5 - API Endpoints
 *
 * Features:
 * - Evaluates 5 mastery criteria (consecutive scores, multiple types, difficulty, calibration, time-spacing)
 * - Returns current status (VERIFIED, IN_PROGRESS, NOT_STARTED)
 * - Provides actionable next steps for achieving mastery
 * - Shows recent assessments and progress breakdown
 * - Performance target: < 200ms
 */

import { type NextRequest, NextResponse } from 'next/server'
import { MasteryVerificationEngine } from '@/lib/adaptive/mastery-verification'
import { ApiError } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getUserId } from '@/lib/auth'
import { masteryStatusQuerySchema, validateQuery } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const query = validateQuery(searchParams, masteryStatusQuerySchema)
    const userId = await getUserId()

    // Initialize mastery engine
    const masteryEngine = new MasteryVerificationEngine()

    // Check mastery progress
    const progress = await masteryEngine.checkMasteryProgress(userId, query.objectiveId)

    return NextResponse.json(
      successResponse({
        masteryStatus: progress.status,
        progress: {
          consecutiveHighScores: progress.progress.consecutiveHighScores,
          multipleAssessmentTypes: progress.progress.multipleAssessmentTypes,
          appropriateDifficulty: progress.progress.appropriateDifficulty,
          accurateCalibration: progress.progress.accurateCalibration,
          timeSpaced: progress.progress.timeSpaced,
        },
        verifiedAt: progress.verifiedAt,
        nextSteps: progress.nextSteps,
        recentAssessments: progress.recentAssessments.map((a) => ({
          type: a.type,
          score: a.score,
          date: a.date,
          calibrationDelta: a.calibrationDelta,
        })),
      }),
    )
  } catch (error) {
    console.error('[API] GET /api/adaptive/mastery-status error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(errorResponse(ApiError.internal('Failed to get mastery status')), {
      status: 500,
    })
  }
}

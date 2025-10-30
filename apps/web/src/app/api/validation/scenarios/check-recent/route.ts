import { type NextRequest, NextResponse } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/validation/scenarios/check-recent?objectiveId={id}
 *
 * Checks if a clinical scenario was attempted for the given objective within the last 14 days.
 * Used to prevent scenario fatigue by enforcing a cooldown period.
 *
 * **Query Parameters**:
 * - objectiveId: Learning objective ID to check
 *
 * **Response**:
 * - hasRecent: boolean - true if scenario attempted within 14 days
 * - lastAttemptDate: Date | null - date of last attempt (if exists)
 * - daysSince: number - days since last attempt (999 if none)
 *
 * @see Story 4.2 Task 7 (Session Integration AC#6)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { searchParams } = new URL(request.url)
    const objectiveId = searchParams.get('objectiveId')

    if (!objectiveId) {
      return NextResponse.json(errorResponse('VALIDATION_ERROR', 'objectiveId is required'), {
        status: 400,
      })
    }

    // Calculate 14-day cutoff
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    // Find most recent scenario response for this objective
    const recentResponse = await prisma.scenarioResponse.findFirst({
      where: {
        userId,
        scenario: {
          objectiveId,
        },
        respondedAt: {
          gte: fourteenDaysAgo,
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      select: {
        respondedAt: true,
      },
    })

    const hasRecent = !!recentResponse
    const lastAttemptDate = recentResponse?.respondedAt || null
    const daysSince = lastAttemptDate
      ? Math.floor((Date.now() - lastAttemptDate.getTime()) / (24 * 60 * 60 * 1000))
      : 999

    return NextResponse.json(
      successResponse({
        hasRecent,
        lastAttemptDate,
        daysSince,
      }),
    )
  } catch (error) {
    console.error('[/api/validation/scenarios/check-recent] Error:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to check recent scenarios',
      ),
      { status: 500 },
    )
  }
}

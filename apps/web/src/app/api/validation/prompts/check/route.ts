import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/validation/prompts/check
 *
 * Check if an objective needs validation (7-day cache).
 * Returns whether a comprehension prompt should be shown.
 *
 * Query params:
 * - objectiveId: string (required)
 * - userId?: string (optional, defaults to hardcoded user)
 *
 * @see Story 4.1 Task 6.3 (Check 7-day validation cache)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const objectiveId = searchParams.get('objectiveId')
    const userId = searchParams.get('userId') || 'kevy@americano.dev' // Hardcoded for MVP

    if (!objectiveId) {
      return NextResponse.json({ error: 'objectiveId is required' }, { status: 400 })
    }

    // Check for recent validation responses (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentResponse = await prisma.validationResponse.findFirst({
      where: {
        prompt: {
          objectiveId: objectiveId,
        },
        userId: userId,
        respondedAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      select: {
        id: true,
        respondedAt: true,
        score: true,
        skipped: true,
      },
    })

    // If recent response exists, validation is not needed
    const needsValidation = !recentResponse

    return NextResponse.json({
      data: {
        needsValidation,
        lastValidation: recentResponse
          ? {
              date: recentResponse.respondedAt,
              score: recentResponse.score,
              skipped: recentResponse.skipped,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Error checking validation status:', error)
    return NextResponse.json({ error: 'Failed to check validation status' }, { status: 500 })
  }
}

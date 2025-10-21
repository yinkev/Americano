/**
 * Schedule Adaptation API Route
 * Story 5.3 Task 7: POST /api/orchestration/adapt-schedule
 *
 * Record schedule adaptation and regenerate recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const AdaptScheduleSchema = z.object({
  userId: z.string().min(1),
  adaptationType: z.enum([
    'TIME_SHIFT',
    'DURATION_CHANGE',
    'INTENSITY_ADJUSTMENT',
    'FREQUENCY_CHANGE',
  ]),
  reason: z.string().min(1),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, adaptationType, reason, oldValue, newValue } = AdaptScheduleSchema.parse(body)

    // STUB: Story 5.3 - Schedule Adaptation not yet implemented
    // The scheduleAdaptation model does not exist in the Prisma schema

    return NextResponse.json({
      success: true,
      adaptationId: 'stub-adaptation-id',
      adaptationType,
      reason,
      oldValue,
      newValue,
      updatedRecommendations: {
        optimalTimes: [],
        durationRecommendation: 50,
        intensityLevel: 'MODERATE',
      },
      message: `Schedule adaptation stub: ${reason}. Full implementation pending Story 5.3 completion.`,
    })
  } catch (error) {
    console.error('Schedule adaptation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Failed to adapt schedule' }, { status: 500 })
  }
}

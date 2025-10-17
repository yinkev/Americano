/**
 * Schedule Adaptation API Route
 * Story 5.3 Task 7: POST /api/orchestration/adapt-schedule
 *
 * Record schedule adaptation and regenerate recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { StudyTimeRecommender } from '@/subsystems/behavioral-analytics/study-time-recommender'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const AdaptScheduleSchema = z.object({
  userId: z.string().min(1),
  adaptationType: z.enum(['TIME_SHIFT', 'DURATION_CHANGE', 'INTENSITY_ADJUSTMENT', 'FREQUENCY_CHANGE']),
  reason: z.string().min(1),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, adaptationType, reason, oldValue, newValue } = AdaptScheduleSchema.parse(body)

    const recommender = new StudyTimeRecommender()

    // Record schedule adaptation
    const adaptation = await prisma.scheduleAdaptation.create({
      data: {
        userId,
        adaptationType,
        reason,
        oldValue: oldValue || null,
        newValue: newValue || null,
        appliedAt: new Date(),
      },
    })

    // Regenerate recommendations based on adaptation
    const updatedRecommendations = await recommender.adaptSchedule(
      userId,
      adaptationType,
      reason,
      oldValue,
      newValue
    )

    return NextResponse.json({
      updatedRecommendations,
      adaptationId: adaptation.id,
      message: `Schedule adapted: ${reason}`,
    })
  } catch (error) {
    console.error('Schedule adaptation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Failed to adapt schedule' }, { status: 500 })
  }
}

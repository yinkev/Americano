/**
 * Orchestration Recommendations API Route
 * Story 5.3 Task 7: POST /api/orchestration/recommendations
 *
 * Generate study time recommendations based on behavioral patterns
 * Integrates StudyTimeRecommender subsystem
 */

import { NextRequest, NextResponse } from 'next/server'
import { StudyTimeRecommender } from '@/subsystems/behavioral-analytics/study-time-recommender'
import { StudyIntensityModulator } from '@/subsystems/behavioral-analytics/study-intensity-modulator'
import { z } from 'zod'

const RecommendationsSchema = z.object({
  userId: z.string().min(1),
  date: z.string().datetime().optional(),
  missionId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, date, missionId } = RecommendationsSchema.parse(body)

    // Generate time slot recommendations
    const targetDate = date ? new Date(date) : new Date()
    const recommendations = await StudyTimeRecommender.generateRecommendations(
      userId,
      targetDate,
      missionId,
    )

    // Calculate cognitive load
    const cognitiveLoad = await StudyIntensityModulator.assessCognitiveLoad(userId)

    return NextResponse.json({
      recommendations,
      cognitiveLoad,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Recommendations generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}

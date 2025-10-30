/**
 * Cognitive Load Assessment API Route
 * Story 5.3 Task 7: GET /api/orchestration/cognitive-load
 *
 * Calculate current cognitive load for user with optional trend
 */

import { type NextRequest, NextResponse } from 'next/server'
import { StudyIntensityModulator } from '@/subsystems/behavioral-analytics/study-intensity-modulator'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const includeTrend = searchParams.get('includeTrend') === 'true'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Calculate cognitive load
    const load = await StudyIntensityModulator.assessCognitiveLoad(userId)
    const level = StudyIntensityModulator.calculateIntensityLevel(load)

    // Generate recommendation based on level
    let recommendation = ''
    if (level === 'LOW') {
      recommendation =
        'Your cognitive capacity is high. This is a good time for challenging content.'
    } else if (level === 'MEDIUM') {
      recommendation = 'Your cognitive load is optimal. Maintain current study pace.'
    } else {
      recommendation =
        'Your cognitive load is high. Consider taking a break or reducing study intensity.'
    }

    const response: any = {
      load: Math.round(load),
      level,
      recommendation,
    }

    // Include 7-day trend if requested
    if (includeTrend) {
      // Calculate trend for last 7 days (simplified)
      const trend: number[] = []
      const today = new Date()

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // For MVP, use current load with some variance
        // In production, query historical BehavioralEvent data
        const variance = (Math.random() - 0.5) * 20
        trend.push(Math.max(0, Math.min(100, load + variance)))
      }

      response.trend = trend
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Cognitive load assessment error:', error)
    return NextResponse.json({ error: 'Failed to assess cognitive load' }, { status: 500 })
  }
}

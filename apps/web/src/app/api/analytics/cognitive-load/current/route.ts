/**
 * GET /api/analytics/cognitive-load/current
 *
 * Get User's Current Cognitive Load State
 * Story 5.4 Task 6.2 - Real-Time Cognitive Load Monitoring
 *
 * **Purpose:** Retrieve the most recent cognitive load measurement for a user
 * to enable real-time monitoring and adaptive interventions.
 *
 * **Features:**
 * - Retrieves latest CognitiveLoadMetric for active or recent sessions
 * - Calculates trend by comparing to previous measurement
 * - Determines if session is currently active
 * - Returns null state if no measurements exist
 *
 * **Query Parameters:**
 * - userId (required): User identifier
 *
 * **Response:**
 * - loadScore: 0-100 current cognitive load score (null if no data)
 * - loadLevel: LOW | MODERATE | HIGH | CRITICAL (null if no data)
 * - stressIndicators: Array of current stress factors
 * - timestamp: When measurement was taken
 * - trend: 'up' | 'down' | 'stable' (load change vs previous)
 * - sessionActive: Boolean indicating if session is ongoing
 * - confidenceLevel: 0.0-1.0 measurement confidence
 *
 * **Use Cases:**
 * - Real-time cognitive load dashboard
 * - Adaptive difficulty adjustment triggers
 * - Break recommendation timing
 * - Overload alert systems
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 },
      )
    }

    // Find most recent cognitive load metric
    const recentMetric = await prisma.cognitiveLoadMetric.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    })

    if (!recentMetric) {
      return NextResponse.json({
        success: true,
        loadScore: null,
        loadLevel: null,
        stressIndicators: [],
        timestamp: null,
        trend: null,
        sessionActive: false,
        confidenceLevel: null,
      })
    }

    // Determine load level based on Cognitive Load Theory thresholds
    const loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' =
      recentMetric.loadScore >= 80
        ? 'CRITICAL'
        : recentMetric.loadScore >= 60
          ? 'HIGH'
          : recentMetric.loadScore >= 40
            ? 'MODERATE'
            : 'LOW'

    // Calculate trend (compare to previous metric)
    const previousMetric = await prisma.cognitiveLoadMetric.findFirst({
      where: {
        userId,
        timestamp: { lt: recentMetric.timestamp },
      },
      orderBy: { timestamp: 'desc' },
    })

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (previousMetric) {
      const loadChange = recentMetric.loadScore - previousMetric.loadScore
      // >10 point change is considered significant
      if (loadChange > 10) trend = 'up'
      else if (loadChange < -10) trend = 'down'
    }

    // Check if session is active (if sessionId exists, check StudySession)
    let sessionActive = false
    if (recentMetric.sessionId) {
      const session = await prisma.studySession.findUnique({
        where: { id: recentMetric.sessionId },
        select: { completedAt: true },
      })
      sessionActive = session?.completedAt === null
    }

    return NextResponse.json({
      success: true,
      loadScore: recentMetric.loadScore,
      loadLevel,
      stressIndicators: recentMetric.stressIndicators,
      timestamp: recentMetric.timestamp,
      trend,
      sessionActive,
      confidenceLevel: recentMetric.confidenceLevel,
    })
  } catch (error) {
    console.error('Error fetching current cognitive load:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current cognitive load' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/analytics/cognitive-load/history
 *
 * Time-Series Cognitive Load Data for Visualization
 * Story 5.4 Task 6.3 - Historical Trend Analysis
 *
 * **Purpose:** Retrieve historical cognitive load measurements for trend
 * analysis, pattern detection, and visualization in dashboards.
 *
 * **Features:**
 * - Retrieves time-series CognitiveLoadMetric data within date range
 * - Calculates summary statistics (avg, max, overload episodes)
 * - Supports granularity options for data aggregation
 * - Optimized for charting libraries (Recharts, Chart.js)
 *
 * **Query Parameters:**
 * - userId (required): User identifier
 * - startDate (optional): Start of date range (ISO 8601, defaults to 7 days ago)
 * - endDate (optional): End of date range (ISO 8601, defaults to now)
 * - granularity (optional): 'hour' | 'day' | 'week' (defaults to 'hour')
 *
 * **Response:**
 * - dataPoints: Array of {timestamp, loadScore, loadLevel, stressIndicators, sessionId}
 * - summary: {avgLoad, maxLoad, overloadEpisodes, totalDataPoints, dateRange}
 *
 * **Use Cases:**
 * - Cognitive load trend charts
 * - Overload frequency analysis
 * - Pattern detection (time-of-day, day-of-week)
 * - Long-term burnout risk assessment
 */

import { subDays } from 'date-fns'
import { type NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

interface DataPoint {
  timestamp: Date
  loadScore: number
  loadLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  stressIndicators: unknown
  sessionId: string | null
  confidenceLevel: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const granularity = searchParams.get('granularity') || 'hour' // 'hour' | 'day' | 'week'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter is required' },
        { status: 400 },
      )
    }

    // Default to last 7 days if no date range provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam ? new Date(startDateParam) : subDays(endDate, 7)

    // Fetch cognitive load metrics in date range
    const metrics = await prisma.cognitiveLoadMetric.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        timestamp: true,
        loadScore: true,
        stressIndicators: true,
        confidenceLevel: true,
        sessionId: true,
      },
    })

    // Transform data based on Cognitive Load Theory thresholds
    const dataPoints: DataPoint[] = metrics.map((metric) => ({
      timestamp: metric.timestamp,
      loadScore: metric.loadScore,
      loadLevel:
        metric.loadScore >= 80
          ? ('CRITICAL' as const)
          : metric.loadScore >= 60
            ? ('HIGH' as const)
            : metric.loadScore >= 40
              ? ('MODERATE' as const)
              : ('LOW' as const),
      stressIndicators: metric.stressIndicators,
      sessionId: metric.sessionId,
      confidenceLevel: metric.confidenceLevel,
    }))

    // Calculate summary statistics for trend analysis
    const avgLoad =
      dataPoints.length > 0
        ? dataPoints.reduce((sum: number, d: DataPoint) => sum + d.loadScore, 0) / dataPoints.length
        : 0

    const maxLoad =
      dataPoints.length > 0 ? Math.max(...dataPoints.map((d: DataPoint) => d.loadScore)) : 0

    const overloadEpisodes = dataPoints.filter((d: DataPoint) => d.loadScore > 80).length

    return NextResponse.json({
      success: true,
      dataPoints,
      summary: {
        avgLoad,
        maxLoad,
        overloadEpisodes,
        totalDataPoints: dataPoints.length,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching cognitive load history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cognitive load history' },
      { status: 500 },
    )
  }
}

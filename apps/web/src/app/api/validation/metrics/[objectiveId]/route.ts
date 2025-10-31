import { type NextRequest, NextResponse } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/validation/metrics/:objectiveId
 *
 * Fetches comprehension performance history for a learning objective.
 *
 * **Workflow**:
 * 1. Fetch ComprehensionMetric records for objective (last 30-90 days)
 * 2. Calculate overall trend (improving/stable/worsening)
 * 3. Calculate average score across all attempts
 * 4. Return metrics with trend analysis
 *
 * @see Story 4.1 Task 4 (API Endpoints)
 * @see Story 4.1 AC#7 (Historical Metrics)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ objectiveId: string }> },
) {
  try {
    // Await params per Next.js 15 async params pattern
    const { objectiveId } = await context.params

    // Get user ID (hardcoded for MVP per CLAUDE.md)
    const userId = await getUserId()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    // Fetch comprehension metrics for objective
    // NOTE: ComprehensionMetric doesn't have userId field - it's concept-based, not user-based
    const metrics = await prisma.comprehensionMetric.findMany({
      where: {
        objectiveId,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    if (metrics.length === 0) {
      return NextResponse.json(
        successResponse({
          metrics: [],
          trend: 'STABLE',
          avgScore: 0,
          totalAttempts: 0,
        }),
      )
    }

    // Calculate overall trend
    // Compare first half average to second half average
    const midpoint = Math.floor(metrics.length / 2)
    const firstHalfAvg =
      metrics.slice(0, midpoint).reduce((sum, m) => sum + m.avgScore, 0) / Math.max(midpoint, 1)
    const secondHalfAvg =
      metrics.slice(midpoint).reduce((sum, m) => sum + m.avgScore, 0) /
      Math.max(metrics.length - midpoint, 1)

    let trend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE'
    const trendDiff = secondHalfAvg - firstHalfAvg
    if (trendDiff > 0.1) trend = 'IMPROVING'
    else if (trendDiff < -0.1) trend = 'WORSENING'

    // Calculate overall average score (convert from 0-1 to 0-100)
    const avgScore = (metrics.reduce((sum, m) => sum + m.avgScore, 0) / metrics.length) * 100

    // Total attempts across all days
    const totalAttempts = metrics.reduce((sum, m) => sum + m.sampleSize, 0)

    // Transform metrics for response (convert scores to 0-100 scale)
    const transformedMetrics = metrics.map((m) => ({
      id: m.id,
      objectiveId: m.objectiveId || '',
      date: m.date,
      avgScore: m.avgScore * 100, // Convert to 0-100 scale
      sampleSize: m.sampleSize,
      trend: (m.trend || 'STABLE') as 'IMPROVING' | 'STABLE' | 'WORSENING',
    }))

    return NextResponse.json(
      successResponse({
        metrics: transformedMetrics,
        trend,
        avgScore,
        totalAttempts,
      }),
    )
  } catch (error) {
    console.error('Error fetching comprehension metrics:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch metrics',
      ),
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from 'next/server'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * GET /api/validation/scenarios/metrics?dateRange=30days
 *
 * Retrieves clinical reasoning competency metrics for the current user.
 *
 * **Query Parameters**:
 * - dateRange: '7days' | '30days' | '90days' (default: '30days')
 *
 * **Response**:
 * - metrics: Array of daily competency scores by scenario type
 * - competencyAverages: Overall averages for 4 competencies (0-100 scale)
 * - weakCompetencies: List of competencies below 60% threshold
 *
 * @see Story 4.2 Task 3 (Competency Analytics)
 * @see Story 4.2 AC#3 (Performance tracking by competency)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30days'

    // Calculate date cutoff
    const daysAgo = dateRange === '7days' ? 7 : dateRange === '90days' ? 90 : 30
    const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    // Fetch metrics within date range
    const metrics = await prisma.clinicalReasoningMetric.findMany({
      where: {
        userId,
        date: { gte: cutoffDate },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate competency averages across all metrics
    interface CompetencyScoresType {
      dataGathering: number
      diagnosis: number
      management: number
      clinicalReasoning: number
    }

    const competencyTotals = {
      dataGathering: 0,
      diagnosis: 0,
      management: 0,
      clinicalReasoning: 0,
    }
    const count = metrics.length

    metrics.forEach((metric) => {
      const scores = metric.competencyScores as unknown as CompetencyScoresType
      competencyTotals.dataGathering += scores.dataGathering || 0
      competencyTotals.diagnosis += scores.diagnosis || 0
      competencyTotals.management += scores.management || 0
      competencyTotals.clinicalReasoning += scores.clinicalReasoning || 0
    })

    const competencyAverages =
      count > 0
        ? {
            dataGathering: Math.round(competencyTotals.dataGathering / count),
            diagnosis: Math.round(competencyTotals.diagnosis / count),
            management: Math.round(competencyTotals.management / count),
            clinicalReasoning: Math.round(competencyTotals.clinicalReasoning / count),
          }
        : null

    // Identify weak competencies (< 60% avg)
    const weakCompetencies: string[] = []
    if (competencyAverages) {
      if (competencyAverages.dataGathering < 60) weakCompetencies.push('Data Gathering')
      if (competencyAverages.diagnosis < 60) weakCompetencies.push('Diagnosis')
      if (competencyAverages.management < 60) weakCompetencies.push('Management')
      if (competencyAverages.clinicalReasoning < 60) weakCompetencies.push('Clinical Reasoning')
    }

    return NextResponse.json(
      successResponse({
        metrics,
        competencyAverages,
        weakCompetencies,
        dateRange,
        totalScenarios: count,
      }),
    )
  } catch (error) {
    console.error('[/api/validation/scenarios/metrics] Error:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch metrics',
      ),
      { status: 500 },
    )
  }
}

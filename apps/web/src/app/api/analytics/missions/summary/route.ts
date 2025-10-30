/**
 * GET /api/analytics/missions/summary
 *
 * Returns mission completion summary statistics for a user
 * over a specified time period.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation - Task 10.1
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { MissionAnalyticsEngine } from '@/lib/mission-analytics-engine'
import { MissionInsightsEngine } from '@/lib/mission-insights-engine'

// Zod validation schema for query parameters
const SummaryQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('7d'),
})

/**
 * GET /api/analytics/missions/summary
 *
 * Returns mission analytics summary including:
 * - Completion rate
 * - Current streak
 * - Success score
 * - Mission counts
 * - Generated insights
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = SummaryQuerySchema.parse({
    period: searchParams.get('period') || '7d',
  })

  // Get user from header (MVP: hardcoded)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', `User ${userEmail} not found`), {
      status: 404,
    })
  }

  // Initialize analytics engine
  const analyticsEngine = new MissionAnalyticsEngine()
  const insightsEngine = new MissionInsightsEngine()

  // Calculate completion rate for period
  const completionRate = await analyticsEngine.calculateCompletionRate(user.id, params.period)

  // Get streak data
  const missionStreak = await prisma.missionStreak.findUnique({
    where: { userId: user.id },
  })

  const streak = {
    current: missionStreak?.currentStreak || 0,
    longest: missionStreak?.longestStreak || 0,
  }

  // Calculate average success score for period
  const startDate = getStartDateForPeriod(params.period)
  const missions = await prisma.mission.findMany({
    where: {
      userId: user.id,
      ...(startDate && {
        date: {
          gte: startDate,
        },
      }),
    },
  })

  const successScores = missions.filter((m) => m.successScore !== null).map((m) => m.successScore!)

  const avgSuccessScore =
    successScores.length > 0
      ? successScores.reduce((sum, score) => sum + score, 0) / successScores.length
      : 0

  // Get mission counts
  const completedMissions = missions.filter((m) => m.status === 'COMPLETED').length
  const skippedMissions = missions.filter((m) => m.status === 'SKIPPED').length
  const totalMissions = missions.length

  // Generate insights
  const insights = await insightsEngine.generateWeeklyInsights(user.id)
  const insightTexts = insights.map((i) => i.headline).slice(0, 3) // Top 3

  // Calculate mission-guided vs. free-form study comparison
  // Default to '90d' if 'all' is selected
  const comparisonPeriod = params.period === 'all' ? '90d' : params.period
  const comparison = await analyticsEngine.compareMissionVsFreeStudy(user.id, comparisonPeriod)

  return Response.json(
    successResponse({
      completionRate: Number(completionRate.toFixed(3)),
      streak,
      successScore: Number(avgSuccessScore.toFixed(3)),
      missions: {
        completed: completedMissions,
        skipped: skippedMissions,
        total: totalMissions,
      },
      insights: insightTexts,
      comparison: {
        missionGuided: {
          sessions: comparison.missionGuidedStats.sessionCount,
          masteryImprovement: Number(
            comparison.missionGuidedStats.avgMasteryImprovement.toFixed(3),
          ),
          completionRate: Number(comparison.missionGuidedStats.completionRate.toFixed(3)),
          efficiency: Number(comparison.missionGuidedStats.studyEfficiency.toFixed(2)),
        },
        freeStudy: {
          sessions: comparison.freeStudyStats.sessionCount,
          masteryImprovement: Number(comparison.freeStudyStats.avgMasteryImprovement.toFixed(3)),
          completionRate: Number(comparison.freeStudyStats.completionRate.toFixed(3)),
          efficiency: Number(comparison.freeStudyStats.studyEfficiency.toFixed(2)),
        },
        improvementPercentage: Number(comparison.improvementPercentage.toFixed(1)),
        confidence: comparison.confidence,
        pValue: Number(comparison.pValue.toFixed(3)),
        insight: comparison.insight,
      },
    }),
  )
})

/**
 * Helper: Get start date for a given period
 */
function getStartDateForPeriod(period: string): Date | null {
  if (period === 'all') return null

  const date = new Date()
  const days = parseInt(period.replace('d', ''))
  date.setDate(date.getDate() - days)
  date.setHours(0, 0, 0, 0)
  return date
}

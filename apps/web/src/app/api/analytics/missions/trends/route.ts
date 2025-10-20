/**
 * GET /api/analytics/missions/trends
 *
 * Returns time-series data for mission analytics trends.
 * Used by charts to visualize completion rate, duration, and success scores over time.
 *
 * Story 2.6: Mission Performance Analytics and Adaptation - Task 10.2
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { startOfDay, subDays, format } from 'date-fns'

// Zod validation schema
const TrendsQuerySchema = z.object({
  metric: z.enum(['completion_rate', 'avg_duration', 'success_score']).default('completion_rate'),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  period: z.enum(['7d', '30d', '90d']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

/**
 * GET /api/analytics/missions/trends
 *
 * Returns time-series trend data for visualizations
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const params = TrendsQuerySchema.parse({
    metric: searchParams.get('metric') || 'completion_rate',
    granularity: searchParams.get('granularity') || 'daily',
    period: searchParams.get('period') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  })

  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', `User ${userEmail} not found`), {
      status: 404,
    })
  }

  // Calculate date range based on period or explicit dates
  const endDate = params.endDate ? new Date(params.endDate) : new Date()
  let startDate: Date

  if (params.period) {
    // Use period shorthand (7d, 30d, 90d)
    const days = parseInt(params.period.replace('d', ''))
    startDate = subDays(endDate, days)
  } else if (params.startDate) {
    // Use explicit start date
    startDate = new Date(params.startDate)
  } else {
    // Default to last 30 days
    startDate = subDays(endDate, 30)
  }

  // Fetch missions in date range
  const missions = await prisma.mission.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfDay(startDate),
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Group by granularity and calculate metric
  const dataPoints = groupAndCalculate(missions, params.metric, params.granularity)

  return Response.json(
    successResponse({
      data: dataPoints,
      metadata: {
        metric: params.metric,
        granularity: params.granularity,
        period: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        },
      },
    }),
  )
})

/**
 * Group missions by granularity and calculate metric
 */
function groupAndCalculate(
  missions: any[],
  metric: string,
  granularity: string,
): Array<{ date: string; value: number }> {
  const grouped: Record<string, any[]> = {}

  for (const mission of missions) {
    let key: string

    if (granularity === 'daily') {
      key = format(mission.date, 'yyyy-MM-dd')
    } else if (granularity === 'weekly') {
      key = format(mission.date, 'yyyy-ww')
    } else {
      key = format(mission.date, 'yyyy-MM')
    }

    if (!grouped[key]) grouped[key] = []
    grouped[key].push(mission)
  }

  // Calculate metric for each group
  const dataPoints: Array<{ date: string; value: number }> = []

  for (const [date, groupMissions] of Object.entries(grouped)) {
    let value = 0

    switch (metric) {
      case 'completion_rate':
        const completed = groupMissions.filter((m) => m.status === 'COMPLETED').length
        value = groupMissions.length > 0 ? completed / groupMissions.length : 0
        break

      case 'avg_duration':
        const durations = groupMissions.filter((m) => m.actualMinutes).map((m) => m.actualMinutes!)
        value =
          durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0
        break

      case 'success_score':
        const scores = groupMissions.filter((m) => m.successScore).map((m) => m.successScore!)
        value = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0
        break
    }

    dataPoints.push({
      date,
      value: Number(value.toFixed(3)),
    })
  }

  return dataPoints.sort((a, b) => a.date.localeCompare(b.date))
}

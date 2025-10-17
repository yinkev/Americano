/**
 * GET /api/analytics/behavioral-insights/patterns/evolution
 *
 * Time-series data for pattern evolution timeline visualization
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 12.2 (Patterns Evolution API)
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'

// Zod validation schema for query parameters
const EvolutionQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  weeks: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 12))
    .refine((val) => val > 0 && val <= 52, 'weeks must be between 1 and 52'),
  patternType: z
    .enum([
      'OPTIMAL_STUDY_TIME',
      'SESSION_DURATION_PREFERENCE',
      'CONTENT_TYPE_PREFERENCE',
      'PERFORMANCE_PEAK',
      'ATTENTION_CYCLE',
      'FORGETTING_CURVE',
    ])
    .optional(),
})

/**
 * GET /api/analytics/behavioral-insights/patterns/evolution
 *
 * Returns time-series data for pattern evolution:
 * - Week-by-week pattern snapshots
 * - Confidence evolution over time
 * - Pattern appearance/disappearance events
 *
 * Used by PatternEvolutionTimeline component
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = EvolutionQuerySchema.parse({
    userId: searchParams.get('userId') || '',
    weeks: searchParams.get('weeks') || undefined,
    patternType: searchParams.get('patternType') || undefined,
  })

  const { userId, weeks, patternType } = params

  // Calculate date range (X weeks ago to now)
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - weeks * 7 * 24 * 60 * 60 * 1000)

  // Build query filter
  const whereClause: any = {
    userId,
    OR: [
      {
        firstSeenAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      {
        lastSeenAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    ],
  }

  if (patternType) {
    whereClause.patternType = patternType
  }

  // Fetch patterns that existed during the time range
  const patterns = await prisma.behavioralPattern.findMany({
    where: whereClause,
    orderBy: [{ patternType: 'asc' }, { firstSeenAt: 'asc' }],
  })

  // Group patterns by week
  // For each week, show pattern snapshot with confidence at that time
  const weeklyData: Array<{
    weekNumber: number
    weekStart: string
    weekEnd: string
    patterns: Array<{
      id: string
      patternType: string
      confidence: number
      metadata: any
      status: 'new' | 'existing' | 'disappeared'
    }>
  }> = []

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

    // Filter patterns active during this week
    const weekPatterns = patterns
      .filter((p) => {
        const firstSeen = new Date(p.firstSeenAt)
        const lastSeen = new Date(p.lastSeenAt)
        return firstSeen <= weekEnd && lastSeen >= weekStart
      })
      .map((p) => {
        const firstSeen = new Date(p.firstSeenAt)
        const lastSeen = new Date(p.lastSeenAt)

        // Determine status for this week
        let status: 'new' | 'existing' | 'disappeared' = 'existing'
        if (firstSeen >= weekStart && firstSeen <= weekEnd) {
          status = 'new'
        } else if (lastSeen >= weekStart && lastSeen <= weekEnd && lastSeen < endDate) {
          status = 'disappeared'
        }

        return {
          id: p.id,
          patternType: p.patternType,
          confidence: p.confidence,
          metadata: p.metadata,
          status,
        }
      })

    weeklyData.push({
      weekNumber: i + 1,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      patterns: weekPatterns,
    })
  }

  return Response.json(
    successResponse({
      evolution: weeklyData,
      meta: {
        totalWeeks: weeks,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPatterns: patterns.length,
        patternTypeFilter: patternType || 'all',
      },
    })
  )
})

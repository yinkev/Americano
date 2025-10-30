/**
 * GET /api/analytics/behavioral-insights/patterns/evolution
 *
 * Time-series data for pattern evolution timeline visualization
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 12.2 (Patterns Evolution API)
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { CACHE_TTL, withCache } from '@/lib/cache'
import { prisma } from '@/lib/db'

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
        detectedAt: {
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

  // Use caching with 5-minute TTL
  const cacheKey = `user:${userId}:patterns:evolution:${weeks}:${patternType || 'all'}`

  const result = await withCache(cacheKey, CACHE_TTL.MEDIUM, async () => {
    // OPTIMIZED: Fetch patterns once with all needed data
    const patterns = await prisma.behavioralPattern.findMany({
      where: whereClause,
      select: {
        id: true,
        patternType: true,
        confidence: true,
        evidence: true,
        detectedAt: true,
        lastSeenAt: true,
      },
      orderBy: [{ patternType: 'asc' }, { detectedAt: 'asc' }],
    })

    // OPTIMIZED: Pre-process patterns with date objects
    const processedPatterns = patterns.map((p) => ({
      ...p,
      detectedAtTime: new Date(p.detectedAt).getTime(),
      lastSeenAtTime: new Date(p.lastSeenAt).getTime(),
    }))

    // OPTIMIZED: Generate week boundaries once
    const weekBoundaries = Array.from({ length: weeks }, (_, i) => {
      const weekStartTime = startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
      const weekEndTime = weekStartTime + 7 * 24 * 60 * 60 * 1000 - 1
      return {
        weekNumber: i + 1,
        weekStart: new Date(weekStartTime).toISOString(),
        weekEnd: new Date(weekEndTime).toISOString(),
        weekStartTime,
        weekEndTime,
      }
    })

    const endDateTime = endDate.getTime()

    // OPTIMIZED: Single pass over patterns for all weeks
    const weeklyData = weekBoundaries.map((week) => {
      const weekPatterns = processedPatterns
        .filter(
          (p) => p.detectedAtTime <= week.weekEndTime && p.lastSeenAtTime >= week.weekStartTime,
        )
        .map((p) => {
          // Determine status efficiently
          let status: 'new' | 'existing' | 'disappeared' = 'existing'
          if (p.detectedAtTime >= week.weekStartTime && p.detectedAtTime <= week.weekEndTime) {
            status = 'new'
          } else if (
            p.lastSeenAtTime >= week.weekStartTime &&
            p.lastSeenAtTime <= week.weekEndTime &&
            p.lastSeenAtTime < endDateTime
          ) {
            status = 'disappeared'
          }

          return {
            id: p.id,
            patternType: p.patternType,
            confidence: p.confidence,
            metadata: p.evidence,
            status,
          }
        })

      return {
        weekNumber: week.weekNumber,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        patterns: weekPatterns,
      }
    })

    return {
      evolution: weeklyData,
      meta: {
        totalWeeks: weeks,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPatterns: patterns.length,
        patternTypeFilter: patternType || 'all',
      },
    }
  })

  return Response.json(successResponse(result))
})

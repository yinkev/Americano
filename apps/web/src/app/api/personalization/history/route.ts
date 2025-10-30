/**
 * GET /api/personalization/history
 * Returns personalization application/removal events for timeline visualization
 *
 * Epic 5 - Task: Real Data Integration
 * Replaces mock data with actual PersonalizationConfig queries
 *
 * @route GET /api/personalization/history
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

/**
 * Query parameter validation schema
 */
const QuerySchema = z.object({
  userId: z.string().optional(), // Optional for MVP (defaults to hardcoded user)
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: 'Invalid startDate format. Use ISO date string',
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: 'Invalid endDate format. Use ISO date string',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .refine((val) => val >= 1 && val <= 200, {
      message: 'limit must be between 1 and 200',
    }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, {
      message: 'offset must be non-negative',
    }),
})

/**
 * Event type for personalization history
 */
type PersonalizationEventType =
  | 'APPLIED' // Config activated
  | 'REMOVED' // Config deactivated
  | 'EFFECTIVENESS_CHANGED' // Effectiveness score updated

/**
 * Personalization history event
 */
interface PersonalizationHistoryEvent {
  id: string
  timestamp: string // ISO timestamp
  eventType: PersonalizationEventType
  personalizationType: string // Context (MISSION, CONTENT, ASSESSMENT, SESSION)
  context: string // Same as personalizationType for clarity
  previousValue: number | null // Previous effectiveness score
  newValue: number | null // New effectiveness score
  reason: string // Human-readable explanation
  effectivenessScore: number | null // Current effectiveness (0-100)
  configId: string // Reference to PersonalizationConfig
  strategyVariant: string // Pattern-heavy, Prediction-heavy, etc.
}

/**
 * Response type
 */
interface HistoryResponse {
  events: PersonalizationHistoryEvent[]
  meta: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

/**
 * GET /api/personalization/history
 *
 * Query Parameters:
 * - userId: User ID (optional, defaults to kevy@americano.dev)
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * - limit: Number of events to return (1-200, default: 50)
 * - offset: Offset for pagination (default: 0)
 *
 * Response:
 * {
 *   events: [
 *     {
 *       id: string,
 *       timestamp: string,
 *       eventType: "APPLIED" | "REMOVED" | "EFFECTIVENESS_CHANGED",
 *       personalizationType: string,
 *       context: string,
 *       previousValue: number | null,
 *       newValue: number | null,
 *       reason: string,
 *       effectivenessScore: number | null,
 *       configId: string,
 *       strategyVariant: string
 *     }
 *   ],
 *   meta: {
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     hasMore: boolean
 *   }
 * }
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)

  // Parse and validate query parameters
  const queryParams = {
    userId: searchParams.get('userId'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  }

  const validatedParams = QuerySchema.safeParse(queryParams)

  if (!validatedParams.success) {
    throw ApiError.validation(
      `Invalid query parameters: ${validatedParams.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')}`,
    )
  }

  const { startDate, endDate, limit, offset } = validatedParams.data

  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: {
      email: validatedParams.data.userId || 'kevy@americano.dev',
    },
    select: { id: true },
  })

  if (!user) {
    throw ApiError.notFound('User not found. Run: npx prisma db seed to create default user')
  }

  // Calculate default date range (last 30 days)
  const endDateTime = endDate ? new Date(endDate) : new Date()
  const startDateTime = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Query PersonalizationConfig records for events
  const configs = await prisma.personalizationConfig.findMany({
    where: {
      userId: user.id,
      OR: [
        {
          // Activated in range
          activatedAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        {
          // Deactivated in range
          deactivatedAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        {
          // Updated in range (effectiveness changed)
          updatedAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
          effectivenessScore: {
            not: null,
          },
        },
      ],
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: limit + 1, // Get one extra to check if there are more
    skip: offset,
  })

  // Build events from config history
  const events: PersonalizationHistoryEvent[] = []

  for (const config of configs.slice(0, limit)) {
    // Generate APPLIED event if activated in range
    if (config.activatedAt >= startDateTime && config.activatedAt <= endDateTime) {
      events.push({
        id: `${config.id}-applied`,
        timestamp: config.activatedAt.toISOString(),
        eventType: 'APPLIED',
        personalizationType: config.context,
        context: config.context,
        previousValue: null,
        newValue: config.effectivenessScore,
        reason: `Applied ${config.strategyVariant} strategy for ${config.context.toLowerCase()} personalization`,
        effectivenessScore: config.effectivenessScore,
        configId: config.id,
        strategyVariant: config.strategyVariant,
      })
    }

    // Generate REMOVED event if deactivated in range
    if (
      config.deactivatedAt &&
      config.deactivatedAt >= startDateTime &&
      config.deactivatedAt <= endDateTime
    ) {
      events.push({
        id: `${config.id}-removed`,
        timestamp: config.deactivatedAt.toISOString(),
        eventType: 'REMOVED',
        personalizationType: config.context,
        context: config.context,
        previousValue: config.effectivenessScore,
        newValue: null,
        reason: `Removed ${config.strategyVariant} strategy for ${config.context.toLowerCase()} personalization`,
        effectivenessScore: null,
        configId: config.id,
        strategyVariant: config.strategyVariant,
      })
    }

    // Generate EFFECTIVENESS_CHANGED event if effectiveness updated in range
    // (This is a simplified approach - in production, you'd track changes in PersonalizationEffectiveness)
    if (
      config.effectivenessScore !== null &&
      config.updatedAt >= startDateTime &&
      config.updatedAt <= endDateTime &&
      config.updatedAt.getTime() !== config.activatedAt.getTime() // Not the initial activation
    ) {
      events.push({
        id: `${config.id}-effectiveness-${config.updatedAt.getTime()}`,
        timestamp: config.updatedAt.toISOString(),
        eventType: 'EFFECTIVENESS_CHANGED',
        personalizationType: config.context,
        context: config.context,
        previousValue: null, // Would need historical data to calculate
        newValue: config.effectivenessScore,
        reason: `Effectiveness score updated to ${Math.round(config.effectivenessScore)}% for ${config.strategyVariant} strategy`,
        effectivenessScore: config.effectivenessScore,
        configId: config.id,
        strategyVariant: config.strategyVariant,
      })
    }
  }

  // Sort events by timestamp (descending)
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Calculate total count (approximate - would need separate count query for exact)
  const hasMore = configs.length > limit
  const total = offset + events.length + (hasMore ? 1 : 0) // Approximate

  const response: HistoryResponse = {
    events,
    meta: {
      total,
      limit,
      offset,
      hasMore,
    },
  }

  return Response.json(successResponse(response))
})

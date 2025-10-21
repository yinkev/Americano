/**
 * GET /api/analytics/patterns
 *
 * Retrieve stored behavioral patterns with filtering
 * Wave 2: Redis L2 caching optimization (600s TTL)
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.2
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { withCache, CACHE_TTL } from '@/lib/cache'
import { ensureRedisInitialized } from '@/lib/init-redis'

// Ensure Redis initialization attempt (safe - will fallback to in-memory if fails)
let redisInitPromise: Promise<void> | null = null
function ensureRedis() {
  if (!redisInitPromise) {
    redisInitPromise = ensureRedisInitialized().catch((err) => {
      console.warn('[Patterns API] Redis initialization failed, using in-memory cache:', err.message)
    })
  }
  return redisInitPromise
}

// Zod validation schema for query parameters
const PatternsQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
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
  minConfidence: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0.6))
    .refine((val) => val >= 0 && val <= 1, 'minConfidence must be between 0 and 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val > 0 && val <= 100, 'limit must be between 1 and 100'),
})

/**
 * Build cache key from query parameters
 * Format: patterns:userId:patternType:minConfidence:limit
 */
function buildCacheKey(params: z.infer<typeof PatternsQuerySchema>): string {
  const patternType = params.patternType || 'all'
  const confidence = params.minConfidence.toString()
  return `patterns:${params.userId}:${patternType}:${confidence}:${params.limit}`
}

/**
 * GET /api/analytics/patterns
 *
 * Returns behavioral patterns filtered by:
 * - patternType (optional)
 * - minConfidence (default: 0.6)
 * - limit (default: 20)
 *
 * Sorted by confidence DESC, lastSeenAt DESC
 *
 * Performance: ~350ms from database (composite index)
 * With cache: ~10ms (L1 hit) or ~50ms (L2 Redis hit)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Ensure Redis is initialized (non-blocking)
  await ensureRedis()

  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = PatternsQuerySchema.parse({
    userId: searchParams.get('userId') || '',
    patternType: searchParams.get('patternType') || undefined,
    minConfidence: searchParams.get('minConfidence') || undefined,
    limit: searchParams.get('limit') || undefined,
  })

  // Generate cache key
  const cacheKey = buildCacheKey(params)

  // Use cache-aside pattern with L1 + L2 fallback
  const patterns = await withCache(
    cacheKey,
    600 * 1000, // 10 minutes TTL
    async () => {
      // Build query filter
      const whereClause: any = {
        userId: params.userId,
        confidence: {
          gte: params.minConfidence,
        },
      }

      if (params.patternType) {
        whereClause.patternType = params.patternType
      }

      // Query behavioral patterns with composite index
      return await prisma.behavioralPattern.findMany({
        where: whereClause,
        orderBy: [{ confidence: 'desc' }, { lastSeenAt: 'desc' }],
        take: params.limit,
      })
    },
  )

  return Response.json(
    successResponse({
      patterns,
      count: patterns.length,
    }),
  )
})

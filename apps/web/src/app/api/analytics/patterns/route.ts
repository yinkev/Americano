import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-response'
import { withCache } from '@/lib/cache'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import { getMockComprehensionPattern, respondWithMock } from '@/lib/mocks/analytics'
import { prisma } from '@/lib/db'
import { ensureRedisInitialized } from '@/lib/init-redis'

let redisInitPromise: Promise<void> | null = null
function ensureRedis() {
  if (!redisInitPromise) {
    redisInitPromise = ensureRedisInitialized().catch((err) => {
      console.warn('[Patterns API] Redis initialization failed, using in-memory cache:', err.message)
    })
  }
  return redisInitPromise
}

const PatternTypeEnum = z.enum([
  'OPTIMAL_STUDY_TIME',
  'SESSION_DURATION_PREFERENCE',
  'CONTENT_TYPE_PREFERENCE',
  'PERFORMANCE_PEAK',
  'ATTENTION_CYCLE',
  'FORGETTING_CURVE',
])

const PatternsSchema = z.object({
  userId: z.string().min(1, 'user_id is required'),
  patternType: PatternTypeEnum.nullish(),
  minConfidence: z.coerce.number().min(0).max(1).default(0.6),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

type PatternsInput = z.infer<typeof PatternsSchema>

function parseBody(body: unknown): PatternsInput {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return PatternsSchema.parse({
    userId: (value.user_id ?? value.userId ?? '') as string,
    patternType: (value.pattern_type ?? value.patternType ?? null) as string | null | undefined,
    minConfidence: value.min_confidence ?? value.minConfidence ?? undefined,
    limit: value.limit ?? value.page_size ?? undefined,
  })
}

function parseQuery(request: NextRequest): PatternsInput {
  const params = request.nextUrl.searchParams
  return PatternsSchema.parse({
    userId: params.get('user_id') ?? params.get('userId') ?? '',
    patternType: params.get('patternType') ?? params.get('pattern_type') ?? null,
    minConfidence: params.get('minConfidence') ?? params.get('min_confidence') ?? undefined,
    limit: params.get('limit') ?? undefined,
  })
}

function buildCacheKey(params: PatternsInput): string {
  const patternType = params.patternType || 'all'
  const confidence = params.minConfidence.toString()
  return `patterns:${params.userId}:${patternType}:${confidence}:${params.limit}`
}

async function fetchLegacyPatterns(params: PatternsInput) {
  await ensureRedis()

  const cacheKey = buildCacheKey(params)

  return withCache(cacheKey, 600 * 1000, async () => {
    const whereClause: Record<string, unknown> = {
      userId: params.userId,
      confidence: {
        gte: params.minConfidence,
      },
    }

    if (params.patternType) {
      whereClause.patternType = params.patternType
    }

    return prisma.behavioralPattern.findMany({
      where: whereClause,
      orderBy: [{ confidence: 'desc' }, { lastSeenAt: 'desc' }],
      take: params.limit,
    })
  })
}

async function handleRequest(request: NextRequest, input: PatternsInput) {
  const provider = resolveAnalyticsProvider(request)

  if (provider === 'mock') {
    return respondWithMock(getMockComprehensionPattern(input.userId))
  }

  const legacyPatterns = await fetchLegacyPatterns(input)
  const mockEnvelope = getMockComprehensionPattern(input.userId)
  return respondWithMock({
    metadata: mockEnvelope.metadata,
    payload: {
      ...mockEnvelope.payload,
      legacy_patterns: { patterns: legacyPatterns, count: legacyPatterns.length },
    },
  })
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const raw = await request.json().catch(() => ({}))
  const input = parseBody(raw)
  return handleRequest(request, input)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const input = parseQuery(request)
  return handleRequest(request, input)
})

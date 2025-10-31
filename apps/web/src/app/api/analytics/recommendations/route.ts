import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-response'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import { getMockRecommendationData } from '@/lib/mocks/analytics'
import { prisma } from '@/lib/db'

type Period = '7d' | '30d' | '90d'

const RecommendationSchema = z.object({
  userId: z.string().min(1, 'user_id is required'),
  period: z.enum(['7d', '30d', '90d']).default('7d'),
})

type RecommendationInput = z.infer<typeof RecommendationSchema>

function parseBody(body: unknown): RecommendationInput {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return RecommendationSchema.parse({
    userId: (value.user_id ?? value.userId ?? '') as string,
    period: (value.period as Period | undefined) ?? '7d',
  })
}

function parseQuery(request: NextRequest): RecommendationInput {
  const params = request.nextUrl.searchParams
  return RecommendationSchema.parse({
    userId: params.get('user_id') ?? params.get('userId') ?? '',
    period: (params.get('period') as Period | null) ?? '7d',
  })
}

async function fetchLegacyMetrics(userId: string, period: Period) {
  const daysMap: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[period]
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const recommendations = await prisma.content_recommendations.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
  })

  const totalRecommendations = recommendations.length
  const viewedCount = recommendations.filter((r: any) => r.viewedAt !== null).length
  const dismissedCount = recommendations.filter((r: any) => r.status === 'DISMISSED').length

  const clickEvents = await prisma.behavioralEvent.findMany({
    where: {
      userId,
      eventType: 'RECOMMENDATION_CLICKED',
      timestamp: { gte: startDate },
    },
  })
  const clickedCount = clickEvents.length

  const ctr = totalRecommendations > 0 ? clickedCount / totalRecommendations : 0

  const allFeedback = recommendations.flatMap((r: any) => r.feedback ?? [])
  const avgRating =
    allFeedback.length > 0
      ? allFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / allFeedback.length
      : 0

  const avgEngagementTimeMs = 0

  const sourceTypeCounts: Record<string, number> = {}
  for (const rec of recommendations) {
    sourceTypeCounts[rec.sourceType] = (sourceTypeCounts[rec.sourceType] || 0) + 1
  }

  const topSources = Object.entries(sourceTypeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const improvementCorrelation = 0

  return {
    period,
    startDate,
    endDate: new Date(),
    metrics: {
      totalRecommendations,
      viewedCount,
      clickedCount,
      dismissedCount,
      ctr: parseFloat(ctr.toFixed(3)),
      avgRating: parseFloat(avgRating.toFixed(2)),
      avgEngagementTimeMs,
      topSources,
      improvementCorrelation,
    },
  }
}

async function handleRequest(request: NextRequest, input: RecommendationInput) {
  const provider = resolveAnalyticsProvider(request)

  if (provider === 'mock') {
    return Response.json(getMockRecommendationData(input.userId))
  }

  const legacyMetrics = await fetchLegacyMetrics(input.userId, input.period)
  const mockData = getMockRecommendationData(input.userId)
  return Response.json({ ...mockData, legacy_metrics: legacyMetrics })
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

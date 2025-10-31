import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, ErrorCodes, withErrorHandler } from '@/lib/api-response'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import { getMockPeerBenchmark } from '@/lib/mocks/analytics'

const PeerBenchmarkSchema = z.object({
  userId: z.string().min(1, 'user_id is required'),
  objectiveId: z.string().nullish(),
})

type PeerBenchmarkInput = z.infer<typeof PeerBenchmarkSchema>

function parseBody(body: unknown): PeerBenchmarkInput {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return PeerBenchmarkSchema.parse({
    userId: (value.user_id ?? value.userId ?? '') as string,
    objectiveId: (value.objective_id ?? value.objectiveId ?? null) as string | null | undefined,
  })
}

function parseQuery(request: NextRequest): PeerBenchmarkInput {
  const params = request.nextUrl.searchParams
  return PeerBenchmarkSchema.parse({
    userId: params.get('user_id') ?? params.get('userId') ?? '',
    objectiveId: params.get('objective_id') ?? params.get('objectiveId') ?? null,
  })
}

function buildResponse(input: PeerBenchmarkInput, request: NextRequest) {
  const provider = resolveAnalyticsProvider(request)

  if (provider === 'mock') {
    return Response.json(getMockPeerBenchmark(input.userId, input.objectiveId ?? undefined))
  }

  throw new ApiError('Legacy analytics provider is not implemented for peer benchmarks.', 501, ErrorCodes.INTERNAL_ERROR)
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const raw = await request.json().catch(() => ({}))
  const input = parseBody(raw)
  return buildResponse(input, request)
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const input = parseQuery(request)
  return buildResponse(input, request)
})

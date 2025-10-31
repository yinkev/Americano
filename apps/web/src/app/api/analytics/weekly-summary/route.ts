import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, ErrorCodes, withErrorHandler } from '@/lib/api-response'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import { getMockWeeklySummary } from '@/lib/mocks/analytics'

const WeeklySummarySchema = z.object({
  userId: z.string().min(1, 'user_id is required'),
})

type WeeklySummaryInput = z.infer<typeof WeeklySummarySchema>

function parseBody(body: unknown): WeeklySummaryInput {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return WeeklySummarySchema.parse({
    userId: (value.user_id ?? value.userId ?? '') as string,
  })
}

function parseQuery(request: NextRequest): WeeklySummaryInput {
  const params = request.nextUrl.searchParams
  return WeeklySummarySchema.parse({
    userId: params.get('user_id') ?? params.get('userId') ?? '',
  })
}

function buildResponse(input: WeeklySummaryInput, request: NextRequest) {
  const provider = resolveAnalyticsProvider(request)

  if (provider === 'mock') {
    return Response.json(getMockWeeklySummary(input.userId))
  }

  throw new ApiError('Legacy analytics provider is not implemented for weekly summary.', 501, ErrorCodes.INTERNAL_ERROR)
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

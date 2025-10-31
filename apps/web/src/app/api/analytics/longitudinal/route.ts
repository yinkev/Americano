import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, ErrorCodes, withErrorHandler } from '@/lib/api-response'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import { getMockLongitudinalMetric } from '@/lib/mocks/analytics'

const LongitudinalSchema = z.object({
  userId: z.string().min(1, 'user_id is required'),
  dateRange: z.string().nullish(),
  dimensions: z.union([z.array(z.string()), z.string()]).nullish(),
})

type LongitudinalInput = z.infer<typeof LongitudinalSchema>

function parseBody(body: unknown): LongitudinalInput {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return LongitudinalSchema.parse({
    userId: (value.user_id ?? value.userId ?? '') as string,
    dateRange: (value.date_range ?? value.dateRange ?? null) as string | null | undefined,
    dimensions: value.dimensions ?? null,
  })
}

function parseQuery(request: NextRequest): LongitudinalInput {
  const params = request.nextUrl.searchParams
  const dimensions = params.getAll('dimensions')
  const rawDimensions = dimensions.length > 0 ? dimensions : params.get('dimensions')
  const parsedDimensions =
    typeof rawDimensions === 'string' ? rawDimensions.split(',').map((item) => item.trim()).filter(Boolean) : rawDimensions

  return LongitudinalSchema.parse({
    userId: params.get('user_id') ?? params.get('userId') ?? '',
    dateRange: params.get('date_range') ?? params.get('dateRange') ?? null,
    dimensions: parsedDimensions && Array.isArray(parsedDimensions) && parsedDimensions.length > 0 ? parsedDimensions : null,
  })
}

function buildResponse(input: LongitudinalInput, request: NextRequest) {
  const provider = resolveAnalyticsProvider(request)

  if (provider === 'mock') {
    return Response.json(getMockLongitudinalMetric(input.userId))
  }

  throw new ApiError('Legacy analytics provider is not implemented for longitudinal analytics.', 501, ErrorCodes.INTERNAL_ERROR)
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

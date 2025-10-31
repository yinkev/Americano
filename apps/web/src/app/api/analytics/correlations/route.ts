import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, ErrorCodes, withErrorHandler } from '@/lib/api-response'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import { getMockCorrelationMatrix, respondWithMock } from '@/lib/mocks/analytics'

const CorrelationsSchema = z.object({
  userId: z.string().min(1, 'user_id is required'),
})

type CorrelationsInput = z.infer<typeof CorrelationsSchema>

function parseBody(body: unknown): CorrelationsInput {
  const value = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return CorrelationsSchema.parse({
    userId: (value.user_id ?? value.userId ?? '') as string,
  })
}

function parseQuery(request: NextRequest): CorrelationsInput {
  const params = request.nextUrl.searchParams
  return CorrelationsSchema.parse({
    userId: params.get('user_id') ?? params.get('userId') ?? '',
  })
}

function buildResponse(input: CorrelationsInput, request: NextRequest) {
  const provider = resolveAnalyticsProvider(request)

  if (provider === 'mock') {
    return respondWithMock(getMockCorrelationMatrix(input.userId))
  }

  throw new ApiError('Legacy analytics provider is not implemented for correlation analytics.', 501, ErrorCodes.INTERNAL_ERROR)
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

/**
 * GET /api/analytics/interventions
 *
 * Retrieve active intervention recommendations
 *
 * Story 5.2: Predictive Analytics for Learning Struggles - Task 11.3
 * Updated: Proxy to FastAPI ML service
 */

import { type NextRequest, NextResponse } from 'next/server'
import { resolveAnalyticsProvider } from '@/lib/analytics-provider'
import {
  getMockInterventionResponse,
  respondWithMock,
  respondWithMockPayload,
  type MetadataEnvelope,
} from '@/lib/mocks/analytics'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

/**
 * GET /api/analytics/interventions
 *
 * Proxies request to FastAPI ML service
 * Query params:
 * - userId (default: kevy@americano.dev)
 */
export async function GET(req: NextRequest) {
  const provider = resolveAnalyticsProvider(req)
  const mockEnvelope = getMockInterventionResponse()

  if (provider === 'mock') {
    return respondWithMock(mockEnvelope)
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const queryString = searchParams.toString()

    // Proxy to FastAPI ML service
    const response = await fetch(`${ML_SERVICE_URL}/interventions?${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'ML service error' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    const maybeMockResponse = respondIfMock(data, mockEnvelope.metadata)
    if (maybeMockResponse) {
      return maybeMockResponse
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('ML service error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'ML service unavailable',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 },
    )
  }
}

type MockMetadata = MetadataEnvelope<unknown>['metadata']

function respondIfMock(data: unknown, fallbackMetadata: MockMetadata): Response | null {
  if (
    data &&
    typeof data === 'object' &&
    'dataSource' in data &&
    (data as { dataSource?: unknown }).dataSource === 'mock'
  ) {
    const mockData = data as {
      metadata?: MockMetadata
      payload?: unknown
    }
    const metadata = mockData.metadata ?? fallbackMetadata
    const payload = mockData.payload ?? data
    return respondWithMockPayload(payload, metadata)
  }

  return null
}

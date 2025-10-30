/**
 * GET /api/analytics/struggle-reduction
 *
 * Measure reduction in learning struggles since predictive system activation
 *
 * Story 5.2: Predictive Analytics for Learning Struggles - Task 11.7
 * Updated: Proxy to FastAPI ML service
 */

import { type NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

/**
 * GET /api/analytics/struggle-reduction
 *
 * Proxies request to FastAPI ML service
 * Query params:
 * - userId (default: kevy@americano.dev)
 * - period (week | month | all, default: month)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const queryString = searchParams.toString()

    // Proxy to FastAPI ML service
    const response = await fetch(`${ML_SERVICE_URL}/struggle-reduction?${queryString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'ML service error' }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
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

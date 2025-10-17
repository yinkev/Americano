/**
 * POST /api/analytics/predictions/generate
 *
 * Generate struggle predictions for upcoming objectives
 *
 * Story 5.2: Predictive Analytics for Learning Struggles - Task 11.1
 * Updated: Proxy to FastAPI ML service
 */

import { NextRequest, NextResponse } from 'next/server'

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'

/**
 * POST /api/analytics/predictions/generate
 *
 * Proxies request to FastAPI ML service
 * Body: { userId: string, daysAhead?: number (default 7) }
 * Returns: { predictions: StrugglePrediction[], alerts: StruggleAlert[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Proxy to FastAPI ML service
    const response = await fetch(`${ML_SERVICE_URL}/predictions/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      { status: 503 }
    )
  }
}

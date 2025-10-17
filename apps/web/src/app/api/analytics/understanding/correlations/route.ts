import { NextRequest, NextResponse } from 'next/server'
import { validateQuery, analyticsQuerySchema, correlationsResponseSchema } from '@/lib/validation'
import { ApiError } from '@/lib/api-error'

/**
 * GET /api/analytics/understanding/correlations
 *
 * Fetches objective correlation matrix and dependency analysis.
 * Proxies request to Python FastAPI service for statistical correlation analysis.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = validateQuery(searchParams, analyticsQuerySchema)
    const userEmail = request.headers.get('X-User-Email') || 'test@example.com'

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${pythonServiceUrl}/analytics/understanding/correlations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: userEmail,
        date_range: query.dateRange,
        course_id: query.courseId,
        topic: query.topic,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw ApiError.internal('Python service error', errorData)
    }

    const data = await response.json()
    const validatedData = correlationsResponseSchema.parse(data)

    return NextResponse.json(validatedData, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: error.statusCode })
    }

    console.error('Correlations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

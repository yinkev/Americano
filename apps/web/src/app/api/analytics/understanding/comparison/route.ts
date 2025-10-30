import { type NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-error'
import { analyticsQuerySchema, comparisonDataSchema, validateQuery } from '@/lib/validation'

/**
 * GET /api/analytics/understanding/comparison
 *
 * Fetches understanding vs memorization comparison data.
 * Proxies request to Python FastAPI service for correlation analysis.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = validateQuery(searchParams, analyticsQuerySchema)
    const userEmail = request.headers.get('X-User-Email') || 'test@example.com'

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${pythonServiceUrl}/analytics/understanding/comparison`, {
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
    const validatedData = comparisonDataSchema.parse(data)

    return NextResponse.json(validatedData, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode },
      )
    }

    console.error('Comparison API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

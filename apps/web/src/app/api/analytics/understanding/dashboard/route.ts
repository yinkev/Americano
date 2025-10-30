import { type NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-error'
import { analyticsQuerySchema, dashboardResponseSchema, validateQuery } from '@/lib/validation'

/**
 * GET /api/analytics/understanding/dashboard
 *
 * Fetches dashboard overview metrics for understanding validation.
 * Proxies request to Python FastAPI service for AI-powered analytics.
 *
 * Query params:
 * - dateRange: '7d' | '30d' | '90d' (default: '30d')
 * - courseId?: string (optional course filter)
 * - topic?: string (optional topic filter)
 *
 * Response: DashboardResponse with 6 metric cards
 */
export async function GET(request: NextRequest) {
  try {
    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const query = validateQuery(searchParams, analyticsQuerySchema)

    // Get user from hardcoded auth (MVP)
    const userEmail = request.headers.get('X-User-Email') || 'test@example.com'

    // Call Python FastAPI service
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${pythonServiceUrl}/analytics/understanding/dashboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    // Validate response with Zod
    const validatedData = dashboardResponseSchema.parse(data)

    return NextResponse.json(validatedData, { status: 200 })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode },
      )
    }

    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

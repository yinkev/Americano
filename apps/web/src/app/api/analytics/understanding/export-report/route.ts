import { type NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/lib/api-error'
import { exportReportSchema, validateRequest } from '@/lib/validation'

/**
 * POST /api/analytics/understanding/export-report
 *
 * Generates and downloads a PDF report of understanding analytics.
 * Proxies request to Python FastAPI service for PDF generation.
 *
 * Request body:
 * - dateRange: '7d' | '30d' | '90d'
 * - includeCharts: boolean
 *
 * Response: PDF file as Buffer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await validateRequest(request, exportReportSchema)
    const userEmail = request.headers.get('X-User-Email') || 'test@example.com'

    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'
    const response = await fetch(`${pythonServiceUrl}/analytics/understanding/export-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: userEmail,
        date_range: body.dateRange,
        include_charts: body.includeCharts,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw ApiError.internal('Python service error', errorData)
    }

    // Get PDF buffer from Python service
    const pdfBuffer = await response.arrayBuffer()
    const filename = `understanding-report-${new Date().toISOString().split('T')[0]}.pdf`

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode },
      )
    }

    console.error('Export report API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calendar Status API Route
 * Story 5.3 Task 6: GET /api/calendar/status
 *
 * Check calendar integration status for user
 *
 * NOTE: This is a stub implementation for Story 5.3
 * Database model `calendarIntegration` not yet created
 */

import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // STUB: Calendar integration not yet implemented
    console.log('[STUB] Calendar status check for user:', userId)

    return NextResponse.json({
      connected: false,
      message: 'Calendar integration feature coming in Story 5.3',
    })
  } catch (error) {
    console.error('Calendar status check error:', error)
    return NextResponse.json({ error: 'Failed to check calendar status' }, { status: 500 })
  }
}

/**
 * Calendar OAuth Callback API Route
 * Story 5.3 Task 6: GET /api/calendar/callback
 *
 * Handles OAuth callback from calendar provider
 * Exchanges authorization code for tokens and stores encrypted
 *
 * NOTE: This is a stub implementation for Story 5.3
 * Database model `calendarIntegration` not yet created
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent(error)}`, request.url),
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?calendar_error=missing_params', request.url))
    }

    // STUB: Calendar integration not yet implemented
    console.log('[STUB] Calendar callback received:', { code: code.substring(0, 10), state })

    // Redirect to settings with placeholder message
    return NextResponse.redirect(
      new URL('/settings?calendar_message=integration_pending', request.url),
    )
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(new URL('/settings?calendar_error=connection_failed', request.url))
  }
}

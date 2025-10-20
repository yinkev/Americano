/**
 * Calendar Connect API Route
 * Story 5.3 Task 6: POST /api/calendar/connect
 *
 * Initiates OAuth flow for calendar provider
 * Returns authorization URL for user redirect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarProvider } from '@/lib/calendar/google-calendar-provider'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const ConnectSchema = z.object({
  provider: z.enum(['GOOGLE', 'OUTLOOK']),
  userId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, userId } = ConnectSchema.parse(body)

    if (provider !== 'GOOGLE') {
      return NextResponse.json(
        { error: 'Only Google Calendar is supported in MVP' },
        { status: 400 },
      )
    }

    // Generate random state for CSRF protection
    const state = randomBytes(32).toString('hex')

    // Store state in session/database for verification in callback
    // For MVP, we'll encode userId in state (in production, use session storage)
    const stateWithUser = `${state}:${userId}`

    // Get OAuth provider
    const calendarProvider = createGoogleCalendarProvider()

    // Build redirect URI
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/calendar/callback`

    // Get authorization URL
    const authorizationUrl = calendarProvider.getAuthorizationUrl(redirectUri, stateWithUser)

    return NextResponse.json({
      authorizationUrl,
      state: stateWithUser,
    })
  } catch (error) {
    console.error('Calendar connect error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Failed to initiate calendar connection' }, { status: 500 })
  }
}

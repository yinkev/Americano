/**
 * Calendar OAuth Callback API Route
 * Story 5.3 Task 6: GET /api/calendar/callback
 *
 * Handles OAuth callback from calendar provider
 * Exchanges authorization code for tokens and stores encrypted
 */

import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarProvider } from '@/lib/calendar/google-calendar-provider'
import { encryptToken } from '@/lib/crypto/token-encryption'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle user denial
    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?calendar_error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?calendar_error=missing_params', request.url)
      )
    }

    // Extract userId from state (MVP approach)
    // In production, retrieve from secure session storage
    const parts = state.split(':')
    if (parts.length < 2) {
      return NextResponse.redirect(
        new URL('/settings?calendar_error=invalid_state', request.url)
      )
    }
    const userId = parts[1]

    // Get OAuth provider
    const provider = createGoogleCalendarProvider()

    // Build redirect URI (must match the one used in authorization)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/calendar/callback`

    // Exchange code for tokens
    const { accessToken, refreshToken, expiresIn } = await provider.exchangeCodeForTokens(
      code,
      redirectUri
    )

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(accessToken)
    const encryptedRefreshToken = encryptToken(refreshToken)

    // Check if integration already exists
    const existingIntegration = await prisma.calendarIntegration.findUnique({
      where: { userId },
    })

    if (existingIntegration) {
      // Update existing integration
      await prisma.calendarIntegration.update({
        where: { userId },
        data: {
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          calendarId: 'primary', // Google Calendar primary calendar
          syncEnabled: true,
          lastSyncAt: new Date(),
        },
      })
    } else {
      // Create new integration
      await prisma.calendarIntegration.create({
        data: {
          userId,
          calendarProvider: 'GOOGLE',
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          calendarId: 'primary',
          syncEnabled: true,
          lastSyncAt: new Date(),
        },
      })
    }

    // Redirect to settings with success message
    return NextResponse.redirect(new URL('/settings?calendar_success=true', request.url))
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?calendar_error=connection_failed', request.url)
    )
  }
}

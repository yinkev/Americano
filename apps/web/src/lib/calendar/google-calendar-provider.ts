/**
 * Google Calendar Provider Implementation
 * Story 5.3 Task 6: Google Calendar OAuth Integration
 *
 * Implements CalendarProvider interface for Google Calendar API v3
 * Uses OAuth 2.0 for authentication with offline access
 */

import { OAuth2Client } from 'google-auth-library'
import type { CalendarAvailability, CalendarEvent, CalendarProvider } from './calendar-provider'

const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]

export class GoogleCalendarProvider implements CalendarProvider {
  readonly providerId = 'GOOGLE' as const
  private oauth2Client: OAuth2Client

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error(
        'Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
      )
    }

    this.oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
    })
  }

  /**
   * Generate Google OAuth authorization URL
   * Story 5.3 Task 6.2: OAuth 2.0 flow implementation
   */
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const authorizeUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Request refresh token
      scope: GOOGLE_CALENDAR_SCOPES,
      state, // CSRF protection
      prompt: 'consent', // Force consent screen to get refresh token
      redirect_uri: redirectUri,
    })

    return authorizeUrl
  }

  /**
   * Exchange authorization code for tokens
   * Story 5.3 Task 6.2: Token acquisition
   */
  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const { tokens } = await this.oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    })

    if (!tokens.access_token) {
      throw new Error('Failed to obtain access token from Google')
    }

    if (!tokens.refresh_token) {
      throw new Error('Failed to obtain refresh token. User may have already authorized.')
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
    }
  }

  /**
   * Refresh access token using refresh token
   * Story 5.3 Task 6.2: Token refresh for long-term access
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiresIn: number
  }> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    const { credentials } = await this.oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token')
    }

    return {
      accessToken: credentials.access_token,
      expiresIn: credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
    }
  }

  /**
   * Fetch calendar events within date range
   * Story 5.3 Task 6.2: Calendar API integration
   */
  async getEvents(accessToken: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    url.searchParams.set('timeMin', startDate.toISOString())
    url.searchParams.set('timeMax', endDate.toISOString())
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '250')

    const response = await this.oauth2Client.request({ url: url.toString() })
    const data = response.data as any

    if (!data.items || !Array.isArray(data.items)) {
      return []
    }

    return data.items.map((item: any) => this.mapGoogleEventToCalendarEvent(item))
  }

  /**
   * Check availability using Google Calendar FreeBusy API
   * Story 5.3 Task 6.2: Availability checking for scheduling
   */
  async getAvailability(
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarAvailability[]> {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const url = 'https://www.googleapis.com/calendar/v3/freeBusy'
    const response = await this.oauth2Client.request({
      url,
      method: 'POST',
      data: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: 'primary' }],
      },
    })

    const data = response.data as any
    const busyPeriods = data.calendars?.primary?.busy || []

    const availability: CalendarAvailability[] = []

    // Convert busy periods to availability windows
    for (const busy of busyPeriods) {
      availability.push({
        startTime: new Date(busy.start),
        endTime: new Date(busy.end),
        isBusy: true,
      })
    }

    return availability
  }

  /**
   * Create a calendar event
   * Story 5.3 Task 6.2: Event creation for scheduled study sessions
   */
  async createEvent(accessToken: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
    const response = await this.oauth2Client.request({
      url,
      method: 'POST',
      data: {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        status: event.status || 'confirmed',
        transparency: event.transparency || 'opaque',
      },
    })

    const data = response.data as any
    return this.mapGoogleEventToCalendarEvent(data)
  }

  /**
   * Revoke OAuth access tokens
   * Story 5.3 Task 6.2: Token revocation for disconnect
   */
  async revokeAccess(accessToken: string): Promise<void> {
    await this.oauth2Client.revokeToken(accessToken)
  }

  /**
   * Helper: Map Google Calendar event to CalendarEvent interface
   */
  private mapGoogleEventToCalendarEvent(googleEvent: any): CalendarEvent {
    return {
      id: googleEvent.id,
      summary: googleEvent.summary || 'Untitled Event',
      start: new Date(googleEvent.start?.dateTime || googleEvent.start?.date),
      end: new Date(googleEvent.end?.dateTime || googleEvent.end?.date),
      status: (googleEvent.status || 'confirmed') as 'confirmed' | 'tentative' | 'cancelled',
      transparency: (googleEvent.transparency || 'opaque') as 'opaque' | 'transparent',
      description: googleEvent.description,
      location: googleEvent.location,
    }
  }
}

/**
 * Factory function for creating calendar provider
 */
export function createGoogleCalendarProvider(): CalendarProvider {
  return new GoogleCalendarProvider()
}

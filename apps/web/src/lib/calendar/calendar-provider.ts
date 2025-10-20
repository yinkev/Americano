/**
 * Calendar Provider Abstraction Layer
 * Story 5.3 Task 6: Calendar Integration System
 *
 * Defines the interface for calendar providers (Google, Outlook, etc.)
 * Enables swappable calendar implementations with consistent API
 */

export interface CalendarEvent {
  id: string
  summary: string
  start: Date
  end: Date
  status: 'confirmed' | 'tentative' | 'cancelled'
  transparency: 'opaque' | 'transparent' // busy vs free
  description?: string
  location?: string
}

export interface CalendarAvailability {
  startTime: Date
  endTime: Date
  isBusy: boolean
  event?: CalendarEvent
}

export interface CalendarProvider {
  /**
   * Provider identifier
   */
  readonly providerId: 'GOOGLE' | 'OUTLOOK' | 'ICAL'

  /**
   * Initialize OAuth flow and return authorization URL
   * @param redirectUri The redirect URI for OAuth callback
   * @param state Random state for CSRF protection
   * @returns Authorization URL to redirect user to
   */
  getAuthorizationUrl(redirectUri: string, state: string): string

  /**
   * Exchange authorization code for tokens
   * @param code Authorization code from OAuth callback
   * @param redirectUri The same redirect URI used in authorization
   * @returns Access token and refresh token
   */
  exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }>

  /**
   * Refresh access token using refresh token
   * @param refreshToken The refresh token
   * @returns New access token
   */
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiresIn: number
  }>

  /**
   * Fetch calendar events within a date range
   * @param accessToken OAuth access token
   * @param startDate Start of date range
   * @param endDate End of date range
   * @returns Array of calendar events
   */
  getEvents(accessToken: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>

  /**
   * Check availability (free/busy) for time slots
   * @param accessToken OAuth access token
   * @param startDate Start of date range
   * @param endDate End of date range
   * @returns Array of availability windows
   */
  getAvailability(
    accessToken: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarAvailability[]>

  /**
   * Create a calendar event
   * @param accessToken OAuth access token
   * @param event Event details
   * @returns Created event with ID
   */
  createEvent(accessToken: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>

  /**
   * Revoke OAuth tokens
   * @param accessToken OAuth access token
   */
  revokeAccess(accessToken: string): Promise<void>
}

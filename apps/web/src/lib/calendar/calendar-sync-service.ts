/**
 * Calendar Sync Service
 * Story 5.3 Task 6.5: Scheduled calendar synchronization
 *
 * Manages periodic calendar syncing and conflict detection
 * Updates CalendarIntegration.lastSyncAt timestamp
 */

import { prisma } from '@/lib/db'
import { createGoogleCalendarProvider } from './google-calendar-provider'
import { decryptToken } from '../crypto/token-encryption'
import type { CalendarProvider } from './calendar-provider'
import { addDays } from 'date-fns'

/**
 * Calendar conflict detection result
 */
export interface CalendarConflict {
  calendarEventId: string
  eventSummary: string
  eventStart: Date
  eventEnd: Date
  conflictType: 'FULL_OVERLAP' | 'PARTIAL_OVERLAP'
  recommendedTimeStart?: Date
}

/**
 * Sync calendar events for a user
 * Story 5.3 Task 6.5: Calendar sync implementation
 *
 * @param userId User ID
 * @param daysAhead How many days ahead to sync (default: 7)
 * @returns Sync result with event count and conflicts
 */
export async function syncUserCalendar(
  userId: string,
  daysAhead: number = 7
): Promise<{
  success: boolean
  eventsSynced: number
  conflicts: CalendarConflict[]
  error?: string
}> {
  try {
    // Get calendar integration for user
    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId },
    })

    if (!integration || !integration.syncEnabled) {
      return {
        success: false,
        eventsSynced: 0,
        conflicts: [],
        error: 'Calendar integration not found or disabled',
      }
    }

    // Get calendar provider
    const provider = getCalendarProvider(integration.calendarProvider)

    // Decrypt access token
    const accessToken = decryptToken(integration.accessToken)

    // Fetch events for next N days
    const startDate = new Date()
    const endDate = addDays(startDate, daysAhead)

    const events = await provider.getEvents(accessToken, startDate, endDate)

    // Detect conflicts with recommended study times
    const conflicts = await detectStudyTimeConflicts(userId, events)

    // Update last sync timestamp
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
      },
    })

    return {
      success: true,
      eventsSynced: events.length,
      conflicts,
    }
  } catch (error) {
    console.error(`Calendar sync failed for user ${userId}:`, error)
    return {
      success: false,
      eventsSynced: 0,
      conflicts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Detect conflicts between calendar events and recommended study times
 * Story 5.3 Task 2: Integrates with StudyTimeRecommender
 *
 * @param userId User ID
 * @param calendarEvents Calendar events from provider
 * @returns Array of detected conflicts
 */
async function detectStudyTimeConflicts(
  userId: string,
  calendarEvents: any[]
): Promise<CalendarConflict[]> {
  const conflicts: CalendarConflict[] = []

  // Get active study schedule recommendations for user
  const recommendations = await prisma.studyScheduleRecommendation.findMany({
    where: {
      userId,
      appliedAt: null, // Not yet applied
      recommendedStartTime: {
        gte: new Date(),
      },
    },
    orderBy: {
      confidence: 'desc',
    },
    take: 5, // Top 5 recommendations
  })

  // Check each recommendation against calendar events
  for (const recommendation of recommendations) {
    const recStart = recommendation.recommendedStartTime
    const recEnd = new Date(recStart.getTime() + recommendation.recommendedDuration * 60 * 1000)

    for (const event of calendarEvents) {
      // Skip free/transparent events
      if (event.transparency === 'transparent') continue

      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)

      // Check for overlap
      const hasOverlap =
        (recStart >= eventStart && recStart < eventEnd) || // Rec starts during event
        (recEnd > eventStart && recEnd <= eventEnd) || // Rec ends during event
        (recStart <= eventStart && recEnd >= eventEnd) // Rec fully contains event

      if (hasOverlap) {
        const conflictType =
          recStart >= eventStart && recEnd <= eventEnd ? 'FULL_OVERLAP' : 'PARTIAL_OVERLAP'

        conflicts.push({
          calendarEventId: event.id,
          eventSummary: event.summary,
          eventStart,
          eventEnd,
          conflictType,
          recommendedTimeStart: recStart,
        })
      }
    }
  }

  return conflicts
}

/**
 * Get calendar provider instance based on type
 */
function getCalendarProvider(providerType: string): CalendarProvider {
  switch (providerType) {
    case 'GOOGLE':
      return createGoogleCalendarProvider()
    case 'OUTLOOK':
      throw new Error('Outlook provider not yet implemented (Story 5.3 Task 6.3)')
    case 'ICAL':
      throw new Error('iCal provider not yet implemented (Story 5.3 Task 6.3)')
    default:
      throw new Error(`Unknown calendar provider: ${providerType}`)
  }
}

/**
 * Refresh expired access tokens
 * Story 5.3: Token refresh for long-lived integrations
 *
 * @param userId User ID
 * @returns New access token or null if refresh failed
 */
export async function refreshUserCalendarToken(userId: string): Promise<string | null> {
  try {
    const integration = await prisma.calendarIntegration.findUnique({
      where: { userId },
    })

    if (!integration || !integration.refreshToken) {
      return null
    }

    const provider = getCalendarProvider(integration.calendarProvider)
    const refreshToken = decryptToken(integration.refreshToken)

    const { accessToken, expiresIn } = await provider.refreshAccessToken(refreshToken)

    // Update access token in database (encrypted)
    const { encryptToken } = await import('../crypto/token-encryption')
    const encryptedToken = encryptToken(accessToken)

    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: encryptedToken,
      },
    })

    return accessToken
  } catch (error) {
    console.error(`Token refresh failed for user ${userId}:`, error)
    return null
  }
}

/**
 * Study Time Recommender
 * Story 5.3 Task 2
 *
 * Generates personalized recommendations for optimal study times based on
 * behavioral patterns, calendar availability, and cognitive load analysis.
 */

import { prisma } from '@/lib/db'
import { StudyTimeAnalyzer, type StudyTimePattern } from './study-time-analyzer'

/**
 * Represents a recommended study time slot with confidence score
 */
export interface TimeSlot {
  startTime: Date
  endTime: Date
  duration: number // minutes
  score: number // 0-100, weighted performance score
  confidence: number // 0.0-1.0
  reasoning: string[]
  calendarConflict: boolean
  conflictingEvents?: CalendarEvent[]
}

/**
 * Calendar event from external calendar integration
 */
export interface CalendarEvent {
  id: string
  summary: string
  start: Date
  end: Date
  status: 'confirmed' | 'tentative' | 'cancelled'
}

/**
 * Study Time Recommender class
 * Generates optimal study time recommendations
 */
export class StudyTimeRecommender {
  /**
   * Generate top 3-5 recommended study time slots for a user
   *
   * Algorithm:
   * 1. Query user's optimal study time patterns (Story 5.1)
   * 2. Query calendar integration for availability
   * 3. For each hour-of-day with historical performance:
   *    - Calculate optimalTimeScore (historical performance)
   *    - Check calendar availability (0 if busy, 100 if free)
   *    - Check user preference match (from UserLearningProfile)
   *    - Calculate recency score (recent sessions bonus)
   *    - Composite score = performance * 0.4 + availability * 0.3 + preference * 0.2 + recency * 0.1
   * 4. Return top 3-5 slots with confidence >= 0.5
   * 5. Confidence = min(1.0, totalHistoricalSessions / 50)
   *
   * @param userId - User ID to generate recommendations for
   * @param date - Target date for recommendations (default: today)
   * @param missionId - Optional mission ID for context-aware recommendations
   * @returns Array of TimeSlot recommendations sorted by score DESC
   */
  static async generateRecommendations(
    userId: string,
    date: Date = new Date(),
    missionId?: string,
  ): Promise<TimeSlot[]> {
    // 1. Get historical study time patterns
    const patterns = await StudyTimeAnalyzer.analyzeOptimalStudyTimes(userId, 6)

    if (patterns.length === 0) {
      // No historical data - return default recommendations
      return this.getDefaultRecommendations(date)
    }

    // 2. Get calendar integration status
    const calendarIntegration = await prisma.calendarIntegration.findUnique({
      where: { userId },
    })

    const calendarEvents: CalendarEvent[] = calendarIntegration?.syncEnabled
      ? await this.fetchCalendarEvents(userId, date)
      : []

    // 3. Get user preferences
    const userProfile = await prisma.userLearningProfile.findUnique({
      where: { userId },
    })

    const preferredStudyTimes = (userProfile?.preferredStudyTimes || []) as Array<{
      dayOfWeek: number
      startHour: number
      endHour: number
    }>

    // 4. Get recent sessions for recency scoring
    const recentSessions = await prisma.studySession.findMany({
      where: {
        userId,
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        completedAt: { not: null },
      },
      select: {
        startedAt: true,
      },
    })

    // 5. Generate time slots for each pattern
    const recommendations: TimeSlot[] = []

    for (const pattern of patterns) {
      const { hourOfDay, timeOfDayScore, sessionCount, confidence } = pattern

      // Create time slot for the target date
      const startTime = new Date(date)
      startTime.setHours(hourOfDay, 0, 0, 0)
      const endTime = new Date(startTime)
      endTime.setHours(hourOfDay + 1, 0, 0, 0)

      // Check calendar availability
      const conflicts = this.checkCalendarConflicts(startTime, endTime, calendarEvents)
      const availabilityScore = conflicts.length > 0 ? 0 : 100

      // Check preference match
      const dayOfWeek = date.getDay()
      const preferenceScore = this.calculatePreferenceScore(hourOfDay, dayOfWeek, preferredStudyTimes)

      // Calculate recency score (sessions at this hour in last 7 days)
      const recentSessionsAtHour = recentSessions.filter(
        (s) => s.startedAt.getHours() === hourOfDay,
      ).length
      const recencyScore = Math.min(100, (recentSessionsAtHour / 3) * 100)

      // Calculate composite score
      const compositeScore =
        timeOfDayScore * 0.4 + availabilityScore * 0.3 + preferenceScore * 0.2 + recencyScore * 0.1

      // Build reasoning
      const reasoning: string[] = []
      reasoning.push(`Historical performance: ${Math.round(timeOfDayScore)}% (${sessionCount} sessions)`)
      if (availabilityScore > 0) {
        reasoning.push('Calendar available')
      } else {
        reasoning.push(`Calendar conflict: ${conflicts.map((c) => c.summary).join(', ')}`)
      }
      if (preferenceScore >= 50) {
        reasoning.push('Matches your preferred study times')
      }
      if (recencyScore > 0) {
        reasoning.push(`Recent success at this time (${recentSessionsAtHour} sessions this week)`)
      }

      recommendations.push({
        startTime,
        endTime,
        duration: 60, // Default 1-hour slot
        score: compositeScore,
        confidence: Math.min(confidence, 1.0),
        reasoning,
        calendarConflict: conflicts.length > 0,
        conflictingEvents: conflicts.length > 0 ? conflicts : undefined,
      })
    }

    // Sort by score DESC and return top 3-5 with confidence >= 0.5
    return recommendations
      .filter((r) => r.confidence >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  /**
   * Check calendar conflicts for a time slot
   */
  private static checkCalendarConflicts(
    startTime: Date,
    endTime: Date,
    events: CalendarEvent[],
  ): CalendarEvent[] {
    return events.filter((event) => {
      if (event.status === 'cancelled') return false
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return (
        (eventStart >= startTime && eventStart < endTime) ||
        (eventEnd > startTime && eventEnd <= endTime) ||
        (eventStart <= startTime && eventEnd >= endTime)
      )
    })
  }

  /**
   * Calculate preference score based on user's preferred study times
   */
  private static calculatePreferenceScore(
    hour: number,
    dayOfWeek: number,
    preferredTimes: Array<{ dayOfWeek: number; startHour: number; endHour: number }>,
  ): number {
    const matchingPreference = preferredTimes.find(
      (pref) => pref.dayOfWeek === dayOfWeek && hour >= pref.startHour && hour < pref.endHour,
    )
    return matchingPreference ? 100 : 50 // 100 if matches preference, 50 if not (neutral)
  }

  /**
   * Fetch calendar events for a given date (placeholder for calendar API integration)
   */
  private static async fetchCalendarEvents(
    userId: string,
    date: Date,
  ): Promise<CalendarEvent[]> {
    // TODO: Implement Google Calendar API integration (Story 5.3 Task 6)
    // For now, return empty array (no conflicts)
    return []
  }

  /**
   * Get default recommendations when no historical data is available
   */
  private static getDefaultRecommendations(date: Date): TimeSlot[] {
    // Default recommendations based on research: morning (7-9 AM) and evening (6-8 PM)
    const morningSlot: TimeSlot = {
      startTime: new Date(date.setHours(7, 0, 0, 0)),
      endTime: new Date(date.setHours(9, 0, 0, 0)),
      duration: 120,
      score: 75,
      confidence: 0.4, // Low confidence without data
      reasoning: [
        'Morning hours (7-9 AM) are effective for most learners',
        'Based on general learning science research',
        'Complete 6 more weeks to unlock personalized timing',
      ],
      calendarConflict: false,
    }

    const eveningSlot: TimeSlot = {
      startTime: new Date(date.setHours(18, 0, 0, 0)),
      endTime: new Date(date.setHours(20, 0, 0, 0)),
      duration: 120,
      score: 70,
      confidence: 0.4,
      reasoning: [
        'Evening hours (6-8 PM) are effective for consolidation',
        'Based on general learning science research',
        'Complete 6 more weeks to unlock personalized timing',
      ],
      calendarConflict: false,
    }

    return [morningSlot, eveningSlot]
  }

  /**
   * Adapt schedule when conflicts or life changes occur
   *
   * @param userId - User ID
   * @param adaptationType - Type of adaptation needed
   * @param reason - Reason for adaptation
   * @param oldValue - Previous value (e.g., "7:00 AM")
   * @param newValue - New value (e.g., "8:30 AM")
   * @returns Updated recommendations
   */
  static async adaptSchedule(
    userId: string,
    adaptationType: 'TIME_SHIFT' | 'DURATION_CHANGE' | 'INTENSITY_ADJUSTMENT' | 'FREQUENCY_CHANGE',
    reason: string,
    oldValue?: string,
    newValue?: string,
  ): Promise<TimeSlot[]> {
    // Record schedule adaptation
    await prisma.scheduleAdaptation.create({
      data: {
        userId,
        adaptationType,
        reason,
        oldValue,
        newValue,
        appliedAt: new Date(),
      },
    })

    // Generate new recommendations based on updated context
    return this.generateRecommendations(userId, new Date())
  }
}

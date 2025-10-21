/**
 * GET /api/analytics/study-time-heatmap
 *
 * Performance scores by day-of-week and hour-of-day
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.6
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'
import { getObjectiveCompletions } from '@/types/mission-helpers'

// Zod validation schema for query parameters
const HeatmapQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  weeks: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 6))
    .refine((val) => val > 0 && val <= 52, 'weeks must be between 1 and 52'),
})

/**
 * GET /api/analytics/study-time-heatmap
 *
 * Returns performance heatmap data + optimal windows
 * - Query param: weeks (default 6)
 * - Format: [{day: 0-6, hour: 0-23, avgPerformance, sessionCount}]
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Extract and validate query parameters
  const searchParams = request.nextUrl.searchParams
  const params = HeatmapQuerySchema.parse({
    userId: searchParams.get('userId') || '',
    weeks: searchParams.get('weeks') || undefined,
  })

  // Calculate date range
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - params.weeks * 7)
  startDate.setHours(0, 0, 0, 0)

  // Query study sessions within the date range
  const sessions = await prisma.studySession.findMany({
    where: {
      userId: params.userId,
      startedAt: {
        gte: startDate,
      },
      completedAt: {
        not: null,
      },
    },
    select: {
      id: true,
      startedAt: true,
      durationMs: true,
      objectiveCompletions: true,
    },
  })

  // Calculate performance scores from session data
  // For MVP: Use completion rate as a performance proxy (0-100 score)
  const performanceMap = new Map<string, number>()

  sessions.forEach((session) => {
    if (session.objectiveCompletions) {
      const completions = getObjectiveCompletions(session.objectiveCompletions)
      const totalObjectives = completions.length
      const completedObjectives = completions.filter((c) => c.completedAt).length

      // Calculate performance score (0-100)
      const completionRate = totalObjectives > 0 ? completedObjectives / totalObjectives : 0
      const performanceScore = Math.round(completionRate * 100)

      performanceMap.set(session.id, performanceScore)
    }
  })

  // Group sessions by day-of-week (0-6) and hour-of-day (0-23)
  const heatmapMap = new Map<string, { totalPerformance: number; count: number }>()

  sessions.forEach((session) => {
    const day = session.startedAt.getDay() // 0 = Sunday, 6 = Saturday
    const hour = session.startedAt.getHours() // 0-23

    const key = `${day}-${hour}`

    // Get performance score (default to 50 if not found)
    const performance = performanceMap.get(session.id) || 50

    if (!heatmapMap.has(key)) {
      heatmapMap.set(key, { totalPerformance: 0, count: 0 })
    }

    const entry = heatmapMap.get(key)!
    entry.totalPerformance += performance
    entry.count += 1
  })

  // Convert to heatmap data array
  const heatmapData = Array.from(heatmapMap.entries()).map(([key, data]) => {
    const [day, hour] = key.split('-').map(Number)
    return {
      day,
      hour,
      avgPerformance: Math.round((data.totalPerformance / data.count) * 10) / 10,
      sessionCount: data.count,
    }
  })

  // Identify optimal windows (top 3 time slots with highest performance and >=3 sessions)
  const optimalCandidates = heatmapData
    .filter((d) => d.sessionCount >= 3)
    .sort((a, b) => b.avgPerformance - a.avgPerformance)
    .slice(0, 5) // Top 5 candidates

  // Group adjacent hours into windows
  const optimalWindows: Array<{
    day: number
    startHour: number
    endHour: number
    score: number
  }> = []

  optimalCandidates.forEach((candidate) => {
    // Check if this can extend an existing window
    const existingWindow = optimalWindows.find(
      (w) =>
        w.day === candidate.day &&
        (w.endHour === candidate.hour - 1 || w.startHour === candidate.hour + 1),
    )

    if (existingWindow) {
      // Extend the window
      existingWindow.startHour = Math.min(existingWindow.startHour, candidate.hour)
      existingWindow.endHour = Math.max(existingWindow.endHour, candidate.hour)
      existingWindow.score = Math.max(existingWindow.score, candidate.avgPerformance)
    } else {
      // Create new window
      optimalWindows.push({
        day: candidate.day,
        startHour: candidate.hour,
        endHour: candidate.hour,
        score: candidate.avgPerformance,
      })
    }
  })

  // Sort optimal windows by score (descending)
  optimalWindows.sort((a, b) => b.score - a.score)

  return Response.json(
    successResponse({
      heatmapData,
      optimalWindows: optimalWindows.slice(0, 3), // Return top 3 windows
    }),
  )
})

import { endOfDay, format, startOfDay, subDays, subWeeks } from 'date-fns'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { createMockAnalyticsMetadata } from '@/lib/mock-data-metadata'

// Validation schema
const analyticsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all']).default('week'),
})

// GET /api/analytics/study-time - Get study time analytics
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const { period } = analyticsSchema.parse({
    period: searchParams.get('period'),
  })

  // Get user from header (MVP: no auth, user selected in sidebar)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const userId = user.id

  // Calculate date range based on period
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'today':
      startDate = startOfDay(now)
      break
    case 'week':
      startDate = subDays(now, 7)
      break
    case 'month':
      startDate = subDays(now, 30)
      break
    default:
      startDate = new Date(0) // Beginning of time
      break
  }

  // Get all completed sessions in period
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      completedAt: {
        not: null,
        gte: startDate,
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  })

  // Calculate daily study time (last 30 days)
  const dailyTime: { date: string; minutes: number; sessions: number }[] = []
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(now, 29 - i)
    return {
      date: format(date, 'yyyy-MM-dd'),
      dateObj: date,
    }
  })

  for (const day of last30Days) {
    const daySessions = sessions.filter((session) => {
      const sessionDate = format(session.startedAt, 'yyyy-MM-dd')
      return sessionDate === day.date
    })

    const totalMs = daySessions.reduce((acc, s) => acc + (s.durationMs || 0), 0)
    dailyTime.push({
      date: day.date,
      minutes: Math.round(totalMs / 60000),
      sessions: daySessions.length,
    })
  }

  // Calculate weekly study time (last 12 weeks)
  const weeklyTime: { week: string; minutes: number; sessions: number }[] = []
  const last12Weeks = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfDay(subWeeks(now, 11 - i))
    const weekEnd = endOfDay(subWeeks(now, 10 - i))
    return {
      week: `Week of ${format(weekStart, 'MMM d')}`,
      weekStart,
      weekEnd,
    }
  })

  for (const week of last12Weeks) {
    const weekSessions = sessions.filter((session) => {
      return session.startedAt >= week.weekStart && session.startedAt <= week.weekEnd
    })

    const totalMs = weekSessions.reduce((acc, s) => acc + (s.durationMs || 0), 0)
    weeklyTime.push({
      week: week.week,
      minutes: Math.round(totalMs / 60000),
      sessions: weekSessions.length,
    })
  }

  // Calculate average session length
  const completedSessions = sessions.filter((s) => s.durationMs)
  const avgSessionLength =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.durationMs || 0), 0) /
            completedSessions.length /
            60000,
        )
      : 0

  // Calculate study streak (consecutive days with at least one session)
  let streak = 0
  let currentDate = startOfDay(now)

  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const hasSessions = sessions.some((s) => {
      return format(s.startedAt, 'yyyy-MM-dd') === dateStr
    })

    if (hasSessions) {
      streak++
      currentDate = subDays(currentDate, 1)
    } else {
      break
    }
  }

  // Calculate time of day distribution
  const timeOfDay = {
    morning: 0, // 6am - 12pm
    afternoon: 0, // 12pm - 6pm
    evening: 0, // 6pm - 12am
    night: 0, // 12am - 6am
  }

  sessions.forEach((session) => {
    const hour = session.startedAt.getHours()
    if (hour >= 6 && hour < 12) {
      timeOfDay.morning += session.durationMs || 0
    } else if (hour >= 12 && hour < 18) {
      timeOfDay.afternoon += session.durationMs || 0
    } else if (hour >= 18 && hour < 24) {
      timeOfDay.evening += session.durationMs || 0
    } else {
      timeOfDay.night += session.durationMs || 0
    }
  })

  // Convert to minutes
  const timeOfDayMinutes = {
    morning: Math.round(timeOfDay.morning / 60000),
    afternoon: Math.round(timeOfDay.afternoon / 60000),
    evening: Math.round(timeOfDay.evening / 60000),
    night: Math.round(timeOfDay.night / 60000),
  }

  return Response.json(
    successResponse({
      dailyTime,
      weeklyTime,
      avgSessionLength,
      streak,
      timeOfDay: timeOfDayMinutes,
      totalSessions: sessions.length,
      totalStudyTime: Math.round(sessions.reduce((acc, s) => acc + (s.durationMs || 0), 0) / 60000),
      metadata: {
        period,
        mock: createMockAnalyticsMetadata({ endpoint: 'analytics/study-time' }),
      },
    }),
  )
})

/**
 * GET /api/analytics/behavioral-insights/goals/:id
 *
 * Returns full goal details with progress history and related study sessions
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 7
 */

import type { NextRequest } from 'next/server'
import { errorResponse, successResponse, withErrorHandler } from '@/lib/api-response'
import { prisma } from '@/lib/db'

interface ProgressCheckpoint {
  date: string
  value: number
  note?: string
}

/**
 * GET /api/analytics/behavioral-insights/goals/:id
 *
 * Returns:
 * - goal: BehavioralGoal (full details)
 * - progressHistory: Array<{ date, value, note }> (from JSON field)
 * - recentActivity: StudySession[] (sessions contributing to goal)
 * - projectedCompletion?: Date (trend-based ETA if goal is active)
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Fetch goal
    const goal = await prisma.behavioralGoal.findUnique({
      where: { id },
    })

    if (!goal) {
      return Response.json(errorResponse('Goal not found', 'NOT_FOUND'), { status: 404 })
    }

    // Parse progress history from JSON
    const progressHistory = (goal.progressHistory as unknown as ProgressCheckpoint[]) || []

    // Fetch recent study sessions (last 30 days)
    const recentActivity = await prisma.studySession.findMany({
      where: {
        userId: goal.userId,
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
      },
    })

    // Calculate projected completion date if goal is active
    let projectedCompletion: Date | undefined

    if (goal.status === 'ACTIVE' && progressHistory.length >= 2) {
      // Simple linear regression for trend-based projection
      const sortedHistory = [...progressHistory].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      // Calculate daily rate of progress
      const firstCheckpoint = sortedHistory[0]
      const lastCheckpoint = sortedHistory[sortedHistory.length - 1]

      const daysDiff =
        (new Date(lastCheckpoint.date).getTime() - new Date(firstCheckpoint.date).getTime()) /
        (24 * 60 * 60 * 1000)

      if (daysDiff > 0) {
        const valueDiff = lastCheckpoint.value - firstCheckpoint.value
        const dailyRate = valueDiff / daysDiff

        if (dailyRate > 0) {
          const remainingValue = goal.targetValue - goal.currentValue
          const daysToCompletion = Math.ceil(remainingValue / dailyRate)

          // Project completion date
          projectedCompletion = new Date()
          projectedCompletion.setDate(projectedCompletion.getDate() + daysToCompletion)

          // Cap at deadline
          if (projectedCompletion > goal.deadline) {
            projectedCompletion = goal.deadline
          }
        }
      }
    }

    return Response.json(
      successResponse({
        goal,
        progressHistory,
        recentActivity,
        projectedCompletion,
      }),
    )
  },
)

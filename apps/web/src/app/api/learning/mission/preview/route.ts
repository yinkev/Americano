/**
 * GET /api/learning/mission/preview
 * Preview tomorrow's mission WITHOUT saving to database
 * Story 2.4: Daily Mission Generation and Display (Task 3.4)
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { MissionGenerator } from '@/lib/mission-generator'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'

async function handler(request: NextRequest) {
  // Get user from header (MVP: hardcoded to kevy@americano.dev)
  const userEmail =
    request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(
      errorResponse('USER_NOT_FOUND', 'User not found'),
      { status: 404 }
    )
  }

  // Parse date from query params (defaults to tomorrow)
  const { searchParams } = new URL(request.url)
  const dateParam = searchParams.get('date')

  const targetDate = dateParam ? new Date(dateParam) : new Date()
  if (!dateParam) {
    // Default to tomorrow
    targetDate.setDate(targetDate.getDate() + 1)
  }
  targetDate.setHours(0, 0, 0, 0)

  // Generate preview WITHOUT saving
  const generator = new MissionGenerator()
  const previewMission = await generator.generateDailyMission(user.id, targetDate)

  // Calculate priority breakdown for transparency
  const priorityBreakdown = {
    highYield: previewMission.objectives.filter(
      (obj) => obj.objective?.isHighYield
    ).length,
    total: previewMission.objectives.length,
  }

  return Response.json(
    successResponse({
      preview: true,
      date: targetDate,
      objectives: previewMission.objectives,
      estimatedMinutes: previewMission.estimatedMinutes,
      priorityBreakdown,
    })
  )
}

export const GET = withErrorHandler(handler)

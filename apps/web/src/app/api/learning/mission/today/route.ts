/**
 * GET /api/learning/mission/today
 * Get today's mission (auto-generate if doesn't exist)
 * Story 2.4: Daily Mission Generation and Display (Task 3.2)
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { MissionGenerator } from '@/lib/mission-generator'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'
import type { MissionProgress } from '@/types/mission'
import { getMissionObjectives } from '@/types/mission-helpers'
import { Prisma } from '@/generated/prisma'

async function handler(request: NextRequest) {
  // Get user from header (MVP: hardcoded to kevy@americano.dev)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), { status: 404 })
  }

  // Get today's date (normalized to midnight)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check for existing mission today
  let mission = await prisma.mission.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })

  // Auto-generate if doesn't exist
  if (!mission) {
    const generator = new MissionGenerator()
    const generatedMission = await generator.generateDailyMission(user.id, today)

    mission = await prisma.mission.create({
      data: {
        userId: user.id,
        date: today,
        status: 'PENDING',
        estimatedMinutes: generatedMission.estimatedMinutes,
        objectives: generatedMission.objectives as unknown as Prisma.InputJsonValue,
        reviewCardCount: generatedMission.reviewCardCount,
        newContentCount: generatedMission.newContentCount,
        completedObjectivesCount: 0,
      },
    })
  }

  // Parse objectives from JSON
  const objectives = getMissionObjectives(mission)

  // Calculate progress
  const completedCount = objectives.filter((obj) => obj.completed).length
  const progress: MissionProgress = {
    total: objectives.length,
    completed: completedCount,
    percentage: objectives.length > 0 ? Math.round((completedCount / objectives.length) * 100) : 0,
    estimatedMinutesRemaining: objectives
      .filter((obj) => !obj.completed)
      .reduce((sum, obj) => sum + obj.estimatedMinutes, 0),
    actualMinutesSpent: mission.actualMinutes || 0,
  }

  return Response.json(
    successResponse({
      mission,
      objectives,
      progress,
    }),
  )
}

export const GET = withErrorHandler(handler)

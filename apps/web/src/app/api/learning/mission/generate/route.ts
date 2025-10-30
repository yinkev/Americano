/**
 * POST /api/learning/mission/generate
 * Generate a new mission for a specific date
 * Story 2.4: Daily Mission Generation and Display (Task 3.1)
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'
import { withErrorHandler } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { MissionGenerator } from '@/lib/mission-generator'
import { getMissionObjectives } from '@/types/mission-helpers'

const generateMissionSchema = z.object({
  date: z.string().datetime().optional(), // ISO 8601 date
  targetMinutes: z.number().int().min(15).max(120).optional(),
  regenerate: z.boolean().optional().default(false),
  prioritizeWeakAreas: z.boolean().optional().default(false),
})

async function handler(request: NextRequest) {
  // Parse request body
  const body = await request.json()
  const validation = generateMissionSchema.safeParse(body)

  if (!validation.success) {
    return Response.json(
      errorResponse('VALIDATION_ERROR', 'Invalid request body', validation.error.flatten()),
      { status: 400 },
    )
  }

  const { date, targetMinutes, regenerate, prioritizeWeakAreas } = validation.data

  // Get user from header (MVP: hardcoded to kevy@americano.dev)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), { status: 404 })
  }

  // Parse target date (default to today)
  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0) // Normalize to midnight

  // Check if mission already exists for this date
  const existingMission = await prisma.mission.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: targetDate,
        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  })

  if (existingMission && !regenerate) {
    // Return existing mission
    const objectives = getMissionObjectives(existingMission)

    return Response.json(
      successResponse({
        mission: existingMission,
        objectives,
        message: 'Mission already exists for this date',
      }),
    )
  }

  if (existingMission && regenerate) {
    // Delete old mission before creating new one
    await prisma.mission.delete({
      where: { id: existingMission.id },
    })
  }

  // Generate new mission
  const generator = new MissionGenerator()
  const constraints: any = { targetMinutes }
  if (prioritizeWeakAreas) {
    Object.assign(constraints, {
      includeHighYield: false,
      includeFSRSDue: false,
      includeWeakAreas: true,
    })
  }
  const generatedMission = await generator.generateDailyMission(user.id, targetDate, constraints)

  // Create mission record
  const mission = await prisma.mission.create({
    data: {
      userId: user.id,
      date: targetDate,
      status: 'PENDING',
      estimatedMinutes: generatedMission.estimatedMinutes,
      objectives: generatedMission.objectives as unknown as Prisma.InputJsonValue,
      reviewCardCount: generatedMission.reviewCardCount,
      newContentCount: generatedMission.newContentCount,
      completedObjectivesCount: 0,
    },
  })

  return Response.json(
    successResponse({
      mission,
      objectives: generatedMission.objectives,
      estimatedMinutes: generatedMission.estimatedMinutes,
    }),
  )
}

export const POST = withErrorHandler(handler)

/**
 * POST /api/learning/mission/[id]/regenerate
 * Regenerate mission with new objectives
 * Story 2.4: Daily Mission Generation and Display (Task 3.5)
 */

import type { NextRequest } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'
import { withErrorHandler } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { MissionGenerator } from '@/lib/mission-generator'

const regenerateSchema = z.object({
  targetMinutes: z.number().int().min(15).max(120).optional(),
})

async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  // Parse request body
  const body = await request.json()
  const validation = regenerateSchema.safeParse(body)

  if (!validation.success) {
    return Response.json(
      errorResponse('VALIDATION_ERROR', 'Invalid request body', validation.error.flatten()),
      { status: 400 },
    )
  }

  const { targetMinutes } = validation.data

  // Get existing mission
  const existingMission = await prisma.mission.findUnique({
    where: { id },
  })

  if (!existingMission) {
    return Response.json(errorResponse('MISSION_NOT_FOUND', 'Mission not found'), { status: 404 })
  }

  // Check regeneration limit (max 3 per day per mission date)
  // For MVP, we'll just delete and create new
  // TODO: Track regeneration count in future story

  // Delete old mission
  await prisma.mission.delete({
    where: { id },
  })

  // Generate new mission
  const generator = new MissionGenerator()
  const generatedMission = await generator.generateDailyMission(
    existingMission.userId,
    existingMission.date,
    {
      targetMinutes,
    },
  )

  // Create new mission record
  const mission = await prisma.mission.create({
    data: {
      userId: existingMission.userId,
      date: existingMission.date,
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
      message: 'Mission regenerated successfully',
    }),
  )
}

export const POST = withErrorHandler(handler)

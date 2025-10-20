/**
 * GET /api/learning/mission/[id]
 * Get specific mission by ID with objectives and study sessions
 * Story 2.4: Daily Mission Generation and Display (Task 3.3)
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'

async function handler(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  // Get mission with study sessions
  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      studySessions: {
        select: {
          id: true,
          startedAt: true,
          completedAt: true,
          durationMs: true,
          reviewsCompleted: true,
          sessionNotes: true,
        },
        orderBy: {
          startedAt: 'desc',
        },
      },
    },
  })

  if (!mission) {
    return Response.json(errorResponse('MISSION_NOT_FOUND', 'Mission not found'), { status: 404 })
  }

  // Parse objectives from JSON
  const objectives = mission.objectives as any[]

  return Response.json(
    successResponse({
      mission,
      objectives,
      studySessions: mission.studySessions,
    }),
  )
}

export const GET = withErrorHandler(handler)

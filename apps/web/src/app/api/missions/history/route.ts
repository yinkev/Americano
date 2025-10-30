import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ApiError, withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getMissionObjectives } from '@/types/mission-helpers'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

async function handleGET(request: NextRequest) {
  // Get user email from header (MVP: hardcoded, production: auth integration)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw ApiError.notFound('User')
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams
  const params = querySchema.parse({
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  })

  // Fetch missions with related data
  const missions = await prisma.mission.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      date: 'desc',
    },
    take: params.limit,
    skip: params.offset,
  })

  // Expand objectives from JSON to include objective details
  const missionsWithObjectives = await Promise.all(
    missions.map(async (mission) => {
      const objectives = getMissionObjectives(mission)

      // Fetch objective details
      const objectiveIds = objectives.map((obj) => obj.id)
      const objectiveDetails = await prisma.learningObjective.findMany({
        where: {
          id: { in: objectiveIds },
        },
        select: {
          id: true,
          objective: true,
          complexity: true,
          isHighYield: true,
        },
      })

      // Create a map for quick lookup
      const objectiveMap = new Map(objectiveDetails.map((obj) => [obj.id, obj]))

      // Merge objective details with mission objectives
      const enrichedObjectives = objectives.map((obj) => ({
        ...obj,
        objective: objectiveMap.get(obj.id),
      }))

      return {
        id: mission.id,
        date: mission.date.toISOString(),
        status: mission.status,
        estimatedMinutes: mission.estimatedMinutes,
        actualMinutes: mission.actualMinutes,
        completedObjectivesCount: mission.completedObjectivesCount,
        objectives: enrichedObjectives,
        successScore: mission.successScore,
        difficultyRating: mission.difficultyRating,
      }
    }),
  )

  // Get total count for pagination
  const totalCount = await prisma.mission.count({
    where: {
      userId: user.id,
    },
  })

  return Response.json(
    successResponse({
      missions: missionsWithObjectives,
      pagination: {
        total: totalCount,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < totalCount,
      },
    }),
  )
}

export const GET = withErrorHandler(handleGET)

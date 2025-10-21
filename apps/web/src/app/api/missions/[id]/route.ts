import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/api-response'
import { withErrorHandler, ApiError } from '@/lib/api-error'
import { getMissionObjectives } from '@/types/mission-helpers'

interface RouteContext {
  params: Promise<{ id: string }>
}

async function handleGET(request: NextRequest, context: RouteContext) {
  // Get user email from header
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw ApiError.notFound('User')
  }

  // Await params (Next.js 15 requirement)
  const params = await context.params
  const missionId = params.id

  // Fetch mission
  const mission = await prisma.mission.findFirst({
    where: {
      id: missionId,
      userId: user.id,
    },
  })

  if (!mission) {
    throw ApiError.notFound('Mission')
  }

  // Expand objectives from JSON to include objective details
  const objectives = getMissionObjectives(mission)
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
      masteryLevel: true,
    },
  })

  // Create a map for quick lookup
  const objectiveMap = new Map(objectiveDetails.map((obj: any) => [obj.id, obj]))

  // Merge objective details with mission objectives
  const enrichedObjectives = objectives.map((obj) => ({
    ...obj,
    objective: objectiveMap.get(obj.objectiveId),
  }))

  const missionData = {
    id: mission.id,
    date: mission.date.toISOString(),
    status: mission.status,
    estimatedMinutes: mission.estimatedMinutes,
    actualMinutes: mission.actualMinutes,
    completedAt: mission.completedAt?.toISOString(),
    completedObjectivesCount: mission.completedObjectivesCount,
    objectives: enrichedObjectives,
    successScore: mission.successScore,
    difficultyRating: mission.difficultyRating,
    reviewCardCount: mission.reviewCardCount,
    newContentCount: mission.newContentCount,
  }

  return Response.json(successResponse({ mission: missionData }))
}

export const GET = withErrorHandler(handleGET)

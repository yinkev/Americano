import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/api-response'
import { withErrorHandler, ApiError } from '@/lib/api-error'

// GET /api/missions/reflection-check - Check if user should see reflection prompt
async function handleGET(request: NextRequest) {
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw ApiError.notFound('User')
  }

  // Count completed missions
  const completedMissionsCount = await prisma.mission.count({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
  })

  // Check if user is at a milestone (every 10 missions)
  const isAtMilestone = completedMissionsCount > 0 && completedMissionsCount % 10 === 0

  if (!isAtMilestone) {
    return Response.json(
      successResponse({
        shouldPrompt: false,
        completedMissions: completedMissionsCount,
        nextMilestone: Math.ceil(completedMissionsCount / 10) * 10,
      }),
    )
  }

  // Check if user has already reflected at this milestone
  const currentMilestone = completedMissionsCount
  const lastReflection = await prisma.behavioralEvent.findFirst({
    where: {
      userId: user.id,
      eventType: 'MISSION_REFLECTION' as any,
    },
    orderBy: {
      timestamp: 'desc',
    },
  })

  const hasReflectedAtMilestone = lastReflection
    ? (lastReflection.eventData as any).milestone === currentMilestone
    : false

  return Response.json(
    successResponse({
      shouldPrompt: !hasReflectedAtMilestone,
      completedMissions: completedMissionsCount,
      milestone: currentMilestone,
      lastReflectionAt: lastReflection?.timestamp.toISOString(),
    }),
  )
}

export const GET = withErrorHandler(handleGET)

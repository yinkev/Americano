import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'

// Validation schema
const historyQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30)),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
})

async function handler(request: NextRequest) {
  // Get user from header
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found', 404), { status: 404 })
  }

  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const params = {
    limit: searchParams.get('limit'),
    status: searchParams.get('status'),
  }

  const validation = historyQuerySchema.safeParse(params)
  if (!validation.success) {
    return Response.json(errorResponse('VALIDATION_ERROR', validation.error.message, 400), {
      status: 400,
    })
  }

  const { limit, status } = validation.data

  // Fetch missions with optional status filter
  const missions = await prisma.mission.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { date: 'desc' },
    take: limit,
    include: {
      studySessions: {
        select: {
          id: true,
          durationMs: true,
        },
      },
    },
  })

  // Enrich with stats
  const enrichedMissions = missions.map((mission) => {
    const objectives = JSON.parse(mission.objectives as string) as Array<{
      completed: boolean
    }>
    const completedCount = objectives.filter((o) => o.completed).length
    const totalCount = objectives.length
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return {
      id: mission.id,
      date: mission.date,
      status: mission.status,
      estimatedMinutes: mission.estimatedMinutes,
      actualMinutes: mission.actualMinutes,
      objectiveCount: totalCount,
      completedObjectiveCount: completedCount,
      completionRate,
      studySessionCount: mission.studySessions.length,
      totalStudyMinutes: mission.studySessions.reduce(
        (sum: number, s) => sum + (s.durationMs ? Math.round(s.durationMs / 60000) : 0),
        0,
      ),
    }
  })

  return Response.json(
    successResponse({
      missions: enrichedMissions,
      total: enrichedMissions.length,
      filter: status || 'all',
    }),
  )
}

export const GET = withErrorHandler(handler)

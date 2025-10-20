import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'
import { z } from 'zod'

// Validation schemas
const startSessionSchema = z.object({
  missionId: z.string().optional(),
})

const listSessionsSchema = z.object({
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

// POST /api/learning/sessions - Start a new study session (Story 2.5 Task 2.1)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = startSessionSchema.parse(body)

  // Get user from header (MVP: no auth, user selected in sidebar)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // If missionId provided, load mission objectives (Story 2.5)
  let missionObjectives: any = null
  let currentObjective: any = null
  let missionProgress: any = null

  if (validatedData.missionId) {
    const mission = await prisma.mission.findUnique({
      where: { id: validatedData.missionId },
    })

    if (!mission) {
      throw new Error('Mission not found')
    }

    // mission.objectives is JSON array from Story 2.4
    missionObjectives = mission.objectives as any[]

    if (Array.isArray(missionObjectives) && missionObjectives.length > 0) {
      currentObjective = missionObjectives[0] // First objective
      missionProgress = {
        completed: 0,
        total: missionObjectives.length,
      }
    }
  }

  // Create new study session with mission context
  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      missionId: validatedData.missionId,
      startedAt: new Date(),
      currentObjectiveIndex: 0,
      missionObjectives: missionObjectives,
      objectiveCompletions: [],
    },
    include: {
      mission: true,
    },
  })

  return Response.json(
    successResponse({
      session,
      currentObjective,
      missionProgress,
      message: 'Study session started successfully',
    }),
  )
})

// GET /api/learning/sessions - List study sessions with filtering
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams

  const queryParams = {
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  }

  const validatedParams = listSessionsSchema.parse(queryParams)

  // Get user from header (MVP: no auth, user selected in sidebar)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Build where clause
  const where: any = {
    userId: user.id,
  }

  if (validatedParams.startDate || validatedParams.endDate) {
    where.startedAt = {}
    if (validatedParams.startDate) {
      where.startedAt.gte = new Date(validatedParams.startDate)
    }
    if (validatedParams.endDate) {
      where.startedAt.lte = new Date(validatedParams.endDate)
    }
  }

  // Get total count and sessions
  const [total, sessions] = await Promise.all([
    prisma.studySession.count({ where }),
    prisma.studySession.findMany({
      where,
      include: {
        mission: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            card: {
              select: {
                id: true,
                front: true,
                lecture: {
                  select: {
                    id: true,
                    title: true,
                    course: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: validatedParams.limit,
      skip: validatedParams.offset,
    }),
  ])

  // Calculate total study time
  const totalStudyTime = sessions.reduce((acc, session) => {
    return acc + (session.durationMs || 0)
  }, 0)

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc: any, session) => {
    const date = session.startedAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(session)
    return acc
  }, {})

  return Response.json(
    successResponse({
      sessions,
      total,
      totalStudyTime,
      sessionsByDate,
      pagination: {
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: validatedParams.offset + validatedParams.limit < total,
      },
    }),
  )
})

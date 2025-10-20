import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/api-response'
import { withErrorHandler, ApiError } from '@/lib/api-error'

const reflectionSchema = z.object({
  workingStrategies: z.string().min(1, 'Please share what strategies are working'),
  challengingObjectives: z.string().min(1, 'Please share what has been challenging'),
  confidenceChange: z.string().min(1, 'Please share how your confidence has changed'),
  additionalThoughts: z.string().optional(),
})

// GET /api/missions/reflections - Get user's reflections
async function handleGET(request: NextRequest) {
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw ApiError.notFound('User')
  }

  // Fetch all reflections (stored as journal-style behavioral events)
  const reflectionEvents = await prisma.behavioralEvent.findMany({
    where: {
      userId: user.id,
      eventType: 'MISSION_REFLECTION' as any, // We'll add this enum value
    },
    orderBy: {
      timestamp: 'desc',
    },
  })

  const reflections = reflectionEvents.map((event: any) => ({
    id: event.id,
    timestamp: event.timestamp.toISOString(),
    data: event.eventData,
  }))

  return Response.json(successResponse({ reflections }))
}

// POST /api/missions/reflections - Save a new reflection
async function handlePOST(request: NextRequest) {
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    throw ApiError.notFound('User')
  }

  // Parse and validate request body
  const body = await request.json()
  const reflection = reflectionSchema.parse(body)

  // Get mission count for context
  const completedMissionsCount = await prisma.mission.count({
    where: {
      userId: user.id,
      status: 'COMPLETED',
    },
  })

  // Calculate milestone
  const milestone = Math.floor(completedMissionsCount / 10) * 10

  // Store reflection as a behavioral event
  const event = await prisma.behavioralEvent.create({
    data: {
      userId: user.id,
      eventType: 'MISSION_REFLECTION' as any,
      eventData: {
        milestone,
        completedMissions: completedMissionsCount,
        reflection: {
          workingStrategies: reflection.workingStrategies,
          challengingObjectives: reflection.challengingObjectives,
          confidenceChange: reflection.confidenceChange,
          additionalThoughts: reflection.additionalThoughts,
        },
      },
    },
  })

  return Response.json(
    successResponse({
      reflectionId: event.id,
      message: 'Reflection saved successfully',
    }),
  )
}

export const GET = withErrorHandler(handleGET)
export const POST = withErrorHandler(handlePOST)

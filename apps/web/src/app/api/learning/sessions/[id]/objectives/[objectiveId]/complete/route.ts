import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'
import { z } from 'zod'

const completeObjectiveSchema = z.object({
  selfAssessment: z.number().min(1).max(5),
  confidenceRating: z.number().min(1).max(5),
  notes: z.string().optional(),
  timeSpentMs: z.number().min(0),
})

// POST /api/learning/sessions/:id/objectives/:objectiveId/complete (Story 2.5 Task 6.2)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectiveId: string }> },
) {
  return withErrorHandler(async () => {
    const resolvedParams = await params
    const body = await request.json()
    const validatedData = completeObjectiveSchema.parse(body)

    // Get user from header (MVP: no auth)
    const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      throw new Error(`User not found: ${userEmail}`)
    }

    // Load session
    const session = await prisma.studySession.findUnique({
      where: { id: resolvedParams.id },
      include: { mission: true },
    })

    if (!session) {
      throw new Error(`Session not found: ${resolvedParams.id}`)
    }

    if (session.userId !== user.id) {
      throw new Error(
        `Unauthorized: User ${user.id} does not own session ${resolvedParams.id} (owned by ${session.userId})`,
      )
    }

    // Get current mission objectives snapshot
    const missionObjectives = (session.missionObjectives || []) as any[]
    const objectiveCompletions = (session.objectiveCompletions || []) as any[]

    // Add completion record
    objectiveCompletions.push({
      objectiveId: resolvedParams.objectiveId,
      completedAt: new Date().toISOString(),
      timeSpentMs: validatedData.timeSpentMs,
      selfAssessment: validatedData.selfAssessment,
      confidenceRating: validatedData.confidenceRating,
      notes: validatedData.notes,
    })

    // Increment objective index
    const newIndex = session.currentObjectiveIndex + 1
    const nextObjective = newIndex < missionObjectives.length ? missionObjectives[newIndex] : null

    // Update session
    const updatedSession = await prisma.studySession.update({
      where: { id: resolvedParams.id },
      data: {
        currentObjectiveIndex: newIndex,
        objectiveCompletions: objectiveCompletions,
      },
    })

    // Update mission objective completion status if mission exists
    if (session.missionId && session.mission) {
      const missionObjectivesData = (session.mission.objectives || []) as any[]
      const updatedMissionObjectives = missionObjectivesData.map((obj: any) => {
        if (obj.objectiveId === resolvedParams.objectiveId) {
          return {
            ...obj,
            completed: true,
            completedAt: new Date().toISOString(),
          }
        }
        return obj
      })

      await prisma.mission.update({
        where: { id: session.missionId },
        data: {
          objectives: updatedMissionObjectives,
          completedObjectivesCount: updatedMissionObjectives.filter((o: any) => o.completed).length,
        },
      })
    }

    // Calculate mission progress
    const missionProgress = {
      completed: objectiveCompletions.length,
      total: missionObjectives.length,
    }

    return Response.json(
      successResponse({
        nextObjective,
        missionProgress,
        sessionProgress: {
          completedObjectives: objectiveCompletions.length,
          totalObjectives: missionObjectives.length,
        },
      }),
    )
  })()
}

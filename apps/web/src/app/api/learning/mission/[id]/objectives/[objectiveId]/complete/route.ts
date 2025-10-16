import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler } from '@/lib/api-error'

// Validation schema
const completeObjectiveSchema = z.object({
  notes: z.string().optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
    objectiveId: string
  }>
}

async function handler(request: NextRequest, { params }: RouteParams) {
  const { id: missionId, objectiveId } = await params

  // Parse request body
  const body = await request.json()
  const validation = completeObjectiveSchema.safeParse(body)
  if (!validation.success) {
    return Response.json(errorResponse('VALIDATION_ERROR', validation.error.message, 400), { status: 400 })
  }

  const { notes } = validation.data

  // Fetch mission
  const mission = await prisma.mission.findUnique({
    where: { id: missionId }
  })

  if (!mission) {
    return Response.json(errorResponse('MISSION_NOT_FOUND', 'Mission not found', 404), { status: 404 })
  }

  // Parse objectives
  const objectives = JSON.parse(mission.objectives as string) as Array<{
    objectiveId: string
    estimatedMinutes: number
    completed: boolean
    completedAt?: string
    notes?: string
  }>

  // Find and update objective
  const objectiveIndex = objectives.findIndex(obj => obj.objectiveId === objectiveId)
  if (objectiveIndex === -1) {
    return Response.json(errorResponse('OBJECTIVE_NOT_FOUND', 'Objective not found in mission', 404), { status: 404 })
  }

  // Mark objective as completed
  objectives[objectiveIndex] = {
    ...objectives[objectiveIndex],
    completed: true,
    completedAt: new Date().toISOString(),
    notes: notes || objectives[objectiveIndex].notes
  }

  // Calculate completed count
  const completedCount = objectives.filter(obj => obj.completed).length
  const allCompleted = completedCount === objectives.length

  // Update mission
  const updatedMission = await prisma.mission.update({
    where: { id: missionId },
    data: {
      objectives: JSON.stringify(objectives),
      completedObjectivesCount: completedCount,
      status: allCompleted ? 'COMPLETED' : mission.status === 'PENDING' ? 'IN_PROGRESS' : mission.status
    }
  })

  // Find next uncompleted objective
  const nextObjective = objectives.find(obj => !obj.completed)

  // Calculate progress
  const progress = {
    completed: completedCount,
    total: objectives.length,
    percentage: (completedCount / objectives.length) * 100,
    allComplete: allCompleted
  }

  return Response.json(successResponse({
    objective: objectives[objectiveIndex],
    mission: updatedMission,
    progress,
    nextObjective: nextObjective ? {
      objectiveId: nextObjective.objectiveId,
      estimatedMinutes: nextObjective.estimatedMinutes
    } : null
  }))
}

export const PATCH = withErrorHandler(handler)

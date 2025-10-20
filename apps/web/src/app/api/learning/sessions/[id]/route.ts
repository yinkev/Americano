import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler, ApiError } from '@/lib/api-error'

// GET /api/learning/sessions/:id - Get a specific session
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const session = await prisma.studySession.findUnique({
      where: { id },
      include: {
        mission: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
        reviews: {
          include: {
            card: {
              select: {
                id: true,
                front: true,
                back: true,
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
    })

    if (!session) {
      throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found')
    }

    // Parse mission objectives and fetch learning objective details
    let enrichedMission = null
    if (session.mission) {
      const missionObjectives = session.mission.objectives as any[]
      const objectiveIds = missionObjectives.map((obj: any) => obj.objectiveId)

      // Fetch learning objectives
      const learningObjectives = await prisma.learningObjective.findMany({
        where: {
          id: {
            in: objectiveIds,
          },
        },
        select: {
          id: true,
          objective: true,
          complexity: true,
        },
      })

      // Create a map for quick lookup
      const objectiveMap = new Map(learningObjectives.map((obj) => [obj.id, obj]))

      // Enrich mission objectives with learning objective details
      const enrichedObjectives = missionObjectives.map((missionObj: any) => ({
        ...missionObj,
        objective: objectiveMap.get(missionObj.objectiveId) || null,
      }))

      enrichedMission = {
        ...session.mission,
        objectives: enrichedObjectives,
      }
    }

    // Return session with enriched mission data
    const responseData = {
      ...session,
      mission: enrichedMission,
    }

    return Response.json(successResponse({ session: responseData }))
  },
)

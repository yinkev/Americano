import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'
import { withErrorHandler, ApiError } from '@/lib/api-error'
import { getMissionObjectives } from '@/types/mission-helpers'

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
      const missionObjectives = getMissionObjectives(session.mission)
      const objectiveIds = missionObjectives.map((obj) => obj.id)

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
      const enrichedObjectives = missionObjectives.map((missionObj) => ({
        ...missionObj,
        objective: objectiveMap.get(missionObj.id) || null,
      }))

      enrichedMission = {
        ...session.mission,
        objectives: enrichedObjectives,
      }
    }

    // Story 4.1 Task 6.7: Fetch comprehension validation responses for this session
    const comprehensionResponses = await prisma.validationResponse.findMany({
      where: {
        sessionId: id,
        prompt: {
          promptType: 'EXPLAIN_TO_PATIENT',
        },
      },
      select: {
        id: true,
        score: true,
        confidenceLevel: true,
        calibrationDelta: true,
        skipped: true,
        respondedAt: true,
        prompt: {
          select: {
            objectiveId: true,
            conceptName: true,
          },
        },
        detailedFeedback: true,
      },
      orderBy: {
        respondedAt: 'asc',
      },
    });

    // Calculate comprehension metrics for session summary
    const comprehensionMetrics = {
      totalAttempts: comprehensionResponses.length,
      averageScore: comprehensionResponses.length > 0
        ? comprehensionResponses
            .filter(r => !r.skipped && r.score !== null)
            .reduce((sum, r) => sum + (r.score || 0), 0) /
          comprehensionResponses.filter(r => !r.skipped && r.score !== null).length
        : null,
      skippedCount: comprehensionResponses.filter(r => r.skipped).length,
      responses: comprehensionResponses.map(r => ({
        objectiveId: r.prompt.objectiveId,
        conceptName: r.prompt.conceptName,
        score: r.score,
        confidenceLevel: r.confidenceLevel,
        calibrationDelta: r.calibrationDelta,
        skipped: r.skipped,
        respondedAt: r.respondedAt,
      })),
    };

    // Story 4.4 Task 10.6-10.8: Calculate calibration metrics for session summary
    const calibrationResponses = await prisma.validationResponse.findMany({
      where: {
        sessionId: id,
        preAssessmentConfidence: { not: null },
        score: { not: null },
      },
      select: {
        preAssessmentConfidence: true,
        postAssessmentConfidence: true,
        calibrationDelta: true,
        calibrationCategory: true,
        reflectionNotes: true,
        score: true,
      },
    });

    const calibrationMetrics = {
      totalValidations: calibrationResponses.length,
      avgConfidenceVsPerformanceGap: 0,
      categoryDistribution: {
        overconfident: 0,
        underconfident: 0,
        calibrated: 0,
      },
      reflectionCompletionRate: 0,
      calibrationTimeMinutes: 0,
    };

    if (calibrationResponses.length > 0) {
      // Average calibration delta (absolute value for gap measurement)
      const totalDelta = calibrationResponses.reduce(
        (sum, r) => sum + Math.abs(r.calibrationDelta || 0),
        0
      );
      calibrationMetrics.avgConfidenceVsPerformanceGap =
        Math.round(totalDelta / calibrationResponses.length);

      // Category distribution
      calibrationResponses.forEach((r) => {
        if (r.calibrationCategory === 'OVERCONFIDENT') {
          calibrationMetrics.categoryDistribution.overconfident += 1;
        } else if (r.calibrationCategory === 'UNDERCONFIDENT') {
          calibrationMetrics.categoryDistribution.underconfident += 1;
        } else if (r.calibrationCategory === 'CALIBRATED') {
          calibrationMetrics.categoryDistribution.calibrated += 1;
        }
      });

      // Reflection completion rate
      const reflectionCount = calibrationResponses.filter(r => r.reflectionNotes).length;
      calibrationMetrics.reflectionCompletionRate =
        Math.round((reflectionCount / calibrationResponses.length) * 100);
    }

    // Return session with enriched mission data and metrics
    const responseData = {
      ...session,
      mission: enrichedMission,
      comprehensionMetrics, // Story 4.1 Task 6.7
      calibrationMetrics, // Story 4.4 Task 10.6
    };

    return Response.json(successResponse({ session: responseData }))
  },
)

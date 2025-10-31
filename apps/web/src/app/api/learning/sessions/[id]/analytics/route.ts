import type { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getMissionObjectives, getObjectiveCompletions } from '@/types/mission-helpers'
import type { MissionObjective, ObjectiveCompletion } from '@/types/prisma-json'

/**
 * GET /api/learning/sessions/:id/analytics
 * Phase A analytics endpoint to power session summary (8.1) and charts (8.2).
 *
 * Returns:
 * - objectives: [{ index, objectiveId, objective, complexity, timeSpentMinutes, estimatedMinutes, selfAssessment, confidenceRating, deltaMinutes }]
 * - cards: { reviewed, accuracy }
 * - timeBreakdown: { totalActualMinutes, totalEstimatedMinutes, deltaMinutes, deltaPercent }
 * - insights: string[]
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    // Load session with related mission + reviews
    const session = await prisma.studySession.findUnique({
      where: { id },
      include: {
        mission: true,
        reviews: {
          include: {
            card: {
              include: {
                lecture: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!session) {
      throw new Error(`Session not found: ${id}`)
    }

    // Objective completions snapshot (Story 2.5) lives as JSON on session
    const objectiveCompletions = getObjectiveCompletions(session.objectiveCompletions)

    // Mission objectives snapshot (estimatedMinutes)
    const missionObjectives = session.mission ? getMissionObjectives(session.mission) : []

    // Build objectives dataset for charts/table
    const objectives = objectiveCompletions.map((completion, index) => {
      const missionObj = missionObjectives.find((o) => o.id === completion.objectiveId)
      const timeSpentMinutes = Math.round((completion.timeSpentMs ?? 0) / 60000)
      const estimatedMinutes = missionObj?.estimatedMinutes ?? 0

      return {
        index: index + 1,
        objectiveId: completion.objectiveId,
        objective: missionObj?.objective?.objective || `Objective ${index + 1}`,
        complexity: missionObj?.objective?.complexity || null,
        timeSpentMinutes,
        estimatedMinutes,
        selfAssessment: completion.selfAssessment ?? null,
        confidenceRating: completion.confidenceRating ?? null,
        deltaMinutes: timeSpentMinutes - estimatedMinutes,
      }
    })

    // Cards analytics (basic): count reviews and derive accuracy if rating available
    // Treat GOOD/EASY as correct; AGAIN/HARD as incorrect if present
    const reviews = session.reviews ?? []
    const reviewed = reviews.length
    let correct = 0
    let incorrect = 0
    for (const r of reviews) {
      const rating = (r.rating || '').toUpperCase()
      if (rating === 'GOOD' || rating === 'EASY') correct += 1
      else if (rating === 'AGAIN' || rating === 'HARD') incorrect += 1
    }
    const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0

    // Time breakdown
    const totalActualMinutes = Math.round(
      objectiveCompletions.reduce((sum, c) => sum + (c.timeSpentMs ?? 0), 0) / 60000,
    )
    const totalEstimatedMinutes = missionObjectives.reduce(
      (sum, o) => sum + (o.estimatedMinutes ?? 0),
      0,
    )
    const deltaMinutes = totalActualMinutes - totalEstimatedMinutes
    const deltaPercent =
      totalEstimatedMinutes > 0 ? Math.round((deltaMinutes / totalEstimatedMinutes) * 100) : 0

    // Simple insights (human-friendly)
    const insights: string[] = []
    const avgSelf =
      objectives.length > 0
        ? (
            objectives.reduce((sum, o) => sum + (o.selfAssessment ?? 0), 0) / objectives.length
          ).toFixed(1)
        : '0.0'
    const avgConf =
      objectives.length > 0
        ? (
            objectives.reduce((sum, o) => sum + (o.confidenceRating ?? 0), 0) / objectives.length
          ).toFixed(1)
        : '0.0'

    insights.push(`Average self-assessment: ${avgSelf}/5`)
    insights.push(`Average confidence: ${avgConf}/5`)
    if (totalEstimatedMinutes > 0) {
      insights.push(
        deltaPercent === 0
          ? 'Time management matched estimate.'
          : deltaPercent > 0
            ? `Time management slower than estimate by ${deltaPercent}%.`
            : `Time management faster than estimate by ${Math.abs(deltaPercent)}%.`,
      )
    }
    if (accuracy > 0 || reviewed > 0) {
      insights.push(`Flashcard accuracy: ${accuracy}% across ${reviewed} reviews.`)
    }

    // Story 4.4 Task 10.6-10.8: Calibration metrics for session summary
    const validationResponses = await prisma.validationResponse.findMany({
      where: {
        sessionId: id,
        preAssessmentConfidence: { not: null },
        // `score` is non-nullable in the Prisma schema (Float),
        // so no need to add a not-null filter here.
      },
      select: {
        preAssessmentConfidence: true,
        // NOTE: postAssessmentConfidence field doesn't exist in Prisma schema
        // postAssessmentConfidence: true,
        calibrationDelta: true,
        calibrationCategory: true,
        score: true,
        respondedAt: true,
      },
      orderBy: {
        respondedAt: 'asc',
      },
    })

    // Calculate calibration metrics
    const calibrationMetrics = {
      totalValidations: validationResponses.length,
      avgConfidenceVsPerformanceGap: 0,
      categoryDistribution: {
        overconfident: 0,
        underconfident: 0,
        calibrated: 0,
      },
      reflectionCompletionRate: 0,
      calibrationTimeMinutes: 0, // To be calculated if timing data available
    }

    if (validationResponses.length > 0) {
      // Average calibration delta (confidence - performance gap)
      const totalDelta = validationResponses.reduce(
        (sum, r) => sum + Math.abs(r.calibrationDelta ?? 0),
        0,
      )
      calibrationMetrics.avgConfidenceVsPerformanceGap = Math.round(
        totalDelta / validationResponses.length,
      )

      // Category distribution
      validationResponses.forEach((r) => {
        if (r.calibrationCategory === 'OVERCONFIDENT') {
          calibrationMetrics.categoryDistribution.overconfident += 1
        } else if (r.calibrationCategory === 'UNDERCONFIDENT') {
          calibrationMetrics.categoryDistribution.underconfident += 1
        } else if (r.calibrationCategory === 'CALIBRATED') {
          calibrationMetrics.categoryDistribution.calibrated += 1
        }
      })

      // Reflection completion rate (responses with reflectionNotes)
      const validationResponsesWithReflection = await prisma.validationResponse.count({
        where: {
          sessionId: id,
          reflectionNotes: { not: null },
        },
      })
      calibrationMetrics.reflectionCompletionRate =
        validationResponses.length > 0
          ? Math.round((validationResponsesWithReflection / validationResponses.length) * 100)
          : 0

      // Add calibration insights
      if (calibrationMetrics.avgConfidenceVsPerformanceGap > 15) {
        insights.push(
          `Calibration: Average confidence-performance gap is ${calibrationMetrics.avgConfidenceVsPerformanceGap}% - consider reviewing self-assessment accuracy.`,
        )
      } else {
        insights.push(
          `Calibration: Well-calibrated with ${calibrationMetrics.avgConfidenceVsPerformanceGap}% average gap.`,
        )
      }

      if (calibrationMetrics.categoryDistribution.overconfident > validationResponses.length / 2) {
        insights.push(
          'Calibration: Pattern of overconfidence detected - review areas where confidence exceeded performance.',
        )
      } else if (
        calibrationMetrics.categoryDistribution.underconfident >
        validationResponses.length / 2
      ) {
        insights.push(
          'Calibration: Pattern of underconfidence detected - trust your understanding more!',
        )
      }
    }

    return Response.json(
      successResponse({
        objectives,
        cards: { reviewed, accuracy },
        timeBreakdown: {
          totalActualMinutes,
          totalEstimatedMinutes,
          deltaMinutes,
          deltaPercent,
        },
        insights,
        calibrationMetrics, // Story 4.4 Task 10.6
      }),
    )
  },
)

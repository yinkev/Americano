/**
 * GET /api/performance/mastery-summary
 * Story 2.2 Task 3.3
 *
 * Returns aggregate mastery level counts across all objectives
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { MasteryLevel } from '@/generated/prisma'

export async function GET(request: NextRequest) {
  try {
    // Hardcoded user for MVP
    const userId = 'kevy@americano.dev'

    // Fetch all objectives for user
    const objectives = await prisma.learningObjective.findMany({
      where: {
        lecture: {
          userId,
        },
      },
      select: {
        masteryLevel: true,
      },
    })

    // Count by mastery level
    const counts = {
      notStarted: 0,
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      mastered: 0,
    }

    objectives.forEach((obj) => {
      switch (obj.masteryLevel) {
        case MasteryLevel.NOT_STARTED:
          counts.notStarted++
          break
        case MasteryLevel.BEGINNER:
          counts.beginner++
          break
        case MasteryLevel.INTERMEDIATE:
          counts.intermediate++
          break
        case MasteryLevel.ADVANCED:
          counts.advanced++
          break
        case MasteryLevel.MASTERED:
          counts.mastered++
          break
      }
    })

    const totalObjectives = objectives.length

    // Calculate percentages
    const percentages = {
      [MasteryLevel.NOT_STARTED]:
        totalObjectives > 0 ? (counts.notStarted / totalObjectives) * 100 : 0,
      [MasteryLevel.BEGINNER]: totalObjectives > 0 ? (counts.beginner / totalObjectives) * 100 : 0,
      [MasteryLevel.INTERMEDIATE]:
        totalObjectives > 0 ? (counts.intermediate / totalObjectives) * 100 : 0,
      [MasteryLevel.ADVANCED]: totalObjectives > 0 ? (counts.advanced / totalObjectives) * 100 : 0,
      [MasteryLevel.MASTERED]: totalObjectives > 0 ? (counts.mastered / totalObjectives) * 100 : 0,
    }

    return Response.json(
      successResponse({
        ...counts,
        totalObjectives,
        percentages,
      }),
    )
  } catch (error) {
    console.error('Error fetching mastery summary:', error)
    return Response.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch mastery summary'),
      { status: 500 },
    )
  }
}

/**
 * POST /api/adaptive/follow-up-questions
 *
 * Generate follow-up questions based on performance.
 * Story 4.5 Task 5 - API Endpoints
 *
 * Features:
 * - Low score (< 60%): Generates prerequisite question
 * - High score (> 85%): Generates advanced application question
 * - Uses ObjectivePrerequisite join table for concept relationships
 * - Returns follow-up prompt with appropriate difficulty
 * - Max 2 follow-ups per original question (enforced externally)
 * - Performance target: < 1s
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { ApiError } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { validateRequest, followUpQuestionsSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const data = await validateRequest(request, followUpQuestionsSchema)
    const userId = await getUserId()

    // Get original response details
    const originalResponse = await prisma.validationResponse.findUnique({
      where: { id: data.responseId },
      include: {
        prompt: {
          include: {
            learningObjective: true,
          },
        },
      },
    })

    if (!originalResponse) {
      throw ApiError.notFound('Original response not found')
    }

    // Determine follow-up type based on score
    let followUpType: 'PREREQUISITE' | 'LATERAL' | 'ADVANCED'
    let targetObjectiveId: string | null = null
    let targetDifficulty: number

    if (data.score < 60) {
      // Low score - identify prerequisite
      followUpType = 'PREREQUISITE'
      targetDifficulty = Math.max(0, data.currentDifficulty - 20)

      // Query prerequisite objectives
      const prerequisites = await prisma.objectivePrerequisite.findMany({
        where: {
          objectiveId: data.objectiveId,
        },
        include: {
          prerequisite: true,
        },
        orderBy: {
          strength: 'desc',
        },
        take: 1,
      })

      if (prerequisites.length > 0) {
        targetObjectiveId = prerequisites[0].prerequisiteId
      }
    } else if (data.score > 85) {
      // High score - find advanced concept
      followUpType = 'ADVANCED'
      targetDifficulty = Math.min(100, data.currentDifficulty + 20)

      // Find related advanced objectives from same course
      const currentObjective = await prisma.learningObjective.findUnique({
        where: { id: data.objectiveId },
        include: {
          lecture: true,
        },
      })

      if (currentObjective) {
        const advancedObjectives = await prisma.learningObjective.findMany({
          where: {
            lecture: {
              courseId: currentObjective.lecture.courseId,
            },
            complexity: 'ADVANCED',
            id: {
              not: data.objectiveId,
            },
          },
          take: 1,
        })

        if (advancedObjectives.length > 0) {
          targetObjectiveId = advancedObjectives[0].id
        }
      }
    } else {
      // Mid-range score - no follow-up needed
      return NextResponse.json(
        successResponse({
          hasFollowUp: false,
          reason: 'Score in target range (60-85%) - no follow-up needed',
        })
      )
    }

    // If no related objective found, use same objective with adjusted difficulty
    if (!targetObjectiveId) {
      targetObjectiveId = data.objectiveId
    }

    // Find appropriate follow-up prompt
    const followUpPrompt = await prisma.validationPrompt.findFirst({
      where: {
        objectiveId: targetObjectiveId,
        difficultyLevel: {
          gte: targetDifficulty - 10,
          lte: targetDifficulty + 10,
        },
      },
      orderBy: {
        timesUsed: 'asc',
      },
    })

    if (!followUpPrompt) {
      // No follow-up available
      return NextResponse.json(
        successResponse({
          hasFollowUp: false,
          reason: `No ${followUpType.toLowerCase()} questions available at target difficulty`,
        })
      )
    }

    // Update prompt usage
    await prisma.validationPrompt.update({
      where: { id: followUpPrompt.id },
      data: {
        timesUsed: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })

    // Get target objective details
    const targetObjective = await prisma.learningObjective.findUnique({
      where: { id: targetObjectiveId },
      select: {
        objective: true,
        complexity: true,
      },
    })

    return NextResponse.json(
      successResponse({
        hasFollowUp: true,
        followUpType,
        followUpPrompt: {
          id: followUpPrompt.id,
          promptText: followUpPrompt.promptText,
          promptType: followUpPrompt.promptType,
          conceptName: followUpPrompt.conceptName,
          expectedCriteria: followUpPrompt.expectedCriteria,
          difficultyLevel: followUpPrompt.difficultyLevel,
        },
        targetObjective: targetObjective
          ? {
              objective: targetObjective.objective,
              complexity: targetObjective.complexity,
            }
          : null,
        parentPromptId: originalResponse.promptId,
        reasoning:
          followUpType === 'PREREQUISITE'
            ? `Your score (${data.score}%) suggests reviewing prerequisite concepts to strengthen foundation`
            : `Excellent score (${data.score}%)! Ready for advanced application of this concept`,
      })
    )
  } catch (error) {
    console.error('[API] POST /api/adaptive/follow-up-questions error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(ApiError.internal('Failed to generate follow-up questions')),
      { status: 500 }
    )
  }
}

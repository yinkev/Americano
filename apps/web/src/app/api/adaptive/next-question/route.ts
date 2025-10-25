/**
 * POST /api/adaptive/next-question
 *
 * Get next adaptive question with difficulty adjustment.
 * Story 4.5 Task 5 - API Endpoints
 *
 * Features:
 * - Calculates initial difficulty or adjusts based on previous response
 * - Selects question from database matching target difficulty (±10 points)
 * - Enforces 2-week cooldown on question reuse
 * - Returns IRT early stopping signal if confidence interval < 10 points
 * - Performance target: < 1s per question
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { ApiError } from '@/lib/api-error'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { validateRequest, nextQuestionSchema, type NextQuestionInput } from '@/lib/validation'
import { AdaptiveDifficultyEngine } from '@/lib/adaptive/adaptive-engine'
import { IrtEngine } from '@/lib/adaptive/irt-engine'
import { subDays } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const data = await validateRequest<NextQuestionInput>(request, nextQuestionSchema)
    const userId = await getUserId()

    // Initialize engines
    const difficultyEngine = new AdaptiveDifficultyEngine()
    const irtEngine = new IrtEngine()

    // Get or create adaptive session
    let adaptiveSession = await prisma.adaptiveSession.findFirst({
      where: {
        userId,
        sessionId: data.sessionId || null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    let currentDifficulty: number
    let adjustment: number = 0
    let adjustmentReason: string = ''

    if (!adaptiveSession) {
      // First question - calculate initial difficulty
      const initialDifficulty = await difficultyEngine.calculateInitialDifficulty(
        userId,
        data.objectiveId
      )

      currentDifficulty = initialDifficulty.difficulty
      adjustmentReason = initialDifficulty.rationale

      // Create new adaptive session
      adaptiveSession = await prisma.adaptiveSession.create({
        data: {
          userId,
          sessionId: data.sessionId,
          initialDifficulty: currentDifficulty,
          currentDifficulty,
          questionCount: 0,
          trajectory: [],
        },
      })
    } else {
      // Subsequent question - adjust difficulty based on last response
      if (data.lastScore !== undefined) {
        const difficultyAdjustment = difficultyEngine.adjustDifficulty(
          adaptiveSession.currentDifficulty,
          data.lastScore,
          data.lastConfidence,
          adaptiveSession.questionCount
        )

        currentDifficulty = difficultyAdjustment.newDifficulty
        adjustment = difficultyAdjustment.adjustment
        adjustmentReason = difficultyAdjustment.reason

        // Update session
        const trajectory = (adaptiveSession.trajectory as any[]) || []
        trajectory.push({
          responseId: data.lastResponseId,
          oldDifficulty: adaptiveSession.currentDifficulty,
          newDifficulty: currentDifficulty,
          adjustment,
          reason: adjustmentReason,
          score: data.lastScore,
        })

        await prisma.adaptiveSession.update({
          where: { id: adaptiveSession.id },
          data: {
            currentDifficulty,
            trajectory,
          },
        })
      } else {
        currentDifficulty = adaptiveSession.currentDifficulty
      }
    }

    // Get difficulty range for question selection
    const difficultyRange = difficultyEngine.getDifficultyRange(currentDifficulty)

    // Get answered questions to enforce cooldown (2 weeks)
    const twoWeeksAgo = subDays(new Date(), 14)
    const answeredPromptIds = await prisma.validationResponse.findMany({
      where: {
        userId,
        respondedAt: {
          gte: twoWeeksAgo,
        },
      },
      select: {
        promptId: true,
      },
    })

    const excludePromptIds: string[] = answeredPromptIds.map((r) => r.promptId)

    // Select question from database
    const prompt = await prisma.validationPrompt.findFirst({
      where: {
        id: { notIn: excludePromptIds },
        objectiveId: data.objectiveId,
        difficultyLevel: {
          gte: difficultyRange.min,
          lte: difficultyRange.max,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!prompt) {
      throw ApiError.notFound(
        'No unused questions available at target difficulty. Please try a different objective or wait for cooldown period.'
      )
    }

    // Update question usage
    // Note: ValidationPrompt has no usage counters in current schema; skipping usage update.

    // Calculate IRT early stopping criteria
    const recentResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        sessionId: data.sessionId,
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: 10,
      include: { prompt: true },
    })

    let canStopEarly = false
    let efficiencyMetrics = null
    let irtEstimate = null

    if (recentResponses.length >= 3) {
      const irtResponses = recentResponses.map((r: any) => ({
        difficulty: r.prompt?.difficultyLevel ?? currentDifficulty,
        correct: r.score > 0.6,
        timeSpent: 0,
      }))

      irtEstimate = irtEngine.estimateKnowledgeLevel(irtResponses)
      canStopEarly = irtEstimate.shouldStopEarly
      efficiencyMetrics = irtEngine.calculateEfficiencyMetrics(recentResponses.length)
    }

    // Update session question count and IRT estimate
    await prisma.adaptiveSession.update({
      where: { id: adaptiveSession.id },
      data: {
        questionCount: { increment: 1 },
        irtEstimate: irtEstimate?.theta,
        confidenceInterval: irtEstimate?.confidenceInterval,
      },
    })

    return NextResponse.json(
      successResponse({
        adaptiveSessionId: adaptiveSession.id,
        prompt: {
          id: prompt.id,
          promptText: prompt.promptText,
          promptType: prompt.promptType,
          conceptName: prompt.conceptName,
          expectedCriteria: prompt.expectedCriteria,
          difficultyLevel: prompt.difficultyLevel,
        },
        difficulty: currentDifficulty,
        difficultyAdjustment: {
          adjustment,
          reason: adjustmentReason,
        },
        isFollowUp: false,
        canStopEarly,
        efficiencyMetrics,
        irtEstimate: irtEstimate
          ? {
              theta: irtEstimate.theta,
              confidenceInterval: irtEstimate.confidenceInterval,
              iterations: irtEstimate.iterations,
            }
          : null,
      })
    )
  } catch (error) {
    console.error('[API] POST /api/adaptive/next-question error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(
        errorResponse(error.code, error.message, (error as any).details),
        { status: error.statusCode },
      )
    }

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get next question'),
      { status: 500 },
    )
  }
}

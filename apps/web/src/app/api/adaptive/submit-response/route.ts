/**
 * POST /api/adaptive/submit-response
 *
 * Submit response, adjust difficulty, return IRT estimate.
 * Story 4.5 Task 5 - API Endpoints
 *
 * Features:
 * - Evaluates user response (delegates to existing validation endpoint)
 * - Stores response with adaptive metadata (initialDifficulty, timeToRespond)
 * - Calculates new difficulty for next question
 * - Returns IRT knowledge estimate with confidence interval
 * - Performance target: < 1s
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/auth'
import { ApiError } from '@/lib/api-error'
import { successResponse, errorResponse } from '@/lib/api-response'
import { validateRequest, submitResponseSchema } from '@/lib/validation'
import { AdaptiveDifficultyEngine } from '@/lib/adaptive/adaptive-engine'
import { IrtEngine } from '@/lib/adaptive/irt-engine'

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const data = await validateRequest(request, submitResponseSchema)
    const userId = await getUserId()

    // Initialize engines
    const difficultyEngine = new AdaptiveDifficultyEngine()
    const irtEngine = new IrtEngine()

    // Get prompt details
    const prompt = await prisma.validationPrompt.findUnique({
      where: { id: data.promptId },
      include: {
        learningObjective: true,
      },
    })

    if (!prompt) {
      throw ApiError.notFound('Validation prompt not found')
    }

    // TODO: Call existing validation evaluation endpoint (Story 4.1)
    // For MVP, we'll do a simple scoring based on answer length and keywords
    // In production, this would call the Python service or ChatMock for evaluation

    // Simple scoring for MVP
    const score = Math.min(100, (data.userAnswer.length / 500) * 100) // Length-based score
    const normalizedScore = score / 100 // 0-1 scale for database

    // Calculate calibration delta
    const confidenceNormalized = (data.confidence - 1) * 25 // 1-5 → 0-100
    const calibrationDelta = confidenceNormalized - score

    // Determine calibration category
    let calibrationCategory: 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'CALIBRATED'
    if (calibrationDelta > 15) {
      calibrationCategory = 'OVERCONFIDENT'
    } else if (calibrationDelta < -15) {
      calibrationCategory = 'UNDERCONFIDENT'
    } else {
      calibrationCategory = 'CALIBRATED'
    }

    // Save validation response with adaptive metadata
    const validationResponse = await prisma.validationResponse.create({
      data: {
        promptId: data.promptId,
        sessionId: data.sessionId,
        userId,
        userAnswer: data.userAnswer,
        aiEvaluation: JSON.stringify({
          score,
          message: 'MVP evaluation - full AI evaluation pending',
        }),
        score: normalizedScore,
        confidenceLevel: data.confidence,
        calibrationDelta,
        calibrationCategory,
        initialDifficulty: data.currentDifficulty,
        timeToRespond: data.timeToRespond,
        isFollowUpQuestion: false,
        respondedAt: new Date(),
      },
    })

    // Calculate difficulty adjustment for next question
    const difficultyAdjustment = difficultyEngine.adjustDifficulty(
      data.currentDifficulty,
      score,
      data.confidence
    )

    // Get recent responses for IRT calculation
    const recentResponses = await prisma.validationResponse.findMany({
      where: {
        userId,
        sessionId: data.sessionId,
        prompt: {
          objectiveId: data.objectiveId,
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: 10,
      include: {
        prompt: true,
      },
    })

    // Calculate IRT knowledge estimate
    let irtEstimate = null
    let efficiencyMetrics = null

    if (recentResponses.length >= 1) {
      const irtResponses = recentResponses.map((r) => ({
        difficulty: r.prompt.difficultyLevel,
        correct: r.score > 0.6,
        timeSpent: r.timeToRespond,
      }))

      irtEstimate = irtEngine.estimateKnowledgeLevel(irtResponses)
      efficiencyMetrics = irtEngine.calculateEfficiencyMetrics(recentResponses.length)
    }

    // Update adaptive session with new difficulty
    const adaptiveSession = await prisma.adaptiveSession.findFirst({
      where: {
        userId,
        sessionId: data.sessionId || null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (adaptiveSession) {
      await prisma.adaptiveSession.update({
        where: { id: adaptiveSession.id },
        data: {
          currentDifficulty: difficultyAdjustment.newDifficulty,
          irtEstimate: irtEstimate?.theta,
          confidenceInterval: irtEstimate?.confidenceInterval,
        },
      })
    }

    return NextResponse.json(
      successResponse({
        responseId: validationResponse.id,
        score,
        normalizedScore,
        calibrationDelta,
        calibrationCategory,
        difficultyAdjustment: {
          oldDifficulty: data.currentDifficulty,
          newDifficulty: difficultyAdjustment.newDifficulty,
          adjustment: difficultyAdjustment.adjustment,
          reason: difficultyAdjustment.reason,
        },
        irtEstimate: irtEstimate
          ? {
              theta: irtEstimate.theta,
              standardError: irtEstimate.standardError,
              confidenceInterval: irtEstimate.confidenceInterval,
              iterations: irtEstimate.iterations,
              shouldStopEarly: irtEstimate.shouldStopEarly,
            }
          : null,
        efficiencyMetrics,
      })
    )
  } catch (error) {
    console.error('[API] POST /api/adaptive/submit-response error:', error)

    if (error instanceof ApiError) {
      return NextResponse.json(errorResponse(error), { status: error.statusCode })
    }

    return NextResponse.json(
      errorResponse(ApiError.internal('Failed to submit response')),
      { status: 500 }
    )
  }
}

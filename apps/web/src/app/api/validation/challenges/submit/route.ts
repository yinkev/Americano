import { addDays } from 'date-fns'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { submitChallengeSchema, validateRequest } from '@/lib/validation'

/**
 * POST /api/validation/challenges/submit
 *
 * Submit a challenge response, generate corrective feedback, and schedule retries.
 *
 * **Architecture**: Proxies to Python FastAPI service for feedback generation
 * Python service uses CorrectiveFeedbackEngine
 *
 * **Workflow**:
 * 1. Validate request body (challengeId, userAnswer, confidence, emotionTag?, personalNotes?)
 * 2. Fetch challenge prompt from database
 * 3. Call Python service to generate corrective feedback
 * 4. Calculate retry schedule using spaced repetition intervals [+1, +3, +7, +14, +30 days]
 * 5. Save ControlledFailure record to database
 * 6. Return feedback and retry schedule
 *
 * **Request**:
 * {
 *   challengeId: string,
 *   userAnswer: string,
 *   confidence: 1-5,
 *   emotionTag?: 'SURPRISE' | 'CONFUSION' | 'FRUSTRATION' | 'AHA_MOMENT',
 *   personalNotes?: string
 * }
 *
 * **Response**:
 * {
 *   isCorrect: boolean,
 *   feedback: {
 *     misconceptionExplained: string,
 *     correctConcept: string,
 *     clinicalContext: string,
 *     memoryAnchor: string
 *   },
 *   retrySchedule: Date[],
 *   celebration?: string (if retry mastered)
 * }
 *
 * @see Story 4.3 Task 11 (API Endpoints)
 * @see Story 4.3 AC#3 (Immediate Corrective Feedback)
 * @see Story 4.3 AC#5 (Spaced Re-Testing)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    // Validate request body
    const body = await validateRequest(request, submitChallengeSchema)
    const { challengeId, userAnswer, confidence, emotionTag, personalNotes } = body

    // Fetch challenge prompt
    const prompt = await prisma.validationPrompt.findUnique({
      where: { id: challengeId },
      include: {
      },
    })

    if (!prompt) {
      return NextResponse.json(errorResponse('PROMPT_NOT_FOUND', 'Challenge prompt not found'), {
        status: 404,
      })
    }

    if (prompt.promptType !== 'CONTROLLED_FAILURE') {
      return NextResponse.json(
        errorResponse('INVALID_PROMPT_TYPE', 'Prompt is not a controlled failure challenge'),
        { status: 400 },
      )
    }

    // Call Python service to generate corrective feedback
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

    const feedbackResponse = await fetch(
      `${pythonServiceUrl}/validation/generate-corrective-feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          user_answer: userAnswer,
          expected_criteria: prompt.expectedCriteria,
          concept_name: prompt.conceptName,
          confidence_level: confidence,
        }),
      },
    )

    if (!feedbackResponse.ok) {
      const errorText = await feedbackResponse.text()
      console.error('Python service error (corrective feedback):', errorText)
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to generate corrective feedback from Python service',
        ),
        { status: 500 },
      )
    }

    const feedbackData = await feedbackResponse.json()

    // feedbackData: {
    //   is_correct: boolean,
    //   score: number (0-100),
    //   misconception_explained: string,
    //   correct_concept: string,
    //   clinical_context: string,
    //   memory_anchor: string,
    //   calibration_delta: number
    // }

    const isCorrect = feedbackData.is_correct
    const score = feedbackData.score

    // Calculate retry schedule if incorrect
    let retrySchedule: Date[] = []
    let celebration: string | undefined

    if (!isCorrect) {
      // Spaced repetition intervals: [+1, +3, +7, +14, +30 days]
      const today = new Date()
      retrySchedule = [
        addDays(today, 1),
        addDays(today, 3),
        addDays(today, 7),
        addDays(today, 14),
        addDays(today, 30),
      ]
    } else {
      // Check if this is a retry that was just mastered
      const promptData = prompt.promptData as any
      if (promptData?.isRetry) {
        celebration = "You've conquered this challenge! Your understanding has grown stronger."
      }
    }

    // Check for existing failure record (if retry)
    const promptData = prompt.promptData as any
    const isRetry = promptData?.isRetry || false
    const attemptNumber = isRetry ? promptData?.attemptNumber || 1 : 1

    // Save ControlledFailure record
    const controlledFailure = await prisma.$executeRaw`
      INSERT INTO "controlled_failures" (
        id,
        "userId",
        "objectiveId",
        "promptId",
        "userAnswer",
        confidence,
        "isCorrect",
        score,
        feedback,
        "emotionTag",
        "personalNotes",
        "attemptNumber",
        "retestSchedule",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${userId},
        ${prompt.objectiveId},
        ${challengeId},
        ${userAnswer},
        ${confidence},
        ${isCorrect},
        ${score},
        ${JSON.stringify({
          misconceptionExplained: feedbackData.misconception_explained,
          correctConcept: feedbackData.correct_concept,
          clinicalContext: feedbackData.clinical_context,
          memoryAnchor: feedbackData.memory_anchor,
        })},
        ${emotionTag || null},
        ${personalNotes || null},
        ${attemptNumber},
        ${JSON.stringify(retrySchedule.map((d) => d.toISOString()))},
        NOW(),
        NOW()
      )
    `

    // Also save to ValidationResponse for tracking
    await prisma.validationResponse.create({
      data: {
        promptId: challengeId,
        userId,
        userAnswer,
        aiEvaluation: JSON.stringify({
          misconceptionExplained: feedbackData.misconception_explained,
          correctConcept: feedbackData.correct_concept,
          clinicalContext: feedbackData.clinical_context,
          memoryAnchor: feedbackData.memory_anchor,
        }),
        score: score / 100, // Convert to 0-1 scale for ValidationResponse
        confidenceLevel: confidence,
        calibrationDelta: feedbackData.calibration_delta,
        detailedFeedback: {
          subscores: {
            // For controlled failure, we don't have subscores, use overall score
            terminology: score,
            relationships: score,
            application: score,
            clarity: score,
          },
          strengths: isCorrect ? ['Successfully identified key concepts'] : [],
          gaps: isCorrect ? [] : ['Needs further review'],
          calibrationNote: feedbackData.calibration_note || '',
        },
        skipped: false,
      },
    })

    return NextResponse.json(
      successResponse({
        isCorrect,
        feedback: {
          misconceptionExplained: feedbackData.misconception_explained,
          correctConcept: feedbackData.correct_concept,
          clinicalContext: feedbackData.clinical_context,
          memoryAnchor: feedbackData.memory_anchor,
        },
        retrySchedule,
        celebration,
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request data', error.issues),
        { status: 400 },
      )
    }

    console.error('Error submitting challenge response:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to submit challenge response',
      ),
      { status: 500 },
    )
  }
}

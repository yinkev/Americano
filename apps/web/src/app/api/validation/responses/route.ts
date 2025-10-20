import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getUserId } from '@/lib/auth';
import { calculateCalibration, normalizeConfidence } from '@/lib/confidence-calibrator';
import { CalibrationCategory } from '@prisma/client';

// Zod validation schema for request body
const evaluateResponseSchema = z.object({
  promptId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  userAnswer: z.string().min(10, 'Answer must be at least 10 characters'),
  confidenceLevel: z.number().int().min(1).max(5),
  objectiveId: z.string().cuid(),
  // Story 4.4: Pre/Post assessment confidence tracking
  preAssessmentConfidence: z.number().int().min(1).max(5),
  postAssessmentConfidence: z.number().int().min(1).max(5).optional(),
  confidenceRationale: z.string().optional(),
  reflectionNotes: z.string().optional(),
});

/**
 * POST /api/validation/responses
 *
 * Submits a user's comprehension explanation for AI evaluation and saves results.
 *
 * **Architecture**: Proxies to Python FastAPI service at http://localhost:8000/validation/evaluate
 * Python service uses instructor library with ChatMock/GPT-5 for structured evaluation.
 *
 * **Workflow**:
 * 1. Validate request (promptId, userAnswer, confidenceLevel required)
 * 2. Fetch prompt from database
 * 3. Call Python service for AI evaluation (multi-dimensional scoring)
 * 4. Calculate calibration metrics (confidence vs. actual score)
 * 5. Save ValidationResponse to database
 * 6. Update ComprehensionMetric (daily rollup)
 * 7. Return evaluation results to client
 *
 * @see Story 4.1 Task 3 (AI Evaluation Engine)
 * @see Story 4.1 AC#3 (AI Evaluation), AC#4 (Comprehension Scoring), AC#8 (Confidence Calibration)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = evaluateResponseSchema.parse(body);
    const {
      promptId,
      sessionId,
      userAnswer,
      confidenceLevel,
      objectiveId,
      preAssessmentConfidence,
      postAssessmentConfidence,
      confidenceRationale,
      reflectionNotes,
    } = validatedData;

    // Get user ID (hardcoded for MVP per CLAUDE.md)
    const userId = await getUserId();

    // Fetch prompt from database
    const prompt = await prisma.validationPrompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json(
        errorResponse('PROMPT_NOT_FOUND', 'Prompt not found'),
        { status: 404 }
      );
    }

    // Call Python FastAPI service for AI evaluation
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    const pythonResponse = await fetch(`${pythonServiceUrl}/validation/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt_id: promptId,
        prompt_text: prompt.promptText,
        expected_criteria: prompt.expectedCriteria,
        user_answer: userAnswer,
        confidence_level: confidenceLevel,
      }),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python service error:', errorText);
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to evaluate response from Python service'
        ),
        { status: 500 }
      );
    }

    const evaluation = await pythonResponse.json();

    // Story 4.4: Calculate calibration using ConfidenceCalibrator
    const calibration = calculateCalibration(preAssessmentConfidence, evaluation.overall_score);

    // Calculate confidence shift if post-assessment confidence provided
    const confidenceShift = postAssessmentConfidence
      ? postAssessmentConfidence - preAssessmentConfidence
      : null;

    // Save ValidationResponse to database with Story 4.4 calibration fields
    const savedResponse = await prisma.validationResponse.create({
      data: {
        promptId,
        sessionId: sessionId || null,
        userId,
        userAnswer,
        aiEvaluation: JSON.stringify(evaluation), // Legacy string field
        score: evaluation.overall_score / 100, // Store as 0-1 for consistency
        confidence: confidenceLevel / 5, // Legacy 0-1 field
        confidenceLevel, // New 1-5 field
        calibrationDelta: calibration.calibrationDelta,
        // Story 4.4: Pre/Post assessment confidence tracking
        preAssessmentConfidence,
        postAssessmentConfidence: postAssessmentConfidence || null,
        confidenceShift,
        confidenceRationale: confidenceRationale || null,
        reflectionNotes: reflectionNotes || null,
        calibrationCategory: calibration.category,
        detailedFeedback: {
          subscores: {
            terminology: evaluation.terminology_score,
            relationships: evaluation.relationships_score,
            application: evaluation.application_score,
            clarity: evaluation.clarity_score,
          },
          strengths: evaluation.strengths,
          gaps: evaluation.gaps,
          calibrationNote: calibration.feedbackMessage,
        },
      },
    });

    // Update ComprehensionMetric (daily rollup)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Fetch all responses for this objective today
    const todayResponses = await prisma.validationResponse.findMany({
      where: {
        prompt: {
          objectiveId,
        },
        respondedAt: {
          gte: today,
        },
      },
    });

    // Calculate average score for today
    const avgScore =
      todayResponses.reduce((sum, r) => sum + r.score, 0) / todayResponses.length;

    // Determine trend (compare to yesterday's average)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayMetric = await prisma.comprehensionMetric.findFirst({
      where: {
        objectiveId,
        userId,
        date: yesterday,
      },
    });

    let trend: string = 'STABLE';
    if (yesterdayMetric) {
      const scoreDiff = avgScore - yesterdayMetric.avgScore;
      if (scoreDiff > 0.1) trend = 'IMPROVING';
      else if (scoreDiff < -0.1) trend = 'WORSENING';
    }

    // Upsert ComprehensionMetric for today
    await prisma.comprehensionMetric.upsert({
      where: {
        conceptName_date_userId: {
          conceptName: prompt.conceptName,
          date: today,
          userId,
        },
      },
      update: {
        avgScore,
        sampleSize: todayResponses.length,
        trend,
      },
      create: {
        conceptName: prompt.conceptName,
        objectiveId,
        userId,
        date: today,
        avgScore,
        sampleSize: todayResponses.length,
        trend,
      },
    });

    // Return evaluation results with Story 4.4 calibration data
    return NextResponse.json(
      successResponse({
        evaluation: {
          overall_score: evaluation.overall_score,
          terminology_score: evaluation.terminology_score,
          relationships_score: evaluation.relationships_score,
          application_score: evaluation.application_score,
          clarity_score: evaluation.clarity_score,
          strengths: evaluation.strengths,
          gaps: evaluation.gaps,
        },
        calibration: {
          preAssessmentConfidence,
          postAssessmentConfidence: postAssessmentConfidence || null,
          confidenceShift,
          confidenceNormalized: calibration.confidenceNormalized,
          calibrationDelta: calibration.calibrationDelta,
          category: calibration.category,
          feedbackMessage: calibration.feedbackMessage,
        },
        score: evaluation.overall_score,
        responseId: savedResponse.id,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request data', error.issues),
        { status: 400 }
      );
    }

    console.error('Error evaluating response:', error);
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to evaluate response'
      ),
      { status: 500 }
    );
  }
}

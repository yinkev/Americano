import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// Zod validation schema for request body
const SubmitRequestSchema = z.object({
  scenarioId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  userChoices: z.record(z.string(), z.any()),
  userReasoning: z.string().min(10),
  timeSpent: z.number().int().positive(),
});

/**
 * POST /api/validation/scenarios/submit
 *
 * Submits a user's clinical scenario response for evaluation.
 *
 * **Architecture**: Proxies to Python FastAPI service at http://localhost:8000/validation/scenarios/evaluate
 * Python service uses instructor library with ChatMock/GPT-5 for structured evaluation.
 *
 * **Workflow**:
 * 1. Validate request (scenarioId, userChoices, userReasoning, timeSpent required)
 * 2. Fetch scenario from database
 * 3. Call Python service for competency-based evaluation
 * 4. Save response with competency scores to ScenarioResponse table
 * 5. Update ClinicalReasoningMetric (daily rollup)
 * 6. Return evaluation results to client
 *
 * @see Story 4.2 Task 2 (Clinical Reasoning Evaluation)
 * @see Story 4.2 AC#2 (Competency scoring)
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    // Validate request body
    const validatedData = SubmitRequestSchema.parse(body);
    const { scenarioId, sessionId, userChoices, userReasoning, timeSpent } = validatedData;

    // Fetch scenario from database
    const scenario = await prisma.clinicalScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      return NextResponse.json(
        errorResponse('SCENARIO_NOT_FOUND', 'Clinical scenario not found'),
        { status: 404 }
      );
    }

    // Call Python FastAPI service for evaluation
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

    const pythonResponse = await fetch(`${pythonServiceUrl}/validation/scenarios/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenario_id: scenarioId,
        scenario_type: scenario.scenarioType,
        case_text: scenario.caseText,
        user_choices: userChoices,
        user_reasoning: userReasoning,
        time_spent: timeSpent,
      }),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python service error:', errorText);
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to evaluate scenario from Python service'
        ),
        { status: 500 }
      );
    }

    const evaluation = await pythonResponse.json();

    // Save response to database
    const response = await prisma.scenarioResponse.create({
      data: {
        scenarioId,
        userId,
        sessionId,
        userChoices: userChoices as Prisma.InputJsonValue,
        userReasoning,
        score: evaluation.overall_score,
        competencyScores: evaluation.competency_scores as Prisma.InputJsonValue,
        timeSpent,
      },
    });

    // Update ClinicalReasoningMetric (daily rollup)
    await prisma.clinicalReasoningMetric.create({
      data: {
        userId,
        scenarioType: scenario.scenarioType,
        competencyScores: evaluation.competency_scores as Prisma.InputJsonValue,
        boardExamTopic: scenario.boardExamTopic,
      },
    });

    return NextResponse.json(
      successResponse({
        evaluation: {
          overallScore: evaluation.overall_score,
          competencyScores: evaluation.competency_scores,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          missedFindings: evaluation.missed_findings,
          cognitiveBiases: evaluation.cognitive_biases,
          optimalPathway: evaluation.optimal_pathway,
          teachingPoints: evaluation.teaching_points,
        },
        responseId: response.id,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request data', error.issues),
        { status: 400 }
      );
    }

    console.error('[/api/validation/scenarios/submit] Error:', error);
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to submit scenario'
      ),
      { status: 500 }
    );
  }
}

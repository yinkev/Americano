import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { validateQuery, getNextChallengeQuerySchema } from '@/lib/validation';

/**
 * GET /api/validation/challenges/next
 *
 * Get the next challenge for the current user based on vulnerability detection and retry schedule.
 *
 * **Architecture**: Proxies to Python FastAPI service for challenge generation
 * Python service uses ChallengeIdentifier and ChallengeQuestionGenerator
 *
 * **Workflow**:
 * 1. Get current user ID
 * 2. Check for pending retries in ControlledFailure table (retestSchedule contains today)
 * 3. If retry exists, return that challenge with retry metadata
 * 4. If no retry, call Python service to identify vulnerable concepts
 * 5. Python service generates new challenge question (near-miss distractors)
 * 6. Save challenge as ValidationPrompt with promptType='CONTROLLED_FAILURE'
 * 7. Return challenge with vulnerability type
 *
 * **Response**:
 * {
 *   challenge: ValidationPrompt,
 *   vulnerabilityType: 'overconfidence' | 'misconception' | 'recent_mistakes',
 *   retryInfo?: { attemptNumber: number, previousScore: number, originalFailureDate: Date }
 * }
 *
 * @see Story 4.3 Task 11 (API Endpoints)
 * @see Story 4.3 AC#1 (Intentional Challenge Generation)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const { sessionId } = validateQuery(searchParams, getNextChallengeQuerySchema);

    // Step 1: Check for pending retries (retestSchedule contains today's date)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Note: Since retestSchedule is stored as JSON array of date strings,
    // we need to fetch all failures and check in-memory
    // This is acceptable for MVP; for production, consider a dedicated retry tracking table
    const pendingRetries = await prisma.$queryRaw<Array<{
      id: string;
      objectiveId: string;
      attemptNumber: number;
      score: number | null;
      createdAt: Date;
      retestSchedule: string; // JSON string
    }>>`
      SELECT id, "objectiveId", "attemptNumber", score, "createdAt", "retestSchedule"
      FROM "controlled_failures"
      WHERE "userId" = ${userId}
        AND "isCorrect" = false
        AND "retestSchedule" IS NOT NULL
    `;

    // Filter retries that have today in their schedule
    const todayISO = today.toISOString().split('T')[0];
    const dueRetry = pendingRetries.find(retry => {
      try {
        const schedule = JSON.parse(retry.retestSchedule) as string[];
        return schedule.some(date => date.startsWith(todayISO));
      } catch {
        return false;
      }
    });

    if (dueRetry) {
      // Return retry challenge
      const objective = await prisma.learningObjective.findUnique({
        where: { id: dueRetry.objectiveId },
        include: {
          lecture: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!objective) {
        return NextResponse.json(
          errorResponse('OBJECTIVE_NOT_FOUND', 'Objective for retry not found'),
          { status: 404 }
        );
      }

      // Call Python service to generate retry challenge (varied format to prevent memorization)
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

      const pythonResponse = await fetch(`${pythonServiceUrl}/validation/generate-challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objective_id: objective.id,
          objective_text: objective.objective,
          lecture_title: objective.lecture.title,
          course_name: objective.lecture.course.name,
          vulnerability_type: 'retry',
          is_retry: true,
          attempt_number: dueRetry.attemptNumber + 1,
        }),
      });

      if (!pythonResponse.ok) {
        const errorText = await pythonResponse.text();
        console.error('Python service error (retry challenge):', errorText);
        return NextResponse.json(
          errorResponse(
            'PYTHON_SERVICE_ERROR',
            'Failed to generate retry challenge from Python service'
          ),
          { status: 500 }
        );
      }

      const pythonData = await pythonResponse.json();

      // Save challenge prompt
      const savedPrompt = await prisma.validationPrompt.create({
        data: {
          promptText: pythonData.prompt_text,
          promptType: 'CONTROLLED_FAILURE',
          conceptName: pythonData.concept_name,
          expectedCriteria: pythonData.expected_criteria,
          objectiveId: objective.id,
          promptData: {
            vulnerabilityType: 'retry',
            isRetry: true,
            originalFailureId: dueRetry.id,
            attemptNumber: dueRetry.attemptNumber + 1,
            variation: pythonData.variation || 'retry',
          },
        },
      });

      return NextResponse.json(
        successResponse({
          challenge: {
            id: savedPrompt.id,
            promptText: savedPrompt.promptText,
            promptType: savedPrompt.promptType,
            conceptName: savedPrompt.conceptName,
            expectedCriteria: savedPrompt.expectedCriteria,
            objectiveId: savedPrompt.objectiveId,
            createdAt: savedPrompt.createdAt,
          },
          vulnerabilityType: 'retry',
          retryInfo: {
            attemptNumber: dueRetry.attemptNumber + 1,
            previousScore: dueRetry.score || 0,
            originalFailureDate: dueRetry.createdAt,
          },
        })
      );
    }

    // Step 2: No retry due, generate new challenge based on vulnerability
    // Call Python service to identify vulnerable concepts
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    const vulnerabilityResponse = await fetch(
      `${pythonServiceUrl}/validation/identify-vulnerable-concepts?user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!vulnerabilityResponse.ok) {
      const errorText = await vulnerabilityResponse.text();
      console.error('Python service error (vulnerability identification):', errorText);
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to identify vulnerable concepts from Python service'
        ),
        { status: 500 }
      );
    }

    const vulnerabilityData = await vulnerabilityResponse.json();

    // vulnerabilityData.concepts: Array<{ conceptId, vulnerabilityScore, vulnerabilityType }>
    if (!vulnerabilityData.concepts || vulnerabilityData.concepts.length === 0) {
      return NextResponse.json(
        errorResponse('NO_VULNERABLE_CONCEPTS', 'No vulnerable concepts found for challenge generation'),
        { status: 404 }
      );
    }

    // Pick the top vulnerable concept
    const topVulnerableConcept = vulnerabilityData.concepts[0];

    // Fetch objective details
    const objective = await prisma.learningObjective.findUnique({
      where: { id: topVulnerableConcept.concept_id },
      include: {
        lecture: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!objective) {
      return NextResponse.json(
        errorResponse('OBJECTIVE_NOT_FOUND', 'Vulnerable objective not found'),
        { status: 404 }
      );
    }

    // Call Python service to generate challenge
    const challengeResponse = await fetch(`${pythonServiceUrl}/validation/generate-challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objective_id: objective.id,
        objective_text: objective.objective,
        lecture_title: objective.lecture.title,
        course_name: objective.lecture.course.name,
        vulnerability_type: topVulnerableConcept.vulnerability_type,
        is_retry: false,
      }),
    });

    if (!challengeResponse.ok) {
      const errorText = await challengeResponse.text();
      console.error('Python service error (challenge generation):', errorText);
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to generate challenge from Python service'
        ),
        { status: 500 }
      );
    }

    const challengeData = await challengeResponse.json();

    // Save challenge prompt
    const savedPrompt = await prisma.validationPrompt.create({
      data: {
        promptText: challengeData.prompt_text,
        promptType: 'CONTROLLED_FAILURE',
        conceptName: challengeData.concept_name,
        expectedCriteria: challengeData.expected_criteria,
        objectiveId: objective.id,
        promptData: {
          vulnerabilityType: topVulnerableConcept.vulnerability_type,
          vulnerabilityScore: topVulnerableConcept.vulnerability_score,
          variation: challengeData.variation || 'standard',
          isRetry: false,
        },
      },
    });

    return NextResponse.json(
      successResponse({
        challenge: {
          id: savedPrompt.id,
          promptText: savedPrompt.promptText,
          promptType: savedPrompt.promptType,
          conceptName: savedPrompt.conceptName,
          expectedCriteria: savedPrompt.expectedCriteria,
          objectiveId: savedPrompt.objectiveId,
          createdAt: savedPrompt.createdAt,
        },
        vulnerabilityType: topVulnerableConcept.vulnerability_type,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid query parameters', error.issues),
        { status: 400 }
      );
    }

    console.error('Error generating next challenge:', error);
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to generate next challenge'
      ),
      { status: 500 }
    );
  }
}

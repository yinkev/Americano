import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

// Zod validation schema for request body
const generatePromptSchema = z.object({
  objectiveId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
});

/**
 * POST /api/validation/prompts/generate
 *
 * Generates a "Explain to a patient" comprehension prompt for a learning objective.
 *
 * **Architecture**: Proxies to Python FastAPI service at http://localhost:8000/validation/generate-prompt
 * Python service uses instructor library with ChatMock/GPT-5 for structured prompt generation.
 *
 * **Workflow**:
 * 1. Validate request (objectiveId required)
 * 2. Fetch objective from database
 * 3. Check for recent cached prompt (last 7 days)
 * 4. If no cache, call Python service to generate new prompt
 * 5. Save generated prompt to ValidationPrompt table
 * 6. Return prompt to client
 *
 * @see Story 4.1 Task 2 (Prompt Generation Engine)
 * @see Story 4.1 AC#1 (Prompt Generation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = generatePromptSchema.parse(body);
    const { objectiveId, sessionId } = validatedData;

    // Fetch objective from database with lecture context
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
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
        errorResponse('OBJECTIVE_NOT_FOUND', 'Objective not found'),
        { status: 404 }
      );
    }

    // Check for cached prompt (generated within last 7 days for same objective)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cachedPrompt = await prisma.validationPrompt.findFirst({
      where: {
        objectiveId,
        promptType: 'EXPLAIN_TO_PATIENT',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (cachedPrompt) {
      // Return cached prompt
      return NextResponse.json(
        successResponse({
          prompt: {
            id: cachedPrompt.id,
            promptText: cachedPrompt.promptText,
            promptType: cachedPrompt.promptType,
            conceptName: cachedPrompt.conceptName,
            expectedCriteria: cachedPrompt.expectedCriteria,
            objectiveId: cachedPrompt.objectiveId,
            createdAt: cachedPrompt.createdAt,
          },
          cached: true,
        })
      );
    }

    // Call Python FastAPI service to generate new prompt
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    const pythonResponse = await fetch(`${pythonServiceUrl}/validation/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objective_id: objectiveId,
        objective_text: objective.objective,
        lecture_title: objective.lecture.title,
        course_name: objective.lecture.course.name,
      }),
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error('Python service error:', errorText);
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to generate prompt from Python service'
        ),
        { status: 500 }
      );
    }

    const pythonData = await pythonResponse.json();

    // Save generated prompt to database
    const savedPrompt = await prisma.validationPrompt.create({
      data: {
        promptText: pythonData.prompt_text,
        promptType: 'EXPLAIN_TO_PATIENT',
        conceptName: pythonData.concept_name,
        expectedCriteria: pythonData.expected_criteria,
        objectiveId,
        promptData: {
          templateType: pythonData.prompt_type.toLowerCase(), // "direct", "scenario", "teaching"
          variation: pythonData.variation || 'standard',
          seed: Math.random(),
        },
      },
    });

    return NextResponse.json(
      successResponse({
        prompt: {
          id: savedPrompt.id,
          promptText: savedPrompt.promptText,
          promptType: savedPrompt.promptType,
          conceptName: savedPrompt.conceptName,
          expectedCriteria: savedPrompt.expectedCriteria,
          objectiveId: savedPrompt.objectiveId,
          createdAt: savedPrompt.createdAt,
        },
        cached: false,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request data', error.issues),
        { status: 400 }
      );
    }

    console.error('Error generating prompt:', error);
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to generate prompt'
      ),
      { status: 500 }
    );
  }
}

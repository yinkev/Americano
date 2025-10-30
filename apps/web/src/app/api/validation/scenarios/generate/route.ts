import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// Zod validation schema for request body
const GenerateRequestSchema = z.object({
  objectiveId: z.string().cuid(),
  difficulty: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
})

/**
 * POST /api/validation/scenarios/generate
 *
 * Generates a clinical reasoning scenario for a learning objective.
 *
 * **Architecture**: Proxies to Python FastAPI service at http://localhost:8000/validation/scenarios/generate
 * Python service uses instructor library with ChatMock/GPT-5 for structured scenario generation.
 *
 * **Workflow**:
 * 1. Validate request (objectiveId required)
 * 2. Fetch objective from database with board exam tags
 * 3. Check for cached scenario (last 30 days)
 * 4. If no cache, call Python service to generate new scenario
 * 5. Save generated scenario to ClinicalScenario table
 * 6. Return scenario to client
 *
 * @see Story 4.2 Task 1 (Clinical Scenario Generation)
 * @see Story 4.2 AC#1 (Multi-stage case generation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = GenerateRequestSchema.parse(body)
    const { objectiveId, difficulty } = validatedData

    // Fetch objective from database with board exam tags
    const objective = await prisma.learningObjective.findUnique({
      where: { id: objectiveId },
      select: {
        id: true,
        objective: true,
        complexity: true,
        boardExamTags: true,
      },
    })

    if (!objective) {
      return NextResponse.json(
        errorResponse('OBJECTIVE_NOT_FOUND', 'Learning objective not found'),
        { status: 404 },
      )
    }

    // Check for cached scenario (generated within last 30 days for same objective)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const cachedScenario = await prisma.clinicalScenario.findFirst({
      where: {
        objectiveId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (cachedScenario) {
      // Return cached scenario
      return NextResponse.json(
        successResponse({
          scenario: cachedScenario,
          cached: true,
        }),
      )
    }

    // Call Python FastAPI service to generate new scenario
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001'

    const pythonResponse = await fetch(`${pythonServiceUrl}/validation/scenarios/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        objective_id: objectiveId,
        objective_text: objective.objective,
        difficulty: difficulty || objective.complexity,
        board_exam_tags: objective.boardExamTags,
      }),
    })

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text()
      console.error('Python service error:', errorText)
      return NextResponse.json(
        errorResponse('PYTHON_SERVICE_ERROR', 'Failed to generate scenario from Python service'),
        { status: 500 },
      )
    }

    const pythonData = await pythonResponse.json()

    // Save generated scenario to database
    const savedScenario = await prisma.clinicalScenario.create({
      data: {
        objectiveId,
        scenarioType: pythonData.scenario_type,
        difficulty: pythonData.difficulty,
        caseText: pythonData.case_text,
        boardExamTopic:
          pythonData.board_exam_topic ||
          (objective.boardExamTags.length > 0 ? objective.boardExamTags[0] : null),
      },
    })

    return NextResponse.json(
      successResponse({
        scenario: savedScenario,
        cached: false,
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid request data', error.issues),
        { status: 400 },
      )
    }

    console.error('[/api/validation/scenarios/generate] Error:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to generate scenario',
      ),
      { status: 500 },
    )
  }
}

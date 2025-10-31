import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calculateMetacognitiveEngagementScore } from '@/lib/reflection-config'

// Zod validation schema for query parameters
// Use proper defaults without optional(), and coerce limit → number.
const getReflectionsSchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  objectiveId: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

/**
 * GET /api/validation/reflections
 *
 * Retrieves user's reflection history with engagement metrics.
 *
 * **Query Parameters**:
 * - period: '7d' | '30d' | '90d' | 'all' (default: '30d')
 * - objectiveId: Filter by specific learning objective (optional)
 * - limit: Maximum number of reflections to return (default: 50, max: 100)
 *
 * **Response**:
 * - reflections: Array of reflection entries with concept context
 * - engagementScore: 0-100 metacognitive engagement score
 * - completionRate: Percentage of prompts with reflections
 * - avgResponseLength: Average character count of reflections
 * - totalPrompts: Total number of validation responses
 * - completedReflections: Count of responses with reflection notes
 *
 * @see Story 4.4 Task 6.7 (Reflection History View)
 * @see Story 4.4 AC#5 (Historical reflection archive)
 * @see Story 4.4 Constraint #6 (Reflection completion tracked)
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      period: searchParams.get('period') ?? undefined,
      objectiveId: searchParams.get('objectiveId') || undefined,
      limit: searchParams.get('limit') ?? undefined,
    }

    const validatedParams = getReflectionsSchema.parse(queryParams)
    const { period, objectiveId, limit } = validatedParams

    // Get user ID
    const userId = await getUserId()

    // Calculate date filter
    let dateFilter: Date | undefined
    if (period !== 'all') {
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      }[period]
      dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - daysAgo)
    }

    // Build where clause
    const whereClause: any = {
      userId,
      ...(dateFilter && {
        respondedAt: {
          gte: dateFilter,
        },
      }),
    }

    // Add objective filter if provided
    if (objectiveId) {
      whereClause.prompt = {
        objectiveId,
      }
    }

    // Fetch all validation responses for the period (for metrics calculation)
    const allResponses = await prisma.validationResponse.findMany({
      where: whereClause,
      select: {
        id: true,
        reflectionNotes: true,
      },
    })

    // Fetch validation responses with reflection notes
    const responsesWithReflections = await prisma.validationResponse.findMany({
      where: {
        ...whereClause,
        reflectionNotes: {
          not: null,
        },
      },
      select: {
        id: true,
        reflectionNotes: true,
        score: true,
        respondedAt: true,
        prompt: {
          select: {
            conceptName: true,
            objectiveId: true,
          },
        },
      },
      orderBy: {
        respondedAt: 'desc',
      },
      take: limit,
    })

    // Calculate engagement metrics
    const totalPrompts = allResponses.length
    const completedReflections = allResponses.filter((r) => r.reflectionNotes !== null).length
    const completionRate = totalPrompts > 0 ? (completedReflections / totalPrompts) * 100 : 0

    // Calculate average response length (only for non-null reflections)
    const avgResponseLength =
      completedReflections > 0
        ? responsesWithReflections.reduce((sum, r) => sum + (r.reflectionNotes?.length || 0), 0) /
          completedReflections
        : 0

    // Calculate metacognitive engagement score
    const engagementScore = calculateMetacognitiveEngagementScore(
      completedReflections,
      totalPrompts,
      avgResponseLength,
    )

    // Format reflections for response
    const reflections = responsesWithReflections.map((response) => ({
      id: response.id,
      responseId: response.id,
      reflectionNotes: response.reflectionNotes || '',
      conceptName: response.prompt.conceptName,
      score: response.score * 100, // Convert 0-1 to 0-100
      respondedAt: response.respondedAt,
    }))

    return NextResponse.json(
      successResponse({
        reflections,
        engagementScore,
        completionRate,
        avgResponseLength: Math.round(avgResponseLength),
        totalPrompts,
        completedReflections,
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid query parameters', error.issues),
        { status: 400 },
      )
    }

    console.error('Error fetching reflections:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch reflections',
      ),
      { status: 500 },
    )
  }
}

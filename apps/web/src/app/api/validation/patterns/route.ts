import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse, successResponse } from '@/lib/api-response'
import { getCurrentUserId } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { patternsQuerySchema, validateQuery } from '@/lib/validation'

/**
 * GET /api/validation/patterns
 *
 * Fetch failure patterns for the current user.
 *
 * **Architecture**: Proxies to Python FastAPI service for pattern detection
 * Python service uses FailurePatternDetector
 *
 * **Workflow**:
 * 1. Get current user ID
 * 2. Check for cached patterns in FailurePattern table (last 24 hours)
 * 3. If no cache, call Python service to detect patterns
 * 4. Python service analyzes ControlledFailure records to identify:
 *    - Category-based patterns (e.g., "struggles with pharmacology")
 *    - Systematic errors (e.g., "confuses ACE inhibitors vs ARBs")
 * 5. Save detected patterns to database
 * 6. Return top patterns with remediation recommendations
 *
 * **Query Parameters**:
 * - limit: number (1-20, default 5) - Max number of patterns to return
 *
 * **Response**:
 * {
 *   patterns: Array<{
 *     id: string,
 *     patternType: string, // 'CATEGORY' | 'SYSTEMATIC_ERROR'
 *     description: string, // "Struggles with ACE Inhibitors (failed 3/5)"
 *     affectedObjectives: string[], // Array of objective IDs
 *     failureCount: number,
 *     remediation: string[] // Suggested resources/actions
 *   }>,
 *   totalPatterns: number
 * }
 *
 * @see Story 4.3 Task 11 (API Endpoints)
 * @see Story 4.3 AC#6 (Performance Pattern Analysis)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const { limit } = validateQuery(searchParams, patternsQuerySchema)

    // Check for cached patterns (generated within last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Query failure patterns from database
    // Note: In full Story 4.3 implementation, FailurePattern model would exist
    // For now, we'll call Python service directly and cache results in-memory

    // Call Python service to detect patterns
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

    const patternsResponse = await fetch(
      `${pythonServiceUrl}/validation/detect-failure-patterns?user_id=${userId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!patternsResponse.ok) {
      const errorText = await patternsResponse.text()
      console.error('Python service error (pattern detection):', errorText)
      return NextResponse.json(
        errorResponse(
          'PYTHON_SERVICE_ERROR',
          'Failed to detect failure patterns from Python service',
        ),
        { status: 500 },
      )
    }

    const patternsData = await patternsResponse.json()

    // patternsData.patterns: Array<{
    //   pattern_type: 'CATEGORY' | 'SYSTEMATIC_ERROR',
    //   description: string,
    //   affected_objectives: string[],
    //   failure_count: number,
    //   confidence: number,
    //   remediation: string[]
    // }>

    if (!patternsData.patterns || patternsData.patterns.length === 0) {
      return NextResponse.json(
        successResponse({
          patterns: [],
          totalPatterns: 0,
        }),
      )
    }

    // Transform Python response to API format
    const patterns = patternsData.patterns.map((pattern: any) => ({
      patternType: pattern.pattern_type,
      description: pattern.description,
      affectedObjectives: pattern.affected_objectives,
      failureCount: pattern.failure_count,
      confidence: pattern.confidence,
      remediation: pattern.remediation || [],
    }))

    // Optionally save patterns to database for caching (if FailurePattern model exists)
    // For MVP, we skip this and rely on Python service caching

    return NextResponse.json(
      successResponse({
        patterns,
        totalPatterns: patterns.length,
      }),
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid query parameters', error.issues),
        { status: 400 },
      )
    }

    console.error('Error fetching failure patterns:', error)
    return NextResponse.json(
      errorResponse(
        'INTERNAL_ERROR',
        error instanceof Error ? error.message : 'Failed to fetch failure patterns',
      ),
      { status: 500 },
    )
  }
}

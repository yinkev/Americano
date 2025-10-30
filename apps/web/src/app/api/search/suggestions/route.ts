/**
 * GET /api/search/suggestions
 * Search Autocomplete API Endpoint
 *
 * Story 3.1 Task 4.2: Add GET /api/search/suggestions for autocomplete
 *
 * Provides search suggestions based on recent searches, medical terms, and concepts.
 * Supports autocomplete functionality in the search interface.
 *
 * @openapi
 * /api/search/suggestions:
 *   get:
 *     summary: Get search autocomplete suggestions
 *     description: |
 *       Returns search suggestions for autocomplete based on partial query input.
 *       Suggestions are sourced from:
 *       - Recent searches by the user
 *       - Common medical terminology
 *       - Learning objectives and concepts in the database
 *
 *       Rate limited to 20 requests per minute per user (shared with /api/search).
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Partial search query (minimum 2 characters)
 *         example: "card"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Maximum number of suggestions to return
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter suggestions by course
 *     responses:
 *       200:
 *         description: Autocomplete suggestions
 *         headers:
 *           X-RateLimit-Limit:
 *             schema:
 *               type: integer
 *           X-RateLimit-Remaining:
 *             schema:
 *               type: integer
 *           X-RateLimit-Reset:
 *             schema:
 *               type: string
 *               format: date-time
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             description: Suggested search term
 *                           category:
 *                             type: string
 *                             enum: [recent, term, concept, lecture]
 *                             description: Type of suggestion
 *                           resultCount:
 *                             type: integer
 *                             description: Number of results this suggestion would return
 *                           context:
 *                             type: string
 *                             description: Additional context or preview
 *                     query:
 *                       type: string
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */

import { withErrorHandler } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { searchRateLimiter, withRateLimit } from '@/lib/rate-limiter'
import type { SearchSuggestion } from '@/subsystems/knowledge-graph/types'
import { parseQueryParams, suggestionsRequestSchema } from '@/subsystems/knowledge-graph/validation'

/**
 * GET /api/search/suggestions handler
 * Returns autocomplete suggestions based on query
 */
async function handler(request: Request) {
  // Get user (MVP: hardcoded to kevy@americano.dev)
  const userEmail = request.headers.get('X-User-Email') || 'kevy@americano.dev'
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (!user) {
    return Response.json(errorResponse('USER_NOT_FOUND', 'User not found'), { status: 404 })
  }

  // Parse and validate query parameters
  const validation = parseQueryParams(request.url, suggestionsRequestSchema)

  if (!validation.success) {
    return Response.json(errorResponse('VALIDATION_ERROR', validation.error, validation.details), {
      status: 400,
    })
  }

  const { q: query, limit, courseId } = validation.data

  try {
    const suggestions: SearchSuggestion[] = []

    // 1. Get recent searches by this user
    const recentSearches = await getRecentSearches(user.id, query, Math.min(limit, 3), courseId)
    suggestions.push(...recentSearches)

    // 2. Get matching learning objectives
    const objectiveSuggestions = await getObjectiveSuggestions(
      query,
      limit - suggestions.length,
      courseId,
    )
    suggestions.push(...objectiveSuggestions)

    // 3. Get matching concepts
    if (suggestions.length < limit) {
      const conceptSuggestions = await getConceptSuggestions(query, limit - suggestions.length)
      suggestions.push(...conceptSuggestions)
    }

    // 4. Get matching lecture titles
    if (suggestions.length < limit) {
      const lectureSuggestions = await getLectureSuggestions(
        query,
        limit - suggestions.length,
        courseId,
      )
      suggestions.push(...lectureSuggestions)
    }

    // Return suggestions (limited to requested amount)
    return Response.json(
      successResponse({
        suggestions: suggestions.slice(0, limit),
        query,
      }),
    )
  } catch (error) {
    console.error('Failed to get suggestions:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      errorResponse('SUGGESTIONS_FAILED', 'Failed to get search suggestions. Please try again.', {
        error: errorMessage,
      }),
      { status: 500 },
    )
  }
}

/**
 * Get recent search queries by this user matching the query
 *
 * @param userId - User ID
 * @param query - Partial search query
 * @param limit - Maximum suggestions
 * @param courseId - Optional course filter
 */
async function getRecentSearches(
  userId: string,
  query: string,
  limit: number,
  courseId?: string,
): Promise<SearchSuggestion[]> {
  try {
    // Get recent searches that start with or contain the query
    const searches = await prisma.searchQuery.findMany({
      where: {
        userId,
        query: {
          contains: query,
          mode: 'insensitive',
        },
        // Filter by course if provided
        ...(courseId && {
          filters: {
            path: ['courseIds'],
            array_contains: [courseId],
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      distinct: ['query'], // Avoid duplicate queries
    })

    return searches.map((search) => ({
      text: search.query,
      category: 'recent' as const,
      resultCount: search.resultCount,
      context: `Searched ${formatRelativeTime(search.timestamp)}`,
    }))
  } catch (error) {
    console.error('Failed to get recent searches:', error)
    return []
  }
}

/**
 * Get learning objectives matching the query
 *
 * @param query - Partial search query
 * @param limit - Maximum suggestions
 * @param courseId - Optional course filter
 */
async function getObjectiveSuggestions(
  query: string,
  limit: number,
  courseId?: string,
): Promise<SearchSuggestion[]> {
  try {
    const objectives = await prisma.learningObjective.findMany({
      where: {
        objective: {
          contains: query,
          mode: 'insensitive',
        },
        ...(courseId && {
          lecture: {
            courseId,
          },
        }),
      },
      take: limit,
      select: {
        id: true,
        objective: true,
        isHighYield: true,
        lecture: {
          select: {
            title: true,
            course: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return objectives.map((obj) => ({
      text: obj.objective.length > 80 ? obj.objective.substring(0, 80) + '...' : obj.objective,
      category: 'concept' as const,
      context: `${obj.lecture.course.name}${obj.isHighYield ? ' • High-Yield' : ''}`,
    }))
  } catch (error) {
    console.error('Failed to get objective suggestions:', error)
    return []
  }
}

/**
 * Get concepts matching the query
 *
 * @param query - Partial search query
 * @param limit - Maximum suggestions
 */
async function getConceptSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
  try {
    const concepts = await prisma.concept.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
    })

    return concepts.map((concept) => ({
      text: concept.name,
      category: 'concept' as const,
      context: concept.category || concept.description?.substring(0, 50),
    }))
  } catch (error) {
    console.error('Failed to get concept suggestions:', error)
    return []
  }
}

/**
 * Get lecture titles matching the query
 *
 * @param query - Partial search query
 * @param limit - Maximum suggestions
 * @param courseId - Optional course filter
 */
async function getLectureSuggestions(
  query: string,
  limit: number,
  courseId?: string,
): Promise<SearchSuggestion[]> {
  try {
    const lectures = await prisma.lecture.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
        ...(courseId && { courseId }),
      },
      take: limit,
      select: {
        id: true,
        title: true,
        course: {
          select: {
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            learningObjectives: true,
          },
        },
      },
    })

    return lectures.map((lecture) => ({
      text: lecture.title,
      category: 'lecture' as const,
      resultCount: lecture._count.learningObjectives,
      context: `${lecture.course.code || lecture.course.name}`,
    }))
  } catch (error) {
    console.error('Failed to get lecture suggestions:', error)
    return []
  }
}

/**
 * Format relative time for display
 *
 * @param date - Date to format
 * @returns Human-readable relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Export GET handler with rate limiting and error handling
 * Shares rate limit with POST /api/search (20 requests per minute per user)
 */
export const GET = withRateLimit(searchRateLimiter, withErrorHandler(handler))

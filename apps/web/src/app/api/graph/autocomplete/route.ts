/**
 * Autocomplete API Route
 * Story 3.6 Task 2.3: Build autocomplete API endpoint
 *
 * GET /api/graph/autocomplete?q={partial}&limit={number}
 *
 * Performance target: <100ms response time
 * Rate limit: 120 requests/minute per user
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchSuggestionEngine } from '@/subsystems/knowledge-graph/search-suggestions'
import { z } from 'zod'

/**
 * Query parameter validation schema
 */
const QuerySchema = z.object({
  q: z.string().min(0).max(200),  // Partial query
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
})

/**
 * Rate limiting map (in-memory for MVP, use Redis in production)
 * Key: IP or userId, Value: { count, resetTime }
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit
 * Limit: 120 requests per minute
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const limit = 120  // requests per minute
  const windowMs = 60 * 1000  // 1 minute

  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: limit - record.count }
}

/**
 * GET handler for autocomplete suggestions
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get('q') || ''
    const rawLimit = searchParams.get('limit') || '10'

    // Validate input
    const validation = QuerySchema.safeParse({
      q: rawQuery,
      limit: rawLimit,
    })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { q: query, limit } = validation.data

    // Rate limiting (use IP for MVP, userId when auth is available)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed, remaining } = checkRateLimit(clientIp)

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait before making more requests.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '120',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString(),
          },
        }
      )
    }

    // Get suggestions
    // TODO: Pass userId when authentication is implemented
    const suggestions = await searchSuggestionEngine.getSuggestions(
      query,
      limit
    )

    const responseTime = Date.now() - startTime

    // Log performance warning if > 100ms
    if (responseTime > 100) {
      console.warn(`Autocomplete slow: ${responseTime}ms for query "${query}"`)
    }

    return NextResponse.json(
      {
        success: true,
        suggestions,
        total: suggestions.length,
        responseTime,
      },
      {
        headers: {
          'X-RateLimit-Limit': '120',
          'X-RateLimit-Remaining': remaining.toString(),
          'Cache-Control': 'public, max-age=300',  // Cache for 5 minutes
        },
      }
    )
  } catch (error) {
    console.error('Autocomplete API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

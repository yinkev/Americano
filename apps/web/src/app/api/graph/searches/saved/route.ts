/**
 * Saved Searches List API Route
 * Story 3.6 Task 3.2: Build saved search API endpoints
 *
 * GET /api/graph/searches/saved
 * Returns list of user's saved searches
 */

import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET handler - List saved searches
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from auth session
    // For MVP, using hardcoded user
    const userId = 'kevy@americano.dev'

    // Get saved searches
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Count unread alerts per search
    const searches = savedSearches.map((search) => ({
      id: search.id,
      name: search.name,
      query: search.query,
      filters: search.filters,
      alertEnabled: search.alertEnabled,
      alertFrequency: search.alertFrequency,
      lastRun: search.lastRun,
      resultCount: search.resultCount,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      searches,
      total: searches.length,
    })
  } catch (error) {
    console.error('List saved searches API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch saved searches',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

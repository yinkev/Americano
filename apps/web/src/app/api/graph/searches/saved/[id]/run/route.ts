/**
 * Execute Saved Search API Route
 * Story 3.6 Task 3.2: Build saved search API endpoints
 *
 * POST /api/graph/searches/saved/:id/run
 * Executes a saved search and returns results
 */

import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { semanticSearchService } from '@/lib/semantic-search-service'

/**
 * POST handler - Execute saved search
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now()

  try {
    const { id } = await params

    // TODO: Get userId from auth session
    const userId = 'kevy@americano.dev'

    // Get saved search
    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId, // Ensure user owns this search
      },
    })

    if (!savedSearch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Saved search not found',
        },
        { status: 404 },
      )
    }

    // Execute search
    const filters = savedSearch.filters as any
    const results = await semanticSearchService.search({
      query: savedSearch.query,
      filters: filters || {},
      limit: 25,
    })

    // Update lastRun and resultCount
    await prisma.savedSearch.update({
      where: { id },
      data: {
        lastRun: new Date(),
        resultCount: results.total,
      },
    })

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      results: results.results,
      total: results.total,
      pagination: results.pagination,
      savedSearch: {
        id: savedSearch.id,
        name: savedSearch.name,
        query: savedSearch.query,
      },
      responseTime,
    })
  } catch (error) {
    console.error('Execute saved search API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute saved search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

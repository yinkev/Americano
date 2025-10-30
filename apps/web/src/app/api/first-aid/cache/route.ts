/**
 * POST /api/first-aid/cache - Cache management endpoint
 * GET /api/first-aid/cache - Get cache statistics
 *
 * Epic 3 - Story 3.3 - AC#3: Cache invalidation and monitoring
 *
 * Operations:
 * - Invalidate cache for specific guideline
 * - Invalidate cache for specific edition
 * - Clear entire cache
 * - Get cache performance statistics
 */

import { type NextRequest, NextResponse } from 'next/server'
import { firstAidCache } from '@/lib/first-aid-cache'

/**
 * GET - Get cache statistics
 *
 * @example
 * ```
 * GET /api/first-aid/cache
 * ```
 *
 * Response:
 * ```json
 * {
 *   "stats": {
 *     "hits": 142,
 *     "misses": 38,
 *     "hitRate": 0.789,
 *     "size": 67,
 *     "maxSize": 100,
 *     "evictions": 5,
 *     "avgTTL": 3600000,
 *     "avgHitCount": 2.12,
 *     "memoryUsageEstimate": "167.50 KB"
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const stats = firstAidCache.getStats()

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      {
        error: 'Failed to get cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * POST - Cache invalidation operations
 *
 * @example
 * ```
 * // Invalidate specific guideline
 * POST /api/first-aid/cache
 * {
 *   "action": "invalidateGuideline",
 *   "guidelineId": "guideline-123"
 * }
 *
 * // Invalidate specific edition
 * POST /api/first-aid/cache
 * {
 *   "action": "invalidateEdition",
 *   "edition": "2026"
 * }
 *
 * // Clear entire cache
 * POST /api/first-aid/cache
 * {
 *   "action": "clear"
 * }
 *
 * // Reset statistics
 * POST /api/first-aid/cache
 * {
 *   "action": "resetStats"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, guidelineId, edition, conceptId } = body

    switch (action) {
      case 'invalidateGuideline':
        if (!guidelineId) {
          return NextResponse.json(
            { error: 'guidelineId required for invalidateGuideline action' },
            { status: 400 },
          )
        }
        firstAidCache.invalidateGuideline(guidelineId)
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for guideline ${guidelineId}`,
          timestamp: new Date().toISOString(),
        })

      case 'invalidateEdition':
        if (!edition) {
          return NextResponse.json(
            { error: 'edition required for invalidateEdition action' },
            { status: 400 },
          )
        }
        firstAidCache.invalidateEdition(edition)
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for edition ${edition}`,
          timestamp: new Date().toISOString(),
        })

      case 'invalidateConcept':
        if (!conceptId) {
          return NextResponse.json(
            { error: 'conceptId required for invalidateConcept action' },
            { status: 400 },
          )
        }
        firstAidCache.invalidateConcept(conceptId)
        return NextResponse.json({
          success: true,
          message: `Cache invalidated for concept ${conceptId}`,
          timestamp: new Date().toISOString(),
        })

      case 'clear':
        firstAidCache.clear()
        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
          timestamp: new Date().toISOString(),
        })

      case 'resetStats':
        firstAidCache.resetStats()
        return NextResponse.json({
          success: true,
          message: 'Cache statistics reset',
          timestamp: new Date().toISOString(),
        })

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            validActions: [
              'invalidateGuideline',
              'invalidateEdition',
              'invalidateConcept',
              'clear',
              'resetStats',
            ],
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Error in cache operation:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform cache operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE - Clear entire cache
 * Alternative to POST with action: "clear"
 *
 * @example
 * ```
 * DELETE /api/first-aid/cache
 * ```
 */
export async function DELETE(request: NextRequest) {
  try {
    const stats = firstAidCache.getStats()
    firstAidCache.clear()

    return NextResponse.json({
      success: true,
      message: 'Cache cleared',
      previousStats: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

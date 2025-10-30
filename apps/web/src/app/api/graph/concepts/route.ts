/**
 * GET /api/graph/concepts
 * Knowledge Graph Concepts API Endpoint
 *
 * Story 3.2 Task 3.1 & 8.2: Retrieve knowledge graph nodes and edges with pagination
 *
 * Query params:
 * - category?: string - Filter by concept category
 * - depth?: number - Traversal depth (default: 2)
 * - limit?: number - Number of concepts to return (default: 100)
 * - offset?: number - Pagination offset (default: 0)
 *
 * Returns concepts and their relationships with optional filtering and pagination.
 */

import type { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

async function handler(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')
  const depth = parseInt(searchParams.get('depth') || '2')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    // Build where clause for filtering
    const where = category ? { category } : undefined

    // Get total count for pagination
    const totalCount = await prisma.concept.count({ where })

    // Fetch concepts with pagination and optional category filter
    const concepts = await prisma.concept.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        name: 'asc', // Consistent ordering for pagination
      },
      include: {
        relatedFrom: {
          include: {
            toConcept: true,
          },
        },
        relatedTo: {
          include: {
            fromConcept: true,
          },
        },
      },
    })

    // Extract edges (relationships)
    const edges = concepts.flatMap((concept) => [
      ...concept.relatedFrom.map((rel) => ({
        id: rel.id,
        fromConceptId: rel.fromConceptId,
        toConceptId: rel.toConceptId,
        relationship: rel.relationship,
        strength: rel.strength,
        isUserDefined: rel.isUserDefined,
      })),
    ])

    // Format nodes
    const nodes = concepts.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      category: c.category,
      relationshipCount: c.relatedFrom.length + c.relatedTo.length,
    }))

    // Calculate if there are more results
    const hasMore = offset + nodes.length < totalCount

    return Response.json(
      successResponse({
        nodes,
        edges,
        total: totalCount,
        offset,
        limit,
        hasMore,
      }),
    )
  } catch (error) {
    console.error('Failed to fetch concepts:', error)
    return Response.json(errorResponse('FETCH_FAILED', 'Failed to fetch concepts'), { status: 500 })
  }
}

export const GET = withErrorHandler(handler)

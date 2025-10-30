/**
 * GET /api/graph/concepts/:id
 * Get specific concept with relationships
 *
 * Story 3.2 Task 3.2
 */

import type { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const concept = await prisma.concept.findUnique({
      where: { id },
      include: {
        relatedFrom: {
          include: { toConcept: true },
          orderBy: { strength: 'desc' },
        },
        relatedTo: {
          include: { fromConcept: true },
          orderBy: { strength: 'desc' },
        },
      },
    })

    if (!concept) {
      return Response.json(errorResponse('NOT_FOUND', 'Concept not found'), { status: 404 })
    }

    const relatedConcepts = [
      ...concept.relatedFrom.map((r) => r.toConcept),
      ...concept.relatedTo.map((r) => r.fromConcept),
    ]

    const relationships = [...concept.relatedFrom, ...concept.relatedTo]

    return Response.json(
      successResponse({
        concept: {
          id: concept.id,
          name: concept.name,
          description: concept.description,
          category: concept.category,
        },
        relatedConcepts,
        relationships,
      }),
    )
  } catch (error) {
    console.error('Failed to fetch concept:', error)
    return Response.json(errorResponse('FETCH_FAILED', 'Failed to fetch concept'), { status: 500 })
  }
}

export const GET = withErrorHandler(handler)

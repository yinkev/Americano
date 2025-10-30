/**
 * POST /api/graph/relationships
 * Create user-defined relationship
 *
 * Story 3.2 Task 5.1
 */

import type { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-error'
import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

async function handler(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromConceptId, toConceptId, relationship, userNote } = body

    // Validate concepts exist
    const [fromConcept, toConcept] = await Promise.all([
      prisma.concept.findUnique({ where: { id: fromConceptId } }),
      prisma.concept.findUnique({ where: { id: toConceptId } }),
    ])

    if (!fromConcept || !toConcept) {
      return Response.json(errorResponse('NOT_FOUND', 'One or both concepts not found'), {
        status: 404,
      })
    }

    // Create user-defined relationship
    const rel = await prisma.conceptRelationship.create({
      data: {
        fromConceptId,
        toConceptId,
        relationship,
        strength: 1.0,
        isUserDefined: true,
        userNote,
        createdBy: 'kevy@americano.dev', // MVP: hardcoded
      },
    })

    return Response.json(successResponse({ relationship: rel }))
  } catch (error) {
    console.error('Failed to create relationship:', error)
    return Response.json(errorResponse('CREATE_FAILED', 'Failed to create relationship'), {
      status: 500,
    })
  }
}

export const POST = withErrorHandler(handler)

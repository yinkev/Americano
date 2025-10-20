/**
 * PATCH /api/analytics/insights/[id]/acknowledge
 *
 * Mark insight as acknowledged
 *
 * Story 5.1: Learning Pattern Recognition and Analysis - Task 8.5
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse, withErrorHandler } from '@/lib/api-response'

// Zod validation schema for request body
const AcknowledgeRequestSchema = z.object({
  applied: z.boolean().optional(),
})

/**
 * PATCH /api/analytics/insights/:id/acknowledge
 *
 * Marks insight as acknowledged
 * - Sets acknowledgedAt timestamp
 * - Updates applied boolean (tracks if user applied recommendation)
 */
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    // Await params as per Next.js 15 pattern
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const requestParams = AcknowledgeRequestSchema.parse(body)

    // Find the insight
    const existingInsight = await prisma.behavioralInsight.findUnique({
      where: { id },
    })

    if (!existingInsight) {
      return Response.json(errorResponse('INSIGHT_NOT_FOUND', `Insight ${id} not found`), {
        status: 404,
      })
    }

    // Update insight with acknowledgment
    const updatedInsight = await prisma.behavioralInsight.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        ...(requestParams.applied !== undefined && { applied: requestParams.applied }),
      },
    })

    return Response.json(
      successResponse({
        insight: updatedInsight,
      }),
    )
  },
)

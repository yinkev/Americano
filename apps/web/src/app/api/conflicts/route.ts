/**
 * GET /api/conflicts
 * List conflicts with filtering and pagination
 *
 * Story 3.4 Task 4.2: Conflict listing API endpoint
 *
 * Features:
 * - Filter by conceptId, status, severity
 * - Pagination support (limit, offset)
 * - Includes source details for display
 * - Performance target: <200ms response time
 *
 * @openapi
 * /api/conflicts:
 *   get:
 *     summary: List conflicts with filters
 *     description: |
 *       Retrieve paginated list of content conflicts with optional filtering.
 *       Returns conflict metadata with source attribution.
 *     tags:
 *       - Conflicts
 *     parameters:
 *       - name: conceptId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by concept ID
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RESOLVED, DISMISSED, UNDER_REVIEW]
 *         description: Filter by conflict status
 *       - name: severity
 *         in: query
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity level
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Conflict list
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { ConflictStatus, ConflictSeverity } from '@/generated/prisma'

// ============================================
// Validation Schema
// ============================================

const QuerySchema = z.object({
  conceptId: z.string().optional(),
  status: z.nativeEnum(ConflictStatus).optional(),
  severity: z.nativeEnum(ConflictSeverity).optional(),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(1).max(100).default(20)
  ),
  offset: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(0).default(0)
  ),
})

// ============================================
// GET Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    const validatedParams = QuerySchema.safeParse(queryParams)

    if (!validatedParams.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          validatedParams.error.issues
        ),
        { status: 400 }
      )
    }

    const { conceptId, status, severity, limit, offset } = validatedParams.data

    // Build where clause
    const where: any = {}
    if (conceptId) where.conceptId = conceptId
    if (status) where.status = status
    if (severity) where.severity = severity

    // Fetch conflicts with source details
    const [conflicts, total] = await Promise.all([
      prisma.conflicts.findMany({
        where,
        include: {
          concept: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          sourceAChunk: {
            select: {
              id: true,
              content: true,
              pageNumber: true,
              lecture: {
                select: {
                  id: true,
                  title: true,
                  fileName: true,
                  course: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          sourceBChunk: {
            select: {
              id: true,
              content: true,
              pageNumber: true,
              lecture: {
                select: {
                  id: true,
                  title: true,
                  fileName: true,
                  course: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          sourceAFirstAid: {
            select: {
              id: true,
              edition: true,
              system: true,
              section: true,
              pageNumber: true,
            },
          },
          sourceBFirstAid: {
            select: {
              id: true,
              edition: true,
              system: true,
              section: true,
              pageNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      prisma.conflicts.count({ where }),
    ])

    const latency = Date.now() - startTime

    return NextResponse.json(
      successResponse({
        conflicts: conflicts.map((conflict) => ({
          id: conflict.id,
          conceptId: conflict.conceptId,
          conflictType: conflict.conflictType,
          severity: conflict.severity,
          status: conflict.status,
          description: conflict.description,
          createdAt: conflict.createdAt,
          resolvedAt: conflict.resolvedAt,
          concept: conflict.concept
            ? {
                id: conflict.concept.id,
                name: conflict.concept.name,
                category: conflict.concept.category,
              }
            : null,
          sourceA: conflict.sourceAChunk
            ? {
                type: 'lecture',
                id: conflict.sourceAChunk.id,
                title: conflict.sourceAChunk.lecture.title,
                course: conflict.sourceAChunk.lecture.course.name,
                pageNumber: conflict.sourceAChunk.pageNumber,
                snippet: conflict.sourceAChunk.content.substring(0, 200) + '...',
              }
            : conflict.sourceAFirstAid
            ? {
                type: 'first_aid',
                id: conflict.sourceAFirstAid.id,
                title: `${conflict.sourceAFirstAid.system} - ${conflict.sourceAFirstAid.section}`,
                edition: conflict.sourceAFirstAid.edition,
                pageNumber: conflict.sourceAFirstAid.pageNumber,
              }
            : null,
          sourceB: conflict.sourceBChunk
            ? {
                type: 'lecture',
                id: conflict.sourceBChunk.id,
                title: conflict.sourceBChunk.lecture.title,
                course: conflict.sourceBChunk.lecture.course.name,
                pageNumber: conflict.sourceBChunk.pageNumber,
                snippet: conflict.sourceBChunk.content.substring(0, 200) + '...',
              }
            : conflict.sourceBFirstAid
            ? {
                type: 'first_aid',
                id: conflict.sourceBFirstAid.id,
                title: `${conflict.sourceBFirstAid.system} - ${conflict.sourceBFirstAid.section}`,
                edition: conflict.sourceBFirstAid.edition,
                pageNumber: conflict.sourceBFirstAid.pageNumber,
              }
            : null,
        })),
        total,
        pagination: {
          limit,
          offset,
          hasMore: offset + conflicts.length < total,
        },
        latency,
      })
    )
  } catch (error) {
    console.error('[GET /api/conflicts] Error:', error)

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch conflicts'),
      { status: 500 }
    )
  }
}

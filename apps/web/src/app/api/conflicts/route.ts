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

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ConflictSeverity, ConflictStatus } from '@/generated/prisma'
import { ErrorCodes, errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'

// ============================================
// Validation Schema
// ============================================

const QuerySchema = z.object({
  conceptId: z.string().optional(),
  status: z.nativeEnum(ConflictStatus).optional(),
  severity: z.nativeEnum(ConflictSeverity).optional(),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(1).max(100).default(20),
  ),
  offset: z.preprocess(
    (val) => (typeof val === 'string' ? Number(val) : val),
    z.number().int().min(0).default(0),
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
          validatedParams.error.issues,
        ),
        { status: 400 },
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
          concepts: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          content_chunks_conflicts_sourceAChunkIdTocontent_chunks: {
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
          content_chunks_conflicts_sourceBChunkIdTocontent_chunks: {
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
          // Include related resolution/history/flags per handoff doc (Phase 1.2)
          conflict_resolutions: {
            orderBy: { resolvedAt: 'desc' },
            take: 10,
          },
          conflict_history: {
            orderBy: { changedAt: 'desc' },
            take: 20,
          },
          conflict_flags: {
            orderBy: { flaggedAt: 'desc' },
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
        conflicts: conflicts.map((conflict: any) => ({
          id: conflict.id,
          conceptId: conflict.conceptId,
          conflictType: conflict.conflictType,
          severity: conflict.severity,
          status: conflict.status,
          description: conflict.description,
          createdAt: conflict.createdAt,
          resolvedAt: conflict.resolvedAt,
          concept: conflict.concepts
            ? {
                id: conflict.concepts.id,
                name: conflict.concepts.name,
                category: conflict.concepts.category,
              }
            : null,
          // Guard optional relations with presence of their IDs
          sourceA:
            conflict.sourceAChunkId &&
            conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks
            ? {
                type: 'lecture',
                id: conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.id,
                title: conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.lecture.title,
                course: conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.lecture.course.name,
                pageNumber: conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.pageNumber,
                snippet: conflict.content_chunks_conflicts_sourceAChunkIdTocontent_chunks.content.substring(0, 200) + '...',
              }
            : null,
          sourceB:
            conflict.sourceBChunkId &&
            conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks
            ? {
                type: 'lecture',
                id: conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.id,
                title: conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.lecture.title,
                course: conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.lecture.course.name,
                pageNumber: conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.pageNumber,
                snippet: conflict.content_chunks_conflicts_sourceBChunkIdTocontent_chunks.content.substring(0, 200) + '...',
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
      }),
    )
  } catch (error) {
    console.error('[GET /api/conflicts] Error:', error)

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch conflicts'),
      { status: 500 },
    )
  }
}

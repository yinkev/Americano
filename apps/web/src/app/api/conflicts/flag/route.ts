/**
 * POST /api/conflicts/flag
 * User-initiated conflict flagging
 *
 * Story 3.4 Task 4.3: User flagging API endpoint
 *
 * Features:
 * - User can flag potential conflicts manually
 * - Creates ConflictFlag record with PENDING status
 * - Supports flagging between any two content sources
 * - Optionally creates Conflict record for immediate review
 * - Rate limiting to prevent spam (10 flags per hour per user)
 *
 * @openapi
 * /api/conflicts/flag:
 *   post:
 *     summary: Flag a potential conflict
 *     description: |
 *       Allows users to manually flag potential conflicts between content sources
 *       for community review. Creates a flag record that can be reviewed and
 *       optionally promoted to an official conflict.
 *     tags:
 *       - Conflicts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               sourceAChunkId:
 *                 type: string
 *                 description: First content chunk ID (mutually exclusive with sourceAFirstAidId)
 *               sourceBChunkId:
 *                 type: string
 *                 description: Second content chunk ID (mutually exclusive with sourceBFirstAidId)
 *               sourceAFirstAidId:
 *                 type: string
 *                 description: First First Aid section ID
 *               sourceBFirstAidId:
 *                 type: string
 *                 description: Second First Aid section ID
 *               description:
 *                 type: string
 *                 description: User's description of the conflict
 *                 minLength: 10
 *                 maxLength: 1000
 *               userNotes:
 *                 type: string
 *                 description: Optional additional notes
 *                 maxLength: 2000
 *               createConflict:
 *                 type: boolean
 *                 description: Whether to immediately create a Conflict record (default: false)
 *     responses:
 *       200:
 *         description: Flag created successfully
 *       400:
 *         description: Validation error
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { successResponse, errorResponse, ErrorCodes } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { conflictDetector } from '@/subsystems/knowledge-graph/conflict-detector'

// ============================================
// Validation Schema
// ============================================

const FlagRequestSchema = z
  .object({
    sourceAChunkId: z.string().optional(),
    sourceBChunkId: z.string().optional(),
    sourceAFirstAidId: z.string().optional(),
    sourceBFirstAidId: z.string().optional(),
    description: z.string().min(10).max(1000),
    userNotes: z.string().max(2000).optional(),
    createConflict: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // Must have at least one pair of sources
      const hasChunkPair = data.sourceAChunkId && data.sourceBChunkId
      const hasFirstAidPair = data.sourceAFirstAidId && data.sourceBFirstAidId
      const hasMixedPair =
        (data.sourceAChunkId && data.sourceBFirstAidId) ||
        (data.sourceAFirstAidId && data.sourceBChunkId)

      return hasChunkPair || hasFirstAidPair || hasMixedPair
    },
    {
      message: 'Must provide a valid pair of sources to flag',
    }
  )

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Hard-coded user for MVP (Story 1.5 constraint)
    const userId = 'kevy@americano.dev'

    // Parse and validate request body
    const body = await request.json()
    const validatedBody = FlagRequestSchema.safeParse(body)

    if (!validatedBody.success) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request body',
          validatedBody.error.issues
        ),
        { status: 400 }
      )
    }

    const {
      sourceAChunkId,
      sourceBChunkId,
      sourceAFirstAidId,
      sourceBFirstAidId,
      description,
      userNotes,
      createConflict,
    } = validatedBody.data

    // Check rate limiting (10 flags per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentFlagsCount = await prisma.conflictFlag.count({
      where: {
        userId,
        flaggedAt: {
          gte: oneHourAgo,
        },
      },
    })

    if (recentFlagsCount >= 10) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.CONFLICT,
          'Rate limit exceeded. Maximum 10 flags per hour.',
          {
            limit: 10,
            period: '1 hour',
            current: recentFlagsCount,
          }
        ),
        { status: 429 }
      )
    }

    // Check if sources exist
    if (sourceAChunkId) {
      const chunkExists = await prisma.contentChunk.findUnique({
        where: { id: sourceAChunkId },
      })
      if (!chunkExists) {
        return NextResponse.json(
          errorResponse(ErrorCodes.NOT_FOUND, `Source A chunk ${sourceAChunkId} not found`),
          { status: 404 }
        )
      }
    }

    if (sourceBChunkId) {
      const chunkExists = await prisma.contentChunk.findUnique({
        where: { id: sourceBChunkId },
      })
      if (!chunkExists) {
        return NextResponse.json(
          errorResponse(ErrorCodes.NOT_FOUND, `Source B chunk ${sourceBChunkId} not found`),
          { status: 404 }
        )
      }
    }

    if (sourceAFirstAidId) {
      const faExists = await prisma.firstAidSection.findUnique({
        where: { id: sourceAFirstAidId },
      })
      if (!faExists) {
        return NextResponse.json(
          errorResponse(ErrorCodes.NOT_FOUND, `Source A First Aid section ${sourceAFirstAidId} not found`),
          { status: 404 }
        )
      }
    }

    if (sourceBFirstAidId) {
      const faExists = await prisma.firstAidSection.findUnique({
        where: { id: sourceBFirstAidId },
      })
      if (!faExists) {
        return NextResponse.json(
          errorResponse(ErrorCodes.NOT_FOUND, `Source B First Aid section ${sourceBFirstAidId} not found`),
          { status: 404 }
        )
      }
    }

    // Check for duplicate flags
    const duplicateFlag = await prisma.conflictFlag.findFirst({
      where: {
        userId,
        sourceAChunkId,
        sourceBChunkId,
        sourceAFirstAidId,
        sourceBFirstAidId,
        status: 'PENDING',
      },
    })

    if (duplicateFlag) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.CONFLICT,
          'You have already flagged this conflict. It is pending review.',
          { existingFlagId: duplicateFlag.id }
        ),
        { status: 409 }
      )
    }

    // Create conflict if requested and sources are chunks (for automated detection)
    let conflictId: string | null = null
    let detectedConflict = null

    if (createConflict && sourceAChunkId && sourceBChunkId) {
      try {
        // Fetch chunks for conflict detection
        const [chunkA, chunkB] = await Promise.all([
          prisma.contentChunk.findUnique({ where: { id: sourceAChunkId } }),
          prisma.contentChunk.findUnique({ where: { id: sourceBChunkId } }),
        ])

        if (chunkA && chunkB) {
          // Run conflict detection
          const detected = await conflictDetector.detectConflicts(chunkA, chunkB, true)

          if (detected) {
            // Create Conflict record
            const conflict = await prisma.conflict.create({
              data: {
                sourceAChunkId: detected.sourceAChunkId,
                sourceBChunkId: detected.sourceBChunkId,
                conceptId: detected.conceptId,
                conflictType: detected.conflictType,
                severity: detected.severity,
                description: `${description} (User-flagged conflict with automated analysis: ${detected.description})`,
                status: 'UNDER_REVIEW', // User-flagged conflicts start in review
              },
            })

            conflictId = conflict.id
            detectedConflict = detected

            // Create history record
            await prisma.conflictHistory.create({
              data: {
                conflictId: conflict.id,
                changeType: 'DETECTED',
                newStatus: 'UNDER_REVIEW',
                changedBy: userId,
                notes: 'User-flagged conflict with automated detection',
              },
            })
          }
        }
      } catch (error) {
        console.error('Conflict detection failed for flag:', error)
        // Continue without conflict creation (flag will still be created)
      }
    }

    // Create ConflictFlag record
    const flag = await prisma.conflictFlag.create({
      data: {
        conflictId,
        userId,
        sourceAChunkId,
        sourceBChunkId,
        sourceAFirstAidId,
        sourceBFirstAidId,
        description,
        userNotes,
        status: 'PENDING',
      },
      include: {
        conflict: true,
      },
    })

    return NextResponse.json(
      successResponse({
        flag: {
          id: flag.id,
          conflictId: flag.conflictId,
          description: flag.description,
          userNotes: flag.userNotes,
          status: flag.status,
          flaggedAt: flag.flaggedAt,
        },
        conflict: flag.conflict
          ? {
              id: flag.conflict.id,
              severity: flag.conflict.severity,
              status: flag.conflict.status,
              description: flag.conflict.description,
            }
          : null,
        detectedConflict,
        message: conflictId
          ? 'Conflict flagged and created for review'
          : 'Conflict flagged for community review',
      })
    )
  } catch (error) {
    console.error('[POST /api/conflicts/flag] Error:', error)

    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to flag conflict'),
      { status: 500 }
    )
  }
}

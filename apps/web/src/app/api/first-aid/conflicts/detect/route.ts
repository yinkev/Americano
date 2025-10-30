/**
 * POST /api/first-aid/conflicts/detect
 *
 * Epic 3 - Story 3.3 - Task 5.1: Detect conflicts between lecture and First Aid content
 */

import { type NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { ConflictDetector } from '@/subsystems/knowledge-graph/conflict-detector'

const prisma = new PrismaClient()
const contentConflictDetector = new ConflictDetector()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lectureChunkId, firstAidSectionId } = body

    if (!lectureChunkId || !firstAidSectionId) {
      return NextResponse.json(
        { error: 'lectureChunkId and firstAidSectionId are required' },
        { status: 400 },
      )
    }

    // Get content for both sources
    // Note: embedding field is Unsupported type in Prisma, so we fetch all fields
    const [chunk, section] = await Promise.all([
      prisma.contentChunk.findUnique({
        where: { id: lectureChunkId },
      }),
      prisma.firstAidSection.findUnique({
        where: { id: firstAidSectionId },
      }),
    ])

    if (!chunk || !section) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Convert FirstAidSection to ContentChunk-compatible format for comparison
    const sectionAsChunk = {
      id: section.id,
      lectureId: `first-aid-${section.edition}`, // Pseudo lecture ID
      content: section.content,
      embedding: (section as any).embedding, // embedding is Unsupported type
      chunkIndex: section.pageNumber,
      pageNumber: section.pageNumber,
      createdAt: section.createdAt,
    }

    // Detect conflicts using ConflictDetector
    const conflict = await contentConflictDetector.detectConflicts(
      chunk,
      sectionAsChunk as any, // Type assertion since we're adapting the structure
    )

    return NextResponse.json({
      hasConflict: conflict !== null,
      severity: conflict?.severity || 'LOW',
      conflictType: conflict?.conflictType || 'OTHER',
      explanation: conflict?.description || 'No conflicts detected',
      confidence: conflict?.confidence || 0,
      isTerminologyDifference: false,
    })
  } catch (error) {
    console.error('Conflict detection error:', error)
    return NextResponse.json(
      {
        error: 'Conflict detection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

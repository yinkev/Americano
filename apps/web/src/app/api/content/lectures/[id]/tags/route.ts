// /api/content/lectures/[id]/tags route
// PATCH: Update lecture topic tags

import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await request.json()
    const { topicTags } = body

    // Validate topicTags
    if (!Array.isArray(topicTags)) {
      return Response.json(
        { success: false, error: { code: 'INVALID_TAGS', message: 'Topic tags must be an array' } },
        { status: 400 },
      )
    }

    if (topicTags.length > 10) {
      return Response.json(
        {
          success: false,
          error: { code: 'TOO_MANY_TAGS', message: 'Maximum 10 tags allowed per lecture' },
        },
        { status: 400 },
      )
    }

    for (const tag of topicTags) {
      if (typeof tag !== 'string' || tag.length === 0 || tag.length > 30) {
        return Response.json(
          {
            success: false,
            error: { code: 'INVALID_TAG', message: 'Each tag must be 1-30 characters' },
          },
          { status: 400 },
        )
      }
    }

    // Update tags
    const lecture = await prisma.lecture.update({
      where: { id },
      data: { topicTags },
      select: {
        id: true,
        title: true,
        topicTags: true,
      },
    })

    return Response.json({
      success: true,
      lecture,
    })
  } catch (error) {
    console.error('Failed to update tags:', error)

    // Handle Prisma not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return Response.json(
        { success: false, error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' } },
        { status: 404 },
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return Response.json(
      {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update tags',
          details: { error: errorMessage },
        },
      },
      { status: 500 },
    )
  }
}

/**
 * Individual Saved Search API Route
 * Story 3.6 Task 3.2: Build saved search API endpoints
 *
 * GET    /api/graph/searches/saved/:id - Get single saved search
 * PUT    /api/graph/searches/saved/:id - Update saved search
 * DELETE /api/graph/searches/saved/:id - Delete saved search
 */

import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

/**
 * Update schema
 */
const UpdateSearchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  query: z.string().min(1).max(500).optional(),
  filters: z
    .object({
      courseIds: z.array(z.string()).optional(),
      dateRange: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      contentTypes: z.array(z.string()).optional(),
      minSimilarity: z.number().min(0).max(1).optional(),
    })
    .optional(),
  alertEnabled: z.boolean().optional(),
  alertFrequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY']).optional(),
})

/**
 * GET handler - Get single saved search
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // TODO: Get userId from auth session
    const userId = 'kevy@americano.dev'

    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId, // Ensure user owns this search
      },
    })

    if (!savedSearch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Saved search not found',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      savedSearch,
    })
  } catch (error) {
    console.error('Get saved search API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch saved search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * PUT handler - Update saved search
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate input
    const validation = UpdateSearchSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.issues,
        },
        { status: 400 },
      )
    }

    // TODO: Get userId from auth session
    const userId = 'kevy@americano.dev'

    // Check if search exists and user owns it
    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Saved search not found',
        },
        { status: 404 },
      )
    }

    // Update saved search
    const updated = await prisma.savedSearch.update({
      where: { id },
      data: {
        ...validation.data,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      savedSearch: updated,
    })
  } catch (error) {
    console.error('Update saved search API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update saved search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE handler - Delete saved search
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // TODO: Get userId from auth session
    const userId = 'kevy@americano.dev'

    // Check if search exists and user owns it
    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Saved search not found',
        },
        { status: 404 },
      )
    }

    // Delete saved search (CASCADE will delete associated alerts)
    await prisma.savedSearch.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted',
    })
  } catch (error) {
    console.error('Delete saved search API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete saved search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

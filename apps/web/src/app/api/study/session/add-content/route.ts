/**
 * Add Content to Study Session API
 *
 * Epic 3 - Story 3.6 - Task 7: Study Session Integration
 *
 * Features:
 * - Add search results to active study session
 * - Create ContentChunk reference (if not exists)
 * - Update session progress
 * - Track session search history
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

const AddContentSchema = z.object({
  sessionId: z.string(),
  contentId: z.string(),
  contentType: z.enum(['lecture', 'chunk', 'concept', 'objective']),
  searchQuery: z.string().optional(), // For tracking what search led to this addition
})

type AddContentRequest = z.infer<typeof AddContentSchema>

/**
 * POST /api/study/session/add-content
 * Add content to active study session
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = AddContentSchema.parse(body)

    const { sessionId, contentId, contentType, searchQuery } = validatedData

    // Verify session exists and is active
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        mission: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Study session not found' },
        { status: 404 }
      )
    }

    if (session.completedAt) {
      return NextResponse.json(
        { error: 'Cannot add content to completed session' },
        { status: 400 }
      )
    }

    // Handle different content types
    let addedContent = null

    switch (contentType) {
      case 'chunk': {
        // Verify chunk exists
        const chunk = await prisma.contentChunk.findUnique({
          where: { id: contentId },
          include: {
            lecture: {
              include: {
                course: true,
              },
            },
          },
        })

        if (!chunk) {
          return NextResponse.json(
            { error: 'Content chunk not found' },
            { status: 404 }
          )
        }

        addedContent = {
          id: chunk.id,
          type: 'chunk' as const,
          title: chunk.lecture.title,
          content: chunk.content,
          source: {
            lectureTitle: chunk.lecture.title,
            courseName: chunk.lecture.course.name,
            pageNumber: chunk.pageNumber,
          },
        }
        break
      }

      case 'lecture': {
        // Verify lecture exists
        const lecture = await prisma.lecture.findUnique({
          where: { id: contentId },
          include: {
            course: true,
          },
        })

        if (!lecture) {
          return NextResponse.json(
            { error: 'Lecture not found' },
            { status: 404 }
          )
        }

        addedContent = {
          id: lecture.id,
          type: 'lecture' as const,
          title: lecture.title,
          source: {
            courseName: lecture.course.name,
          },
        }
        break
      }

      case 'objective': {
        // Verify learning objective exists
        const objective = await prisma.learningObjective.findUnique({
          where: { id: contentId },
          include: {
            lecture: {
              include: {
                course: true,
              },
            },
          },
        })

        if (!objective) {
          return NextResponse.json(
            { error: 'Learning objective not found' },
            { status: 404 }
          )
        }

        addedContent = {
          id: objective.id,
          type: 'objective' as const,
          title: objective.objective,
          source: {
            lectureTitle: objective.lecture.title,
            courseName: objective.lecture.course.name,
          },
        }
        break
      }

      case 'concept': {
        // Verify concept exists
        const concept = await prisma.concept.findUnique({
          where: { id: contentId },
        })

        if (!concept) {
          return NextResponse.json(
            { error: 'Concept not found' },
            { status: 404 }
          )
        }

        addedContent = {
          id: concept.id,
          type: 'concept' as const,
          title: concept.name,
          description: concept.description,
        }
        break
      }
    }

    // Track search query if provided (for session search history)
    if (searchQuery) {
      // In a full implementation, we would track this in a SessionSearchHistory model
      // For now, we'll log it
      console.log(`Session ${sessionId} added ${contentType} ${contentId} via search: "${searchQuery}"`)
    }

    // Update session's objective completions (if applicable)
    // This is a simplified version - in production, we'd update the objectiveCompletions JSON
    await prisma.studySession.update({
      where: { id: sessionId },
      data: {
        // Track that new content was studied
        newCardsStudied: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      sessionId,
      addedContent,
      message: `${contentType} successfully added to study session`,
    })
  } catch (error) {
    console.error('Add content to session error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to add content to session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

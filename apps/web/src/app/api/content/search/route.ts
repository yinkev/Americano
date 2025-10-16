// /api/content/search route
// GET: Search lectures by title, course name, and tags using PostgreSQL full-text search

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get Kevy user (auth deferred for MVP)
    const user = await prisma.user.findFirst({
      where: { email: 'kevy@americano.dev' }
    });

    if (!user) {
      return Response.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'Kevy user not found. Run: npx prisma db seed' } },
        { status: 500 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Validate parameters
    if (!query || query.length === 0) {
      return Response.json(
        { success: false, error: { code: 'MISSING_QUERY', message: 'Search query is required' } },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return Response.json(
        { success: false, error: { code: 'QUERY_TOO_SHORT', message: 'Search query must be at least 2 characters' } },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return Response.json(
        { success: false, error: { code: 'INVALID_LIMIT', message: 'Limit must be between 1 and 100' } },
        { status: 400 }
      );
    }

    // Search lectures with case-insensitive LIKE for MVP
    // Future enhancement: Use PostgreSQL full-text search (to_tsvector/to_tsquery)
    const searchPattern = `%${query}%`;

    const lectures = await prisma.lecture.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            course: {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            }
          },
          {
            topicTags: {
              hasSome: [query]
            }
          }
        ]
      },
      take: limit,
      orderBy: { uploadedAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true
          }
        },
        _count: {
          select: {
            contentChunks: true,
            learningObjectives: true,
            cards: true
          }
        }
      }
    });

    return Response.json({
      success: true,
      query,
      resultCount: lectures.length,
      lectures: lectures.map(lecture => ({
        ...lecture,
        chunkCount: lecture._count.contentChunks,
        objectiveCount: lecture._count.learningObjectives,
        cardCount: lecture._count.cards
      }))
    });

  } catch (error) {
    console.error('Failed to search lectures:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search lectures',
          details: { error: errorMessage }
        }
      },
      { status: 500 }
    );
  }
}

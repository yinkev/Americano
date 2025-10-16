// /api/courses route
// GET endpoint to fetch all courses for the current user

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

    // Fetch all courses for this user
    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        term: true,
      }
    });

    return Response.json({
      success: true,
      courses
    });

  } catch (error) {
    console.error('Failed to fetch courses:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch courses',
          details: { error: errorMessage }
        }
      },
      { status: 500 }
    );
  }
}

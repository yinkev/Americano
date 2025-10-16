// /api/user/profile route
// GET: Fetch user profile
// PATCH: Update user profile

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ApiError, withErrorHandler } from '@/lib/api-error';
import { validateRequest, updateUserProfileSchema } from '@/lib/validation';

/**
 * GET /api/user/profile
 * Fetch the current user's profile
 *
 * @returns User profile data
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // For MVP: Use hardcoded Kevy user (auth deferred)
  const user = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          courses: true,
          lectures: true,
          studySessions: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  return Response.json(
    successResponse({
      user: {
        ...user,
        stats: {
          courseCount: user._count.courses,
          lectureCount: user._count.lectures,
          sessionCount: user._count.studySessions,
        },
      },
    })
  );
});

/**
 * PATCH /api/user/profile
 * Update the current user's profile
 *
 * @body { name?, email?, medicalSchool?, graduationYear? }
 * @returns Updated user profile
 */
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  // Validate request body
  const data = await validateRequest(request, updateUserProfileSchema);

  // For MVP: Use hardcoded Kevy user (auth deferred)
  const existingUser = await prisma.user.findFirst({
    where: { email: 'kevy@americano.dev' },
  });

  if (!existingUser) {
    throw ApiError.notFound(
      'User not found. Run: npx prisma db seed to create default user'
    );
  }

  // Check if email is being changed to one that already exists
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw ApiError.conflict('Email already in use');
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json(
    successResponse({
      user: updatedUser,
    })
  );
});

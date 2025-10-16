// /api/demo/delete route
// DELETE endpoint to remove Dumpling demo user and all associated data

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Find Dumpling demo user
    const demoUser = await prisma.user.findFirst({
      where: { email: 'dumpling@americano.demo' }
    });

    if (!demoUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'DEMO_USER_NOT_FOUND',
            message: 'Dumpling demo user not found. May have already been deleted.'
          }
        },
        { status: 404 }
      );
    }

    // Delete demo user (Prisma cascade deletes all related data)
    await prisma.user.delete({
      where: { id: demoUser.id }
    });

    console.log('✓ Dumpling demo user deleted:', demoUser.email);

    return Response.json({
      success: true,
      message: 'Dumpling demo user and all associated data deleted successfully',
      deletedUser: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
      }
    });

  } catch (error) {
    console.error('Failed to delete demo user:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return Response.json(
      {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete demo user',
          details: { error: errorMessage }
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Authentication and User Management Utilities
 *
 * For MVP: Returns the first user in the database (single-user mode)
 * For Production: Replace with actual authentication logic
 */

import { prisma } from './db'

/**
 * Get the current user ID
 *
 * MVP Implementation: Returns the first user found in the database
 *
 * TODO (Production): Replace with actual session/auth logic:
 * - Cookie-based sessions
 * - JWT tokens
 * - OAuth providers (Google, etc.)
 * - Supabase Auth integration
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    select: { id: true },
  })

  if (!user) {
    throw new Error('No users found in database. Please run database seed.')
  }

  return user.id
}

/**
 * Get the current user with full details
 */
export async function getCurrentUser() {
  const user = await prisma.user.findFirst()

  if (!user) {
    throw new Error('No users found in database. Please run database seed.')
  }

  return user
}

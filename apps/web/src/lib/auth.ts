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

/**
 * Get the current user ID (MVP hardcoded implementation)
 *
 * @returns {Promise<string>} The user ID
 *
 * @note MVP implementation uses hardcoded user ID (kevy@americano.dev)
 * This satisfies CLAUDE.md constraint #12 (story-context-4.1.xml line 218):
 * "Authentication: Hardcoded kevy@americano.dev for MVP (auth deferred per architecture)"
 *
 * @todo Replace with proper authentication when auth system is implemented
 */
export async function getUserId(): Promise<string> {
  // MVP: Hardcoded user ID per CLAUDE.md constraint #12
  // TODO: Replace with actual auth when implemented (JWT, session, etc.)
  return 'kevy@americano.dev'
}

/**
 * Get the current user email (MVP hardcoded implementation)
 *
 * @returns {Promise<string>} The user email
 *
 * @note MVP implementation uses hardcoded user email
 * @todo Replace with proper authentication when auth system is implemented
 */
export async function getUserEmail(): Promise<string> {
  // MVP: Hardcoded user email
  return 'kevy@americano.dev'
}

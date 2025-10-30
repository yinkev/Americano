// Row-Level Security (RLS) Utilities
// ADR-006: Research-Grade Analytics System
//
// Purpose: Helper functions for setting PostgreSQL RLS context before queries
// to ensure users can only access their own research data.

import { prisma } from './db'

/**
 * Set the current user ID for Row-Level Security policies.
 *
 * This must be called before any queries to research analytics tables
 * (ExperimentProtocol, PhaseAssignment, ContextMetadata, AnalysisRun)
 * to ensure users can only access their own data.
 *
 * @param userId - The user ID to set as the current user context
 *
 * @example
 * ```typescript
 * // In API route or server action:
 * await setRLSContext(session.user.id);
 *
 * // Now queries will automatically filter by user:
 * const protocols = await prisma.experimentProtocol.findMany();
 * // Returns only protocols where userId === session.user.id
 * ```
 */
export async function setRLSContext(userId: string): Promise<void> {
  // Call PostgreSQL function to set session variable
  await prisma.$executeRawUnsafe(`SELECT set_current_user_id($1)`, userId)
}

/**
 * Clear the current user ID from RLS context.
 *
 * This is optional but recommended after queries complete,
 * especially in long-running connections or connection pools.
 */
export async function clearRLSContext(): Promise<void> {
  await prisma.$executeRawUnsafe(`SELECT set_config('app.current_user_id', '', FALSE)`)
}

/**
 * Execute a query with RLS context automatically set and cleared.
 *
 * This is a convenience wrapper that ensures RLS context is properly
 * set before the query and cleared afterward, even if the query fails.
 *
 * @param userId - The user ID to set as the current user context
 * @param queryFn - Async function containing Prisma queries
 * @returns Result of the query function
 *
 * @example
 * ```typescript
 * const protocols = await withRLSContext(session.user.id, async () => {
 *   return await prisma.experimentProtocol.findMany({
 *     include: {
 *       phases: true,
 *       analysisRuns: true,
 *     }
 *   });
 * });
 * ```
 */
export async function withRLSContext<T>(userId: string, queryFn: () => Promise<T>): Promise<T> {
  try {
    await setRLSContext(userId)
    return await queryFn()
  } finally {
    await clearRLSContext()
  }
}

/**
 * Middleware for Next.js API routes to automatically set RLS context.
 *
 * @example
 * ```typescript
 * // In API route:
 * import { withRLS } from '@/lib/rls'
 *
 * export async function GET(request: Request) {
 *   return withRLS(request, async (userId) => {
 *     const protocols = await prisma.experimentProtocol.findMany();
 *     return NextResponse.json(protocols);
 *   });
 * }
 * ```
 */
export async function withRLS<T>(
  request: Request,
  handler: (userId: string) => Promise<T>,
): Promise<T> {
  // TODO: Extract userId from session/JWT
  // This is a placeholder - implement actual auth logic
  const userId = 'kevy@americano.dev' // Replace with actual session.user.id

  return withRLSContext(userId, async () => {
    return await handler(userId)
  })
}

/**
 * Check if RLS is enabled on a table.
 *
 * Useful for debugging and testing RLS configuration.
 *
 * @param tableName - Name of the table to check
 * @returns True if RLS is enabled
 */
export async function isRLSEnabled(tableName: string): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<Array<{ rowsecurity: boolean }>>(
    `SELECT relrowsecurity AS rowsecurity
     FROM pg_class
     WHERE relname = $1`,
    tableName,
  )

  return result.length > 0 && result[0].rowsecurity
}

/**
 * List all RLS policies on a table.
 *
 * Useful for debugging and testing RLS configuration.
 *
 * @param tableName - Name of the table to check
 * @returns Array of policy names and definitions
 */
export async function listRLSPolicies(tableName: string): Promise<
  Array<{
    policyName: string
    permissive: string
    roles: string[]
    cmd: string
    qual: string | null
    withCheck: string | null
  }>
> {
  const result = await prisma.$queryRawUnsafe<Array<any>>(
    `SELECT
       polname AS "policyName",
       polpermissive AS permissive,
       polroles::regrole[] AS roles,
       polcmd AS cmd,
       pg_get_expr(polqual, polrelid) AS qual,
       pg_get_expr(polwithcheck, polrelid) AS "withCheck"
     FROM pg_policy
     JOIN pg_class ON pg_policy.polrelid = pg_class.oid
     WHERE pg_class.relname = $1`,
    tableName,
  )

  return result
}

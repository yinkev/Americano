/**
 * Redis Initialization Module
 * Handles Redis startup and ensures graceful degradation
 * Called from Next.js middleware or root layout
 */

import { initializeRedis, isRedisHealthy } from './redis'

let initialized = false

/**
 * Initialize Redis connection once
 * Safe to call multiple times - only initializes once
 */
export async function ensureRedisInitialized(): Promise<void> {
  if (initialized) {
    return
  }

  initialized = true

  try {
    const success = await initializeRedis()
    if (success) {
      console.log('[Init] Redis cache layer ready (L2)')
    } else {
      console.log('[Init] Falling back to in-memory cache only (L1)')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[Init] Redis initialization error:', message)
  }
}

/**
 * Get Redis health status
 */
export function getRedisStatus(): { healthy: boolean; initialized: boolean } {
  return {
    healthy: isRedisHealthy(),
    initialized,
  }
}

// Auto-initialize on import ONLY if explicitly enabled
// Next.js App Router best practice: Don't run side effects on module import
if (typeof window === 'undefined' && process.env.REDIS_AUTO_INIT === 'true') {
  console.log('[Init] Auto-initializing Redis (REDIS_AUTO_INIT=true)...')
  ensureRedisInitialized().catch((err) => {
    console.warn('[Init] Auto-initialization failed:', err)
  })
} else if (typeof window === 'undefined') {
  console.log('[Init] Redis will initialize on first request (set REDIS_AUTO_INIT=true to change)')
}

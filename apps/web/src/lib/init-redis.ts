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

// Auto-initialize on import (for server components)
if (typeof window === 'undefined') {
  ensureRedisInitialized().catch((err) => {
    console.warn('[Init] Auto-initialization failed:', err)
  })
}

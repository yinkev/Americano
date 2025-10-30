/**
 * Multi-tier Cache Layer with Redis + In-Memory Fallback
 * Epic 5 Performance Optimization - Wave 2
 *
 * Implements L1 (application in-memory) and L2 (Redis) caching with:
 * - Automatic fallback from Redis to in-memory cache
 * - Graceful degradation when Redis unavailable
 * - Cache invalidation patterns for user and entity data
 * - Performance tracking and statistics
 */

import {
  deleteFromRedis,
  deletePatternFromRedis,
  getFromRedis,
  getRedisClient,
  isRedisHealthy,
  setInRedis,
} from './redis'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Multi-tier cache with Redis + in-memory fallback
 */
class HybridCache {
  private cache = new Map<string, CacheEntry<any>>()
  private stats = {
    hits: 0,
    misses: 0,
    redisHits: 0,
    redisMisses: 0,
    fallbackCount: 0,
  }

  /**
   * Get cached value from Redis (L2) or in-memory (L1)
   * Implements cache-aside pattern with fallback
   */
  async get<T>(key: string): Promise<T | null> {
    // Check L1 first (in-memory)
    const entry = this.cache.get(key)
    if (entry) {
      const now = Date.now()
      if (now - entry.timestamp <= entry.ttl) {
        this.stats.hits++
        return entry.data as T
      } else {
        // Expired, remove
        this.cache.delete(key)
      }
    }

    // Try L2 (Redis)
    if (isRedisHealthy()) {
      try {
        const redisValue = await getFromRedis<T>(key)
        if (redisValue !== null) {
          this.stats.redisHits++
          // Populate L1 for next access
          const ttl = entry?.ttl || CACHE_TTL.MEDIUM
          this.cache.set(key, {
            data: redisValue,
            timestamp: Date.now(),
            ttl,
          })
          return redisValue
        }
        this.stats.redisMisses++
      } catch (error) {
        console.warn(`[Cache] Redis get failed for key ${key}`)
      }
    }

    this.stats.misses++
    return null
  }

  /**
   * Set cache value in both L1 and L2
   * TTL is in milliseconds for consistency with in-memory cache
   */
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    // L1: Always set in-memory
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    })

    // L2: Async set in Redis (don't block on this)
    if (isRedisHealthy()) {
      const ttlSeconds = Math.ceil(ttlMs / 1000)
      setInRedis(key, data, ttlSeconds).catch((err) => {
        console.warn(`[Cache] Redis set failed for key ${key}:`, err)
        this.stats.fallbackCount++
      })
    }
  }

  /**
   * Delete specific key from both L1 and L2
   */
  async delete(key: string): Promise<void> {
    // L1
    this.cache.delete(key)

    // L2
    if (isRedisHealthy()) {
      deleteFromRedis(key).catch((err) => {
        console.warn(`[Cache] Redis delete failed for key ${key}:`, err)
      })
    }
  }

  /**
   * Delete all keys matching pattern from both L1 and L2
   */
  async deletePattern(pattern: string): Promise<void> {
    // L1: Delete from in-memory
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }

    // L2: Delete from Redis (async)
    if (isRedisHealthy()) {
      const redisPattern = pattern.replace(/^\^/, '').replace(/\$$/, '') // Convert regex to glob
      deletePatternFromRedis(redisPattern + '*').catch((err) => {
        console.warn(`[Cache] Redis pattern delete failed for ${pattern}:`, err)
      })
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear()
    // Note: Not clearing Redis to preserve across app restarts
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : '0.00'

    return {
      type: 'HYBRID_CACHE',
      l1MemorySize: this.cache.size,
      l1Keys: Array.from(this.cache.keys()),
      stats: {
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        hitRate: `${hitRate}%`,
        redisHits: this.stats.redisHits,
        redisMisses: this.stats.redisMisses,
        fallbackCount: this.stats.fallbackCount,
      },
      redisHealthy: isRedisHealthy(),
    }
  }
}

// Singleton instance
export const apiCache = new HybridCache()

// Common TTL values (in milliseconds for consistency)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 15 * 60 * 1000, // 15 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
} as const

/**
 * Cache wrapper for async functions with Redis + in-memory fallback
 * Automatically manages both L1 and L2 caches
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // Try to get from cache (L1 or L2)
  const cached = await apiCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch data
  const data = await fetchFn()

  // Store in both L1 and L2
  await apiCache.set(key, data, ttl)

  return data
}

/**
 * Invalidate cache for user-specific patterns
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await apiCache.deletePattern(`^user:${userId}:`)
}

/**
 * Invalidate cache for specific entity
 */
export async function invalidateEntityCache(entity: string, id: string): Promise<void> {
  await apiCache.deletePattern(`^${entity}:${id}:`)
}

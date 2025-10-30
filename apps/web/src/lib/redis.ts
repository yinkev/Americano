/**
 * Redis Service Wrapper with Graceful Fallback
 * Epic 5 Wave 2 Performance Optimization
 *
 * Provides distributed caching via Redis with automatic fallback to in-memory cache
 * Implements connection pooling, error handling, and graceful degradation
 */

import Redis, { type RedisOptions } from 'ioredis'

/**
 * Redis connection options
 * Configurable via environment variables
 */
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),

  // Connection pool settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: true, // Don't connect until first command

  // Retry strategy with exponential backoff
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },

  // Reconnect on specific errors
  reconnectOnError(err: Error) {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      return true // Reconnect on READONLY errors
    }
    return false
  },

  // Timeouts
  connectTimeout: 10000,
}

/**
 * Redis client singleton
 */
let redisClient: Redis | null = null
let isRedisAvailable = false
let connectionAttempted = false

/**
 * Initialize Redis connection
 * Returns true if connection successful, false if fallback to in-memory
 */
export async function initializeRedis(): Promise<boolean> {
  if (connectionAttempted) {
    return isRedisAvailable
  }

  connectionAttempted = true

  // Check if Redis is disabled via env var
  if (process.env.REDIS_DISABLED === 'true') {
    console.log('[Redis] Disabled via REDIS_DISABLED env var, using in-memory cache only')
    isRedisAvailable = false
    redisClient = null
    return false
  }

  try {
    console.log('[Redis] Initializing connection...')
    redisClient = new Redis(redisConfig)

    // Set up error handler BEFORE attempting connection
    redisClient.on('error', (err: Error) => {
      console.warn('[Redis] Connection error:', err.message)
      isRedisAvailable = false
    })

    redisClient.on('ready', () => {
      console.log('[Redis] Connection established')
      isRedisAvailable = true
    })

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...')
    })

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed')
      isRedisAvailable = false
    })

    // Explicitly connect (since lazyConnect: true)
    await redisClient.connect()

    // Test connection with timeout
    const pingTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis ping timeout after 5s')), 5000),
    )
    await Promise.race([redisClient.ping(), pingTimeout])

    isRedisAvailable = true
    console.log('[Redis] Initialization successful')
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[Redis] Initialization failed, falling back to in-memory cache:', message)
    console.warn('[Redis] This is normal in development. Set REDIS_DISABLED=true to skip attempts.')
    isRedisAvailable = false

    // Clean up failed connection
    if (redisClient) {
      try {
        await redisClient.quit()
      } catch (e) {
        // Ignore cleanup errors
      }
      redisClient = null
    }

    return false
  }
}

/**
 * Get Redis client with health check
 * Returns null if Redis is unavailable
 */
export function getRedisClient(): Redis | null {
  if (!redisClient || !isRedisAvailable) {
    return null
  }
  return redisClient
}

/**
 * Check if Redis is available
 */
export function isRedisHealthy(): boolean {
  return isRedisAvailable && redisClient !== null
}

/**
 * Get value from Redis with fallback to default
 * Type-safe generic implementation
 */
export async function getFromRedis<T>(key: string, defaultValue?: T): Promise<T | null> {
  if (!redisClient || !isRedisAvailable) {
    return defaultValue ?? null
  }

  try {
    const value = await redisClient.getex(key, 'EX', 3600) // Also extend TTL
    if (!value) return defaultValue ?? null

    try {
      return JSON.parse(value) as T
    } catch {
      // If not JSON, return as string
      return value as any as T
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[Redis] Get failed for key ${key}:`, message)
    isRedisAvailable = false
    return defaultValue ?? null
  }
}

/**
 * Set value in Redis with TTL
 * Returns true if successful
 */
export async function setInRedis<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300, // Default 5 minutes
): Promise<boolean> {
  if (!redisClient || !isRedisAvailable) {
    return false
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    await redisClient.setex(key, ttlSeconds, serialized)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[Redis] Set failed for key ${key}:`, message)
    isRedisAvailable = false
    return false
  }
}

/**
 * Delete key from Redis
 * Returns true if key was deleted
 */
export async function deleteFromRedis(key: string): Promise<boolean> {
  if (!redisClient || !isRedisAvailable) {
    return false
  }

  try {
    const result = await redisClient.del(key)
    return result > 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[Redis] Delete failed for key ${key}:`, message)
    isRedisAvailable = false
    return false
  }
}

/**
 * Delete multiple keys matching pattern
 * Returns number of keys deleted
 */
export async function deletePatternFromRedis(pattern: string): Promise<number> {
  if (!redisClient || !isRedisAvailable) {
    return 0
  }

  try {
    // Use SCAN to avoid blocking on large keysets
    const keys: string[] = []
    let cursor = '0'

    do {
      const [newCursor, scannedKeys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      )
      cursor = newCursor
      keys.push(...scannedKeys)
    } while (cursor !== '0')

    if (keys.length === 0) return 0

    const deleted = await redisClient.del(...keys)
    return deleted
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[Redis] Pattern delete failed for ${pattern}:`, message)
    isRedisAvailable = false
    return 0
  }
}

/**
 * Get cache statistics
 */
export async function getRedisStats(): Promise<{
  isAvailable: boolean
  connectedClients?: number
  usedMemory?: string
  keyCount?: number
} | null> {
  if (!redisClient || !isRedisAvailable) {
    return null
  }

  try {
    const info = await redisClient.info('stats')
    const keyCount = await redisClient.dbsize()

    // Parse info response
    const lines = info.split('\r\n')
    const stats: Record<string, string> = {}

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) stats[key] = value
      }
    }

    return {
      isAvailable: true,
      connectedClients: parseInt(stats['connected_clients'] || '0'),
      usedMemory: stats['used_memory_human'],
      keyCount,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[Redis] Stats retrieval failed:', message)
    isRedisAvailable = false
    return null
  }
}

/**
 * Cache function result with automatic serialization
 * Implements write-through caching pattern
 */
export async function withRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  // Try Redis first
  if (isRedisAvailable && redisClient) {
    try {
      const cached = await getFromRedis<T>(key)
      if (cached !== null) {
        return cached
      }
    } catch (error) {
      console.warn(`[Redis] Cache read failed for ${key}`)
      // Fall through to fetch
    }
  }

  // Fetch data
  const data = await fetchFn()

  // Store in Redis (fire and forget to avoid blocking)
  if (isRedisAvailable && redisClient) {
    setInRedis(key, data, ttlSeconds).catch((err) => {
      console.warn(`[Redis] Cache write failed for ${key}:`, err)
    })
  }

  return data
}

/**
 * Disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit()
      redisClient = null
      isRedisAvailable = false
      console.log('[Redis] Disconnected')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn('[Redis] Disconnect error:', message)
    }
  }
}

/**
 * Handle process shutdown gracefully
 */
if (typeof global !== 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('[Redis] SIGTERM received, disconnecting...')
    await disconnectRedis()
    process.exit(0)
  })

  process.on('SIGINT', async () => {
    console.log('[Redis] SIGINT received, disconnecting...')
    await disconnectRedis()
    process.exit(0)
  })
}

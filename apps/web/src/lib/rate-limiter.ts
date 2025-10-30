/**
 * Rate Limiter Utility
 * Story 3.1 Task 4.3: Rate limiting for search API (20 searches/minute per user)
 *
 * Implementation: Token bucket algorithm with sliding window
 * - Each user gets 20 tokens per minute
 * - Tokens replenish at rate of 1 token per 3 seconds
 * - Uses in-memory storage (suitable for MVP single-instance deployment)
 *
 * Future enhancement: Use Redis for distributed rate limiting across multiple instances
 */

interface RateLimitConfig {
  /** Maximum number of requests allowed per window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Optional identifier for different rate limit buckets */
  keyPrefix?: string
}

interface RateLimitEntry {
  /** Timestamps of requests in the current window */
  requests: number[]
  /** Last time the bucket was accessed */
  lastAccess: number
}

/**
 * In-memory rate limiter using sliding window algorithm
 *
 * @example
 * const limiter = new RateLimiter({ maxRequests: 20, windowMs: 60000 })
 * const result = await limiter.checkLimit('user-123')
 * if (!result.allowed) {
 *   return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
 * }
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.config = {
      keyPrefix: 'ratelimit',
      ...config,
    }

    // Cleanup old entries every minute to prevent memory leak
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if a request is allowed under the rate limit
   *
   * @param identifier - User ID or IP address
   * @returns Rate limit result with allowed status and metadata
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    // Get or create entry
    let entry = this.store.get(key)
    if (!entry) {
      entry = { requests: [], lastAccess: now }
      this.store.set(key, entry)
    }

    // Remove requests outside the current window (sliding window)
    entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart)
    entry.lastAccess = now

    // Check if limit exceeded
    const currentCount = entry.requests.length
    const allowed = currentCount < this.config.maxRequests

    if (allowed) {
      // Add current request timestamp
      entry.requests.push(now)
    }

    // Calculate metadata
    const remaining = Math.max(0, this.config.maxRequests - currentCount - (allowed ? 1 : 0))
    const resetTime =
      entry.requests.length > 0
        ? entry.requests[0] + this.config.windowMs
        : now + this.config.windowMs

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetAt: new Date(resetTime),
      retryAfter: allowed ? 0 : Math.ceil((resetTime - now) / 1000), // seconds
    }
  }

  /**
   * Reset rate limit for a specific identifier
   * Useful for testing or manual override
   */
  reset(identifier: string): void {
    const key = `${this.config.keyPrefix}:${identifier}`
    this.store.delete(key)
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear()
  }

  /**
   * Get current status for an identifier without incrementing the counter
   */
  getStatus(identifier: string): RateLimitResult {
    const key = `${this.config.keyPrefix}:${identifier}`
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    const entry = this.store.get(key)
    if (!entry) {
      return {
        allowed: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetAt: new Date(now + this.config.windowMs),
        retryAfter: 0,
      }
    }

    // Filter requests in current window
    const validRequests = entry.requests.filter((timestamp) => timestamp > windowStart)
    const currentCount = validRequests.length
    const remaining = Math.max(0, this.config.maxRequests - currentCount)
    const resetTime =
      validRequests.length > 0
        ? validRequests[0] + this.config.windowMs
        : now + this.config.windowMs

    return {
      allowed: currentCount < this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining,
      resetAt: new Date(resetTime),
      retryAfter: currentCount >= this.config.maxRequests ? Math.ceil((resetTime - now) / 1000) : 0,
    }
  }

  /**
   * Cleanup old entries to prevent memory leak
   * Removes entries that haven't been accessed in the last window
   */
  private cleanup(): void {
    const now = Date.now()
    const staleThreshold = now - this.config.windowMs - 60000 // Extra minute buffer

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccess < staleThreshold) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Cleanup resources on destruction
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Maximum requests allowed per window */
  limit: number
  /** Remaining requests in current window */
  remaining: number
  /** When the rate limit resets */
  resetAt: Date
  /** Seconds until client should retry (0 if allowed) */
  retryAfter: number
}

/**
 * Singleton instances for different API rate limiting
 * Story 3.6 Task 9.3: Rate limiting implementation
 */

/** Search endpoint: 60 searches per minute per user */
export const searchRateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60000, // 1 minute
  keyPrefix: 'search',
})

/** Autocomplete endpoint: 120 requests per minute per user */
export const autocompleteRateLimiter = new RateLimiter({
  maxRequests: 120,
  windowMs: 60000, // 1 minute
  keyPrefix: 'autocomplete',
})

/** Export endpoint: 10 exports per hour per user */
export const exportRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 3600000, // 1 hour
  keyPrefix: 'export',
})

/**
 * Higher-order function to wrap API routes with rate limiting
 *
 * @example
 * export const POST = withRateLimit(
 *   searchRateLimiter,
 *   async (request) => {
 *     // Handle request
 *   }
 * )
 */
export function withRateLimit<T extends (request: Request, ...args: any[]) => Promise<Response>>(
  limiter: RateLimiter,
  handler: T,
  options?: {
    /** Custom function to extract identifier from request */
    getIdentifier?: (request: Request) => string | Promise<string>
  },
): T {
  return (async (request: Request, ...args: any[]) => {
    // Extract identifier (default to X-User-Email header or 'anonymous')
    const identifier = options?.getIdentifier
      ? await options.getIdentifier(request)
      : request.headers.get('X-User-Email') || 'anonymous'

    // Check rate limit
    const result = await limiter.checkLimit(identifier)

    if (!result.allowed) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Maximum ${result.limit} requests per minute. Please try again in ${result.retryAfter} seconds.`,
            details: {
              limit: result.limit,
              remaining: result.remaining,
              resetAt: result.resetAt.toISOString(),
              retryAfter: result.retryAfter,
            },
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetAt.toISOString(),
            'Retry-After': result.retryAfter.toString(),
          },
        },
      )
    }

    // Add rate limit headers to successful response
    const response = await handler(request, ...args)

    // Clone response to add headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    })

    newResponse.headers.set('X-RateLimit-Limit', result.limit.toString())
    newResponse.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    newResponse.headers.set('X-RateLimit-Reset', result.resetAt.toISOString())

    return newResponse
  }) as T
}

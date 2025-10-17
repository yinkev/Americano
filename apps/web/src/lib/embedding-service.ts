/**
 * EmbeddingService - Wrapper around GeminiClient for vector embedding generation
 *
 * Features:
 * - Rate limiting (60 requests/minute as per Gemini API limits)
 * - Exponential backoff retry logic
 * - Batch processing with configurable batch sizes
 * - Error handling and logging
 * - Type-safe interfaces
 *
 * Epic 3 - Story 3.1 - Task 1.3
 */

import { GeminiClient } from './ai/gemini-client'

/**
 * Configuration for the embedding service
 */
export interface EmbeddingServiceConfig {
  /** Maximum requests per minute (default: 100 per Gemini API limits) */
  maxRequestsPerMinute?: number
  /** Maximum requests per day (default: 1000 per Gemini API limits) */
  maxRequestsPerDay?: number
  /** Batch size for parallel processing (default: 100) */
  batchSize?: number
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number
  /** Callback when rate limit warning threshold reached (default: 80%) */
  onRateLimitWarning?: (usage: RateLimitUsage) => void
}

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  /** The generated embedding vector */
  embedding: number[]
  /** Error message if generation failed */
  error?: string
}

/**
 * Result of batch embedding generation
 */
export interface BatchEmbeddingResult {
  /** Successfully generated embeddings */
  embeddings: number[][]
  /** Errors indexed by original text position */
  errors: Map<number, string>
  /** Number of successful embeddings */
  successCount: number
  /** Number of failed embeddings */
  failureCount: number
}

/**
 * Rate limit usage statistics
 */
export interface RateLimitUsage {
  /** Requests in the last minute */
  requestsInLastMinute: number
  /** Requests in the last day */
  requestsInLastDay: number
  /** Maximum requests per minute */
  maxRequestsPerMinute: number
  /** Maximum requests per day */
  maxRequestsPerDay: number
  /** Percentage of daily quota used (0-100) */
  dailyQuotaUsedPercent: number
  /** Percentage of per-minute quota used (0-100) */
  minuteQuotaUsedPercent: number
  /** Warning if approaching limits */
  warning?: string
}

/**
 * EmbeddingService wraps GeminiClient with rate limiting, retry logic, and batch processing
 *
 * @example
 * ```typescript
 * const service = new EmbeddingService()
 *
 * // Single embedding
 * const result = await service.generateEmbedding('Medical text here')
 *
 * // Batch embeddings
 * const batch = await service.generateBatchEmbeddings(['text 1', 'text 2'])
 * ```
 */
export class EmbeddingService {
  private geminiClient: GeminiClient
  private config: Required<Omit<EmbeddingServiceConfig, 'onRateLimitWarning'>>
  private onRateLimitWarning?: (usage: RateLimitUsage) => void
  private requestTimestamps: number[] = []
  private dailyRequestTimestamps: number[] = []

  constructor(config: EmbeddingServiceConfig = {}) {
    this.geminiClient = new GeminiClient()
    this.config = {
      maxRequestsPerMinute: config.maxRequestsPerMinute ?? 100, // Gemini API: 100 RPM
      maxRequestsPerDay: config.maxRequestsPerDay ?? 1000, // Gemini API: 1000 RPD
      batchSize: config.batchSize ?? 100,
      maxRetries: config.maxRetries ?? 3,
    }
    this.onRateLimitWarning = config.onRateLimitWarning
  }

  /**
   * Generate embedding for a single text chunk
   * Includes rate limiting and retry logic
   *
   * @param text - Text to generate embedding for
   * @returns Promise with embedding result
   *
   * @example
   * ```typescript
   * const result = await service.generateEmbedding('Cardiac conduction system pathways')
   * if (!result.error) {
   *   console.log('Embedding dimensions:', result.embedding.length) // 1536
   * }
   * ```
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        embedding: [],
        error: 'Empty text provided',
      }
    }

    // Check daily quota first
    await this.waitForDailyQuota()

    // Apply rate limiting
    await this.waitForRateLimit()

    // Track request timestamp
    const now = Date.now()
    this.requestTimestamps.push(now)
    this.dailyRequestTimestamps.push(now)

    // Check if approaching limits and trigger warning
    this.checkRateLimitWarning()

    // Delegate to GeminiClient (which has built-in retry logic)
    return await this.geminiClient.generateEmbedding(text)
  }

  /**
   * Generate embeddings for multiple text chunks with optimized batch processing
   * Automatically handles rate limiting across batches
   *
   * @param texts - Array of texts to generate embeddings for
   * @returns Promise with batch embedding results including error tracking
   *
   * @example
   * ```typescript
   * const chunks = ['Chunk 1', 'Chunk 2', 'Chunk 3']
   * const result = await service.generateBatchEmbeddings(chunks)
   * console.log(`Success: ${result.successCount}, Failed: ${result.failureCount}`)
   * ```
   */
  async generateBatchEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const embeddings: number[][] = []
    const errors = new Map<number, string>()
    let successCount = 0
    let failureCount = 0

    // Process in configurable batches
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize)
      const batchStartIndex = i

      // Process batch with rate limiting
      const batchResults = await Promise.all(
        batch.map(async (text, batchIndex) => {
          const result = await this.generateEmbedding(text)
          const originalIndex = batchStartIndex + batchIndex

          if (result.error) {
            errors.set(originalIndex, result.error)
            failureCount++
            return []
          } else {
            successCount++
            return result.embedding
          }
        })
      )

      embeddings.push(...batchResults)

      // Add delay between batches to respect rate limits
      if (i + this.config.batchSize < texts.length) {
        await this.delay(1000) // 1 second between batches
      }
    }

    return {
      embeddings,
      errors,
      successCount,
      failureCount,
    }
  }

  /**
   * Wait for daily quota window if necessary
   * @private
   */
  private async waitForDailyQuota(): Promise<void> {
    const now = Date.now()
    const oneDayAgo = now - 86400000 // 24 hours in ms

    // Remove timestamps older than 24 hours
    this.dailyRequestTimestamps = this.dailyRequestTimestamps.filter(
      (timestamp) => timestamp > oneDayAgo
    )

    // If at daily limit, wait until oldest request expires
    if (this.dailyRequestTimestamps.length >= this.config.maxRequestsPerDay) {
      const oldestRequest = this.dailyRequestTimestamps[0]
      const waitTime = oldestRequest + 86400000 - now

      if (waitTime > 0) {
        const hoursToWait = Math.ceil(waitTime / 3600000)
        console.error(
          `⚠️ GEMINI API DAILY QUOTA REACHED (${this.config.maxRequestsPerDay} RPD)! Waiting ${hoursToWait}h...`
        )
        // Notify user via callback
        if (this.onRateLimitWarning) {
          this.onRateLimitWarning({
            ...this.getRateLimitStatus(),
            warning: `Daily quota of ${this.config.maxRequestsPerDay} requests reached. Next request available in ${hoursToWait} hours.`,
          })
        }
        await this.delay(waitTime)
      }
    }
  }

  /**
   * Wait for rate limit window if necessary
   * Implements sliding window rate limiting
   *
   * @private
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    )

    // If at limit, wait until oldest request expires
    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0]
      const waitTime = oldestRequest + 60000 - now

      if (waitTime > 0) {
        console.warn(
          `⚠️ Rate limit reached (${this.config.maxRequestsPerMinute} RPM). Waiting ${Math.ceil(waitTime / 1000)}s...`
        )
        await this.delay(waitTime)
      }
    }
  }

  /**
   * Check if approaching rate limits and trigger warning callback
   * @private
   */
  private checkRateLimitWarning(): void {
    if (!this.onRateLimitWarning) return

    const usage = this.getRateLimitStatus()

    // Warn at 80% of daily quota
    if (usage.dailyQuotaUsedPercent >= 80) {
      this.onRateLimitWarning({
        ...usage,
        warning: `⚠️ Approaching daily quota: ${usage.requestsInLastDay}/${usage.maxRequestsPerDay} requests used (${usage.dailyQuotaUsedPercent.toFixed(1)}%)`,
      })
    }

    // Warn at 90% of per-minute quota
    if (usage.minuteQuotaUsedPercent >= 90) {
      this.onRateLimitWarning({
        ...usage,
        warning: `⚠️ Approaching per-minute quota: ${usage.requestsInLastMinute}/${usage.maxRequestsPerMinute} requests in last minute`,
      })
    }
  }

  /**
   * Delay helper for rate limiting and retry backoff
   *
   * @private
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current rate limit status
   * Useful for monitoring and debugging
   *
   * @returns Detailed usage statistics including daily quota
   */
  getRateLimitStatus(): RateLimitUsage {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const oneDayAgo = now - 86400000

    const recentMinuteRequests = this.requestTimestamps.filter(
      (timestamp) => timestamp > oneMinuteAgo
    )
    const recentDayRequests = this.dailyRequestTimestamps.filter(
      (timestamp) => timestamp > oneDayAgo
    )

    const minutePercent = (recentMinuteRequests.length / this.config.maxRequestsPerMinute) * 100
    const dayPercent = (recentDayRequests.length / this.config.maxRequestsPerDay) * 100

    return {
      requestsInLastMinute: recentMinuteRequests.length,
      requestsInLastDay: recentDayRequests.length,
      maxRequestsPerMinute: this.config.maxRequestsPerMinute,
      maxRequestsPerDay: this.config.maxRequestsPerDay,
      minuteQuotaUsedPercent: minutePercent,
      dailyQuotaUsedPercent: dayPercent,
    }
  }

  /**
   * Reset rate limit tracking
   * Useful for testing or after long idle periods
   */
  resetRateLimit(): void {
    this.requestTimestamps = []
    this.dailyRequestTimestamps = []
  }
}

/**
 * Console notification callback for rate limit warnings
 * Use this to get notified when approaching Gemini API limits
 */
export function consoleRateLimitNotification(usage: RateLimitUsage): void {
  if (usage.warning) {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.warn('🚨 GEMINI API RATE LIMIT WARNING')
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.warn(usage.warning)
    console.warn(`Daily: ${usage.requestsInLastDay}/${usage.maxRequestsPerDay} (${usage.dailyQuotaUsedPercent.toFixed(1)}%)`)
    console.warn(`Per-Minute: ${usage.requestsInLastMinute}/${usage.maxRequestsPerMinute}`)
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }
}

/**
 * Singleton instance for application-wide use
 * Use this to avoid creating multiple instances with separate rate limit tracking
 *
 * Configured with Gemini API limits:
 * - RPM (Requests Per Minute): 100
 * - TPM (Tokens Per Minute): 30,000 (handled by GeminiClient)
 * - RPD (Requests Per Day): 1,000
 *
 * Includes console notifications when approaching limits
 */
export const embeddingService = new EmbeddingService({
  maxRequestsPerMinute: 100,
  maxRequestsPerDay: 1000,
  onRateLimitWarning: consoleRateLimitNotification,
})

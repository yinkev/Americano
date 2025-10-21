/**
 * SearchCache - In-memory LRU cache for search results
 * Story 3.6 Task 9.1: Search result caching
 *
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) for cache entries
 * - Query normalization for cache key generation
 * - Cache hit rate tracking
 * - Memory-efficient Map-based implementation
 *
 * Performance targets:
 * - Cache hit rate: >40%
 * - TTL: 5 minutes for simple queries, 15 minutes for complex
 * - Max cache size: 1000 entries
 */

import { createHash } from 'crypto'
import type { SearchResult, SearchFilters } from '@/lib/semantic-search-service'

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  /** Cached search results */
  results: SearchResult[]
  /** Total count of results */
  total: number
  /** When this entry was cached */
  cachedAt: number
  /** TTL in milliseconds */
  ttl: number
  /** Number of times this entry was accessed */
  hitCount: number
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  maxSize: number
  evictions: number
  avgTTL: number
}

/**
 * Normalized query object for cache key generation
 */
interface NormalizedQuery {
  query: string
  filters: SearchFilters | undefined
}

/**
 * SearchCache - LRU cache with TTL support
 */
export class SearchCache {
  private cache: Map<string, CacheEntry>
  private accessOrder: string[] // Track access order for LRU
  private maxSize: number
  private stats: {
    hits: number
    misses: number
    evictions: number
  }

  /**
   * Default TTLs for different query complexities
   */
  private static readonly DEFAULT_SIMPLE_TTL = 5 * 60 * 1000 // 5 minutes
  private static readonly DEFAULT_COMPLEX_TTL = 15 * 60 * 1000 // 15 minutes
  private static readonly MAX_CACHE_SIZE = 1000

  constructor(maxSize: number = SearchCache.MAX_CACHE_SIZE) {
    this.cache = new Map()
    this.accessOrder = []
    this.maxSize = maxSize
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    }
  }

  /**
   * Get cached search results
   * Task 9.1: Cache retrieval with TTL check
   *
   * @param query - Search query string
   * @param filters - Optional search filters
   * @returns Cached results or null if not found/expired
   */
  get(
    query: string,
    filters?: SearchFilters
  ): { results: SearchResult[]; total: number } | null {
    const key = this.generateCacheKey(query, filters)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.cachedAt > entry.ttl) {
      // Entry expired, remove from cache
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      this.stats.misses++
      return null
    }

    // Cache hit - update access order for LRU
    this.updateAccessOrder(key)
    entry.hitCount++
    this.stats.hits++

    return {
      results: entry.results,
      total: entry.total,
    }
  }

  /**
   * Store search results in cache
   * Task 9.1: Cache storage with TTL and LRU eviction
   *
   * @param query - Search query string
   * @param filters - Optional search filters
   * @param results - Search results to cache
   * @param total - Total count of results
   * @param isComplexQuery - Whether this is a complex query (determines TTL)
   */
  set(
    query: string,
    filters: SearchFilters | undefined,
    results: SearchResult[],
    total: number,
    isComplexQuery: boolean = false
  ): void {
    const key = this.generateCacheKey(query, filters)

    // Determine TTL based on query complexity
    const ttl = isComplexQuery
      ? SearchCache.DEFAULT_COMPLEX_TTL
      : SearchCache.DEFAULT_SIMPLE_TTL

    const entry: CacheEntry = {
      results,
      total,
      cachedAt: Date.now(),
      ttl,
      hitCount: 0,
    }

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get cache statistics
   * Task 9.5: Performance monitoring
   *
   * @returns Cache performance statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    // Calculate average TTL of cached entries
    let totalTTL = 0
    for (const entry of this.cache.values()) {
      totalTTL += entry.ttl
    }
    const avgTTL = this.cache.size > 0 ? totalTTL / this.cache.size : 0

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.stats.evictions,
      avgTTL,
    }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    }
  }

  /**
   * Generate cache key from normalized query and filters
   * Task 9.2: Query normalization for cache key
   *
   * @param query - Search query string
   * @param filters - Optional search filters
   * @returns Unique cache key
   */
  private generateCacheKey(query: string, filters?: SearchFilters): string {
    const normalized = this.normalizeQuery(query, filters)
    const keyString = JSON.stringify(normalized)

    // Use SHA256 hash for consistent, compact keys
    return createHash('sha256').update(keyString).digest('hex')
  }

  /**
   * Normalize query for consistent cache keys
   * Task 9.2: Query normalization (lowercase, trim, remove stop words)
   *
   * @param query - Raw search query
   * @param filters - Optional search filters
   * @returns Normalized query object
   */
  private normalizeQuery(
    query: string,
    filters?: SearchFilters
  ): NormalizedQuery {
    // Normalize query string
    let normalizedQuery = query
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing whitespace
      .replace(/\s+/g, ' ') // Normalize whitespace

    // Remove common stop words for better cache hit rate
    const stopWords = new Set([
      'a',
      'an',
      'and',
      'are',
      'as',
      'at',
      'be',
      'by',
      'for',
      'from',
      'has',
      'he',
      'in',
      'is',
      'it',
      'its',
      'of',
      'on',
      'that',
      'the',
      'to',
      'was',
      'will',
      'with',
    ])

    const words = normalizedQuery.split(' ')
    const filteredWords = words.filter((word) => !stopWords.has(word))
    normalizedQuery = filteredWords.join(' ')

    // Normalize filters for consistent ordering
    const normalizedFilters = filters
      ? {
          courseIds: filters.courseIds?.sort(),
          category: filters.category,
          dateRange: filters.dateRange,
          contentTypes: filters.contentTypes?.sort(),
          minSimilarity: filters.minSimilarity,
        }
      : undefined

    return {
      query: normalizedQuery,
      filters: normalizedFilters,
    }
  }

  /**
   * Update access order for LRU eviction
   * Moves key to end of access order (most recently used)
   *
   * @param key - Cache key
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    this.removeFromAccessOrder(key)
    // Add to end (most recently used)
    this.accessOrder.push(key)
  }

  /**
   * Remove key from access order array
   *
   * @param key - Cache key to remove
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Evict oldest (least recently used) entry from cache
   * Task 9.1: LRU eviction policy
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) return

    const oldestKey = this.accessOrder[0]
    this.cache.delete(oldestKey)
    this.accessOrder.shift()
    this.stats.evictions++
  }

  /**
   * Determine if a query is complex based on heuristics
   * Complex queries: boolean operators, field-specific syntax, multiple filters
   *
   * @param query - Search query string
   * @param filters - Optional search filters
   * @returns Whether query is complex
   */
  static isComplexQuery(query: string, filters?: SearchFilters): boolean {
    // Check for boolean operators
    const hasBooleanOperators = /\b(AND|OR|NOT)\b/i.test(query)

    // Check for field-specific syntax
    const hasFieldSyntax = /\w+:/.test(query)

    // Check for multiple filters
    const hasMultipleFilters =
      ((filters?.courseIds?.length ?? 0) > 1) ||
      Boolean(filters?.dateRange) ||
      ((filters?.contentTypes?.length ?? 0) > 1)

    return hasBooleanOperators || hasFieldSyntax || hasMultipleFilters
  }
}

/**
 * Singleton cache instance for application-wide use
 */
export const searchCache = new SearchCache()

/**
 * Cleanup handler for cache maintenance
 * Periodically remove expired entries
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    // @ts-ignore - Access private cache property for cleanup
    for (const [key, entry] of searchCache.cache.entries()) {
      if (now - entry.cachedAt > entry.ttl) {
        // @ts-ignore
        searchCache.cache.delete(key)
        // @ts-ignore
        searchCache.removeFromAccessOrder(key)
      }
    }
  }, 60 * 1000) // Run every minute
}

/**
 * FirstAidCache - In-memory LRU cache for First Aid cross-references
 * Story 3.3 AC#3: Caching layer to avoid re-fetching First Aid references on scroll
 *
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) for different content types
 * - Position-based caching for scroll optimization
 * - Guideline-specific invalidation
 * - Edition-aware cache keys
 * - Performance metrics tracking
 *
 * Performance targets:
 * - Cache hit: <5ms
 * - Cache miss + DB query: <100ms
 * - Memory usage: <50MB for 100 entries
 * - Cache hit rate: >60%
 */

import { createHash } from 'crypto'

/**
 * Concept reference structure matching FirstAidMapping
 */
export interface ConceptReference {
  id: string
  firstAidSectionId: string
  edition: string
  system: string
  section: string
  subsection?: string | null
  pageNumber: number
  content: string
  similarity: number
  confidence: number
  priority: 'HIGH_YIELD' | 'STANDARD' | 'SUGGESTED'
  rationale: string
  isHighYield: boolean
  mnemonics?: string[] | null
  clinicalCorrelations?: string[] | null
}

/**
 * Cached entry with metadata
 */
interface CachedReference {
  /** Cached concept references */
  references: ConceptReference[]
  /** When this entry was cached */
  cachedAt: number
  /** TTL in milliseconds */
  ttl: number
  /** Number of times this entry was accessed */
  hitCount: number
  /** Last access timestamp for LRU */
  lastAccessedAt: number
  /** Edition this cache entry is for */
  edition?: string
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
  avgHitCount: number
  memoryUsageEstimate: string
}

/**
 * Cache key generation parameters
 */
interface CacheKeyParams {
  type: 'concept' | 'guideline' | 'scroll' | 'section'
  conceptId?: string
  guidelineId?: string
  section?: string
  position?: number
  edition?: string
}

/**
 * FirstAidCache - LRU cache with TTL support for First Aid cross-references
 *
 * @example
 * ```typescript
 * const cache = new FirstAidCache()
 *
 * // Cache concept references
 * cache.set('concept:abc-123', references, { ttl: 3600000 })
 *
 * // Retrieve cached references
 * const cached = cache.get('concept:abc-123')
 *
 * // Invalidate specific guideline
 * cache.invalidateGuideline('guideline-456')
 *
 * // Get performance metrics
 * const stats = cache.getStats()
 * ```
 */
export class FirstAidCache {
  private cache: Map<string, CachedReference>
  private accessOrder: string[] // Track access order for LRU
  private maxSize: number
  private stats: {
    hits: number
    misses: number
    evictions: number
    totalHitCount: number
  }

  /**
   * TTL configurations for different cache types
   */
  public static readonly TTL_CONFIG = {
    /** Concept-based references: 1 hour (stable, medical content changes infrequently) */
    CONCEPT: 60 * 60 * 1000,
    /** Guideline section references: 1 hour */
    GUIDELINE_SECTION: 60 * 60 * 1000,
    /** Scroll position references: 30 minutes (user session-specific) */
    SCROLL_POSITION: 30 * 60 * 1000,
    /** Stable guidelines (not recently edited): 24 hours */
    STABLE_GUIDELINE: 24 * 60 * 60 * 1000,
  }

  private static readonly DEFAULT_MAX_SIZE = 100
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

  constructor(maxSize: number = FirstAidCache.DEFAULT_MAX_SIZE) {
    this.cache = new Map()
    this.accessOrder = []
    this.maxSize = maxSize
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalHitCount: 0,
    }

    // Start periodic cleanup of expired entries
    this.startCleanupInterval()
  }

  /**
   * Get cached First Aid references
   *
   * @param key - Cache key (use generateKey() for consistency)
   * @returns Cached references or null if not found/expired
   *
   * Performance target: <5ms
   */
  get(key: string): ConceptReference[] | null {
    const startTime = performance.now()
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

    // Cache hit - update access order and metrics
    this.updateAccessOrder(key)
    entry.hitCount++
    entry.lastAccessedAt = now
    this.stats.hits++
    this.stats.totalHitCount++

    const elapsed = performance.now() - startTime
    if (elapsed > 5) {
      console.warn(`⚠️  Cache get exceeded 5ms target: ${elapsed.toFixed(2)}ms`)
    }

    return entry.references
  }

  /**
   * Store First Aid references in cache
   *
   * @param key - Cache key (use generateKey() for consistency)
   * @param references - First Aid references to cache
   * @param options - Cache options (ttl, edition)
   */
  set(
    key: string,
    references: ConceptReference[],
    options: {
      ttl?: number
      edition?: string
      isStableGuideline?: boolean
    } = {}
  ): void {
    const {
      ttl = FirstAidCache.TTL_CONFIG.CONCEPT,
      edition,
      isStableGuideline = false,
    } = options

    // Use extended TTL for stable guidelines
    const effectiveTTL = isStableGuideline
      ? FirstAidCache.TTL_CONFIG.STABLE_GUIDELINE
      : ttl

    const entry: CachedReference = {
      references,
      cachedAt: Date.now(),
      ttl: effectiveTTL,
      hitCount: 0,
      lastAccessedAt: Date.now(),
      edition,
    }

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  /**
   * Invalidate cache for a specific concept
   *
   * @param conceptId - Concept ID to invalidate
   */
  invalidateConcept(conceptId: string): void {
    const pattern = `concept:${conceptId}`
    this.invalidateByPattern(pattern)
  }

  /**
   * Invalidate cache for a specific guideline
   * Clears all section and position-based caches for this guideline
   *
   * @param guidelineId - Guideline ID to invalidate
   */
  invalidateGuideline(guidelineId: string): void {
    const pattern = `guideline:${guidelineId}`
    this.invalidateByPattern(pattern)
  }

  /**
   * Invalidate cache for a specific edition
   * Used when a new First Aid edition is uploaded
   *
   * @param edition - Edition to invalidate (e.g., "2026")
   */
  invalidateEdition(edition: string): void {
    const keysToDelete: string[] = []

    // Convert to array to avoid iterator issues
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (entry.edition === edition) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
    }

    console.log(`🗑️  Invalidated ${keysToDelete.length} cache entries for edition ${edition}`)
  }

  /**
   * Invalidate all cache entries
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Generate consistent cache key from parameters
   *
   * @param params - Cache key parameters
   * @returns Unique cache key
   *
   * @example
   * ```typescript
   * // Concept-based key
   * const key1 = cache.generateKey({ type: 'concept', conceptId: 'abc-123' })
   * // => "concept:abc-123"
   *
   * // Guideline section key
   * const key2 = cache.generateKey({
   *   type: 'guideline',
   *   guidelineId: 'guide-456',
   *   section: 'cardiology'
   * })
   * // => "guideline:guide-456:section:cardiology"
   *
   * // Scroll position key
   * const key3 = cache.generateKey({
   *   type: 'scroll',
   *   guidelineId: 'guide-456',
   *   position: 1250
   * })
   * // => "scroll:guide-456:1250"
   * ```
   */
  generateKey(params: CacheKeyParams): string {
    const { type, conceptId, guidelineId, section, position, edition } = params

    let key = ''

    switch (type) {
      case 'concept':
        if (!conceptId) throw new Error('conceptId required for concept cache key')
        key = `concept:${conceptId}`
        break

      case 'guideline':
        if (!guidelineId) throw new Error('guidelineId required for guideline cache key')
        key = `guideline:${guidelineId}`
        if (section) {
          key += `:section:${section}`
        }
        break

      case 'scroll':
        if (!guidelineId) throw new Error('guidelineId required for scroll cache key')
        if (position === undefined) throw new Error('position required for scroll cache key')
        // Round position to nearest 100px for better cache hit rate
        const roundedPosition = Math.floor(position / 100) * 100
        key = `scroll:${guidelineId}:${roundedPosition}`
        break

      case 'section':
        if (!guidelineId) throw new Error('guidelineId required for section cache key')
        if (!section) throw new Error('section required for section cache key')
        key = `section:${guidelineId}:${section}`
        break

      default:
        throw new Error(`Unknown cache key type: ${type}`)
    }

    // Append edition if specified
    if (edition) {
      key += `:edition:${edition}`
    }

    return key
  }

  /**
   * Get cache performance statistics
   *
   * @returns Cache statistics including hit rate, size, and memory usage
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    // Calculate average TTL
    let totalTTL = 0
    let totalHitCount = 0
    // Convert to array to avoid iterator issues
    const values = Array.from(this.cache.values())
    for (const entry of values) {
      totalTTL += entry.ttl
      totalHitCount += entry.hitCount
    }
    const avgTTL = this.cache.size > 0 ? totalTTL / this.cache.size : 0
    const avgHitCount = this.cache.size > 0 ? totalHitCount / this.cache.size : 0

    // Estimate memory usage
    // Rough estimate: each ConceptReference ~2KB, metadata ~0.5KB
    const estimatedMemoryBytes = this.cache.size * 2500 // 2.5KB per entry
    const memoryUsageEstimate = this.formatBytes(estimatedMemoryBytes)

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.stats.evictions,
      avgTTL,
      avgHitCount,
      memoryUsageEstimate,
    }
  }

  /**
   * Reset cache statistics (useful for testing/monitoring)
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalHitCount: 0,
    }
  }

  /**
   * Check if cache contains a specific key
   *
   * @param key - Cache key to check
   * @returns true if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check expiration
    const now = Date.now()
    if (now - entry.cachedAt > entry.ttl) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
      return false
    }

    return true
  }

  /**
   * Get cache entry count
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Invalidate cache entries matching a pattern
   * Uses startsWith matching for efficiency
   *
   * @param pattern - Pattern to match (e.g., "concept:abc", "guideline:xyz")
   */
  private invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = []

    // Convert to array to avoid iterator issues
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
    }

    if (keysToDelete.length > 0) {
      console.log(`🗑️  Invalidated ${keysToDelete.length} cache entries matching "${pattern}"`)
    }
  }

  /**
   * Update access order for LRU eviction
   * Moves key to end of access order (most recently used)
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key)
    this.accessOrder.push(key)
  }

  /**
   * Remove key from access order array
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * Evict oldest (least recently used) entry from cache
   */
  private evictOldest(): void {
    if (this.accessOrder.length === 0) return

    const oldestKey = this.accessOrder[0]
    this.cache.delete(oldestKey)
    this.accessOrder.shift()
    this.stats.evictions++
  }

  /**
   * Start periodic cleanup interval to remove expired entries
   * Runs every 5 minutes
   */
  private startCleanupInterval(): void {
    if (typeof setInterval === 'undefined') return // Skip in non-browser environments

    setInterval(() => {
      this.cleanupExpiredEntries()
    }, FirstAidCache.CLEANUP_INTERVAL)
  }

  /**
   * Remove all expired entries from cache
   * Called periodically by cleanup interval
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    // Convert to array to avoid iterator issues
    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      if (now - entry.cachedAt > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
      this.removeFromAccessOrder(key)
    }

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`)
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  /**
   * Destroy cache instance and cleanup resources
   */
  destroy(): void {
    this.clear()
    // Note: Cannot clear interval in this implementation
    // Consider using a cleanup callback if needed
  }
}

/**
 * Singleton cache instance for application-wide use
 *
 * @example
 * ```typescript
 * import { firstAidCache } from '@/lib/first-aid-cache'
 *
 * // In your component or API route
 * const key = firstAidCache.generateKey({
 *   type: 'concept',
 *   conceptId: 'concept-123'
 * })
 *
 * // Try to get from cache
 * let references = firstAidCache.get(key)
 *
 * if (!references) {
 *   // Cache miss - fetch from database
 *   references = await fetchFromDB()
 *   firstAidCache.set(key, references)
 * }
 * ```
 */
export const firstAidCache = new FirstAidCache()

/**
 * Helper function to determine if a guideline is stable
 * Stable guidelines haven't been edited in 30 days
 *
 * @param lastEditedAt - Last edit timestamp
 * @returns true if guideline is stable
 */
export function isStableGuideline(lastEditedAt: Date): boolean {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return lastEditedAt.getTime() < thirtyDaysAgo
}

/**
 * Prefetch references for adjacent scroll positions
 * Improves perceived performance during scrolling
 *
 * @param guidelineId - Guideline being viewed
 * @param currentPosition - Current scroll position
 * @param fetchFn - Function to fetch references for a position
 *
 * @example
 * ```typescript
 * // In your scroll handler
 * prefetchAdjacentPositions(
 *   'guideline-123',
 *   1500,
 *   async (pos) => await fetchReferencesForPosition(pos)
 * )
 * ```
 */
export async function prefetchAdjacentPositions(
  guidelineId: string,
  currentPosition: number,
  fetchFn: (position: number) => Promise<ConceptReference[]>
): Promise<void> {
  // Prefetch next 3 positions (300px ahead)
  const positions = [
    currentPosition + 100,
    currentPosition + 200,
    currentPosition + 300,
  ]

  for (const position of positions) {
    const key = firstAidCache.generateKey({
      type: 'scroll',
      guidelineId,
      position,
    })

    // Skip if already cached
    if (firstAidCache.has(key)) continue

    try {
      const references = await fetchFn(position)
      firstAidCache.set(key, references, {
        ttl: FirstAidCache.TTL_CONFIG.SCROLL_POSITION,
      })
    } catch (error) {
      // Silently fail prefetch - not critical
      console.debug('Prefetch failed for position', position, error)
    }
  }
}

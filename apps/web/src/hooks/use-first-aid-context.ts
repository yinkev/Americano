/**
 * useFirstAidContext - Contextual First Aid cross-reference loading with scroll tracking
 *
 * Epic 3 - Story 3.3 - AC#3: Contextual Cross-Reference Loading
 *
 * Features:
 * - Track scroll position to dynamically load relevant First Aid references
 * - Cache loaded references to avoid redundant fetches
 * - Debounced scroll handling for performance
 * - Section-based contextual loading
 * - Visual indicators for available cross-references
 *
 * Architecture:
 * - Leverages intersection observer for section visibility detection
 * - Uses React Query for caching and state management
 * - Debounced scroll tracking to reduce API calls
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * First Aid concept reference with contextual metadata
 */
export interface ConceptReference {
  id: string
  section: string
  subsection?: string
  pageNumber: number
  snippet: string
  confidence: number
  isHighYield: boolean
  system?: string
  relevantToSection?: string // Which lecture section triggered this
  distance?: number // Scroll distance from trigger point
}

/**
 * Section position information for contextual loading
 */
interface SectionPosition {
  id: string
  element: HTMLElement
  top: number
  bottom: number
  visible: boolean
}

/**
 * Hook configuration options
 */
interface UseFirstAidContextOptions {
  /** Enable/disable contextual loading */
  enabled?: boolean
  /** Scroll debounce delay in ms */
  debounceMs?: number
  /** Number of references to prefetch per section */
  prefetchLimit?: number
  /** Distance threshold for prefetching adjacent sections (px) */
  prefetchThreshold?: number
  /** Cache TTL in ms */
  cacheTTL?: number
}

/**
 * Hook return value
 */
interface UseFirstAidContextResult {
  /** Loaded First Aid references for current scroll position */
  references: ConceptReference[]
  /** Loading state */
  loading: boolean
  /** Error state */
  error: Error | null
  /** Current visible section ID */
  currentSection: string | null
  /** Force reload references */
  reload: () => Promise<void>
  /** Clear cache */
  clearCache: () => void
  /** Prefetch references for a specific section */
  prefetchSection: (sectionId: string) => Promise<void>
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  references: ConceptReference[]
  timestamp: number
}

/**
 * useFirstAidContext - Load First Aid references contextually based on scroll position
 *
 * @param guidelineId - Lecture or content ID to load references for
 * @param options - Configuration options
 * @returns Hook state and actions
 *
 * @example
 * ```typescript
 * const { references, loading, currentSection } = useFirstAidContext('lecture-123', {
 *   enabled: true,
 *   debounceMs: 500,
 *   prefetchLimit: 5
 * })
 *
 * return (
 *   <div>
 *     <FirstAidCrossReference references={references} loading={loading} />
 *     <p>Current section: {currentSection}</p>
 *   </div>
 * )
 * ```
 */
export function useFirstAidContext(
  guidelineId: string,
  options: UseFirstAidContextOptions = {}
): UseFirstAidContextResult {
  const {
    enabled = true,
    debounceMs = 500,
    prefetchLimit = 5,
    prefetchThreshold = 300,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
  } = options

  // State
  const [references, setReferences] = useState<ConceptReference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentSection, setCurrentSection] = useState<string | null>(null)

  // Cache storage (in-memory)
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const sectionObserverRef = useRef<IntersectionObserver | null>(null)
  const sectionPositionsRef = useRef<Map<string, SectionPosition>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Check if cache entry is valid
   */
  const isCacheValid = useCallback(
    (entry: CacheEntry): boolean => {
      return Date.now() - entry.timestamp < cacheTTL
    },
    [cacheTTL]
  )

  /**
   * Get references from cache
   */
  const getFromCache = useCallback(
    (sectionId: string): ConceptReference[] | null => {
      const entry = cacheRef.current.get(sectionId)
      if (entry && isCacheValid(entry)) {
        return entry.references
      }
      return null
    },
    [isCacheValid]
  )

  /**
   * Store references in cache
   */
  const storeInCache = useCallback((sectionId: string, refs: ConceptReference[]) => {
    cacheRef.current.set(sectionId, {
      references: refs,
      timestamp: Date.now(),
    })
  }, [])

  /**
   * Clear entire cache
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  /**
   * Fetch First Aid references for a specific section
   */
  const fetchReferencesForSection = useCallback(
    async (sectionId: string, signal?: AbortSignal): Promise<ConceptReference[]> => {
      // Check cache first
      const cached = getFromCache(sectionId)
      if (cached) {
        console.log(`[FirstAidContext] Cache hit for section: ${sectionId}`)
        return cached
      }

      console.log(`[FirstAidContext] Fetching references for section: ${sectionId}`)

      try {
        const response = await fetch(
          `/api/first-aid/references?guidelineId=${encodeURIComponent(guidelineId)}&section=${encodeURIComponent(sectionId)}`,
          { signal }
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch references: ${response.statusText}`)
        }

        const data = await response.json()
        const refs: ConceptReference[] = data.references || []

        // Store in cache
        storeInCache(sectionId, refs)

        return refs
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log(`[FirstAidContext] Fetch aborted for section: ${sectionId}`)
          throw err
        }
        console.error(`[FirstAidContext] Error fetching references:`, err)
        throw err instanceof Error ? err : new Error('Unknown error')
      }
    },
    [guidelineId, getFromCache, storeInCache]
  )

  /**
   * Prefetch references for a specific section (public API)
   */
  const prefetchSection = useCallback(
    async (sectionId: string): Promise<void> => {
      if (!enabled) return

      try {
        await fetchReferencesForSection(sectionId)
      } catch (err) {
        // Silently fail for prefetch
        console.warn(`[FirstAidContext] Prefetch failed for ${sectionId}:`, err)
      }
    },
    [enabled, fetchReferencesForSection]
  )

  /**
   * Load references for current scroll position
   */
  const loadReferencesForCurrentPosition = useCallback(async () => {
    if (!enabled || !currentSection) {
      return
    }

    // Cancel any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const refs = await fetchReferencesForSection(
        currentSection,
        abortControllerRef.current.signal
      )
      setReferences(refs)

      // Prefetch adjacent sections
      const sections = Array.from(sectionPositionsRef.current.keys())
      const currentIndex = sections.indexOf(currentSection)

      if (currentIndex > 0) {
        // Prefetch previous section
        prefetchSection(sections[currentIndex - 1]).catch(() => {})
      }

      if (currentIndex < sections.length - 1) {
        // Prefetch next section
        prefetchSection(sections[currentIndex + 1]).catch(() => {})
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err)
      }
    } finally {
      setLoading(false)
    }
  }, [enabled, currentSection, fetchReferencesForSection, prefetchSection])

  /**
   * Handle scroll with debouncing
   */
  const handleScroll = useCallback(() => {
    if (!enabled) return

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Debounce scroll handler
    scrollTimeoutRef.current = setTimeout(() => {
      // Find most visible section
      let mostVisibleSection: string | null = null
      let maxVisibility = 0

      sectionPositionsRef.current.forEach((position, sectionId) => {
        if (position.visible) {
          const element = position.element
          const rect = element.getBoundingClientRect()
          const viewportHeight = window.innerHeight

          // Calculate visibility percentage
          const visibleTop = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0))
          const totalHeight = rect.height
          const visibility = totalHeight > 0 ? visibleTop / totalHeight : 0

          if (visibility > maxVisibility) {
            maxVisibility = visibility
            mostVisibleSection = sectionId
          }
        }
      })

      if (mostVisibleSection && mostVisibleSection !== currentSection) {
        setCurrentSection(mostVisibleSection)
      }
    }, debounceMs)
  }, [enabled, currentSection, debounceMs])

  /**
   * Set up intersection observer for section visibility
   */
  useEffect(() => {
    if (!enabled) return

    // Create intersection observer
    sectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute('data-section-id')
          if (sectionId) {
            const position = sectionPositionsRef.current.get(sectionId)
            if (position) {
              position.visible = entry.isIntersecting
              sectionPositionsRef.current.set(sectionId, position)
            }
          }
        })

        // Trigger scroll handler to recalculate most visible section
        handleScroll()
      },
      {
        root: null,
        rootMargin: `${prefetchThreshold}px 0px ${prefetchThreshold}px 0px`,
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      }
    )

    // Observe all sections with data-section-id attribute
    const sections = document.querySelectorAll('[data-section-id]')
    sections.forEach((section) => {
      const sectionId = section.getAttribute('data-section-id')
      if (sectionId && sectionObserverRef.current) {
        sectionPositionsRef.current.set(sectionId, {
          id: sectionId,
          element: section as HTMLElement,
          top: 0,
          bottom: 0,
          visible: false,
        })
        sectionObserverRef.current.observe(section)
      }
    })

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Initial trigger
    handleScroll()

    return () => {
      if (sectionObserverRef.current) {
        sectionObserverRef.current.disconnect()
      }
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, handleScroll, prefetchThreshold])

  /**
   * Load references when current section changes
   */
  useEffect(() => {
    if (currentSection) {
      loadReferencesForCurrentPosition()
    }
  }, [currentSection, loadReferencesForCurrentPosition])

  /**
   * Force reload references
   */
  const reload = useCallback(async (): Promise<void> => {
    if (!currentSection) return
    // Clear cache for current section
    cacheRef.current.delete(currentSection)
    await loadReferencesForCurrentPosition()
  }, [currentSection, loadReferencesForCurrentPosition])

  return {
    references,
    loading,
    error,
    currentSection,
    reload,
    clearCache,
    prefetchSection,
  }
}

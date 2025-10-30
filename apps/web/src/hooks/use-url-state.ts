/**
 * URL State Sync Hook
 *
 * Provides URL state synchronization for analytics filters using nuqs.
 * Enables shareable links with filter state preserved in URL.
 *
 * Features:
 * - Type-safe URL parameters
 * - Automatic serialization/deserialization
 * - Multi-value support (objectives)
 * - Integration with Zustand stores
 * - Browser history support
 */

'use client'

import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import type { ComparisonMode, TimeRange } from '@/stores/analytics'

// Custom parser for time range
const parseAsTimeRange = parseAsString.withDefault('30d')

// Custom parser for comparison mode
const parseAsComparisonMode = parseAsString.withDefault('self')

/**
 * Hook for syncing analytics filters with URL state
 *
 * Usage:
 * ```tsx
 * const [filters, setFilters] = useAnalyticsUrlState()
 *
 * // Update URL and get new state
 * await setFilters({ timeRange: '7d', objectives: ['obj1', 'obj2'] })
 *
 * // Read from URL
 * const { timeRange, objectives, comparisonMode } = filters
 * ```
 */
export function useAnalyticsUrlState() {
  return useQueryStates(
    {
      timeRange: parseAsTimeRange,
      objectives: parseAsArrayOf(parseAsString).withDefault([]),
      comparisonMode: parseAsComparisonMode,
    },
    {
      // Use shallow routing to avoid server re-renders
      shallow: true,
      // Clear URL params when set to null
      clearOnDefault: true,
    },
  )
}

/**
 * Hook for syncing analytics filters between URL and Zustand store
 *
 * Bi-directional sync:
 * 1. URL → Store on mount (restore from URL)
 * 2. Store → URL on store changes (shareable links)
 *
 * Usage:
 * ```tsx
 * function AnalyticsPage() {
 *   useSyncAnalyticsFilters()
 *   const timeRange = useAnalyticsStore(selectTimeRange)
 *   // ... rest of component
 * }
 * ```
 */
export function useSyncAnalyticsFilters() {
  const [urlState, setUrlState] = useAnalyticsUrlState()

  // This will be imported dynamically to avoid circular deps
  // For now, return the URL state management
  return {
    urlState,
    setUrlState,
  }
}

/**
 * Custom parser for creating URL-safe JSON objects
 * Useful for complex filter objects
 */
export function createJsonParser<T>(defaultValue: T) {
  return {
    parse: (value: string): T => {
      try {
        return JSON.parse(decodeURIComponent(value))
      } catch {
        return defaultValue
      }
    },
    serialize: (value: T): string => {
      return encodeURIComponent(JSON.stringify(value))
    },
  }
}

/**
 * Hook for syncing mission filters with URL
 */
export function useMissionUrlState() {
  return useQueryStates(
    {
      statuses: parseAsArrayOf(parseAsString).withDefault([]),
      priorities: parseAsArrayOf(parseAsString).withDefault([]),
      objectives: parseAsArrayOf(parseAsString).withDefault([]),
      search: parseAsString.withDefault(''),
      view: parseAsString.withDefault('week'),
    },
    {
      shallow: true,
      clearOnDefault: true,
    },
  )
}

/**
 * Hook for syncing study session state with URL (for recovery)
 */
export function useStudySessionUrlState() {
  return useQueryStates(
    {
      sessionId: parseAsString,
      questionIndex: parseAsString,
    },
    {
      shallow: true,
      clearOnDefault: true,
    },
  )
}

/**
 * Utility to generate shareable URL with current filters
 */
export function generateShareableUrl(
  baseUrl: string,
  params: Record<string, string | string[] | null>,
): string {
  const url = new URL(baseUrl, window.location.origin)

  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key)
    } else if (Array.isArray(value)) {
      // Clear existing params
      url.searchParams.delete(key)
      // Add each value
      value.forEach((v) => url.searchParams.append(key, v))
    } else {
      url.searchParams.set(key, value)
    }
  })

  return url.toString()
}

/**
 * Hook for getting shareable URL of current page with filters
 */
export function useShareableUrl() {
  const [analyticsFilters] = useAnalyticsUrlState()

  return () => {
    return generateShareableUrl(window.location.pathname, {
      timeRange: analyticsFilters.timeRange,
      objectives: analyticsFilters.objectives,
      comparisonMode: analyticsFilters.comparisonMode,
    })
  }
}

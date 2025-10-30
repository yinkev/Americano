/**
 * Analytics Filters Hook
 *
 * Custom hook that combines Zustand store and URL state for analytics filters.
 * Provides a unified API for managing filter state with automatic URL synchronization.
 *
 * Features:
 * - Bi-directional sync (Store ↔ URL)
 * - Shareable URLs with filters
 * - Type-safe filter management
 * - Performance optimized with selectors
 */

'use client'

import { useCallback, useEffect } from 'react'
import type { ComparisonMode, TimeRange } from '@/stores/analytics'
import { useAnalyticsStore } from '@/stores/analytics'
import { useAnalyticsUrlState } from './use-url-state'

export function useAnalyticsFilters() {
  const [urlState, setUrlState] = useAnalyticsUrlState()

  // Store selectors
  const timeRange = useAnalyticsStore((state) => state.timeRange)
  const selectedObjectives = useAnalyticsStore((state) => state.selectedObjectives)
  const comparisonMode = useAnalyticsStore((state) => state.comparisonMode)

  // Store actions
  const setTimeRange = useAnalyticsStore((state) => state.setTimeRange)
  const setSelectedObjectives = useAnalyticsStore((state) => state.setSelectedObjectives)
  const setComparisonMode = useAnalyticsStore((state) => state.setComparisonMode)
  const resetFilters = useAnalyticsStore((state) => state.resetFilters)

  // Sync URL → Store on mount
  useEffect(() => {
    if (urlState.timeRange && urlState.timeRange !== timeRange) {
      setTimeRange(urlState.timeRange as TimeRange)
    }
    if (urlState.objectives.length > 0) {
      setSelectedObjectives(urlState.objectives)
    }
    if (urlState.comparisonMode && urlState.comparisonMode !== comparisonMode) {
      setComparisonMode(urlState.comparisonMode as ComparisonMode)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync Store → URL when store changes
  useEffect(() => {
    setUrlState({
      timeRange: timeRange,
      objectives: selectedObjectives,
      comparisonMode: comparisonMode,
    })
  }, [timeRange, selectedObjectives, comparisonMode, setUrlState])

  // Wrapped actions that update both store and URL
  const updateTimeRange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range)
    },
    [setTimeRange],
  )

  const updateObjectives = useCallback(
    (objectives: string[]) => {
      setSelectedObjectives(objectives)
    },
    [setSelectedObjectives],
  )

  const updateComparisonMode = useCallback(
    (mode: ComparisonMode) => {
      setComparisonMode(mode)
    },
    [setComparisonMode],
  )

  const reset = useCallback(() => {
    resetFilters()
    setUrlState({
      timeRange: null,
      objectives: null,
      comparisonMode: null,
    })
  }, [resetFilters, setUrlState])

  return {
    // Current state
    timeRange,
    selectedObjectives,
    comparisonMode,

    // Actions
    setTimeRange: updateTimeRange,
    setSelectedObjectives: updateObjectives,
    setComparisonMode: updateComparisonMode,
    resetFilters: reset,

    // Derived state
    hasActiveFilters: selectedObjectives.length > 0,
  }
}

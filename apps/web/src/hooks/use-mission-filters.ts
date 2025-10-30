/**
 * Mission Filters Hook
 *
 * Custom hook for managing mission filters with URL state synchronization.
 *
 * Features:
 * - Multi-filter support (status, priority, objectives, search)
 * - URL persistence for shareable links
 * - Active filter count
 * - Reset functionality
 */

'use client'

import { useCallback, useEffect } from 'react'
import type { MissionPriority, MissionStatus } from '@/stores/mission'
import { useMissionStore } from '@/stores/mission'
import { useMissionUrlState } from './use-url-state'

export function useMissionFilters() {
  const [urlState, setUrlState] = useMissionUrlState()

  // Store selectors
  const filters = useMissionStore((state) => state.filters)
  const activeFiltersCount = useMissionStore((state) => state.selectActiveFiltersCount)

  // Store actions
  const setStatusFilter = useMissionStore((state) => state.setStatusFilter)
  const setPriorityFilter = useMissionStore((state) => state.setPriorityFilter)
  const setObjectiveFilter = useMissionStore((state) => state.setObjectiveFilter)
  const setSearchQuery = useMissionStore((state) => state.setSearchQuery)
  const resetFilters = useMissionStore((state) => state.resetFilters)

  // Sync URL → Store on mount
  useEffect(() => {
    if (urlState.statuses.length > 0) {
      setStatusFilter(urlState.statuses as MissionStatus[])
    }
    if (urlState.priorities.length > 0) {
      setPriorityFilter(urlState.priorities as MissionPriority[])
    }
    if (urlState.objectives.length > 0) {
      setObjectiveFilter(urlState.objectives)
    }
    if (urlState.search) {
      setSearchQuery(urlState.search)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync Store → URL when filters change
  useEffect(() => {
    setUrlState({
      statuses: filters.statuses,
      priorities: filters.priorities,
      objectives: filters.objectives,
      search: filters.searchQuery || null,
    })
  }, [filters.statuses, filters.priorities, filters.objectives, filters.searchQuery, setUrlState])

  // Wrapped actions
  const updateStatuses = useCallback(
    (statuses: MissionStatus[]) => {
      setStatusFilter(statuses)
    },
    [setStatusFilter],
  )

  const updatePriorities = useCallback(
    (priorities: MissionPriority[]) => {
      setPriorityFilter(priorities)
    },
    [setPriorityFilter],
  )

  const updateObjectives = useCallback(
    (objectives: string[]) => {
      setObjectiveFilter(objectives)
    },
    [setObjectiveFilter],
  )

  const updateSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
    },
    [setSearchQuery],
  )

  const reset = useCallback(() => {
    resetFilters()
    setUrlState({
      statuses: null,
      priorities: null,
      objectives: null,
      search: null,
    })
  }, [resetFilters, setUrlState])

  return {
    // Current filters
    filters,

    // Individual filters
    statuses: filters.statuses,
    priorities: filters.priorities,
    objectives: filters.objectives,
    searchQuery: filters.searchQuery,
    dateRange: filters.dateRange,

    // Actions
    setStatuses: updateStatuses,
    setPriorities: updatePriorities,
    setObjectives: updateObjectives,
    setSearch: updateSearch,
    resetFilters: reset,

    // Derived state
    activeFiltersCount,
    hasActiveFilters: activeFiltersCount > 0,
  }
}

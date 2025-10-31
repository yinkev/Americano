/**
 * Mission Store
 *
 * Manages mission-related state including:
 * - Active mission tracking
 * - Mission calendar view preferences
 * - Mission filters
 * - Completion tracking
 *
 * Features:
 * - Persistence of user preferences
 * - Calendar view state management
 * - Filter state for mission lists
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type MissionStatus = 'not-started' | 'in-progress' | 'completed' | 'failed'
export type MissionPriority = 'low' | 'medium' | 'high' | 'urgent'
export type CalendarView = 'day' | 'week' | 'month' | 'agenda'
export type MissionSort = 'due-date' | 'priority' | 'status' | 'created-at'

interface Mission {
  id: string
  title: string
  description: string
  status: MissionStatus
  priority: MissionPriority
  dueDate: string | null
  startedAt: string | null
  completedAt: string | null
  objectiveIds: string[]
}

interface MissionFilters {
  statuses: MissionStatus[]
  priorities: MissionPriority[]
  objectives: string[]
  searchQuery: string
  dateRange: {
    start: string | null
    end: string | null
  }
}

interface MissionPreferences {
  calendarView: CalendarView
  defaultSort: MissionSort
  showCompletedMissions: boolean
  compactView: boolean
}

interface MissionState {
  // Active mission (session state)
  activeMissionId: string | null

  // Filters (session state)
  filters: MissionFilters

  // Preferences (persisted)
  preferences: MissionPreferences

  // Selectors
  selectActiveFiltersCount: number

  // Actions
  setActiveMission: (missionId: string | null) => void
  updateFilters: (filters: Partial<MissionFilters>) => void
  resetFilters: () => void
  setStatusFilter: (statuses: MissionStatus[]) => void
  setPriorityFilter: (priorities: MissionPriority[]) => void
  setObjectiveFilter: (objectives: string[]) => void
  setSearchQuery: (query: string) => void
  setDateRange: (start: string | null, end: string | null) => void
  updatePreferences: (preferences: Partial<MissionPreferences>) => void
  setCalendarView: (view: CalendarView) => void
  setDefaultSort: (sort: MissionSort) => void
  toggleCompletedMissions: () => void
  toggleCompactView: () => void
}

const defaultFilters: MissionFilters = {
  statuses: [],
  priorities: [],
  objectives: [],
  searchQuery: '',
  dateRange: {
    start: null,
    end: null,
  },
}

const defaultPreferences: MissionPreferences = {
  calendarView: 'week',
  defaultSort: 'due-date',
  showCompletedMissions: false,
  compactView: false,
}

export const useMissionStore = create<MissionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        activeMissionId: null,
        filters: defaultFilters,
        preferences: defaultPreferences,

        // Selectors
        get selectActiveFiltersCount() {
          const state = get()
          let count = 0
          if (state.filters.statuses.length > 0) count++
          if (state.filters.priorities.length > 0) count++
          if (state.filters.objectives.length > 0) count++
          if (state.filters.searchQuery.trim().length > 0) count++
          if (state.filters.dateRange.start || state.filters.dateRange.end) count++
          return count
        },

        // Mission actions
        setActiveMission: (activeMissionId) =>
          set({ activeMissionId }, false, 'mission/setActiveMission'),

        // Filter actions
        updateFilters: (filters) =>
          set(
            (state) => ({
              filters: { ...state.filters, ...filters },
            }),
            false,
            'mission/updateFilters',
          ),

        resetFilters: () => set({ filters: defaultFilters }, false, 'mission/resetFilters'),

        setStatusFilter: (statuses) =>
          set(
            (state) => ({
              filters: { ...state.filters, statuses },
            }),
            false,
            'mission/setStatusFilter',
          ),

        setPriorityFilter: (priorities) =>
          set(
            (state) => ({
              filters: { ...state.filters, priorities },
            }),
            false,
            'mission/setPriorityFilter',
          ),

        setObjectiveFilter: (objectives) =>
          set(
            (state) => ({
              filters: { ...state.filters, objectives },
            }),
            false,
            'mission/setObjectiveFilter',
          ),

        setSearchQuery: (searchQuery) =>
          set(
            (state) => ({
              filters: { ...state.filters, searchQuery },
            }),
            false,
            'mission/setSearchQuery',
          ),

        setDateRange: (start, end) =>
          set(
            (state) => ({
              filters: {
                ...state.filters,
                dateRange: { start, end },
              },
            }),
            false,
            'mission/setDateRange',
          ),

        // Preference actions
        updatePreferences: (preferences) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, ...preferences },
            }),
            false,
            'mission/updatePreferences',
          ),

        setCalendarView: (calendarView) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, calendarView },
            }),
            false,
            'mission/setCalendarView',
          ),

        setDefaultSort: (defaultSort) =>
          set(
            (state) => ({
              preferences: { ...state.preferences, defaultSort },
            }),
            false,
            'mission/setDefaultSort',
          ),

        toggleCompletedMissions: () =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                showCompletedMissions: !state.preferences.showCompletedMissions,
              },
            }),
            false,
            'mission/toggleCompletedMissions',
          ),

        toggleCompactView: () =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                compactView: !state.preferences.compactView,
              },
            }),
            false,
            'mission/toggleCompactView',
          ),
      }),
      {
        name: 'mission-storage',
        version: 1,
        // Only persist preferences
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      },
    ),
    {
      name: 'MissionStore',
      enabled: process.env.NODE_ENV === 'development',
    },
  ),
)

// Selectors
export const selectActiveMissionId = (state: MissionState) => state.activeMissionId
export const selectFilters = (state: MissionState) => state.filters
export const selectActiveFiltersCount = (state: MissionState) => {
  const { statuses, priorities, objectives, searchQuery, dateRange } = state.filters
  let count = 0
  if (statuses.length > 0) count++
  if (priorities.length > 0) count++
  if (objectives.length > 0) count++
  if (searchQuery.trim() !== '') count++
  if (dateRange.start || dateRange.end) count++
  return count
}
export const selectPreferences = (state: MissionState) => state.preferences
export const selectCalendarView = (state: MissionState) => state.preferences.calendarView

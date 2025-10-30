/**
 * Library Store
 *
 * State management for lecture library
 * - View mode (grid/list)
 * - Sort and filter preferences
 * - Selected lectures for bulk actions
 * - Upload preferences
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * View mode
 */
export type LibraryViewMode = 'grid' | 'list'

/**
 * Sort option
 */
export type LibrarySortOption =
  | 'uploadedAt'
  | 'title'
  | 'weekNumber'
  | 'processedAt'
  | 'objectiveCount'
  | 'cardCount'

/**
 * Sort order
 */
export type LibrarySortOrder = 'asc' | 'desc'

/**
 * Library filters
 */
export interface LibraryFilters {
  courseId?: string
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'all'
  tags?: string[]
  weekNumber?: number
}

/**
 * Library preferences
 */
export interface LibraryPreferences {
  viewMode: LibraryViewMode
  sortBy: LibrarySortOption
  sortOrder: LibrarySortOrder
  gridColumns: number
  showThumbnails: boolean
  showStats: boolean
  compactMode: boolean
}

/**
 * Library store state
 */
export interface LibraryState {
  // View state
  preferences: LibraryPreferences
  filters: LibraryFilters
  searchQuery: string

  // Selection
  selectedLectureIds: Set<string>

  // Actions
  setViewMode: (mode: LibraryViewMode) => void
  setSortBy: (sortBy: LibrarySortOption) => void
  setSortOrder: (order: LibrarySortOrder) => void
  setGridColumns: (columns: number) => void
  toggleShowThumbnails: () => void
  toggleShowStats: () => void
  toggleCompactMode: () => void

  // Filter actions
  setFilters: (filters: Partial<LibraryFilters>) => void
  resetFilters: () => void
  setSearchQuery: (query: string) => void

  // Selection actions
  selectLecture: (id: string) => void
  deselectLecture: (id: string) => void
  toggleLectureSelection: (id: string) => void
  selectAllLectures: (ids: string[]) => void
  clearSelection: () => void

  // Reset
  resetPreferences: () => void
}

/**
 * Default preferences
 */
const defaultPreferences: LibraryPreferences = {
  viewMode: 'list',
  sortBy: 'uploadedAt',
  sortOrder: 'desc',
  gridColumns: 3,
  showThumbnails: true,
  showStats: true,
  compactMode: false,
}

/**
 * Default filters
 */
const defaultFilters: LibraryFilters = {
  status: 'all',
}

/**
 * Library store
 */
export const useLibraryStore = create<LibraryState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        preferences: defaultPreferences,
        filters: defaultFilters,
        searchQuery: '',
        selectedLectureIds: new Set(),

        // Preference actions
        setViewMode: (viewMode) =>
          set((state) => ({
            preferences: { ...state.preferences, viewMode },
          })),

        setSortBy: (sortBy) =>
          set((state) => ({
            preferences: { ...state.preferences, sortBy },
          })),

        setSortOrder: (sortOrder) =>
          set((state) => ({
            preferences: { ...state.preferences, sortOrder },
          })),

        setGridColumns: (gridColumns) =>
          set((state) => ({
            preferences: { ...state.preferences, gridColumns },
          })),

        toggleShowThumbnails: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              showThumbnails: !state.preferences.showThumbnails,
            },
          })),

        toggleShowStats: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              showStats: !state.preferences.showStats,
            },
          })),

        toggleCompactMode: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              compactMode: !state.preferences.compactMode,
            },
          })),

        // Filter actions
        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
          })),

        resetFilters: () => set({ filters: defaultFilters }),

        setSearchQuery: (searchQuery) => set({ searchQuery }),

        // Selection actions
        selectLecture: (id) =>
          set((state) => {
            const newSelection = new Set(state.selectedLectureIds)
            newSelection.add(id)
            return { selectedLectureIds: newSelection }
          }),

        deselectLecture: (id) =>
          set((state) => {
            const newSelection = new Set(state.selectedLectureIds)
            newSelection.delete(id)
            return { selectedLectureIds: newSelection }
          }),

        toggleLectureSelection: (id) =>
          set((state) => {
            const newSelection = new Set(state.selectedLectureIds)
            if (newSelection.has(id)) {
              newSelection.delete(id)
            } else {
              newSelection.add(id)
            }
            return { selectedLectureIds: newSelection }
          }),

        selectAllLectures: (ids) =>
          set({ selectedLectureIds: new Set(ids) }),

        clearSelection: () => set({ selectedLectureIds: new Set() }),

        // Reset
        resetPreferences: () => set({ preferences: defaultPreferences }),
      }),
      {
        name: 'library-store',
        partialize: (state) => ({
          preferences: state.preferences,
          filters: state.filters,
        }),
      }
    )
  )
)

/**
 * Selectors
 */
export const selectLibraryPreferences = (state: LibraryState) => state.preferences
export const selectViewMode = (state: LibraryState) => state.preferences.viewMode
export const selectSortBy = (state: LibraryState) => state.preferences.sortBy
export const selectSortOrder = (state: LibraryState) => state.preferences.sortOrder
export const selectLibraryFilters = (state: LibraryState) => state.filters
export const selectSearchQuery = (state: LibraryState) => state.searchQuery
export const selectSelectedLectureIds = (state: LibraryState) => state.selectedLectureIds
export const selectSelectedCount = (state: LibraryState) => state.selectedLectureIds.size
export const selectIsLectureSelected = (state: LibraryState, id: string) =>
  state.selectedLectureIds.has(id)

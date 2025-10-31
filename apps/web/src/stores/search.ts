/**
 * Search Store
 *
 * State management for semantic search functionality
 * - Search history and saved searches
 * - Recent searches with timestamps
 * - Search filters and preferences
 * - Result highlighting and display preferences
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Search result type
 */
export type SearchResultType = 'lecture' | 'objective' | 'flashcard' | 'concept' | 'all'

/**
 * Sort option
 */
export type SearchSortOption = 'relevance' | 'date' | 'title'

/**
 * Recent search entry
 */
export interface RecentSearch {
  id: string
  query: string
  timestamp: number
  resultCount: number
  filters?: {
    type?: SearchResultType
    courseId?: string
  }
}

/**
 * Saved search entry
 */
export interface SavedSearchEntry {
  id: string
  name: string
  query: string
  filters: {
    type?: SearchResultType
    courseId?: string
  }
  createdAt: number
  lastUsed?: number
  useCount: number
}

/**
 * Search preferences
 */
export interface SearchPreferences {
  highlightMatches: boolean
  showSnippets: boolean
  snippetLength: number
  resultsPerPage: number
  sortBy: SearchSortOption
  autoSearch: boolean
  minQueryLength: number
}

/**
 * Search filters
 */
export interface SearchFilters {
  type: SearchResultType
  courseId?: string
  dateFrom?: string
  dateTo?: string
}

/**
 * Search store state
 */
export interface SearchState {
  // Current search
  query: string
  filters: SearchFilters
  isSearching: boolean

  // History
  recentSearches: RecentSearch[]
  savedSearches: SavedSearchEntry[]

  // Preferences
  preferences: SearchPreferences

  // Actions
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchFilters>) => void
  setIsSearching: (isSearching: boolean) => void

  // History actions
  addRecentSearch: (search: Omit<RecentSearch, 'id' | 'timestamp'>) => void
  clearRecentSearches: () => void
  removeRecentSearch: (id: string) => void

  // Saved search actions
  saveSearch: (name: string, query: string, filters: SearchFilters) => void
  loadSavedSearch: (id: string) => void
  removeSavedSearch: (id: string) => void
  updateSavedSearchUsage: (id: string) => void

  // Preference actions
  setHighlightMatches: (highlight: boolean) => void
  setShowSnippets: (show: boolean) => void
  setSnippetLength: (length: number) => void
  setResultsPerPage: (count: number) => void
  setSortBy: (sortBy: SearchSortOption) => void
  setAutoSearch: (auto: boolean) => void
  setMinQueryLength: (length: number) => void

  // Reset
  resetFilters: () => void
  resetPreferences: () => void
}

/**
 * Default preferences
 */
const defaultPreferences: SearchPreferences = {
  highlightMatches: true,
  showSnippets: true,
  snippetLength: 150,
  resultsPerPage: 20,
  sortBy: 'relevance',
  autoSearch: true,
  minQueryLength: 2,
}

/**
 * Default filters
 */
const defaultFilters: SearchFilters = {
  type: 'all',
}

/**
 * Search store
 */
export const useSearchStore = create<SearchState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        query: '',
        filters: defaultFilters,
        isSearching: false,
        recentSearches: [],
        savedSearches: [],
        preferences: defaultPreferences,

        // Actions
        setQuery: (query) => set({ query }),

        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters },
          })),

        setIsSearching: (isSearching) => set({ isSearching }),

        // History actions
        addRecentSearch: (search) =>
          set((state) => {
            const newSearch: RecentSearch = {
              ...search,
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
            }

            // Remove duplicates and limit to 20
            const filtered = state.recentSearches.filter((s) => s.query !== search.query)
            return {
              recentSearches: [newSearch, ...filtered].slice(0, 20),
            }
          }),

        clearRecentSearches: () => set({ recentSearches: [] }),

        removeRecentSearch: (id) =>
          set((state) => ({
            recentSearches: state.recentSearches.filter((s) => s.id !== id),
          })),

        // Saved search actions
        saveSearch: (name, query, filters) =>
          set((state) => {
            const newSearch: SavedSearchEntry = {
              id: `${Date.now()}-${Math.random()}`,
              name,
              query,
              // Ensure required keys (like `type`) are present when persisting
              filters: { ...defaultFilters, ...filters },
              createdAt: Date.now(),
              useCount: 0,
            }

            return {
              savedSearches: [newSearch, ...state.savedSearches],
            }
          }),

        loadSavedSearch: (id) => {
          const search = get().savedSearches.find((s) => s.id === id)
          if (search) {
            set({
              query: search.query,
              // Merge defaults to satisfy `SearchFilters` requirements
              filters: { ...defaultFilters, ...search.filters },
            })
            get().updateSavedSearchUsage(id)
          }
        },

        removeSavedSearch: (id) =>
          set((state) => ({
            savedSearches: state.savedSearches.filter((s) => s.id !== id),
          })),

        updateSavedSearchUsage: (id) =>
          set((state) => ({
            savedSearches: state.savedSearches.map((s) =>
              s.id === id
                ? {
                    ...s,
                    lastUsed: Date.now(),
                    useCount: s.useCount + 1,
                  }
                : s
            ),
          })),

        // Preference actions
        setHighlightMatches: (highlightMatches) =>
          set((state) => ({
            preferences: { ...state.preferences, highlightMatches },
          })),

        setShowSnippets: (showSnippets) =>
          set((state) => ({
            preferences: { ...state.preferences, showSnippets },
          })),

        setSnippetLength: (snippetLength) =>
          set((state) => ({
            preferences: { ...state.preferences, snippetLength },
          })),

        setResultsPerPage: (resultsPerPage) =>
          set((state) => ({
            preferences: { ...state.preferences, resultsPerPage },
          })),

        setSortBy: (sortBy) =>
          set((state) => ({
            preferences: { ...state.preferences, sortBy },
          })),

        setAutoSearch: (autoSearch) =>
          set((state) => ({
            preferences: { ...state.preferences, autoSearch },
          })),

        setMinQueryLength: (minQueryLength) =>
          set((state) => ({
            preferences: { ...state.preferences, minQueryLength },
          })),

        // Reset
        resetFilters: () => set({ filters: defaultFilters }),

        resetPreferences: () => set({ preferences: defaultPreferences }),
      }),
      {
        name: 'search-store',
        partialize: (state) => ({
          recentSearches: state.recentSearches,
          savedSearches: state.savedSearches,
          preferences: state.preferences,
        }),
      }
    )
  )
)

/**
 * Selectors
 */
export const selectSearchQuery = (state: SearchState) => state.query
export const selectSearchFilters = (state: SearchState) => state.filters
export const selectIsSearching = (state: SearchState) => state.isSearching
export const selectRecentSearches = (state: SearchState) => state.recentSearches
export const selectSavedSearches = (state: SearchState) => state.savedSearches
export const selectSearchPreferences = (state: SearchState) => state.preferences
export const selectTopRecentSearches = (state: SearchState, limit: number = 5) =>
  state.recentSearches.slice(0, limit)
export const selectPopularSavedSearches = (state: SearchState, limit: number = 5) =>
  state.savedSearches
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit)

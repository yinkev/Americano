/**
 * Graph Store
 *
 * State management for knowledge graph visualization
 * - Graph layout settings (force, hierarchical, circular)
 * - Zoom and pan state
 * - Node filtering and focus
 * - Export preferences
 * - Search history and saved searches
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Graph layout types
 */
export type GraphLayout = 'force' | 'hierarchical' | 'circular' | 'radial'

/**
 * Graph view mode
 */
export type GraphViewMode = '2d' | '3d'

/**
 * Export format
 */
export type GraphExportFormat = 'png' | 'svg' | 'json'

/**
 * Node category filter
 */
export interface NodeCategoryFilter {
  category: string
  enabled: boolean
}

/**
 * Relationship filter
 */
export interface RelationshipFilter {
  type: string
  enabled: boolean
}

/**
 * Saved search
 */
export interface SavedSearch {
  id: string
  name: string
  query: string
  timestamp: number
  resultCount: number
  useCount: number
  lastUsed?: number
}

/**
 * Graph preferences
 */
export interface GraphPreferences {
  layout: GraphLayout
  viewMode: GraphViewMode
  showLabels: boolean
  showRelationships: boolean
  nodeSize: number
  linkDistance: number
  linkStrength: number
  chargeStrength: number
  animationSpeed: number
  highlightConnected: boolean
  dimUnrelated: boolean
}

/**
 * Zoom state
 */
export interface ZoomState {
  scale: number
  x: number
  y: number
}

/**
 * Graph store state
 */
export interface GraphState {
  // Preferences
  preferences: GraphPreferences

  // View state
  zoomState: ZoomState
  focusedNodeIds: string[]
  selectedNodeId: string | null

  // Filters
  categoryFilters: NodeCategoryFilter[]
  relationshipFilters: RelationshipFilter[]

  // Search
  searchQuery: string
  searchHistory: string[]
  savedSearches: SavedSearch[]

  // Export
  lastExportFormat: GraphExportFormat

  // Actions
  setLayout: (layout: GraphLayout) => void
  setViewMode: (mode: GraphViewMode) => void
  setZoomState: (state: ZoomState) => void
  setFocusedNodes: (nodeIds: string[]) => void
  setSelectedNode: (nodeId: string | null) => void
  toggleNodeLabel: () => void
  toggleRelationships: () => void
  setNodeSize: (size: number) => void
  setLinkDistance: (distance: number) => void
  setLinkStrength: (strength: number) => void
  setChargeStrength: (strength: number) => void
  setAnimationSpeed: (speed: number) => void
  toggleHighlightConnected: () => void
  toggleDimUnrelated: () => void

  // Filter actions
  setCategoryFilters: (filters: NodeCategoryFilter[]) => void
  toggleCategoryFilter: (category: string) => void
  setRelationshipFilters: (filters: RelationshipFilter[]) => void
  toggleRelationshipFilter: (type: string) => void
  resetFilters: () => void

  // Search actions
  setSearchQuery: (query: string) => void
  addToSearchHistory: (query: string) => void
  clearSearchHistory: () => void
  saveSearch: (query: string, resultCount: number) => void
  removeSavedSearch: (id: string) => void

  // Export actions
  setLastExportFormat: (format: GraphExportFormat) => void

  // Reset
  resetPreferences: () => void
}

/**
 * Default preferences
 */
const defaultPreferences: GraphPreferences = {
  layout: 'force',
  viewMode: '2d',
  showLabels: true,
  showRelationships: true,
  nodeSize: 8,
  linkDistance: 100,
  linkStrength: 0.5,
  chargeStrength: -300,
  animationSpeed: 1,
  highlightConnected: true,
  dimUnrelated: true,
}

/**
 * Default zoom state
 */
const defaultZoomState: ZoomState = {
  scale: 1,
  x: 0,
  y: 0,
}

/**
 * Graph store
 */
export const useGraphStore = create<GraphState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        preferences: defaultPreferences,
        zoomState: defaultZoomState,
        focusedNodeIds: [],
        selectedNodeId: null,
        categoryFilters: [],
        relationshipFilters: [],
        searchQuery: '',
        searchHistory: [],
        savedSearches: [],
        lastExportFormat: 'png',

        // Preference actions
        setLayout: (layout) =>
          set((state) => ({
            preferences: { ...state.preferences, layout },
          })),

        setViewMode: (viewMode) =>
          set((state) => ({
            preferences: { ...state.preferences, viewMode },
          })),

        setZoomState: (zoomState) => set({ zoomState }),

        setFocusedNodes: (focusedNodeIds) => set({ focusedNodeIds }),

        setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),

        toggleNodeLabel: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              showLabels: !state.preferences.showLabels,
            },
          })),

        toggleRelationships: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              showRelationships: !state.preferences.showRelationships,
            },
          })),

        setNodeSize: (nodeSize) =>
          set((state) => ({
            preferences: { ...state.preferences, nodeSize },
          })),

        setLinkDistance: (linkDistance) =>
          set((state) => ({
            preferences: { ...state.preferences, linkDistance },
          })),

        setLinkStrength: (linkStrength) =>
          set((state) => ({
            preferences: { ...state.preferences, linkStrength },
          })),

        setChargeStrength: (chargeStrength) =>
          set((state) => ({
            preferences: { ...state.preferences, chargeStrength },
          })),

        setAnimationSpeed: (animationSpeed) =>
          set((state) => ({
            preferences: { ...state.preferences, animationSpeed },
          })),

        toggleHighlightConnected: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              highlightConnected: !state.preferences.highlightConnected,
            },
          })),

        toggleDimUnrelated: () =>
          set((state) => ({
            preferences: {
              ...state.preferences,
              dimUnrelated: !state.preferences.dimUnrelated,
            },
          })),

        // Filter actions
        setCategoryFilters: (categoryFilters) => set({ categoryFilters }),

        toggleCategoryFilter: (category) =>
          set((state) => {
            const filters = state.categoryFilters.map((f) =>
              f.category === category ? { ...f, enabled: !f.enabled } : f
            )
            return { categoryFilters: filters }
          }),

        setRelationshipFilters: (relationshipFilters) => set({ relationshipFilters }),

        toggleRelationshipFilter: (type) =>
          set((state) => {
            const filters = state.relationshipFilters.map((f) =>
              f.type === type ? { ...f, enabled: !f.enabled } : f
            )
            return { relationshipFilters: filters }
          }),

        resetFilters: () =>
          set((state) => ({
            categoryFilters: state.categoryFilters.map((f) => ({ ...f, enabled: true })),
            relationshipFilters: state.relationshipFilters.map((f) => ({ ...f, enabled: true })),
          })),

        // Search actions
        setSearchQuery: (searchQuery) => set({ searchQuery }),

        addToSearchHistory: (query) =>
          set((state) => {
            const history = [query, ...state.searchHistory.filter((q) => q !== query)].slice(0, 10)
            return { searchHistory: history }
          }),

        clearSearchHistory: () => set({ searchHistory: [] }),

        saveSearch: (query, resultCount) =>
          set((state) => {
            const newSearch: SavedSearch = {
              id: `${Date.now()}-${Math.random()}`,
              name: query,
              query,
              resultCount,
              timestamp: Date.now(),
              useCount: 1,
              lastUsed: Date.now(),
            }
            return {
              savedSearches: [newSearch, ...state.savedSearches].slice(0, 20),
            }
          }),

        removeSavedSearch: (id) =>
          set((state) => ({
            savedSearches: state.savedSearches.filter((s) => s.id !== id),
          })),

        // Export actions
        setLastExportFormat: (lastExportFormat) => set({ lastExportFormat }),

        // Reset
        resetPreferences: () =>
          set({
            preferences: defaultPreferences,
            zoomState: defaultZoomState,
          }),
      }),
      {
        name: 'graph-store',
        partialize: (state) => ({
          preferences: state.preferences,
          searchHistory: state.searchHistory,
          savedSearches: state.savedSearches,
          lastExportFormat: state.lastExportFormat,
        }),
      }
    )
  )
)

/**
 * Selectors
 */
export const selectGraphPreferences = (state: GraphState) => state.preferences
export const selectGraphLayout = (state: GraphState) => state.preferences.layout
export const selectGraphViewMode = (state: GraphState) => state.preferences.viewMode
export const selectZoomState = (state: GraphState) => state.zoomState
export const selectFocusedNodes = (state: GraphState) => state.focusedNodeIds
export const selectSelectedNode = (state: GraphState) => state.selectedNodeId
export const selectCategoryFilters = (state: GraphState) => state.categoryFilters
export const selectRelationshipFilters = (state: GraphState) => state.relationshipFilters
export const selectSearchQuery = (state: GraphState) => state.searchQuery
export const selectSearchHistory = (state: GraphState) => state.searchHistory
export const selectSavedSearches = (state: GraphState) => state.savedSearches
export const selectActiveCategoryFilters = (state: GraphState) =>
  state.categoryFilters.filter((f) => f.enabled).map((f) => f.category)
export const selectActiveRelationshipFilters = (state: GraphState) =>
  state.relationshipFilters.filter((f) => f.enabled).map((f) => f.type)

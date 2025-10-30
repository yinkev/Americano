/**
 * Graph Cache Store
 *
 * Story 3.2 Task 8.1: Zustand store for knowledge graph caching
 *
 * Features:
 * - Caches graph nodes and edges with 5-minute TTL
 * - Tracks last fetch timestamp for invalidation
 * - Provides cache refresh and invalidation methods
 * - Performance metrics tracking
 *
 * Cache invalidation triggers:
 * - New lecture upload
 * - Relationship creation
 * - Manual refresh
 * - TTL expiration (5 minutes)
 */

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Graph node structure matching API response
 */
export type GraphNode = {
  id: string
  name: string
  description: string | null
  category: string | null
  relationshipCount: number
}

/**
 * Graph edge structure matching API response
 */
export type GraphEdge = {
  id: string
  fromConceptId: string
  toConceptId: string
  relationship: string
  strength: number
  isUserDefined: boolean
}

/**
 * Performance metrics for graph operations
 */
export type GraphPerformanceMetrics = {
  lastLoadTime: number | null // milliseconds
  lastRenderTime: number | null // milliseconds
  nodeCount: number
  edgeCount: number
  averageFPS: number | null
}

/**
 * Graph cache store state
 */
type GraphCacheState = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  lastFetchedAt: number | null
  isLoading: boolean
  error: string | null
  totalCount: number
  currentOffset: number
  hasMore: boolean
  performanceMetrics: GraphPerformanceMetrics
}

/**
 * Graph cache store actions
 */
type GraphCacheActions = {
  setGraphData: (data: {
    nodes: GraphNode[]
    edges: GraphEdge[]
    total: number
    offset?: number
    hasMore?: boolean
  }) => void
  appendGraphData: (data: { nodes: GraphNode[]; edges: GraphEdge[]; total: number }) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  invalidateCache: () => void
  isCacheValid: () => boolean
  updatePerformanceMetrics: (metrics: Partial<GraphPerformanceMetrics>) => void
  resetCache: () => void
}

/**
 * Complete graph cache store type
 */
export type GraphCacheStore = GraphCacheState & GraphCacheActions

/**
 * Cache TTL: 5 minutes
 */
const CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Initial state
 */
const initialState: GraphCacheState = {
  nodes: [],
  edges: [],
  lastFetchedAt: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentOffset: 0,
  hasMore: false,
  performanceMetrics: {
    lastLoadTime: null,
    lastRenderTime: null,
    nodeCount: 0,
    edgeCount: 0,
    averageFPS: null,
  },
}

/**
 * Graph cache Zustand store
 *
 * Uses persist middleware to store cache in sessionStorage
 * (cleared when browser tab closes, persists during navigation)
 */
export const useGraphCache = create<GraphCacheStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Set graph data (replaces existing cache)
       */
      setGraphData: (data) => {
        const now = Date.now()
        set({
          nodes: data.nodes,
          edges: data.edges,
          totalCount: data.total,
          currentOffset: data.offset ?? 0,
          hasMore: data.hasMore ?? false,
          lastFetchedAt: now,
          error: null,
          performanceMetrics: {
            ...get().performanceMetrics,
            nodeCount: data.nodes.length,
            edgeCount: data.edges.length,
          },
        })
      },

      /**
       * Append graph data (for pagination)
       */
      appendGraphData: (data) => {
        const state = get()
        const newOffset = state.currentOffset + data.nodes.length
        set({
          nodes: [...state.nodes, ...data.nodes],
          edges: [...state.edges, ...data.edges],
          totalCount: data.total,
          currentOffset: newOffset,
          hasMore: newOffset < data.total,
          lastFetchedAt: Date.now(),
          error: null,
          performanceMetrics: {
            ...state.performanceMetrics,
            nodeCount: state.nodes.length + data.nodes.length,
            edgeCount: state.edges.length + data.edges.length,
          },
        })
      },

      /**
       * Set loading state
       */
      setLoading: (loading) => set({ isLoading: loading }),

      /**
       * Set error state
       */
      setError: (error) => set({ error, isLoading: false }),

      /**
       * Invalidate cache (forces refetch on next access)
       */
      invalidateCache: () => {
        set({
          lastFetchedAt: null,
          nodes: [],
          edges: [],
          currentOffset: 0,
          hasMore: false,
          error: null,
        })
      },

      /**
       * Check if cache is still valid (within TTL)
       */
      isCacheValid: () => {
        const { lastFetchedAt } = get()
        if (!lastFetchedAt) return false
        return Date.now() - lastFetchedAt < CACHE_TTL_MS
      },

      /**
       * Update performance metrics
       */
      updatePerformanceMetrics: (metrics) => {
        set({
          performanceMetrics: {
            ...get().performanceMetrics,
            ...metrics,
          },
        })
      },

      /**
       * Reset cache to initial state
       */
      resetCache: () => set(initialState),
    }),
    {
      name: 'americano-graph-cache',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist essential data, not loading/error states
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        lastFetchedAt: state.lastFetchedAt,
        totalCount: state.totalCount,
        currentOffset: state.currentOffset,
        hasMore: state.hasMore,
        performanceMetrics: state.performanceMetrics,
      }),
    },
  ),
)

/**
 * Hook to invalidate graph cache on specific events
 *
 * Usage in components that trigger cache invalidation:
 * ```tsx
 * const invalidateCache = useGraphCacheInvalidation()
 *
 * // After lecture upload or relationship creation:
 * await uploadLecture(...)
 * invalidateCache()
 * ```
 */
export function useGraphCacheInvalidation() {
  const invalidateCache = useGraphCache((state) => state.invalidateCache)
  return invalidateCache
}

/**
 * Hook to check cache validity and trigger refetch if needed
 *
 * Usage:
 * ```tsx
 * const shouldRefetch = useGraphCacheShouldRefetch()
 * if (shouldRefetch) {
 *   // Fetch new data
 * }
 * ```
 */
export function useGraphCacheShouldRefetch() {
  const isCacheValid = useGraphCache((state) => state.isCacheValid())
  return !isCacheValid
}

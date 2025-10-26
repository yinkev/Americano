/**
 * GraphPageClient - Client component for knowledge graph page
 *
 * Story 3.2 Task 4.1 & 4.5: Interactive graph with data fetching
 * Story 3.2 Task 8: Performance optimization and real-time updates
 *
 * Features:
 * - Zustand caching with 5-minute TTL (Task 8.1)
 * - Pagination for large graphs - 100 node limit (Task 8.2)
 * - Real-time polling every 30s (Task 8.3)
 * - Graph export functionality (Task 8.4)
 * - Performance metrics tracking
 *
 * Handles:
 * - Data fetching from /api/graph/concepts
 * - State management for selected concept
 * - Node click handlers for drill-down navigation
 * - Empty state when no concepts exist
 * - Error handling
 */

'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import KnowledgeGraph, { type GraphNode, type GraphEdge } from '@/components/graph/knowledge-graph'
import { useGraphCache } from '@/lib/graph-cache'
import GraphUpdateNotification from '@/components/graph/graph-update-notification'
import GraphExport from '@/components/graph/graph-export'
import GraphFilters, { type GraphFilters as GraphFiltersType } from '@/components/graph/graph-filters'
import GraphSearch, { type ConceptSearchResult } from '@/components/graph/graph-search'
import GraphStats from '@/components/graph/graph-stats'

/**
 * API response type
 */
type GraphApiResponse = {
  success: boolean
  data?: {
    nodes: GraphNode[]
    edges: GraphEdge[]
    total: number
  }
  error?: {
    code: string
    message: string
  }
}

/**
 * Pagination configuration
 */
const INITIAL_NODE_LIMIT = 100 // AC: Task 8.2 - Limit initial render to 100 nodes
const POLLING_INTERVAL_MS = 30000 // AC: Task 8.3 - Poll every 30s

/**
 * GraphPageClient Component
 */
export default function GraphPageClient() {
  // Zustand cache store
  const {
    nodes: cachedNodes,
    edges: cachedEdges,
    totalCount,
    hasMore,
    currentOffset,
    isLoading: cacheLoading,
    error: cacheError,
    lastFetchedAt,
    isCacheValid,
    setGraphData,
    appendGraphData,
    setLoading: setCacheLoading,
    setError: setCacheError,
    updatePerformanceMetrics,
  } = useGraphCache()

  // Local state
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [conceptDetail, setConceptDetail] = useState<any>(null)
  const [showUpdateNotification, setShowUpdateNotification] = useState(false)
  const [newDataAvailable, setNewDataAvailable] = useState(false)
  const [filters, setFilters] = useState<GraphFiltersType>({ categories: [], relationshipTypes: [] })
  const [searchResults, setSearchResults] = useState<ConceptSearchResult[]>([])
  const [focusedNodeIds, setFocusedNodeIds] = useState<string[]>([])

  // Refs for polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastKnownCountRef = useRef<number>(totalCount)

  /**
   * Fetch graph data from API
   */
  const fetchGraphData = useCallback(
    async (offset = 0, append = false) => {
      try {
        if (!append) {
          setCacheLoading(true)
        }
        setCacheError(null)

        const startTime = performance.now()
        const response = await fetch(`/api/graph/concepts?limit=${INITIAL_NODE_LIMIT}&offset=${offset}`)
        const data: GraphApiResponse = await response.json()
        const loadTime = performance.now() - startTime

        if (!response.ok || !data.success) {
          throw new Error(data.error?.message || 'Failed to fetch graph data')
        }

        if (data.data) {
          if (append) {
            appendGraphData({
              nodes: data.data.nodes,
              edges: data.data.edges,
              total: data.data.total,
            })
          } else {
            setGraphData({
              nodes: data.data.nodes,
              edges: data.data.edges,
              total: data.data.total,
              offset: offset,
              hasMore: offset + data.data.nodes.length < data.data.total,
            })
          }

          // Update performance metrics
          updatePerformanceMetrics({
            lastLoadTime: loadTime,
            nodeCount: data.data.nodes.length,
            edgeCount: data.data.edges.length,
          })

          // Update last known count for polling comparison
          lastKnownCountRef.current = data.data.total
        }
      } catch (err) {
        console.error('Failed to fetch graph data:', err)
        setCacheError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        if (!append) {
          setCacheLoading(false)
        }
      }
    },
    [setCacheLoading, setCacheError, setGraphData, appendGraphData, updatePerformanceMetrics]
  )

  /**
   * Initial data fetch - use cache if valid, otherwise fetch fresh
   * Task 8.1: Cache-first strategy with 5-minute TTL
   */
  useEffect(() => {
    // Check if cache is valid
    if (cachedNodes.length > 0 && isCacheValid()) {
      // Cache hit - use cached data
      console.log('[Graph Cache] Using cached data')
      setCacheLoading(false)
      return
    }

    // Cache miss or stale - fetch fresh data
    console.log('[Graph Cache] Fetching fresh data')
    fetchGraphData(0, false)
  }, []) // Empty deps - only run once on mount

  /**
   * Polling for real-time updates
   * Task 8.3: Poll every 30s to check for new data
   */
  useEffect(() => {
    // Only start polling if we have data and cache is valid
    if (cachedNodes.length === 0 || !isCacheValid()) {
      return
    }

    const checkForUpdates = async () => {
      try {
        // Quick check: just get the total count
        const response = await fetch('/api/graph/concepts?limit=1')
        const data: GraphApiResponse = await response.json()

        if (data.success && data.data) {
          const currentCount = data.data.total

          // Compare with last known count
          if (currentCount !== lastKnownCountRef.current) {
            console.log('[Graph Polling] New data detected:', currentCount, 'vs', lastKnownCountRef.current)
            setNewDataAvailable(true)
            setShowUpdateNotification(true)
          }
        }
      } catch (err) {
        console.error('[Graph Polling] Failed to check for updates:', err)
      }
    }

    // Start polling
    pollingIntervalRef.current = setInterval(checkForUpdates, POLLING_INTERVAL_MS)

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [cachedNodes.length, isCacheValid])

  /**
   * Handle "Load More" button click
   * Task 8.2: Pagination for large graphs
   */
  const handleLoadMore = useCallback(() => {
    if (!hasMore || cacheLoading) {
      return
    }

    const nextOffset = currentOffset + INITIAL_NODE_LIMIT
    fetchGraphData(nextOffset, true)
  }, [hasMore, cacheLoading, currentOffset, fetchGraphData])

  /**
   * Handle refresh button click from notification
   * Task 8.3: Refresh graph with new data
   */
  const handleRefreshGraph = useCallback(() => {
    setShowUpdateNotification(false)
    setNewDataAvailable(false)
    fetchGraphData(0, false)
  }, [fetchGraphData])

  /**
   * Handle node click - fetch concept details
   */
  const handleNodeClick = useCallback(async (nodeId: string) => {
    setSelectedConceptId(nodeId)

    try {
      const response = await fetch(`/api/graph/concepts/${nodeId}`)
      const data = await response.json()

      if (response.ok && data.success) {
        setConceptDetail(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch concept details:', err)
    }
  }, [])

  /**
   * Handle node double-click - drill down to subgraph (future enhancement)
   */
  const handleNodeDoubleClick = useCallback(async (nodeId: string) => {
    // TODO: Implement drill-down functionality
    // Fetch related concepts at depth 2 and filter graph
    console.log('Drill down into concept:', nodeId)
  }, [])

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((newFilters: GraphFiltersType) => {
    setFilters(newFilters)
    // Clear search when filters change
    setSearchResults([])
    setFocusedNodeIds([])
  }, [])

  /**
   * Handle search results
   */
  const handleSearchResults = useCallback((results: ConceptSearchResult[]) => {
    setSearchResults(results)
    // Focus on search result nodes
    const nodeIds = results.map(r => r.id)
    setFocusedNodeIds(nodeIds)
  }, [])

  /**
   * Handle clear search
   */
  const handleClearSearch = useCallback(() => {
    setSearchResults([])
    setFocusedNodeIds([])
  }, [])

  /**
   * Handle reset focus (show full graph)
   */
  const handleResetFocus = useCallback(() => {
    setFocusedNodeIds([])
    setSearchResults([])
  }, [])

  /**
   * Apply filters to nodes and edges
   */
  const filteredData = useMemo(() => {
    let nodes = cachedNodes
    let edges = cachedEdges

    // Apply category filters
    if (filters.categories.length > 0) {
      nodes = nodes.filter(node =>
        node.category && filters.categories.includes(node.category)
      )
      const nodeIds = new Set(nodes.map(n => n.id))
      edges = edges.filter(edge =>
        nodeIds.has(edge.fromConceptId) && nodeIds.has(edge.toConceptId)
      )
    }

    // Apply relationship type filters
    if (filters.relationshipTypes.length > 0) {
      edges = edges.filter(edge =>
        filters.relationshipTypes.includes(edge.relationship)
      )
    }

    return { nodes, edges }
  }, [cachedNodes, cachedEdges, filters])

  /**
   * Loading state
   */
  if (cacheLoading && cachedNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div
              className="w-12 h-12 border-4 rounded-full animate-spin"
              style={{
                borderColor: 'oklch(0.85 0.05 240)',
                borderTopColor: 'oklch(0.6 0.15 240)',
              }}
            />
          </div>
          <div className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.05 240)' }}>
            Loading knowledge graph...
          </div>
          <div className="text-sm" style={{ color: 'oklch(0.5 0.05 240)' }}>
            Performance optimized for up to 100 nodes initially
          </div>
        </div>
      </div>
    )
  }

  /**
   * Error state
   */
  if (cacheError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'oklch(0.95 0.1 20)' }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: 'oklch(0.5 0.15 20)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold mb-1" style={{ color: 'oklch(0.3 0.05 240)' }}>
              Failed to Load Graph
            </div>
            <div className="text-sm" style={{ color: 'oklch(0.5 0.05 240)' }}>
              {cacheError}
            </div>
          </div>
          <button
            onClick={() => fetchGraphData(0, false)}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'oklch(0.6 0.15 240)',
              color: 'white',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.5 0.15 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.6 0.15 240)'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  /**
   * Empty state - no concepts yet
   */
  if (cachedNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: 'oklch(0.95 0.1 240)' }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: 'oklch(0.6 0.15 240)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold mb-1" style={{ color: 'oklch(0.3 0.05 240)' }}>
              No Knowledge Graph Yet
            </div>
            <div className="text-sm" style={{ color: 'oklch(0.5 0.05 240)' }}>
              Upload lectures to build your knowledge graph automatically
            </div>
          </div>
          <a
            href="/content"
            className="inline-block px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: 'oklch(0.6 0.15 240)',
              color: 'white',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.5 0.15 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.6 0.15 240)'
            }}
          >
            Upload Lectures
          </a>
        </div>
      </div>
    )
  }

  /**
   * Main graph view
   */
  return (
    <div className="w-full h-full flex flex-col">
      {/* Update notification banner */}
      {showUpdateNotification && (
        <GraphUpdateNotification
          onRefresh={handleRefreshGraph}
          onDismiss={() => setShowUpdateNotification(false)}
        />
      )}

      {/* Search bar */}
      <div className="p-4 border-b" style={{ borderColor: 'oklch(0.85 0.05 240)' }}>
        <GraphSearch
          onSearchResults={handleSearchResults}
          onClearSearch={handleClearSearch}
        />
      </div>

      {/* Graph visualization with export toolbar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Filters sidebar - collapsible on mobile */}
        <div className="w-80 border-r p-4 overflow-y-auto hidden lg:block" style={{ borderColor: 'oklch(0.85 0.05 240)' }}>
          <div className="space-y-4">
            <GraphFilters onFilterChange={handleFilterChange} />
            <GraphStats nodes={filteredData.nodes} edges={filteredData.edges} />
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 relative">
          <KnowledgeGraph
            nodes={filteredData.nodes}
            edges={filteredData.edges}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            focusedNodeIds={focusedNodeIds}
            onResetFocus={handleResetFocus}
          />

          {/* Export button - floating action button */}
          <div className="absolute top-4 right-4 z-10">
            <GraphExport nodes={cachedNodes} edges={cachedEdges} />
          </div>

          {/* Load More button - appears when pagination available */}
          {hasMore && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
              <button
                onClick={handleLoadMore}
                disabled={cacheLoading}
                className="px-6 py-3 rounded-lg font-medium shadow-none transition-all flex items-center gap-2"
                style={{
                  backgroundColor: cacheLoading ? 'oklch(0.8 0.05 240)' : 'oklch(0.6 0.15 240)',
                  color: 'white',
                }}
                onMouseOver={(e) => {
                  if (!cacheLoading) {
                    e.currentTarget.style.backgroundColor = 'oklch(0.5 0.15 240)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!cacheLoading) {
                    e.currentTarget.style.backgroundColor = 'oklch(0.6 0.15 240)'
                  }
                }}
              >
                {cacheLoading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-border border-t-white rounded-full animate-spin"
                    />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Concepts</span>
                    <span className="text-xs opacity-80">
                      ({cachedNodes.length} of {totalCount})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Concept detail sidebar (when node selected) */}
        {selectedConceptId && conceptDetail && (
          <div
            className="w-80 border-l p-6 overflow-y-auto"
            style={{
              backgroundColor: 'oklch(0.98 0.02 240)',
              borderColor: 'oklch(0.85 0.05 240)',
            }}
          >
          <div className="space-y-4">
            {/* Close button */}
            <button
              onClick={() => setSelectedConceptId(null)}
              className="mb-4 text-sm"
              style={{ color: 'oklch(0.5 0.05 240)' }}
            >
              ← Back to graph
            </button>

            {/* Concept details */}
            <div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: 'oklch(0.2 0.05 240)' }}
              >
                {conceptDetail.concept.name}
              </h2>
              {conceptDetail.concept.description && (
                <p className="text-sm mb-4" style={{ color: 'oklch(0.4 0.05 240)' }}>
                  {conceptDetail.concept.description}
                </p>
              )}
              {conceptDetail.concept.category && (
                <div
                  className="inline-block px-2 py-1 rounded text-xs font-semibold capitalize mb-4"
                  style={{
                    backgroundColor: 'oklch(0.9 0.1 240)',
                    color: 'oklch(0.3 0.05 240)',
                  }}
                >
                  {conceptDetail.concept.category}
                </div>
              )}
            </div>

            {/* Related concepts */}
            {conceptDetail.relatedConcepts && conceptDetail.relatedConcepts.length > 0 && (
              <div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'oklch(0.3 0.05 240)' }}
                >
                  Related Concepts ({conceptDetail.relatedConcepts.length})
                </h3>
                <div className="space-y-2">
                  {conceptDetail.relatedConcepts.slice(0, 10).map((related: any) => (
                    <div
                      key={related.id}
                      className="p-2 rounded text-sm cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'oklch(0.95 0.05 240)',
                        color: 'oklch(0.3 0.05 240)',
                      }}
                      onClick={() => handleNodeClick(related.id)}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'oklch(0.9 0.1 240)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'oklch(0.95 0.05 240)'
                      }}
                    >
                      {related.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships */}
            {conceptDetail.relationships && conceptDetail.relationships.length > 0 && (
              <div>
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'oklch(0.3 0.05 240)' }}
                >
                  Relationships ({conceptDetail.relationships.length})
                </h3>
                <div className="space-y-2">
                  {conceptDetail.relationships.slice(0, 10).map((rel: any) => (
                    <div
                      key={rel.id}
                      className="p-2 rounded text-xs"
                      style={{
                        backgroundColor: 'oklch(0.95 0.05 240)',
                        color: 'oklch(0.4 0.05 240)',
                      }}
                    >
                      <div className="font-semibold mb-1 capitalize">
                        {rel.relationship.toLowerCase()}
                      </div>
                      <div className="text-xs">
                        Strength: {(rel.strength * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  )
}

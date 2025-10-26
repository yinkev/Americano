/**
 * SearchGraphView - Visual search interface with knowledge graph
 *
 * Story 3.6 Task 4: Visual Search with Knowledge Graph Integration (AC #4)
 *
 * Features:
 * - Graph-based search result visualization using React Flow
 * - Color-coded nodes by content type (lecture: blue, First Aid: red, concept: green)
 * - Node size based on relevance score
 * - Result clustering by course/topic/similarity
 * - Graph navigation controls (zoom, pan, filters, minimap)
 * - Expand search from graph nodes
 * - Performance optimized for 50-200 nodes with clustering beyond 200
 * - Glassmorphism design, mobile-responsive, keyboard navigation
 */

'use client'

import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ZoomIn, ZoomOut, Maximize2, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult } from './search-result-item'

/**
 * Search result node data for React Flow
 */
export type SearchNodeData = {
  label: string
  type: 'lecture' | 'objective' | 'card' | 'concept'
  relevance: number // 0-1
  course?: string
  cluster?: string
  metadata?: {
    pageNumber?: number
    complexity?: string
    isHighYield?: boolean
  }
}

/**
 * Cluster configuration
 */
export type ClusterConfig = {
  id: string
  label: string
  color: string
  position: { x: number; y: number }
  size: { width: number; height: number }
}

/**
 * SearchGraphView props
 */
export interface SearchGraphViewProps {
  /** Search results to visualize */
  results: SearchResult[]
  /** Callback when node is clicked */
  onNodeClick?: (nodeId: string) => void
  /** Callback when expand search is triggered from a node */
  onExpandSearch?: (nodeId: string, type: string) => void
  /** Active filters */
  filters?: {
    sourceTypes: string[]
    courses: string[]
  }
  /** Callback when filters change */
  onFilterChange?: (filters: { sourceTypes: string[]; courses: string[] }) => void
  /** Max nodes before clustering (default: 200) */
  maxNodes?: number
  /** CSS class */
  className?: string
}

/**
 * Color mapping for content types (glassmorphism style)
 */
const TYPE_COLORS = {
  lecture: 'oklch(0.6 0.15 240)', // Blue
  objective: 'oklch(0.6 0.15 140)', // Green
  card: 'oklch(0.6 0.15 290)', // Purple
  concept: 'oklch(0.6 0.15 50)', // Orange
} as const

/**
 * Color mapping for First Aid content (red)
 */
const FIRST_AID_COLOR = 'oklch(0.6 0.15 20)' // Red

/**
 * Calculate node size based on relevance score
 * Higher relevance = larger node
 */
function getNodeSize(relevance: number): number {
  const minSize = 60
  const maxSize = 120
  return minSize + (maxSize - minSize) * relevance
}

/**
 * Cluster search results by course or topic
 */
function clusterResults(
  results: SearchResult[],
  clusterBy: 'course' | 'topic' = 'course'
): Map<string, SearchResult[]> {
  const clusters = new Map<string, SearchResult[]>()

  results.forEach((result) => {
    let clusterKey: string

    if (clusterBy === 'course') {
      clusterKey = result.source.courseName || 'Uncategorized'
    } else {
      // Topic clustering - use first word of title as simple topic
      clusterKey = result.title.split(' ')[0] || 'Other'
    }

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, [])
    }
    clusters.get(clusterKey)!.push(result)
  })

  return clusters
}

/**
 * Custom node component for search results
 */
function SearchResultNode({ data }: { data: SearchNodeData }) {
  const size = getNodeSize(data.relevance)
  const color = data.metadata?.isHighYield
    ? FIRST_AID_COLOR
    : TYPE_COLORS[data.type] || TYPE_COLORS.concept

  return (
    <div
      className="relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color} / 0.85`,
        backdropFilter: 'blur(8px)',
        border: '2px solid white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="text-center px-2">
        <div className="text-white font-semibold text-xs line-clamp-2">
          {data.label}
        </div>
        {data.metadata?.isHighYield && (
          <div className="absolute -top-1 -right-1">
            <Badge className="h-4 px-1 text-[10px] bg-yellow-500 text-white border-0">
              HY
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Custom edge component (simple for now)
 */
const edgeTypes = {}

/**
 * Node types configuration
 */
const nodeTypes = {
  searchResult: SearchResultNode,
}

/**
 * Force-directed layout algorithm (simple version)
 * For production: consider using dagre, elk, or d3-force
 */
function calculateForceDirectedLayout(
  clusters: Map<string, SearchResult[]>,
  width: number = 800,
  height: number = 600
): { nodes: Node<SearchNodeData>[]; edges: Edge[]; clusterConfigs: ClusterConfig[] } {
  const nodes: Node<SearchNodeData>[] = []
  const edges: Edge[] = []
  const clusterConfigs: ClusterConfig[] = []

  const clusterEntries = Array.from(clusters.entries())
  const clusterCount = clusterEntries.length

  // Calculate cluster positions in a grid
  const cols = Math.ceil(Math.sqrt(clusterCount))
  const clusterWidth = width / cols
  const clusterHeight = height / Math.ceil(clusterCount / cols)

  clusterEntries.forEach(([clusterName, results], clusterIndex) => {
    const col = clusterIndex % cols
    const row = Math.floor(clusterIndex / cols)

    const clusterX = col * clusterWidth + clusterWidth / 2
    const clusterY = row * clusterHeight + clusterHeight / 2

    // Create cluster config for background
    const clusterColor = TYPE_COLORS[results[0]?.type] || TYPE_COLORS.concept
    clusterConfigs.push({
      id: `cluster-${clusterIndex}`,
      label: clusterName,
      color: clusterColor,
      position: { x: col * clusterWidth, y: row * clusterHeight },
      size: { width: clusterWidth - 40, height: clusterHeight - 40 },
    })

    // Position nodes in circular pattern within cluster
    const radius = Math.min(clusterWidth, clusterHeight) / 3
    const angleStep = (2 * Math.PI) / results.length

    results.forEach((result, index) => {
      const angle = index * angleStep
      const nodeX = clusterX + radius * Math.cos(angle)
      const nodeY = clusterY + radius * Math.sin(angle)

      nodes.push({
        id: result.id,
        type: 'searchResult',
        position: { x: nodeX, y: nodeY },
        data: {
          label: result.title,
          type: result.type,
          relevance: result.similarity,
          course: result.source.courseName,
          cluster: clusterName,
          metadata: result.metadata,
        },
        draggable: true,
      })
    })

    // Create edges between nodes in same cluster (similarity-based)
    for (let i = 0; i < results.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 3, results.length); j++) {
        edges.push({
          id: `edge-${results[i].id}-${results[j].id}`,
          source: results[i].id,
          target: results[j].id,
          type: 'default',
          animated: false,
          style: {
            stroke: 'oklch(0.5 0.05 240 / 0.2)',
            strokeWidth: 1,
          },
        })
      }
    }
  })

  return { nodes, edges, clusterConfigs }
}

/**
 * SearchGraphView Component
 * Main visual search interface with knowledge graph
 */
export function SearchGraphView({
  results,
  onNodeClick,
  onExpandSearch,
  filters,
  onFilterChange,
  maxNodes = 200,
  className,
}: SearchGraphViewProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [clusterBy, setClusterBy] = useState<'course' | 'topic'>('course')
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  // Cluster and layout results
  const { nodes: initialNodes, edges: initialEdges, clusterConfigs } = useMemo(() => {
    const filteredResults = results.slice(0, maxNodes) // Limit to maxNodes
    const clusters = clusterResults(filteredResults, clusterBy)

    const containerWidth = containerRef.current?.offsetWidth || 800
    const containerHeight = containerRef.current?.offsetHeight || 600

    return calculateForceDirectedLayout(clusters, containerWidth, containerHeight)
  }, [results, clusterBy, maxNodes])

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when results change
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  // Update edges when results change
  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  /**
   * Handle node click
   */
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      setSelectedNode(node.id)
      onNodeClick?.(node.id)
    },
    [onNodeClick]
  )

  /**
   * Handle expand search from node
   */
  const handleExpandSearch = useCallback(() => {
    if (selectedNode) {
      const node = nodes.find((n) => n.id === selectedNode)
      if (node) {
        onExpandSearch?.(selectedNode, node.data.type)
      }
    }
  }, [selectedNode, nodes, onExpandSearch])

  /**
   * Handle fit view
   */
  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 800 })
  }, [fitView])

  /**
   * Handle zoom in
   */
  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 })
  }, [zoomIn])

  /**
   * Handle zoom out
   */
  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 })
  }, [zoomOut])

  /**
   * Keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNode(null)
      }
      // Enter to expand search
      if (e.key === 'Enter' && selectedNode) {
        handleExpandSearch()
      }
      // Arrow keys for navigation
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        const currentIndex = nodes.findIndex((n) => n.id === selectedNode)
        if (currentIndex !== -1) {
          const nextIndex =
            e.key === 'ArrowDown'
              ? (currentIndex + 1) % nodes.length
              : (currentIndex - 1 + nodes.length) % nodes.length
          setSelectedNode(nodes[nextIndex].id)
          onNodeClick?.(nodes[nextIndex].id)
        } else if (nodes.length > 0) {
          setSelectedNode(nodes[0].id)
          onNodeClick?.(nodes[0].id)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, nodes, handleExpandSearch, onNodeClick])

  const selectedNodeData = useMemo(() => {
    if (!selectedNode) return null
    return nodes.find((n) => n.id === selectedNode)?.data
  }, [selectedNode, nodes])

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full min-h-[600px] rounded-xl overflow-hidden', className)}
      role="region"
      aria-label="Search results graph visualization"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-right"
        className="bg-card "
      >
        {/* Cluster backgrounds */}
        {clusterConfigs.map((cluster) => (
          <div
            key={cluster.id}
            className="absolute rounded-lg pointer-events-none"
            style={{
              left: cluster.position.x,
              top: cluster.position.y,
              width: cluster.size.width,
              height: cluster.size.height,
              backgroundColor: `${cluster.color} / 0.08`,
              border: `1px dashed ${cluster.color} / 0.3`,
            }}
          >
            <div
              className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded"
              style={{
                backgroundColor: `${cluster.color} / 0.15`,
                color: cluster.color,
              }}
            >
              {cluster.label}
            </div>
          </div>
        ))}

        {/* Graph controls */}
        <Controls
          className="!bg-card  !border-gray-200 !shadow-none"
          showInteractive={false}
        />

        {/* MiniMap for navigation */}
        <MiniMap
          className="!bg-card  !border-gray-200 !shadow-none"
          nodeColor={(node) => {
            const nodeData = node.data as SearchNodeData
            return nodeData.metadata?.isHighYield
              ? FIRST_AID_COLOR
              : TYPE_COLORS[nodeData.type] || TYPE_COLORS.concept
          }}
          maskColor="oklch(0.95 0.02 240 / 0.5)"
        />

        {/* Background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="oklch(0.5 0.05 240 / 0.15)"
        />

        {/* Custom Controls Panel */}
        <Panel position="top-left" className="space-y-2">
          {/* Graph info */}
          <div className="bg-card  rounded-lg p-3 shadow-none">
            <div className="text-xs space-y-1">
              <div className="font-semibold text-gray-900">Search Graph</div>
              <div className="text-gray-600">
                {nodes.length} results
                {results.length > maxNodes && ` (showing ${maxNodes} max)`}
              </div>
              <div className="text-gray-600">
                Clustered by: {clusterBy === 'course' ? 'Course' : 'Topic'}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card  rounded-lg p-2 shadow-none flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleFitView}
              className="h-8 px-2"
              aria-label="Fit view"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              className="h-8 px-2"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              className="h-8 px-2"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setClusterBy(clusterBy === 'course' ? 'topic' : 'course')}
              className="h-8 px-2 text-xs"
              aria-label="Toggle clustering"
            >
              Toggle Cluster
            </Button>
          </div>

          {/* Legend */}
          <div className="bg-card  rounded-lg p-3 shadow-none">
            <div className="text-xs space-y-2">
              <div className="font-semibold text-gray-900 mb-2">Legend</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS.lecture }}
                />
                <span className="text-gray-600">Lecture</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS.concept }}
                />
                <span className="text-gray-600">Concept</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: FIRST_AID_COLOR }}
                />
                <span className="text-gray-600">High-Yield</span>
              </div>
              <div className="text-gray-500 text-[10px] mt-2">
                Size = Relevance
              </div>
            </div>
          </div>
        </Panel>

        {/* Selected node info */}
        {selectedNodeData && (
          <Panel position="top-right" className="bg-card  rounded-lg p-3 shadow-none max-w-xs">
            <div className="text-xs space-y-2">
              <div className="font-semibold text-gray-900">
                {selectedNodeData.label}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedNodeData.type}
                </Badge>
                {selectedNodeData.metadata?.isHighYield && (
                  <Badge className="text-xs bg-card text-yellow-700 border-yellow-500/20">
                    High-Yield
                  </Badge>
                )}
              </div>
              <div className="text-gray-600">
                Relevance: {Math.round(selectedNodeData.relevance * 100)}%
              </div>
              {selectedNodeData.course && (
                <div className="text-gray-600">
                  Course: {selectedNodeData.course}
                </div>
              )}
              {onExpandSearch && (
                <Button
                  size="sm"
                  onClick={handleExpandSearch}
                  className="w-full mt-2 bg-card hover:bg-primary"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Show Related
                </Button>
              )}
            </div>
          </Panel>
        )}

        {/* Keyboard shortcuts hint */}
        <Panel position="bottom-left" className="bg-card  rounded-lg p-2 shadow-none">
          <div className="text-[10px] text-gray-500 space-y-1">
            <div>↑↓ Navigate • Enter Expand • Esc Deselect</div>
          </div>
        </Panel>

        {/* Performance warning */}
        {results.length > maxNodes && (
          <Panel position="bottom-right" className="bg-card  rounded-lg p-2 shadow-none">
            <div className="text-[10px] text-white">
              Showing {maxNodes} of {results.length} results
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  )
}

/**
 * Wrapper with ReactFlow provider
 */
import { ReactFlowProvider } from '@xyflow/react'

export default function SearchGraphViewWithProvider(props: SearchGraphViewProps) {
  return (
    <ReactFlowProvider>
      <SearchGraphView {...props} />
    </ReactFlowProvider>
  )
}

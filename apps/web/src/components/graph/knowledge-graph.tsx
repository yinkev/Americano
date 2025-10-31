/**
 * KnowledgeGraph - Main React Flow visualization component
 *
 * Story 3.2 Task 4.2: Integrate React Flow for graph visualization
 * Story 3.2 Task 4.5: Implement graph navigation and interaction
 *
 * Features:
 * - Interactive node-based graph with React Flow v12+
 * - Custom concept nodes and relationship edges
 * - Zoom, pan, and node selection (AC #3, #4)
 * - Visual cues: line thickness (strength), colors (relationship type) (AC #5)
 * - Drill-down navigation (double-click for depth 2 subgraph)
 * - Reset view button to center and fit graph
 * - Performance optimized for 100+ nodes
 */

'use client'

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type Node,
  type NodeMouseHandler,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import '@xyflow/react/dist/style.css'

import ConceptNode, { type ConceptNodeData } from './concept-node'
import RelationshipEdge, {
  prerequisiteMarker,
  type RelationshipEdgeData,
} from './relationship-edge'

/**
 * Graph data types
 */
export type GraphNode = {
  id: string
  name: string
  description: string | null
  category: string | null
  relationshipCount: number
}

export type GraphEdge = {
  id: string
  fromConceptId: string
  toConceptId: string
  relationship: string
  strength: number
  isUserDefined: boolean
  userNote?: string | null
}

export type KnowledgeGraphProps = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (nodeId: string) => void
  onNodeDoubleClick?: (nodeId: string) => void
  focusedNodeIds?: string[]
  onResetFocus?: () => void
  className?: string
}

/**
 * Custom node types configuration
 */
const nodeTypes = {
  concept: ConceptNode,
}

/**
 * Custom edge types configuration
 */
const edgeTypes = {
  relationship: RelationshipEdge,
}

/**
 * Default edge options with prerequisite arrow marker
 */
const defaultEdgeOptions = {
  type: 'relationship',
  animated: false,
  markerEnd: prerequisiteMarker,
}

/**
 * Calculate node positions using force-directed layout
 * Simple physics-based layout for initial positioning
 * For production: consider using dagre or elk for better layouts
 */
function calculateNodePositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Simple circular layout for MVP
  // TODO: Implement force-directed or hierarchical layout for better results
  const radius = Math.max(200, nodes.length * 10)
  const angleStep = (2 * Math.PI) / nodes.length

  nodes.forEach((node, index) => {
    const angle = index * angleStep
    positions.set(node.id, {
      x: radius * Math.cos(angle) + 400, // Center at (400, 400)
      y: radius * Math.sin(angle) + 400,
    })
  })

  return positions
}

/**
 * KnowledgeGraph Component
 * Main interactive graph visualization
 */
export default function KnowledgeGraph({
  nodes: graphNodes,
  edges: graphEdges,
  onNodeClick,
  onNodeDoubleClick,
  focusedNodeIds = [],
  onResetFocus,
  className = '',
}: KnowledgeGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const isFocusMode = focusedNodeIds.length > 0

  // Convert graph data to React Flow nodes
  const initialNodes = useMemo(() => {
    const positions = calculateNodePositions(graphNodes, graphEdges)

    return graphNodes.map((node): Node<ConceptNodeData> => {
      const position = positions.get(node.id) || { x: 0, y: 0 }

      // Determine if node should be dimmed in focus mode
      const isFocused = focusedNodeIds.includes(node.id)
      const shouldDim = isFocusMode && !isFocused

      // Find direct relationships for focus mode
      const directRelationships = new Set<string>()
      if (isFocused) {
        graphEdges.forEach((edge: any) => {
          if (edge.fromConceptId === node.id) {
            directRelationships.add(edge.toConceptId)
          }
          if (edge.toConceptId === node.id) {
            directRelationships.add(edge.fromConceptId)
          }
        })
      }

      return {
        id: node.id,
        type: 'concept',
        position,
        data: {
          name: node.name,
          description: node.description,
          category: node.category,
          relationshipCount: node.relationshipCount,
        },
        style: shouldDim
          ? {
              opacity: 0.2,
              transition: 'opacity 0.3s ease-in-out',
            }
          : {
              opacity: isFocused ? 1 : 1,
              transition: 'opacity 0.3s ease-in-out',
            },
        className: isFocused ? 'animate-pulse' : '',
      }
    })
  }, [graphNodes, graphEdges, focusedNodeIds, isFocusMode])

  // Convert graph data to React Flow edges
  const initialEdges = useMemo(() => {
    return graphEdges.map(
      (edge): Edge<RelationshipEdgeData> => ({
        id: edge.id,
        source: edge.fromConceptId,
        target: edge.toConceptId,
        type: 'relationship',
        data: {
          relationship: edge.relationship,
          strength: edge.strength,
          isUserDefined: edge.isUserDefined,
          userNote: edge.userNote,
        },
      }),
    )
  }, [graphEdges])

  // React Flow state management
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when graph data changes
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  // Update edges when graph data changes
  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  /**
   * Handle node click - select node and call callback
   */
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      setSelectedNode(node.id)
      onNodeClick?.(node.id)
    },
    [onNodeClick],
  )

  /**
   * Handle node double-click - drill down into concept subgraph
   * AC #4: Graph navigation allows drilling down
   */
  const handleNodeDoubleClick: NodeMouseHandler = useCallback(
    (event, node) => {
      onNodeDoubleClick?.(node.id)
    },
    [onNodeDoubleClick],
  )

  /**
   * Handle connection creation (for future user-defined relationships)
   */
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds: any) => addEdge(params, eds))
    },
    [setEdges],
  )

  /**
   * Handle pane click - deselect node
   */
  const handlePaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  /**
   * Prevent default context menu (for future right-click features)
   */
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
  }, [])

  return (
    <div className={`w-full h-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onPaneClick={handlePaneClick}
        onContextMenu={handleContextMenu}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        {/* Graph controls: zoom, fit view, etc. */}
        <Controls
          className="!bg-white/80 backdrop-blur-md !border-gray-200 !shadow-lg"
          showInteractive={false}
        />

        {/* Background pattern */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="oklch(0.5 0.05 240 / 0.2)"
        />

        {/* Info panel with instructions */}
        <Panel
          position="top-left"
          className="bg-white/80 backdrop-blur-md rounded-lg p-3 shadow-lg"
        >
          <div className="text-xs space-y-1">
            <div className="font-semibold text-gray-900">Knowledge Graph</div>
            <div className="text-gray-600">• Click: Select concept</div>
            <div className="text-gray-600">• Double-click: Drill down</div>
            <div className="text-gray-600">• Scroll: Zoom in/out</div>
            <div className="text-gray-600">• Drag: Pan view</div>
            {isFocusMode && onResetFocus && (
              <button
                onClick={onResetFocus}
                className="mt-2 w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'oklch(0.6 0.15 240)',
                  color: 'white',
                }}
                onMouseOver={(e: any) => {
                  e.currentTarget.style.backgroundColor = 'oklch(0.5 0.15 240)'
                }}
                onMouseOut={(e: any) => {
                  e.currentTarget.style.backgroundColor = 'oklch(0.6 0.15 240)'
                }}
              >
                Show Full Graph
              </button>
            )}
          </div>
        </Panel>

        {/* Selected node info panel */}
        {selectedNode && (
          <Panel
            position="top-right"
            className="bg-white/80 backdrop-blur-md rounded-lg p-3 shadow-lg max-w-xs"
          >
            <div className="text-xs space-y-1">
              <div className="font-semibold text-gray-900">
                {nodes.find((n: any) => n.id === selectedNode)?.data.name}
              </div>
              <div className="text-gray-600">
                {nodes.find((n: any) => n.id === selectedNode)?.data.description || 'No description'}
              </div>
              {nodes.find((n: any) => n.id === selectedNode)?.data.category && (
                <div className="text-gray-500 capitalize">
                  Category: {nodes.find((n: any) => n.id === selectedNode)?.data.category}
                </div>
              )}
            </div>
          </Panel>
        )}

        {/* Graph statistics panel */}
        <Panel
          position="bottom-left"
          className="bg-white/80 backdrop-blur-md rounded-lg p-3 shadow-lg"
        >
          <div className="text-xs space-y-1">
            <div className="font-semibold text-gray-900">Graph Stats</div>
            <div className="text-gray-600">Concepts: {nodes.length}</div>
            <div className="text-gray-600">Relationships: {edges.length}</div>
            <div className="text-gray-600">
              Avg connections:{' '}
              {nodes.length > 0 ? ((edges.length * 2) / nodes.length).toFixed(1) : 0}
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

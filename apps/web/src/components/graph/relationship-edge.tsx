/**
 * RelationshipEdge - Custom React Flow edge component for concept relationships
 *
 * Story 3.2 Task 4.4: Design edge visual styles
 *
 * Features:
 * - Line thickness based on relationship strength (1-5px for 0.0-1.0 strength)
 * - Color by relationship type (PREREQUISITE: orange, RELATED: gray, etc.)
 * - Directional arrows for prerequisite relationships
 * - Dashed lines for user-defined relationships
 * - Edge label showing relationship type
 * - Opacity based on strength (weaker = more transparent)
 */

'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react'

/**
 * Custom edge data type for concept relationships
 */
export type RelationshipEdgeData = {
  relationship: string
  strength: number // 0.0 to 1.0
  isUserDefined?: boolean
  userNote?: string | null
}

/**
 * Relationship type color scheme using OKLCH colors
 * Following visual cues requirements from AC #5
 */
const RELATIONSHIP_COLORS: Record<string, string> = {
  PREREQUISITE: 'oklch(0.65 0.18 40)',   // Orange - directional prerequisite
  RELATED: 'oklch(0.5 0.05 240)',        // Gray - general association
  INTEGRATED: 'oklch(0.65 0.18 200)',    // Cyan - cross-course integration
  CLINICAL: 'oklch(0.65 0.18 330)',      // Magenta - clinical application
}

/**
 * Get relationship label for display
 */
function getRelationshipLabel(type: string): string {
  const labels: Record<string, string> = {
    PREREQUISITE: 'Prereq',
    RELATED: 'Related',
    INTEGRATED: 'Integrated',
    CLINICAL: 'Clinical',
  }
  return labels[type] || type
}

/**
 * Calculate stroke width based on relationship strength
 * 0.0-1.0 → 1-5px (AC #5: thickness indicates strength)
 */
function calculateStrokeWidth(strength: number): number {
  return 1 + strength * 4 // Maps 0.0→1px, 1.0→5px
}

/**
 * Calculate opacity based on strength
 * Weaker relationships (< 0.3) are semi-transparent
 */
function calculateOpacity(strength: number): number {
  return Math.max(0.3, strength) // Minimum 30% opacity
}

/**
 * RelationshipEdge Component
 * Custom edge with relationship type visualization
 */
function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps<Edge<RelationshipEdgeData>>) {
  if (!data) return null

  const { relationship, strength, isUserDefined, userNote } = data

  // Calculate bezier path for smooth curves
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Get relationship color
  const strokeColor = RELATIONSHIP_COLORS[relationship] || RELATIONSHIP_COLORS.RELATED

  // Calculate visual properties based on strength
  const strokeWidth = calculateStrokeWidth(strength)
  const opacity = calculateOpacity(strength)

  // User-defined relationships use dashed lines
  const strokeDasharray = isUserDefined ? '5,5' : 'none'

  // Prerequisite relationships have arrows (directional)
  const showArrow = relationship === 'PREREQUISITE'

  return (
    <>
      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={showArrow ? markerEnd : undefined}
        style={{
          ...style,
          strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
          stroke: strokeColor,
          strokeDasharray,
          opacity: selected ? 1 : opacity,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Edge label with relationship type */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="edge-label-wrapper"
        >
          {/* Label background with glassmorphism */}
          <div
            className="px-2 py-1 rounded text-xs font-semibold transition-all duration-200"
            style={{
              backgroundColor: selected
                ? strokeColor
                : `${strokeColor}cc`, // Add alpha for non-selected
              color: 'white',
              backdropFilter: 'blur(8px)',
              boxShadow: selected
                ? '0 2px 8px oklch(0 0 0 / 0.3)'
                : '0 1px 4px oklch(0 0 0 / 0.2)',
              fontSize: '10px',
              border: `1px solid ${strokeColor.replace('0.65', '0.45')}`,
              cursor: userNote ? 'pointer' : 'default',
            }}
            title={userNote || `${getRelationshipLabel(relationship)} (strength: ${strength.toFixed(2)})`}
          >
            {getRelationshipLabel(relationship)}
            {isUserDefined && (
              <span className="ml-1 opacity-70" title="User-defined connection">
                ✎
              </span>
            )}
          </div>

          {/* User note tooltip (if present) */}
          {userNote && (
            <div
              className="absolute hidden hover:block top-full left-1/2 -translate-x-1/2 mt-1 z-50"
              style={{
                minWidth: '150px',
                maxWidth: '250px',
              }}
            >
              <div
                className="px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: 'oklch(0.2 0.02 240)',
                  color: 'oklch(0.95 0.02 240)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 12px oklch(0 0 0 / 0.3)',
                }}
              >
                <div className="font-semibold mb-1">User Note:</div>
                <div className="text-xs opacity-90">{userNote}</div>
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

/**
 * Memoize component to prevent unnecessary re-renders
 */
export default memo(RelationshipEdge)

/**
 * Export type for use in ReactFlow edgeTypes configuration
 */
export type RelationshipEdgeType = Edge<RelationshipEdgeData>

/**
 * Custom marker for prerequisite arrows
 * Use with ReactFlow's defaultEdgeOptions
 */
export const prerequisiteMarker = {
  type: 'arrowclosed' as const,
  color: RELATIONSHIP_COLORS.PREREQUISITE,
  width: 20,
  height: 20,
}

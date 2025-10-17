/**
 * ConceptNode - Custom React Flow node component for medical concepts
 *
 * Story 3.2 Task 4.4: Design node visual styles
 *
 * Features:
 * - Category-based OKLCH colors (anatomy: blue, physiology: green, pathology: red, etc.)
 * - Size based on relationship count (20-60px diameter)
 * - Glassmorphism design with backdrop blur
 * - Hover tooltip showing concept description
 * - Selection highlighting with pulsing border
 */

'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Node } from '@xyflow/react'

/**
 * Custom node data type for medical concepts
 */
export type ConceptNodeData = {
  name: string
  description?: string | null
  category?: string | null
  relationshipCount: number
}

/**
 * Category color scheme using OKLCH colors
 * Following design system guidelines: no gradients, glassmorphism
 */
const CATEGORY_COLORS: Record<string, string> = {
  anatomy: 'oklch(0.6 0.15 240)',         // Blue
  physiology: 'oklch(0.6 0.15 140)',      // Green
  pathology: 'oklch(0.6 0.15 20)',        // Red
  pharmacology: 'oklch(0.6 0.15 290)',    // Purple
  biochemistry: 'oklch(0.6 0.15 80)',     // Yellow
  microbiology: 'oklch(0.6 0.15 200)',    // Cyan
  immunology: 'oklch(0.6 0.15 330)',      // Magenta
  clinical: 'oklch(0.6 0.15 50)',         // Orange
  default: 'oklch(0.6 0.1 220)',          // Default blue-gray
}

/**
 * Calculate node size based on relationship count
 * Hub nodes (>10 relationships): 60px
 * Regular nodes (3-10 relationships): 40px
 * Peripheral nodes (<3 relationships): 20px
 */
function calculateNodeSize(relationshipCount: number): number {
  if (relationshipCount > 10) return 60
  if (relationshipCount >= 3) return 40
  return 20
}

/**
 * Get border color (slightly darker than fill)
 */
function getBorderColor(color: string): string {
  return color.replace('0.6', '0.4') // Reduce lightness for border
}

/**
 * ConceptNode Component
 * Custom node with medical concept visualization
 */
function ConceptNode({ data, selected }: NodeProps<Node<ConceptNodeData>>) {
  const { name, description, category, relationshipCount } = data

  // Get category color
  const fillColor = CATEGORY_COLORS[category?.toLowerCase() || 'default'] || CATEGORY_COLORS.default
  const borderColor = getBorderColor(fillColor)

  // Calculate size based on relationships
  const size = calculateNodeSize(relationshipCount)
  const fontSize = size > 40 ? '12px' : size > 20 ? '10px' : '8px'

  return (
    <div
      className="concept-node group relative"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={description || name}
    >
      {/* Main node circle with glassmorphism */}
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          backgroundColor: fillColor,
          borderWidth: selected ? '3px' : '2px',
          borderColor: selected ? 'oklch(0.7 0.2 250)' : borderColor,
          borderStyle: 'solid',
          backdropFilter: 'blur(8px)',
          boxShadow: selected
            ? '0 0 0 3px oklch(0.7 0.2 250 / 0.3), 0 4px 12px oklch(0 0 0 / 0.2)'
            : '0 2px 8px oklch(0 0 0 / 0.1)',
          animation: selected ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        }}
      >
        {/* Concept name label */}
        <span
          className="font-semibold text-white text-center px-1 truncate max-w-full"
          style={{
            fontSize,
            lineHeight: '1.2',
            textShadow: '0 1px 2px oklch(0 0 0 / 0.3)',
          }}
        >
          {name}
        </span>
      </div>

      {/* Tooltip on hover - shows description */}
      {description && (
        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div
            className="px-3 py-2 rounded-lg text-xs max-w-xs"
            style={{
              backgroundColor: 'oklch(0.2 0.02 240)',
              color: 'oklch(0.95 0.02 240)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px oklch(0 0 0 / 0.3)',
            }}
          >
            <div className="font-semibold mb-1">{name}</div>
            <div className="text-xs opacity-90">{description}</div>
            {category && (
              <div className="text-xs opacity-70 mt-1 capitalize">
                {category}
              </div>
            )}
          </div>
        </div>
      )}

      {/* React Flow handles for connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-white !border-2"
        style={{
          borderColor: borderColor,
          opacity: 0.8,
        }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-white !border-2"
        style={{
          borderColor: borderColor,
          opacity: 0.8,
        }}
        isConnectable={true}
      />

      {/* Add pulse animation for selected state */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Memoize component to prevent unnecessary re-renders
 * Critical for performance with large graphs (>100 nodes)
 */
export default memo(ConceptNode)

/**
 * Export type for use in ReactFlow nodeTypes configuration
 */
export type ConceptNodeType = Node<ConceptNodeData>

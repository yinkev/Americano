/**
 * Knowledge Graph Page
 *
 * Story 3.2 Task 4.1: Create /graph page
 *
 * Full-screen interactive knowledge graph visualization showing medical concepts
 * and their relationships. Features:
 * - React Flow visualization with custom nodes and edges
 * - Zoom, pan, and node selection
 * - Visual cues for relationship strength and type
 * - Loading and empty states
 * - Concept detail sidebar on node selection
 *
 * Route: /graph
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import GraphPageClient from './graph-client'

export const metadata: Metadata = {
  title: 'Knowledge Graph | Americano',
  description: 'Interactive visualization of medical concept relationships',
}

/**
 * Server Component - Fetch initial graph data
 */
export default async function GraphPage() {
  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <header
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: 'oklch(0.98 0.02 240)',
          borderColor: 'oklch(0.85 0.05 240)',
        }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'oklch(0.2 0.05 240)' }}>
            Knowledge Graph
          </h1>
          <p className="text-sm" style={{ color: 'oklch(0.4 0.05 240)' }}>
            Explore how medical concepts connect to each other
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'oklch(0.3 0.05 240)' }}>
              Relationship Types:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: 'oklch(0.65 0.18 40)' }} />
            <span style={{ color: 'oklch(0.4 0.05 240)' }}>Prerequisite</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: 'oklch(0.5 0.05 240)' }} />
            <span style={{ color: 'oklch(0.4 0.05 240)' }}>Related</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: 'oklch(0.65 0.18 200)' }}
            />
            <span style={{ color: 'oklch(0.4 0.05 240)' }}>Integrated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: 'oklch(0.65 0.18 330)' }}
            />
            <span style={{ color: 'oklch(0.4 0.05 240)' }}>Clinical</span>
          </div>
        </div>
      </header>

      {/* Main content - Graph visualization */}
      <main className="flex-1 relative">
        <Suspense fallback={<GraphLoadingState />}>
          <GraphPageClient />
        </Suspense>
      </main>
    </div>
  )
}

/**
 * Loading state skeleton
 */
function GraphLoadingState() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Loading spinner */}
        <div className="flex justify-center">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{
              borderColor: 'oklch(0.85 0.05 240)',
              borderTopColor: 'oklch(0.6 0.15 240)',
            }}
          />
        </div>

        {/* Loading text */}
        <div>
          <div className="text-lg font-semibold mb-1" style={{ color: 'oklch(0.3 0.05 240)' }}>
            Building Knowledge Graph...
          </div>
          <div className="text-sm" style={{ color: 'oklch(0.5 0.05 240)' }}>
            Analyzing concept relationships
          </div>
        </div>

        {/* Skeleton graph preview */}
        <div className="mt-8 flex justify-center gap-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-full animate-pulse"
              style={{
                backgroundColor: 'oklch(0.9 0.05 240)',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

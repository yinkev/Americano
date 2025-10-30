/**
 * GraphStats - Statistics panel for knowledge graph
 *
 * Story 3.2 Task 7.4: Implement graph statistics panel
 *
 * Features:
 * - Total concepts count
 * - Total relationships count
 * - Average relationships per concept
 * - Most connected concept (hub node)
 * - Coverage by category (pie chart with recharts)
 * - Glassmorphism design with OKLCH colors
 * - Collapsible panel for mobile
 */

'use client'

import { Award, Link as LinkIcon, Network, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { GraphEdge, GraphNode } from './knowledge-graph'

export interface GraphStatsProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  className?: string
}

/**
 * Category colors matching design system
 */
const CATEGORY_COLORS: Record<string, string> = {
  anatomy: 'oklch(0.6 0.15 240)',
  physiology: 'oklch(0.6 0.15 140)',
  pathology: 'oklch(0.6 0.15 20)',
  pharmacology: 'oklch(0.6 0.15 290)',
  biochemistry: 'oklch(0.6 0.15 80)',
  microbiology: 'oklch(0.6 0.15 200)',
  immunology: 'oklch(0.6 0.15 330)',
  clinical: 'oklch(0.6 0.15 50)',
}

/**
 * GraphStats Component
 */
export default function GraphStats({ nodes, edges, className = '' }: GraphStatsProps) {
  /**
   * Calculate graph statistics
   */
  const stats = useMemo(() => {
    const totalConcepts = nodes.length
    const totalRelationships = edges.length
    const avgRelationships = totalConcepts > 0 ? (totalRelationships * 2) / totalConcepts : 0

    // Find most connected concept (hub node)
    const hubNode = nodes.reduce(
      (max, node) => (node.relationshipCount > (max?.relationshipCount ?? 0) ? node : max),
      null as GraphNode | null,
    )

    // Calculate category distribution
    const categoryCount: Record<string, number> = {}
    nodes.forEach((node) => {
      if (node.category) {
        categoryCount[node.category] = (categoryCount[node.category] || 0) + 1
      }
    })

    const categoryData = Object.entries(categoryCount)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CATEGORY_COLORS[name] || 'oklch(0.5 0.05 240)',
      }))
      .sort((a, b) => b.value - a.value) // Sort by count descending

    return {
      totalConcepts,
      totalRelationships,
      avgRelationships,
      hubNode,
      categoryData,
    }
  }, [nodes, edges])

  return (
    <Card
      className={`backdrop-blur-md border overflow-hidden ${className}`}
      style={{
        backgroundColor: 'oklch(1 0 0 / 0.85)',
        borderColor: 'oklch(0.85 0.05 240 / 0.3)',
      }}
    >
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: 'oklch(0.4 0.05 240)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'oklch(0.2 0.05 240)' }}>
            Graph Statistics
          </h3>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total concepts */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Network className="w-3 h-3" style={{ color: 'oklch(0.5 0.05 240)' }} />
              <span className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
                Concepts
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.2 0.05 240)' }}>
              {stats.totalConcepts}
            </div>
          </div>

          {/* Total relationships */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3 h-3" style={{ color: 'oklch(0.5 0.05 240)' }} />
              <span className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
                Relationships
              </span>
            </div>
            <div className="text-2xl font-bold" style={{ color: 'oklch(0.2 0.05 240)' }}>
              {stats.totalRelationships}
            </div>
          </div>

          {/* Average connections */}
          <div className="space-y-1 col-span-2">
            <span className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
              Average connections per concept
            </span>
            <div className="text-lg font-semibold" style={{ color: 'oklch(0.3 0.05 240)' }}>
              {stats.avgRelationships.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Hub node */}
        {stats.hubNode && (
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: 'oklch(0.98 0.02 240 / 0.5)',
              borderColor: 'oklch(0.85 0.05 240 / 0.3)',
            }}
          >
            <div className="flex items-start gap-2">
              <Award
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: 'oklch(0.6 0.15 50)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium mb-1" style={{ color: 'oklch(0.4 0.05 240)' }}>
                  Most Connected Concept
                </div>
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: 'oklch(0.2 0.05 240)' }}
                >
                  {stats.hubNode.name}
                </div>
                <Badge
                  variant="secondary"
                  className="mt-1.5 text-xs"
                  style={{
                    backgroundColor: 'oklch(0.6 0.15 240)',
                    color: 'white',
                  }}
                >
                  {stats.hubNode.relationshipCount} connections
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Category distribution chart */}
        {stats.categoryData.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold" style={{ color: 'oklch(0.4 0.05 240)' }}>
              Coverage by Category
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'oklch(1 0 0 / 0.95)',
                      border: '1px solid oklch(0.85 0.05 240 / 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: '11px',
                      paddingTop: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

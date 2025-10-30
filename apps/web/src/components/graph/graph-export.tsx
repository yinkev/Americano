/**
 * GraphExport - Graph data export component
 *
 * Story 3.2 Task 8.4: Graph export functionality
 *
 * Features:
 * - Export as JSON: Full graph data for external analysis
 * - Export as PNG: Static image of current graph view
 * - Export as CSV: Node and edge lists for import to other tools
 * - Dropdown menu with export options
 * - Download progress indication
 *
 * Usage:
 * ```tsx
 * <GraphExport nodes={nodes} edges={edges} />
 * ```
 */

'use client'

import { toPng, toSvg } from 'html-to-image'
import { useCallback, useState } from 'react'
import type { GraphEdge, GraphNode } from '@/components/graph/knowledge-graph'

export interface GraphExportProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export default function GraphExport({ nodes, edges }: GraphExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportingFormat, setExportingFormat] = useState<string | null>(null)

  /**
   * Export as JSON
   * Full graph data with metadata
   */
  const exportAsJSON = useCallback(() => {
    setIsExporting(true)
    setExportingFormat('JSON')

    try {
      const data = {
        nodes: nodes.map((node) => ({
          id: node.id,
          name: node.name,
          description: node.description,
          category: node.category,
          relationshipCount: node.relationshipCount,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          from: edge.fromConceptId,
          to: edge.toConceptId,
          type: edge.relationship,
          strength: edge.strength,
          isUserDefined: edge.isUserDefined,
        })),
        metadata: {
          exportedAt: new Date().toISOString(),
          totalNodes: nodes.length,
          totalEdges: edges.length,
          platform: 'Americano Knowledge Graph',
        },
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export JSON:', error)
      alert('Failed to export graph as JSON. Please try again.')
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
      setIsOpen(false)
    }
  }, [nodes, edges])

  /**
   * Export as PNG
   * Captures current graph visualization
   */
  const exportAsPNG = useCallback(async () => {
    setIsExporting(true)
    setExportingFormat('PNG')

    try {
      // Find the React Flow container
      const graphElement = document.querySelector('.react-flow') as HTMLElement

      if (!graphElement) {
        throw new Error('Graph container not found')
      }

      // Capture as PNG with high quality
      const dataUrl = await toPng(graphElement, {
        quality: 1.0,
        pixelRatio: 2, // 2x resolution for crisp images
        backgroundColor: '#ffffff',
      })

      // Download
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to export PNG:', error)
      alert('Failed to export graph as PNG. Please try again.')
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
      setIsOpen(false)
    }
  }, [])

  /**
   * Export as SVG
   * Captures current graph visualization as scalable vector
   */
  const exportAsSVG = useCallback(async () => {
    setIsExporting(true)
    setExportingFormat('SVG')

    try {
      // Find the React Flow container
      const graphElement = document.querySelector('.react-flow') as HTMLElement

      if (!graphElement) {
        throw new Error('Graph container not found')
      }

      // Capture as SVG
      const dataUrl = await toSvg(graphElement, {
        backgroundColor: '#ffffff',
      })

      // Download
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to export SVG:', error)
      alert('Failed to export graph as SVG. Please try again.')
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
      setIsOpen(false)
    }
  }, [])

  /**
   * Export as CSV
   * Two files: nodes.csv and edges.csv
   */
  const exportAsCSV = useCallback(() => {
    setIsExporting(true)
    setExportingFormat('CSV')

    try {
      // Nodes CSV
      const nodeHeaders = ['id', 'name', 'description', 'category', 'relationshipCount']
      const nodeRows = nodes.map((node) => [
        node.id,
        `"${node.name.replace(/"/g, '""')}"`, // Escape quotes
        node.description ? `"${node.description.replace(/"/g, '""')}"` : '',
        node.category || '',
        node.relationshipCount.toString(),
      ])
      const nodesCSV = [nodeHeaders, ...nodeRows].map((row) => row.join(',')).join('\n')

      // Edges CSV
      const edgeHeaders = ['id', 'fromConceptId', 'toConceptId', 'relationshipType', 'strength']
      const edgeRows = edges.map((edge) => [
        edge.id,
        edge.fromConceptId,
        edge.toConceptId,
        edge.relationship,
        edge.strength.toFixed(2),
      ])
      const edgesCSV = [edgeHeaders, ...edgeRows].map((row) => row.join(',')).join('\n')

      // Download nodes.csv
      const nodesBlob = new Blob([nodesCSV], { type: 'text/csv;charset=utf-8;' })
      const nodesUrl = URL.createObjectURL(nodesBlob)
      const nodesLink = document.createElement('a')
      nodesLink.href = nodesUrl
      nodesLink.download = `knowledge-graph-nodes-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(nodesLink)
      nodesLink.click()
      document.body.removeChild(nodesLink)
      URL.revokeObjectURL(nodesUrl)

      // Download edges.csv
      const edgesBlob = new Blob([edgesCSV], { type: 'text/csv;charset=utf-8;' })
      const edgesUrl = URL.createObjectURL(edgesBlob)
      const edgesLink = document.createElement('a')
      edgesLink.href = edgesUrl
      edgesLink.download = `knowledge-graph-edges-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(edgesLink)
      edgesLink.click()
      document.body.removeChild(edgesLink)
      URL.revokeObjectURL(edgesUrl)
    } catch (error) {
      console.error('Failed to export CSV:', error)
      alert('Failed to export graph as CSV. Please try again.')
    } finally {
      setIsExporting(false)
      setExportingFormat(null)
      setIsOpen(false)
    }
  }, [nodes, edges])

  return (
    <div className="relative">
      {/* Export button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow-lg backdrop-blur-md"
        style={{
          backgroundColor: isExporting ? 'oklch(0.85 0.05 240)' : 'oklch(0.98 0.02 240 / 0.9)',
          color: 'oklch(0.3 0.05 240)',
          borderWidth: '1px',
          borderColor: 'oklch(0.85 0.05 240)',
        }}
        onMouseOver={(e) => {
          if (!isExporting) {
            e.currentTarget.style.backgroundColor = 'oklch(0.95 0.05 240)'
          }
        }}
        onMouseOut={(e) => {
          if (!isExporting) {
            e.currentTarget.style.backgroundColor = 'oklch(0.98 0.02 240 / 0.9)'
          }
        }}
      >
        {isExporting ? (
          <>
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{
                borderColor: 'oklch(0.85 0.05 240)',
                borderTopColor: 'oklch(0.6 0.15 240)',
              }}
            />
            <span>Exporting {exportingFormat}...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Graph
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !isExporting && (
        <div
          className="absolute top-full right-0 mt-2 w-64 rounded-lg shadow-xl overflow-hidden backdrop-blur-md"
          style={{
            backgroundColor: 'oklch(0.98 0.02 240 / 0.95)',
            borderWidth: '1px',
            borderColor: 'oklch(0.85 0.05 240)',
          }}
        >
          {/* JSON export */}
          <button
            onClick={exportAsJSON}
            className="w-full px-4 py-3 text-left transition-colors flex items-start gap-3"
            style={{ color: 'oklch(0.3 0.05 240)' }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.95 0.05 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div>
              <div className="font-semibold text-sm">Export as JSON</div>
              <div className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
                Full graph data for external analysis
              </div>
            </div>
          </button>

          {/* PNG export */}
          <button
            onClick={exportAsPNG}
            className="w-full px-4 py-3 text-left transition-colors flex items-start gap-3 border-t"
            style={{
              color: 'oklch(0.3 0.05 240)',
              borderColor: 'oklch(0.9 0.05 240)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.95 0.05 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <div>
              <div className="font-semibold text-sm">Export as PNG</div>
              <div className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
                Static image of current graph view
              </div>
            </div>
          </button>

          {/* SVG export */}
          <button
            onClick={exportAsSVG}
            className="w-full px-4 py-3 text-left transition-colors flex items-start gap-3 border-t"
            style={{
              color: 'oklch(0.3 0.05 240)',
              borderColor: 'oklch(0.9 0.05 240)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.95 0.05 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            <div>
              <div className="font-semibold text-sm">Export as SVG</div>
              <div className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
                Scalable vector graphics
              </div>
            </div>
          </button>

          {/* CSV export */}
          <button
            onClick={exportAsCSV}
            className="w-full px-4 py-3 text-left transition-colors flex items-start gap-3 border-t"
            style={{
              color: 'oklch(0.3 0.05 240)',
              borderColor: 'oklch(0.9 0.05 240)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'oklch(0.95 0.05 240)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <div>
              <div className="font-semibold text-sm">Export as CSV</div>
              <div className="text-xs" style={{ color: 'oklch(0.5 0.05 240)' }}>
                Node and edge lists (2 files)
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

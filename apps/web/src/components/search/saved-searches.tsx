/**
 * SavedSearches Component
 * Story 3.6 Task 3.4: Create saved searches UI
 *
 * Features:
 * - List of saved searches with alert badges
 * - Click to run saved search
 * - Edit/Delete buttons for each saved search
 * - Toggle switch for alert enable/disable
 * - "New results" badge when alert triggered
 * - Export saved searches to JSON
 *
 * @module SavedSearches
 */

'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Play, Edit2, Trash2, Download, Plus } from 'lucide-react'

/**
 * Saved search interface
 */
export interface SavedSearch {
  id: string
  name: string
  query: string
  filters?: any
  alertEnabled: boolean
  alertFrequency: 'IMMEDIATE' | 'DAILY' | 'WEEKLY'
  lastRun?: string
  resultCount?: number
  createdAt: string
  updatedAt: string
  unreadAlertCount?: number
}

/**
 * Component props
 */
export interface SavedSearchesProps {
  /** Callback when a search is executed */
  onRunSearch: (searchId: string) => void
  /** Optional CSS class name */
  className?: string
}

/**
 * SavedSearches Component
 */
export function SavedSearches({ onRunSearch, className = '' }: SavedSearchesProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch saved searches
   */
  const fetchSavedSearches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/graph/searches/saved')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.searches)) {
        setSearches(data.searches)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Failed to fetch saved searches:', err)
      setError('Failed to load saved searches')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load saved searches on mount
   */
  useEffect(() => {
    fetchSavedSearches()
  }, [])

  /**
   * Toggle alert for a search
   */
  const toggleAlert = async (searchId: string, currentlyEnabled: boolean) => {
    try {
      const response = await fetch(`/api/graph/searches/saved/${searchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertEnabled: !currentlyEnabled,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update alert')
      }

      // Refresh list
      await fetchSavedSearches()
    } catch (err) {
      console.error('Failed to toggle alert:', err)
      alert('Failed to toggle alert. Please try again.')
    }
  }

  /**
   * Delete a saved search
   */
  const deleteSearch = async (searchId: string, name: string) => {
    if (!confirm(`Delete saved search "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/graph/searches/saved/${searchId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete search')
      }

      // Remove from local state
      setSearches(prev => prev.filter(s => s.id !== searchId))
    } catch (err) {
      console.error('Failed to delete search:', err)
      alert('Failed to delete search. Please try again.')
    }
  }

  /**
   * Export saved searches to JSON
   */
  const exportSearches = () => {
    const dataStr = JSON.stringify(searches, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `saved-searches-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className={`rounded-lg border border-oklch-gray-200 bg-white/80 backdrop-blur-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-oklch-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-oklch-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-oklch-red-200 bg-oklch-red-50 p-6 ${className}`}>
        <p className="text-oklch-red-700">{error}</p>
        <button
          onClick={fetchSavedSearches}
          className="mt-2 text-sm text-oklch-red-600 hover:text-oklch-red-800 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-oklch-gray-200 bg-white/80 backdrop-blur-md ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-oklch-gray-200">
        <h3 className="text-lg font-semibold text-oklch-gray-900">
          Saved Searches
        </h3>
        <div className="flex items-center gap-2">
          {searches.length > 0 && (
            <button
              onClick={exportSearches}
              className="p-2 rounded-lg hover:bg-oklch-gray-100 transition-colors"
              title="Export to JSON"
            >
              <Download className="h-4 w-4 text-oklch-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Searches list */}
      {searches.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-oklch-gray-500 mb-2">No saved searches yet</p>
          <p className="text-sm text-oklch-gray-400">
            Save a search to get alerts when new content matches
          </p>
        </div>
      ) : (
        <div className="divide-y divide-oklch-gray-100">
          {searches.map(search => (
            <div
              key={search.id}
              className="p-4 hover:bg-oklch-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Search info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-oklch-gray-900 truncate">
                      {search.name}
                    </h4>

                    {/* Alert badge */}
                    {search.unreadAlertCount && search.unreadAlertCount > 0 && (
                      <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-oklch-blue-100 text-oklch-blue-700">
                        {search.unreadAlertCount} new
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-oklch-gray-600 truncate mb-2">
                    {search.query}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-oklch-gray-500">
                    {search.lastRun && (
                      <span>
                        Last run: {formatDate(search.lastRun)}
                      </span>
                    )}
                    {search.resultCount !== undefined && (
                      <span>
                        {search.resultCount} results
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Run button */}
                  <button
                    onClick={() => onRunSearch(search.id)}
                    className="p-2 rounded-lg hover:bg-oklch-blue-100 text-oklch-blue-600 transition-colors"
                    title="Run search"
                  >
                    <Play className="h-4 w-4" />
                  </button>

                  {/* Alert toggle */}
                  <button
                    onClick={() => toggleAlert(search.id, search.alertEnabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      search.alertEnabled
                        ? 'bg-oklch-blue-100 text-oklch-blue-600'
                        : 'hover:bg-oklch-gray-100 text-oklch-gray-400'
                    }`}
                    title={search.alertEnabled ? 'Alerts enabled' : 'Alerts disabled'}
                  >
                    {search.alertEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteSearch(search.id, search.name)}
                    className="p-2 rounded-lg hover:bg-oklch-red-100 text-oklch-red-600 transition-colors"
                    title="Delete search"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

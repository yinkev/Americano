'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SearchFilters } from '@/components/search/search-filters'
import type { SearchResult } from '@/components/search/search-results'
import { useDebounce } from './use-debounce'

interface UseSearchOptions {
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceDelay?: number

  /**
   * Minimum query length to trigger search
   * @default 2
   */
  minQueryLength?: number

  /**
   * Initial filters
   */
  initialFilters?: SearchFilters

  /**
   * Auto-search on mount
   * @default false
   */
  autoSearchOnMount?: boolean
}

interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  totalResults: number
  executeSearch: () => Promise<void>
  clearSearch: () => void
}

const DEFAULT_FILTERS: SearchFilters = {
  courseIds: [],
  contentTypes: [],
  dateRange: undefined,
}

/**
 * Custom hook for managing search state and executing searches
 * with debouncing and error handling
 */
export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceDelay = 300,
    minQueryLength = 2,
    initialFilters = DEFAULT_FILTERS,
    autoSearchOnMount = false,
  } = options

  // State management
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  // Debounced query for automatic search
  const debouncedQuery = useDebounce(query, debounceDelay)

  /**
   * Execute search API call
   */
  const executeSearch = useCallback(async () => {
    // Validate query length
    if (debouncedQuery.trim().length < minQueryLength) {
      setResults([])
      setTotalResults(0)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/graph/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: debouncedQuery,
          filters,
          limit: 50,
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setResults(data.data.results || [])
        setTotalResults(data.data.total || 0)
      } else {
        throw new Error(data.error || 'Search failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setResults([])
      setTotalResults(0)
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedQuery, filters, minQueryLength])

  /**
   * Clear search results and reset state
   */
  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
    setTotalResults(0)
  }, [])

  /**
   * Auto-execute search when debounced query or filters change
   */
  useEffect(() => {
    if (debouncedQuery.trim().length >= minQueryLength) {
      executeSearch()
    }
  }, [debouncedQuery, filters, executeSearch, minQueryLength])

  /**
   * Execute search on mount if autoSearchOnMount is enabled
   */
  useEffect(() => {
    if (autoSearchOnMount && query.trim().length >= minQueryLength) {
      executeSearch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    error,
    totalResults,
    executeSearch,
    clearSearch,
  }
}

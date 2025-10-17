/**
 * SearchAutocomplete Component
 * Story 3.6 Task 2.4: Create autocomplete UI component
 *
 * Features:
 * - Dropdown appears below search bar with suggestions
 * - Keyboard navigation (Up/Down arrows, Enter, Escape)
 * - Click to select suggestion
 * - Visual indicators for suggestion type (icon, badge)
 * - Shows recent searches when input is empty
 * - Debounced API calls (150ms)
 *
 * @module SearchAutocomplete
 */

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Search, Clock, BookOpen, Brain, FileText, Target } from 'lucide-react'

/**
 * Suggestion type from API
 */
export interface Suggestion {
  text: string
  type: 'MEDICAL_TERM' | 'PREVIOUS_SEARCH' | 'CONTENT_TITLE' | 'CONCEPT' | 'LEARNING_OBJECTIVE'
  metadata?: {
    source?: string
    category?: string
    frequency?: number
  }
  score: number
}

/**
 * Component props
 */
export interface SearchAutocompleteProps {
  /** Current search query */
  query: string
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: string) => void
  /** Optional CSS class name */
  className?: string
  /** Show recent searches when query is empty (default: true) */
  showRecentOnEmpty?: boolean
}

/**
 * Debounce utility
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Get icon for suggestion type
 */
function getSuggestionIcon(type: Suggestion['type']) {
  switch (type) {
    case 'MEDICAL_TERM':
      return <Search className="h-4 w-4 text-oklch-blue" />
    case 'PREVIOUS_SEARCH':
      return <Clock className="h-4 w-4 text-oklch-gray" />
    case 'CONTENT_TITLE':
      return <BookOpen className="h-4 w-4 text-oklch-green" />
    case 'CONCEPT':
      return <Brain className="h-4 w-4 text-oklch-purple" />
    case 'LEARNING_OBJECTIVE':
      return <Target className="h-4 w-4 text-oklch-orange" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

/**
 * Get badge label for suggestion type
 */
function getSuggestionBadge(type: Suggestion['type']): string {
  switch (type) {
    case 'MEDICAL_TERM':
      return 'Medical'
    case 'PREVIOUS_SEARCH':
      return 'Recent'
    case 'CONTENT_TITLE':
      return 'Lecture'
    case 'CONCEPT':
      return 'Concept'
    case 'LEARNING_OBJECTIVE':
      return 'Objective'
    default:
      return ''
  }
}

/**
 * SearchAutocomplete Component
 */
export function SearchAutocomplete({
  query,
  onSelect,
  className = '',
  showRecentOnEmpty = true,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce query for API calls (150ms delay)
  const debouncedQuery = useDebounce(query, 150)

  /**
   * Fetch suggestions from API
   */
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    try {
      setLoading(true)

      const url = new URL('/api/graph/autocomplete', window.location.origin)
      url.searchParams.set('q', searchQuery)
      url.searchParams.set('limit', '10')

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions)
        setIsOpen(data.suggestions.length > 0)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch suggestions when debounced query changes
   */
  useEffect(() => {
    if (debouncedQuery.length >= 2 || (showRecentOnEmpty && debouncedQuery.length === 0)) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [debouncedQuery, fetchSuggestions, showRecentOnEmpty])

  /**
   * Handle suggestion selection
   */
  const handleSelect = useCallback((suggestion: Suggestion) => {
    onSelect(suggestion.text)
    setIsOpen(false)
    setSelectedIndex(-1)
  }, [onSelect])

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break

      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break

      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, suggestions, selectedIndex, handleSelect])

  /**
   * Attach keyboard event listener
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!isOpen || suggestions.length === 0) {
    return null
  }

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-50 mt-2 w-full rounded-lg border border-oklch-gray-200 bg-white/95 backdrop-blur-md shadow-lg ${className}`}
      style={{ maxHeight: '400px', overflowY: 'auto' }}
    >
      {/* Loading indicator */}
      {loading && (
        <div className="px-4 py-2 text-sm text-oklch-gray-500">
          Loading suggestions...
        </div>
      )}

      {/* Suggestions list */}
      {!loading && (
        <ul className="py-2">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.text}`}
              className={`cursor-pointer px-4 py-2.5 transition-colors ${
                index === selectedIndex
                  ? 'bg-oklch-blue-100'
                  : 'hover:bg-oklch-gray-50'
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                  {getSuggestionIcon(suggestion.type)}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-oklch-gray-900 truncate">
                      {suggestion.text}
                    </span>

                    {/* Type badge */}
                    <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-oklch-gray-100 text-oklch-gray-600">
                      {getSuggestionBadge(suggestion.type)}
                    </span>
                  </div>

                  {/* Metadata */}
                  {suggestion.metadata?.category && (
                    <div className="text-xs text-oklch-gray-500 mt-0.5 truncate">
                      {suggestion.metadata.category}
                    </div>
                  )}
                </div>

                {/* Frequency indicator for popular searches */}
                {suggestion.metadata?.frequency && suggestion.metadata.frequency > 10 && (
                  <div className="flex-shrink-0 text-xs text-oklch-gray-400">
                    Popular
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Footer hint */}
      <div className="border-t border-oklch-gray-200 px-4 py-2 text-xs text-oklch-gray-500">
        <kbd className="px-1.5 py-0.5 rounded bg-oklch-gray-100 font-mono">↑</kbd>
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-oklch-gray-100 font-mono">↓</kbd>
        {' '}to navigate,
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-oklch-gray-100 font-mono">Enter</kbd>
        {' '}to select,
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-oklch-gray-100 font-mono">Esc</kbd>
        {' '}to close
      </div>
    </div>
  )
}

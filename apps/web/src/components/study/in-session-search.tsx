'use client'

/**
 * InSessionSearch Component
 *
 * Epic 3 - Story 3.6 - Task 7: Study Session Search Integration
 *
 * Features:
 * - Cmd/Ctrl+K keyboard shortcut to open
 * - Modal overlay with search bar
 * - Contextual pre-population from current objective/mission
 * - "Add to Session" action on results
 * - Session search history tracking
 */

import { Command, History, Loader2, Plus, Search, X } from 'lucide-react'
import * as React from 'react'
import { type SearchResult, SearchResultItem } from '@/components/search/search-result-item'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface InSessionSearchProps {
  /** Current mission ID (for context) */
  missionId?: string
  /** Current study session ID */
  sessionId?: string
  /** Current learning objective being studied */
  currentObjective?: string
  /** Pre-populate search with keywords */
  initialKeywords?: string[]
  /** Callback when content is added to session */
  onAddToSession?: (contentId: string, contentType: string) => Promise<void>
  /** Callback when search is performed (for history tracking) */
  onSearchPerformed?: (query: string) => void
}

interface SearchHistoryItem {
  query: string
  timestamp: Date
}

export function InSessionSearch({
  missionId,
  sessionId,
  currentObjective,
  initialKeywords = [],
  onAddToSession,
  onSearchPerformed,
}: InSessionSearchProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryItem[]>([])
  const [addingToSession, setAddingToSession] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd/Ctrl + K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when dialog opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Pre-populate search with context
  React.useEffect(() => {
    if (isOpen && initialKeywords.length > 0 && !query) {
      const contextQuery = initialKeywords.join(' ')
      setQuery(contextQuery)
    }
  }, [isOpen, initialKeywords, query])

  // Load search history from session storage
  React.useEffect(() => {
    if (sessionId) {
      const historyKey = `session-search-history-${sessionId}`
      const stored = sessionStorage.getItem(historyKey)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as SearchHistoryItem[]
          setSearchHistory(
            parsed.map((item) => ({
              ...item,
              timestamp: new Date(item.timestamp),
            })),
          )
        } catch (error) {
          console.error('Failed to parse search history:', error)
        }
      }
    }
  }, [sessionId])

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)

    try {
      const response = await fetch('/api/graph/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          limit: 10,
        }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data.results || [])

      // Add to search history
      const newHistoryItem: SearchHistoryItem = {
        query: query.trim(),
        timestamp: new Date(),
      }

      const updatedHistory = [newHistoryItem, ...searchHistory.slice(0, 9)] // Keep last 10

      setSearchHistory(updatedHistory)

      // Save to session storage
      if (sessionId) {
        const historyKey = `session-search-history-${sessionId}`
        sessionStorage.setItem(historyKey, JSON.stringify(updatedHistory))
      }

      // Notify parent
      onSearchPerformed?.(query.trim())
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Failed to perform search',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddToSession = async (result: SearchResult) => {
    if (!onAddToSession) {
      toast({
        title: 'Not available',
        description: 'Add to session functionality is not configured',
        variant: 'destructive',
      })
      return
    }

    setAddingToSession(result.id)

    try {
      await onAddToSession(result.id, result.type)

      toast({
        title: 'Added to session',
        description: `${result.title} has been added to your current study session`,
      })

      // Close dialog after successful add
      setTimeout(() => {
        setIsOpen(false)
      }, 500)
    } catch (error) {
      console.error('Add to session error:', error)
      toast({
        title: 'Failed to add',
        description: error instanceof Error ? error.message : 'Failed to add content to session',
        variant: 'destructive',
      })
    } finally {
      setAddingToSession(null)
    }
  }

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery)
    handleSearch()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-3xl max-h-[80vh] p-0 bg-white/95 backdrop-blur-md border-white/40"
        aria-describedby="in-session-search-description"
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">
                Search During Study Session
              </DialogTitle>
              <DialogDescription
                id="in-session-search-description"
                className="text-sm text-muted-foreground mt-1"
              >
                {currentObjective ? (
                  <>
                    Searching in context of: <span className="font-medium">{currentObjective}</span>
                  </>
                ) : (
                  <>Find relevant content and add it to your current session</>
                )}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="text-xs gap-1">
              <Command className="size-3" aria-hidden="true" />
              <span>K</span>
            </Badge>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search lectures, concepts, objectives..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 bg-white/60 border-white/40"
                aria-label="Search query"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="shrink-0"
              aria-label="Perform search"
            >
              {isSearching ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="size-4 mr-2" aria-hidden="true" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && results.length === 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <History className="size-3 text-muted-foreground" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.slice(0, 5).map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleHistoryClick(item.query)}
                    className="text-xs bg-white/40 hover:bg-white/60 border-white/40"
                  >
                    {item.query}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1 px-6 pb-6" style={{ maxHeight: 'calc(80vh - 200px)' }}>
          {results.length > 0 ? (
            <div className="space-y-3" role="list" aria-label="Search results">
              {results.map((result) => (
                <div key={result.id} className="relative" role="listitem">
                  <SearchResultItem result={result} searchQuery={query} />
                  {onAddToSession && (
                    <div className="absolute top-4 right-4">
                      <Button
                        size="sm"
                        onClick={() => handleAddToSession(result)}
                        disabled={addingToSession === result.id}
                        className="bg-primary/90 hover:bg-primary rounded-lg shadow-sm"
                        aria-label={`Add ${result.title} to current session`}
                      >
                        {addingToSession === result.id ? (
                          <>
                            <Loader2 className="size-3 mr-1 animate-spin" aria-hidden="true" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="size-3 mr-1" aria-hidden="true" />
                            Add to Session
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !isSearching &&
            query && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="size-12 mx-auto mb-3 opacity-50" aria-hidden="true" />
                <p>No results found. Try a different search query.</p>
              </div>
            )
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

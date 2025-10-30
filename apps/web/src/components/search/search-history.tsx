/**
 * Search History Component
 *
 * Displays recent and saved searches with quick actions
 * - Recent searches with timestamps
 * - Saved searches with use counts
 * - Quick search execution
 * - Save/remove actions
 */

'use client'

import { Clock, Star, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  selectRecentSearches,
  selectSavedSearches,
  useSearchStore,
} from '@/stores'

export interface SearchHistoryProps {
  onSelectSearch: (query: string) => void
}

export function SearchHistory({ onSelectSearch }: SearchHistoryProps) {
  const recentSearches = useSearchStore(selectRecentSearches)
  const savedSearches = useSearchStore(selectSavedSearches)
  const {
    clearRecentSearches,
    removeRecentSearch,
    removeSavedSearch,
    loadSavedSearch,
  } = useSearchStore()

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </CardTitle>
                <CardDescription className="text-xs">
                  Your last {recentSearches.length} searches
                </CardDescription>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear all</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSearches.slice(0, 5).map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
                >
                  <button
                    onClick={() => onSelectSearch(search.query)}
                    className="flex-1 text-left text-sm truncate"
                  >
                    <div className="font-medium truncate">{search.query}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{formatTimestamp(search.timestamp)}</span>
                      <span>•</span>
                      <span>{search.resultCount} results</span>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecentSearch(search.id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4" />
              Saved Searches
            </CardTitle>
            <CardDescription className="text-xs">
              Quick access to your favorite searches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
                >
                  <button
                    onClick={() => loadSavedSearch(search.id)}
                    className="flex-1 text-left text-sm"
                  >
                    <div className="font-medium truncate">{search.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {search.query}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Used {search.useCount} times
                      </Badge>
                      {search.lastUsed && (
                        <span>{formatTimestamp(search.lastUsed)}</span>
                      )}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSavedSearch(search.id)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {recentSearches.length === 0 && savedSearches.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No search history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start searching to see your history here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

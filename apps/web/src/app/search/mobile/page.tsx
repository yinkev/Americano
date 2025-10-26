"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Wifi, WifiOff, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchBarMobile } from "@/components/search/search-bar-mobile"
import { SearchFiltersMobile, type SearchFilters } from "@/components/search/search-filters-mobile"
import { SearchResultsMobile } from "@/components/search/search-results-mobile"
import { useOnlineStatus } from "@/lib/offline-search"
import { getCachedSearchResults, cacheSearchResults, getRecentSearches } from "@/lib/offline-search"
import { registerSearchServiceWorker, setupOfflineSync } from "@/lib/search-sw-integration"
import type { SearchResult } from "@/components/search/search-result-item"

export default function MobileSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnline = useOnlineStatus()

  const [query, setQuery] = React.useState(searchParams.get("q") || "")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [filters, setFilters] = React.useState<SearchFilters>({})
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  // Initialize service worker and offline sync
  React.useEffect(() => {
    registerSearchServiceWorker()
    setupOfflineSync()
    loadRecentSearches()
  }, [])

  // Load recent searches from IndexedDB
  const loadRecentSearches = async () => {
    const recent = await getRecentSearches(5)
    setRecentSearches(recent.map((s) => s.query))
  }

  // Perform search (online or offline)
  const performSearch = React.useCallback(
    async (searchQuery: string, searchFilters: SearchFilters = {}, pageNum = 1) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)

      try {
        // Try to get cached results first (offline or for speed)
        const cached = await getCachedSearchResults(searchQuery, searchFilters)
        if (cached && !isOnline) {
          setResults(cached)
          setIsLoading(false)
          return
        }

        // Fetch from API if online
        if (isOnline) {
          const params = new URLSearchParams({
            q: searchQuery,
            page: pageNum.toString(),
            limit: "20",
          })

          if (searchFilters.courses?.length) {
            params.set("courses", searchFilters.courses.join(","))
          }
          if (searchFilters.tags?.length) {
            params.set("tags", searchFilters.tags.join(","))
          }
          if (searchFilters.difficulty?.length) {
            params.set("difficulty", searchFilters.difficulty.join(","))
          }
          if (searchFilters.highYieldOnly) {
            params.set("highYield", "true")
          }

          const response = await fetch(`/api/search?${params}`)
          if (!response.ok) throw new Error("Search failed")

          const data = await response.json()
          const newResults = pageNum === 1 ? data.results : [...results, ...data.results]

          setResults(newResults)
          setHasMore(data.hasMore || false)

          // Cache results for offline access
          await cacheSearchResults(searchQuery, data.results, searchFilters)
        } else if (cached) {
          // Use cached results if offline
          setResults(cached)
        } else {
          throw new Error("No cached results available offline")
        }
      } catch (error) {
        console.error("Search error:", error)

        // Try cache as fallback
        const cached = await getCachedSearchResults(searchQuery, searchFilters)
        if (cached) {
          setResults(cached)
        } else {
          setResults([])
        }
      } finally {
        setIsLoading(false)
      }
    },
    [isOnline, results]
  )

  // Handle search submission
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setPage(1)
    performSearch(searchQuery, filters, 1)

    // Update URL
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    router.push(`?${params}`, { scroll: false })
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    if (query) {
      setPage(1)
      performSearch(query, newFilters, 1)
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    performSearch(query, filters, nextPage)
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    if (query && isOnline) {
      await performSearch(query, filters, 1)
    }
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(`/library/${result.id}`)
  }

  // Load initial search from URL
  React.useEffect(() => {
    const urlQuery = searchParams.get("q")
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
      performSearch(urlQuery, filters, 1)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-card  ">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card  border-b border-border pb-safe">
        <div className="p-4 space-y-4">
          {/* Top Bar */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go back"
              className="h-11 w-11 rounded-xl shrink-0"
            >
              <ArrowLeft className="size-5" />
            </Button>

            <h1 className="text-xl font-bold flex-1">Search</h1>

            {/* Online/Offline Indicator */}
            <Badge
              variant={isOnline ? "default" : "secondary"}
              className="gap-1.5 h-8 px-3"
              aria-label={isOnline ? "Online" : "Offline"}
            >
              {isOnline ? (
                <>
                  <Wifi className="size-3.5" />
                  <span className="text-xs font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="size-3.5" />
                  <span className="text-xs font-medium">Offline</span>
                </>
              )}
            </Badge>
          </div>

          {/* Search Bar */}
          <SearchBarMobile
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
            enableVoiceSearch={isOnline}
            autoFocus={false}
          />

          {/* Filters */}
          <div className="flex items-center gap-3">
            <SearchFiltersMobile
              filters={filters}
              onFiltersChange={handleFiltersChange}
              className="flex-1"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto p-4">
        {/* Recent Searches (shown when no query) */}
        {!query && recentSearches.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((recent, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(recent)}
                  className="h-10 px-4 rounded-xl"
                >
                  {recent}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Offline Notice */}
        {!isOnline && query && (
          <div
            className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <WifiOff className="size-5 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">You're offline</p>
                <p className="text-sm text-amber-800 mt-1">
                  Showing cached results. Connect to the internet for the latest content.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {query && (
          <SearchResultsMobile
            results={results}
            isLoading={isLoading}
            searchQuery={query}
            onResultClick={handleResultClick}
            onLoadMore={handleLoadMore}
            hasMore={hasMore && isOnline}
            onRefresh={isOnline ? handleRefresh : undefined}
          />
        )}

        {/* Empty State */}
        {!query && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Start searching for medical content, lectures, and concepts
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

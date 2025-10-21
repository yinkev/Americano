"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { SearchBar } from "@/components/search/search-bar"
import { SearchFilters } from "@/components/search/search-filters"
import { SearchResults } from "@/components/search/search-results"
import { SearchError } from "@/components/search/search-error"
import { useSearch } from "@/hooks/use-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

/**
 * Search page with full semantic search functionality
 * Includes search bar, filters, results, error handling, and pagination
 */
export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [currentPage, setCurrentPage] = React.useState(1)
  const [courses, setCourses] = React.useState<Array<{ id: string; name: string; code?: string }>>([])

  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    isLoading,
    error,
    totalResults,
    executeSearch,
  } = useSearch({
    debounceDelay: 300,
    minQueryLength: 2,
    autoSearchOnMount: initialQuery.length >= 2,
  })

  // Set initial query from URL params
  React.useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  // Fetch available courses for filters
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCourses(data.data || data.courses || [])
          }
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error)
      }
    }

    fetchCourses()
  }, [])

  // Update URL when query changes
  React.useEffect(() => {
    if (query) {
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false })
    }
  }, [query, router])

  // Calculate pagination
  const totalPages = Math.ceil(results.length / 20)
  const paginatedResults = results.slice(
    (currentPage - 1) * 20,
    currentPage * 20
  )

  // Reset page when results change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [results])

  return (
    <SidebarInset>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Semantic Search
          </h1>
          <p className="text-muted-foreground">
            Find lectures, learning objectives, flashcards, and concepts using natural language
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-3xl">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSearch={executeSearch}
            isLoading={isLoading}
            placeholder="Search for medical terms, concepts, or questions..."
            autoFocus
          />
        </div>

        {/* Error Display */}
        {error && (
          <SearchError error={error} onRetry={executeSearch} />
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-6 space-y-6">
              <SearchFilters
                courses={courses}
                filters={filters}
                onChange={setFilters}
              />

              {/* Search Tips */}
              {query.length === 0 && (
                <Card className="border-white/40 bg-white/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-sm">Search Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-2">
                    <p>• Use natural language questions</p>
                    <p>• Search for medical terms or concepts</p>
                    <p>• Filter by course or content type</p>
                    <p>• Press Cmd+K for quick search</p>
                  </CardContent>
                </Card>
              )}

              {/* Keyboard Shortcuts */}
              <Card className="border-white/40 bg-white/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quick search</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      ⌘K
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Execute search</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      ↵
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Navigate results</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      ↑↓
                    </kbd>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {query.length > 0 && query.length < 2 && (
              <Card className="border-white/40 bg-white/80 backdrop-blur-md text-center py-8">
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enter at least 2 characters to search
                  </p>
                </CardContent>
              </Card>
            )}

            {query.length >= 2 && !error && (
              <>
                {/* Results Summary */}
                {!isLoading && results.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      {totalResults} {totalResults === 1 ? "result" : "results"} found
                      {query && ` for "${query}"`}
                    </h2>
                    <Separator className="mt-2 bg-white/40" />
                  </div>
                )}

                {/* Search Results */}
                <SearchResults
                  results={paginatedResults}
                  isLoading={isLoading}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchQuery={query}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarInset>
  )
}

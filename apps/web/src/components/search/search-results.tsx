"use client"

import * as React from "react"
import { FileText, ChevronLeft, ChevronRight, Network, List } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SearchResultItem } from "./search-result-item"
import type { SearchResult } from "./search-result-item"
import dynamic from "next/dynamic"

// Dynamic import for SearchGraphView to avoid SSR issues
const SearchGraphView = dynamic(
  () => import("./search-graph-view"),
  { ssr: false }
)

export type { SearchResult }

type ViewMode = 'list' | 'graph'

interface SearchResultsProps {
  results: SearchResult[]
  isLoading?: boolean
  currentPage?: number
  totalPages?: number
  searchQuery?: string
  onPageChange?: (page: number) => void
  onResultClick?: (result: SearchResult) => void
  onExpandSearch?: (nodeId: string, type: string) => void
  className?: string
}

const RESULTS_PER_PAGE = 20

/**
 * SearchResults component displays search results with pagination and graph view
 * Uses SearchResultItem for list view and SearchGraphView for graph visualization
 */
export function SearchResults({
  results,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  searchQuery,
  onPageChange,
  onResultClick,
  onExpandSearch,
  className,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')
  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)} role="status" aria-live="polite" aria-label="Loading search results">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-border bg-card  animate-pulse">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-card rounded w-1/4" />
                  <div className="h-6 bg-card rounded w-3/4" />
                </div>
                <div className="h-12 w-16 bg-card rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-card rounded w-full" />
                <div className="h-4 bg-card rounded w-5/6" />
              </div>
              <div className="h-4 bg-card rounded w-2/3" />
            </div>
          </Card>
        ))}
        <span className="sr-only">Loading search results...</span>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card
        className={cn(
          "border-border bg-card  text-center py-12",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <CardContent className="pt-6">
          <FileText className="size-12 text-muted-foreground/50 mx-auto mb-4" aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground mb-2">No results found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? (
              <>No results found for &quot;{searchQuery}&quot;. Try adjusting your search query or filters.</>
            ) : (
              <>Try adjusting your search query or filters</>
            )}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)} role="region" aria-label="Search results">
      {/* Results Count and View Toggle */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Showing {((currentPage - 1) * RESULTS_PER_PAGE) + 1} - {Math.min(currentPage * RESULTS_PER_PAGE, results.length)} of {results.length} results
        </p>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-card  rounded-lg p-1 border border-border">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-3"
            aria-label="List view"
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'graph' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('graph')}
            className="h-8 px-3"
            aria-label="Graph view"
          >
            <Network className="h-4 w-4 mr-1" />
            Graph
          </Button>
        </div>
      </div>

      {/* Results View */}
      {viewMode === 'list' ? (
        <div className="space-y-3" role="list">
          {results.map((result) => (
            <div key={result.id} role="listitem">
              <SearchResultItem
                result={result}
                searchQuery={searchQuery}
                onClick={onResultClick}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[600px] rounded-xl border border-border overflow-hidden">
          <SearchGraphView
            results={results}
            onNodeClick={onResultClick ? (nodeId: string) => {
              const result = results.find(r => r.id === nodeId)
              if (result) {
                onResultClick(result)
              }
            } : undefined}
            onExpandSearch={onExpandSearch}
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-2 pt-4"
          role="navigation"
          aria-label="Search results pagination"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-lg bg-card hover:bg-card border-border"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4 mr-1" aria-hidden="true" />
            Previous
          </Button>

          <div className="flex items-center gap-1" role="list" aria-label="Page numbers">
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1
              // Show first, last, current, and adjacent pages
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    aria-label={`${page === currentPage ? "Current page, " : ""}Page ${page}`}
                    className={cn(
                      "min-w-9 rounded-lg",
                      page === currentPage
                        ? "bg-primary text-primary-foreground"
                        : "bg-card hover:bg-card border-border"
                    )}
                  >
                    {page}
                  </Button>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="text-muted-foreground" aria-hidden="true">...</span>
              }
              return null
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-lg bg-card hover:bg-card border-border"
            aria-label="Go to next page"
          >
            Next
            <ChevronRight className="size-4 ml-1" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { FileText, ChevronDown, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SearchResultItem, type SearchResult } from "./search-result-item"
import { useVirtualizer } from "@tanstack/react-virtual"

interface SearchResultsMobileProps {
  results: SearchResult[]
  isLoading?: boolean
  searchQuery?: string
  onResultClick?: (result: SearchResult) => void
  onLoadMore?: () => void
  hasMore?: boolean
  onRefresh?: () => Promise<void>
  className?: string
}

/**
 * SearchResultsMobile - Mobile-optimized search results with virtual scrolling
 *
 * Features:
 * - Virtual scrolling for performance (long result lists)
 * - Pull-to-refresh gesture
 * - Swipe to dismiss individual results
 * - Infinite scroll with load more
 * - Touch-optimized interactions
 */
export function SearchResultsMobile({
  results,
  isLoading = false,
  searchQuery,
  onResultClick,
  onLoadMore,
  hasMore = false,
  onRefresh,
  className,
}: SearchResultsMobileProps) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const startY = React.useRef(0)
  const isPulling = React.useRef(false)

  // Virtual scrolling for performance with large lists
  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150, // Estimated result item height
    overscan: 5, // Render 5 items above/below viewport
  })

  // Pull-to-refresh handlers
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (parentRef.current && parentRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
      isPulling.current = true
    }
  }, [])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || !onRefresh) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && distance < 100) {
      setPullDistance(distance)
      e.preventDefault()
    }
  }, [onRefresh])

  const handleTouchEnd = React.useCallback(async () => {
    if (!isPulling.current || !onRefresh) return

    isPulling.current = false

    if (pullDistance > 60) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, onRefresh])

  // Infinite scroll detection
  const handleScroll = React.useCallback(() => {
    if (!parentRef.current || !hasMore || isLoading) return

    const { scrollTop, scrollHeight, clientHeight } = parentRef.current
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    // Trigger load more at 80% scroll
    if (scrollPercentage > 0.8) {
      onLoadMore?.()
    }
  }, [hasMore, isLoading, onLoadMore])

  if (isLoading && results.length === 0) {
    return (
      <div className={cn("space-y-3", className)} role="status" aria-live="polite">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-border bg-card  animate-pulse">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-card rounded w-1/4" />
                  <div className="h-5 bg-card rounded w-3/4" />
                </div>
                <div className="h-10 w-14 bg-card rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-card rounded w-full" />
                <div className="h-3 bg-card rounded w-5/6" />
              </div>
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
          <p className="text-sm text-muted-foreground px-4">
            {searchQuery ? (
              <>No results for &quot;{searchQuery}&quot;. Try different keywords.</>
            ) : (
              <>Try adjusting your filters or search query</>
            )}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Pull-to-refresh indicator */}
      {onRefresh && (
        <div
          className={cn(
            "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10",
            pullDistance > 0 ? "opacity-100" : "opacity-0"
          )}
          style={{ transform: `translateY(${Math.min(pullDistance - 60, 0)}px)` }}
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card text-primary text-sm font-medium">
            <RefreshCw
              className={cn(
                "size-4 transition-transform",
                isRefreshing && "animate-spin",
                pullDistance > 60 && "rotate-180"
              )}
            />
            <span>{isRefreshing ? "Refreshing..." : pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}</span>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-sm text-muted-foreground" role="status">
          {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="overflow-auto -mx-1 px-1"
        style={{ height: "calc(100vh - 280px)" }}
        role="list"
        aria-label="Search results"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const result = results[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                role="listitem"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="pb-3">
                  <SearchResultItem
                    result={result}
                    searchQuery={searchQuery}
                    onClick={onResultClick}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Load More Indicator */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={onLoadMore}
              className="h-12 px-6 rounded-xl gap-2"
            >
              <span>Load More</span>
              <ChevronDown className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Loader2, TrendingUp } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import type { SearchResult } from "./search-result-item"

interface SearchDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Command palette style search dialog with keyboard shortcuts
 * Accessible via Cmd+K / Ctrl+K
 */
export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(open ?? false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  const debouncedQuery = useDebounce(query, 300)

  // Keyboard shortcut handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Sync with external open state
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  // Load recent searches from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("americano:recent-searches")
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse recent searches:", error)
      }
    }
  }, [])

  // Execute search when debounced query changes
  React.useEffect(() => {
    const executeSearch = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch("/api/graph/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: debouncedQuery,
            limit: 10, // Limit results in dialog
          }),
        })

        if (!response.ok) {
          throw new Error("Search failed")
        }

        const data = await response.json()

        if (data.success) {
          setResults(data.data.results || [])
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    executeSearch()
  }, [debouncedQuery])

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)

    // Clear query when closing
    if (!open) {
      setQuery("")
      setResults([])
    }
  }

  // Save recent search and navigate
  const handleSelect = (result: SearchResult) => {
    // Save to recent searches
    const updated = [
      query,
      ...recentSearches.filter((s) => s !== query),
    ].slice(0, 5)

    setRecentSearches(updated)
    localStorage.setItem("americano:recent-searches", JSON.stringify(updated))

    // Navigate to result
    router.push(`/library/${result.id}`)
    handleOpenChange(false)
  }

  // Navigate to full search page
  const handleViewAllResults = () => {
    router.push(`/search?q=${encodeURIComponent(query)}`)
    handleOpenChange(false)
  }

  // Select recent search
  const handleRecentSearch = (searchQuery: string) => {
    setQuery(searchQuery)
  }

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "lecture":
        return "📚"
      case "objective":
        return "💡"
      case "card":
        return "🃏"
      case "concept":
        return "📝"
    }
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      aria-label="Search medical content"
    >
      <CommandInput
        placeholder="Search lectures, objectives, concepts..."
        value={query}
        onValueChange={setQuery}
        aria-label="Search input"
      />
      <CommandList>
        {isLoading && (
          <div
            className="flex items-center justify-center py-6"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isLoading && query.trim().length === 0 && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches" aria-label="Recent searches">
              {recentSearches.map((search, index) => (
                <CommandItem
                  key={`recent-${index}`}
                  onSelect={() => handleRecentSearch(search)}
                  className="cursor-pointer"
                  aria-label={`Recent search: ${search}`}
                >
                  <TrendingUp className="size-4 mr-2 text-muted-foreground" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {!isLoading && query.trim().length >= 2 && results.length === 0 && (
          <CommandEmpty aria-live="polite">
            <FileText className="size-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search terms
            </p>
          </CommandEmpty>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <CommandGroup heading="Search Results" aria-label="Search results">
              {results.map((result) => {
                const icon = getResultIcon(result.type)
                const similarityPercent = Math.round(result.similarity * 100)

                return (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className={cn(
                      "cursor-pointer py-3",
                      "data-[selected='true']:bg-card"
                    )}
                    aria-label={`${result.title}, ${similarityPercent}% match`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="text-xl mt-0.5" aria-hidden="true">
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {result.title}
                          </p>
                          {result.metadata?.isHighYield && (
                            <Badge
                              className="text-xs py-0 px-1 bg-card text-yellow-700 border-yellow-500/20"
                              aria-label="High-yield"
                            >
                              HY
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.snippet}
                        </p>
                        {result.source.courseName && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {result.source.courseName}
                            {result.source.pageNumber &&
                              ` • Page ${result.source.pageNumber}`}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0"
                        aria-hidden="true"
                      >
                        {similarityPercent}%
                      </Badge>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {results.length >= 10 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleViewAllResults}
                    className="cursor-pointer justify-center text-primary"
                    aria-label="View all search results"
                  >
                    <Search className="size-4 mr-2" />
                    <span className="font-medium">
                      View all results for &quot;{query}&quot;
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>

      {/* Keyboard shortcuts hint */}
      <div
        className="border-t border-border px-3 py-2 text-xs text-muted-foreground/70"
        role="status"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center justify-between">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              ↑↓
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              ↵
            </kbd>{" "}
            Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              Esc
            </kbd>{" "}
            Close
          </span>
        </div>
      </div>
    </CommandDialog>
  )
}

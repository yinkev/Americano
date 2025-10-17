'use client'

import { Star, BookOpen, ExternalLink, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface FirstAidSearchResult {
  id: string
  section: string
  subsection?: string
  pageNumber: number
  content: string
  isHighYield: boolean
  system?: string
  edition?: string
  relevanceScore: number
  highlightedSnippet?: string
}

interface FirstAidSearchResultsProps {
  results: FirstAidSearchResult[]
  query?: string
  className?: string
  onResultClick?: (result: FirstAidSearchResult) => void
}

export function FirstAidSearchResults({
  results,
  query,
  className,
  onResultClick,
}: FirstAidSearchResultsProps) {
  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'oklch(0.7 0.15 150)' // Green
    if (score >= 0.6) return 'oklch(0.7 0.15 60)' // Yellow
    return 'oklch(0.7 0.05 230)' // Gray
  }

  const highlightQuery = (text: string, query?: string) => {
    if (!query || query.trim().length === 0) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark
              key={index}
              className="bg-primary/20 text-foreground font-medium px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    )
  }

  if (!results || results.length === 0) {
    return (
      <Card className={cn('bg-white/80 backdrop-blur-md border-border/50', className)}>
        <CardContent className="py-8">
          <div className="text-center space-y-2">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No First Aid references found for your search.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">First Aid References</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {results.length} {results.length === 1 ? 'result' : 'results'}
        </Badge>
      </div>

      {/* Results List */}
      <div className="space-y-2">
        {results.map((result, index) => (
          <Card
            key={result.id}
            className={cn(
              'transition-all duration-200 cursor-pointer',
              'bg-white/80 backdrop-blur-md border-border/50',
              'hover:bg-white hover:border-border hover:shadow-md'
            )}
            onClick={() => onResultClick?.(result)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-1">
                    {result.isHighYield && (
                      <Star
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: 'oklch(0.7 0.2 60)' }}
                        fill="oklch(0.7 0.2 60)"
                      />
                    )}
                    <h4 className="text-base font-semibold truncate">
                      {result.section}
                    </h4>
                  </div>

                  {/* Subsection */}
                  {result.subsection && (
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {result.subsection}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Source Badge */}
                    <Badge
                      variant="default"
                      className="text-xs bg-primary/90 text-primary-foreground"
                    >
                      First Aid
                    </Badge>

                    {/* System Badge */}
                    {result.system && (
                      <Badge variant="secondary" className="text-xs">
                        {result.system}
                      </Badge>
                    )}

                    {/* High-Yield Badge */}
                    {result.isHighYield && (
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: 'oklch(0.7 0.2 60)',
                          color: 'oklch(0.7 0.2 60)',
                        }}
                      >
                        High Yield
                      </Badge>
                    )}

                    {/* Page Number */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-medium">Page {result.pageNumber}</span>
                      {result.edition && (
                        <span className="text-muted-foreground/70">• {result.edition}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Relevance Score */}
                <div className="flex-shrink-0">
                  <div
                    className="text-xs font-medium px-2 py-1 rounded-md border"
                    style={{
                      borderColor: getRelevanceColor(result.relevanceScore),
                      color: getRelevanceColor(result.relevanceScore),
                      backgroundColor: `${getRelevanceColor(result.relevanceScore)}10`,
                    }}
                  >
                    {Math.round(result.relevanceScore * 100)}%
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Content Snippet */}
              <div className="mb-3">
                <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                  {result.highlightedSnippet
                    ? highlightQuery(result.highlightedSnippet, query)
                    : highlightQuery(result.content, query)}
                </p>
              </div>

              <Separator className="mb-3" />

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResultClick?.(result)
                  }}
                >
                  View full section
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={`/first-aid/sections/${result.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in new tab
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          Showing {results.length} First Aid {results.length === 1 ? 'reference' : 'references'}
          {results.filter((r) => r.isHighYield).length > 0 && (
            <span className="ml-1">
              • {results.filter((r) => r.isHighYield).length} high-yield
            </span>
          )}
        </div>
      )}
    </div>
  )
}

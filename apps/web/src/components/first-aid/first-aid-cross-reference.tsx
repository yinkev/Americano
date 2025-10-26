'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Star, BookOpen, ExternalLink, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useFirstAidContext } from '@/hooks/use-first-aid-context'

interface FirstAidReference {
  id: string
  section: string
  subsection?: string
  pageNumber: number
  snippet: string
  confidence: number
  isHighYield: boolean
  system?: string
}

interface FirstAidCrossReferenceProps {
  lectureId: string
  /** @deprecated Use contextual loading instead */
  references?: FirstAidReference[]
  /** @deprecated Use contextual loading instead */
  isLoading?: boolean
  className?: string
  /** Enable contextual loading (default: true) */
  enableContextualLoading?: boolean
  /** Show current section indicator (default: true) */
  showSectionIndicator?: boolean
}

/**
 * FirstAidCrossReference - Display First Aid references with contextual loading
 *
 * Epic 3 - Story 3.3 - AC#3: Contextual Cross-Reference Loading
 *
 * Features:
 * - Automatic contextual loading based on scroll position
 * - Visual indicators for loaded sections
 * - Cache management and prefetching
 * - Manual reload capability
 */
export function FirstAidCrossReference({
  lectureId,
  references: legacyReferences = [],
  isLoading: legacyIsLoading = false,
  className,
  enableContextualLoading = true,
  showSectionIndicator = true,
}: FirstAidCrossReferenceProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Use contextual loading hook (Story 3.3 AC#3)
  const {
    references: contextualReferences,
    loading: contextualLoading,
    error: contextualError,
    currentSection,
    reload,
    clearCache,
  } = useFirstAidContext(lectureId, {
    enabled: enableContextualLoading,
    debounceMs: 500,
    prefetchLimit: 5,
  })

  // Use contextual references if enabled, otherwise fall back to legacy prop-based
  const references = enableContextualLoading ? contextualReferences : legacyReferences
  const isLoading = enableContextualLoading ? contextualLoading : legacyIsLoading

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'oklch(0.7 0.15 150)' // Green
    if (confidence >= 0.65) return 'oklch(0.7 0.15 60)' // Yellow
    return 'oklch(0.7 0.05 230)' // Gray
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.65) return 'Medium'
    return 'Low'
  }

  if (isLoading) {
    return (
      <Card className={cn('bg-card  border-border/50', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!references || references.length === 0) {
    return (
      <Card className={cn('bg-card  border-border/50', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            No First Aid references found for this content.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('bg-card  border-border/50', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
            {contextualLoading && (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {enableContextualLoading && showSectionIndicator && currentSection && (
              <Badge variant="outline" className="text-xs">
                Section: {currentSection}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {references.length} {references.length === 1 ? 'reference' : 'references'}
            </Badge>
            {enableContextualLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => reload()}
                disabled={contextualLoading}
                className="h-7 w-7 p-0"
                title="Reload references"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', contextualLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
        {contextualError && (
          <div className="mt-2 text-xs text-destructive">
            Error loading references: {contextualError.message}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {references.map((reference) => (
          <div
            key={reference.id}
            className={cn(
              'rounded-lg border transition-all duration-200',
              'bg-card  border-border/60',
              'hover:bg-card hover:border-border/80 hover:shadow-none'
            )}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {reference.isHighYield && (
                      <Star
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: 'oklch(0.7 0.2 60)' }}
                        fill="oklch(0.7 0.2 60)"
                      />
                    )}
                    <h4 className="text-sm font-semibold truncate">
                      {reference.section}
                    </h4>
                  </div>
                  {reference.subsection && (
                    <p className="text-xs text-muted-foreground truncate">
                      {reference.subsection}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: getConfidenceColor(reference.confidence),
                      color: getConfidenceColor(reference.confidence),
                    }}
                  >
                    {getConfidenceLabel(reference.confidence)}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
                    p. {reference.pageNumber}
                  </span>
                </div>
              </div>

              {/* System Badge */}
              {reference.system && (
                <Badge variant="secondary" className="text-xs mb-2">
                  {reference.system}
                </Badge>
              )}

              {/* Snippet Preview */}
              <div className="mb-3">
                <p
                  className={cn(
                    'text-sm text-foreground/90',
                    !expandedIds.has(reference.id) && 'line-clamp-2'
                  )}
                >
                  {reference.snippet}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(reference.id)}
                  className="h-8 px-2 text-xs"
                >
                  {expandedIds.has(reference.id) ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 px-2 text-xs text-primary hover:text-primary"
                >
                  <a
                    href={`/first-aid/sections/${reference.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View full section
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

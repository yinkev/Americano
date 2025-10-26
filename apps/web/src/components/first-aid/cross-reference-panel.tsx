"use client"

import * as React from "react"
import { BookOpen, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  FirstAidReferenceCard,
  FirstAidReferenceCardSkeleton,
  type FirstAidReferenceCardProps,
} from "./reference-card"

export interface FirstAidReference {
  guidelineId: string
  title: string
  relevanceScore: number
  relatedConcepts: string[]
  pageNumber?: number
  subsection?: string
  isHighYield?: boolean
  system?: string
  snippet?: string
}

export interface CrossReferencePanelProps {
  conceptId: string
  position?: "sidebar" | "inline"
  references?: FirstAidReference[]
  isLoading?: boolean
  error?: string | null
  onReferenceClick?: (guidelineId: string) => void
  className?: string
  maxHeight?: string
}

/**
 * FirstAidCrossReferencePanel Component
 *
 * Displays all First Aid references for a specific knowledge graph concept.
 * Can be positioned as a sidebar or inline within content.
 *
 * Features:
 * - Scrollable list of reference cards
 * - Loading skeleton states
 * - Empty state handling
 * - Error state display
 * - Responsive layout for sidebar/inline positioning
 * - Accessibility compliant
 *
 * @example
 * ```tsx
 * // Sidebar usage
 * <FirstAidCrossReferencePanel
 *   conceptId="concept-123"
 *   position="sidebar"
 *   references={references}
 *   onReferenceClick={(id) => router.push(`/first-aid/${id}`)}
 * />
 *
 * // Inline usage
 * <FirstAidCrossReferencePanel
 *   conceptId="concept-456"
 *   position="inline"
 *   references={references}
 * />
 * ```
 */
export function FirstAidCrossReferencePanel({
  conceptId,
  position = "sidebar",
  references = [],
  isLoading = false,
  error = null,
  onReferenceClick,
  className,
  maxHeight = "calc(100vh - 200px)",
}: CrossReferencePanelProps) {
  const isSidebar = position === "sidebar"

  // Loading State
  if (isLoading) {
    return (
      <Card
        className={cn(
          "border-border bg-card ",
          isSidebar ? "w-full sticky top-4" : "w-full",
          className
        )}
        role="region"
        aria-label="First Aid references loading"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea
            className="w-full pr-4"
            style={{ maxHeight: isSidebar ? maxHeight : "600px" }}
          >
            <div className="space-y-3">
              <FirstAidReferenceCardSkeleton />
              <FirstAidReferenceCardSkeleton />
              <FirstAidReferenceCardSkeleton />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  // Error State
  if (error) {
    return (
      <Card
        className={cn(
          "border-border bg-card ",
          isSidebar ? "w-full sticky top-4" : "w-full",
          className
        )}
        role="region"
        aria-label="First Aid references error"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-card">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-sm">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Empty State
  if (!references || references.length === 0) {
    return (
      <Card
        className={cn(
          "border-border bg-card ",
          isSidebar ? "w-full sticky top-4" : "w-full",
          className
        )}
        role="region"
        aria-label="First Aid references empty"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <BookOpen
              className="size-12 text-muted-foreground/40 mb-3"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground mb-1">
              No references found
            </p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              There are no First Aid references mapped to this concept yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Success State - Display References
  return (
    <Card
      className={cn(
        "border-border bg-card ",
        isSidebar ? "w-full sticky top-4" : "w-full",
        className
      )}
      role="region"
      aria-label={`First Aid references for concept ${conceptId}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg">First Aid References</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="text-xs"
            aria-label={`${references.length} ${
              references.length === 1 ? "reference" : "references"
            } found`}
          >
            {references.length}
          </Badge>
        </div>
        {/* High-yield count */}
        {references.some((ref) => ref.isHighYield) && (
          <p className="text-xs text-muted-foreground mt-2">
            {references.filter((ref) => ref.isHighYield).length} high-yield{" "}
            {references.filter((ref) => ref.isHighYield).length === 1
              ? "topic"
              : "topics"}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea
          className="w-full pr-4"
          style={{ maxHeight: isSidebar ? maxHeight : "600px" }}
        >
          <div className="space-y-3">
            {references.map((reference) => (
              <FirstAidReferenceCard
                key={reference.guidelineId}
                guidelineId={reference.guidelineId}
                title={reference.title}
                relevanceScore={reference.relevanceScore}
                relatedConcepts={reference.relatedConcepts}
                pageNumber={reference.pageNumber}
                subsection={reference.subsection}
                isHighYield={reference.isHighYield}
                system={reference.system}
                snippet={reference.snippet}
                onNavigate={() => {
                  if (onReferenceClick) {
                    onReferenceClick(reference.guidelineId)
                  }
                }}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * Compact variant for mobile or constrained spaces
 */
export function FirstAidCrossReferencePanelCompact({
  conceptId,
  references = [],
  isLoading = false,
  onReferenceClick,
  className,
}: Omit<CrossReferencePanelProps, "position" | "maxHeight">) {
  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="h-4 w-32 bg-card rounded animate-pulse" />
        <div className="h-20 w-full bg-card rounded animate-pulse" />
      </div>
    )
  }

  if (!references || references.length === 0) {
    return null // Don't show anything in compact mode if no references
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-primary" aria-hidden="true" />
        <p className="text-sm font-medium">First Aid ({references.length})</p>
      </div>
      <div className="space-y-2">
        {references.slice(0, 2).map((reference) => (
          <button
            key={reference.guidelineId}
            onClick={() => onReferenceClick?.(reference.guidelineId)}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all",
              "bg-card border-border hover:bg-card hover:shadow-none"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">
                  {reference.title}
                </p>
                {reference.pageNumber && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Page {reference.pageNumber}
                  </p>
                )}
              </div>
              {reference.isHighYield && (
                <BookOpen
                  className="size-3 shrink-0"
                  style={{ color: "oklch(0.7 0.2 60)" }}
                  fill="oklch(0.7 0.2 60)"
                  aria-label="High-yield"
                />
              )}
            </div>
          </button>
        ))}
        {references.length > 2 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{references.length - 2} more references
          </p>
        )}
      </div>
    </div>
  )
}

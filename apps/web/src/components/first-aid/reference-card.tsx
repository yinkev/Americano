"use client"

import * as React from "react"
import { Star, ExternalLink, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface FirstAidReferenceCardProps {
  guidelineId: string
  title: string
  relevanceScore: number // 0-1
  relatedConcepts: string[]
  onNavigate: () => void
  pageNumber?: number
  subsection?: string
  isHighYield?: boolean
  system?: string
  snippet?: string
  className?: string
}

/**
 * Returns color for relevance score using OKLCH color space
 * High (>0.8): Green, Medium (0.65-0.8): Yellow, Low (<0.65): Gray
 */
function getRelevanceColor(score: number): string {
  if (score >= 0.8) return "oklch(0.7 0.15 150)" // Green
  if (score >= 0.65) return "oklch(0.7 0.15 60)" // Yellow
  return "oklch(0.7 0.05 230)" // Gray
}

/**
 * Returns label for relevance score
 */
function getRelevanceLabel(score: number): string {
  if (score >= 0.8) return "High Relevance"
  if (score >= 0.65) return "Medium Relevance"
  return "Low Relevance"
}

/**
 * FirstAidReferenceCard Component
 *
 * Displays a single First Aid guideline reference with:
 * - Title and subsection
 * - Relevance score visualization
 * - Related knowledge graph concepts
 * - Navigation to full guideline
 *
 * @example
 * ```tsx
 * <FirstAidReferenceCard
 *   guidelineId="fa-123"
 *   title="Myocardial Infarction"
 *   relevanceScore={0.85}
 *   relatedConcepts={["Coronary Artery Disease", "Chest Pain", "ECG Changes"]}
 *   onNavigate={() => router.push('/first-aid/sections/fa-123')}
 *   pageNumber={297}
 *   isHighYield
 * />
 * ```
 */
export function FirstAidReferenceCard({
  guidelineId,
  title,
  relevanceScore,
  relatedConcepts,
  onNavigate,
  pageNumber,
  subsection,
  isHighYield = false,
  system,
  snippet,
  className,
}: FirstAidReferenceCardProps) {
  const relevancePercent = Math.round(relevanceScore * 100)
  const relevanceColor = getRelevanceColor(relevanceScore)
  const relevanceLabel = getRelevanceLabel(relevanceScore)

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/80 backdrop-blur-md",
        "hover:bg-white/95 hover:shadow-lg transition-all duration-200",
        "group cursor-pointer",
        className
      )}
      onClick={onNavigate}
      role="article"
      aria-label={`First Aid reference: ${title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Title and Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* High-Yield Indicator */}
              {isHighYield && (
                <Star
                  className="size-4 shrink-0"
                  style={{ color: "oklch(0.7 0.2 60)" }}
                  fill="oklch(0.7 0.2 60)"
                  aria-label="High-yield content"
                />
              )}

              {/* Source Badge */}
              <Badge
                variant="outline"
                className="text-xs bg-blue-500/10 text-blue-700 border-blue-500/20"
              >
                First Aid
              </Badge>

              {/* System Badge */}
              {system && (
                <Badge variant="secondary" className="text-xs">
                  {system}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold leading-tight line-clamp-2 mb-1">
              {title}
            </h3>

            {/* Subsection */}
            {subsection && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {subsection}
              </p>
            )}
          </div>

          {/* Relevance Score */}
          <div
            className="flex flex-col items-end gap-1 shrink-0"
            aria-label={`${relevanceLabel}: ${relevancePercent}%`}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: relevanceColor }}
              aria-hidden="true"
            >
              {relevancePercent}%
            </span>
            <Progress
              value={relevancePercent}
              className="w-16 h-1.5"
              aria-hidden="true"
              style={{
                // @ts-ignore - Custom CSS variable for progress bar color
                "--progress-color": relevanceColor,
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-3">
        {/* Snippet Preview */}
        {snippet && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {snippet}
          </p>
        )}

        {/* Related Concepts */}
        {relatedConcepts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Related Concepts:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {relatedConcepts.slice(0, 3).map((concept, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs py-0.5 px-2 bg-white/60"
                >
                  {concept}
                </Badge>
              ))}
              {relatedConcepts.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs py-0.5 px-2 bg-white/60 text-muted-foreground"
                  aria-label={`${relatedConcepts.length - 3} more concepts`}
                >
                  +{relatedConcepts.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          {/* Page Number */}
          {pageNumber && (
            <span className="text-xs text-muted-foreground">
              Page {pageNumber}
            </span>
          )}

          {/* Navigate Button */}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 px-3 text-xs group-hover:bg-white/60"
            aria-label={`View ${title} in full`}
          >
            View guideline
            <ChevronRight className="size-3 ml-1" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Skeleton loading state for FirstAidReferenceCard
 */
export function FirstAidReferenceCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        "border-white/40 bg-white/80 backdrop-blur-md",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-muted/40 rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted/60 rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted/40 rounded animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-12 bg-muted/60 rounded animate-pulse" />
            <div className="h-1.5 w-16 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 space-y-3">
        <div className="h-10 w-full bg-muted/40 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 w-24 bg-muted/40 rounded animate-pulse" />
          <div className="flex gap-1.5">
            <div className="h-6 w-20 bg-muted/40 rounded animate-pulse" />
            <div className="h-6 w-16 bg-muted/40 rounded animate-pulse" />
            <div className="h-6 w-24 bg-muted/40 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

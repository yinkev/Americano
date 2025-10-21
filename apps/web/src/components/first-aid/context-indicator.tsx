"use client"

import * as React from "react"
import { BookOpen, Star, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface FirstAidContextIndicatorProps {
  guidelineId: string
  title: string
  pageNumber?: number
  isHighYield?: boolean
  relevanceScore?: number
  previewSnippet?: string
  onExpand?: () => void
  variant?: "badge" | "icon" | "inline"
  showTooltip?: boolean
  className?: string
}

/**
 * Returns the appropriate icon color based on relevance score
 */
function getIndicatorColor(relevanceScore?: number, isHighYield?: boolean): string {
  if (isHighYield) return "oklch(0.7 0.2 60)" // Gold for high-yield
  if (!relevanceScore) return "oklch(0.7 0.15 230)" // Blue default
  if (relevanceScore >= 0.8) return "oklch(0.7 0.15 150)" // Green
  if (relevanceScore >= 0.65) return "oklch(0.7 0.15 60)" // Yellow
  return "oklch(0.7 0.05 230)" // Gray
}

/**
 * FirstAidContextIndicator Component
 *
 * A small, unobtrusive indicator showing that First Aid references are available.
 * Available in three variants:
 * - badge: Pill-shaped badge with text and icon
 * - icon: Icon-only button
 * - inline: Inline text with icon
 *
 * Features:
 * - Tooltip preview on hover
 * - Click to expand full reference panel
 * - High-yield visual indicator
 * - Accessibility compliant
 * - WCAG 2.1 AA compliant color contrast
 *
 * @example
 * ```tsx
 * // Badge variant
 * <FirstAidContextIndicator
 *   guidelineId="fa-123"
 *   title="Myocardial Infarction"
 *   pageNumber={297}
 *   isHighYield
 *   variant="badge"
 *   onExpand={() => setShowPanel(true)}
 * />
 *
 * // Icon variant
 * <FirstAidContextIndicator
 *   guidelineId="fa-456"
 *   title="Heart Failure"
 *   variant="icon"
 *   showTooltip
 * />
 * ```
 */
export function FirstAidContextIndicator({
  guidelineId,
  title,
  pageNumber,
  isHighYield = false,
  relevanceScore,
  previewSnippet,
  onExpand,
  variant = "badge",
  showTooltip = true,
  className,
}: FirstAidContextIndicatorProps) {
  const indicatorColor = getIndicatorColor(relevanceScore, isHighYield)

  // Badge Variant
  if (variant === "badge") {
    const BadgeContent = (
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:scale-105",
          "bg-white/80 backdrop-blur-sm",
          isHighYield && "border-yellow-500/40",
          className
        )}
        onClick={onExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onExpand?.()
          }
        }}
        aria-label={`First Aid reference: ${title}${
          pageNumber ? `, page ${pageNumber}` : ""
        }${isHighYield ? ", high-yield content" : ""}`}
      >
        <div className="flex items-center gap-1.5">
          {isHighYield ? (
            <Star
              className="size-3"
              style={{ color: indicatorColor }}
              fill={indicatorColor}
              aria-hidden="true"
            />
          ) : (
            <BookOpen
              className="size-3"
              style={{ color: indicatorColor }}
              aria-hidden="true"
            />
          )}
          <span className="text-xs font-medium">First Aid</span>
          {pageNumber && (
            <span className="text-xs text-muted-foreground">p.{pageNumber}</span>
          )}
        </div>
      </Badge>
    )

    if (showTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs"
            aria-label="First Aid reference preview"
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm">{title}</p>
              {previewSnippet && (
                <p className="text-xs line-clamp-3">{previewSnippet}</p>
              )}
              <p className="text-xs text-background/70 mt-2">
                Click to view full reference
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }

    return BadgeContent
  }

  // Icon Variant
  if (variant === "icon") {
    const IconContent = (
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn(
          "relative transition-all duration-200",
          "hover:shadow-md hover:scale-110",
          className
        )}
        onClick={onExpand}
        aria-label={`First Aid reference: ${title}${
          pageNumber ? `, page ${pageNumber}` : ""
        }${isHighYield ? ", high-yield content" : ""}`}
      >
        {isHighYield ? (
          <Star
            className="size-4"
            style={{ color: indicatorColor }}
            fill={indicatorColor}
            aria-hidden="true"
          />
        ) : (
          <BookOpen
            className="size-4"
            style={{ color: indicatorColor }}
            aria-hidden="true"
          />
        )}
        {/* Notification dot for high-yield */}
        {isHighYield && (
          <span
            className="absolute -top-0.5 -right-0.5 size-2 rounded-full"
            style={{ backgroundColor: "oklch(0.7 0.2 60)" }}
            aria-hidden="true"
          />
        )}
      </Button>
    )

    if (showTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{IconContent}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-xs"
            aria-label="First Aid reference preview"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm">{title}</p>
                {isHighYield && (
                  <Badge
                    className="text-[10px] px-1 py-0 h-4"
                    style={{
                      backgroundColor: "oklch(0.7 0.2 60)",
                      color: "white",
                    }}
                  >
                    High-Yield
                  </Badge>
                )}
              </div>
              {pageNumber && (
                <p className="text-xs text-background/70">Page {pageNumber}</p>
              )}
              {previewSnippet && (
                <p className="text-xs line-clamp-3 mt-1">{previewSnippet}</p>
              )}
              <p className="text-xs text-background/70 mt-2">
                Click to expand reference
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }

    return IconContent
  }

  // Inline Variant
  const InlineContent = (
    <button
      onClick={onExpand}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md",
        "transition-all duration-200",
        "hover:bg-white/60 hover:shadow-sm",
        "text-sm text-foreground",
        className
      )}
      aria-label={`First Aid reference: ${title}${
        pageNumber ? `, page ${pageNumber}` : ""
      }${isHighYield ? ", high-yield content" : ""}`}
    >
      {isHighYield ? (
        <Star
          className="size-3.5"
          style={{ color: indicatorColor }}
          fill={indicatorColor}
          aria-hidden="true"
        />
      ) : (
        <BookOpen
          className="size-3.5"
          style={{ color: indicatorColor }}
          aria-hidden="true"
        />
      )}
      <span className="font-medium" style={{ color: indicatorColor }}>
        {title}
      </span>
      {pageNumber && (
        <span className="text-xs text-muted-foreground">(p.{pageNumber})</span>
      )}
      <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
    </button>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{InlineContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs"
          aria-label="First Aid reference preview"
        >
          <div className="space-y-1">
            {previewSnippet && (
              <p className="text-xs line-clamp-3">{previewSnippet}</p>
            )}
            <p className="text-xs text-background/70 mt-2">
              Click to view full reference
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return InlineContent
}

/**
 * Group multiple context indicators together
 */
export function FirstAidContextIndicatorGroup({
  indicators,
  maxVisible = 3,
  variant = "badge",
  onViewAll,
  className,
}: {
  indicators: FirstAidContextIndicatorProps[]
  maxVisible?: number
  variant?: "badge" | "icon" | "inline"
  onViewAll?: () => void
  className?: string
}) {
  const visibleIndicators = indicators.slice(0, maxVisible)
  const remainingCount = indicators.length - maxVisible

  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-2",
        variant === "inline" && "gap-1",
        className
      )}
      role="group"
      aria-label="First Aid references"
    >
      {visibleIndicators.map((indicator) => (
        <FirstAidContextIndicator
          key={indicator.guidelineId}
          {...indicator}
          variant={variant}
        />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={onViewAll}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onViewAll?.()
            }
          }}
          aria-label={`View ${remainingCount} more First Aid references`}
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}

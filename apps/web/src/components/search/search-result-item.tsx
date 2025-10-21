"use client"

import * as React from "react"
import { BookOpen, FileText, CreditCard, Lightbulb, ExternalLink } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"

export interface SearchResult {
  id: string
  type: "lecture" | "objective" | "card" | "concept"
  title: string
  snippet: string
  source: {
    lectureTitle?: string
    courseName?: string
    courseCode?: string
    pageNumber?: number
  }
  similarity: number // 0-1
  metadata?: {
    chunkCount?: number
    objectiveCount?: number
    cardCount?: number
    complexity?: string
    isHighYield?: boolean
  }
}

interface SearchResultItemProps {
  result: SearchResult
  searchQuery?: string
  onClick?: (result: SearchResult) => void
  className?: string
}

const getResultIcon = (type: SearchResult["type"]) => {
  switch (type) {
    case "lecture":
      return BookOpen
    case "objective":
      return Lightbulb
    case "card":
      return CreditCard
    case "concept":
      return FileText
  }
}

const getResultTypeLabel = (type: SearchResult["type"]) => {
  switch (type) {
    case "lecture":
      return "Lecture"
    case "objective":
      return "Learning Objective"
    case "card":
      return "Flashcard"
    case "concept":
      return "Concept"
  }
}

/**
 * Highlights matching text in a string
 * @param text - The text to highlight
 * @param query - The search query to highlight
 * @returns JSX with highlighted text wrapped in <mark> tags
 */
function highlightText(text: string, query?: string): React.ReactNode {
  if (!query || query.trim().length === 0) {
    return text
  }

  // Escape special regex characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  // Split by query matches (case insensitive)
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"))

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark
          key={index}
          className="bg-yellow-200/60 text-foreground font-semibold rounded px-0.5"
        >
          {part}
        </mark>
      )
    }
    return part
  })
}

/**
 * Individual search result item component
 * Displays result with highlighting, metadata, and source attribution
 */
export function SearchResultItem({
  result,
  searchQuery,
  onClick,
  className,
}: SearchResultItemProps) {
  const Icon = getResultIcon(result.type)
  const similarityPercent = Math.round(result.similarity * 100)

  const handleClick = () => {
    onClick?.(result)
  }

  return (
    <Card
      className={cn(
        "border-white/40 bg-white/80 backdrop-blur-md",
        "hover:bg-white/95 hover:shadow-lg transition-all duration-200",
        "group cursor-pointer",
        className
      )}
      onClick={handleClick}
      role="article"
      aria-label={`Search result: ${result.title}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="size-4 text-primary shrink-0" aria-hidden="true" />
              <Badge variant="outline" className="text-xs">
                {getResultTypeLabel(result.type)}
              </Badge>
              {result.metadata?.isHighYield && (
                <Badge
                  className="text-xs bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                  aria-label="High-yield content"
                >
                  High-Yield
                </Badge>
              )}
            </div>
            <CardTitle className="text-base leading-tight line-clamp-2">
              {highlightText(result.title, searchQuery)}
            </CardTitle>
          </div>

          {/* Similarity Score */}
          <div
            className="flex flex-col items-end gap-1 shrink-0"
            aria-label={`Relevance: ${similarityPercent}%`}
          >
            <span
              className="text-xs font-semibold text-muted-foreground"
              aria-hidden="true"
            >
              {similarityPercent}% match
            </span>
            <Progress
              value={similarityPercent}
              className="w-16 h-1.5"
              aria-hidden="true"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Snippet with highlighting */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {highlightText(result.snippet, searchQuery)}
        </p>

        {/* Source Attribution */}
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground"
          aria-label="Source information"
        >
          <span className="font-medium">From:</span>
          {result.source.lectureTitle && (
            <>
              <span className="text-foreground">{result.source.lectureTitle}</span>
              {result.source.pageNumber && (
                <span aria-label={`Page ${result.source.pageNumber}`}>
                  • Page {result.source.pageNumber}
                </span>
              )}
            </>
          )}
          {result.source.courseName && (
            <>
              {result.source.lectureTitle && <span>•</span>}
              <span className="text-foreground">{result.source.courseName}</span>
              {result.source.courseCode && (
                <span className="text-muted-foreground">
                  ({result.source.courseCode})
                </span>
              )}
            </>
          )}
        </div>

        {/* Metadata */}
        {result.metadata && (
          <div
            className="flex items-center gap-3 mt-3 text-xs text-muted-foreground"
            aria-label="Additional metadata"
          >
            {result.metadata.chunkCount !== undefined && (
              <span>{result.metadata.chunkCount} chunks</span>
            )}
            {result.metadata.objectiveCount !== undefined && (
              <span>{result.metadata.objectiveCount} objectives</span>
            )}
            {result.metadata.cardCount !== undefined && (
              <span>{result.metadata.cardCount} cards</span>
            )}
            {result.metadata.complexity && (
              <Badge variant="outline" className="text-xs py-0">
                {result.metadata.complexity}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="group-hover:bg-white/60 rounded-lg"
          aria-label={`View ${result.title} in context`}
        >
          <Link href={`/library/${result.id}`}>
            View in context
            <ExternalLink className="size-3 ml-1" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

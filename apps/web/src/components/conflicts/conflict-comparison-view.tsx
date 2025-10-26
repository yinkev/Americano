'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ConflictContent, Source, EBMLevel, ConflictType } from '@/types/conflicts'
import { BookOpen, Award, Calendar, ExternalLink } from 'lucide-react'

interface ConflictComparisonViewProps {
  /**
   * First source content (Source A)
   */
  sourceA: ConflictContent

  /**
   * Second source content (Source B)
   */
  sourceB: ConflictContent

  /**
   * Source A metadata
   */
  sourceAMeta: Source

  /**
   * Source B metadata
   */
  sourceBMeta: Source

  /**
   * Similarity score between sources (0-1)
   */
  similarityScore: number

  /**
   * Detected contradiction pattern
   */
  contradictionPattern: string

  /**
   * Type of conflict
   */
  conflictType: ConflictType

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * EBM Level display configuration
 */
const EBM_LEVEL_DISPLAY: Record<EBMLevel, { label: string; order: number }> = {
  [EBMLevel.SYSTEMATIC_REVIEW]: { label: 'Level 1: Systematic Review', order: 1 },
  [EBMLevel.RCT]: { label: 'Level 2: RCT', order: 2 },
  [EBMLevel.COHORT_STUDY]: { label: 'Level 3: Cohort Study', order: 3 },
  [EBMLevel.CASE_CONTROL]: { label: 'Level 4: Case-Control', order: 4 },
  [EBMLevel.CASE_SERIES]: { label: 'Level 5: Case Series', order: 5 },
  [EBMLevel.EXPERT_OPINION]: { label: 'Level 6: Expert Opinion', order: 6 },
  [EBMLevel.TEXTBOOK]: { label: 'Level 7: Textbook', order: 7 },
  [EBMLevel.UNKNOWN]: { label: 'Unknown Level', order: 99 },
}

/**
 * Get credibility color based on score
 */
function getCredibilityColor(score: number): string {
  if (score >= 90) return 'oklch(0.60 0.15 145)' // High credibility: green
  if (score >= 75) return 'oklch(0.65 0.12 85)' // Good credibility: yellow-green
  if (score >= 60) return 'oklch(0.70 0.15 60)' // Medium credibility: yellow
  if (score >= 40) return 'oklch(0.65 0.18 40)' // Low credibility: orange
  return 'oklch(0.60 0.22 25)' // Very low credibility: red
}

/**
 * SourceMetadata Component
 * Displays source information with credibility and EBM level
 */
function SourceMetadata({ source }: { source: Source }) {
  const credibilityColor = getCredibilityColor(source.credibility)
  const ebmDisplay = EBM_LEVEL_DISPLAY[source.ebmLevel]

  return (
    <div className="space-y-3">
      {/* Source name and type */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h4 className="font-semibold text-sm">{source.name}</h4>
        </div>
        <Badge variant="outline" className="text-xs">
          {source.type.replace('_', ' ')}
        </Badge>
      </div>

      {/* Credibility score */}
      <div className="flex items-center gap-2">
        <Award className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Credibility:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${source.credibility}%`,
                backgroundColor: credibilityColor,
              }}
              role="progressbar"
              aria-valuenow={source.credibility}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Credibility score: ${source.credibility} out of 100`}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: credibilityColor }}>
            {source.credibility}
          </span>
        </div>
      </div>

      {/* EBM Level */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: 'oklch(0.55 0.18 240)' }}
          aria-label={`Evidence level ${ebmDisplay.order}`}
        >
          {ebmDisplay.order}
        </div>
        <span className="text-xs text-muted-foreground">{ebmDisplay.label}</span>
      </div>

      {/* Publication date */}
      {source.publishedDate && (
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">
            Published: {new Date(source.publishedDate).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* External link */}
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        >
          View Source
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">(opens in new tab)</span>
        </a>
      )}
    </div>
  )
}

/**
 * ContentPanel Component
 * Displays content with highlighted segments
 */
function ContentPanel({ content, isHigherCredibility }: {
  content: ConflictContent
  isHigherCredibility?: boolean
}) {
  const { text, highlightedSegments, pageNumber } = content

  // Render text with highlighted segments
  const renderHighlightedText = () => {
    if (!highlightedSegments || highlightedSegments.length === 0) {
      return <p className="text-sm leading-relaxed">{text}</p>
    }

    // Sort segments by start position
    const sortedSegments = [...highlightedSegments].sort((a, b) => a.start - b.start)

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    sortedSegments.forEach((segment, index) => {
      // Add text before highlight
      if (segment.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {text.substring(lastIndex, segment.start)}
          </span>
        )
      }

      // Add highlighted segment
      parts.push(
        <mark
          key={`highlight-${index}`}
          className="rounded-sm px-1 font-medium"
          style={{
            backgroundColor: 'oklch(0.95 0.12 60)',
            color: 'oklch(0.30 0.15 60)',
          }}
        >
          {segment.text}
        </mark>
      )

      lastIndex = segment.end
    })

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      )
    }

    return <p className="text-sm leading-relaxed">{parts}</p>
  }

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4',
        isHigherCredibility && 'ring-2 ring-primary/20'
      )}
    >
      {isHigherCredibility && (
        <Badge
          variant="outline"
          className="absolute -top-2.5 right-4 bg-background text-xs"
          style={{
            borderColor: 'oklch(0.60 0.15 145)',
            color: 'oklch(0.60 0.15 145)',
          }}
        >
          Higher Credibility
        </Badge>
      )}

      {renderHighlightedText()}

      {pageNumber && (
        <p className="mt-2 text-xs text-muted-foreground">
          Page {pageNumber}
        </p>
      )}
    </div>
  )
}

/**
 * ConflictComparisonView Component
 *
 * Two-column layout for side-by-side conflict comparison
 * Shows highlighted conflicting text segments, source metadata,
 * credibility scores, and EBM evidence levels
 *
 * WCAG 2.1 AA compliant with semantic HTML and ARIA labels
 * Responsive design with mobile-first approach
 *
 * @example
 * ```tsx
 * <ConflictComparisonView
 *   sourceA={conflictContentA}
 *   sourceB={conflictContentB}
 *   sourceAMeta={sourceMetadataA}
 *   sourceBMeta={sourceMetadataB}
 *   similarityScore={0.87}
 *   contradictionPattern="dosage"
 *   conflictType={ConflictType.DOSAGE}
 * />
 * ```
 */
export function ConflictComparisonView({
  sourceA,
  sourceB,
  sourceAMeta,
  sourceBMeta,
  similarityScore,
  contradictionPattern,
  conflictType,
  className,
}: ConflictComparisonViewProps) {
  // Determine which source has higher credibility
  const sourceAHigher = sourceAMeta.credibility > sourceBMeta.credibility
  const sourceBHigher = sourceBMeta.credibility > sourceAMeta.credibility

  return (
    <div className={cn('space-y-4', className)}>
      {/* Conflict metadata */}
      <Card className="bg-card  p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Conflict Type:</span>
            <Badge variant="outline">{conflictType.replace('_', ' ')}</Badge>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Similarity:</span>
            <span className="text-xs font-semibold">
              {(similarityScore * 100).toFixed(1)}%
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Pattern:</span>
            <span className="text-xs">{contradictionPattern}</span>
          </div>
        </div>
      </Card>

      {/* Two-column comparison */}
      <div
        className="grid gap-4 lg:grid-cols-2"
        role="group"
        aria-label="Side-by-side source comparison"
      >
        {/* Source A */}
        <div className="space-y-4">
          <Card className="bg-card  p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                A
              </div>
              <h3 className="font-semibold text-sm">Source A</h3>
            </div>
            <SourceMetadata source={sourceAMeta} />
          </Card>
          <ContentPanel content={sourceA} isHigherCredibility={sourceAHigher} />
        </div>

        {/* Source B */}
        <div className="space-y-4">
          <Card className="bg-card  p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                B
              </div>
              <h3 className="font-semibold text-sm">Source B</h3>
            </div>
            <SourceMetadata source={sourceBMeta} />
          </Card>
          <ContentPanel content={sourceB} isHigherCredibility={sourceBHigher} />
        </div>
      </div>
    </div>
  )
}

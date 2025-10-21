/**
 * PriorityExplanationPanel Component
 * Story 2.3: Task 9 - Priority Visualization UI
 *
 * Detailed breakdown of priority calculation with glassmorphism design
 */

'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PriorityBadge } from './PriorityBadge'
import type { PriorityExplanation } from '@/types/prioritization'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriorityExplanationPanelProps {
  explanation: PriorityExplanation
  defaultExpanded?: boolean
  className?: string
}

export function PriorityExplanationPanel({
  explanation,
  defaultExpanded = false,
  className,
}: PriorityExplanationPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded)

  return (
    <Card
      className={cn(
        'bg-background border shadow-sm',
        'rounded-lg p-4',
        'hover:shadow-md transition-shadow duration-300',
        className,
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between gap-4 text-left group"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-[16px] font-heading font-semibold">Why this priority?</h3>
            <PriorityBadge score={explanation.priorityScore} showScore />
          </div>

          <p className="text-[13px] text-muted-foreground leading-relaxed">{explanation.reasoning}</p>
        </div>

        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-150" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* Factor Breakdown */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
              Factor Contributions
            </h4>

            <div className="space-y-3">
              {explanation.factors
                .sort((a, b) => b.contribution - a.contribution)
                .map((factor, index) => (
                  <div
                    key={factor.name}
                    className="space-y-2 p-4 rounded-lg bg-secondary/30 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-muted-foreground">#{index + 1}</span>
                        <span className="text-[13px] font-semibold">{factor.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-muted-foreground">
                          {(factor.contribution * 100).toFixed(0)}%
                        </span>
                        <span className="text-[11px] text-muted-foreground/60">
                          ({(factor.weight * 100).toFixed(0)}% weight ×{' '}
                          {(factor.value * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>

                    <Progress value={factor.contribution * 100} className="h-2" />

                    <p className="text-[11px] text-muted-foreground leading-relaxed">{factor.explanation}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* Recommendations */}
          {explanation.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
                Recommendations
              </h4>

              <div className="space-y-2">
                {explanation.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-info/10 border border-info/30"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-info text-info-foreground flex items-center justify-center text-[11px] font-semibold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-[13px] leading-relaxed flex-1">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

/**
 * Compact version for quick display (no expansion)
 */
export function PriorityExplanationCompact({
  explanation,
  className,
}: {
  explanation: PriorityExplanation
  className?: string
}) {
  const topFactors = explanation.factors.sort((a, b) => b.contribution - a.contribution).slice(0, 3)

  return (
    <div
      className={cn(
        'space-y-2 p-4 rounded-lg',
        'bg-secondary/30 border border-border',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <PriorityBadge score={explanation.priorityScore} />
        <span className="text-[11px] text-muted-foreground">Top factors:</span>
      </div>

      <div className="space-y-1">
        {topFactors.map((factor) => (
          <div key={factor.name} className="flex items-center gap-2 text-[11px]">
            <div className="w-1.5 h-1.5 rounded-full bg-clinical" />
            <span className="text-foreground">
              {factor.name}: {(factor.contribution * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

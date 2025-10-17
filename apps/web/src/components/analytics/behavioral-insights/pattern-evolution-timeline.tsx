/**
 * PatternEvolutionTimeline Component
 *
 * Horizontal timeline visualization showing pattern evolution:
 * - Weeks on x-axis
 * - Vertical lanes for pattern types
 * - Markers for detection events (new/existing/disappeared)
 * - Interactive tooltips on hover
 * - Comparison mode available
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 2 (Pattern Visualization)
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

// Pattern type definitions
type PatternType =
  | 'OPTIMAL_STUDY_TIME'
  | 'SESSION_DURATION_PREFERENCE'
  | 'CONTENT_TYPE_PREFERENCE'
  | 'PERFORMANCE_PEAK'
  | 'ATTENTION_CYCLE'
  | 'FORGETTING_CURVE'

interface WeekPattern {
  id: string
  patternType: PatternType
  confidence: number
  metadata: Record<string, any>
  status: 'new' | 'existing' | 'disappeared'
}

interface WeeklyData {
  weekNumber: number
  weekStart: string
  weekEnd: string
  patterns: WeekPattern[]
}

interface PatternEvolutionTimelineProps {
  evolutionData: WeeklyData[]
  isLoading?: boolean
}

// Pattern type labels
const PATTERN_LABELS: Record<PatternType, string> = {
  OPTIMAL_STUDY_TIME: 'Study Time',
  SESSION_DURATION_PREFERENCE: 'Duration',
  CONTENT_TYPE_PREFERENCE: 'Content',
  PERFORMANCE_PEAK: 'Peak Time',
  ATTENTION_CYCLE: 'Attention',
  FORGETTING_CURVE: 'Retention',
}

// Pattern type colors (OKLCH-based, no gradients per CLAUDE.md)
const PATTERN_COLORS: Record<PatternType, string> = {
  OPTIMAL_STUDY_TIME: 'oklch(0.65 0.25 250)', // Blue
  SESSION_DURATION_PREFERENCE: 'oklch(0.65 0.25 150)', // Green
  CONTENT_TYPE_PREFERENCE: 'oklch(0.65 0.25 50)', // Orange
  PERFORMANCE_PEAK: 'oklch(0.65 0.25 300)', // Purple
  ATTENTION_CYCLE: 'oklch(0.65 0.25 180)', // Teal
  FORGETTING_CURVE: 'oklch(0.65 0.25 0)', // Red
}

// Status badge styling
const STATUS_CONFIG = {
  new: {
    label: 'New',
    className: 'bg-green-600 text-white',
    opacity: 1,
  },
  existing: {
    label: 'Active',
    className: 'bg-blue-600 text-white',
    opacity: 0.8,
  },
  disappeared: {
    label: 'Gone',
    className: 'bg-gray-500 text-white',
    opacity: 0.4,
  },
}

export function PatternEvolutionTimeline({
  evolutionData,
  isLoading = false,
}: PatternEvolutionTimelineProps) {
  const [viewStart, setViewStart] = useState(0)
  const weeksToShow = 8 // Show 8 weeks at a time

  // Empty state
  if (!isLoading && evolutionData.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Evolution Data</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Pattern evolution will appear as you continue studying
          </p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  const visibleData = evolutionData.slice(viewStart, viewStart + weeksToShow)
  const canScrollLeft = viewStart > 0
  const canScrollRight = viewStart + weeksToShow < evolutionData.length

  // Get all unique pattern types across all weeks
  const allPatternTypes = Array.from(
    new Set(
      evolutionData.flatMap((week) => week.patterns.map((p) => p.patternType))
    )
  ) as PatternType[]

  return (
    <Card className="bg-white/80 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pattern Evolution Timeline</CardTitle>
            <CardDescription>
              Track how your learning patterns change over {evolutionData.length} weeks
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewStart(Math.max(0, viewStart - 1))}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewStart(viewStart + 1)}
              disabled={!canScrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b">
          {allPatternTypes.map((type) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: PATTERN_COLORS[type] }}
              />
              <span className="text-sm text-muted-foreground">{PATTERN_LABELS[type]}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative overflow-x-auto pb-4">
          <div className="min-w-max">
            {/* Pattern Type Lanes */}
            <div className="space-y-8">
              {allPatternTypes.map((patternType) => (
                <div key={patternType} className="relative">
                  {/* Lane Label */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-32 w-28 text-right">
                    <span className="text-sm font-medium">{PATTERN_LABELS[patternType]}</span>
                  </div>

                  {/* Lane Line */}
                  <div className="relative h-16 bg-gray-100 rounded-full">
                    {/* Week Markers */}
                    <div className="absolute inset-0 flex items-center">
                      {visibleData.map((week, weekIndex) => {
                        const pattern = week.patterns.find(
                          (p) => p.patternType === patternType
                        )

                        const xPosition = (weekIndex / (weeksToShow - 1)) * 100

                        return (
                          <div
                            key={week.weekNumber}
                            className="absolute"
                            style={{ left: `${xPosition}%` }}
                          >
                            {pattern ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
                                      style={{
                                        backgroundColor: PATTERN_COLORS[patternType],
                                        opacity: STATUS_CONFIG[pattern.status].opacity,
                                      }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-semibold">
                                        Week {week.weekNumber}
                                      </p>
                                      <p className="text-xs">
                                        {format(new Date(week.weekStart), 'MMM d')} -{' '}
                                        {format(new Date(week.weekEnd), 'MMM d')}
                                      </p>
                                      <Badge className={STATUS_CONFIG[pattern.status].className}>
                                        {STATUS_CONFIG[pattern.status].label}
                                      </Badge>
                                      <p className="text-xs">
                                        Confidence: {Math.round(pattern.confidence * 100)}%
                                      </p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              // Empty marker for weeks without this pattern
                              <div className="w-6 h-6 rounded-full border border-gray-300 bg-white opacity-30" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Week Labels */}
            <div className="flex items-center justify-between mt-6 px-1">
              {visibleData.map((week, index) => (
                <div
                  key={week.weekNumber}
                  className="text-center"
                  style={{ width: `${100 / weeksToShow}%` }}
                >
                  <div className="text-xs font-medium">Week {week.weekNumber}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(week.weekStart), 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {evolutionData.reduce(
                  (sum, w) => sum + w.patterns.filter((p) => p.status === 'new').length,
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">New Patterns</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {evolutionData[evolutionData.length - 1]?.patterns.filter(
                  (p) => p.status === 'existing' || p.status === 'new'
                ).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-500">
                {evolutionData.reduce(
                  (sum, w) => sum + w.patterns.filter((p) => p.status === 'disappeared').length,
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">Disappeared</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * LearningPatternsGrid Component
 *
 * Displays top behavioral patterns in a 2×2 grid layout (desktop) / 1×4 (mobile)
 * Each card shows:
 * - Pattern icon and name
 * - Confidence indicator (0-100% with color-coding)
 * - Key insight text (1-2 sentences)
 * - Timestamp "Last detected: X days ago"
 * - "View details" link
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 2 (Pattern Visualization)
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Timer,
  FileText,
  TrendingUp,
  Activity,
  Brain,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Pattern type definitions
type PatternType =
  | 'OPTIMAL_STUDY_TIME'
  | 'SESSION_DURATION_PREFERENCE'
  | 'CONTENT_TYPE_PREFERENCE'
  | 'PERFORMANCE_PEAK'
  | 'ATTENTION_CYCLE'
  | 'FORGETTING_CURVE'

interface BehavioralPattern {
  id: string
  patternType: PatternType
  confidence: number
  metadata: Record<string, any>
  lastSeenAt: string
  firstSeenAt: string
}

interface LearningPatternsGridProps {
  patterns: BehavioralPattern[]
  isLoading?: boolean
  onViewDetails?: (patternId: string) => void
}

// Pattern metadata configuration
const PATTERN_CONFIG: Record<
  PatternType,
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
    description: (metadata: any) => string
  }
> = {
  OPTIMAL_STUDY_TIME: {
    icon: Clock,
    label: 'Optimal Study Time',
    description: (metadata) => {
      const times = metadata?.optimalTimes || []
      if (times.length === 0) return 'Your best study times are being analyzed'
      return `You learn best during ${times.slice(0, 2).join(', ')}`
    },
  },
  SESSION_DURATION_PREFERENCE: {
    icon: Timer,
    label: 'Session Duration',
    description: (metadata) => {
      const duration = metadata?.optimalDuration || 45
      return `Your ideal session length is ${duration} minutes`
    },
  },
  CONTENT_TYPE_PREFERENCE: {
    icon: FileText,
    label: 'Content Preference',
    description: (metadata) => {
      const type = metadata?.preferredType || 'mixed'
      return `You prefer ${type} learning materials`
    },
  },
  PERFORMANCE_PEAK: {
    icon: TrendingUp,
    label: 'Performance Peak',
    description: (metadata) => {
      const time = metadata?.peakTime || 'morning'
      return `Your performance peaks during ${time}`
    },
  },
  ATTENTION_CYCLE: {
    icon: Activity,
    label: 'Attention Cycle',
    description: (metadata) => {
      const cycle = metadata?.cycleLength || 25
      return `Your attention span averages ${cycle} minutes`
    },
  },
  FORGETTING_CURVE: {
    icon: Brain,
    label: 'Forgetting Curve',
    description: (metadata) => {
      const halfLife = metadata?.halfLife || 7
      return `Review needed every ${halfLife} days for retention`
    },
  },
}

// Confidence badge color coding
const getConfidenceBadge = (confidence: number) => {
  const percentage = Math.round(confidence * 100)

  if (percentage >= 80) {
    return {
      label: 'Strong',
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700',
    }
  } else if (percentage >= 60) {
    return {
      label: 'Moderate',
      variant: 'secondary' as const,
      className: 'bg-yellow-600 hover:bg-yellow-700',
    }
  } else {
    return {
      label: 'Weak',
      variant: 'outline' as const,
      className: 'bg-orange-500 hover:bg-orange-600 text-white',
    }
  }
}

export function LearningPatternsGrid({
  patterns,
  isLoading = false,
  onViewDetails,
}: LearningPatternsGridProps) {
  // Empty state
  if (!isLoading && patterns.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Patterns Detected Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Complete 6 weeks of study sessions to unlock your personalized learning patterns
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Progress: 2/6 weeks completed
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-md animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {patterns.map((pattern) => {
        const config = PATTERN_CONFIG[pattern.patternType]
        const Icon = config.icon
        const confidenceBadge = getConfidenceBadge(pattern.confidence)
        const lastSeen = formatDistanceToNow(new Date(pattern.lastSeenAt), {
          addSuffix: true,
        })

        return (
          <Card
            key={pattern.id}
            className="bg-white/80 backdrop-blur-md hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Last detected {lastSeen}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={confidenceBadge.className}>
                  {Math.round(pattern.confidence * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {config.description(pattern.metadata)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onViewDetails?.(pattern.id)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

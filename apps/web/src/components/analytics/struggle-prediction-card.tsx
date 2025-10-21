/**
 * StrugglePredictionCard Component
 * Story 5.2 Task 10.2
 * Wave 3: Enhanced with micro-interactions and design tokens
 *
 * Displays individual struggle predictions with probability, confidence, and feature breakdown
 *
 * Design: OKLCH colors, glassmorphism, NO gradients (per CLAUDE.md)
 * Animations: Wave 3 micro-interactions with hover states
 */

'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { typography, colors } from '@/lib/design-tokens'

interface PredictionFeatures {
  prerequisiteGap?: number
  historicalStruggle?: number
  contentComplexity?: number
  retentionRate?: number
  cognitiveLoad?: number
  topicSimilarity?: number
}

interface Prediction {
  id: string
  topicName: string
  predictedStruggleProbability: number
  confidence: number
  predictedFor: string
  features: PredictionFeatures
}

interface Props {
  prediction: Prediction
}

export function StrugglePredictionCard({ prediction }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const probability = prediction.predictedStruggleProbability * 100
  const confidence = prediction.confidence * 100

  // Determine color based on probability (using design tokens)
  const getProbabilityColor = (prob: number) => {
    if (prob < 40) return colors.success // Green - Low
    if (prob < 70) return colors.warning // Yellow - Medium
    return colors.alert // Red - High
  }

  const getProbabilityLevel = (prob: number) => {
    if (prob < 40) return 'Low'
    if (prob < 70) return 'Medium'
    return 'High'
  }

  const probabilityColor = getProbabilityColor(probability)
  const probabilityLevel = getProbabilityLevel(probability)

  const handleDismiss = async () => {
    // TODO: API call to mark as dismissed
    // await fetch(`/api/analytics/predictions/${prediction.id}/dismiss`, { method: 'POST' });
    setDismissed(true)
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] hover:scale-[1.01]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Warning Icon for High Probability */}
            {probability > 70 && (
              <div
                className="p-2 rounded-lg shrink-0 mt-0.5 transition-all duration-300 hover:scale-110"
                style={{ backgroundColor: `color-mix(in oklch, ${probabilityColor}, transparent 90%)` }}
              >
                <AlertTriangle className="size-5" style={{ color: probabilityColor }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className={`${typography.heading.h3} text-foreground leading-tight`}>
                {prediction.topicName}
              </h3>
              <p className={`${typography.body.small} text-muted-foreground mt-1`}>
                Predicted for {format(new Date(prediction.predictedFor), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Probability Badge */}
          <Badge
            variant="outline"
            className="shrink-0 px-3 py-1 font-semibold transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: `color-mix(in oklch, ${probabilityColor}, transparent 90%)`,
              borderColor: probabilityColor,
              color: probabilityColor,
            }}
          >
            {probabilityLevel} Risk
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Probability Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`${typography.body.small} font-medium text-foreground`}>
              Struggle Probability
            </span>
            <span className={`${typography.body.small} font-semibold`} style={{ color: probabilityColor }}>
              {probability.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={probability}
            className="h-3 bg-muted transition-all duration-500"
            style={
              {
                '--progress-color': probabilityColor,
              } as React.CSSProperties & { '--progress-color': string }
            }
          />
          <style jsx>{`
            :global(.progress-indicator) {
              background-color: var(--progress-color);
            }
          `}</style>
        </div>

        {/* Confidence Indicator */}
        <div className={`flex items-center gap-2 ${typography.body.small}`}>
          <Info className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Confidence:{' '}
            <span className="font-semibold text-foreground">{confidence.toFixed(0)}%</span>
          </span>
        </div>

        {/* Expandable Feature Breakdown */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 ${typography.body.small} font-medium text-foreground hover:scale-[1.01] active:scale-[0.99]`}
          aria-expanded={expanded}
          aria-label="Toggle feature breakdown"
        >
          <span>Why this prediction?</span>
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {expanded && (
          <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground">
              This prediction is based on the following factors:
            </p>
            {prediction.features.prerequisiteGap !== undefined && (
              <FeatureBar
                label="Prerequisite Knowledge Gap"
                value={prediction.features.prerequisiteGap * 100}
                description="Missing foundational concepts"
              />
            )}
            {prediction.features.historicalStruggle !== undefined && (
              <FeatureBar
                label="Historical Struggle Pattern"
                value={prediction.features.historicalStruggle * 100}
                description="Past difficulties with similar topics"
              />
            )}
            {prediction.features.contentComplexity !== undefined && (
              <FeatureBar
                label="Content Complexity"
                value={prediction.features.contentComplexity * 100}
                description="Topic difficulty level"
              />
            )}
            {prediction.features.retentionRate !== undefined && (
              <FeatureBar
                label="Low Retention Rate"
                value={(1 - prediction.features.retentionRate) * 100}
                description="Forgetting curve indicates review needed"
              />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="flex-1 min-h-11 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: probabilityColor,
                  color: 'white',
                }}
              >
                View Intervention
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.15)]">
              <DialogHeader>
                <DialogTitle className={`${typography.heading.h2} font-heading`}>
                  Recommended Intervention
                </DialogTitle>
                <DialogDescription className={typography.body.small}>
                  Strategies to help you succeed with {prediction.topicName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70">
                  <h4 className={`${typography.heading.h3} text-foreground mb-2`}>
                    Prerequisite Review
                  </h4>
                  <p className={`${typography.body.small} text-muted-foreground`}>
                    Review foundational concepts before tackling this topic. We'll add preparatory
                    missions to your queue.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70">
                  <h4 className={`${typography.heading.h3} text-foreground mb-2`}>
                    Spaced Repetition Boost
                  </h4>
                  <p className={`${typography.body.small} text-muted-foreground`}>
                    Increase review frequency for related concepts to strengthen retention.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  variant="outline"
                >
                  Dismiss
                </Button>
                <Button className="flex-1 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                  Apply to Missions
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="min-h-11 px-6 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleDismiss}
          >
            Not Concerned
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Feature Bar Component
 * Displays individual feature contribution with progress bar
 * Enhanced with Wave 3 animations
 */
function FeatureBar({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <span className={`${typography.body.tiny} font-medium text-foreground`}>{label}</span>
        <span className={`${typography.body.tiny} font-semibold text-muted-foreground`}>
          {value.toFixed(0)}%
        </span>
      </div>
      <Progress
        value={value}
        className="h-2 bg-muted/30 transition-all duration-500 group-hover:h-2.5"
      />
      <p className={`${typography.body.tiny} text-muted-foreground`}>{description}</p>
    </div>
  )
}

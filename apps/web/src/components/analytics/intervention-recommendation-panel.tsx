/**
 * InterventionRecommendationPanel Component
 * Story 5.2 Task 10.3
 *
 * Displays recommended interventions with effectiveness badges and auto-apply toggle
 */

'use client'

import { useState } from 'react'
import {
  BookOpen,
  BarChart3,
  Layers,
  Brain,
  Calendar,
  Coffee,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type InterventionType =
  | 'PREREQUISITE_REVIEW'
  | 'DIFFICULTY_PROGRESSION'
  | 'CONTENT_FORMAT_ADAPT'
  | 'COGNITIVE_LOAD_REDUCE'
  | 'SPACED_REPETITION_BOOST'
  | 'BREAK_SCHEDULE_ADJUST'

interface Intervention {
  id: string
  type: InterventionType
  title: string
  description: string
  effectiveness: number
  estimatedImpact: string
  applied: boolean
}

const INTERVENTION_ICONS: Record<InterventionType, React.ElementType> = {
  PREREQUISITE_REVIEW: BookOpen,
  DIFFICULTY_PROGRESSION: BarChart3,
  CONTENT_FORMAT_ADAPT: Layers,
  COGNITIVE_LOAD_REDUCE: Brain,
  SPACED_REPETITION_BOOST: Calendar,
  BREAK_SCHEDULE_ADJUST: Coffee,
}

export function InterventionRecommendationPanel() {
  const [autoApply, setAutoApply] = useState(false)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  // TODO: Replace with actual API call
  // const response = await fetch('/api/analytics/interventions', {
  //   headers: { 'X-User-Email': 'kevy@americano.dev' },
  // });
  // const interventions = await response.json();

  // Mock data for MVP
  const [interventions, setInterventions] = useState<Intervention[]>([
    {
      id: '1',
      type: 'PREREQUISITE_REVIEW',
      title: 'Review Action Potential Basics',
      description: 'Add foundational electrophysiology concepts before cardiac topics',
      effectiveness: 0.85,
      estimatedImpact: 'Helped 85% of users with similar patterns',
      applied: false,
    },
    {
      id: '2',
      type: 'SPACED_REPETITION_BOOST',
      title: 'Increase Physiology Review Frequency',
      description: 'Review physiological concepts 2x more often to strengthen retention',
      effectiveness: 0.78,
      estimatedImpact: 'Helped 78% of users with similar patterns',
      applied: false,
    },
    {
      id: '3',
      type: 'COGNITIVE_LOAD_REDUCE',
      title: 'Break Complex Topics into Smaller Units',
      description: 'Split cardiac electrophysiology into 3-4 smaller study sessions',
      effectiveness: 0.72,
      estimatedImpact: 'Helped 72% of users with similar patterns',
      applied: false,
    },
    {
      id: '4',
      type: 'CONTENT_FORMAT_ADAPT',
      title: 'Add Visual Learning Materials',
      description: 'Include more diagrams and animations for visual learning preference',
      effectiveness: 0.68,
      estimatedImpact: 'Helpful for visual learners',
      applied: false,
    },
  ])

  const handleApply = async (interventionId: string) => {
    setApplyingId(interventionId)

    // TODO: API call to apply intervention
    // await fetch(`/api/analytics/interventions/${interventionId}/apply`, {
    //   method: 'POST',
    //   headers: { 'X-User-Email': 'kevy@americano.dev' },
    // });

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setInterventions((prev) =>
      prev.map((i) => (i.id === interventionId ? { ...i, applied: true } : i)),
    )
    setApplyingId(null)
  }

  return (
    <Card className="shadow-none hover:shadow-none transition-shadow-none">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="font-heading text-[16px]">Recommended Actions</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {interventions.filter((i) => !i.applied).length} Available
          </Badge>
        </div>

        {/* Auto-Apply Toggle */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card mt-4">
          <button
            onClick={() => setAutoApply(!autoApply)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              autoApply ? 'bg-info' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={autoApply}
            aria-label="Auto-apply interventions"
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-none ring-0 transition duration-200 ease-in-out ${
                autoApply ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-foreground">Auto-apply interventions</p>
            <p className="text-[11px] text-muted-foreground">
              Automatically add recommended actions to your missions
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-3">
        {interventions.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="size-12 mx-auto text-success mb-3" />
            <p className="text-[13px] font-medium text-foreground">All set!</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              No interventions needed at this time
            </p>
          </div>
        ) : (
          interventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              onApply={handleApply}
              isApplying={applyingId === intervention.id}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Intervention Card
 */
function InterventionCard({
  intervention,
  onApply,
  isApplying,
}: {
  intervention: Intervention
  onApply: (id: string) => void
  isApplying: boolean
}) {
  const Icon = INTERVENTION_ICONS[intervention.type]
  const effectiveness = intervention.effectiveness * 100

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        intervention.applied
          ? 'bg-card border-success/30'
          : 'bg-card border-border hover:shadow-none'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`p-2 rounded-lg shrink-0 ${
            intervention.applied ? 'bg-card' : 'bg-card'
          }`}
        >
          <Icon
            className={`size-5 ${
              intervention.applied ? 'text-success' : 'text-info'
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[13px] text-foreground mb-1">{intervention.title}</h4>
          <p className="text-[11px] text-muted-foreground mb-2">{intervention.description}</p>

          {/* Effectiveness Badge */}
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="secondary"
              className="text-[11px] px-2 py-0.5 bg-card text-success border-success/30"
            >
              {effectiveness.toFixed(0)}% Effective
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground italic">{intervention.estimatedImpact}</p>

          {/* Action Button */}
          <div className="mt-3">
            {intervention.applied ? (
              <div className="flex items-center gap-2 text-[11px] font-medium text-success">
                <CheckCircle2 className="size-4" />
                Applied to missions
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full min-h-9 bg-info hover:bg-card text-white"
                onClick={() => onApply(intervention.id)}
                disabled={isApplying}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Applying...
                  </>
                ) : (
                  'Apply to Mission'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

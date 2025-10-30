/**
 * SessionPlanPreview Component
 * Story 5.4 - Orchestration Components Epic 5 Transformation
 *
 * Timeline visualization showing session phases (warm-up, peak, wind-down),
 * break intervals, and content items with customization options.
 *
 * Epic 5 Design: Clean timeline, OKLCH colors, NO gradients, minimalist glassmorphism
 * Accessibility: ARIA labels, semantic HTML, keyboard navigation
 */

'use client'

import { format } from 'date-fns'
import {
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  Coffee,
  FileText,
  FlaskConical,
  Moon,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ContentItem {
  type: 'flashcard' | 'new_flashcard' | 'validation' | 'clinical' | 'lecture' | 'break'
  id: string | null
  duration: number
  phase: 'warmup' | 'peak' | 'winddown'
  difficulty?: number
}

interface SessionPlan {
  id: string
  startTime: string
  endTime: string
  duration: number
  intensity: 'LOW' | 'MEDIUM' | 'HIGH'
  contentSequence: {
    sequence: ContentItem[]
    totalDuration: number
    phases: {
      warmUp: number
      peak: number
      windDown: number
    }
  }
  breaks: {
    breakIntervals: number[]
    breakDurations: number[]
    totalBreakTime: number
    reasoning: string
  }
  confidence: number
}

interface Props {
  plan: SessionPlan | null
  loading?: boolean
  onCustomize?: () => void
  className?: string
}

// OKLCH Phase Colors (Epic 5 design tokens)
const PHASE_COLORS = {
  warmup: 'oklch(0.8 0.1 180)', // Cyan - Ease into learning
  peak: 'oklch(0.75 0.12 25)', // Orange - Maximum focus
  winddown: 'oklch(0.8 0.08 145)', // Green - Cool down
} as const

export function SessionPlanPreview({ plan, loading, onCustomize, className = '' }: Props) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)

  if (loading) {
    return (
      <Card className={`shadow-sm ${className}`}>
        <CardHeader className="p-4 pb-0">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Session Plan</h3>
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <div className="h-48 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Clock className="size-8 mx-auto animate-pulse text-info" />
              <p className="text-[13px] text-muted-foreground">Loading session plan...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!plan) {
    return (
      <Card className={`shadow-sm ${className}`}>
        <CardHeader className="p-4 pb-0">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Session Plan</h3>
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <div className="h-48 flex items-center justify-center">
            <p className="text-[13px] text-muted-foreground">
              Select a time slot to preview session plan
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const startTime = new Date(plan.startTime)
  const endTime = new Date(plan.endTime)

  // Calculate timeline positions
  const totalMinutes = plan.duration
  const phases = plan.contentSequence.phases

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'LOW':
        return 'oklch(0.7 0.15 145)' // Green
      case 'MEDIUM':
        return 'oklch(0.8 0.15 85)' // Amber
      case 'HIGH':
        return 'oklch(0.6 0.20 30)' // Red
      default:
        return 'oklch(0.6 0.05 230)'
    }
  }

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'LOW':
        return 'Light Session'
      case 'MEDIUM':
        return 'Balanced Challenge'
      case 'HIGH':
        return 'Reduced Intensity'
      default:
        return intensity
    }
  }

  return (
    <Card
      className={`shadow-sm hover:shadow-md transition-shadow ${className}`}
      role="region"
      aria-label="Session Plan Preview"
    >
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-foreground text-[16px] mb-2">
              Session Plan Preview
            </h3>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[13px] text-muted-foreground">
              <div
                className="flex items-center gap-1"
                role="text"
                aria-label={`Session time: ${format(startTime, 'h:mm a')} to ${format(endTime, 'h:mm a')}`}
              >
                <Clock className="size-4" aria-hidden="true" />
                <span>
                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                </span>
              </div>
              <div
                className="flex items-center gap-1"
                role="text"
                aria-label={`Duration: ${plan.duration} minutes`}
              >
                <span className="font-medium">{plan.duration} min</span>
              </div>
              <Badge
                variant="outline"
                className="px-2 py-0.5"
                style={{
                  backgroundColor: `color-mix(in oklch, ${getIntensityColor(plan.intensity)}, transparent 90%)`,
                  borderColor: getIntensityColor(plan.intensity),
                  color: getIntensityColor(plan.intensity),
                }}
                role="status"
                aria-label={`Session intensity: ${getIntensityLabel(plan.intensity)}`}
              >
                {getIntensityLabel(plan.intensity)}
              </Badge>
            </div>
          </div>

          {onCustomize && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCustomize}
              className="sm:ml-4 transition-transform hover:scale-105 active:scale-95"
              aria-label="Customize session plan"
            >
              <Settings className="size-4 mr-2" aria-hidden="true" />
              Customize
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-6">
        {/* Timeline Visualization */}
        <section className="space-y-3" aria-labelledby="timeline-heading">
          <h4
            id="timeline-heading"
            className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
          >
            Session Timeline
          </h4>

          {/* Desktop: Horizontal Timeline */}
          <div
            className="hidden md:block"
            role="img"
            aria-label={`Session timeline: ${phases.warmUp} minute warmup, ${phases.peak} minute peak focus, ${phases.windDown} minute wind-down`}
          >
            <div className="relative h-24 rounded-lg overflow-hidden">
              {/* Warm-up Phase */}
              <div
                className="absolute top-0 h-full flex items-center justify-center transition-all hover:brightness-95"
                style={{
                  left: '0%',
                  width: `${(phases.warmUp / totalMinutes) * 100}%`,
                  backgroundColor: PHASE_COLORS.warmup,
                }}
                role="presentation"
              >
                <div className="text-center px-2">
                  <Sparkles
                    className="size-6 mx-auto mb-1"
                    style={{ color: 'oklch(0.3 0.1 180)' }}
                  />
                  <p className="text-[11px] font-semibold" style={{ color: 'oklch(0.3 0.1 180)' }}>
                    Warm-up
                  </p>
                  <p className="text-[11px]" style={{ color: 'oklch(0.4 0.1 180)' }}>
                    {phases.warmUp} min
                  </p>
                </div>
              </div>

              {/* Peak Phase */}
              <div
                className="absolute top-0 h-full flex items-center justify-center transition-all hover:brightness-95"
                style={{
                  left: `${(phases.warmUp / totalMinutes) * 100}%`,
                  width: `${(phases.peak / totalMinutes) * 100}%`,
                  backgroundColor: PHASE_COLORS.peak,
                }}
              >
                <div className="text-center px-2">
                  <Brain className="size-6 mx-auto mb-1" style={{ color: 'oklch(0.2 0.12 25)' }} />
                  <p className="text-[11px] font-semibold" style={{ color: 'oklch(0.2 0.12 25)' }}>
                    Peak Focus
                  </p>
                  <p className="text-[11px]" style={{ color: 'oklch(0.3 0.12 25)' }}>
                    {phases.peak} min
                  </p>
                </div>
              </div>

              {/* Wind-down Phase */}
              <div
                className="absolute top-0 h-full flex items-center justify-center transition-all hover:brightness-95"
                style={{
                  left: `${((phases.warmUp + phases.peak) / totalMinutes) * 100}%`,
                  width: `${(phases.windDown / totalMinutes) * 100}%`,
                  backgroundColor: PHASE_COLORS.winddown,
                }}
              >
                <div className="text-center px-2">
                  <Moon className="size-6 mx-auto mb-1" style={{ color: 'oklch(0.3 0.08 145)' }} />
                  <p className="text-[11px] font-semibold" style={{ color: 'oklch(0.3 0.08 145)' }}>
                    Wind-down
                  </p>
                  <p className="text-[11px]" style={{ color: 'oklch(0.4 0.08 145)' }}>
                    {phases.windDown} min
                  </p>
                </div>
              </div>

              {/* Break Indicators */}
              {plan.breaks.breakIntervals.map((interval, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 h-full w-1 hover:w-1.5 transition-all"
                  style={{
                    left: `${(interval / totalMinutes) * 100}%`,
                    backgroundColor: 'oklch(0.5 0.05 230)',
                  }}
                  title={`${plan.breaks.breakDurations[idx]}-min break at ${interval} min`}
                >
                  <Coffee
                    className="absolute -top-6 left-1/2 -translate-x-1/2 size-4"
                    style={{ color: 'oklch(0.5 0.05 230)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Stacked Phases */}
          <div className="md:hidden space-y-2">
            <PhaseCard
              icon={<Sparkles className="size-5" />}
              label="Warm-up"
              duration={phases.warmUp}
              color={PHASE_COLORS.warmup}
            />
            <PhaseCard
              icon={<Brain className="size-5" />}
              label="Peak Focus"
              duration={phases.peak}
              color={PHASE_COLORS.peak}
            />
            <PhaseCard
              icon={<Moon className="size-5" />}
              label="Wind-down"
              duration={phases.windDown}
              color={PHASE_COLORS.winddown}
            />
          </div>
        </section>

        {/* Break Schedule */}
        <section className="space-y-2" aria-labelledby="breaks-heading">
          <h4
            id="breaks-heading"
            className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide"
          >
            Scheduled Breaks
          </h4>
          <div
            className="flex flex-wrap gap-2"
            role="list"
            aria-label={`${plan.breaks.breakIntervals.length} scheduled breaks`}
          >
            {plan.breaks.breakIntervals.map((interval, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'oklch(0.95 0 0)',
                }}
                role="listitem"
                aria-label={`Break at ${interval} minutes for ${plan.breaks.breakDurations[idx]} minutes`}
              >
                <Coffee className="size-4 text-info" aria-hidden="true" />
                <span className="text-[13px]">
                  <span className="font-medium">{interval} min</span>
                  <span className="text-muted-foreground mx-1" aria-hidden="true">
                    •
                  </span>
                  <span className="text-muted-foreground">
                    {plan.breaks.breakDurations[idx]} min break
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground italic" role="note">
            {plan.breaks.reasoning}
          </p>
        </section>

        {/* Content Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Content Sequence
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-[11px]">
                  View All ({plan.contentSequence.sequence.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-heading text-[20px]">
                    Complete Content Sequence
                  </DialogTitle>
                  <DialogDescription>Optimized learning path for this session</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  {plan.contentSequence.sequence.map((item, idx) => (
                    <ContentItemRow key={idx} item={item} index={idx} />
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plan.contentSequence.sequence.slice(0, 6).map((item, idx) => (
              <ContentItemCard
                key={idx}
                item={item}
                index={idx}
                isHovered={hoveredItem === idx}
                onHover={() => setHoveredItem(idx)}
                onLeave={() => setHoveredItem(null)}
              />
            ))}
            {plan.contentSequence.sequence.length > 6 && (
              <div
                className="p-3 rounded-lg border flex items-center justify-center"
                style={{
                  backgroundColor: 'oklch(0.98 0 0)',
                  borderColor: 'oklch(0.9 0 0)',
                }}
              >
                <p className="text-[13px] text-muted-foreground">
                  +{plan.contentSequence.sequence.length - 6} more
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Phase Card for Mobile View
 */
function PhaseCard({
  icon,
  label,
  duration,
  color,
}: {
  icon: React.ReactNode
  label: string
  duration: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: color }}>
      <div style={{ color: `oklch(0.3 ${color.split(' ')[1]} ${color.split(' ')[2]}` }}>{icon}</div>
      <div className="flex-1">
        <p
          className="text-[13px] font-semibold"
          style={{ color: `oklch(0.3 ${color.split(' ')[1]} ${color.split(' ')[2]}` }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-[13px] font-medium"
        style={{ color: `oklch(0.4 ${color.split(' ')[1]} ${color.split(' ')[2]}` }}
      >
        {duration} min
      </p>
    </div>
  )
}

/**
 * Content Item Card
 */
function ContentItemCard({
  item,
  index,
  isHovered,
  onHover,
  onLeave,
}: {
  item: ContentItem
  index: number
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flashcard':
      case 'new_flashcard':
        return <BookOpen className="size-4" />
      case 'validation':
        return <CheckCircle className="size-4" />
      case 'clinical':
        return <FlaskConical className="size-4" />
      case 'lecture':
        return <FileText className="size-4" />
      case 'break':
        return <Coffee className="size-4" />
      default:
        return <BookOpen className="size-4" />
    }
  }

  const getItemLabel = (type: string) => {
    switch (type) {
      case 'flashcard':
        return 'Review'
      case 'new_flashcard':
        return 'New Card'
      case 'validation':
        return 'Quiz'
      case 'clinical':
        return 'Clinical'
      case 'lecture':
        return 'Lecture'
      case 'break':
        return 'Break'
      default:
        return type
    }
  }

  return (
    <div
      className="p-3 rounded-lg border transition-all cursor-pointer"
      style={{
        backgroundColor: isHovered ? 'oklch(0.95 0 0)' : 'oklch(0.98 0 0)',
        borderColor: 'oklch(0.9 0 0)',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-info">{getItemIcon(item.type)}</span>
        <span className="text-[13px] font-medium text-foreground">{getItemLabel(item.type)}</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{item.duration} min</p>
    </div>
  )
}

/**
 * Content Item Row for Dialog
 */
function ContentItemRow({ item, index }: { item: ContentItem; index: number }) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'warmup':
        return PHASE_COLORS.warmup
      case 'peak':
        return PHASE_COLORS.peak
      case 'winddown':
        return PHASE_COLORS.winddown
      default:
        return 'oklch(0.6 0.05 230)'
    }
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'oklch(0.98 0 0)' }}
    >
      <div
        className="flex items-center justify-center size-8 rounded-full font-semibold text-[13px] shrink-0"
        style={{
          backgroundColor: `color-mix(in oklch, ${getPhaseColor(item.phase)}, transparent 80%)`,
          color: getPhaseColor(item.phase),
        }}
      >
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">{item.type}</p>
        <p className="text-[11px] text-muted-foreground capitalize">{item.phase} phase</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-medium">{item.duration} min</p>
        {item.difficulty !== undefined && (
          <p className="text-[11px] text-muted-foreground">Difficulty: {item.difficulty}/10</p>
        )}
      </div>
    </div>
  )
}

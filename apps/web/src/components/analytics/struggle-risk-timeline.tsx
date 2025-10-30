/**
 * StruggleRiskTimeline Component
 * Story 5.2 Task 10 - UI Section 4
 * Wave 3: Enhanced with animations and design tokens
 *
 * Displays predicted struggle periods on a horizontal timeline
 * Integrates with upcoming missions/exams with 7-day lookahead
 *
 * Design: OKLCH colors, glassmorphism, NO gradients (per CLAUDE.md)
 * Animations: Stagger animations for timeline items
 */

'use client'

import { addDays, format, isAfter, isBefore, isWithinInterval } from 'date-fns'
import { AlertTriangle, BookOpen, Calendar, FileCheck2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { colors, typography } from '@/lib/design-tokens'

interface TimelineEvent {
  id: string
  type: 'prediction' | 'mission' | 'exam'
  title: string
  date: string
  probability?: number // For predictions
  status?: 'high' | 'medium' | 'low'
}

interface Props {
  predictions?: TimelineEvent[]
  daysAhead?: number
}

export function StruggleRiskTimeline({ predictions = [], daysAhead = 7 }: Props) {
  const today = new Date()
  const endDate = addDays(today, daysAhead)

  // Generate day markers for the timeline
  const days = Array.from({ length: daysAhead + 1 }, (_, i) => addDays(today, i))

  // Mock data if no predictions provided (for development)
  const events: TimelineEvent[] =
    predictions.length > 0
      ? predictions
      : [
          {
            id: '1',
            type: 'prediction',
            title: 'Cardiac Electrophysiology',
            date: addDays(today, 2).toISOString(),
            probability: 0.75,
            status: 'high',
          },
          {
            id: '2',
            type: 'mission',
            title: 'Daily Mission: Renal Physiology',
            date: addDays(today, 1).toISOString(),
          },
          {
            id: '3',
            type: 'prediction',
            title: 'Neuroanatomy Advanced Concepts',
            date: addDays(today, 5).toISOString(),
            probability: 0.55,
            status: 'medium',
          },
          {
            id: '4',
            type: 'exam',
            title: 'Physiology Midterm',
            date: addDays(today, 7).toISOString(),
          },
        ]

  // Group events by day
  const eventsByDay = days.map((day) => {
    const dayEvents = events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ||
        isWithinInterval(eventDate, {
          start: day,
          end: addDays(day, 1),
        })
      )
    })
    return { day, events: dayEvents }
  })

  const getEventColor = (event: TimelineEvent) => {
    if (event.type === 'prediction') {
      if (event.status === 'high') return colors.alert
      if (event.status === 'medium') return colors.warning
      return colors.success
    }
    if (event.type === 'exam') return colors.energy
    return colors.clinical
  }

  const getEventIcon = (event: TimelineEvent) => {
    if (event.type === 'prediction') return AlertTriangle
    if (event.type === 'exam') return FileCheck2
    return BookOpen
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className={`${typography.heading.h3} font-heading mb-2`}>
              Upcoming Challenges
            </CardTitle>
            <p className={`${typography.body.small} text-muted-foreground`}>
              {daysAhead}-day lookahead of predicted struggles and important dates
            </p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 transition-all duration-200 hover:scale-105"
          >
            {events.filter((e) => e.type === 'prediction').length} Predictions
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="size-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className={`${typography.body.small} font-medium text-foreground`}>
              No upcoming challenges
            </p>
            <p className={`${typography.body.tiny} text-muted-foreground mt-1`}>
              Your schedule is clear for the next {daysAhead} days!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline Grid */}
            <div className="relative">
              {/* Horizontal Timeline Line */}
              <div className="absolute top-8 left-4 right-4 h-0.5 bg-gradient-to-r from-muted via-border to-muted" />

              {/* Days */}
              <div className="relative grid grid-cols-7 gap-2 sm:gap-4">
                {eventsByDay.slice(0, 7).map(({ day, events: dayEvents }, index) => {
                  const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                  const hasHighRisk = dayEvents.some(
                    (e) => e.type === 'prediction' && e.status === 'high',
                  )
                  const hasEvents = dayEvents.length > 0

                  return (
                    <div key={index} className="flex flex-col items-center">
                      {/* Day Marker */}
                      <div
                        className={`
                          relative z-10 flex flex-col items-center justify-center size-16 rounded-full border-2 transition-all duration-300 hover:scale-110
                          ${
                            isToday
                              ? 'text-white shadow-lg'
                              : hasHighRisk
                                ? 'text-foreground'
                                : hasEvents
                                  ? 'bg-white/80 text-foreground'
                                  : 'bg-muted/30 border-muted text-muted-foreground'
                          }
                        `}
                        style={{
                          backgroundColor: isToday
                            ? colors.clinical
                            : hasHighRisk
                              ? `color-mix(in oklch, ${colors.alert}, transparent 90%)`
                              : undefined,
                          borderColor: isToday
                            ? colors.clinical
                            : hasHighRisk
                              ? colors.alert
                              : hasEvents
                                ? colors.clinical
                                : undefined,
                        }}
                      >
                        <span className={`${typography.body.tiny} font-semibold`}>
                          {format(day, 'EEE')}
                        </span>
                        <span className={`text-lg font-bold ${isToday ? 'text-white' : ''}`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Event Indicators */}
                      {dayEvents.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5 w-full">
                          {dayEvents.map((event) => {
                            const Icon = getEventIcon(event)
                            const color = getEventColor(event)

                            return (
                              <div
                                key={event.id}
                                className="group relative flex items-center justify-center"
                              >
                                <div
                                  className="p-1.5 rounded-md transition-all duration-200 hover:scale-110 cursor-pointer hover:shadow-md"
                                  style={{
                                    backgroundColor: `color-mix(in oklch, ${color}, transparent 85%)`,
                                  }}
                                  title={event.title}
                                >
                                  <Icon className="size-3 sm:size-4" style={{ color }} />
                                </div>

                                {/* Tooltip on hover - hidden on mobile */}
                                <div className="hidden sm:block absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                                  <div className="px-3 py-2 rounded-lg bg-foreground/90 backdrop-blur-sm text-white shadow-lg">
                                    <p className={`${typography.body.tiny} font-semibold`}>
                                      {event.title}
                                    </p>
                                    {event.probability && (
                                      <p className={`${typography.body.tiny} text-white/80 mt-0.5`}>
                                        {(event.probability * 100).toFixed(0)}% probability
                                      </p>
                                    )}
                                  </div>
                                  <div
                                    className="w-2 h-2 bg-foreground/90 rotate-45 mx-auto -mt-1"
                                    style={{ marginTop: '-4px' }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Event Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 transition-all duration-200 hover:scale-105">
                <div
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${colors.alert}, transparent 85%)`,
                  }}
                >
                  <AlertTriangle className="size-4" style={{ color: colors.alert }} />
                </div>
                <span className={`${typography.body.tiny} text-muted-foreground`}>
                  High Risk Prediction
                </span>
              </div>
              <div className="flex items-center gap-2 transition-all duration-200 hover:scale-105">
                <div
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${colors.clinical}, transparent 85%)`,
                  }}
                >
                  <BookOpen className="size-4" style={{ color: colors.clinical }} />
                </div>
                <span className={`${typography.body.tiny} text-muted-foreground`}>
                  Scheduled Mission
                </span>
              </div>
              <div className="flex items-center gap-2 transition-all duration-200 hover:scale-105">
                <div
                  className="p-1.5 rounded"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${colors.energy}, transparent 85%)`,
                  }}
                >
                  <FileCheck2 className="size-4" style={{ color: colors.energy }} />
                </div>
                <span className={`${typography.body.tiny} text-muted-foreground`}>
                  Upcoming Exam
                </span>
              </div>
            </div>

            {/* Mobile Event List (visible on small screens) */}
            <div className="sm:hidden space-y-2 pt-4 border-t border-border">
              <p
                className={`${typography.body.tiny} font-semibold text-muted-foreground uppercase tracking-wide`}
              >
                Event Details
              </p>
              {events.map((event) => {
                const Icon = getEventIcon(event)
                const color = getEventColor(event)

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 transition-all duration-200 hover:bg-muted/50 hover:scale-[1.01]"
                  >
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ backgroundColor: `color-mix(in oklch, ${color}, transparent 85%)` }}
                    >
                      <Icon className="size-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${typography.body.small} font-semibold text-foreground`}>
                        {event.title}
                      </p>
                      <p className={`${typography.body.tiny} text-muted-foreground mt-0.5`}>
                        {format(new Date(event.date), 'MMM d, yyyy')}
                        {event.probability &&
                          ` • ${(event.probability * 100).toFixed(0)}% probability`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

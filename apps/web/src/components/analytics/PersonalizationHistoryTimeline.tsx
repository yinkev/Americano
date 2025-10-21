/**
 * PersonalizationHistoryTimeline Component
 * Story 5.5 Task 13.4
 *
 * Vertical timeline showing personalization events and adaptations
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Clock,
  Activity,
  BookOpen,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  History,
  Filter,
} from 'lucide-react'

interface PersonalizationEvent {
  id: string
  timestamp: string
  eventType: 'pattern_detected' | 'recommendation_applied' | 'config_updated' | 'level_changed'
  context: 'mission' | 'content' | 'assessment' | 'session' | 'general'
  title: string
  description: string
  outcome?: 'positive' | 'neutral' | 'negative'
  metadata?: Record<string, any>
}

const CONTEXT_ICONS = {
  mission: Clock,
  content: BookOpen,
  assessment: Target,
  session: Activity,
  general: History,
}

const CONTEXT_COLORS = {
  mission: 'oklch(0.7 0.15 230)',
  content: 'oklch(0.8 0.15 85)',
  assessment: 'oklch(0.6 0.15 25)',
  session: 'oklch(0.7 0.15 145)',
  general: 'oklch(0.7 0.15 300)',
}

const OUTCOME_ICONS = {
  positive: TrendingUp,
  neutral: Minus,
  negative: TrendingDown,
}

const OUTCOME_COLORS = {
  positive: 'oklch(0.7 0.15 145)',
  neutral: 'oklch(0.556 0 0)',
  negative: 'oklch(0.6 0.15 25)',
}

export function PersonalizationHistoryTimeline() {
  const [events, setEvents] = useState<PersonalizationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [contextFilter, setContextFilter] = useState<string>('all')
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all')

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      setLoading(true)

      // Fetch from real API endpoint
      const response = await fetch('/api/personalization/history?userId=user-kevy')

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`)
      }

      const result = await response.json()

      // Transform API response to component format
      const apiEvents = result.events || []
      const transformedEvents: PersonalizationEvent[] = apiEvents.map((event: any) => {
        // Map API event types to component event types
        const eventTypeMap: Record<string, PersonalizationEvent['eventType']> = {
          APPLIED: 'recommendation_applied',
          REMOVED: 'config_updated',
          EFFECTIVENESS_CHANGED: 'config_updated',
        }

        // Map context (MISSION -> mission)
        const contextMap: Record<string, PersonalizationEvent['context']> = {
          MISSION: 'mission',
          CONTENT: 'content',
          ASSESSMENT: 'assessment',
          SESSION: 'session',
          GENERAL: 'general',
        }

        // Determine outcome based on event type and effectiveness
        let outcome: PersonalizationEvent['outcome'] = 'neutral'
        if (event.eventType === 'APPLIED' || event.effectivenessScore >= 70) {
          outcome = 'positive'
        } else if (event.eventType === 'REMOVED' || event.effectivenessScore < 50) {
          outcome = 'negative'
        }

        return {
          id: event.id,
          timestamp: event.timestamp,
          eventType: eventTypeMap[event.eventType] || 'config_updated',
          context: contextMap[event.context] || 'general',
          title: event.reason || 'Personalization Event',
          description: event.reason || `${event.strategyVariant} strategy ${event.eventType.toLowerCase()}`,
          outcome,
          metadata: {
            configId: event.configId,
            strategyVariant: event.strategyVariant,
            previousValue: event.previousValue,
            newValue: event.newValue,
            effectivenessScore: event.effectivenessScore,
          },
        }
      })

      setEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching history:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (contextFilter !== 'all' && event.context !== contextFilter) return false
    if (outcomeFilter !== 'all' && event.outcome !== outcomeFilter) return false
    return true
  })

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl">
        <CardContent className="p-6 h-96 flex items-center justify-center">
          <p className="text-[13px] text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl hover:shadow-[0_12px_40px_rgba(31,38,135,0.15)] transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="font-heading font-semibold text-[18px] flex items-center gap-2">
              <History className="size-5" style={{ color: 'oklch(0.7 0.15 300)' }} />
              Personalization History
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">
              Timeline of personalization events and adaptations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mission">Mission</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="session">Session</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Filter className="size-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No events match the selected filters</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setContextFilter('all')
                setOutcomeFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event, index) => {
                const ContextIcon = CONTEXT_ICONS[event.context]
                const contextColor = CONTEXT_COLORS[event.context]
                const OutcomeIcon = event.outcome
                  ? OUTCOME_ICONS[event.outcome]
                  : null
                const outcomeColor = event.outcome
                  ? OUTCOME_COLORS[event.outcome]
                  : undefined

                const isLast = index === filteredEvents.length - 1

                return (
                  <div key={event.id} className="relative pl-20">
                    {/* Timeline Dot */}
                    <div
                      className="absolute left-6 top-2 size-5 rounded-full border-4 border-background flex items-center justify-center"
                      style={{ backgroundColor: contextColor }}
                    >
                      <div className="size-2 rounded-full bg-white" />
                    </div>

                    {/* Event Card */}
                    <div
                      className="p-4 rounded-xl border transition-all hover:shadow-md"
                      style={{
                        backgroundColor: `${contextColor}/0.05`,
                        borderColor: `${contextColor}/0.2`,
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: `${contextColor}/0.15` }}
                          >
                            <ContextIcon className="size-4" style={{ color: contextColor }} />
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {event.title}
                          </h4>
                        </div>
                        {event.outcome && OutcomeIcon && (
                          <div className="flex items-center gap-1 shrink-0">
                            <OutcomeIcon
                              className="size-4"
                              style={{ color: outcomeColor }}
                            />
                            <Badge
                              variant="outline"
                              className="px-2 py-0 text-xs capitalize"
                              style={{
                                backgroundColor: `${outcomeColor}/0.1`,
                                borderColor: outcomeColor,
                                color: outcomeColor,
                              }}
                            >
                              {event.outcome}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-foreground mb-3">{event.description}</p>

                      {/* Metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>
                          {new Date(event.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="capitalize">
                          {event.eventType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        {filteredEvents.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

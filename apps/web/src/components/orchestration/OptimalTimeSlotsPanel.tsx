/**
 * OptimalTimeSlotsPanel Component
 * Story 5.4 - Orchestration Components Epic 5 Transformation
 *
 * Displays 3-5 recommended study time slots with confidence indicators,
 * availability status, and reasoning tooltips.
 *
 * Epic 5 Design: Clean cards, OKLCH colors, NO gradients, star confidence indicators
 * Accessibility: ARIA labels, semantic HTML, keyboard navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Star, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TimeSlot {
  startTime: string
  endTime: string
  duration: number
  score: number
  confidence: number
  reasoning: string[]
  calendarConflict: boolean
  conflictingEvents?: Array<{ summary: string; start: string; end: string }>
}

interface Props {
  userId: string
  onSelectSlot: (slot: TimeSlot) => void
  className?: string
}

export function OptimalTimeSlotsPanel({ userId, onSelectSlot, className = '' }: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch('/api/orchestration/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })

        if (!res.ok) throw new Error('Failed to fetch recommendations')

        const data = await res.json()
        setSlots(data.recommendations || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  if (loading) {
    return (
      <Card className={`shadow-sm ${className}`}>
        <CardHeader className="p-4 pb-0">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Optimal Study Times</h3>
        </CardHeader>
        <CardContent className="p-4 pt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error || slots.length === 0) {
    return (
      <Card className={`shadow-sm ${className}`}>
        <CardHeader className="p-4 pb-0">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Optimal Study Times</h3>
        </CardHeader>
        <CardContent className="p-4 pt-4">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              {error ||
                'No recommendations available. Complete more study sessions to unlock personalized timing.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-foreground text-[16px]">Optimal Study Times</h3>
          <button className="p-1 hover:bg-muted rounded-md transition-colors" aria-label="Time recommendations info">
            <Info className="size-4 text-info" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4 space-y-3">
        {slots.map((slot, index) => (
          <TimeSlotCard
            key={`${slot.startTime}-${index}`}
            slot={slot}
            rank={index + 1}
            onSelect={() => onSelectSlot(slot)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Individual Time Slot Card
 */
interface TimeSlotCardProps {
  slot: TimeSlot
  rank: number
  onSelect: () => void
}

function TimeSlotCard({ slot, rank, onSelect }: TimeSlotCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const startTime = new Date(slot.startTime)
  const endTime = new Date(slot.endTime)
  const confidenceStars = Math.round(slot.confidence * 5)

  // Determine availability color
  const getAvailabilityColor = () => {
    if (slot.calendarConflict) {
      return 'oklch(0.6 0.20 30)' // Red - Busy
    }
    if (slot.score > 80) {
      return 'oklch(0.7 0.15 145)' // Green - Available + Optimal
    }
    return 'oklch(0.8 0.15 85)' // Amber - Available but suboptimal
  }

  const getAvailabilityLabel = () => {
    if (slot.calendarConflict) return 'Busy'
    if (slot.score > 80) return 'Optimal'
    return 'Available'
  }

  const availabilityColor = getAvailabilityColor()
  const availabilityLabel = getAvailabilityLabel()

  return (
    <div
      className="p-4 rounded-lg border transition-all hover:shadow-md"
      style={{
        backgroundColor: 'oklch(0.98 0 0)',
        borderColor: slot.calendarConflict ? availabilityColor : 'oklch(0.9 0 0)',
        borderWidth: slot.calendarConflict ? '2px' : '1px',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Section - Time & Rank */}
        <div className="flex items-start gap-3">
          {/* Rank Badge */}
          <div
            className="flex items-center justify-center size-8 rounded-full font-semibold text-[13px] shrink-0"
            style={{
              backgroundColor: rank === 1 ? 'color-mix(in oklch, oklch(0.7 0.15 145), transparent 80%)' : 'color-mix(in oklch, oklch(0.5 0 0), transparent 90%)',
              color: rank === 1 ? 'oklch(0.5 0.20 145)' : 'oklch(0.5 0 0)',
            }}
          >
            {rank}
          </div>

          <div className="flex-1 min-w-0">
            {/* Time Display */}
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-info" />
              <span className="font-semibold text-foreground text-[15px]">
                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Calendar className="size-4" />
              <span>{format(startTime, 'EEE, MMM d')}</span>
            </div>

            {/* Confidence Stars */}
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4"
                  fill={i < confidenceStars ? 'oklch(0.8 0.15 85)' : 'none'}
                  style={{
                    color: i < confidenceStars ? 'oklch(0.8 0.15 85)' : 'oklch(0.85 0 0)',
                  }}
                />
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">
                {(slot.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Status & Action */}
        <div className="flex flex-col items-end gap-2">
          {/* Availability Badge */}
          <Badge
            variant="outline"
            className="px-3 py-1 font-semibold"
            style={{
              backgroundColor: `color-mix(in oklch, ${availabilityColor}, transparent 90%)`,
              borderColor: availabilityColor,
              color: availabilityColor,
            }}
          >
            {slot.calendarConflict && <AlertCircle className="size-3 mr-1" />}
            {!slot.calendarConflict && slot.score > 80 && <CheckCircle className="size-3 mr-1" />}
            {availabilityLabel}
          </Badge>

          {/* Select Button */}
          <Button
            onClick={onSelect}
            disabled={slot.calendarConflict}
            size="sm"
            className="min-w-24"
            style={{
              backgroundColor: slot.calendarConflict
                ? 'oklch(0.9 0 0)'
                : 'oklch(0.7 0.15 145)',
              color: slot.calendarConflict ? 'oklch(0.6 0 0)' : 'white',
            }}
          >
            Select
          </Button>
        </div>
      </div>

      {/* Calendar Conflicts */}
      {slot.calendarConflict && slot.conflictingEvents && slot.conflictingEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'oklch(0.9 0 0)' }}>
          <p className="text-[11px] font-medium text-muted-foreground mb-2">Calendar Conflicts:</p>
          <div className="space-y-1">
            {slot.conflictingEvents.map((event, idx) => (
              <div
                key={idx}
                className="text-[11px] px-2 py-1 rounded"
                style={{ backgroundColor: 'oklch(0.95 0 0)' }}
              >
                <span className="font-medium">{event.summary}</span>
                <span className="text-muted-foreground ml-2">
                  {format(new Date(event.start), 'h:mm a')} -{' '}
                  {format(new Date(event.end), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning (Expandable) */}
      <div className="mt-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors text-[13px]"
          aria-expanded={showDetails}
          aria-label="Toggle reasoning details"
        >
          <span className="font-medium text-foreground">
            Why this recommendation?
          </span>
          <Info className="size-4 text-info" />
        </button>

        {showDetails && (
          <div className="mt-2 space-y-1">
            {slot.reasoning.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-[11px] px-3 py-2 rounded"
                style={{ backgroundColor: 'oklch(0.95 0 0)' }}
              >
                <CheckCircle
                  className="size-3 mt-0.5 shrink-0"
                  style={{ color: 'oklch(0.7 0.15 145)' }}
                />
                <span className="text-muted-foreground">{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

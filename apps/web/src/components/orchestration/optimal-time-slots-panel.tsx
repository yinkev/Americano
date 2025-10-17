'use client'

import { AlertCircle, Calendar, CheckCircle, Clock, Info } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  duration: number
  confidence: number
  status: 'available' | 'suboptimal' | 'busy'
  reasoning: string
  calendarConflict?: string
}

interface OptimalTimeSlotsPanelProps {
  onTimeSlotSelect: (timeSlot: TimeSlot) => void
  selectedTimeSlotId?: string
}

export function OptimalTimeSlotsPanel({
  onTimeSlotSelect,
  selectedTimeSlotId,
}: OptimalTimeSlotsPanelProps): JSX.Element {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOptimalTimeSlots = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/orchestration/recommendations')
      const data = await response.json()

      if (data.success) {
        setTimeSlots(data.data.timeSlots || [])
      }
    } catch (error) {
      console.error('Failed to fetch optimal time slots:', error)
      // Fallback data for demonstration
      setTimeSlots([
        {
          id: '1',
          startTime: '09:00',
          endTime: '10:00',
          duration: 60,
          confidence: 0.92,
          status: 'available',
          reasoning: 'Based on your 85% performance at this time last week',
        },
        {
          id: '2',
          startTime: '14:00',
          endTime: '15:30',
          duration: 90,
          confidence: 0.78,
          status: 'suboptimal',
          reasoning: 'Good concentration levels, slightly lower than morning peak',
        },
        {
          id: '3',
          startTime: '16:00',
          endTime: '17:00',
          duration: 60,
          confidence: 0.65,
          status: 'busy',
          reasoning: 'Usually fatigued after long study sessions',
          calendarConflict: 'Busy: Anatomy Lab 2-4 PM',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOptimalTimeSlots()
  }, [fetchOptimalTimeSlots])

  function getConfidenceStars(confidence: number): string {
    const fullStars = Math.round(confidence * 5)
    return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars)
  }

  function getStatusColor(status: TimeSlot['status']): string {
    switch (status) {
      case 'available':
        return 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)] border-[oklch(0.75_0.15_160)]/20'
      case 'suboptimal':
        return 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)] border-[oklch(0.7_0.15_50)]/20'
      case 'busy':
        return 'bg-[oklch(0.65_0.15_10)]/10 text-[oklch(0.65_0.15_10)] border-[oklch(0.65_0.15_10)]/20'
      default:
        return 'bg-[oklch(0.922_0_0)]/10 text-[oklch(0.556_0_0)] border-[oklch(0.922_0_0)]/20'
    }
  }

  function getStatusIcon(status: TimeSlot['status']): JSX.Element {
    switch (status) {
      case 'available':
        return <CheckCircle className="size-4" aria-hidden="true" />
      case 'suboptimal':
        return <AlertCircle className="size-4" aria-hidden="true" />
      case 'busy':
        return <Clock className="size-4" aria-hidden="true" />
      default:
        return <Clock className="size-4" aria-hidden="true" />
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" aria-hidden="true" />
            Optimal Study Times
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-[oklch(0.922_0_0)] rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5 text-[oklch(0.7_0.15_230)]" aria-hidden="true" />
          Optimal Study Times
        </CardTitle>
        <CardDescription>
          Recommended time slots based on your historical performance patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timeSlots.map((timeSlot) => (
            <div
              key={timeSlot.id}
              className={`
                relative rounded-xl border-2 p-4 transition-all duration-200
                ${
                  selectedTimeSlotId === timeSlot.id
                    ? 'border-[oklch(0.7_0.15_230)] bg-[oklch(0.7_0.15_230)]/5'
                    : 'border-[oklch(0.922_0_0)] hover:border-[oklch(0.922_0_0)]/60 hover:bg-white/40'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(timeSlot.status)}
                    <span className="font-semibold text-[oklch(0.145_0_0)]">
                      {timeSlot.startTime} - {timeSlot.endTime}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(timeSlot.status)}`}
                    >
                      {timeSlot.duration} min
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-[oklch(0.556_0_0)]">Confidence:</span>
                    <span className="text-xs font-medium text-[oklch(0.7_0.15_230)]">
                      {getConfidenceStars(timeSlot.confidence)}
                    </span>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-4 h-auto p-0"
                          aria-label={`View reasoning for ${timeSlot.startTime} to ${timeSlot.endTime} time slot`}
                        >
                          <Info className="size-3 text-[oklch(0.556_0_0)]" aria-hidden="true" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 bg-white/98 backdrop-blur-xl border-white/40">
                        <p className="text-sm text-[oklch(0.145_0_0)]">{timeSlot.reasoning}</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>

                  {timeSlot.calendarConflict && (
                    <div className="flex items-center gap-2 text-xs text-[oklch(0.65_0.15_10)]">
                      <Calendar className="size-3" aria-hidden="true" />
                      {timeSlot.calendarConflict}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => onTimeSlotSelect(timeSlot)}
                  disabled={timeSlot.status === 'busy'}
                  className={`
                    flex-shrink-0 transition-all duration-200
                    ${
                      timeSlot.status === 'busy'
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105'
                    }
                  `}
                  aria-label={`Select study time slot from ${timeSlot.startTime} to ${timeSlot.endTime}`}
                >
                  {timeSlot.status === 'busy' ? 'Unavailable' : 'Select'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

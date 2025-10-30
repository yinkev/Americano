'use client'

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isFuture,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MissionTimelineProps {
  missions: Array<{
    id: string
    date: string
    status: 'COMPLETED' | 'SKIPPED' | 'PENDING' | 'IN_PROGRESS'
    completedObjectivesCount: number
    objectives: any[]
    successScore?: number
  }>
  onDateClick?: (date: Date, missions: any[]) => void
}

export function MissionTimeline({ missions, onDateClick }: MissionTimelineProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Create a map of date -> missions for quick lookup
  const missionsByDate = useMemo(() => {
    const map = new Map<string, typeof missions>()

    missions.forEach((mission) => {
      const dateKey = format(parseISO(mission.date), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || []
      map.set(dateKey, [...existing, mission])
    })

    return map
  }, [missions])

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  function previousMonth() {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  function nextMonth() {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  function getDayStatus(day: Date) {
    const dateKey = format(day, 'yyyy-MM-dd')
    const dayMissions = missionsByDate.get(dateKey) || []

    if (dayMissions.length === 0) {
      return {
        type: 'empty' as const,
        color: 'bg-[oklch(0.97_0_0)]',
        icon: null,
        missions: [],
      }
    }

    // Determine overall status based on missions
    const hasCompleted = dayMissions.some((m) => m.status === 'COMPLETED')
    const hasSkipped = dayMissions.some((m) => m.status === 'SKIPPED')
    const hasInProgress = dayMissions.some((m) => m.status === 'IN_PROGRESS')

    if (hasCompleted) {
      // Calculate average completion rate
      const avgCompletionRate =
        dayMissions.reduce(
          (sum, m) =>
            sum + (m.objectives.length > 0 ? m.completedObjectivesCount / m.objectives.length : 0),
          0,
        ) / dayMissions.length

      // Color intensity based on completion rate
      if (avgCompletionRate >= 0.9) {
        return {
          type: 'completed' as const,
          color: 'bg-[oklch(0.75_0.15_160)] hover:bg-[oklch(0.7_0.15_160)]',
          intensity: 'full',
          icon: CheckCircle2,
          missions: dayMissions,
        }
      } else if (avgCompletionRate >= 0.7) {
        return {
          type: 'completed' as const,
          color: 'bg-[oklch(0.75_0.15_160)]/70 hover:bg-[oklch(0.75_0.15_160)]/80',
          intensity: 'high',
          icon: CheckCircle2,
          missions: dayMissions,
        }
      } else if (avgCompletionRate >= 0.5) {
        return {
          type: 'partial' as const,
          color: 'bg-[oklch(0.7_0.15_50)]/50 hover:bg-[oklch(0.7_0.15_50)]/60',
          intensity: 'medium',
          icon: Clock,
          missions: dayMissions,
        }
      } else {
        return {
          type: 'partial' as const,
          color: 'bg-[oklch(0.7_0.15_50)]/30 hover:bg-[oklch(0.7_0.15_50)]/40',
          intensity: 'low',
          icon: Clock,
          missions: dayMissions,
        }
      }
    } else if (hasInProgress) {
      return {
        type: 'in-progress' as const,
        color: 'bg-[oklch(0.7_0.15_50)] hover:bg-[oklch(0.65_0.15_50)]',
        icon: Clock,
        missions: dayMissions,
      }
    } else if (hasSkipped) {
      return {
        type: 'skipped' as const,
        color: 'bg-[oklch(0.556_0_0)]/30 hover:bg-[oklch(0.556_0_0)]/40',
        icon: XCircle,
        missions: dayMissions,
      }
    }

    return {
      type: 'empty' as const,
      color: 'bg-[oklch(0.97_0_0)]',
      icon: null,
      missions: [],
    }
  }

  function renderDay(day: Date) {
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
    const dayStatus = getDayStatus(day)
    const isCurrentDay = isToday(day)
    const isFutureDay = isFuture(day) && !isToday(day)

    const dayNumber = format(day, 'd')

    return (
      <TooltipProvider key={day.toISOString()}>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                if (dayStatus.missions.length > 0 && onDateClick) {
                  onDateClick(day, dayStatus.missions)
                }
              }}
              disabled={dayStatus.missions.length === 0}
              className={`
                relative aspect-square rounded-lg p-2
                transition-all duration-200
                ${isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                ${isFutureDay ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${dayStatus.color}
                ${isCurrentDay ? 'ring-2 ring-[oklch(0.7_0.15_230)] ring-offset-2' : ''}
                ${dayStatus.missions.length > 0 ? 'hover:scale-105 hover:shadow-md' : ''}
                disabled:cursor-default disabled:hover:scale-100
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
              `}
              type="button"
            >
              {/* Day Number */}
              <span
                className={`text-xs font-medium ${
                  dayStatus.type === 'completed' && dayStatus.intensity === 'full'
                    ? 'text-white'
                    : dayStatus.type === 'empty' || !isCurrentMonth
                      ? 'text-[oklch(0.556_0_0)]'
                      : 'text-[oklch(0.145_0_0)]'
                }`}
              >
                {dayNumber}
              </span>

              {/* Status Indicator */}
              {dayStatus.icon && isCurrentMonth && (
                <div className="absolute bottom-1 right-1">
                  <dayStatus.icon
                    className={`size-3 ${
                      dayStatus.type === 'completed' && dayStatus.intensity === 'full'
                        ? 'text-white'
                        : dayStatus.type === 'completed'
                          ? 'text-[oklch(0.75_0.15_160)]'
                          : dayStatus.type === 'skipped'
                            ? 'text-[oklch(0.556_0_0)]'
                            : 'text-[oklch(0.7_0.15_50)]'
                    }`}
                  />
                </div>
              )}

              {/* Multiple Missions Indicator */}
              {dayStatus.missions.length > 1 && isCurrentMonth && (
                <div className="absolute top-1 right-1">
                  <span className="inline-flex items-center justify-center size-4 rounded-full bg-white/90 text-[8px] font-bold text-[oklch(0.145_0_0)]">
                    {dayStatus.missions.length}
                  </span>
                </div>
              )}
            </button>
          </TooltipTrigger>
          {dayStatus.missions.length > 0 && (
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold text-[13px]">{format(day, 'EEEE, MMMM d')}</p>
                {dayStatus.missions.map((mission, idx) => {
                  const completionRate =
                    mission.objectives.length > 0
                      ? (mission.completedObjectivesCount / mission.objectives.length) * 100
                      : 0

                  return (
                    <div key={mission.id} className="text-[11px] space-y-1">
                      {dayStatus.missions.length > 1 && (
                        <p className="font-medium text-muted-foreground">Mission {idx + 1}:</p>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {mission.completedObjectivesCount} / {mission.objectives.length}{' '}
                          objectives
                        </span>
                        <span
                          className={`font-medium ${
                            mission.status === 'COMPLETED'
                              ? 'text-[oklch(0.75_0.15_160)]'
                              : mission.status === 'SKIPPED'
                                ? 'text-[oklch(0.556_0_0)]'
                                : 'text-[oklch(0.7_0.15_50)]'
                          }`}
                        >
                          {Math.round(completionRate)}%
                        </span>
                      </div>
                      {mission.successScore !== undefined && (
                        <p className="text-muted-foreground">
                          Success: {Math.round(mission.successScore * 100)}%
                        </p>
                      )}
                    </div>
                  )
                })}
                <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                  Click to view details
                </p>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Calculate stats for current month
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    const monthMissions = missions.filter((m) => {
      const missionDate = parseISO(m.date)
      return missionDate >= monthStart && missionDate <= monthEnd
    })

    const completed = monthMissions.filter((m) => m.status === 'COMPLETED').length
    const total = monthMissions.length

    return {
      total,
      completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgSuccessScore:
        total > 0
          ? monthMissions
              .filter((m) => m.successScore !== undefined)
              .reduce((sum, m) => sum + (m.successScore ?? 0), 0) / total
          : 0,
    }
  }, [missions, currentMonth])

  return (
    <div className="rounded-lg bg-white border shadow-sm p-4 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-clinical/10 p-2">
            <Calendar className="size-5 text-clinical" />
          </div>
          <div>
            <h3 className="text-[16px] font-heading font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {monthStats.completed} / {monthStats.total} missions completed (
              {monthStats.completionRate}%)
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
            className="text-[11px]"
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">{calendarDays.map((day) => renderDay(day))}</div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-[11px] font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Legend:
        </p>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-[oklch(0.75_0.15_160)]" />
            <span className="text-muted-foreground">Completed (90%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-[oklch(0.75_0.15_160)]/70" />
            <span className="text-muted-foreground">Completed (70-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-[oklch(0.7_0.15_50)]/50" />
            <span className="text-muted-foreground">Partial (50-69%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-[oklch(0.556_0_0)]/30" />
            <span className="text-muted-foreground">Skipped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-[oklch(0.7_0.15_50)]" />
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-[oklch(0.97_0_0)]" />
            <span className="text-muted-foreground">No Mission</span>
          </div>
        </div>
      </div>
    </div>
  )
}

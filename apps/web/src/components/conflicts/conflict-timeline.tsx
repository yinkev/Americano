'use client'

import { AlertTriangle, CheckCircle2, Clock, Eye, FileText, Flag, XCircle } from 'lucide-react'
import * as React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChangeType, ConflictHistory, ConflictStatus } from '@/types/conflicts'

interface ConflictTimelineProps {
  /**
   * Array of conflict history events
   */
  history: ConflictHistory[]

  /**
   * Current conflict status
   */
  currentStatus: ConflictStatus

  /**
   * Optional className for styling
   */
  className?: string
}

/**
 * ConflictTimeline Component
 *
 * Timeline visualization of conflict lifecycle showing:
 * - Status changes: DETECTED → REVIEWING → RESOLVED/DISMISSED
 * - Resolution details and evidence
 * - Change history with timestamps
 * - Visual timeline with status indicators
 *
 * Features:
 * - Glassmorphism design (NO gradients, OKLCH colors)
 * - WCAG 2.1 AA accessible color contrast
 * - Min 44px touch targets on interactive elements
 * - Responsive timeline visualization
 *
 * @example
 * ```tsx
 * <ConflictTimeline
 *   history={conflictHistory}
 *   currentStatus="RESOLVED"
 * />
 * ```
 */
export function ConflictTimeline({ history, currentStatus, className }: ConflictTimelineProps) {
  // Sort history by timestamp (oldest first)
  const sortedHistory = React.useMemo(() => {
    return [...history].sort(
      (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    )
  }, [history])

  // Prepare data for Recharts visualization
  const timelineData = React.useMemo(() => {
    return sortedHistory.map((event, index) => {
      const statusValue = getStatusValue(event.newStatus || 'ACTIVE')
      return {
        name: formatEventLabel(event.changeType),
        date: new Date(event.changedAt).toLocaleDateString(),
        time: new Date(event.changedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: statusValue,
        changeType: event.changeType,
        index,
      }
    })
  }, [sortedHistory])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Timeline Chart */}
      <Card className="p-4 bg-white/80 backdrop-blur-md border-border">
        <h3 className="text-sm font-semibold mb-4">Status Progression</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0 0)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
              stroke="oklch(0.75 0 0)"
            />
            <YAxis
              domain={[0, 4]}
              ticks={[0, 1, 2, 3, 4]}
              tick={{ fontSize: 12, fill: 'oklch(0.556 0 0)' }}
              stroke="oklch(0.75 0 0)"
              tickFormatter={(value) => getStatusLabel(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="stepAfter"
              dataKey="status"
              stroke="oklch(0.65 0.18 240)"
              strokeWidth={2}
              dot={{ fill: 'oklch(0.65 0.18 240)', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Event Timeline */}
      <Card className="p-4 bg-white/80 backdrop-blur-md border-border">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Event History
        </h3>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sortedHistory.map((event, index) => (
              <TimelineEvent
                key={event.id}
                event={event}
                isLast={index === sortedHistory.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Current Status Summary */}
      <Card className="p-4 bg-white/80 backdrop-blur-md border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current Status</p>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(currentStatus)}
              <span className="font-semibold">{currentStatus.replace('_', ' ')}</span>
            </div>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </Card>
    </div>
  )
}

/**
 * TimelineEvent Component
 * Individual event in the timeline
 */
function TimelineEvent({ event, isLast }: { event: ConflictHistory; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background shrink-0"
          style={{
            borderColor: getChangeTypeColor(event.changeType),
          }}
        >
          {getChangeTypeIcon(event.changeType)}
        </div>
        {!isLast && <div className="w-0.5 flex-1 mt-2 bg-border" style={{ minHeight: '2rem' }} />}
      </div>

      {/* Event details */}
      <div className="flex-1 pb-4 min-h-[44px] flex flex-col justify-center">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: getChangeTypeColor(event.changeType),
                  color: getChangeTypeColor(event.changeType),
                }}
              >
                {event.changeType.replace('_', ' ')}
              </Badge>
              {event.newStatus && (
                <span className="text-xs text-muted-foreground">
                  → {event.newStatus.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(event.changedAt).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              by {event.changedBy === 'system' ? 'System' : event.changedBy}
            </p>
          </div>
        </div>

        {event.notes && (
          <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{event.notes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Custom Tooltip for Recharts
 */
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  return (
    <div className="rounded-lg border bg-white/95 backdrop-blur-md p-3 shadow-lg">
      <p className="text-sm font-semibold mb-1">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        {data.date} at {data.time}
      </p>
      <p className="text-xs mt-1">Status: {getStatusLabel(data.status)}</p>
    </div>
  )
}

/**
 * StatusBadge Component
 */
function StatusBadge({ status }: { status: ConflictStatus }) {
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: {
      label: 'Active',
      color: 'oklch(0.65 0.18 240)',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      color: 'oklch(0.70 0.15 60)',
    },
    RESOLVED: {
      label: 'Resolved',
      color: 'oklch(0.60 0.15 145)',
    },
    DISMISSED: {
      label: 'Dismissed',
      color: 'oklch(0.60 0.10 220)',
    },
  }

  const { label, color } = config[status] || config.ACTIVE

  return (
    <Badge
      variant="outline"
      style={{
        borderColor: color,
        color: color,
      }}
    >
      {label}
    </Badge>
  )
}

/**
 * Helper Functions
 */

function getStatusValue(status: string): number {
  const statusMap: Record<string, number> = {
    ACTIVE: 1,
    UNDER_REVIEW: 2,
    RESOLVED: 4,
    DISMISSED: 3,
  }
  return statusMap[status] || 0
}

function getStatusLabel(value: number): string {
  const labelMap: Record<number, string> = {
    0: '',
    1: 'Active',
    2: 'Review',
    3: 'Dismissed',
    4: 'Resolved',
  }
  return labelMap[value] || ''
}

function formatEventLabel(changeType: ChangeType): string {
  const labels: Record<ChangeType, string> = {
    DETECTED: 'Detected',
    RESOLVED: 'Resolved',
    REOPENED: 'Reopened',
    DISMISSED: 'Dismissed',
    EVIDENCE_UPDATED: 'Evidence Updated',
    SOURCE_UPDATED: 'Source Updated',
  }
  return labels[changeType] || changeType
}

function getChangeTypeColor(changeType: ChangeType): string {
  const colors: Record<ChangeType, string> = {
    DETECTED: 'oklch(0.65 0.18 240)',
    RESOLVED: 'oklch(0.60 0.15 145)',
    REOPENED: 'oklch(0.65 0.18 40)',
    DISMISSED: 'oklch(0.60 0.10 220)',
    EVIDENCE_UPDATED: 'oklch(0.70 0.15 200)',
    SOURCE_UPDATED: 'oklch(0.70 0.15 280)',
  }
  return colors[changeType] || 'oklch(0.65 0.18 240)'
}

function getChangeTypeIcon(changeType: ChangeType) {
  const size = 'h-5 w-5'
  const color = getChangeTypeColor(changeType)

  const icons: Record<ChangeType, React.ReactNode> = {
    DETECTED: <AlertTriangle className={size} style={{ color }} />,
    RESOLVED: <CheckCircle2 className={size} style={{ color }} />,
    REOPENED: <Flag className={size} style={{ color }} />,
    DISMISSED: <XCircle className={size} style={{ color }} />,
    EVIDENCE_UPDATED: <FileText className={size} style={{ color }} />,
    SOURCE_UPDATED: <Eye className={size} style={{ color }} />,
  }
  return icons[changeType] || <AlertTriangle className={size} style={{ color }} />
}

function getStatusIcon(status: ConflictStatus) {
  const size = 'h-5 w-5'
  const icons: Record<string, React.ReactNode> = {
    ACTIVE: <AlertTriangle className={size} style={{ color: 'oklch(0.65 0.18 240)' }} />,
    UNDER_REVIEW: <Eye className={size} style={{ color: 'oklch(0.70 0.15 60)' }} />,
    RESOLVED: <CheckCircle2 className={size} style={{ color: 'oklch(0.60 0.15 145)' }} />,
    DISMISSED: <XCircle className={size} style={{ color: 'oklch(0.60 0.10 220)' }} />,
  }
  return icons[status] || icons.ACTIVE
}

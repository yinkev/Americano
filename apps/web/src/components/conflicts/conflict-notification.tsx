'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConflictSeverity, ConflictType, Conflict } from '@/types/conflicts'
import { AlertTriangle, Eye, X } from 'lucide-react'

interface ConflictToastProps {
  conflict: Conflict
  onView?: (conflictId: string) => void
  onDismiss?: (conflictId: string) => void
}

/**
 * Severity color mapping for toast notifications
 */
const SEVERITY_COLORS: Record<ConflictSeverity, {
  bg: string
  border: string
  text: string
}> = {
  [ConflictSeverity.LOW]: {
    bg: 'oklch(0.98 0.05 95)',
    border: 'oklch(0.75 0.15 95)',
    text: 'oklch(0.40 0.15 95)',
  },
  [ConflictSeverity.MEDIUM]: {
    bg: 'oklch(0.98 0.05 45)',
    border: 'oklch(0.70 0.18 45)',
    text: 'oklch(0.40 0.18 45)',
  },
  [ConflictSeverity.HIGH]: {
    bg: 'oklch(0.98 0.05 25)',
    border: 'oklch(0.60 0.22 25)',
    text: 'oklch(0.40 0.22 25)',
  },
  [ConflictSeverity.CRITICAL]: {
    bg: 'oklch(0.95 0.08 15)',
    border: 'oklch(0.50 0.25 15)',
    text: 'oklch(0.35 0.25 15)',
  },
}

/**
 * Show conflict detection toast notification
 *
 * @param conflict - The detected conflict
 * @param onView - Optional callback when user clicks "View Details"
 * @param onDismiss - Optional callback when user dismisses notification
 */
export function showConflictToast(
  conflict: Conflict,
  onView?: (conflictId: string) => void,
  onDismiss?: (conflictId: string) => void
) {
  const colors = SEVERITY_COLORS[conflict.severity]
  const isCritical = conflict.severity === ConflictSeverity.CRITICAL

  toast.custom(
    (t) => (
      <div
        className="relative overflow-hidden rounded-lg border-2 shadow-none"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
          minWidth: '320px',
          maxWidth: '480px',
        }}
      >
        {/* Pulsing indicator for critical conflicts */}
        {isCritical && (
          <div
            className="absolute top-0 left-0 h-1 w-full animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        )}

        <div className="flex items-start gap-3 p-4">
          {/* Icon with severity indicator */}
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${colors.border}/0.2`,
            }}
          >
            <AlertTriangle
              className={`h-5 w-5 ${isCritical ? 'animate-pulse' : ''}`}
              style={{ color: colors.border }}
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm" style={{ color: colors.text }}>
                  Conflict Detected
                </p>
                <p className="text-xs text-muted-foreground">
                  {conflict.conceptName}
                </p>
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t)
                  onDismiss?.(conflict.id)
                }}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                {conflict.severity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {conflict.type.replace('_', ' ')}
              </Badge>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: colors.text }}>
              {conflict.explanation.length > 100
                ? `${conflict.explanation.substring(0, 100)}...`
                : conflict.explanation}
            </p>

            {/* Action button */}
            {onView && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.dismiss(t)
                  onView(conflict.id)
                }}
                className="mt-2 h-8 text-xs"
                style={{
                  borderColor: colors.border,
                  color: colors.text,
                }}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    ),
    {
      duration: isCritical ? 10000 : 6000, // Critical conflicts stay longer
      onDismiss: () => onDismiss?.(conflict.id),
      onAutoClose: () => onDismiss?.(conflict.id),
    }
  )
}

/**
 * Batch conflict notification
 * Shows a summary when multiple conflicts are detected
 */
export function showBatchConflictToast(
  conflicts: Conflict[],
  onViewAll?: () => void
) {
  const criticalCount = conflicts.filter(c => c.severity === ConflictSeverity.CRITICAL).length
  const highCount = conflicts.filter(c => c.severity === ConflictSeverity.HIGH).length
  const mediumCount = conflicts.filter(c => c.severity === ConflictSeverity.MEDIUM).length
  const lowCount = conflicts.filter(c => c.severity === ConflictSeverity.LOW).length

  const primaryColor = criticalCount > 0 ? SEVERITY_COLORS[ConflictSeverity.CRITICAL] :
                      highCount > 0 ? SEVERITY_COLORS[ConflictSeverity.HIGH] :
                      mediumCount > 0 ? SEVERITY_COLORS[ConflictSeverity.MEDIUM] :
                      SEVERITY_COLORS[ConflictSeverity.LOW]

  toast.custom(
    (t) => (
      <div
        className="relative overflow-hidden rounded-lg border-2 shadow-none"
        style={{
          borderColor: primaryColor.border,
          backgroundColor: primaryColor.bg,
          minWidth: '320px',
          maxWidth: '480px',
        }}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${primaryColor.border}/0.2`,
            }}
          >
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: primaryColor.border }}
              aria-hidden="true"
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm" style={{ color: primaryColor.text }}>
                {conflicts.length} Conflicts Detected
              </p>
              <button
                onClick={() => toast.dismiss(t)}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Severity breakdown */}
            <div className="flex flex-wrap items-center gap-2">
              {criticalCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: SEVERITY_COLORS[ConflictSeverity.CRITICAL].border,
                    color: SEVERITY_COLORS[ConflictSeverity.CRITICAL].text,
                  }}
                >
                  {criticalCount} Critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: SEVERITY_COLORS[ConflictSeverity.HIGH].border,
                    color: SEVERITY_COLORS[ConflictSeverity.HIGH].text,
                  }}
                >
                  {highCount} High
                </Badge>
              )}
              {mediumCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: SEVERITY_COLORS[ConflictSeverity.MEDIUM].border,
                    color: SEVERITY_COLORS[ConflictSeverity.MEDIUM].text,
                  }}
                >
                  {mediumCount} Medium
                </Badge>
              )}
              {lowCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: SEVERITY_COLORS[ConflictSeverity.LOW].border,
                    color: SEVERITY_COLORS[ConflictSeverity.LOW].text,
                  }}
                >
                  {lowCount} Low
                </Badge>
              )}
            </div>

            <p className="text-sm" style={{ color: primaryColor.text }}>
              Multiple conflicts have been detected in your study materials.
            </p>

            {onViewAll && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.dismiss(t)
                  onViewAll()
                }}
                className="mt-2 h-8 text-xs"
                style={{
                  borderColor: primaryColor.border,
                  color: primaryColor.text,
                }}
              >
                <Eye className="h-3 w-3 mr-1.5" />
                View All Conflicts
              </Button>
            )}
          </div>
        </div>
      </div>
    ),
    {
      duration: 8000,
    }
  )
}

/**
 * Hook for managing conflict notifications
 * Handles notification queue and auto-display
 */
export function useConflictNotifications() {
  const [queue, setQueue] = React.useState<Conflict[]>([])
  const [viewConflictHandler, setViewConflictHandler] = React.useState<
    ((conflictId: string) => void) | undefined
  >()

  React.useEffect(() => {
    if (queue.length > 0) {
      const [current, ...rest] = queue

      showConflictToast(
        current,
        viewConflictHandler,
        () => {
          setQueue(rest)
        }
      )
    }
  }, [queue, viewConflictHandler])

  const showConflict = React.useCallback((conflict: Conflict) => {
    setQueue((prev) => [...prev, conflict])
  }, [])

  const showConflicts = React.useCallback(
    (conflicts: Conflict[], onViewAll?: () => void) => {
      if (conflicts.length === 1) {
        showConflictToast(conflicts[0], viewConflictHandler)
      } else if (conflicts.length > 1) {
        showBatchConflictToast(conflicts, onViewAll)
      }
    },
    [viewConflictHandler]
  )

  const setViewHandler = React.useCallback(
    (handler: (conflictId: string) => void) => {
      setViewConflictHandler(() => handler)
    },
    []
  )

  return {
    showConflict,
    showConflicts,
    setViewHandler,
  }
}

/**
 * ConflictNotificationBadge Component
 * Displays unread conflict count in navigation
 */
interface ConflictNotificationBadgeProps {
  count: number
  onClick?: () => void
  className?: string
}

export function ConflictNotificationBadge({
  count,
  onClick,
  className,
}: ConflictNotificationBadgeProps) {
  if (count === 0) return null

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all ${className}`}
      style={{
        minWidth: '20px',
        minHeight: '20px',
        padding: count > 9 ? '2px 6px' : '2px 4px',
      }}
      aria-label={`${count} unread conflicts`}
      type="button"
    >
      <span className="text-xs font-bold leading-none">
        {count > 99 ? '99+' : count}
      </span>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
      )}
    </button>
  )
}

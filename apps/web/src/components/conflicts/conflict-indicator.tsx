'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ConflictSeverity } from '@/types/conflicts'

interface ConflictIndicatorProps {
  /**
   * Severity level of the conflict
   */
  severity: ConflictSeverity

  /**
   * Number of conflicts detected
   */
  count?: number

  /**
   * Click handler to open conflict detail modal
   */
  onClick: () => void

  /**
   * Additional CSS classes
   */
  className?: string

  /**
   * Show as compact variant (icon only)
   */
  compact?: boolean
}

/**
 * Severity color mapping using OKLCH color space
 * LOW: yellow, MEDIUM: orange, HIGH: red, CRITICAL: dark red
 */
const SEVERITY_COLORS: Record<ConflictSeverity, {
  bg: string
  border: string
  text: string
  glow?: string
}> = {
  [ConflictSeverity.LOW]: {
    bg: 'oklch(0.95 0.12 95)', // Light yellow background
    border: 'oklch(0.75 0.15 95)', // Yellow border
    text: 'oklch(0.40 0.15 95)', // Dark yellow text
  },
  [ConflictSeverity.MEDIUM]: {
    bg: 'oklch(0.95 0.12 45)', // Light orange background
    border: 'oklch(0.70 0.18 45)', // Orange border
    text: 'oklch(0.40 0.18 45)', // Dark orange text
  },
  [ConflictSeverity.HIGH]: {
    bg: 'oklch(0.95 0.12 25)', // Light red background
    border: 'oklch(0.60 0.22 25)', // Red border
    text: 'oklch(0.40 0.22 25)', // Dark red text
  },
  [ConflictSeverity.CRITICAL]: {
    bg: 'oklch(0.92 0.15 15)', // Light dark-red background
    border: 'oklch(0.50 0.25 15)', // Dark red border
    text: 'oklch(0.35 0.25 15)', // Very dark red text
    glow: 'oklch(0.50 0.25 15)', // Glow for pulsing animation
  },
}

/**
 * ConflictIndicator Component
 *
 * Warning badge displaying conflict severity with color coding
 * Accessible with min 44px touch target, WCAG 2.1 AA compliant
 * Glassmorphism design with NO gradients
 *
 * @example
 * ```tsx
 * <ConflictIndicator
 *   severity={ConflictSeverity.HIGH}
 *   count={3}
 *   onClick={() => openConflictModal()}
 * />
 * ```
 */
export function ConflictIndicator({
  severity,
  count = 1,
  onClick,
  className,
  compact = false,
}: ConflictIndicatorProps) {
  const colors = SEVERITY_COLORS[severity]
  const isCritical = severity === ConflictSeverity.CRITICAL

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        // Minimum touch target 44x44px for accessibility
        'min-h-[44px]',
        compact ? 'min-w-[44px] p-2' : 'min-w-[44px] px-3 py-2',
        // Glassmorphism with backdrop blur (NO gradients)
        'bg-card ',
        // Hover effects
        'hover:scale-105 active:scale-95',
        // Focus ring color based on severity
        'focus:ring-ring',
        className
      )}
      style={{
        backgroundColor: colors.bg,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: colors.border,
        color: colors.text,
      }}
      aria-label={`${severity.toLowerCase()} severity conflict, ${count} ${count === 1 ? 'conflict' : 'conflicts'} detected`}
      role="button"
      type="button"
    >
      <div className="relative">
        <AlertTriangle
          className={cn(
            'h-4 w-4',
            isCritical && 'animate-pulse'
          )}
          aria-hidden="true"
        />
        {isCritical && (
          // Pulsing glow effect for critical conflicts
          <div
            className="absolute inset-0 -z-10 animate-pulse rounded-full blur-sm"
            style={{
              backgroundColor: colors.glow,
              opacity: 0.4,
            }}
          />
        )}
      </div>

      {!compact && (
        <>
          <span className="text-xs font-semibold leading-none">
            {severity}
          </span>
          {count > 1 && (
            <Badge
              variant="outline"
              className="h-5 min-w-[20px] border-0 px-1.5 text-[10px] font-bold"
              style={{
                backgroundColor: colors.text,
                color: colors.bg,
              }}
            >
              {count}
            </Badge>
          )}
        </>
      )}

      {compact && count > 1 && (
        <span
          className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
          style={{
            backgroundColor: colors.text,
            color: colors.bg,
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * ConflictIndicatorList Component
 *
 * Displays multiple conflict indicators grouped by severity
 * Useful for showing all conflicts on a content chunk
 */
interface ConflictIndicatorListProps {
  conflicts: Array<{
    id: string
    severity: ConflictSeverity
  }>
  onConflictClick: (conflictId: string) => void
  className?: string
}

export function ConflictIndicatorList({
  conflicts,
  onConflictClick,
  className,
}: ConflictIndicatorListProps) {
  // Group conflicts by severity
  const groupedConflicts = conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.severity]) {
      acc[conflict.severity] = []
    }
    acc[conflict.severity].push(conflict)
    return acc
  }, {} as Record<ConflictSeverity, typeof conflicts>)

  // Sort severities: CRITICAL -> HIGH -> MEDIUM -> LOW
  const severityOrder: ConflictSeverity[] = [
    ConflictSeverity.CRITICAL,
    ConflictSeverity.HIGH,
    ConflictSeverity.MEDIUM,
    ConflictSeverity.LOW,
  ]

  const sortedSeverities = severityOrder.filter(
    (severity) => groupedConflicts[severity]?.length > 0
  )

  if (sortedSeverities.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {sortedSeverities.map((severity) => {
        const severityConflicts = groupedConflicts[severity]
        const firstConflictId = severityConflicts[0].id

        return (
          <ConflictIndicator
            key={severity}
            severity={severity}
            count={severityConflicts.length}
            onClick={() => onConflictClick(firstConflictId)}
          />
        )
      })}
    </div>
  )
}

/**
 * PriorityBadge Component
 * Story 2.3: Task 9 - Priority Visualization UI
 *
 * Visual indicator for priority levels with glassmorphism design
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface PriorityBadgeProps {
  score: number // 0.0-1.0
  showScore?: boolean
  className?: string
}

/**
 * Determine priority level and visual indicator from score
 */
function getPriorityConfig(score: number): {
  level: PriorityLevel
  label: string
  color: string
  bgColor: string
} {
  if (score >= 0.8) {
    return {
      level: 'CRITICAL',
      label: '🔴 CRITICAL',
      color: 'text-rose-700',
      bgColor: 'bg-card border-rose-200',
    }
  } else if (score >= 0.6) {
    return {
      level: 'HIGH',
      label: '🟠 HIGH',
      color: 'text-amber-700',
      bgColor: 'bg-card border-amber-200',
    }
  } else if (score >= 0.4) {
    return {
      level: 'MEDIUM',
      label: '🟡 MEDIUM',
      color: 'text-yellow-700',
      bgColor: 'bg-card border-yellow-200',
    }
  }

  return {
    level: 'LOW',
    label: '🟢 LOW',
    color: 'text-emerald-700',
    bgColor: 'bg-card border-emerald-200',
  }
}

export function PriorityBadge({ score, showScore = false, className }: PriorityBadgeProps) {
  const config = getPriorityConfig(score)

  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full px-3 py-1 text-[13px] font-medium',
        'border',
        config.bgColor,
        config.color,
        'transition-all duration-150',
        'hover:scale-105',
        className,
      )}
      title={`Priority Score: ${(score * 100).toFixed(0)}%`}
    >
      {config.label}
      {showScore && (
        <span className="ml-1.5 text-[11px] opacity-75">({(score * 100).toFixed(0)}%)</span>
      )}
    </Badge>
  )
}

/**
 * Compact version for tight spaces
 */
export function PriorityDot({ score, className }: { score: number; className?: string }) {
  const config = getPriorityConfig(score)

  const dotColors: Record<PriorityLevel, string> = {
    CRITICAL: 'bg-rose-500',
    HIGH: 'bg-amber-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-emerald-500',
  }

  return (
    <div
      className={cn('w-2 h-2 rounded-full', dotColors[config.level], 'shadow-none', className)}
      title={`${config.label} - ${(score * 100).toFixed(0)}%`}
    />
  )
}

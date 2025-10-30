'use client'

import {
  AlertTriangle,
  Calendar,
  FileText,
  Loader2,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import * as React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface StatementChange {
  timestamp: string
  sourceType: 'A' | 'B'
  oldContent: string
  newContent: string
  changeType: 'CONTENT_UPDATED' | 'SOURCE_UPDATED' | 'EVIDENCE_ADDED'
  diff: {
    added: string[]
    removed: string[]
    unchanged: string[]
  }
}

interface ConflictEvolutionProps {
  /**
   * Conflict ID
   */
  conflictId: string

  /**
   * Array of statement changes over time
   */
  changes: StatementChange[]

  /**
   * Last scan timestamp
   */
  lastScannedAt?: string

  /**
   * Whether re-scan is needed (source updated)
   */
  needsRescan?: boolean

  /**
   * Callback to trigger manual re-scan
   */
  onRescan?: (conflictId: string) => Promise<void>

  /**
   * Optional className
   */
  className?: string
}

/**
 * ConflictEvolution Component
 *
 * Shows how a conflict has changed over time:
 * - Visual diff of statement changes
 * - Re-scan indicators when source content updated
 * - Auto-rescan trigger button
 * - Timeline of content evolution
 *
 * Features:
 * - Glassmorphism design with OKLCH colors
 * - Visual diff highlighting (added, removed, unchanged)
 * - WCAG 2.1 AA accessible color contrast
 * - Min 44px touch targets
 *
 * @example
 * ```tsx
 * <ConflictEvolution
 *   conflictId="conflict_123"
 *   changes={statementChanges}
 *   lastScannedAt="2025-10-16T10:00:00Z"
 *   needsRescan={true}
 *   onRescan={handleRescan}
 * />
 * ```
 */
export function ConflictEvolution({
  conflictId,
  changes,
  lastScannedAt,
  needsRescan = false,
  onRescan,
  className,
}: ConflictEvolutionProps) {
  const [rescanning, setRescanning] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleRescan = async () => {
    if (!onRescan) return

    setRescanning(true)
    setError(null)

    try {
      await onRescan(conflictId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rescan conflict')
    } finally {
      setRescanning(false)
    }
  }

  // Calculate evolution trend
  const trend = React.useMemo(() => {
    if (changes.length < 2) return 'stable'

    const recentChanges = changes.slice(-3)
    const hasSignificantChanges = recentChanges.some(
      (change) => change.diff.added.length > 0 || change.diff.removed.length > 0,
    )

    return hasSignificantChanges ? 'evolving' : 'stable'
  }, [changes])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Re-scan Alert */}
      {needsRescan && (
        <Alert className="bg-amber-50/80 backdrop-blur-md border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span className="text-amber-900">
              Source content has been updated. Re-scan recommended to detect new conflicts.
            </span>
            {onRescan && (
              <Button
                size="sm"
                onClick={handleRescan}
                disabled={rescanning}
                className="min-h-[44px] shrink-0"
              >
                {rescanning ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Re-scan Now
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Evolution Summary */}
      <Card className="p-4 bg-white/80 backdrop-blur-md border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Conflict Evolution</h3>
            <EvolutionBadge trend={trend} />
          </div>
          {lastScannedAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Last scanned: {new Date(lastScannedAt).toLocaleString()}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Changes"
            value={changes.length}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            label="Additions"
            value={changes.reduce((sum, c) => sum + c.diff.added.length, 0)}
            icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            trend="up"
          />
          <StatCard
            label="Removals"
            value={changes.reduce((sum, c) => sum + c.diff.removed.length, 0)}
            icon={<TrendingDown className="h-4 w-4 text-red-600" />}
            trend="down"
          />
        </div>
      </Card>

      {/* Change History */}
      <Card className="p-4 bg-white/80 backdrop-blur-md border-border">
        <h3 className="text-sm font-semibold mb-4">Change History</h3>
        <div className="space-y-4">
          {changes.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No changes recorded yet
            </div>
          ) : (
            changes.map((change, index) => <ChangeItem key={index} change={change} />)
          )}
        </div>
      </Card>
    </div>
  )
}

/**
 * EvolutionBadge Component
 */
function EvolutionBadge({ trend }: { trend: 'evolving' | 'stable' }) {
  const config = {
    evolving: {
      label: 'Evolving',
      color: 'oklch(0.65 0.18 40)',
      icon: TrendingUp,
    },
    stable: {
      label: 'Stable',
      color: 'oklch(0.60 0.15 145)',
      icon: Minus,
    },
  }

  const { label, color, icon: Icon } = config[trend]

  return (
    <Badge
      variant="outline"
      className="text-xs"
      style={{
        borderColor: color,
        color: color,
      }}
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}

/**
 * StatCard Component
 */
function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string
  value: number
  icon: React.ReactNode
  trend?: 'up' | 'down'
}) {
  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

/**
 * ChangeItem Component
 */
function ChangeItem({ change }: { change: StatementChange }) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: getChangeTypeColor(change.changeType),
                color: getChangeTypeColor(change.changeType),
              }}
            >
              {change.changeType.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Source {change.sourceType}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(change.timestamp).toLocaleString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="min-h-[44px]"
        >
          {expanded ? 'Hide' : 'Show'} Diff
        </Button>
      </div>

      {expanded && (
        <>
          <Separator className="my-3" />
          <div className="space-y-3">
            {/* Removed content */}
            {change.diff.removed.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-red-700">Removed:</p>
                {change.diff.removed.map((text, idx) => (
                  <div key={idx} className="rounded-md bg-red-50 border border-red-200 p-2 text-sm">
                    <span className="line-through text-red-700">{text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Added content */}
            {change.diff.added.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-green-700">Added:</p>
                {change.diff.added.map((text, idx) => (
                  <div
                    key={idx}
                    className="rounded-md bg-green-50 border border-green-200 p-2 text-sm"
                  >
                    <span className="text-green-700">{text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Unchanged content (collapsed by default) */}
            {change.diff.unchanged.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">
                  {change.diff.unchanged.length} unchanged segments
                </summary>
                <div className="mt-2 space-y-1">
                  {change.diff.unchanged.map((text, idx) => (
                    <p key={idx} className="ml-4">
                      {text}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Helper Functions
 */

function getChangeTypeColor(changeType: string): string {
  const colors: Record<string, string> = {
    CONTENT_UPDATED: 'oklch(0.65 0.18 240)',
    SOURCE_UPDATED: 'oklch(0.70 0.15 200)',
    EVIDENCE_ADDED: 'oklch(0.60 0.15 145)',
  }
  return colors[changeType] || 'oklch(0.65 0.18 240)'
}

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ConflictComparisonView } from './conflict-comparison-view'
import { ConflictTimeline } from './conflict-timeline'
import { ConflictEvolution } from './conflict-evolution'
import {
  Conflict,
  ConflictResolution,
  ConflictAnalysis,
  ConflictStatus,
  Source,
  ConflictHistory,
} from '@/types/conflicts'
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  Lightbulb,
  History,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConflictDetailModalProps {
  /**
   * Conflict ID to display
   */
  conflictId: string

  /**
   * Whether the modal is open
   */
  isOpen: boolean

  /**
   * Close handler
   */
  onClose: () => void

  /**
   * Optional callback when user flags conflict
   */
  onFlag?: (conflictId: string, notes?: string) => Promise<void>

  /**
   * Optional callback when user resolves conflict
   */
  onResolve?: (conflictId: string, preferredSourceId: string, evidence?: string) => Promise<void>

  /**
   * Optional callback when user dismisses conflict
   */
  onDismiss?: (conflictId: string, reason?: string) => Promise<void>
}

/**
 * ConflictDetailModal Component
 *
 * Full-screen modal for detailed conflict analysis and resolution
 * Features:
 * - Side-by-side source comparison (ConflictComparisonView)
 * - Source credibility scores and EBM levels
 * - AI-powered resolution suggestions
 * - Resolution status and history
 * - User actions: Flag, Resolve, Dismiss
 *
 * Uses Radix Dialog for accessibility (WCAG 2.1 AA compliant)
 * Responsive design with mobile-first approach
 *
 * @example
 * ```tsx
 * <ConflictDetailModal
 *   conflictId="conflict_123"
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onFlag={handleFlag}
 *   onResolve={handleResolve}
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export function ConflictDetailModal({
  conflictId,
  isOpen,
  onClose,
  onFlag,
  onResolve,
  onDismiss,
}: ConflictDetailModalProps) {
  const [conflict, setConflict] = React.useState<Conflict | null>(null)
  const [sourceAMeta, setSourceAMeta] = React.useState<Source | null>(null)
  const [sourceBMeta, setSourceBMeta] = React.useState<Source | null>(null)
  const [analysis, setAnalysis] = React.useState<ConflictAnalysis | null>(null)
  const [history, setHistory] = React.useState<ConflictHistory[]>([])
  const [loading, setLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState<'flag' | 'resolve' | 'dismiss' | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch conflict data when modal opens
  React.useEffect(() => {
    if (isOpen && conflictId) {
      fetchConflictData()
    }
  }, [isOpen, conflictId])

  const fetchConflictData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch conflict details
      const response = await fetch(`/api/conflicts/${conflictId}`)
      if (!response.ok) {
        throw new Error('Failed to load conflict details')
      }

      const data = await response.json()
      setConflict(data.conflict)
      setSourceAMeta(data.sourceAMeta)
      setSourceBMeta(data.sourceBMeta)
      setAnalysis(data.analysis)
      setHistory(data.history || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFlag = async () => {
    if (!conflict || !onFlag) return

    setActionLoading('flag')
    try {
      await onFlag(conflict.id)
      await fetchConflictData() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flag conflict')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResolve = async () => {
    if (!conflict || !analysis || !onResolve) return

    setActionLoading('resolve')
    try {
      await onResolve(
        conflict.id,
        analysis.resolutionSuggestion.preferredSourceId,
        analysis.clinicalImplications
      )
      await fetchConflictData() // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conflict')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async () => {
    if (!conflict || !onDismiss) return

    setActionLoading('dismiss')
    try {
      await onDismiss(conflict.id, 'User dismissed as false positive')
      onClose() // Close modal after dismissing
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss conflict')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle className="text-xl">Conflict Details</DialogTitle>
              {conflict && (
                <DialogDescription>
                  {conflict.conceptName} - {conflict.type.replace('_', ' ')}
                </DialogDescription>
              )}
            </div>
            {conflict && (
              <div className="flex items-center gap-2">
                <StatusBadge status={conflict.status} />
                <SeverityBadge severity={conflict.severity} />
              </div>
            )}
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : conflict && sourceAMeta && sourceBMeta ? (
          <Tabs defaultValue="comparison" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="comparison" className="min-h-[44px]">Comparison</TabsTrigger>
              <TabsTrigger value="analysis" className="min-h-[44px]">AI Analysis</TabsTrigger>
              <TabsTrigger value="history" className="min-h-[44px]">History</TabsTrigger>
              <TabsTrigger value="evolution" className="min-h-[44px]">Evolution</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="mt-4">
              {/* Conflict explanation */}
              <Alert className="mb-4 bg-white/80 backdrop-blur-md">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>{conflict.explanation}</AlertDescription>
              </Alert>

              {/* Side-by-side comparison */}
              <ConflictComparisonView
                sourceA={conflict.sourceA}
                sourceB={conflict.sourceB}
                sourceAMeta={sourceAMeta}
                sourceBMeta={sourceBMeta}
                similarityScore={conflict.similarityScore}
                contradictionPattern={conflict.contradictionPattern}
                conflictType={conflict.type}
              />
            </TabsContent>

            <TabsContent value="analysis" className="mt-4">
              {analysis ? (
                <AnalysisPanel analysis={analysis} />
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>AI analysis not available for this conflict.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <ConflictTimeline
                history={history}
                currentStatus={conflict.status}
              />
            </TabsContent>

            <TabsContent value="evolution" className="mt-4">
              <ConflictEvolution
                conflictId={conflict.id}
                changes={[]} // Would be populated from API
                lastScannedAt={conflict.detectedAt}
                needsRescan={false} // Would be calculated from source updates
                onRescan={async (id) => {
                  // Trigger re-scan API call
                  console.log('Re-scanning conflict:', id)
                }}
              />
            </TabsContent>
          </Tabs>
        ) : null}

        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            {conflict?.status === ConflictStatus.PENDING && (
              <Button
                variant="outline"
                onClick={handleDismiss}
                disabled={actionLoading !== null}
                className="min-h-[44px]"
              >
                {actionLoading === 'dismiss' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Dismiss
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onFlag && conflict?.status !== ConflictStatus.FLAGGED && (
              <Button
                variant="outline"
                onClick={handleFlag}
                disabled={actionLoading !== null}
                className="min-h-[44px]"
              >
                {actionLoading === 'flag' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Flag className="h-4 w-4 mr-2" />
                )}
                Flag for Review
              </Button>
            )}

            {onResolve && conflict?.status !== ConflictStatus.RESOLVED && (
              <Button
                onClick={handleResolve}
                disabled={actionLoading !== null || !analysis}
                className="min-h-[44px]"
              >
                {actionLoading === 'resolve' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Accept Resolution
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * StatusBadge Component
 */
function StatusBadge({ status }: { status: ConflictStatus }) {
  const config: Record<ConflictStatus, { label: string; color: string }> = {
    [ConflictStatus.PENDING]: {
      label: 'Pending',
      color: 'oklch(0.70 0.15 60)',
    },
    [ConflictStatus.UNDER_REVIEW]: {
      label: 'Under Review',
      color: 'oklch(0.65 0.18 240)',
    },
    [ConflictStatus.RESOLVED]: {
      label: 'Resolved',
      color: 'oklch(0.60 0.15 145)',
    },
    [ConflictStatus.DISMISSED]: {
      label: 'Dismissed',
      color: 'oklch(0.60 0.10 220)',
    },
    [ConflictStatus.FLAGGED]: {
      label: 'Flagged',
      color: 'oklch(0.65 0.18 40)',
    },
  }

  const { label, color } = config[status]

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
 * SeverityBadge Component
 */
function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant="outline" className="text-xs">
      {severity}
    </Badge>
  )
}

/**
 * LoadingSkeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-60 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    </div>
  )
}

/**
 * AnalysisPanel Component
 */
function AnalysisPanel({ analysis }: { analysis: ConflictAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Medical context */}
      <div className="rounded-lg border bg-white/80 backdrop-blur-md p-4">
        <h3 className="mb-2 font-semibold text-sm">Medical Context</h3>
        <p className="text-sm text-muted-foreground">{analysis.medicalContext}</p>
      </div>

      {/* Key differences */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Key Differences</h3>
        {analysis.keyDifferences.map((diff, index) => (
          <div key={index} className="rounded-lg border bg-white/80 backdrop-blur-md p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-sm">{diff.aspect}</span>
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: diff.significance === 'CRITICAL' ? 'oklch(0.60 0.22 25)' :
                              diff.significance === 'HIGH' ? 'oklch(0.65 0.18 40)' :
                              diff.significance === 'MEDIUM' ? 'oklch(0.70 0.15 60)' :
                              'oklch(0.75 0.12 85)',
                }}
              >
                {diff.significance}
              </Badge>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Source A:</p>
                <p className="text-sm">{diff.sourceA}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Source B:</p>
                <p className="text-sm">{diff.sourceB}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI resolution suggestion */}
      <div className="rounded-lg border-2 bg-white/80 backdrop-blur-md p-4"
           style={{ borderColor: 'oklch(0.65 0.18 240)' }}>
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-5 w-5" style={{ color: 'oklch(0.65 0.18 240)' }} />
          <h3 className="font-semibold">AI Resolution Suggestion</h3>
          <Badge
            variant="outline"
            className="ml-auto"
            style={{ borderColor: 'oklch(0.65 0.18 240)' }}
          >
            {(analysis.resolutionSuggestion.confidence * 100).toFixed(0)}% Confidence
          </Badge>
        </div>
        <p className="mb-3 text-sm">{analysis.resolutionSuggestion.reasoning}</p>
        <Separator className="my-3" />
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Contributing Factors:</p>
          <ul className="list-inside list-disc space-y-1">
            {analysis.resolutionSuggestion.factors.map((factor, index) => (
              <li key={index} className="text-sm">{factor}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clinical implications */}
      <Alert className="bg-white/80 backdrop-blur-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Clinical Implications:</strong> {analysis.clinicalImplications}
        </AlertDescription>
      </Alert>

      {/* Recommended action */}
      <div className="rounded-lg border bg-white/80 backdrop-blur-md p-4">
        <h3 className="mb-2 font-semibold text-sm">Recommended Action</h3>
        <p className="text-sm text-muted-foreground">{analysis.recommendedAction}</p>
      </div>
    </div>
  )
}

/**
 * HistoryPanel Component
 */
function HistoryPanel({ conflict }: { conflict: Conflict }) {
  const events = [
    {
      timestamp: conflict.detectedAt,
      type: 'DETECTED',
      description: 'Conflict automatically detected',
    },
  ]

  if (conflict.flaggedByUser) {
    events.push({
      timestamp: conflict.detectedAt, // Would be flaggedAt in real implementation
      type: 'FLAGGED',
      description: `Flagged by ${conflict.flaggedByUser}`,
    })
  }

  if (conflict.resolution) {
    events.push({
      timestamp: conflict.resolution.resolvedAt,
      type: 'RESOLVED',
      description: `Resolved by ${conflict.resolution.resolvedBy}`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Conflict Timeline</h3>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="flex gap-4">
            <div className="relative flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background"
                style={{
                  borderColor: event.type === 'RESOLVED' ? 'oklch(0.60 0.15 145)' :
                              event.type === 'FLAGGED' ? 'oklch(0.65 0.18 40)' :
                              'oklch(0.65 0.18 240)',
                }}
              >
                {event.type === 'RESOLVED' ? (
                  <CheckCircle2 className="h-4 w-4" style={{ color: 'oklch(0.60 0.15 145)' }} />
                ) : event.type === 'FLAGGED' ? (
                  <Flag className="h-4 w-4" style={{ color: 'oklch(0.65 0.18 40)' }} />
                ) : (
                  <AlertTriangle className="h-4 w-4" style={{ color: 'oklch(0.65 0.18 240)' }} />
                )}
              </div>
              {index < events.length - 1 && (
                <div className="h-full w-0.5 bg-border" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="font-medium text-sm">{event.description}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {conflict.resolution && (
        <div className="rounded-lg border bg-white/80 backdrop-blur-md p-4 mt-4">
          <h4 className="mb-2 font-semibold text-sm">Resolution Details</h4>
          <p className="text-sm mb-2">{conflict.resolution.reasoning}</p>
          {conflict.resolution.evidence && (
            <>
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">{conflict.resolution.evidence}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

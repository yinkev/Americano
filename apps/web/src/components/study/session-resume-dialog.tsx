'use client'

import { AlertTriangle, Clock, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SessionSnapshot } from '@/store/use-session-store'

interface SessionResumeDialogProps {
  open: boolean
  snapshot: SessionSnapshot | null
  currentObjectiveName?: string
  hasTimeout: boolean
  onResume: () => void
  onStartFresh: () => void
  onCancel: () => void
}

/**
 * Session Resume Dialog (Story 2.5 Task 9)
 *
 * Displays a preview of paused session state and allows user to:
 * - Resume where they left off with exact state restoration
 * - Start fresh if session is stale or timeout occurred
 * - See context about what they were working on
 */
export function SessionResumeDialog({
  open,
  snapshot,
  currentObjectiveName,
  hasTimeout,
  onResume,
  onStartFresh,
  onCancel,
}: SessionResumeDialogProps) {
  const [resuming, setResuming] = useState(false)
  const [startingFresh, setStartingFresh] = useState(false)

  if (!snapshot) return null

  const handleResume = async () => {
    setResuming(true)
    try {
      await onResume()
    } finally {
      setResuming(false)
    }
  }

  const handleStartFresh = async () => {
    setStartingFresh(true)
    try {
      await onStartFresh()
    } finally {
      setStartingFresh(false)
    }
  }

  // Calculate pause duration
  const pauseDurationMs = Date.now() - snapshot.pausedAt
  const pauseDurationHours = Math.floor(pauseDurationMs / (1000 * 60 * 60))
  const pauseDurationMinutes = Math.floor((pauseDurationMs % (1000 * 60 * 60)) / (1000 * 60))

  // Format pause duration
  let pauseDurationText = ''
  if (pauseDurationHours > 0) {
    pauseDurationText = `${pauseDurationHours}h ${pauseDurationMinutes}m ago`
  } else if (pauseDurationMinutes > 0) {
    pauseDurationText = `${pauseDurationMinutes}m ago`
  } else {
    pauseDurationText = 'Just now'
  }

  // Study phase display names (Story 4.1 Task 6: Added comprehension phase)
  const phaseDisplayNames = {
    content: 'Reading Content',
    comprehension: 'Understanding Validation',
    cards: 'Reviewing Cards',
    assessment: 'Self-Assessment',
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasTimeout ? (
              <>
                <AlertTriangle className="w-5 h-5" style={{ color: 'oklch(0.65 0.15 80)' }} />
                Session Timeout
              </>
            ) : (
              <>
                <Clock className="w-5 h-5" style={{ color: 'oklch(0.55 0.2 250)' }} />
                Resume Your Session
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasTimeout
              ? 'Your session was paused for more than 24 hours. You can resume or start fresh.'
              : 'Continue where you left off or start a new session.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Session Context Preview */}
          <div
            className="rounded-xl p-4 backdrop-blur-md space-y-3"
            style={{
              background: 'oklch(0.98 0.01 250 / 0.9)',
              border: '1px solid oklch(0.9 0.01 250)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Paused:
              </span>
              <span className="text-sm" style={{ color: 'oklch(0.5 0.1 250)' }}>
                {pauseDurationText}
              </span>
            </div>

            {currentObjectiveName && (
              <div className="space-y-1">
                <span className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Current Objective:
                </span>
                <p className="text-sm" style={{ color: 'oklch(0.3 0.15 250)' }}>
                  {currentObjectiveName}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                Phase:
              </span>
              <Badge variant="outline" className="text-xs">
                {phaseDisplayNames[snapshot.studyPhase]}
              </Badge>
            </div>

            {/* Additional context */}
            <div className="pt-2 border-t" style={{ borderColor: 'oklch(0.9 0.01 250)' }}>
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: 'oklch(0.5 0.1 250)' }}
              >
                {snapshot.studyPhase === 'content' && snapshot.contentScrollPosition > 0 && (
                  <span>Scroll position saved</span>
                )}
                {snapshot.studyPhase === 'cards' && snapshot.cardQueuePosition > 0 && (
                  <span>Card {snapshot.cardQueuePosition + 1} in queue</span>
                )}
                {snapshot.objectiveTimerState.startedAt && (
                  <>
                    <span>•</span>
                    <span>
                      Timer: {Math.floor(snapshot.objectiveTimerState.pausedTime / 1000 / 60)}m
                      elapsed
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Timeout Warning */}
          {hasTimeout && (
            <div
              className="rounded-xl p-4 backdrop-blur-md flex items-start gap-3"
              style={{
                background: 'oklch(0.95 0.05 80 / 0.3)',
                border: '1px solid oklch(0.65 0.15 80 / 0.3)',
              }}
            >
              <AlertTriangle
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: 'oklch(0.65 0.15 80)' }}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
                  Session has been inactive for over 24 hours
                </p>
                <p className="text-xs" style={{ color: 'oklch(0.5 0.1 250)' }}>
                  Your progress is preserved, but you may want to review the material before
                  continuing.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleStartFresh}
            disabled={resuming || startingFresh}
            className="min-h-[44px]"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {startingFresh ? 'Starting...' : 'Start Fresh'}
          </Button>
          <Button
            onClick={handleResume}
            disabled={resuming || startingFresh}
            className="min-h-[44px]"
            style={{
              background: 'oklch(0.55 0.2 250)',
              color: 'oklch(1 0 0)',
            }}
          >
            <Play className="mr-2 h-4 w-4" />
            {resuming ? 'Resuming...' : 'Resume Where I Left Off'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

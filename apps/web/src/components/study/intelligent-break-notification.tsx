/**
 * Intelligent Break Notification System
 * Story 5.3 Task 3: Intelligent break prompts and notifications
 *
 * Provides contextual break recommendations based on performance trends,
 * fatigue levels, and schedule. Supports different break types with
 * postpone/skip options and effectiveness tracking.
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Coffee,
  Brain,
  Battery,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  SkipForward,
  Timer,
  Zap,
} from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  type BreakRecommendation,
  realtimeOrchestrationService,
} from '@/services/realtime-orchestration'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface IntelligentBreakNotificationProps {
  open: boolean
  recommendation: BreakRecommendation | null
  onTakeBreak: (duration: number) => void
  onSkipBreak: () => void
  onPostponeBreak: (minutes: number) => void
  sessionProgress?: {
    objectivesCompleted: number
    totalObjectives: number
    sessionDuration: number // minutes
  }
}

interface BreakEffectiveness {
  preBreakPerformance: number
  postBreakPerformance: number
  recoveryScore: number
  breakDuration: number
  timestamp: Date
}

export function IntelligentBreakNotification({
  open,
  recommendation,
  onTakeBreak,
  onSkipBreak,
  onPostponeBreak,
  sessionProgress,
}: IntelligentBreakNotificationProps) {
  const [countdown, setCountdown] = useState(0)
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [postponeMinutes, setPostponeMinutes] = useState(5)
  const [autoBreakEnabled, setAutoBreakEnabled] = useState(false)
  const [breakEffectiveness, setBreakEffectiveness] = useState<BreakEffectiveness | null>(null)

  // Auto-countdown for urgent breaks
  useEffect(() => {
    if (open && recommendation?.urgency === 'high' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [open, recommendation?.urgency, countdown])

  // Start countdown for urgent breaks
  useEffect(() => {
    if (open && recommendation?.urgency === 'high') {
      setCountdown(30) // 30 second countdown for urgent breaks
    } else {
      setCountdown(0)
    }
  }, [open, recommendation?.urgency])

  const handleTakeBreak = () => {
    if (!recommendation) return

    // Record pre-break performance
    const currentMetrics = realtimeOrchestrationService.getCurrentPerformanceMetrics()
    const preBreakPerf = currentMetrics.accuracy

    // Take the break with selected duration
    onTakeBreak(selectedDuration)

    // Set up post-break performance tracking
    setTimeout(
      () => {
        const postBreakMetrics = realtimeOrchestrationService.getCurrentPerformanceMetrics()
        const postBreakPerf = postBreakMetrics.accuracy
        const recoveryScore = Math.max(0, postBreakPerf - preBreakPerf)

        setBreakEffectiveness({
          preBreakPerformance: preBreakPerf,
          postBreakPerformance: postBreakPerf,
          recoveryScore,
          breakDuration: selectedDuration,
          timestamp: new Date(),
        })

        // Show effectiveness toast
        if (recoveryScore > 10) {
          toast.success(`Effective break! ${Math.round(recoveryScore)}% performance improvement`)
        }
      },
      selectedDuration * 60 * 1000,
    ) // Check after break duration

    toast.success(`Taking ${selectedDuration}-minute break: ${recommendation.reason}`)
  }

  const handleSkipBreak = () => {
    onSkipBreak()
    toast.info('Break skipped - continuing session')
  }

  const handlePostponeBreak = () => {
    onPostponeBreak(postponeMinutes)
    toast.info(`Break postponed by ${postponeMinutes} minutes`)
  }

  const getBreakIcon = (type: BreakRecommendation['type']) => {
    switch (type) {
      case 'performance_drop':
        return <TrendingDown className="h-6 w-6 text-red-500" />
      case 'fatigue_detected':
        return <Battery className="h-6 w-6 text-orange-500" />
      case 'objectives_completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      default:
        return <Coffee className="h-6 w-6 text-blue-500" />
    }
  }

  const getUrgencyColor = (urgency: BreakRecommendation['urgency']) => {
    switch (urgency) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getBreakTitle = (type: BreakRecommendation['type']) => {
    switch (type) {
      case 'performance_drop':
        return 'Performance-Based Break Recommended'
      case 'fatigue_detected':
        return 'Fatigue Break Needed'
      case 'objectives_completed':
        return 'Milestone Break Suggested'
      default:
        return 'Scheduled Break Time'
    }
  }

  if (!recommendation) return null

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              {getBreakIcon(recommendation.type)}
              <div className="flex-1">
                <DialogTitle className="text-lg">{getBreakTitle(recommendation.type)}</DialogTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1',
                    recommendation.urgency === 'high'
                      ? 'border-red-600 text-red-600 bg-red-50'
                      : recommendation.urgency === 'medium'
                        ? 'border-orange-600 text-orange-600 bg-orange-50'
                        : 'border-blue-600 text-blue-600 bg-blue-50',
                  )}
                >
                  {recommendation.urgency.toUpperCase()} PRIORITY
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-base leading-relaxed">
              {recommendation.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Break Details */}
            <Card className={cn('border-2', getUrgencyColor(recommendation.urgency))}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recommended Duration</span>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {recommendation.estimatedBreakDuration} minutes
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Can Postpone</span>
                  <span
                    className={cn(
                      'text-sm',
                      recommendation.canPostpone ? 'text-green-600' : 'text-gray-400',
                    )}
                  >
                    {recommendation.canPostpone ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Can Skip</span>
                  <span
                    className={cn(
                      'text-sm',
                      recommendation.canSkip ? 'text-green-600' : 'text-gray-400',
                    )}
                  >
                    {recommendation.canSkip ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Reason:</strong> {recommendation.reason}
                </div>
              </CardContent>
            </Card>

            {/* Session Progress Context */}
            {sessionProgress && (
              <Card className="border border-gray-200">
                <CardContent className="p-4 space-y-2">
                  <div className="text-sm font-medium">Session Progress</div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Objectives</span>
                    <span>
                      {sessionProgress.objectivesCompleted}/{sessionProgress.totalObjectives}
                    </span>
                  </div>
                  <Progress
                    value={
                      (sessionProgress.objectivesCompleted / sessionProgress.totalObjectives) * 100
                    }
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span>Duration</span>
                    <span>{sessionProgress.sessionDuration} minutes</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Break Duration Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Break Duration</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 10, 15].map((duration) => (
                  <Button
                    key={duration}
                    variant={selectedDuration === duration ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDuration(duration)}
                    className="h-8"
                  >
                    {duration}m
                  </Button>
                ))}
              </div>
            </div>

            {/* Postpone Options */}
            {recommendation.canPostpone && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Postpone Break By</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((minutes) => (
                    <Button
                      key={minutes}
                      variant={postponeMinutes === minutes ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostponeMinutes(minutes)}
                      className="h-8"
                    >
                      {minutes}m
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-break Settings */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <Label htmlFor="auto-break" className="text-sm font-medium">
                  Auto-break for high urgency
                </Label>
              </div>
              <Switch
                id="auto-break"
                checked={autoBreakEnabled}
                onCheckedChange={setAutoBreakEnabled}
              />
            </div>

            {/* Countdown for urgent breaks */}
            {recommendation.urgency === 'high' && countdown > 0 && (
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm font-medium text-red-700 mb-1">
                  Auto-break in {countdown} seconds
                </div>
                <Progress value={((30 - countdown) / 30) * 100} className="h-2" />
              </div>
            )}

            {/* Previous Break Effectiveness */}
            {breakEffectiveness && (
              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Last Break Effectiveness</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Performance Recovery:</span>
                      <span className="font-medium text-green-600">
                        +{Math.round(breakEffectiveness.recoveryScore)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break Duration:</span>
                      <span>{breakEffectiveness.breakDuration} minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {/* Skip Button */}
            {recommendation.canSkip && (
              <Button variant="outline" onClick={handleSkipBreak} className="flex-1">
                <SkipForward className="h-4 w-4 mr-2" />
                Skip Break
              </Button>
            )}

            {/* Postpone Button */}
            {recommendation.canPostpone && (
              <Button variant="outline" onClick={handlePostponeBreak} className="flex-1">
                <Timer className="h-4 w-4 mr-2" />
                Postpone {postponeMinutes}m
              </Button>
            )}

            {/* Take Break Button */}
            <Button
              onClick={handleTakeBreak}
              className={cn(
                'flex-1',
                recommendation.urgency === 'high'
                  ? 'bg-red-600 hover:bg-red-700'
                  : recommendation.urgency === 'medium'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700',
              )}
            >
              <Coffee className="h-4 w-4 mr-2" />
              Take {selectedDuration}m Break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-break countdown toast for urgent breaks */}
      {recommendation.urgency === 'high' &&
        countdown > 0 &&
        countdown <= 10 &&
        autoBreakEnabled && (
          <div className="fixed top-4 right-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <div className="font-medium">Urgent Break Recommended</div>
                <div className="text-sm opacity-90">Auto-break in {countdown} seconds</div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCountdown(0)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
    </>
  )
}

// Break effectiveness tracker utility
export class BreakEffectivenessTracker {
  private static instance: BreakEffectivenessTracker
  private breakHistory: Map<string, BreakEffectiveness[]> = new Map()

  static getInstance(): BreakEffectivenessTracker {
    if (!BreakEffectivenessTracker.instance) {
      BreakEffectivenessTracker.instance = new BreakEffectivenessTracker()
    }
    return BreakEffectivenessTracker.instance
  }

  recordBreakEffectiveness(
    sessionId: string,
    preBreakPerf: number,
    postBreakPerf: number,
    breakDuration: number,
  ): void {
    const effectiveness: BreakEffectiveness = {
      preBreakPerformance: preBreakPerf,
      postBreakPerformance: postBreakPerf,
      recoveryScore: Math.max(0, postBreakPerf - preBreakPerf),
      breakDuration,
      timestamp: new Date(),
    }

    if (!this.breakHistory.has(sessionId)) {
      this.breakHistory.set(sessionId, [])
    }

    const sessionHistory = this.breakHistory.get(sessionId)!
    sessionHistory.push(effectiveness)

    // Keep only last 10 breaks per session
    if (sessionHistory.length > 10) {
      sessionHistory.shift()
    }
  }

  getOptimalBreakDuration(sessionId: string): number {
    const sessionHistory = this.breakHistory.get(sessionId) || []
    if (sessionHistory.length === 0) return 5 // Default 5 minutes

    // Find most effective break duration
    const effectivenessByDuration = new Map<number, number>()

    sessionHistory.forEach((break_) => {
      const current = effectivenessByDuration.get(break_.breakDuration) || 0
      effectivenessByDuration.set(break_.breakDuration, current + break_.recoveryScore)
    })

    let bestDuration = 5
    let bestScore = 0

    effectivenessByDuration.forEach((score, duration) => {
      const avgScore = score / sessionHistory.filter((b) => b.breakDuration === duration).length
      if (avgScore > bestScore) {
        bestScore = avgScore
        bestDuration = duration
      }
    })

    return bestDuration
  }

  getSessionBreakSummary(sessionId: string): {
    totalBreaks: number
    averageRecovery: number
    optimalDuration: number
    effectivenessTrend: 'improving' | 'stable' | 'declining'
  } {
    const sessionHistory = this.breakHistory.get(sessionId) || []

    if (sessionHistory.length === 0) {
      return {
        totalBreaks: 0,
        averageRecovery: 0,
        optimalDuration: 5,
        effectivenessTrend: 'stable',
      }
    }

    const totalBreaks = sessionHistory.length
    const averageRecovery =
      sessionHistory.reduce((sum, b) => sum + b.recoveryScore, 0) / totalBreaks
    const optimalDuration = this.getOptimalBreakDuration(sessionId)

    // Calculate effectiveness trend
    let effectivenessTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (sessionHistory.length >= 3) {
      const recent = sessionHistory.slice(-3)
      const older = sessionHistory.slice(-6, -3)

      if (older.length > 0) {
        const recentAvg = recent.reduce((sum, b) => sum + b.recoveryScore, 0) / recent.length
        const olderAvg = older.reduce((sum, b) => sum + b.recoveryScore, 0) / older.length

        if (recentAvg > olderAvg + 5) effectivenessTrend = 'improving'
        else if (recentAvg < olderAvg - 5) effectivenessTrend = 'declining'
      }
    }

    return {
      totalBreaks,
      averageRecovery: Math.round(averageRecovery),
      optimalDuration,
      effectivenessTrend,
    }
  }
}

export const breakEffectivenessTracker = BreakEffectivenessTracker.getInstance()

/**
 * Intelligent Break Notification System
 * Story 5.3 Task 3: Intelligent break prompts and notifications
 *
 * Provides contextual break recommendations based on performance trends,
 * fatigue levels, and schedule. Supports different break types with
 * postpone/skip options and effectiveness tracking.
 *
 * Design: "Linear Light × Maximum Flair" - 80% playful, 20% professional
 * OKLCH colors, glassmorphism, spring animations, modal transitions
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
import { motion, AnimatePresence } from 'motion/react'
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
// Legacy design-tokens removed; use app tokens/utilities instead.
import { modalVariants, buttonVariants, progressVariants } from '@/lib/animation-variants'

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
        return <TrendingDown className="h-6 w-6" style={{ color: colors.alert }} />
      case 'fatigue_detected':
        return <Battery className="h-6 w-6" style={{ color: colors.energy }} />
      case 'objectives_completed':
        return <CheckCircle className="h-6 w-6" style={{ color: colors.success }} />
      default:
        return <Coffee className="h-6 w-6" style={{ color: colors.info }} />
    }
  }

  const getUrgencyStyle = (urgency: BreakRecommendation['urgency']) => {
    switch (urgency) {
      case 'high':
        return {
          borderColor: colors.alert,
          backgroundColor: 'oklch(0.6 0.20 30 / 0.1)',
        }
      case 'medium':
        return {
          borderColor: colors.energy,
          backgroundColor: 'oklch(0.7 0.18 50 / 0.1)',
        }
      default:
        return {
          borderColor: colors.info,
          backgroundColor: 'oklch(0.65 0.18 240 / 0.1)',
        }
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

  const urgencyStyle = getUrgencyStyle(recommendation.urgency)

  return (
    <>
      <AnimatePresence>
        {open && (
          <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="max-w-md" style={{ borderRadius: borderRadius.xl }}>
              <motion.div
                variants={modalVariants.content}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <DialogHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      {getBreakIcon(recommendation.type)}
                    </motion.div>
                    <div className="flex-1">
                      <DialogTitle className={typography.heading.h2}>
                        {getBreakTitle(recommendation.type)}
                      </DialogTitle>
                      <Badge
                        variant="outline"
                        className="mt-1"
                        style={{
                          ...urgencyStyle,
                          borderRadius: borderRadius.md,
                        }}
                      >
                        <span className={`${typography.body.tiny} font-semibold uppercase`}>
                          {recommendation.urgency} PRIORITY
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <DialogDescription className={`${typography.body.base} leading-relaxed`}>
                    {recommendation.message}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Break Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card
                      className="border-2"
                      style={{
                        ...urgencyStyle,
                        borderRadius: borderRadius.lg,
                      }}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`${typography.body.small} font-medium`}>
                            Recommended Duration
                          </span>
                          <Badge variant="outline" style={{ borderRadius: borderRadius.sm }}>
                            <Clock className="h-3 w-3 mr-1" />
                            {recommendation.estimatedBreakDuration} minutes
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`${typography.body.small} font-medium`}>
                            Can Postpone
                          </span>
                          <span
                            className={`${typography.body.small}`}
                            style={{
                              color: recommendation.canPostpone ? colors.success : colors.muted,
                            }}
                          >
                            {recommendation.canPostpone ? 'Yes' : 'No'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`${typography.body.small} font-medium`}>Can Skip</span>
                          <span
                            className={`${typography.body.small}`}
                            style={{
                              color: recommendation.canSkip ? colors.success : colors.muted,
                            }}
                          >
                            {recommendation.canSkip ? 'Yes' : 'No'}
                          </span>
                        </div>

                        <div
                          className={`${typography.body.tiny} p-2`}
                          style={{
                            backgroundColor: colors.muted,
                            borderRadius: borderRadius.sm,
                          }}
                        >
                          <strong>Reason:</strong> {recommendation.reason}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Session Progress Context */}
                  {sessionProgress && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Card style={{ borderRadius: borderRadius.lg }}>
                        <CardContent className="p-4 space-y-2">
                          <div className={`${typography.body.small} font-medium`}>
                            Session Progress
                          </div>
                          <div className={`flex items-center justify-between ${typography.body.small}`}>
                            <span>Objectives</span>
                            <span>
                              {sessionProgress.objectivesCompleted}/{sessionProgress.totalObjectives}
                            </span>
                          </div>
                          <motion.div
                            initial="initial"
                            animate="animate"
                            custom={
                              (sessionProgress.objectivesCompleted / sessionProgress.totalObjectives) *
                              100
                            }
                            variants={progressVariants}
                          >
                            <Progress
                              value={
                                (sessionProgress.objectivesCompleted /
                                  sessionProgress.totalObjectives) *
                                100
                              }
                              className="h-2"
                            />
                          </motion.div>
                          <div className={`flex items-center justify-between ${typography.body.small}`}>
                            <span>Duration</span>
                            <span>{sessionProgress.sessionDuration} minutes</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Break Duration Selection */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <Label className={`${typography.body.small} font-medium`}>Break Duration</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {[3, 5, 10, 15].map((duration) => (
                        <motion.div
                          key={duration}
                          whileHover="hover"
                          whileTap="tap"
                          variants={buttonVariants}
                        >
                          <Button
                            variant={selectedDuration === duration ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedDuration(duration)}
                            className="h-8"
                            style={{ borderRadius: borderRadius.md }}
                          >
                            {duration}m
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Postpone Options */}
                  {recommendation.canPostpone && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-2"
                    >
                      <Label className={`${typography.body.small} font-medium`}>
                        Postpone Break By
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 15].map((minutes) => (
                          <motion.div
                            key={minutes}
                            whileHover="hover"
                            whileTap="tap"
                            variants={buttonVariants}
                          >
                            <Button
                              variant={postponeMinutes === minutes ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPostponeMinutes(minutes)}
                              className="h-8"
                              style={{ borderRadius: borderRadius.md }}
                            >
                              {minutes}m
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Auto-break Settings */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between p-3"
                    style={{
                      backgroundColor: colors.muted,
                      borderRadius: borderRadius.lg,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" style={{ color: colors.warning }} />
                      <Label
                        htmlFor="auto-break"
                        className={`${typography.body.small} font-medium`}
                      >
                        Auto-break for high urgency
                      </Label>
                    </div>
                    <Switch
                      id="auto-break"
                      checked={autoBreakEnabled}
                      onCheckedChange={setAutoBreakEnabled}
                    />
                  </motion.div>

                  {/* Countdown for urgent breaks */}
                  {recommendation.urgency === 'high' && countdown > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center p-3 border-2"
                      style={{
                        backgroundColor: 'oklch(0.6 0.20 30 / 0.1)',
                        borderColor: colors.alert,
                        borderRadius: borderRadius.lg,
                      }}
                    >
                      <div
                        className={`${typography.body.small} font-medium mb-1`}
                        style={{ color: colors.alert }}
                      >
                        Auto-break in {countdown} seconds
                      </div>
                      <Progress value={((30 - countdown) / 30) * 100} className="h-2" />
                    </motion.div>
                  )}

                  {/* Previous Break Effectiveness */}
                  {breakEffectiveness && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card
                        className="border"
                        style={{
                          backgroundColor: 'oklch(0.7 0.15 145 / 0.1)',
                          borderColor: colors.success,
                          borderRadius: borderRadius.lg,
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4" style={{ color: colors.success }} />
                            <span className={`${typography.body.small} font-medium`}>
                              Last Break Effectiveness
                            </span>
                          </div>
                          <div className={`${typography.body.tiny} space-y-1`}>
                            <div className="flex justify-between">
                              <span>Performance Recovery:</span>
                              <span
                                className="font-medium"
                                style={{ color: colors.success }}
                              >
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
                    </motion.div>
                  )}
                </div>

                <DialogFooter className="flex gap-2">
                  {/* Skip Button */}
                  {recommendation.canSkip && (
                    <motion.div
                      className="flex-1"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      <Button
                        variant="outline"
                        onClick={handleSkipBreak}
                        className="w-full"
                        style={{ borderRadius: borderRadius.md }}
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        Skip Break
                      </Button>
                    </motion.div>
                  )}

                  {/* Postpone Button */}
                  {recommendation.canPostpone && (
                    <motion.div
                      className="flex-1"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      <Button
                        variant="outline"
                        onClick={handlePostponeBreak}
                        className="w-full"
                        style={{ borderRadius: borderRadius.md }}
                      >
                        <Timer className="h-4 w-4 mr-2" />
                        Postpone {postponeMinutes}m
                      </Button>
                    </motion.div>
                  )}

                  {/* Take Break Button */}
                  <motion.div
                    className="flex-1"
                    whileHover="hover"
                    whileTap="tap"
                    variants={buttonVariants}
                  >
                    <Button
                      onClick={handleTakeBreak}
                      className="w-full"
                      style={{
                        backgroundColor:
                          recommendation.urgency === 'high'
                            ? colors.alert
                            : recommendation.urgency === 'medium'
                              ? colors.energy
                              : colors.info,
                        borderRadius: borderRadius.md,
                      }}
                    >
                      <Coffee className="h-4 w-4 mr-2" />
                      Take {selectedDuration}m Break
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Auto-break countdown toast for urgent breaks */}
      <AnimatePresence>
        {recommendation.urgency === 'high' &&
          countdown > 0 &&
          countdown <= 10 &&
          autoBreakEnabled && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-4 right-4 z-50 text-white p-4 shadow-none max-w-sm"
              style={{
                backgroundColor: colors.alert,
                borderRadius: borderRadius.lg,
              }}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <div className={`${typography.body.base} font-medium`}>
                    Urgent Break Recommended
                  </div>
                  <div className={`${typography.body.small} opacity-90`}>
                    Auto-break in {countdown} seconds
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCountdown(0)}
                  className="ml-auto"
                  style={{ borderRadius: borderRadius.sm }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </>
  )
}

// Break effectiveness tracker utility (unchanged)
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

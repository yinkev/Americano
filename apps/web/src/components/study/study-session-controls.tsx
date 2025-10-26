'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Play,
  Pause,
  Square,
  Clock,
  Target,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  springSubtle,
  springSmooth,
  pulseVariants,
  drawerVariants
} from '@/lib/design-system'

interface StudySessionControlsProps {
  totalCards: number
  cardsReviewed: number
  startTime: Date
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onEnd: () => void
  accuracy?: number
  xpEarned?: number
}

export function StudySessionControls({
  totalCards,
  cardsReviewed,
  startTime,
  isPaused,
  onPause,
  onResume,
  onEnd,
  accuracy = 0,
  xpEarned = 0
}: StudySessionControlsProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  // Timer logic
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (cardsReviewed / totalCards) * 100

  return (
    <>
      {/* Main Control Bar - Sticky at top */}
      <motion.div
        className="sticky top-0 z-40 bg-background/95  border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={springSmooth}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Progress Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-lg">
                    {cardsReviewed} / {totalCards}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({Math.round(progress)}%)
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Timer */}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card"
              variants={pulseVariants}
              animate={isPaused ? undefined : 'animate'}
            >
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(elapsedSeconds)}
              </span>
            </motion.div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Pause/Resume */}
              <Button
                variant="outline"
                size="lg"
                onClick={isPaused ? onResume : onPause}
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                )}
              </Button>

              {/* End Session */}
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setShowEndConfirm(true)}
                className="gap-2"
              >
                <Square className="w-5 h-5" />
                End
              </Button>

              {/* Stats Toggle */}
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowStats(!showStats)}
                className="gap-2"
              >
                {showStats ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Sidebar - Collapsible */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            className="fixed right-0 top-20 bottom-0 w-80 bg-background border-l border-border shadow-none z-30 overflow-y-auto"
            variants={drawerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Session Stats</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="space-y-4">
                {/* Cards Reviewed */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cards Reviewed</p>
                      <p className="text-2xl font-bold">{cardsReviewed}</p>
                    </div>
                  </div>
                  <Progress value={progress} className="h-1" />
                </Card>

                {/* Time Elapsed */}
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-card flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time Elapsed</p>
                      <p className="text-2xl font-bold font-mono">{formatTime(elapsedSeconds)}</p>
                    </div>
                  </div>
                </Card>

                {/* Accuracy */}
                {accuracy > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-card flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {Math.round(accuracy)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* XP Earned */}
                {xpEarned > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-card flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">XP Earned</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          +{xpEarned}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Performance Estimate */}
                <Card className="p-4 bg-card border-primary/20">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">Performance Estimate</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cards/min</span>
                        <span className="font-semibold">
                          {elapsedSeconds > 0 ? (cardsReviewed / (elapsedSeconds / 60)).toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. completion</span>
                        <span className="font-semibold">
                          {elapsedSeconds > 0 && cardsReviewed > 0
                            ? formatTime(Math.floor((totalCards / cardsReviewed) * elapsedSeconds))
                            : '--:--'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Session Confirmation Dialog */}
      <AnimatePresence>
        {showEndConfirm && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-card  z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEndConfirm(false)}
            />

            {/* Dialog */}
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={springSmooth}
            >
              <Card className="p-8 max-w-md shadow-none-2xl">
                <h3 className="text-2xl font-bold mb-2">End Session?</h3>
                <p className="text-muted-foreground mb-6">
                  You've reviewed {cardsReviewed} of {totalCards} cards. Are you sure you want to end this session?
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEndConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowEndConfirm(false)
                      onEnd()
                    }}
                    className="flex-1"
                  >
                    End Session
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * CognitiveLoadIndicator Component
 * Story 5.4 Real-Time Integration
 *
 * Compact cognitive load indicator for study sessions showing:
 * - Current load level with color-coded badge
 * - Trend arrow (up/down/stable)
 * - Break recommendation when load >70
 * - Real-time updates every 30 seconds
 *
 * Design: "Linear Light × Maximum Flair" - 80% playful, 20% professional
 * OKLCH colors, glassmorphism, spring animations
 */

'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertCircle, Coffee } from 'lucide-react'
import { motion, AnimatePresence } from 'motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { typography, colors, transitions, borderRadius } from '@/lib/design-tokens'
import { buttonVariants, numberCounterVariants } from '@/lib/animation-variants'

interface CognitiveLoadIndicatorProps {
  sessionId: string
  userId: string
  onBreakRecommended?: () => void
  compact?: boolean
  className?: string
}

type LoadLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

const LOAD_LEVEL_CONFIG = {
  LOW: {
    color: 'oklch(0.7 0.15 145)', // Vibrant green
    label: 'Low Load',
    message: 'Optimal',
    bgColor: 'oklch(0.7 0.15 145 / 0.1)',
  },
  MODERATE: {
    color: 'oklch(0.75 0.15 85)', // Warm amber
    label: 'Moderate',
    message: 'Learning Zone',
    bgColor: 'oklch(0.75 0.15 85 / 0.1)',
  },
  HIGH: {
    color: 'oklch(0.7 0.18 50)', // Energetic orange
    label: 'High Load',
    message: 'Consider Break',
    bgColor: 'oklch(0.7 0.18 50 / 0.1)',
  },
  CRITICAL: {
    color: 'oklch(0.6 0.20 30)', // Medical red
    label: 'Overload',
    message: 'Take Break Now',
    bgColor: 'oklch(0.6 0.20 30 / 0.1)',
  },
}

const REFRESH_INTERVAL = 30000 // 30 seconds

export function CognitiveLoadIndicator({
  sessionId,
  userId,
  onBreakRecommended,
  compact = false,
  className = '',
}: CognitiveLoadIndicatorProps) {
  const [loadScore, setLoadScore] = useState<number | null>(null)
  const [loadLevel, setLoadLevel] = useState<LoadLevel>('LOW')
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')
  const [loading, setLoading] = useState(true)
  const [breakRecommended, setBreakRecommended] = useState(false)

  const fetchCognitiveLoad = async () => {
    try {
      const response = await fetch(`/api/analytics/cognitive-load/current?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch cognitive load')

      const data = await response.json()

      if (data.success && data.loadScore !== null) {
        const score = data.loadScore
        setLoadScore(score)
        setLoadLevel(data.loadLevel)
        setTrend(data.trend)

        // Check if break should be recommended (load >70)
        if (score > 70 && !breakRecommended) {
          setBreakRecommended(true)
          if (onBreakRecommended) {
            onBreakRecommended()
          }
          toast.warning('High cognitive load detected - consider taking a break', {
            duration: 5000,
            icon: <Coffee className="size-5" />,
          })
        } else if (score <= 60 && breakRecommended) {
          // Reset break recommendation when load drops
          setBreakRecommended(false)
        }
      }
    } catch (error) {
      console.error('Error fetching cognitive load:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCognitiveLoad()
  }, [sessionId, userId])

  // Set up refresh interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCognitiveLoad()
    }, REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [sessionId, userId, breakRecommended])

  if (loading || loadScore === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-white/30 ${className}`}
      >
        <Brain className="size-4 text-muted-foreground animate-pulse" />
        <span className={`${typography.body.small} text-muted-foreground`}>Loading...</span>
      </motion.div>
    )
  }

  const config = LOAD_LEVEL_CONFIG[loadLevel]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
        whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${className}`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.color,
          borderRadius: borderRadius.md,
        }}
      >
        <Brain className="size-4" style={{ color: config.color }} />
        <div className="flex items-center gap-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={loadScore}
              variants={numberCounterVariants}
              initial="initial"
              animate="animate"
              className={`${typography.body.small} font-bold`}
              style={{ color: config.color }}
            >
              {Math.round(loadScore)}
            </motion.span>
          </AnimatePresence>
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: trend === 'up' ? 45 : trend === 'down' ? -45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <TrendIcon className="size-3" style={{ color: config.color }} />
          </motion.div>
        </div>
        {loadScore > 70 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <AlertCircle className="size-3" style={{ color: config.color }} />
          </motion.div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
      className={`bg-white/80 backdrop-blur-md border border-white/30 shadow-lg p-6 ${className}`}
      style={{ borderRadius: borderRadius.xl }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="size-5" style={{ color: config.color }} />
          <span className={`${typography.heading.h3} text-foreground`}>Cognitive Load</span>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: trend === 'up' ? 45 : trend === 'down' ? -45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <TrendIcon className="size-4" />
          </motion.div>
          <span className={`${typography.body.small} text-muted-foreground capitalize`}>
            {trend}
          </span>
        </div>
      </div>

      {/* Load score display */}
      <div className="flex items-baseline gap-2 mb-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={loadScore}
            variants={numberCounterVariants}
            initial="initial"
            animate="animate"
            className={`${typography.heading.h1} font-heading`}
            style={{ color: config.color }}
          >
            {Math.round(loadScore)}
          </motion.span>
        </AnimatePresence>
        <span className={`${typography.body.base} text-muted-foreground`}>/ 100</span>
      </div>

      {/* Load level badge */}
      <Badge
        variant="outline"
        className="inline-flex items-center gap-1.5 px-3 py-1 mb-4"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
          borderColor: config.color,
          borderRadius: borderRadius.md,
        }}
      >
        <span className={`${typography.body.small} font-semibold`}>{config.label}</span>
      </Badge>

      {/* Message */}
      <p className={`${typography.body.small} text-muted-foreground mb-4`}>{config.message}</p>

      {/* Break recommendation */}
      <AnimatePresence>
        {loadScore > 70 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-4 border-t border-muted"
          >
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="size-4" style={{ color: colors.energy }} />
              <span className={`${typography.body.base} font-semibold text-foreground`}>
                High Load Detected
              </span>
            </div>
            <p className={`${typography.body.small} text-muted-foreground mb-3`}>
              Your cognitive load is elevated. Taking a short break will help maintain learning
              effectiveness.
            </p>
            {onBreakRecommended && (
              <motion.div whileHover="hover" whileTap="tap" variants={buttonVariants}>
                <Button
                  size="sm"
                  onClick={onBreakRecommended}
                  className="w-full"
                  style={{
                    backgroundColor: config.color,
                    color: 'white',
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Coffee className="size-3 mr-2" />
                  Take Break
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-refresh indicator */}
      <div className="mt-4 pt-4 border-t border-muted">
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`${typography.body.tiny} text-muted-foreground text-center`}
        >
          Updates every 30 seconds
        </motion.p>
      </div>

      {/* ARIA live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Cognitive load is {config.label} at {Math.round(loadScore)} percent.
        {loadScore > 70 && ' High load detected - break recommended.'}
      </div>
    </motion.div>
  )
}

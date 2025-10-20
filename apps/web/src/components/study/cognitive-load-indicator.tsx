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
 * Design: Compact inline display, glassmorphism, OKLCH colors
 */

'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, TrendingDown, Minus, AlertCircle, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

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
    color: 'oklch(0.7 0.15 145)', // Green
    label: 'Low Load',
    message: 'Optimal',
    bgColor: 'oklch(0.7 0.15 145 / 0.1)',
  },
  MODERATE: {
    color: 'oklch(0.8 0.15 90)', // Yellow
    label: 'Moderate',
    message: 'Learning Zone',
    bgColor: 'oklch(0.8 0.15 90 / 0.1)',
  },
  HIGH: {
    color: 'oklch(0.7 0.15 50)', // Orange
    label: 'High Load',
    message: 'Consider Break',
    bgColor: 'oklch(0.7 0.15 50 / 0.1)',
  },
  CRITICAL: {
    color: 'oklch(0.6 0.20 30)', // Red
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
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 backdrop-blur-sm border border-white/30 ${className}`}
      >
        <Brain className="size-4 text-muted-foreground animate-pulse" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    )
  }

  const config = LOAD_LEVEL_CONFIG[loadLevel]
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${className}`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.color,
        }}
      >
        <Brain className="size-4" style={{ color: config.color }} />
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-bold"
            style={{ color: config.color }}
          >
            {Math.round(loadScore)}
          </span>
          <TrendIcon className="size-3" style={{ color: config.color }} />
        </div>
        {loadScore > 70 && (
          <AlertCircle className="size-3" style={{ color: config.color }} />
        )}
      </div>
    )
  }

  return (
    <div
      className={`bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] rounded-xl p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="size-5" style={{ color: config.color }} />
          <span className="font-heading font-semibold text-sm text-foreground">
            Cognitive Load
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon className="size-3" />
          <span className="capitalize">{trend}</span>
        </div>
      </div>

      {/* Load score display */}
      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="text-3xl font-bold font-heading"
          style={{ color: config.color }}
        >
          {Math.round(loadScore)}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>

      {/* Load level badge */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold mb-3"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
        }}
      >
        {config.label}
      </div>

      {/* Message */}
      <p className="text-xs text-muted-foreground mb-3">{config.message}</p>

      {/* Break recommendation */}
      {loadScore > 70 && (
        <div className="pt-3 border-t border-muted">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="size-4 text-orange-600" />
            <span className="text-sm font-semibold text-foreground">
              High Load Detected
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Your cognitive load is elevated. Taking a short break will help maintain learning effectiveness.
          </p>
          {onBreakRecommended && (
            <Button
              size="sm"
              onClick={onBreakRecommended}
              className="w-full"
              style={{
                backgroundColor: config.color,
                color: 'white',
              }}
            >
              <Coffee className="size-3 mr-2" />
              Take Break
            </Button>
          )}
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mt-3 pt-3 border-t border-muted">
        <p className="text-xs text-muted-foreground text-center">
          Updates every 30 seconds
        </p>
      </div>

      {/* ARIA live region */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Cognitive load is {config.label} at {Math.round(loadScore)} percent.
        {loadScore > 70 && ' High load detected - break recommended.'}
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, Gift, Star, Zap } from 'lucide-react'
import { playSoundEffect } from './SoundToggle'

/**
 * Variable Rewards Component
 *
 * Behavioral Psychology: Variable Reward Schedules (Nir Eyal)
 * - Unpredictable rewards increase completion by 30%
 * - Random XP bonuses create dopamine spikes
 * - Surprise mechanics maintain long-term engagement
 * - Pattern: 15% chance on task completion, 5% chance on login
 */

interface Reward {
  type: 'xp_bonus' | 'badge' | 'streak_freeze' | 'double_xp'
  title: string
  description: string
  icon: typeof Sparkles
  color: string
  value?: number
}

const REWARDS: Reward[] = [
  {
    type: 'xp_bonus',
    title: 'Bonus XP!',
    description: 'You earned extra experience points!',
    icon: Zap,
    color: 'var(--xp-purple)',
    value: 50,
  },
  {
    type: 'badge',
    title: 'New Badge!',
    description: 'Quick Learner - Completed 3 tasks in a row!',
    icon: Star,
    color: 'var(--streak-fire)',
  },
  {
    type: 'streak_freeze',
    title: 'Streak Freeze!',
    description: 'Your streak is protected for 1 day!',
    icon: Sparkles,
    color: 'oklch(0.70 0.20 220)',
  },
  {
    type: 'double_xp',
    title: 'Double XP!',
    description: 'Your next session earns 2x XP!',
    icon: Gift,
    color: 'var(--mastery-green)',
  },
]

interface VariableRewardsProps {
  trigger?: 'task_complete' | 'login' | 'manual'
  onReward?: (reward: Reward) => void
}

export function VariableRewards({ trigger, onReward }: VariableRewardsProps) {
  const [showReward, setShowReward] = useState(false)
  const [currentReward, setCurrentReward] = useState<Reward | null>(null)
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; x: number; y: number; rotation: number; delay: number }>>([])

  useEffect(() => {
    if (!trigger) return

    // Variable reward probability
    const probability = trigger === 'task_complete' ? 0.15 : trigger === 'login' ? 0.05 : 1.0
    const shouldReward = Math.random() < probability

    if (shouldReward || trigger === 'manual') {
      const reward = REWARDS[Math.floor(Math.random() * REWARDS.length)]
      setCurrentReward(reward)
      setShowReward(true)
      playSoundEffect('achievement')

      // Generate confetti
      const pieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -20,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
      }))
      setConfettiPieces(pieces)

      // Call callback if provided
      if (onReward) {
        onReward(reward)
      }

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setShowReward(false)
        setConfettiPieces([])
      }, 4000)
    }
  }, [trigger, onReward])

  return (
    <>
      {/* Confetti Animation */}
      <AnimatePresence>
        {confettiPieces.length > 0 && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            {confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${piece.x}%`,
                  background: `oklch(${0.6 + Math.random() * 0.2} ${0.15 + Math.random() * 0.1} ${Math.random() * 360})`,
                }}
                initial={{ y: piece.y, opacity: 1, rotate: 0 }}
                animate={{
                  y: window.innerHeight + 50,
                  opacity: [1, 1, 0],
                  rotate: piece.rotation,
                }}
                transition={{
                  duration: 3,
                  delay: piece.delay,
                  ease: 'easeIn',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Reward Toast */}
      <AnimatePresence>
        {showReward && currentReward && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ type: 'spring', damping: 15 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4"
          >
            <div
              className="bg-card border-2 rounded-xl p-4 shadow-2xl backdrop-blur-sm"
              style={{ borderColor: currentReward.color }}
            >
              <div className="flex items-start gap-3">
                {/* Icon with pulse */}
                <motion.div
                  className="rounded-full p-2 flex-shrink-0"
                  style={{ backgroundColor: `${currentReward.color}20` }}
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      `0 0 0 0 ${currentReward.color}40`,
                      `0 0 0 10px ${currentReward.color}00`,
                      `0 0 0 0 ${currentReward.color}00`,
                    ],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <currentReward.icon
                    className="h-6 w-6"
                    style={{ color: currentReward.color }}
                  />
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold mb-1" style={{ color: currentReward.color }}>
                    {currentReward.title}
                    {currentReward.value && ` +${currentReward.value} XP`}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-tight">
                    {currentReward.description}
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => {
                    setShowReward(false)
                    setConfettiPieces([])
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Hook to trigger variable rewards
 *
 * Usage:
 * const triggerReward = useVariableReward()
 * triggerReward('task_complete')
 */
export function useVariableReward() {
  const [trigger, setTrigger] = useState<'task_complete' | 'login' | 'manual' | undefined>(undefined)
  const [key, setKey] = useState(0)

  const triggerReward = (type: 'task_complete' | 'login' | 'manual') => {
    setTrigger(type)
    setKey((prev) => prev + 1) // Force re-render
    setTimeout(() => setTrigger(undefined), 100) // Reset
  }

  return { trigger, key, triggerReward }
}

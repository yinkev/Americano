'use client'

import { Flame, Star, Target, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useEffect, useState } from 'react'
import { playSoundEffect } from './SoundToggle'

/**
 * Streak Milestones Component
 *
 * Behavioral Psychology: Loss Aversion (Kahneman & Tversky)
 * - Milestone celebrations create emotional attachment to streaks
 * - Research shows 60% engagement boost from streak protection
 * - Duolingo pattern: 7, 14, 30, 100 day milestones
 */

interface StreakMilestone {
  days: number
  title: string
  emoji: string
  message: string
  icon: typeof Flame
}

const MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    title: 'Week Warrior',
    emoji: '🔥',
    message: 'You completed a full week! Your consistency is building momentum.',
    icon: Flame,
  },
  {
    days: 14,
    title: 'Two Week Champion',
    emoji: '⚡',
    message: "Two weeks of dedication! You're forming a strong habit.",
    icon: Target,
  },
  {
    days: 30,
    title: 'Month Master',
    emoji: '🏆',
    message: '30 days straight! This is now part of your routine.',
    icon: Trophy,
  },
  {
    days: 100,
    title: 'Century Legend',
    emoji: '⭐',
    message: "100 days! You're in the top 1% of learners. Unstoppable!",
    icon: Star,
  },
]

interface StreakMilestonesProps {
  streakDays: number
}

export function StreakMilestones({ streakDays }: StreakMilestonesProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentMilestone, setCurrentMilestone] = useState<StreakMilestone | null>(null)

  useEffect(() => {
    // Check if user just hit a milestone
    const milestone = MILESTONES.find((m) => m.days === streakDays)
    if (milestone) {
      setCurrentMilestone(milestone)
      setShowCelebration(true)
      playSoundEffect('achievement')

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setShowCelebration(false)
      }, 5000)
    }
  }, [streakDays])

  const getNextMilestone = () => {
    return MILESTONES.find((m) => m.days > streakDays) || MILESTONES[MILESTONES.length - 1]
  }

  const getProgressToNextMilestone = () => {
    const next = getNextMilestone()
    const prev = [...MILESTONES].reverse().find((m) => m.days <= streakDays)
    const prevDays = prev?.days || 0
    const totalRange = next.days - prevDays
    const currentProgress = streakDays - prevDays
    return (currentProgress / totalRange) * 100
  }

  return (
    <>
      {/* Next Milestone Progress */}
      <div className="text-xs text-muted-foreground mt-2">
        <div className="flex items-center justify-between mb-1">
          <span>Next: {getNextMilestone().title}</span>
          <span className="font-medium">
            {streakDays}/{getNextMilestone().days}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--streak-fire)]"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressToNextMilestone()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Milestone Celebration Modal */}
      <AnimatePresence>
        {showCelebration && currentMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-card border-2 border-[var(--streak-fire)] rounded-2xl p-6 max-w-md mx-4 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon with pulse animation */}
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--streak-fire)] flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(255, 136, 0, 0.7)',
                    '0 0 0 20px rgba(255, 136, 0, 0)',
                    '0 0 0 0 rgba(255, 136, 0, 0)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <currentMilestone.icon className="h-10 w-10 text-white" />
              </motion.div>

              {/* Milestone Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-heading font-bold mb-2">
                  {currentMilestone.emoji} {currentMilestone.title}!
                </h2>
                <p className="text-xl font-bold text-[var(--streak-fire)] mb-3">
                  {streakDays} Day Streak!
                </p>
                <p className="text-muted-foreground leading-relaxed">{currentMilestone.message}</p>
              </motion.div>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => setShowCelebration(false)}
                className="mt-6 px-6 py-3 bg-[var(--streak-fire)] text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Keep Going! 🚀
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

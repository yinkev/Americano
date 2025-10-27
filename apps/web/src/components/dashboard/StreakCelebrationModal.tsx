'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Flame, Trophy, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DumplingMascot } from './DumplingMascot'

interface StreakCelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  streakDays: number
}

/**
 * Streak Celebration Modal
 *
 * Celebrates user's study streak with confetti and encouraging messaging
 * Behavioral hooks: Achievement, social proof, loss aversion
 */
export function StreakCelebrationModal({
  isOpen,
  onClose,
  streakDays,
}: StreakCelebrationModalProps) {
  // Generate encouragement message based on streak length
  const getStreakMessage = () => {
    if (streakDays >= 100) {
      return {
        title: 'Legendary Streak!',
        message: 'You are in the top 1% of learners. Your dedication is truly inspiring!',
        emoji: '👑',
      }
    } else if (streakDays >= 50) {
      return {
        title: 'Incredible Commitment!',
        message: 'Half a century of consistent learning. You are unstoppable!',
        emoji: '🔥',
      }
    } else if (streakDays >= 30) {
      return {
        title: 'Monthly Master!',
        message: 'A full month of dedication. Excellence is becoming your habit!',
        emoji: '⭐',
      }
    } else if (streakDays >= 14) {
      return {
        title: 'Two Week Warrior!',
        message: 'Your consistency is building momentum. Keep it going!',
        emoji: '💪',
      }
    } else if (streakDays >= 7) {
      return {
        title: 'Week One Champion!',
        message: 'Seven days strong! You are building a powerful habit.',
        emoji: '🎯',
      }
    } else if (streakDays >= 3) {
      return {
        title: 'Great Start!',
        message: 'Three days in a row! The hardest part is behind you.',
        emoji: '🚀',
      }
    } else {
      return {
        title: 'Keep It Going!',
        message: 'Every day counts. You are on your way to greatness!',
        emoji: '✨',
      }
    }
  }

  const streakInfo = getStreakMessage()

  // Confetti effect
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      const confettiCount = 50
      const container = document.getElementById('confetti-container')
      if (!container) return

      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div')
        confetti.className = 'confetti'
        confetti.style.left = `${Math.random() * 100}%`
        confetti.style.animationDelay = `${Math.random() * 3}s`
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`
        confetti.style.backgroundColor = [
          'oklch(0.75 0.22 40)',
          'oklch(0.70 0.22 310)',
          'oklch(0.75 0.20 145)',
          'oklch(0.70 0.18 210)',
          'oklch(0.80 0.18 90)',
        ][Math.floor(Math.random() * 5)]
        container.appendChild(confetti)
      }

      return () => {
        if (container) {
          container.innerHTML = ''
        }
      }
    }
  }, [isOpen])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Streak Celebration</DialogTitle>
          </DialogHeader>

          <div className="relative">
            {/* Confetti container */}
            <div
              id="confetti-container"
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ zIndex: 10 }}
            />

            {/* Content */}
            <div className="text-center space-y-6 py-4">
              {/* Mascot */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="flex justify-center"
              >
                <DumplingMascot size={80} variant="excited" />
              </motion.div>

              {/* Streak count */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-center gap-2">
                  <Flame className="h-8 w-8 text-orange-500" />
                  <span className="text-5xl font-bold gradient-text">
                    {streakDays}
                  </span>
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-lg text-muted-foreground">
                  Day Streak {streakInfo.emoji}
                </p>
              </motion.div>

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h3 className="text-2xl font-semibold">{streakInfo.title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {streakInfo.message}
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-4 py-4"
              >
                <div className="text-center">
                  <Trophy className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                  <p className="text-2xl font-bold">
                    {Math.floor(streakDays / 7)}
                  </p>
                  <p className="text-xs text-muted-foreground">Weeks</p>
                </div>
                <div className="text-center">
                  <Star className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  <p className="text-2xl font-bold">{streakDays * 50}</p>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                </div>
                <div className="text-center">
                  <Flame className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                  <p className="text-2xl font-bold">
                    {streakDays >= 7 ? 'Top 10%' : 'Top 30%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Ranking</p>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={onClose}
                  className="w-full"
                  size="lg"
                >
                  Continue Learning
                </Button>
              </motion.div>

              {/* Social proof */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-muted-foreground"
              >
                Join 5,000+ students maintaining their streaks
              </motion.p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall linear infinite;
        }

        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        .gradient-text {
          background: linear-gradient(
            135deg,
            oklch(0.70 0.22 310) 0%,
            oklch(0.75 0.22 40) 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </>
  )
}

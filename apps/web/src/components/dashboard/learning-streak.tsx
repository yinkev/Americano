'use client'

import { motion } from 'motion/react'
import { Flame, Trophy } from 'lucide-react'
import { Section } from '@/components/ui/section'
import { springSubtle, listItemVariants } from '@/lib/design-system'

interface LearningStreakProps {
  currentStreak: number
  longestStreak: number
  lastThirtyDays: boolean[] // true = studied, false = missed
}

export function LearningStreak({
  currentStreak,
  longestStreak,
  lastThirtyDays,
}: LearningStreakProps) {
  return (
    <div className="rounded-xl overflow-hidden">
      <Section title="Learning Streak" icon={<Flame className="size-5 text-[oklch(0.78_0.13_340)]" />} />

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          variants={listItemVariants}
          initial="initial"
          animate="animate"
          className="bg-muted rounded-xl p-4 text-center"
        >
          <Flame className="w-8 h-8 text-[oklch(0.78_0.13_340)] mx-auto mb-2" />
          <p className="text-3xl font-bold text-[oklch(0.78_0.13_340)] tabular-nums">{currentStreak}</p>
          <p className="text-sm text-[oklch(0.556_0_0)] font-medium mt-1">Current Streak</p>
        </motion.div>

        <motion.div
          variants={listItemVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
          className="bg-muted rounded-xl p-4 text-center"
        >
          <Trophy className="w-8 h-8 text-[oklch(0.8_0.15_90)] mx-auto mb-2" />
          <p className="text-3xl font-bold text-[oklch(0.8_0.15_90)] tabular-nums">{longestStreak}</p>
          <p className="text-sm text-[oklch(0.556_0_0)] font-medium mt-1">Longest Streak</p>
        </motion.div>
      </div>

      {/* Calendar Heatmap */}
      <div className="mt-6">
        <p className="text-sm text-[oklch(0.556_0_0)] font-medium mb-3">Last 30 Days</p>
        <div className="grid grid-cols-10 gap-1.5">
          {lastThirtyDays.map((studied, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springSubtle, delay: index * 0.01 }}
              className={`aspect-square rounded-lg transition-colors ${
                studied
                  ? 'bg-[oklch(0.78_0.13_340)]'
                  : 'bg-[oklch(0.90_0_0)] dark:bg-[oklch(0.30_0_0)]'
              }`}
              title={`Day ${30 - index}: ${studied ? 'Studied' : 'Missed'}`}
            />
          ))}
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-muted rounded-xl p-4 text-center mt-6">
        <p className="text-sm font-medium text-[oklch(0.145_0_0)]">
          {currentStreak >= 7
            ? "🔥 You're on fire! Keep this momentum going!"
            : currentStreak >= 3
            ? '💪 Great start! Keep building that habit!'
            : "🌱 Every day counts. Let's build a streak!"}
        </p>
      </div>
    </div>
  )
}

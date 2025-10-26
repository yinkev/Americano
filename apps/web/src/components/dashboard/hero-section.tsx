'use client'

import { motion } from 'motion/react'
import { Zap, TrendingUp, Flame, Clock } from 'lucide-react'
import { springSmooth, listItemVariants } from '@/lib/design-system'
import { Chip } from '@/components/ui/chip'

interface HeroSectionProps {
  userName?: string
  currentMission?: {
    title: string
    progress: number
    estimatedMinutes: number
  }
  stats: {
    xpThisWeek: number
    currentStreak: number
    studyTimeToday: number
  }
}

export function HeroSection({
  userName = 'Student',
  currentMission,
  stats,
}: HeroSectionProps) {
  return (
    <motion.div
      className="mb-8 md:mb-12"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSmooth}
    >
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-[clamp(28px,2.4vw,40px)] font-heading font-bold tracking-tight text-foreground mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-base md:text-lg text-muted-foreground">
          You're making excellent progress. Let's keep the momentum going.
        </p>
      </div>

      {/* Quick Stats Chips (minimal, flat) */}
      <div className="flex flex-wrap gap-2.5 md:gap-3">
        <Chip label="XP" value={stats.xpThisWeek.toLocaleString()} color="info" dot />
        <Chip label="Streak" value={stats.currentStreak} color="accent" dot />
        <Chip label="Today" value={`${stats.studyTimeToday}m`} color="success" dot />
      </div>
    </motion.div>
  )
}

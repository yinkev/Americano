'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useDashboard } from '@/hooks/use-dashboard'
import { DashboardSkeleton } from './DashboardSkeleton'
import { Icons } from './icons'
import { playSoundEffect } from './SoundToggle'

// Import all sub-components
import { MissionCard } from './MissionCard'
import { StatsCard } from './StatsCard'
import { ProgressChart } from './ProgressChart'
import { UpcomingReviews } from './UpcomingReviews'
import { CourseMastery } from './CourseMastery'
import { QuickActions } from './QuickActions'
import { ExamCountdown } from './ExamCountdown'
import { SoundToggle } from './SoundToggle'
import { WeeklyChallengeCard } from './WeeklyChallengeCard'
import { StreakCelebrationModal } from './StreakCelebrationModal'
import { StreakMilestones } from './StreakMilestones'
import { VariableRewards, useVariableReward } from './VariableRewards'
import { DumplingMascot } from './DumplingMascot'
import { DashboardFooter } from './DashboardFooter'
import { WelcomeTour } from './WelcomeTour'
import { KeyboardShortcuts } from './KeyboardShortcuts'

interface DashboardProps {
  userId?: string
}

/**
 * Main Dashboard Component
 *
 * Integrates useDashboard hook to fetch real data and display
 * comprehensive learning analytics with behavioral design patterns
 */
export function Dashboard({ userId = 'kevy@americano.dev' }: DashboardProps) {
  const [showStreakModal, setShowStreakModal] = useState(false)
  const { data, isLoading, error } = useDashboard(userId)
  const { trigger: rewardTrigger, key: rewardKey, triggerReward } = useVariableReward()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground text-lg">
            {error instanceof Error ? error.message : 'Failed to load dashboard'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Safely extract data with fallbacks
  const streakDays = data?.streak_days ?? 0
  const xpThisWeek = data?.xp_this_week ?? 0
  const xpToday = data?.xp_today ?? 0
  const cardsMastered = data?.cards_mastered ?? 0
  const studyTimeHours = data?.study_time_hours ?? 0
  const examReadiness = data?.exam_readiness ?? 0
  const mission = data?.mission

  const handleStreakClick = () => {
    setShowStreakModal(true)
    playSoundEffect('streak')
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 max-w-[1600px]">
        {/* Behavioral Hook: Mascot + Streak (Loss Aversion Driver) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="float flex-shrink-0">
              <DumplingMascot size={24} variant="happy" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold leading-tight truncate">
                Welcome back, {userId === 'dumpling' ? 'Visitor' : userId.split('@')[0]}! 👋
              </h2>
              <p className="text-xs text-muted-foreground leading-tight mt-1">
                You're on a roll. Let's keep the momentum going!
              </p>
            </div>
          </div>

          {/* Streak Counter - Flat design, NO GRADIENT */}
          <motion.button
            onClick={handleStreakClick}
            className="flex items-center gap-2 px-4 py-2 rounded shadow-sm bg-[var(--streak-fire)] border border-[var(--streak-fire)]/20 cursor-pointer transition-all flex-shrink-0"
            whileHover={{ scale: 1.02, boxShadow: '0 6px 20px rgba(255, 136, 0, 0.3)' }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{
                y: [0, -1, 0],
                rotate: [0, -5, 5, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icons.flame className="h-5 w-5 text-[var(--streak-foreground)] drop-shadow" />
            </motion.div>
            <div>
              <div className="text-lg font-bold text-[var(--streak-foreground)] drop-shadow leading-none whitespace-nowrap">{streakDays}</div>
              <div className="text-sm text-[var(--streak-foreground)]/90 leading-none whitespace-nowrap">day streak</div>
            </div>
          </motion.button>
        </motion.div>

        {/* Streak Milestones Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-3"
        >
          <StreakMilestones streakDays={streakDays} />
        </motion.div>

        {/* Accomplishment Metrics - Uses design tokens, no hardcoded colors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3" data-tour="stats-cards">
          <StatsCard
            icon={Icons.lightning}
            label="XP This Week"
            value={xpThisWeek}
            variant="xp"
            delay={0}
            badge={`+${xpToday} today`}
          />
          <StatsCard
            icon={Icons.target}
            label="Cards Mastered"
            value={cardsMastered}
            subtext="total"
            variant="mastery"
            delay={0.1}
          />
          <StatsCard
            icon={Icons.trophy}
            label="Study Time"
            value={studyTimeHours.toFixed(1)}
            subtext="hrs this week"
            variant="study"
            delay={0.2}
          />
        </div>

        {/* F-Pattern Grid: Mission Hero + Right Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
          {/* Left Column - Mission (Hero) + Progress */}
          <div className="xl:col-span-2 space-y-3">
            <motion.div
              data-tour="mission-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {mission ? (
                <MissionCard
                  title={mission.title}
                  tasks={mission.tasks}
                  readiness={mission.readiness}
                  duration={mission.duration}
                  onStartStudying={() => triggerReward('task_complete')}
                />
              ) : (
                <DashboardSkeleton />
              )}
            </motion.div>

            <motion.div
              data-tour="progress-chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <ProgressChart examReadiness={examReadiness} />
            </motion.div>

            {/* Weekly Challenges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <WeeklyChallengeCard />
            </motion.div>
          </div>

          {/* Right Sidebar - Fixed Predictable Zone */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <ExamCountdown />
            <UpcomingReviews />
            <CourseMastery />
            <QuickActions />
          </motion.div>
        </div>

        {/* Achievement Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-card/60 backdrop-blur-sm rounded p-4 border border-[var(--xp-purple)]/20 shadow-sm"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏆</div>
              <div>
                <h3 className="text-sm font-semibold leading-tight mb-1">You're making great progress this week!</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {(examReadiness * 100).toFixed(0)}% ready for your exam. Keep building that mastery! 💪
                </p>
              </div>
            </div>
            <motion.button
              className="px-4 py-2 rounded text-xs font-semibold bg-[var(--xp-purple)] text-[var(--xp-foreground)] shadow-sm transition-all"
              onClick={() => {
                playSoundEffect('achievement')
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              View Achievements
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <DashboardFooter />

      {/* Floating Actions */}
      <SoundToggle />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />

      {/* Welcome Tour */}
      <WelcomeTour />

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streakDays={streakDays}
      />

      {/* Variable Rewards System */}
      <VariableRewards key={rewardKey} trigger={rewardTrigger} />
    </div>
  )
}

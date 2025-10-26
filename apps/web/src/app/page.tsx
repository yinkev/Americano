'use client'

import { motion } from 'motion/react'
import { HeroSection } from '@/components/dashboard/hero-section'
import { MissionCard } from '@/components/dashboard/mission-card'
import { ProgressSummary } from '@/components/dashboard/progress-summary'
import { UpcomingReviews } from '@/components/dashboard/upcoming-reviews'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { LearningStreak } from '@/components/dashboard/learning-streak'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { MissionPreview } from '@/components/dashboard/mission-preview'
import { springSmooth, pageFadeVariants } from '@/lib/design-system'

// Mock data - In production, fetch from API
const heroStats = {
  xpThisWeek: 2840,
  currentStreak: 7,
  studyTimeToday: 45,
}

const streakData = {
  currentStreak: 7,
  longestStreak: 14,
  lastThirtyDays: Array.from({ length: 30 }, (_, i) => {
    // Mock pattern: studied most days, missed a few
    const missedDays = [2, 5, 8, 15, 22]
    return !missedDays.includes(i)
  }),
}

const recentSessions = [
  {
    id: '1',
    title: 'Cardiovascular Physiology',
    date: '2h ago',
    cardsReviewed: 24,
    accuracy: 87,
    timeSpent: 25,
    type: 'flashcards' as const,
  },
  {
    id: '2',
    title: 'Acute MI Case Study',
    date: '5h ago',
    cardsReviewed: 1,
    accuracy: 92,
    timeSpent: 18,
    type: 'clinical-case' as const,
  },
  {
    id: '3',
    title: 'Pharmacology Quiz',
    date: 'Yesterday',
    cardsReviewed: 15,
    accuracy: 73,
    timeSpent: 12,
    type: 'quiz' as const,
  },
  {
    id: '4',
    title: 'Renal System Validation',
    date: 'Yesterday',
    cardsReviewed: 8,
    accuracy: 95,
    timeSpent: 20,
    type: 'validation' as const,
  },
  {
    id: '5',
    title: 'Anatomy Flashcards',
    date: '2 days ago',
    cardsReviewed: 32,
    accuracy: 81,
    timeSpent: 30,
    type: 'flashcards' as const,
  },
]

export default function Dashboard() {
  return (
    <motion.div
      className="flex-1 overflow-y-auto"
      variants={pageFadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Page Container - responsive padding */}
      <div className="mx-auto w-full max-w-[1024px] px-4 md:px-6">
        {/* Hero Section with Welcome & Quick Stats */}
        <HeroSection userName="Student" stats={heroStats} />

        {/* Main Content - Two column layout (2fr / 1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left column: primary content */}
          <div className="space-y-6">
            <MissionCard />
            <UpcomingReviews />
            <RecentActivity sessions={recentSessions} />
          </div>

          {/* Right column: summaries and utilities */}
          <div className="space-y-6">
            <ProgressSummary />
            <MissionPreview />
            <QuickActions />
            <LearningStreak
              currentStreak={streakData.currentStreak}
              longestStreak={streakData.longestStreak}
              lastThirtyDays={streakData.lastThirtyDays}
            />
          </div>
        </div>

        {/* Accessibility: Hidden heading for screen readers */}
        <h2 className="sr-only">Dashboard Overview</h2>
      </div>
    </motion.div>
  )
}

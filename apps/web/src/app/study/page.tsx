'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import {
  Brain,
  Book,
  Stethoscope,
  Clock,
  Target,
  TrendingUp,
  ChevronRight,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  springSubtle,
  springSmooth,
  cardVariants,
  listContainerVariants,
  listItemVariants,
  pulseVariants
} from '@/lib/design-system'

interface StudyMode {
  id: string
  title: string
  description: string
  icon: typeof Brain
  estimatedTime: string
  color: string
  bgColor: string
  borderColor: string
  recommended?: boolean
}

interface RecentSession {
  id: string
  mode: string
  duration: number
  cardsReviewed: number
  accuracy: number
  completedAt: Date
}

const studyModes: StudyMode[] = [
  {
    id: 'quick-review',
    title: 'Quick Review',
    description: 'Flashcard review to reinforce what you know',
    icon: Brain,
    estimatedTime: '15-30 min',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-card',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    id: 'deep-study',
    title: 'Deep Study',
    description: 'Comprehensive learning with comprehension prompts',
    icon: Book,
    estimatedTime: '45-60 min',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-card',
    borderColor: 'border-blue-200 dark:border-blue-800',
    recommended: true,
  },
  {
    id: 'clinical-practice',
    title: 'Clinical Practice',
    description: 'Case-based learning for real-world application',
    icon: Stethoscope,
    estimatedTime: '30-45 min',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-card',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
]

const mockRecentSessions: RecentSession[] = [
  {
    id: '1',
    mode: 'Deep Study',
    duration: 52,
    cardsReviewed: 24,
    accuracy: 87,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '2',
    mode: 'Quick Review',
    duration: 18,
    cardsReviewed: 15,
    accuracy: 92,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: '3',
    mode: 'Clinical Practice',
    duration: 38,
    cardsReviewed: 8,
    accuracy: 75,
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
]

export default function StudyLandingPage() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null)

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <motion.div
        className="container mx-auto px-6 pt-12 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springSmooth}
      >
        <div className="max-w-3xl">
          <motion.h1
            className="text-5xl md:text-6xl font-heading font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSubtle, delay: 0.1 }}
          >
            Ready to learn?
          </motion.h1>
          <motion.p
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSubtle, delay: 0.2 }}
          >
            Choose your study mode and start mastering medical knowledge
          </motion.p>
        </div>
      </motion.div>

      {/* Study Mode Cards */}
      <motion.div
        className="container mx-auto px-6 pb-12"
        variants={listContainerVariants}
        initial="initial"
        animate="animate"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {studyModes.map((mode, index) => {
            const Icon = mode.icon
            return (
              <motion.div
                key={mode.id}
                variants={listItemVariants}
                whileHover={{
                  y: -6,
                  scale: 1.02,
                  transition: springSubtle
                }}
                whileTap={{
                  scale: 0.97,
                  transition: springSubtle
                }}
              >
                <Card
                  className={`
                    relative p-8 cursor-pointer transition-all duration-300
                    border-2 ${mode.borderColor}
                    ${mode.bgColor}
                    hover:shadow-none
                    ${selectedMode === mode.id ? 'ring-2 ring-offset-2 ring-primary' : ''}
                  `}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {/* Recommended Badge */}
                  {mode.recommended && (
                    <motion.div
                      className="absolute -top-3 -right-3"
                      variants={pulseVariants}
                      animate="animate"
                    >
                      <Badge className="bg-card   text-white border-0 shadow-none px-3 py-1">
                        Recommended
                      </Badge>
                    </motion.div>
                  )}

                  {/* Icon Badge */}
                  <div className={`
                    w-16 h-16 rounded-xl ${mode.bgColor}
                    flex items-center justify-center mb-6
                    border ${mode.borderColor}
                  `}>
                    <Icon className={`w-8 h-8 ${mode.color}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-heading font-bold mb-2">
                    {mode.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-base">
                    {mode.description}
                  </p>

                  {/* Time Estimate */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{mode.estimatedTime}</span>
                  </div>

                  {/* Start Button */}
                  <Link href={`/study/orchestration?mode=${mode.id}`}>
                    <Button
                      className={`
                        w-full mt-6 gap-2 font-semibold
                        ${mode.color} ${mode.bgColor}
                        hover:opacity-90
                        border ${mode.borderColor}
                      `}
                      size="lg"
                    >
                      <Play className="w-5 h-5" />
                      Start
                      <ChevronRight className="w-5 h-5 ml-auto" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSmooth, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold">Recent Sessions</h2>
            <Button variant="ghost" className="gap-2">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {mockRecentSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springSubtle, delay: 0.4 + index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-none transition-shadow-none duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{session.mode}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.cardsReviewed} cards • {session.duration} min
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <TrendingUp className="w-4 h-4" />
                          {session.accuracy}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(session.completedAt)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

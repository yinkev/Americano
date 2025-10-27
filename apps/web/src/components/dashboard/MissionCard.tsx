'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Target, Clock } from 'lucide-react'
import { motion } from 'motion/react'
import { showCelebration } from './CelebrationToast'
import { playSoundEffect } from './SoundToggle'

interface MissionCardProps {
  title: string
  tasks: Array<{
    id: string
    description: string
    completed: boolean
  }>
  readiness: number
  duration: number
  onStartStudying?: () => void
}

export function MissionCard({ title, tasks, readiness, duration, onStartStudying }: MissionCardProps) {
  const [isStarting, setIsStarting] = useState(false)

  const handleStartStudying = () => {
    setIsStarting(true)
    playSoundEffect('achievement')
    showCelebration(
      "Let's do this! 🎯",
      "Your study session is ready. Time to master some concepts!"
    )

    // Trigger variable reward (15% chance)
    if (onStartStudying) {
      onStartStudying()
    }

    // Reset animation state
    setTimeout(() => setIsStarting(false), 500)

    // TODO: Backend integration - Start study session
    // POST /api/study-sessions/start
    // {
    //   mission_id: "today_mission_001",
    //   started_at: new Date().toISOString()
    // }
  }

  const incompleteTasks = tasks.filter(t => !t.completed)

  return (
    <Card className="p-3 shadow-lg border relative overflow-hidden" style={{ borderColor: 'oklch(0.70 0.18 210)' }}>
      <div className="relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <motion.div
              className="p-2 rounded-lg shadow-lg flex-shrink-0"
              style={{
                background: 'oklch(0.70 0.18 210)'
              }}
              whileHover={{ scale: 1.02, rotate: 5 }}
            >
              <Target className="h-5 w-5 text-white" />
            </motion.div>
            <h2 className="font-semibold text-sm sm:text-base truncate">{title}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs px-4 py-2 rounded-full shadow-md flex-shrink-0" style={{ backgroundColor: 'oklch(0.94 0.10 30)' }}>
            <Clock className="h-4 w-4 flex-shrink-0" style={{ color: 'oklch(0.75 0.20 30)' }} />
            <span className="font-medium whitespace-nowrap" style={{ color: 'oklch(0.75 0.20 30)' }}>~{duration} min</span>
          </div>
        </div>

        {/* Task List - Vibrant color coding */}
        <div className="space-y-1.5 mb-3">
          {incompleteTasks.map((task) => (
            <motion.div
              key={task.id}
              className="flex items-start gap-2 p-3 rounded-lg transition-all hover:scale-[1.01]"
              style={{ backgroundColor: 'oklch(0.94 0.12 15)' }}
              whileHover={{ x: 4 }}
            >
              <div className="h-3 w-3 rounded-full flex-shrink-0 shadow-md mt-0.5" style={{ backgroundColor: 'oklch(0.68 0.25 15)' }} />
              <span className="text-sm leading-relaxed break-words">{task.description}</span>
            </motion.div>
          ))}
        </div>

        {/* 🎯 PRIMARY CTA - Flat design, NO GRADIENT */}
        <motion.button
          onClick={handleStartStudying}
          disabled={isStarting}
          className="w-full h-10 sm:h-12 rounded-xl font-bold text-sm sm:text-base shadow-2xl text-white"
          style={{
            background: isStarting
              ? 'oklch(0.62 0.22 25)'
              : 'oklch(0.75 0.20 30)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isStarting ? 'Starting...' : 'Start Studying 🚀'}
        </motion.button>

        {/* Progress hint */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground whitespace-nowrap">{incompleteTasks.length} objectives remaining</span>
          <span className="font-semibold px-4 py-2 rounded-full whitespace-nowrap" style={{
            backgroundColor: 'oklch(0.94 0.10 145)',
            color: 'oklch(0.75 0.20 145)'
          }}>
            {Math.round(readiness * 100)}% ready
          </span>
        </div>
      </div>
    </Card>
  );
}

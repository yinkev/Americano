'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check, Target } from 'lucide-react'

/**
 * Goal Progress Component with Milestone Markers
 *
 * Behavioral Psychology: Goal Gradient Effect (Clark Hull)
 * - Progress visualization increases completion by 18-35%
 * - Milestone markers create sub-goals, reducing perceived effort
 * - Color transitions provide motivational feedback
 * - Research: People accelerate effort as they approach goals
 */

interface Milestone {
  percentage: number
  label?: string
  reached?: boolean
}

interface GoalProgressProps {
  current: number
  goal: number
  label?: string
  milestones?: Milestone[]
  color?: string
  showPercentage?: boolean
  height?: 'sm' | 'md' | 'lg'
}

const HEIGHT_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
}

export function GoalProgress({
  current,
  goal,
  label,
  milestones = [],
  color = 'var(--xp-purple)',
  showPercentage = true,
  height = 'md',
}: GoalProgressProps) {
  const percentage = Math.min((current / goal) * 100, 100)

  // Auto-generate milestones if not provided
  const defaultMilestones: Milestone[] = milestones.length > 0
    ? milestones
    : [
        { percentage: 25, label: '25%', reached: percentage >= 25 },
        { percentage: 50, label: '50%', reached: percentage >= 50 },
        { percentage: 75, label: '75%', reached: percentage >= 75 },
        { percentage: 100, label: 'Goal!', reached: percentage >= 100 },
      ]

  // Determine progress bar color based on proximity to goal
  const getProgressColor = () => {
    if (percentage >= 100) return 'oklch(0.75 0.20 145)' // Success green
    if (percentage >= 80) return 'oklch(0.75 0.20 30)' // Warning orange
    return color // Default color
  }

  return (
    <div className="w-full">
      {/* Header with label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-bold" style={{ color: getProgressColor() }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress bar container */}
      <div className="relative">
        {/* Background track */}
        <div className={`w-full bg-muted rounded-full overflow-hidden ${HEIGHT_CLASSES[height]}`}>
          {/* Animated progress fill */}
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getProgressColor() }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          {defaultMilestones.map((milestone, idx) => (
            <div
              key={idx}
              className="absolute flex flex-col items-center"
              style={{ left: `${milestone.percentage}%`, transform: 'translateX(-50%)' }}
            >
              {/* Marker dot */}
              <motion.div
                className={`w-2 h-2 rounded-full border-2 ${
                  milestone.reached
                    ? 'bg-white shadow-md'
                    : 'bg-muted'
                }`}
                style={{
                  borderColor: milestone.reached ? getProgressColor() : 'var(--muted)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * idx }}
              >
                {/* Checkmark for reached milestones */}
                {milestone.reached && milestone.percentage <= percentage && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.2 + 0.1 * idx }}
                  >
                    <Check className="h-3 w-3" style={{ color: getProgressColor() }} />
                  </motion.div>
                )}
              </motion.div>

              {/* Milestone label (optional) */}
              {milestone.label && (
                <span
                  className="text-[10px] mt-1 font-medium whitespace-nowrap"
                  style={{
                    color: milestone.reached ? getProgressColor() : 'var(--muted-foreground)',
                  }}
                >
                  {milestone.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Motivational message based on progress */}
      {percentage >= 80 && percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 mt-1 text-xs font-medium"
          style={{ color: getProgressColor() }}
        >
          <Target className="h-3 w-3" />
          <span>Almost there! {goal - current} left to goal</span>
        </motion.div>
      )}

      {percentage >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-1 mt-1 text-xs font-bold"
          style={{ color: getProgressColor() }}
        >
          <Check className="h-3 w-3" />
          <span>Goal reached! 🎉</span>
        </motion.div>
      )}
    </div>
  )
}

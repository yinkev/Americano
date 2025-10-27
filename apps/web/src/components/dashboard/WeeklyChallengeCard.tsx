'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Trophy, CheckCircle, Circle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

/**
 * Weekly Challenge Card
 *
 * Displays current weekly challenges and progress
 * Gamification element to drive engagement
 */
export function WeeklyChallengeCard() {
  // Mock data - replace with real data from API
  const challenges = [
    {
      id: 1,
      title: 'Study 5 days this week',
      progress: 3,
      target: 5,
      completed: false,
      reward: '100 XP',
    },
    {
      id: 2,
      title: 'Complete 50 cards',
      progress: 38,
      target: 50,
      completed: false,
      reward: '150 XP',
    },
    {
      id: 3,
      title: 'Maintain 7-day streak',
      progress: 7,
      target: 7,
      completed: true,
      reward: '200 XP',
    },
  ]

  const completedCount = challenges.filter((c) => c.completed).length
  const progressPercent = (completedCount / challenges.length) * 100

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-lg">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Weekly Challenges
          </CardTitle>
          <Badge
            variant="secondary"
            className="bg-success/10 text-success border-success/20"
          >
            {completedCount}/{challenges.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Overall progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Challenge Progress
            </span>
            <span className="text-sm font-bold text-primary">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Individual challenges */}
        <div className="space-y-3">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="mt-0.5">
                {challenge.completed ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-relaxed ${
                    challenge.completed
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }`}
                >
                  {challenge.title}
                </p>

                {!challenge.completed && (
                  <div className="mt-1">
                    <Progress
                      value={(challenge.progress / challenge.target) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {challenge.progress} / {challenge.target}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs py-0 ${
                      challenge.completed
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-energy/10 text-energy border-energy/20'
                    }`}
                  >
                    {challenge.reward}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Time remaining */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Resets in 3 days</span>
        </div>
      </CardContent>
    </Card>
  )
}

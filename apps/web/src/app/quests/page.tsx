'use client'

import { useState } from 'react'
import { Trophy, Zap, Star, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

const quests = [
  {
    id: 1,
    title: 'First Steps',
    description: 'Complete your first study session.',
    reward: 50,
    progress: 100,
    icon: <Star className="w-8 h-8 text-yellow-400" />
  },
  {
    id: 2,
    title: 'Knowledge Builder',
    description: 'Review 50 flashcards.',
    reward: 100,
    progress: 75,
    icon: <Zap className="w-8 h-8 text-blue-500" />
  },
  {
    id: 3,
    title: 'Master of Anatomy',
    description: 'Achieve 90% accuracy in the Cardiovascular System deck.',
    reward: 250,
    progress: 20,
    icon: <ShieldCheck className="w-8 h-8 text-green-500" />
  },
  {
    id: 4,
    title: 'Consistent Learner',
    description: 'Maintain a 7-day study streak.',
    reward: 150,
    progress: 0,
    icon: <Trophy className="w-8 h-8 text-amber-500" />
  },
]

export default function QuestsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-heading font-bold">Quests</h1>
                <p className="text-lg text-muted-foreground">Complete challenges to earn rewards and level up!</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quests.map(quest => (
          // I would add a motion.div here for a playful entrance animation
          <Card key={quest.id} className="p-6 bg-card  border-border/50 shadow-none rounded-xl flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-card rounded-xl">
                    {quest.icon}
                </div>
                <div>
                    <h3 className="text-2xl font-heading font-bold">{quest.title}</h3>
                    <p className="text-md text-muted-foreground">{quest.description}</p>
                </div>
            </div>
            <div className="space-y-3">
                <Progress value={quest.progress} />
                <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{quest.progress}%</span>
                    <Badge className="text-lg font-bold px-4 py-2 rounded-full bg-card text-amber-500 border-2 border-amber-500/20">{quest.reward} XP</Badge>
                </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

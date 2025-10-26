'use client'

import { Badge } from '@/components/ui/badge'
import { Target, CheckCircle2, Circle, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface MissionObjective {
  objectiveId: string
  objective?: {
    id: string
    objective: string
    complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
    isHighYield: boolean
  }
  estimatedMinutes: number
  completed: boolean
}

interface MissionProgressHeaderProps {
  objectives: MissionObjective[]
  currentObjectiveIndex: number
  estimatedTotalMinutes: number
}

export function MissionProgressHeader({
  objectives,
  currentObjectiveIndex,
  estimatedTotalMinutes,
}: MissionProgressHeaderProps) {
  const completedCount = objectives.filter((obj) => obj.completed).length
  const totalCount = objectives.length
  const percentComplete = Math.round((completedCount / totalCount) * 100)

  const remainingMinutes = objectives
    .filter((obj) => !obj.completed)
    .reduce((sum, obj) => sum + obj.estimatedMinutes, 0)

  return (
    // I would add a motion.div here for a playful entrance animation
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Zap className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-heading font-bold">Mission Progress</h2>
          </div>
          <Badge className="text-lg font-bold px-4 py-2 rounded-full bg-card text-primary border-2 border-primary/20">
            {completedCount} / {totalCount} Completed
          </Badge>
        </div>

        <div className="space-y-2">
            {/* I would add a motion.div here to animate the progress bar */}
          <div className="w-full bg-muted rounded-full h-5 shadow-none">
            <div
              className="h-5 rounded-full transition-all duration-500 ease-out bg-card"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-md font-semibold text-muted-foreground">
            <span>{percentComplete}% Complete</span>
            <span>~{remainingMinutes}m Remaining</span>
          </div>
        </div>

        <div className="space-y-3">
          {objectives.map((obj, index) => {
            const isCurrent = index === currentObjectiveIndex
            const isCompleted = obj.completed

            return (
                // I would add a motion.div here for a playful hover effect
              <div
                key={obj.objectiveId}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${isCurrent ? 'bg-card ring-4 ring-primary/30' : isCompleted ? 'bg-card opacity-60' : 'bg-card'}`}>
                <div className={`flex-shrink-0 size-10 rounded-full flex items-center justify-center font-bold text-xl ${isCompleted ? 'bg-card text-success' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-card text-primary'}`}>
                  {isCompleted ? <CheckCircle2 size={24} /> : index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-lg font-semibold ${isCompleted ? 'line-through' : ''}`}>
                        {obj.objective?.objective || 'Unknown objective'}
                    </p>
                </div>
                <Badge variant={isCurrent ? 'default' : 'secondary'} className="text-md font-semibold px-3 py-1 rounded-full">
                  {obj.estimatedMinutes} min
                </Badge>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

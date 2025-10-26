'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Clock, BookOpen, TrendingUp, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface PriorityObjective {
  id: string
  title: string
  priorityScore: number
  priorityExplanation: {
      reasoning: string
  }
}

interface PrioritiesClientProps {
  priorities: PriorityObjective[]
}

const mockPriorities: PriorityObjective[] = [
    { id: '1', title: 'Master the Krebs Cycle', priorityScore: 0.92, priorityExplanation: { reasoning: 'High-yield topic for upcoming exams and foundational for metabolic pathways.' } },
    { id: '2', title: 'Understand the Renin-Angiotensin-Aldosterone System', priorityScore: 0.85, priorityExplanation: { reasoning: 'Crucial for understanding blood pressure regulation and pharmacology.' } },
    { id: '3', title: 'Differentiate between gram-positive and gram-negative bacteria', priorityScore: 0.78, priorityExplanation: { reasoning: 'Fundamental concept in microbiology with clinical implications.' } },
]

export function PrioritiesClient({ priorities = mockPriorities }: PrioritiesClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {priorities.map((item, index) => {
        const isExpanded = expandedId === item.id
        const priorityPercent = Math.round(item.priorityScore * 100)

        return (
          // I would add a motion.div here for a playful entrance animation
          <Card key={item.id} className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
            <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                    {/* I would use a motion.div here to animate the progress circle */}
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-muted/30" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle
                            className="text-primary"                            strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 45 * (priorityPercent / 100)} ${2 * Math.PI * 45}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary">{priorityPercent}</div>
                </div>
              <div className="flex-1">
                <h3 className="text-2xl font-heading font-bold mb-2">{item.title}</h3>
                <p className="text-lg text-muted-foreground">{item.priorityExplanation.reasoning}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full w-14 h-14" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                {isExpanded ? <ChevronUp className="w-8 h-8" /> : <ChevronDown className="w-8 h-8" />}
              </Button>
            </div>

            {isExpanded && (
                // I would add a motion.div here for a playful expand animation
              <div className="mt-6 pt-6 border-t-2 border-border/50">
                <p className="text-lg font-semibold">Details and recommendations placeholder.</p>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

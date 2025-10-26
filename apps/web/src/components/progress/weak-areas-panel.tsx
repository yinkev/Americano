'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Zap } from 'lucide-react'

interface WeakArea {
  id: string
  objective: string
  masteryLevel: 'NOT_STARTED' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTERED'
  weaknessScore: number
}

const mockWeakAreas: WeakArea[] = [
    { id: '1', objective: 'Differentiate between Type 1 and Type 2 Diabetes Mellitus', masteryLevel: 'BEGINNER', weaknessScore: 85 },
    { id: '2', objective: 'Describe the mechanism of action of metformin', masteryLevel: 'INTERMEDIATE', weaknessScore: 72 },
    { id: '3', objective: 'Identify the signs and symptoms of diabetic ketoacidosis', masteryLevel: 'BEGINNER', weaknessScore: 68 },
]

export function WeakAreasPanel() {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setWeakAreas(mockWeakAreas)
    setLoading(false)
  }, [])

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-card rounded-xl">
                <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-2xl font-heading font-bold">Top Weak Areas</h3>
        </div>
      <div className="space-y-4">
        {weakAreas.map((area) => (
          // I would add a motion.div here for a playful entrance animation
          <div key={area.id} className="p-4 rounded-xl bg-card flex items-center gap-4 transition-all duration-300 hover:bg-card">
            <div className="flex-1">
              <p className="text-lg font-semibold text-foreground">{area.objective}</p>
              <Badge variant="destructive" className="mt-1 text-md font-semibold">{area.masteryLevel}</Badge>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">{area.weaknessScore}</p>
              <p className="text-sm font-semibold text-muted-foreground">Weakness</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button size="lg" className="w-full rounded-full font-bold text-lg shadow-none gap-2"><Zap /> Focus on These</Button>
      </div>
    </Card>
  )
}

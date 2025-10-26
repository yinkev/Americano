'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BookOpen, ChevronLeft, ChevronRight, Target, Zap, Lightbulb } from 'lucide-react'

interface LearningObjective {
  id: string
  objective: string
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  pageStart?: number
  pageEnd?: number
  isHighYield: boolean
  boardExamTags: string[]
  lecture: {
    id: string
    title: string
    courseId: string
    course: {
      name: string
    }
  }
}

interface ObjectiveContentPanelProps {
  objective: LearningObjective
}

export function ObjectiveContentPanel({ objective }: ObjectiveContentPanelProps) {
  const [activeTab, setActiveTab] = useState('reading')

  return (
    // I would add a motion.div here for a playful entrance animation
    <Card className="p-8 bg-card  border-border/50 shadow-none rounded-xl">
      <div className="flex items-start gap-6 mb-8">
        <div className="p-3 bg-card rounded-xl">
            <Target className="w-10 h-10 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-heading font-bold text-foreground">{objective.objective}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="text-md font-semibold px-4 py-2 rounded-full bg-card text-primary border-2 border-primary/20">{objective.complexity}</Badge>
            {objective.isHighYield && <Badge className="text-md font-semibold px-4 py-2 rounded-full bg-card text-amber-500 border-2 border-amber-500/20">⭐ High-Yield</Badge>}
            {objective.boardExamTags.map(tag => <Badge key={tag} variant="secondary" className="text-md font-semibold px-4 py-2 rounded-full">{tag}</Badge>)}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b-2 border-border/50">
        <Button variant={activeTab === 'reading' ? 'ghost' : 'ghost'} onClick={() => setActiveTab('reading')} className={`text-xl font-bold rounded-t-lg ${activeTab === 'reading' ? 'border-b-4 border-primary text-primary' : 'text-muted-foreground'}`}>Focused Reading</Button>
        <Button variant={activeTab === 'tips' ? 'ghost' : 'ghost'} onClick={() => setActiveTab('tips')} className={`text-xl font-bold rounded-t-lg ${activeTab === 'tips' ? 'border-b-4 border-primary text-primary' : 'text-muted-foreground'}`}>Study Tips</Button>
      </div>

      {/* I would add a motion.div here to animate the tab content change */}
      <div>
        {activeTab === 'reading' && (
          <div className="space-y-4">
            <p className="text-lg leading-relaxed">This is where the focused reading content for the objective will be displayed. It will be fetched from the lecture content and highlighted with the key terms from the objective.</p>
            <div className="flex justify-between items-center pt-4">
                <Button variant="outline" className="rounded-full text-lg px-6 py-3 gap-2"><ChevronLeft /> Previous</Button>
                <p className="text-lg font-semibold">Page 1 of 3</p>
                <Button className="rounded-full text-lg px-6 py-3 gap-2">Next <ChevronRight /></Button>
            </div>
          </div>
        )}
        {activeTab === 'tips' && (
          <div className="space-y-4 text-lg">
            <div className="flex items-start gap-3"><Lightbulb className="w-6 h-6 text-amber-500 mt-1" /> <p>Break down the objective into smaller, manageable parts.</p></div>
            <div className="flex items-start gap-3"><Lightbulb className="w-6 h-6 text-amber-500 mt-1" /> <p>Try to explain the concept in your own words to a friend.</p></div>
            <div className="flex items-start gap-3"><Lightbulb className="w-6 h-6 text-amber-500 mt-1" /> <p>Create a mind map to visualize the connections between different concepts.</p></div>
          </div>
        )}
      </div>

    </Card>
  )
}

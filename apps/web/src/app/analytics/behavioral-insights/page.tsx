'use client'

import { useState } from 'react'
import { Brain, TrendingUp, Target, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Behavioral insights components
import { LearningPatternsGrid } from '@/components/analytics/behavioral-insights/learning-patterns-grid'
import { PatternEvolutionTimeline } from '@/components/analytics/behavioral-insights/pattern-evolution-timeline'
import { PerformanceCorrelationChart } from '@/components/analytics/behavioral-insights/performance-correlation-chart'
import { BehavioralGoalsSection } from '@/components/analytics/behavioral-insights/behavioral-goals-section'
import { RecommendationsPanel } from '@/components/analytics/behavioral-insights/recommendations-panel'

export default function NewBehavioralInsightsPage() {
  const [activeTab, setActiveTab] = useState('patterns')

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Brain className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-heading font-bold">Behavioral Insights</h1>
                <p className="text-lg text-muted-foreground">Discover your unique learning style.</p>
            </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto bg-card rounded-full h-16 p-2">
          <TabsTrigger value="patterns" className="text-lg font-semibold rounded-full flex items-center gap-2"><Brain className="w-6 h-6" /> Patterns</TabsTrigger>
          <TabsTrigger value="evolution" className="text-lg font-semibold rounded-full flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Evolution</TabsTrigger>
          <TabsTrigger value="performance" className="text-lg font-semibold rounded-full flex items-center gap-2"><Target className="w-6 h-6" /> Performance</TabsTrigger>
          <TabsTrigger value="learn" className="text-lg font-semibold rounded-full flex items-center gap-2"><BookOpen className="w-6 h-6" /> Learn</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
            <LearningPatternsGrid />
        </TabsContent>
        <TabsContent value="evolution">
            <PatternEvolutionTimeline />
        </TabsContent>
        <TabsContent value="performance">
            <div className="grid grid-cols-2 gap-6">
                <PerformanceCorrelationChart />
                <BehavioralGoalsSection />
            </div>
        </TabsContent>
        <TabsContent value="learn">
            <RecommendationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Behavioral Insights Dashboard
 *
 * 4-tab dashboard showing:
 * - Patterns: Learning patterns and evolution timeline
 * - Progress: Behavioral metrics and performance correlation
 * - Goals: Active goals and goal creation
 * - Learn: Learning science education content
 *
 * Story 5.6: Behavioral Insights Dashboard - Task 1 & 6 (Dashboard Foundation)
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Brain, TrendingUp, Target, BookOpen } from 'lucide-react'

export default function BehavioralInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('patterns')

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Behavioral Insights</h1>
        <p className="text-muted-foreground">
          Understand your learning patterns and optimize your study habits
        </p>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="learn" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Learn</span>
          </TabsTrigger>
        </TabsList>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Learning Patterns</h2>
            <p className="text-muted-foreground mb-6">
              Discover your unique learning patterns and see how they evolve over time
            </p>

            {/* Placeholder for LearningPatternsGrid */}
            <Card className="p-6 bg-white/80 backdrop-blur-md">
              <div className="text-center text-muted-foreground py-12">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>LearningPatternsGrid component will be loaded here</p>
                <p className="text-sm mt-2">2×2 pattern cards with confidence indicators</p>
              </div>
            </Card>

            {/* Pattern Evolution Timeline Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Pattern Evolution</h3>
              <p className="text-muted-foreground mb-4">
                Track how your learning patterns have changed over time
              </p>

              {/* Placeholder for PatternEvolutionTimeline */}
              <Card className="p-6 bg-white/80 backdrop-blur-md">
                <div className="text-center text-muted-foreground py-12">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>PatternEvolutionTimeline component will be loaded here</p>
                  <p className="text-sm mt-2">Horizontal timeline showing pattern changes</p>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Progress</h2>
            <p className="text-muted-foreground mb-6">
              Track your behavioral metrics and see how they correlate with academic performance
            </p>

            <Card className="p-6 bg-white/80 backdrop-blur-md">
              <div className="text-center text-muted-foreground py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Progress components coming in Phase 2</p>
                <p className="text-sm mt-2">Metrics cards, correlation charts, and milestones</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Behavioral Goals</h2>
            <p className="text-muted-foreground mb-6">
              Set and track goals to improve your learning habits
            </p>

            <Card className="p-6 bg-white/80 backdrop-blur-md">
              <div className="text-center text-muted-foreground py-12">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Goals components coming in Phase 2</p>
                <p className="text-sm mt-2">Goal creation, tracking, and achievement badges</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Learn Tab */}
        <TabsContent value="learn" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Learning Science</h2>
            <p className="text-muted-foreground mb-6">
              Understand the science behind effective learning
            </p>

            <Card className="p-6 bg-white/80 backdrop-blur-md">
              <div className="text-center text-muted-foreground py-12">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Learning science articles coming in Phase 2</p>
                <p className="text-sm mt-2">5 articles with personalized insights</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

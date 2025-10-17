/**
 * Behavioral Insights Dashboard
 *
 * 4-tab dashboard showing:
 * - Tab 1 "Patterns": Learning patterns grid and evolution timeline
 * - Tab 2 "Evolution": Pattern evolution timeline (standalone)
 * - Tab 3 "Performance": Performance correlation chart and behavioral goals
 * - Tab 4 "Learn": Recommendations panel and learning article reader
 *
 * Story 5.6: Behavioral Insights Dashboard - Main Integration Page
 */

'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, TrendingUp, Target, BookOpen } from 'lucide-react'
import {
  LearningPatternsGrid,
  PatternEvolutionTimeline,
  PerformanceCorrelationChart,
  BehavioralGoalsSection,
  RecommendationsPanel,
  LearningArticleReader,
} from '@/components/analytics/behavioral-insights'

// Mock user ID - replace with actual auth
const MOCK_USER_ID = 'user-1'

export default function BehavioralInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('patterns')

  // Mock data for existing components (replace with real API calls)
  const mockPatterns = [
    {
      id: '1',
      patternType: 'OPTIMAL_STUDY_TIME' as const,
      confidence: 0.85,
      metadata: { optimalTimes: ['8:00-10:00 AM', '2:00-4:00 PM'] },
      lastSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      patternType: 'SESSION_DURATION_PREFERENCE' as const,
      confidence: 0.72,
      metadata: { optimalDuration: 45 },
      lastSeenAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      patternType: 'ATTENTION_CYCLE' as const,
      confidence: 0.68,
      metadata: { cycleLength: 25 },
      lastSeenAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      patternType: 'FORGETTING_CURVE' as const,
      confidence: 0.91,
      metadata: { halfLife: 7 },
      lastSeenAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const mockEvolutionData = [
    {
      weekNumber: 1,
      weekStart: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000).toISOString(),
      patterns: [
        {
          id: '1',
          patternType: 'OPTIMAL_STUDY_TIME' as const,
          confidence: 0.5,
          metadata: {},
          status: 'new' as const,
        },
      ],
    },
    {
      weekNumber: 2,
      weekStart: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
      patterns: [
        {
          id: '1',
          patternType: 'OPTIMAL_STUDY_TIME' as const,
          confidence: 0.65,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '2',
          patternType: 'SESSION_DURATION_PREFERENCE' as const,
          confidence: 0.6,
          metadata: {},
          status: 'new' as const,
        },
      ],
    },
    {
      weekNumber: 3,
      weekStart: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      patterns: [
        {
          id: '1',
          patternType: 'OPTIMAL_STUDY_TIME' as const,
          confidence: 0.75,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '2',
          patternType: 'SESSION_DURATION_PREFERENCE' as const,
          confidence: 0.7,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '4',
          patternType: 'FORGETTING_CURVE' as const,
          confidence: 0.8,
          metadata: {},
          status: 'new' as const,
        },
      ],
    },
    {
      weekNumber: 4,
      weekStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      patterns: [
        {
          id: '1',
          patternType: 'OPTIMAL_STUDY_TIME' as const,
          confidence: 0.82,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '2',
          patternType: 'SESSION_DURATION_PREFERENCE' as const,
          confidence: 0.68,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '3',
          patternType: 'ATTENTION_CYCLE' as const,
          confidence: 0.65,
          metadata: {},
          status: 'new' as const,
        },
        {
          id: '4',
          patternType: 'FORGETTING_CURVE' as const,
          confidence: 0.88,
          metadata: {},
          status: 'existing' as const,
        },
      ],
    },
    {
      weekNumber: 5,
      weekStart: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
      weekEnd: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      patterns: [
        {
          id: '1',
          patternType: 'OPTIMAL_STUDY_TIME' as const,
          confidence: 0.85,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '2',
          patternType: 'SESSION_DURATION_PREFERENCE' as const,
          confidence: 0.72,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '3',
          patternType: 'ATTENTION_CYCLE' as const,
          confidence: 0.68,
          metadata: {},
          status: 'existing' as const,
        },
        {
          id: '4',
          patternType: 'FORGETTING_CURVE' as const,
          confidence: 0.91,
          metadata: {},
          status: 'existing' as const,
        },
      ],
    },
  ]

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
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Evolution</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="learn" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Learn</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Patterns */}
        <TabsContent value="patterns" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Learning Patterns</h2>
            <p className="text-muted-foreground mb-6">
              Discover your unique learning patterns detected from your study sessions
            </p>

            <LearningPatternsGrid patterns={mockPatterns} isLoading={false} />
          </div>
        </TabsContent>

        {/* Tab 2: Evolution */}
        <TabsContent value="evolution" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pattern Evolution</h2>
            <p className="text-muted-foreground mb-6">
              Track how your learning patterns have changed and evolved over time
            </p>

            <PatternEvolutionTimeline evolutionData={mockEvolutionData} isLoading={false} />
          </div>
        </TabsContent>

        {/* Tab 3: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Performance Analysis</h2>
            <p className="text-muted-foreground mb-6">
              See how your behavioral patterns impact academic performance and track your goals
            </p>

            <div className="space-y-6">
              {/* Performance Correlation Chart */}
              <PerformanceCorrelationChart userId={MOCK_USER_ID} isLoading={false} />

              {/* Behavioral Goals */}
              <BehavioralGoalsSection userId={MOCK_USER_ID} isLoading={false} />
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Learn */}
        <TabsContent value="learn" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Learning Science</h2>
            <p className="text-muted-foreground mb-6">
              Understand the science behind effective learning and get personalized recommendations
            </p>

            <div className="space-y-6">
              {/* Recommendations Panel */}
              <RecommendationsPanel userId={MOCK_USER_ID} isLoading={false} />

              {/* Learning Article Reader */}
              <LearningArticleReader userId={MOCK_USER_ID} isLoading={false} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

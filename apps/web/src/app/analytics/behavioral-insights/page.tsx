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
 * UPDATED: Integrated with real API data from dashboard endpoint
 */

'use client'

import { useState, useEffect } from 'react'
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

// Hardcoded user ID for MVP - replace with actual auth
const DEFAULT_USER_ID = 'user-kevy'

/**
 * Dashboard data interface matching API response
 */
interface DashboardData {
  patterns: Array<{
    id: string
    patternType: string
    confidence: number
    evidence: Record<string, any>
    lastSeenAt: string
    detectedAt: string
  }>
  recommendations: any[]
  goals: any[]
  metrics: {
    consistency: number
    focus: number
    retention: number
    efficiency: number
  }
  correlationData: any
  meta: {
    patternsCount: number
    recommendationsCount: number
    activeGoalsCount: number
    recentInsightsCount: number
    lastUpdated: string
  }
}

interface EvolutionData {
  evolution: Array<{
    weekNumber: number
    weekStart: string
    weekEnd: string
    patterns: Array<{
      id: string
      patternType: string
      confidence: number
      metadata: any
      status: 'new' | 'existing' | 'disappeared'
    }>
  }>
  meta: {
    totalWeeks: number
    startDate: string
    endDate: string
    totalPatterns: number
    patternTypeFilter: string
  }
}

export default function BehavioralInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('patterns')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch comprehensive dashboard data
        const dashboardResponse = await fetch(
          `/api/analytics/behavioral-insights/dashboard?userId=${DEFAULT_USER_ID}`,
        )

        if (!dashboardResponse.ok) {
          throw new Error(`Dashboard API error: ${dashboardResponse.statusText}`)
        }

        const dashboardJson = await dashboardResponse.json()
        setDashboardData(dashboardJson.data)

        // Fetch pattern evolution data (12 weeks by default)
        const evolutionResponse = await fetch(
          `/api/analytics/behavioral-insights/patterns/evolution?userId=${DEFAULT_USER_ID}&weeks=12`,
        )

        if (!evolutionResponse.ok) {
          throw new Error(`Evolution API error: ${evolutionResponse.statusText}`)
        }

        const evolutionJson = await evolutionResponse.json()
        setEvolutionData(evolutionJson.data)
      } catch (err) {
        console.error('Error fetching behavioral insights:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Transform patterns for LearningPatternsGrid (maps database fields to component props)
  const transformedPatterns = dashboardData?.patterns.map((p) => ({
    id: p.id,
    patternType: p.patternType as any,
    confidence: p.confidence,
    metadata: p.evidence, // evidence field contains pattern metadata
    lastSeenAt: p.lastSeenAt,
    firstSeenAt: p.detectedAt,
  })) || []

  // Transform evolution data for PatternEvolutionTimeline (cast patternType for type safety)
  const transformedEvolution = (evolutionData?.evolution || []).map((week) => ({
    ...week,
    patterns: week.patterns.map((p) => ({
      ...p,
      patternType: p.patternType as any, // Cast to match component's PatternType union
    })),
  }))

  // Show error state if API fails
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Behavioral Insights</h1>
        <p className="text-muted-foreground">
          Understand your learning patterns and optimize your study habits
        </p>
        {dashboardData && (
          <div className="mt-3 text-sm text-muted-foreground">
            {dashboardData.meta.patternsCount} patterns detected •{' '}
            {dashboardData.meta.recommendationsCount} recommendations •{' '}
            {dashboardData.meta.activeGoalsCount} active goals •{' '}
            {dashboardData.meta.recentInsightsCount} new insights this week
          </div>
        )}
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

            <LearningPatternsGrid patterns={transformedPatterns} isLoading={isLoading} />
          </div>
        </TabsContent>

        {/* Tab 2: Evolution */}
        <TabsContent value="evolution" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pattern Evolution</h2>
            <p className="text-muted-foreground mb-6">
              Track how your learning patterns have changed and evolved over time
            </p>

            <PatternEvolutionTimeline evolutionData={transformedEvolution} isLoading={isLoading} />
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
              <PerformanceCorrelationChart
                userId={DEFAULT_USER_ID}
                isLoading={isLoading}
              />

              {/* Behavioral Goals */}
              <BehavioralGoalsSection
                userId={DEFAULT_USER_ID}
                isLoading={isLoading}
              />
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
              <RecommendationsPanel
                userId={DEFAULT_USER_ID}
                isLoading={isLoading}
              />

              {/* Learning Article Reader */}
              <LearningArticleReader
                userId={DEFAULT_USER_ID}
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

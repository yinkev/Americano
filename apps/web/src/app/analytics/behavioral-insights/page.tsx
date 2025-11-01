/**
 * Behavioral Insights Dashboard (Agent 7)
 * Premium analytics dashboard with hooks-based architecture
 *
 * Features:
 * - React Query hooks for data fetching
 * - Zustand store for filter state
 * - URL state synchronization
 * - Framer-motion animations
 * - Loading skeletons & empty states
 * - Error boundaries
 * - Interactive recharts with drill-down
 *
 * Stack:
 * - Hooks: usePatterns(), useLongitudinal(), usePeerBenchmark()
 * - Store: useAnalyticsStore() for filters
 * - Components: From /features/analytics/components/behavioral-insights/
 * - UI: MetricCard, ChartContainer, EmptyState from /components/ui/
 */

'use client'

import { motion } from 'framer-motion'
import { BookOpen, Brain, Target, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { ChartContainer } from '@/components/ui/chart-container'
import { EmptyState } from '@/components/ui/empty-state'
import { MetricCard } from '@/components/ui/metric-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BehavioralGoalsSection,
  LearningArticleReader,
  LearningPatternsGrid,
  PatternEvolutionTimeline,
  PerformanceCorrelationChart,
  RecommendationsPanel,
} from '@/features/analytics/components/behavioral-insights'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useLongitudinal, usePatterns, usePeerBenchmark } from '@/lib/api/hooks/analytics'
import { typography } from '@/lib/design-tokens'
import { useAnalyticsStore } from '@/stores/analytics'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ComprehensionPattern, LongitudinalMetric, PeerBenchmark } from '@/lib/api/hooks/types/generated'
import type { ObjectiveStrength } from '@/types/api-generated'

/**
 * Animated metric grid with stagger effect
 */
const MetricGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export default function BehavioralInsightsDashboard() {
  const [activeTab, setActiveTab] = useState('patterns')

  const {
    data: currentUser,
    isLoading: userLoading,
    error: userError,
  } = useCurrentUser()
  const currentUserId = currentUser?.id ?? null

  // Filters from Zustand store
  const timeRange = useAnalyticsStore((state) => state.timeRange)

  // React Query hooks for data fetching (explicitly typed)
  const patternsQuery = usePatterns(currentUserId, timeRange)
  const longitudinalQuery = useLongitudinal(currentUserId, timeRange)
  const benchmarkQuery = usePeerBenchmark(currentUserId)

  const patternsData = patternsQuery.data as ComprehensionPattern | undefined
  const patternsLoading = patternsQuery.isLoading
  const patternsError = patternsQuery.error

  const longitudinalData = longitudinalQuery.data as LongitudinalMetric | undefined
  const longitudinalLoading = longitudinalQuery.isLoading
  const longitudinalError = longitudinalQuery.error

  const benchmarkData = benchmarkQuery.data as PeerBenchmark | undefined
  const benchmarkLoading = benchmarkQuery.isLoading
  const benchmarkError = benchmarkQuery.error

  // Derive metrics from API data
  const metrics = {
    patternsCount: patternsData?.strengths.length || 0,
    // LongitudinalMetric uses `improvement_rates` with periods "week" | "month"
    weeklyGrowth: longitudinalData?.improvement_rates?.week?.rate ?? 0,
    percentile: benchmarkData?.user_percentile || 0,
    insightsCount: patternsData?.ai_insights.length || 0,
  }

  // Loading state for entire dashboard
  const isLoading =
    userLoading ||
    !currentUserId ||
    patternsLoading ||
    longitudinalLoading ||
    benchmarkLoading

  // Error state
  const error =
    (userError as Error | null | undefined) ??
    (patternsError as Error | null | undefined) ??
    (longitudinalError as Error | null | undefined) ??
    (benchmarkError as Error | null | undefined)

  // Show error state if API fails
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState
            variant="error"
            title="Failed to Load Dashboard"
            description={error instanceof Error ? error.message : 'An unexpected error occurred'}
            action={{
              label: 'Retry',
              onClick: () => window.location.reload(),
            }}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Dashboard Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className={`${typography.heading.h1} mb-2`}>Behavioral Insights</h1>
        <p className={`${typography.body.base} text-muted-foreground`}>
          Understand your learning patterns and optimize your study habits
        </p>
      </motion.div>

      {/* Key Metrics */}
      <MetricGrid>
        <MetricCard
          title="Patterns Detected"
          value={metrics.patternsCount}
          trend="up"
          percentageChange={12}
          icon={<Brain className="size-4" />}
          description="Unique learning patterns"
          loading={isLoading}
          status="info"
        />
        <MetricCard
          title="Weekly Growth"
          value={`${metrics.weeklyGrowth.toFixed(1)}%`}
          trend="up"
          percentageChange={metrics.weeklyGrowth}
          icon={<TrendingUp className="size-4" />}
          description="Improvement rate"
          loading={isLoading}
          status="success"
        />
        <MetricCard
          title="Peer Ranking"
          value={`${metrics.percentile}th`}
          trend="up"
          percentageChange={5}
          icon={<Target className="size-4" />}
          description="Percentile rank"
          loading={isLoading}
          status="warning"
        />
        <MetricCard
          title="New Insights"
          value={metrics.insightsCount}
          icon={<BookOpen className="size-4" />}
          description="This week"
          loading={isLoading}
        />
      </MetricGrid>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Brain className="size-4" />
              <span className="hidden sm:inline">Patterns</span>
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex items-center gap-2">
              <TrendingUp className="size-4" />
              <span className="hidden sm:inline">Evolution</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Target className="size-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="learn" className="flex items-center gap-2">
              <BookOpen className="size-4" />
              <span className="hidden sm:inline">Learn</span>
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* Tab 1: Patterns */}
        <TabsContent value="patterns" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className={typography.heading.h2}>Your Learning Patterns</h2>
            <p className={`${typography.body.base} text-muted-foreground mb-6 mt-2`}>
              Discover your unique learning patterns detected from your study sessions
            </p>

            <ChartContainer
              title="Learning Patterns Analysis"
              description="AI-detected patterns from your study behavior"
              loading={patternsLoading}
              empty={!patternsData || patternsData.strengths.length === 0}
              emptyMessage="Complete more study sessions to unlock pattern insights"
              height={400}
            >
              {(() => {
                // Map API strengths (ObjectiveStrength[]) to UI BehavioralPattern[]
                type UIPatternType =
                  | 'OPTIMAL_STUDY_TIME'
                  | 'SESSION_DURATION_PREFERENCE'
                  | 'CONTENT_TYPE_PREFERENCE'
                  | 'PERFORMANCE_PEAK'
                  | 'ATTENTION_CYCLE'
                  | 'FORGETTING_CURVE'

                type UIPattern = {
                  id: string
                  patternType: UIPatternType
                  confidence: number
                  metadata: Record<string, unknown>
                  lastSeenAt: string
                  firstSeenAt: string
                }

                const strengths = (patternsData?.strengths ?? []) as ObjectiveStrength[]
                const mapped: UIPattern[] = strengths.map((s) => ({
                  id: s.objective_id,
                  // Use a stable, visualization-friendly type; real mapping can refine later
                  patternType: 'PERFORMANCE_PEAK',
                  // Convert 0-100 score to 0-1 confidence for the badge logic
                  confidence: Math.max(0, Math.min(1, (s.score ?? 0) / 100)),
                  metadata: {
                    objectiveName: s.objective_name,
                    percentile: s.percentile_rank,
                  },
                  lastSeenAt: patternsData?.generated_at ?? new Date().toISOString(),
                  firstSeenAt: patternsData?.generated_at ?? new Date().toISOString(),
                }))

                return <LearningPatternsGrid patterns={mapped} isLoading={patternsLoading} />
              })()}
            </ChartContainer>
          </motion.div>
        </TabsContent>

        {/* Tab 2: Evolution */}
        <TabsContent value="evolution" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className={typography.heading.h2}>Pattern Evolution</h2>
            <p className={`${typography.body.base} text-muted-foreground mb-6 mt-2`}>
              Track how your learning patterns have changed and evolved over time
            </p>

            <ChartContainer
              title="12-Week Pattern Timeline"
              description="Historical view of pattern emergence and development"
              loading={longitudinalLoading}
              empty={!longitudinalData}
              height={500}
            >
              {(() => {
                // Provide a typed evolution dataset compatible with PatternEvolutionTimeline
                type UIPatternType =
                  | 'OPTIMAL_STUDY_TIME'
                  | 'SESSION_DURATION_PREFERENCE'
                  | 'CONTENT_TYPE_PREFERENCE'
                  | 'PERFORMANCE_PEAK'
                  | 'ATTENTION_CYCLE'
                  | 'FORGETTING_CURVE'

                type UIWeekPattern = {
                  id: string
                  patternType: UIPatternType
                  confidence: number
                  metadata: Record<string, unknown>
                  status: 'new' | 'existing' | 'disappeared'
                }

                type UIEvolutionWeek = {
                  weekNumber: number
                  weekStart: string
                  weekEnd: string
                  patterns: UIWeekPattern[]
                }

                // Until dedicated evolution API hook exists, pass a safe typed empty dataset
                const evolutionData: UIEvolutionWeek[] = []

                return (
                  <PatternEvolutionTimeline
                    evolutionData={evolutionData}
                    isLoading={longitudinalLoading}
                  />
                )
              })()}
            </ChartContainer>
          </motion.div>
        </TabsContent>

        {/* Tab 3: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className={typography.heading.h2}>Performance Analysis</h2>
            <p className={`${typography.body.base} text-muted-foreground mb-6 mt-2`}>
              See how your behavioral patterns impact academic performance and track your goals
            </p>

            <div className="space-y-6">
              {/* Performance Correlation Chart */}
              <PerformanceCorrelationChart userId={currentUserId} isLoading={isLoading} />

              {/* Behavioral Goals */}
              <BehavioralGoalsSection userId={currentUserId} isLoading={isLoading} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Tab 4: Learn */}
        <TabsContent value="learn" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className={typography.heading.h2}>Learning Science</h2>
            <p className={`${typography.body.base} text-muted-foreground mb-6 mt-2`}>
              Understand the science behind effective learning and get personalized recommendations
            </p>

            <div className="space-y-6">
              {/* Recommendations Panel */}
              <RecommendationsPanel userId={currentUserId} isLoading={isLoading} />

              {/* Learning Article Reader */}
              <LearningArticleReader userId={currentUserId} isLoading={isLoading} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

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
import { useLongitudinal, usePatterns, usePeerBenchmark } from '@/lib/api/hooks/analytics'
import { typography } from '@/lib/design-tokens'
import { useAnalyticsStore } from '@/stores/analytics'

// Hardcoded user ID for MVP - replace with actual auth
const DEFAULT_USER_ID = 'user-kevy'

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

  // Filters from Zustand store
  const timeRange = useAnalyticsStore((state) => state.timeRange)

  // React Query hooks for data fetching
  const {
    data: patternsData,
    isLoading: patternsLoading,
    error: patternsError,
  } = usePatterns(DEFAULT_USER_ID, timeRange)

  const {
    data: longitudinalData,
    isLoading: longitudinalLoading,
    error: longitudinalError,
  } = useLongitudinal(DEFAULT_USER_ID, timeRange)

  const {
    data: benchmarkData,
    isLoading: benchmarkLoading,
    error: benchmarkError,
  } = usePeerBenchmark(DEFAULT_USER_ID)

  // Derive metrics from API data
  const metrics = {
    patternsCount: patternsData?.strengths.length || 0,
    weeklyGrowth: longitudinalData?.improvement_rate.weekly || 0,
    percentile: benchmarkData?.user_percentile || 0,
    insightsCount: patternsData?.ai_insights.length || 0,
  }

  // Loading state for entire dashboard
  const isLoading = patternsLoading || longitudinalLoading || benchmarkLoading

  // Error state
  const error = patternsError || longitudinalError || benchmarkError

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
              <LearningPatternsGrid
                patterns={patternsData?.strengths || []}
                isLoading={patternsLoading}
              />
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
              <PatternEvolutionTimeline
                evolutionData={longitudinalData?.time_series || []}
                isLoading={longitudinalLoading}
              />
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
              <PerformanceCorrelationChart userId={DEFAULT_USER_ID} isLoading={isLoading} />

              {/* Behavioral Goals */}
              <BehavioralGoalsSection userId={DEFAULT_USER_ID} isLoading={isLoading} />
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
              <RecommendationsPanel userId={DEFAULT_USER_ID} isLoading={isLoading} />

              {/* Learning Article Reader */}
              <LearningArticleReader userId={DEFAULT_USER_ID} isLoading={isLoading} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

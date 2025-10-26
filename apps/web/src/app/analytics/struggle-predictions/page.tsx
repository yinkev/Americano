/**
 * Struggle Predictions Dashboard
 * Story 5.2 Task 10.1
 * Wave 3: Enhanced with design tokens and Wave 3 micro-interactions
 *
 * Displays upcoming challenges, interventions, accuracy trends, and success metrics
 * Updated with Timeline and Model Performance components
 * Progressive loading with Suspense boundaries for optimal UX
 *
 * Design: OKLCH colors, glassmorphism, NO gradients (per CLAUDE.md)
 * Animations: Wave 3 micro-interactions with motion.dev patterns
 */

import { Suspense } from 'react'
import { AlertTriangle, TrendingUp, Target, MessageSquare, Calendar } from 'lucide-react'
import { AnalyticsCardSkeleton, ChartSkeleton, TimelineSkeleton } from '@/components/skeletons'
import { StrugglePredictionCard } from '@/components/analytics/struggle-prediction-card'
import { InterventionRecommendationPanel } from '@/components/analytics/intervention-recommendation-panel'
import { PredictionAccuracyChart } from '@/components/analytics/prediction-accuracy-chart'
import { StruggleReductionMetrics } from '@/components/analytics/struggle-reduction-metrics'
import { StruggleRiskTimeline } from '@/components/analytics/struggle-risk-timeline'
import { ModelPerformanceMetrics } from '@/components/analytics/model-performance-metrics'
import { typography, colors } from '@/lib/design-tokens'

export default function StrugglePredictionsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-xl transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: `color-mix(in oklch, ${colors.alert}, transparent 90%)` }}
          >
            <AlertTriangle className="size-6" style={{ color: colors.alert }} />
          </div>
          <h1 className={`${typography.heading.h1} text-foreground`}>
            Upcoming Challenges & Interventions
          </h1>
        </div>
        <p className={`${typography.body.base} text-muted-foreground`}>
          Proactive support to help you succeed before difficulties become problems
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Active Predictions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5" style={{ color: colors.alert }} />
              <h2 className={`${typography.heading.h2} text-foreground`}>Active Predictions</h2>
              <span className={`ml-auto ${typography.body.small} text-muted-foreground`}>
                Next 7 days
              </span>
            </div>
            <Suspense fallback={<AnalyticsCardSkeleton showChart={false} />}>
              <ActivePredictions />
            </Suspense>
          </section>

          {/* Section 3: Accuracy Trends */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5" style={{ color: colors.clinical }} />
              <h2 className={`${typography.heading.h2} text-foreground`}>
                Prediction Accuracy Trends
              </h2>
            </div>
            <Suspense fallback={<ChartSkeleton variant="line" height={384} />}>
              <PredictionAccuracyChart />
            </Suspense>
          </section>

          {/* Section 4: Struggle Risk Timeline */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5" style={{ color: colors.energy }} />
              <h2 className={`${typography.heading.h2} text-foreground`}>
                Upcoming Challenges Timeline
              </h2>
            </div>
            <Suspense fallback={<TimelineSkeleton variant="horizontal" items={7} />}>
              <StruggleRiskTimeline daysAhead={7} />
            </Suspense>
          </section>

          {/* Section 5: Struggle Reduction Metrics */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-5" style={{ color: colors.success }} />
              <h2 className={`${typography.heading.h2} text-foreground`}>
                Struggle Reduction Metrics
              </h2>
            </div>
            <Suspense fallback={<AnalyticsCardSkeleton showStats variant="wide" />}>
              <StruggleReductionMetrics />
            </Suspense>
          </section>

          {/* Section 6: Model Performance Metrics (Admin Only - Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-5" style={{ color: colors.clinical }} />
                <h2 className={`${typography.heading.h2} text-foreground`}>
                  Model Performance Analytics
                </h2>
              </div>
              <Suspense fallback={<ChartSkeleton variant="bar" height={384} showLegend />}>
                <ModelPerformanceMetrics isAdmin={true} />
              </Suspense>
            </section>
          )}
        </div>

        {/* Sidebar - Right 1 column */}
        <div className="space-y-6">
          {/* Section 2: Interventions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="size-5" style={{ color: colors.clinical }} />
              <h2 className={`${typography.heading.h2} text-foreground`}>
                Recommended Interventions
              </h2>
            </div>
            <Suspense fallback={<AnalyticsCardSkeleton variant="compact" />}>
              <InterventionRecommendationPanel />
            </Suspense>
          </section>

          {/* Section 5: Feedback */}
          <section>
            <div className="bg-card  rounded-xl shadow-none border border-border p-6 transition-all duration-300 hover:shadow-none">
              <h3 className={`${typography.heading.h3} text-foreground mb-3`}>
                Help Improve Predictions
              </h3>
              <p className={`${typography.body.small} text-muted-foreground mb-4`}>
                Your feedback helps us make better predictions for you and other students.
              </p>
              <div className="space-y-2">
                <div className={`flex items-center gap-2 ${typography.body.tiny} text-muted-foreground`}>
                  <div className="size-2 rounded-full" style={{ backgroundColor: colors.success }} />
                  <span>Prediction accuracy: 78%</span>
                </div>
                <div className={`flex items-center gap-2 ${typography.body.tiny} text-muted-foreground`}>
                  <div className="size-2 rounded-full" style={{ backgroundColor: colors.clinical }} />
                  <span>Improving with your feedback</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/**
 * Active Predictions Section
 * Fetches and displays upcoming struggle predictions
 */
async function ActivePredictions() {
  // TODO: Replace with actual API call when backend is ready
  // const response = await fetch('/api/analytics/predictions?status=active&minProbability=0.5', {
  //   headers: { 'X-User-Email': 'kevy@americano.dev' },
  //   cache: 'no-store',
  // });
  // const predictions = await response.json();

  // Mock data for MVP
  const mockPredictions = [
    {
      id: '1',
      topicName: 'Cardiac Electrophysiology',
      predictedStruggleProbability: 0.82,
      confidence: 0.89,
      predictedFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      features: {
        prerequisiteGap: 0.85,
        historicalStruggle: 0.75,
        contentComplexity: 0.9,
        retentionRate: 0.35,
      },
    },
    {
      id: '2',
      topicName: 'Renal Tubular Function',
      predictedStruggleProbability: 0.65,
      confidence: 0.78,
      predictedFor: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      features: {
        prerequisiteGap: 0.45,
        historicalStruggle: 0.68,
        contentComplexity: 0.75,
        retentionRate: 0.52,
      },
    },
    {
      id: '3',
      topicName: 'Immunology: T-Cell Activation',
      predictedStruggleProbability: 0.38,
      confidence: 0.72,
      predictedFor: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      features: {
        prerequisiteGap: 0.25,
        historicalStruggle: 0.42,
        contentComplexity: 0.68,
        retentionRate: 0.68,
      },
    },
  ]

  if (mockPredictions.length === 0) {
    return (
      <div className="bg-card  rounded-xl shadow-none border border-border p-6">
        <p className="text-sm text-muted-foreground text-center">
          No active predictions. Keep studying to build your learning profile!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {mockPredictions.map((prediction) => (
        <StrugglePredictionCard key={prediction.id} prediction={prediction} />
      ))}
    </div>
  )
}

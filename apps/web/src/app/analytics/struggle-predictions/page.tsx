/**
 * Struggle Predictions Dashboard
 * Story 5.2 Task 10.1
 * Wave 2: Enhanced with content-aware skeleton loading states
 *
 * Displays upcoming challenges, interventions, accuracy trends, and success metrics
 * Updated with Timeline and Model Performance components
 * Progressive loading with Suspense boundaries for optimal UX
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

export default function StrugglePredictionsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-[oklch(0.6_0.15_25)]/10">
            <AlertTriangle className="size-6 text-[oklch(0.6_0.15_25)]" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Upcoming Challenges & Interventions
          </h1>
        </div>
        <p className="text-muted-foreground">
          Proactive support to help you succeed before difficulties become problems
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1: Active Predictions */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="size-5 text-[oklch(0.6_0.15_25)]" />
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Active Predictions
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">Next 7 days</span>
            </div>
            <Suspense
              fallback={
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 h-48 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading predictions...</p>
                </div>
              }
            >
              <ActivePredictions />
            </Suspense>
          </section>

          {/* Section 3: Accuracy Trends */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-[oklch(0.7_0.15_230)]" />
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Prediction Accuracy Trends
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 h-96 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading accuracy data...</p>
                </div>
              }
            >
              <PredictionAccuracyChart />
            </Suspense>
          </section>

          {/* Section 4: Struggle Risk Timeline */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5 text-[oklch(0.646_0.222_41.116)]" />
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Upcoming Challenges Timeline
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 h-64 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading timeline...</p>
                </div>
              }
            >
              <StruggleRiskTimeline daysAhead={7} />
            </Suspense>
          </section>

          {/* Section 5: Struggle Reduction Metrics */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="size-5 text-[oklch(0.7_0.12_145)]" />
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Struggle Reduction Metrics
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 h-64 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading metrics...</p>
                </div>
              }
            >
              <StruggleReductionMetrics />
            </Suspense>
          </section>

          {/* Section 6: Model Performance Metrics (Admin Only - Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="size-5 text-[oklch(0.7_0.15_230)]" />
                <h2 className="text-xl font-heading font-semibold text-foreground">
                  Model Performance Analytics
                </h2>
              </div>
              <Suspense
                fallback={
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 h-96 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Loading model metrics...</p>
                  </div>
                }
              >
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
              <MessageSquare className="size-5 text-[oklch(0.7_0.15_230)]" />
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Recommended Interventions
              </h2>
            </div>
            <Suspense
              fallback={
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6 h-96 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading interventions...</p>
                </div>
              }
            >
              <InterventionRecommendationPanel />
            </Suspense>
          </section>

          {/* Section 5: Feedback */}
          <section>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-3">
                Help Improve Predictions
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your feedback helps us make better predictions for you and other students.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="size-2 rounded-full bg-[oklch(0.7_0.12_145)]" />
                  <span>Prediction accuracy: 78%</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="size-2 rounded-full bg-[oklch(0.7_0.15_230)]" />
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
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
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

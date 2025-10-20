import { Suspense } from 'react'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  AnalyticsCardSkeleton,
  ChartSkeleton,
  HeatmapSkeleton,
} from '@/components/skeletons'
import {
  StudyTimeHeatmap,
  SessionPerformanceChart,
  LearningStyleProfile,
  ForgettingCurveVisualization,
  BehavioralInsightsPanel,
} from '@/components/analytics/learning-patterns'

// Type definitions for API responses
interface UserLearningProfile {
  id: string
  userId: string
  preferredStudyTimes: Array<{ dayOfWeek: number; startHour: number; endHour: number }>
  averageSessionDuration: number
  optimalSessionDuration: number
  contentPreferences: {
    lectures: number
    flashcards: number
    validation: number
    clinicalReasoning: number
  }
  learningStyleProfile: {
    visual: number
    auditory: number
    kinesthetic: number
    reading: number
  }
  personalizedForgettingCurve: {
    R0: number
    k: number
    halfLife: number
  }
  lastAnalyzedAt: string
  dataQualityScore: number
}

interface LearningProfileResponse {
  profile: UserLearningProfile | null
  insufficientData: boolean
  dataRequirements?: {
    weeksNeeded: number
    sessionsNeeded: number
    reviewsNeeded: number
  }
}

async function getLearningProfile(): Promise<LearningProfileResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/learning-profile`,
    {
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    throw new Error('Failed to fetch learning profile')
  }

  return res.json()
}

function ProfileSummaryCard({ profile }: { profile: UserLearningProfile }) {
  const dominantLearningStyle = Object.entries(profile.learningStyleProfile).reduce(
    (max, [key, value]) => (value > max.value ? { key, value } : max),
    { key: '', value: 0 },
  )

  const learningStyleLabels: Record<string, string> = {
    visual: 'Visual',
    auditory: 'Auditory',
    kinesthetic: 'Kinesthetic',
    reading: 'Reading/Writing',
  }

  return (
    <Card className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)]">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'oklch(0.3 0.05 230)' }}>
          Learning Profile Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: 'oklch(0.5 0.05 230)' }}>
              Average Session Duration
            </p>
            <p className="text-2xl font-bold" style={{ color: 'oklch(0.3 0.1 230)' }}>
              {profile.averageSessionDuration} min
            </p>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'oklch(0.5 0.05 230)' }}>
              Optimal Duration
            </p>
            <p className="text-2xl font-bold" style={{ color: 'oklch(0.3 0.1 145)' }}>
              {profile.optimalSessionDuration} min
            </p>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'oklch(0.5 0.05 230)' }}>
              Dominant Learning Style
            </p>
            <p className="text-2xl font-bold" style={{ color: 'oklch(0.3 0.1 280)' }}>
              {learningStyleLabels[dominantLearningStyle.key]} (
              {Math.round(dominantLearningStyle.value * 100)}%)
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium mb-2" style={{ color: 'oklch(0.5 0.05 230)' }}>
            Data Quality Score
          </p>
          <Progress value={profile.dataQualityScore * 100} className="h-2" />
          <p className="text-xs mt-1" style={{ color: 'oklch(0.6 0.03 230)' }}>
            {Math.round(profile.dataQualityScore * 100)}% confidence based on{' '}
            {new Date(profile.lastAnalyzedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Card>
  )
}

function InsufficientDataMessage({
  requirements,
}: {
  requirements: { weeksNeeded: number; sessionsNeeded: number; reviewsNeeded: number }
}) {
  return (
    <Alert className="bg-white/80 backdrop-blur-md border border-[oklch(0.85_0.05_60)]">
      <AlertDescription>
        <div className="space-y-4">
          <p className="font-medium" style={{ color: 'oklch(0.4 0.1 60)' }}>
            Insufficient data for behavioral pattern analysis
          </p>
          <p className="text-sm" style={{ color: 'oklch(0.5 0.05 230)' }}>
            Complete the following to unlock personalized learning patterns:
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'oklch(0.5 0.05 230)' }}>Weeks of study</span>
                <span style={{ color: 'oklch(0.4 0.08 230)' }}>
                  {Math.max(0, requirements.weeksNeeded)} more needed
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (requirements.weeksNeeded / 6) * 100)}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'oklch(0.5 0.05 230)' }}>Study sessions</span>
                <span style={{ color: 'oklch(0.4 0.08 230)' }}>
                  {Math.max(0, requirements.sessionsNeeded)} more needed
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (requirements.sessionsNeeded / 20) * 100)}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'oklch(0.5 0.05 230)' }}>Card reviews</span>
                <span style={{ color: 'oklch(0.4 0.08 230)' }}>
                  {Math.max(0, requirements.reviewsNeeded)} more needed
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (requirements.reviewsNeeded / 50) * 100)}
                className="h-2"
              />
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default async function LearningPatternsPage() {
  const data = await getLearningProfile()

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'oklch(0.3 0.1 230)' }}>
          Learning Patterns & Insights
        </h1>
        <p className="text-base" style={{ color: 'oklch(0.5 0.05 230)' }}>
          Understand your unique learning patterns and optimize your study approach
        </p>
      </div>

      {data.insufficientData ? (
        <InsufficientDataMessage requirements={data.dataRequirements!} />
      ) : data.profile ? (
        <div className="space-y-6">
          {/* Learning Profile Summary */}
          <ProfileSummaryCard profile={data.profile} />

          {/* Study Time Heatmap */}
          <Card className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)]">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.3 0.08 230)' }}>
                Optimal Study Times
              </h3>
              <Suspense fallback={<HeatmapSkeleton />}>
                <StudyTimeHeatmap />
              </Suspense>
            </div>
          </Card>

          {/* Session Performance & Learning Style */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)]">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.3 0.08 230)' }}>
                  Session Performance Patterns
                </h3>
                <Suspense fallback={<ChartSkeleton variant="line" height={320} />}>
                  <SessionPerformanceChart />
                </Suspense>
              </div>
            </Card>

            <Card className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)]">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.3 0.08 230)' }}>
                  Learning Style Profile (VARK)
                </h3>
                <Suspense fallback={<ChartSkeleton variant="radar" height={320} />}>
                  <LearningStyleProfile profile={data.profile} />
                </Suspense>
              </div>
            </Card>
          </div>

          {/* Forgetting Curve */}
          <Card className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)]">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.3 0.08 230)' }}>
                Personal Forgetting Curve
              </h3>
              <Suspense fallback={<ChartSkeleton variant="area" height={320} />}>
                <ForgettingCurveVisualization curve={data.profile.personalizedForgettingCurve} />
              </Suspense>
            </div>
          </Card>

          {/* Behavioral Insights */}
          <Card className="bg-white/80 backdrop-blur-md border border-[oklch(0.9_0.02_230)]">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'oklch(0.3 0.08 230)' }}>
                Actionable Insights
              </h3>
              <Suspense fallback={<AnalyticsCardSkeleton showHeader={false} showStats={false} />}>
                <BehavioralInsightsPanel />
              </Suspense>
            </div>
          </Card>
        </div>
      ) : (
        <Alert className="bg-white/80 backdrop-blur-md">
          <AlertDescription>
            No learning profile data available. Please try again later.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

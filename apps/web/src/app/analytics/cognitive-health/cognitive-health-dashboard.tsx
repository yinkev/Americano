/**
 * CognitiveHealthDashboard Client Component
 * Story 5.4 Task 7.1
 *
 * Client component that fetches and displays cognitive health data
 * Implements real-time updates every 5 minutes during active session
 */

'use client'

import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  type BurnoutContributingFactor,
  type BurnoutRiskLevel,
  BurnoutRiskPanel,
} from '@/components/analytics/burnout-risk-panel'
import { CognitiveLoadMeter } from '@/components/analytics/cognitive-load-meter'
import { InterventionRecommendationPanel } from '@/components/analytics/intervention-recommendation-panel'
import {
  type CognitiveLoadDataPoint,
  StressPatternsTimeline,
} from '@/components/analytics/stress-patterns-timeline'
import { StressProfileCard, type StressTrigger } from '@/components/analytics/stress-profile-card'

interface CognitiveHealthData {
  currentLoad: {
    loadScore: number
    loadLevel: string
    trend: 'up' | 'down' | 'stable'
    lastUpdated: string
  }
  history: CognitiveLoadDataPoint[]
  burnoutRisk: {
    riskLevel: BurnoutRiskLevel
    riskScore: number
    contributingFactors: BurnoutContributingFactor[]
    recommendations: string[]
    lastAssessmentDate: string
    daysSinceLastRest: number
    recoveryProgress?: number
  }
  stressProfile?: {
    triggers: StressTrigger[]
    loadTolerance: number
    copingStrategies: string[]
    profileConfidence: number
  }
}

// Placeholder userId (auth deferred per Story 5.4 constraints)
const PLACEHOLDER_USER_ID = 'user_demo_001'
const REFRESH_INTERVAL_MS = 30 * 1000 // 30 seconds (Story 5.4 polish requirement)

export function CognitiveHealthDashboard() {
  const [data, setData] = useState<CognitiveHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCognitiveHealthData = async () => {
    try {
      // Fetch current load
      const currentLoadRes = await fetch(
        `/api/analytics/cognitive-load/current?userId=${PLACEHOLDER_USER_ID}`,
      )
      if (!currentLoadRes.ok) throw new Error('Failed to fetch current load')
      const currentLoad = await currentLoadRes.json()

      // Fetch load history (last 30 days)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const historyRes = await fetch(
        `/api/analytics/cognitive-load/history?userId=${PLACEHOLDER_USER_ID}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&granularity=day`,
      )
      if (!historyRes.ok) throw new Error('Failed to fetch load history')
      const historyData = await historyRes.json()

      // Fetch burnout risk
      const burnoutRes = await fetch(`/api/analytics/burnout-risk?userId=${PLACEHOLDER_USER_ID}`)
      if (!burnoutRes.ok) throw new Error('Failed to fetch burnout risk')
      const burnoutData = await burnoutRes.json()

      // Fetch stress profile (Story 5.4 Task 8.6)
      const stressProfileRes = await fetch(
        `/api/analytics/stress-profile?userId=${PLACEHOLDER_USER_ID}`,
      )
      let stressProfileData = null
      if (stressProfileRes.ok) {
        stressProfileData = await stressProfileRes.json()
      }

      // Transform history data
      const history: CognitiveLoadDataPoint[] = historyData.dataPoints.map((point: any) => ({
        timestamp: new Date(point.timestamp),
        loadScore: point.loadScore,
        sessionId: point.sessionId,
        stressIndicators: point.stressIndicators || [],
        overloadDetected: point.loadScore > 80,
        interventionApplied: false, // TODO: Link to intervention data
      }))

      setData({
        currentLoad: {
          loadScore: currentLoad.loadScore || 0,
          loadLevel: currentLoad.loadLevel || 'LOW',
          trend: currentLoad.trend || 'stable',
          lastUpdated: currentLoad.timestamp || new Date().toISOString(),
        },
        history,
        burnoutRisk: {
          riskLevel: burnoutData.data?.riskLevel || 'LOW',
          riskScore: burnoutData.data?.riskScore || 0,
          contributingFactors: burnoutData.data?.contributingFactors || [],
          recommendations: burnoutData.data?.recommendations || [],
          lastAssessmentDate: burnoutData.data?.assessmentDate || new Date().toISOString(),
          daysSinceLastRest:
            burnoutData.data?.contributingFactors?.find((f: any) => f.factor === 'Recovery Deficit')
              ?.metadata?.daysSinceRest || 0,
          recoveryProgress: burnoutData.data?.metadata?.recoveryProgress,
        },
        stressProfile: stressProfileData
          ? {
              triggers: stressProfileData.primaryStressors.map((s: any) => ({
                dimension: s.stressorType,
                score: s.severity * 100,
                isPrimary: true,
              })),
              loadTolerance: stressProfileData.loadTolerance,
              copingStrategies: stressProfileData.effectiveCopingStrategies,
              profileConfidence: stressProfileData.profileConfidence,
            }
          : undefined,
      })

      setError(null)
    } catch (err) {
      console.error('Error fetching cognitive health data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load cognitive health data')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchCognitiveHealthData()
  }, [])

  // Set up refresh interval (every 5 minutes)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCognitiveHealthData()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="size-12 border-4 border-clinical border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[13px] text-muted-foreground">Loading cognitive health data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white border shadow-sm rounded-lg p-8">
        <div className="flex items-start gap-4 text-center justify-center">
          <AlertCircle className="size-6 text-destructive shrink-0 mt-1" />
          <div>
            <h3 className="text-[16px] font-semibold text-foreground mb-2">
              Unable to Load Dashboard
            </h3>
            <p className="text-[13px] text-muted-foreground mb-4">
              {error || 'An unexpected error occurred while loading your cognitive health data.'}
            </p>
            <button
              onClick={() => {
                setLoading(true)
                fetchCognitiveHealthData()
              }}
              className="h-9 px-4 bg-clinical text-clinical-foreground rounded-md text-[13px] font-medium hover:bg-clinical/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top row: Load meter (enlarged to 320px) and timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left column: Load meter - Focal point */}
        <div className="lg:col-span-1">
          <CognitiveLoadMeter
            currentLoad={data.currentLoad.loadScore}
            trend={data.currentLoad.trend}
            lastUpdated={new Date(data.currentLoad.lastUpdated)}
          />
        </div>

        {/* Right column: Timeline */}
        <div className="lg:col-span-2">
          <StressPatternsTimeline
            dataPoints={data.history}
            timeRange="7day"
            onDataPointClick={(dataPoint) => {
              console.log('Data point clicked:', dataPoint)
              // TODO: Show detailed session view in modal
            }}
          />
        </div>
      </div>

      {/* Middle row: Burnout risk and stress profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <BurnoutRiskPanel
          riskLevel={data.burnoutRisk.riskLevel}
          riskScore={data.burnoutRisk.riskScore}
          contributingFactors={data.burnoutRisk.contributingFactors}
          recommendations={data.burnoutRisk.recommendations}
          daysSinceLastRest={data.burnoutRisk.daysSinceLastRest}
          recoveryProgress={data.burnoutRisk.recoveryProgress}
          lastAssessmentDate={new Date(data.burnoutRisk.lastAssessmentDate)}
        />

        {data.stressProfile && (
          <StressProfileCard
            triggers={data.stressProfile.triggers}
            loadTolerance={data.stressProfile.loadTolerance}
            copingStrategies={data.stressProfile.copingStrategies}
            profileConfidence={data.stressProfile.profileConfidence}
          />
        )}
      </div>

      {/* Bottom row: Intervention recommendations */}
      <InterventionRecommendationPanel />
    </div>
  )
}

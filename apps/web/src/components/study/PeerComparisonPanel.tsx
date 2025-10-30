'use client'

/**
 * Peer Comparison Panel
 *
 * Privacy-protected peer calibration comparison visualization.
 * Displays:
 * - Box plot with user's position highlighted
 * - Calibration percentile with interpretation
 * - Common overconfident topics among peers
 * - Anonymized peer statistics (minimum 20 users)
 *
 * Story 4.4 Task 9: Peer Calibration Comparison
 */

import { AlertCircle, TrendingUp, Users } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface PeerDistribution {
  correlations: number[]
  quartiles: [number, number, number] // Q1, Median, Q3
  median: number
  mean: number
  poolSize: number
}

interface CommonOverconfidentTopic {
  topic: string
  prevalence: number
  avgDelta: number
}

interface PeerComparisonData {
  userCorrelation: number
  userPercentile: number
  peerDistribution: PeerDistribution
  commonOverconfidentTopics: CommonOverconfidentTopic[]
  peerAvgCorrelation: number
}

interface PeerComparisonPanelProps {
  userId?: string
  courseId?: string
  className?: string
}

export function PeerComparisonPanel({
  userId,
  courseId,
  className = '',
}: PeerComparisonPanelProps) {
  const [data, setData] = useState<PeerComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notEnabled, setNotEnabled] = useState(false)

  useEffect(() => {
    fetchPeerComparison()
  }, [userId, courseId])

  const fetchPeerComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      setNotEnabled(false)

      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      if (courseId) params.append('courseId', courseId)

      const response = await fetch(`/api/calibration/peer-comparison?${params.toString()}`)
      const result = await response.json()

      if (!result.success) {
        if (result.error === 'PEER_COMPARISON_NOT_ENABLED') {
          setNotEnabled(true)
        } else {
          setError(result.message || 'Failed to load peer comparison data')
        }
        setLoading(false)
        return
      }

      setData(result.data)
    } catch (err) {
      console.error('Peer comparison fetch error:', err)
      setError('Failed to load peer comparison data')
    } finally {
      setLoading(false)
    }
  }

  const getPercentileInterpretation = (percentile: number): string => {
    if (percentile >= 90) return 'Excellent! Your calibration accuracy is in the top 10%'
    if (percentile >= 75) return 'Very Good! You calibrate better than most peers'
    if (percentile >= 60) return 'Good! Your calibration is above average'
    if (percentile >= 40) return 'Average calibration accuracy'
    if (percentile >= 25) return 'Below average - consider reflection on confidence assessment'
    return 'Needs improvement - focus on metacognitive awareness'
  }

  const getPercentileColor = (percentile: number): string => {
    if (percentile >= 75) return 'oklch(0.7 0.15 145)' // Green (calibrated)
    if (percentile >= 40) return 'oklch(0.75 0.12 85)' // Yellow (neutral)
    return 'oklch(0.65 0.20 25)' // Red (needs work)
  }

  if (loading) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-lg p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] ${className}`}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-[oklch(0.6_0.05_240)]">Loading peer comparison...</div>
        </div>
      </div>
    )
  }

  if (notEnabled) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-lg p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] ${className}`}
      >
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-4 text-[oklch(0.6_0.05_240)]" />
          <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Peer Comparison Not Enabled
          </h3>
          <p
            className="text-[oklch(0.5_0.05_240)] mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Enable peer comparison to see how your calibration accuracy compares with other students
          </p>
          <button
            onClick={() => (window.location.href = '/settings/privacy')}
            className="px-4 py-2 bg-[oklch(0.6_0.18_230)] text-white rounded-lg hover:opacity-90 transition-opacity"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Enable in Settings
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`bg-white/95 backdrop-blur-xl rounded-lg p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] ${className}`}
      >
        <div className="flex items-center gap-3 text-[oklch(0.65_0.20_25)]">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              {error}
            </p>
            {error.includes('Insufficient') && (
              <p className="text-sm text-[oklch(0.5_0.05_240)] mt-1">
                More students need to opt-in for peer comparison to be available
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { userCorrelation, userPercentile, peerDistribution, commonOverconfidentTopics } = data
  const { quartiles, poolSize, mean } = peerDistribution
  const [q1, median, q3] = quartiles

  // Calculate box plot dimensions (0-100% scale for correlation -1 to 1)
  const scaleToPercent = (value: number) => ((value + 1) / 2) * 100

  const minPos = scaleToPercent(Math.min(...peerDistribution.correlations))
  const q1Pos = scaleToPercent(q1)
  const medianPos = scaleToPercent(median)
  const q3Pos = scaleToPercent(q3)
  const maxPos = scaleToPercent(Math.max(...peerDistribution.correlations))
  const userPos = scaleToPercent(userCorrelation)

  return (
    <div
      className={`bg-white/95 backdrop-blur-xl rounded-lg p-6 shadow-[0_8px_32px_rgba(31,38,135,0.1)] ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-[oklch(0.6_0.18_230)]" />
        <h3 className="text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Peer Calibration Comparison
        </h3>
      </div>

      {/* Percentile Summary */}
      <div
        className="mb-8 p-4 rounded-lg"
        style={{ backgroundColor: `${getPercentileColor(userPercentile)}20` }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-2xl font-bold"
            style={{ color: getPercentileColor(userPercentile), fontFamily: 'DM Sans, sans-serif' }}
          >
            {userPercentile}th Percentile
          </span>
          <span
            className="text-sm text-[oklch(0.5_0.05_240)]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {poolSize} students
          </span>
        </div>
        <p
          className="text-sm"
          style={{ fontFamily: 'Inter, sans-serif', color: getPercentileColor(userPercentile) }}
        >
          {getPercentileInterpretation(userPercentile)}
        </p>
      </div>

      {/* Box Plot Visualization */}
      <div className="mb-8">
        <h4
          className="text-sm font-semibold mb-4 text-[oklch(0.4_0.05_240)]"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          Calibration Accuracy Distribution
        </h4>

        {/* Box plot container */}
        <div className="relative h-24 mb-8">
          {/* Axis labels */}
          <div className="absolute -top-6 left-0 text-xs text-[oklch(0.5_0.05_240)]">-1.0</div>
          <div className="absolute -top-6 left-1/4 text-xs text-[oklch(0.5_0.05_240)]">-0.5</div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-[oklch(0.5_0.05_240)]">
            0.0
          </div>
          <div className="absolute -top-6 left-3/4 text-xs text-[oklch(0.5_0.05_240)]">0.5</div>
          <div className="absolute -top-6 right-0 text-xs text-[oklch(0.5_0.05_240)]">1.0</div>

          {/* Whisker line (min to max) */}
          <div
            className="absolute h-0.5 bg-[oklch(0.6_0.05_240)]"
            style={{
              left: `${minPos}%`,
              width: `${maxPos - minPos}%`,
              top: '50%',
            }}
          />

          {/* Box (Q1 to Q3) */}
          <div
            className="absolute h-12 bg-[oklch(0.6_0.18_230)] bg-opacity-20 border-2 border-[oklch(0.6_0.18_230)] rounded"
            style={{
              left: `${q1Pos}%`,
              width: `${q3Pos - q1Pos}%`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {/* Median line */}
            <div
              className="absolute h-full w-0.5 bg-[oklch(0.6_0.18_230)]"
              style={{
                left: `${((medianPos - q1Pos) / (q3Pos - q1Pos)) * 100}%`,
              }}
            />
          </div>

          {/* User position marker */}
          <div
            className="absolute w-3 h-3 rounded-full bg-[oklch(0.65_0.20_25)] border-2 border-white shadow-lg z-10"
            style={{
              left: `${userPos}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            className="absolute text-xs font-semibold text-[oklch(0.65_0.20_25)] whitespace-nowrap"
            style={{
              left: `${userPos}%`,
              top: '100%',
              transform: 'translateX(-50%)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            You ({userCorrelation.toFixed(2)})
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-4 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div>
            <div className="font-semibold text-[oklch(0.4_0.05_240)]">25th Percentile</div>
            <div className="text-[oklch(0.5_0.05_240)]">{q1.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-semibold text-[oklch(0.4_0.05_240)]">Median</div>
            <div className="text-[oklch(0.5_0.05_240)]">{median.toFixed(2)}</div>
          </div>
          <div>
            <div className="font-semibold text-[oklch(0.4_0.05_240)]">75th Percentile</div>
            <div className="text-[oklch(0.5_0.05_240)]">{q3.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Common Overconfident Topics */}
      {commonOverconfidentTopics.length > 0 && (
        <div>
          <h4
            className="text-sm font-semibold mb-3 text-[oklch(0.4_0.05_240)] flex items-center gap-2"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <TrendingUp className="w-4 h-4" />
            Common Overconfidence Areas
          </h4>
          <div className="space-y-2">
            {commonOverconfidentTopics.slice(0, 5).map((topic) => (
              <div
                key={topic.topic}
                className="p-3 rounded-lg bg-[oklch(0.65_0.20_25)] bg-opacity-10 border border-[oklch(0.65_0.20_25)] border-opacity-20"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {topic.topic}
                  </span>
                  <span className="text-xs text-[oklch(0.5_0.05_240)]">
                    {Math.round(topic.prevalence * 100)}% of peers
                  </span>
                </div>
                <p className="text-xs text-[oklch(0.5_0.05_240)]">
                  Average overconfidence: +{topic.avgDelta.toFixed(0)} points
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Privacy note */}
      <div className="mt-6 pt-4 border-t border-[oklch(0.8_0.05_240)]">
        <p
          className="text-xs text-[oklch(0.5_0.05_240)]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          All peer data is anonymized and aggregated. No individual student data is visible. You can
          opt-out anytime in settings.
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface CognitiveLoadData {
  currentLoad: number
  status: 'LOW' | 'MEDIUM' | 'HIGH'
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
  historicalData: {
    date: string
    load: number
  }[]
  recommendation: string
}

interface CognitiveLoadIndicatorProps {
  className?: string
}

export function CognitiveLoadIndicator({ className }: CognitiveLoadIndicatorProps) {
  const [cognitiveData, setCognitiveData] = useState<CognitiveLoadData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCognitiveLoad()
  }, [])

  async function fetchCognitiveLoad() {
    try {
      setLoading(true)
      const response = await fetch('/api/orchestration/cognitive-load')
      const data = await response.json()

      if (data.success) {
        setCognitiveData(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch cognitive load:', error)
      // Fallback data for demonstration
      setCognitiveData({
        currentLoad: 45,
        status: 'MEDIUM',
        trend: {
          direction: 'down',
          percentage: 15,
        },
        historicalData: [
          { date: '2025-10-10', load: 65 },
          { date: '2025-10-11', load: 58 },
          { date: '2025-10-12', load: 52 },
          { date: '2025-10-13', load: 48 },
          { date: '2025-10-14', load: 50 },
          { date: '2025-10-15', load: 47 },
          { date: '2025-10-16', load: 45 },
        ],
        recommendation:
          'Your cognitive load is moderate. Standard intensity recommended for optimal learning.',
      })
    } finally {
      setLoading(false)
    }
  }

  function getLoadColor(load: number) {
    if (load < 30) return 'oklch(0.75_0.15_160)' // Green
    if (load < 70) return 'oklch(0.7_0.15_50)' // Yellow
    return 'oklch(0.65_0.15_10)' // Red
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'LOW':
        return 'bg-[oklch(0.75_0.15_160)]/10 text-[oklch(0.75_0.15_160)]'
      case 'MEDIUM':
        return 'bg-[oklch(0.7_0.15_50)]/10 text-[oklch(0.7_0.15_50)]'
      case 'HIGH':
        return 'bg-[oklch(0.65_0.15_10)]/10 text-[oklch(0.65_0.15_10)]'
      default:
        return 'bg-[oklch(0.922_0_0)]/10 text-[oklch(0.556_0_0)]'
    }
  }

  function getTrendIcon(direction: string) {
    switch (direction) {
      case 'up':
        return <TrendingUp className="size-4 text-[oklch(0.65_0.15_10)]" />
      case 'down':
        return <TrendingDown className="size-4 text-[oklch(0.75_0.15_160)]" />
      default:
        return <Activity className="size-4 text-[oklch(0.7_0.15_50)]" />
    }
  }

  function getGaugeRotation(load: number) {
    // Convert 0-100 scale to -90 to 90 degrees rotation
    return (load / 100) * 180 - 90
  }

  if (loading) {
    return (
      <Card
        className={`rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] ${className}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            Cognitive Load
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-32 bg-[oklch(0.922_0_0)] rounded-xl mb-4" />
              <div className="h-4 bg-[oklch(0.922_0_0)] rounded w-2/3 mb-2" />
              <div className="h-20 bg-[oklch(0.922_0_0)] rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!cognitiveData) {
    return null
  }

  return (
    <Card
      className={`rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] ${className}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="size-5 text-[oklch(0.7_0.15_230)]" />
          Cognitive Load
        </CardTitle>
        <CardDescription>Current mental fatigue and learning capacity</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Gauge Visualization */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-40 h-20 mb-4">
            {/* Gauge Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-18 border-[8px] border-[oklch(0.922_0_0)] rounded-t-full border-b-0" />
            </div>

            {/* Gauge Fill */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: `conic-gradient(
                  from 180deg,
                  ${getLoadColor(cognitiveData.currentLoad)} 0deg,
                  ${getLoadColor(cognitiveData.currentLoad)} ${cognitiveData.currentLoad * 1.8}deg,
                  transparent ${cognitiveData.currentLoad * 1.8}deg
                )`,
                clipPath: 'polygon(0 50%, 100% 50%, 100% 0, 0 0)',
              }}
            >
              <div className="w-36 h-18 border-[8px] border-transparent rounded-t-full border-b-0" />
            </div>

            {/* Needle */}
            <div
              className="absolute bottom-0 left-1/2 w-1 h-16 bg-[oklch(0.145_0_0)] rounded-full origin-bottom transition-transform duration-500"
              style={{
                transform: `translateX(-50%) rotate(${getGaugeRotation(cognitiveData.currentLoad)}deg)`,
              }}
            />

            {/* Center Circle */}
            <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-[oklch(0.145_0_0)] rounded-full transform -translate-x-1/2 translate-y-2" />
          </div>

          <div className="text-center">
            <div
              className="text-3xl font-bold"
              style={{ color: getLoadColor(cognitiveData.currentLoad) }}
            >
              {cognitiveData.currentLoad}
            </div>
            <Badge className={`mt-1 ${getStatusColor(cognitiveData.status)}`}>
              {cognitiveData.status}
            </Badge>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-[oklch(0.97_0_0)] border border-[oklch(0.922_0_0)]">
          <div className="flex items-center gap-2">
            {getTrendIcon(cognitiveData.trend.direction)}
            <span className="text-sm font-medium text-[oklch(0.145_0_0)]">
              {cognitiveData.trend.direction === 'up'
                ? 'Increasing'
                : cognitiveData.trend.direction === 'down'
                  ? 'Decreasing'
                  : 'Stable'}
            </span>
          </div>
          <span className="text-sm text-[oklch(0.556_0_0)]">
            {cognitiveData.trend.percentage}% from last week
          </span>
        </div>

        {/* Historical Trend Chart */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)] mb-3">7-Day Trend</h4>
          <div className="relative h-24">
            {/* Simple line chart visualization */}
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {cognitiveData.historicalData.map((data, index) => {
                const height = (data.load / 100) * 100
                const isLatest = index === cognitiveData.historicalData.length - 1

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                    title={`${new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}: ${data.load}%`}
                  >
                    <div className="w-full flex flex-col items-center">
                      <div
                        className={`
                          w-full rounded-t transition-all duration-300
                          ${isLatest ? 'bg-[oklch(0.7_0.15_230)]' : 'bg-[oklch(0.7_0.15_230)]/40'}
                        `}
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                      <div className="text-xs text-[oklch(0.556_0_0)] mt-1">
                        {new Date(data.date)
                          .toLocaleDateString('en-US', { weekday: 'short' })
                          .charAt(0)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-4 rounded-xl bg-[oklch(0.7_0.15_230)]/5 border border-[oklch(0.7_0.15_230)]/20">
          <div className="flex items-start gap-2">
            <Brain className="size-4 text-[oklch(0.7_0.15_230)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-[oklch(0.145_0_0)] mb-1">Recommendation</h4>
              <p className="text-sm text-[oklch(0.556_0_0)] leading-relaxed">
                {cognitiveData.recommendation}
              </p>
            </div>
          </div>
        </div>

        {/* Scale Reference */}
        <div className="mt-4 pt-4 border-t border-[oklch(0.922_0_0)]">
          <div className="flex items-center justify-between text-xs text-[oklch(0.556_0_0)]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.75_0.15_160)]" />
              <span>Low (0-30)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.15_50)]" />
              <span>Medium (30-70)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[oklch(0.65_0.15_10)]" />
              <span>High (70-100)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { chartVariants, getAnimationConfig } from '@/lib/animation-variants'
import { applyChartTheme, chartTheme, getDataColors } from '@/lib/chart-theme'

interface SessionDataPoint {
  duration: number
  performance: number
  timeOfDay: 'morning' | 'afternoon' | 'evening'
}

interface SessionPerformanceData {
  sessions: SessionDataPoint[]
  currentAverage: { duration: number; performance: number }
  recommended: { duration: number; performance: number }
}

const TIME_OF_DAY_COLORS = {
  morning: 'oklch(0.7 0.15 60)', // Yellow-orange for morning
  afternoon: 'oklch(0.7 0.15 180)', // Cyan for afternoon
  evening: 'oklch(0.7 0.15 280)', // Purple for evening
}

export function SessionPerformanceChart() {
  const [data, setData] = useState<SessionPerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/session-performance')
        if (!res.ok) throw new Error('Failed to fetch session performance data')
        const sessionData = await res.json()
        setData(sessionData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <Skeleton className="h-80 w-full" />
  }

  if (error || !data) {
    return (
      <Alert className="bg-destructive/10 border-destructive/20">
        <AlertDescription className="text-destructive">
          {error || 'No session performance data available'}
        </AlertDescription>
      </Alert>
    )
  }

  // Group sessions by time of day for separate scatter series
  const morningData = data.sessions.filter((s) => s.timeOfDay === 'morning')
  const afternoonData = data.sessions.filter((s) => s.timeOfDay === 'afternoon')
  const eveningData = data.sessions.filter((s) => s.timeOfDay === 'evening')

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          className="px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm"
          style={chartTheme.tooltip.contentStyle}
        >
          <p className="text-[13px] font-medium mb-1" style={chartTheme.tooltip.labelStyle}>
            {data.timeOfDay.charAt(0).toUpperCase() + data.timeOfDay.slice(1)} Session
          </p>
          <p className="text-[13px]" style={chartTheme.tooltip.itemStyle}>
            Duration: {data.duration} minutes
          </p>
          <p className="text-[13px]" style={chartTheme.tooltip.itemStyle}>
            Performance: {Math.round(data.performance)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      className="space-y-4"
      role="region"
      aria-label="Session Performance Analysis"
      variants={getAnimationConfig(chartVariants.container)}
      initial="hidden"
      animate="show"
    >
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart
          {...applyChartTheme()}
          role="img"
          aria-label={`Scatter chart showing performance vs duration for ${data.sessions.length} study sessions across different times of day. Current average is ${data.currentAverage.duration} minutes with ${Math.round(data.currentAverage.performance)} performance. Recommended duration is ${data.recommended.duration} minutes.`}
          tabIndex={0}
        >
          <CartesianGrid {...chartTheme.grid} />
          <XAxis
            type="number"
            dataKey="duration"
            name="Duration"
            unit=" min"
            {...chartTheme.axis}
            label={{
              value: 'Session Duration (minutes)',
              position: 'insideBottom',
              offset: -10,
              ...chartTheme.axisLabel.style,
            }}
          />
          <YAxis
            type="number"
            dataKey="performance"
            name="Performance"
            domain={[0, 100]}
            {...chartTheme.axis}
            label={{
              value: 'Performance Score',
              angle: -90,
              position: 'insideLeft',
              ...chartTheme.axisLabel.style,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend {...chartTheme.legend} />

          {/* Scatter plots for each time of day - with animation */}
          <Scatter
            name="Morning"
            data={morningData}
            fill={TIME_OF_DAY_COLORS.morning}
            fillOpacity={0.6}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Scatter
            name="Afternoon"
            data={afternoonData}
            fill={TIME_OF_DAY_COLORS.afternoon}
            fillOpacity={0.6}
            isAnimationActive={true}
            animationBegin={200}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Scatter
            name="Evening"
            data={eveningData}
            fill={TIME_OF_DAY_COLORS.evening}
            fillOpacity={0.6}
            isAnimationActive={true}
            animationBegin={400}
            animationDuration={800}
            animationEasing="ease-out"
          />

          {/* Current average marker */}
          <ReferenceLine
            x={data.currentAverage.duration}
            stroke="oklch(0.5 0.1 230)"
            strokeDasharray="5 5"
            label={{
              value: 'Current Avg',
              position: 'top',
              style: { fill: 'oklch(0.5 0.1 230)', fontSize: 11 },
            }}
          />

          {/* Recommended duration marker */}
          <ReferenceLine
            x={data.recommended.duration}
            stroke="oklch(0.4 0.15 145)"
            strokeWidth={2}
            label={{
              value: 'Recommended',
              position: 'top',
              style: { fill: 'oklch(0.4 0.15 145)', fontSize: 11, fontWeight: 600 },
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      {/* Insights */}
      <div
        className="text-[13px] space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
        role="status"
        aria-live="polite"
      >
        <p style={{ color: 'oklch(0.5 0.05 230)' }}>
          <span className="font-medium text-info">Current Average:</span>{' '}
          {data.currentAverage.duration} min sessions with{' '}
          {Math.round(data.currentAverage.performance)} avg performance
        </p>
        <p className="text-success">
          <span className="font-medium">Recommended:</span> {data.recommended.duration} min sessions
          for optimal {Math.round(data.recommended.performance)} performance
        </p>
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" role="status" aria-atomic="true">
        Session performance chart loaded with {data.sessions.length} sessions. Your current average
        is {data.currentAverage.duration} minute sessions with{' '}
        {Math.round(data.currentAverage.performance)} percent performance. Recommended session
        length is {data.recommended.duration} minutes for optimal{' '}
        {Math.round(data.recommended.performance)} percent performance.
      </div>
    </motion.div>
  )
}

/**
 * MissionCompletionChart Component
 * Story 2.6 Task 3.2
 *
 * Visualizes mission completion trends with multiple chart types
 */

'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { typography, colors, glassmorphism } from '@/lib/design-tokens'

interface TrendData {
  date: string
  value: number
}

interface Props {
  period?: '7d' | '30d' | '90d'
  chartType?: 'line' | 'bar' | 'heatmap'
}

export function MissionCompletionChart({ period = '30d', chartType = 'line' }: Props) {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [selectedChartType, setSelectedChartType] = useState(chartType)

  useEffect(() => {
    fetchData()
  }, [selectedPeriod])

  async function fetchData() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/analytics/missions/trends?metric=completion_rate&granularity=daily&period=${selectedPeriod}`,
        {
          headers: {
            'X-User-Email': 'kevy@americano.dev',
          },
        },
      )

      if (!response.ok) throw new Error('Failed to fetch trend data')

      const result = await response.json()
      setData(result.data.data || [])
    } catch (error) {
      console.error('Error fetching completion trends:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Transform data for display
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    completionRate: (item.value * 100).toFixed(1),
    displayValue: item.value * 100,
  }))

  // Calculate average completion rate
  const avgCompletionRate =
    data.length > 0
      ? (data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(1)
      : '0.0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-card  rounded-xl shadow-none border border-border">
        <div className="text-[13px] text-muted-foreground">Loading completion data...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-card  rounded-xl shadow-none border border-border p-6">
        <Calendar className="size-12 text-muted-foreground mb-4" />
        <div className="text-[13px] text-muted-foreground">No mission data available yet.</div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Complete some missions to see your progress!
        </p>
      </div>
    )
  }

  return (
    <div className={`${glassmorphism.light} rounded-xl shadow-none hover:shadow-none transition-all p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`${typography.heading.h3} text-foreground`}>
            Mission Completion Trends
          </h3>
          <p className={`${typography.body.small} text-muted-foreground mt-1`}>
            Average: {avgCompletionRate}% completion rate
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedChartType('line')}
            className={`p-2 rounded-lg transition-colors ${
              selectedChartType === 'line'
                ? `bg-[${colors.clinical}] text-white`
                : `bg-card text-[${colors.mutedForeground}] hover:bg-card`
            }`}
            aria-label="Line chart"
            title="Line chart"
          >
            <TrendingUp className="size-4" />
          </button>
          <button
            onClick={() => setSelectedChartType('bar')}
            className={`p-2 rounded-lg transition-colors ${
              selectedChartType === 'bar'
                ? `bg-[${colors.clinical}] text-white`
                : `bg-card text-[${colors.mutedForeground}] hover:bg-card`
            }`}
            aria-label="Bar chart"
            title="Bar chart"
          >
            <BarChart3 className="size-4" />
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedPeriod === p
                  ? `bg-[${colors.clinical}] text-white`
                  : `bg-card text-[${colors.mutedForeground}] hover:bg-card`
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        {selectedChartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.muted} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={colors.mutedForeground}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.mutedForeground }}
            />
            <YAxis
              stroke={colors.mutedForeground}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.mutedForeground }}
              domain={[0, 100]}
              label={{
                value: 'Completion Rate (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: colors.mutedForeground },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: `oklch(from ${colors.background} l c h / 0.95)`,
                backdropFilter: 'blur(12px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                padding: '12px',
              }}
              labelStyle={{
                color: colors.foreground,
                fontWeight: 600,
                marginBottom: '4px',
              }}
              formatter={(value: number) => [`${value}%`, 'Completion Rate']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="displayValue"
              stroke={colors.clinical}
              strokeWidth={3}
              dot={{
                fill: colors.clinical,
                r: 5,
                strokeWidth: 2,
                stroke: colors.background,
              }}
              activeDot={{ r: 7 }}
              name="Completion Rate (%)"
            />
            {/* Target line at 80% */}
            <Line
              type="monotone"
              dataKey={() => 80}
              stroke={colors.lab}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target (80%)"
            />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.muted} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={colors.mutedForeground}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.mutedForeground }}
            />
            <YAxis
              stroke={colors.mutedForeground}
              style={{ fontSize: '12px' }}
              tick={{ fill: colors.mutedForeground }}
              domain={[0, 100]}
              label={{
                value: 'Completion Rate (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: colors.mutedForeground },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: `oklch(from ${colors.background} l c h / 0.95)`,
                backdropFilter: 'blur(12px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                padding: '12px',
              }}
              labelStyle={{
                color: colors.foreground,
                fontWeight: 600,
                marginBottom: '4px',
              }}
              formatter={(value: number) => [`${value}%`, 'Completion Rate']}
            />
            <Legend />
            <Bar
              dataKey="displayValue"
              fill={colors.clinical}
              radius={[8, 8, 0, 0]}
              name="Completion Rate (%)"
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[${colors.border}]">
        <div>
          <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>Best Day</p>
          <p className={`${typography.body.base} font-semibold text-foreground`}>
            {Math.max(...chartData.map((d) => d.displayValue)).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>Average</p>
          <p className={`${typography.body.base} font-semibold text-foreground`}>{avgCompletionRate}%</p>
        </div>
        <div>
          <p className={`${typography.body.tiny} text-muted-foreground mb-1`}>Trend</p>
          <p className={`${typography.body.base} font-semibold text-foreground`}>
            {calculateTrend(chartData)}
          </p>
        </div>
      </div>
    </div>
  )
}

function calculateTrend(data: any[]): string {
  if (data.length < 2) return '--'

  const firstHalf = data
    .slice(0, Math.floor(data.length / 2))
    .reduce((sum, d) => sum + d.displayValue, 0)
  const secondHalf = data
    .slice(Math.floor(data.length / 2))
    .reduce((sum, d) => sum + d.displayValue, 0)

  const firstAvg = firstHalf / Math.floor(data.length / 2)
  const secondAvg = secondHalf / (data.length - Math.floor(data.length / 2))

  const change = ((secondAvg - firstAvg) / firstAvg) * 100

  if (Math.abs(change) < 5) return 'Stable'
  return change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`
}

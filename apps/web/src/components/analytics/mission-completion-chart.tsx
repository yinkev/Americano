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
      <div className="flex items-center justify-center h-96 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30">
        <div className="text-sm text-[oklch(0.556_0_0)]">Loading completion data...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
        <Calendar className="size-12 text-[oklch(0.556_0_0)] mb-4" />
        <div className="text-sm text-[oklch(0.556_0_0)]">No mission data available yet.</div>
        <p className="text-xs text-[oklch(0.556_0_0)] mt-2">
          Complete some missions to see your progress!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.1)] border border-white/30 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-[oklch(0.145_0_0)]">
            Mission Completion Trends
          </h3>
          <p className="text-sm text-[oklch(0.556_0_0)] mt-1">
            Average: {avgCompletionRate}% completion rate
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedChartType('line')}
            className={`p-2 rounded-lg transition-colors ${
              selectedChartType === 'line'
                ? 'bg-[oklch(0.7_0.15_230)] text-white'
                : 'bg-white/60 text-[oklch(0.556_0_0)] hover:bg-white/80'
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
                ? 'bg-[oklch(0.7_0.15_230)] text-white'
                : 'bg-white/60 text-[oklch(0.556_0_0)] hover:bg-white/80'
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
                  ? 'bg-[oklch(0.7_0.15_230)] text-white'
                  : 'bg-white/60 text-[oklch(0.556_0_0)] hover:bg-white/80'
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
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="oklch(0.556 0 0)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'oklch(0.556 0 0)' }}
            />
            <YAxis
              stroke="oklch(0.556 0 0)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'oklch(0.556 0 0)' }}
              domain={[0, 100]}
              label={{
                value: 'Completion Rate (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(1 0 0 / 0.95)',
                backdropFilter: 'blur(12px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                padding: '12px',
              }}
              labelStyle={{
                color: 'oklch(0.145 0 0)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
              formatter={(value: number) => [`${value}%`, 'Completion Rate']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="displayValue"
              stroke="oklch(0.7 0.15 230)"
              strokeWidth={3}
              dot={{
                fill: 'oklch(0.7 0.15 230)',
                r: 5,
                strokeWidth: 2,
                stroke: 'oklch(1 0 0)',
              }}
              activeDot={{ r: 7 }}
              name="Completion Rate (%)"
            />
            {/* Target line at 80% */}
            <Line
              type="monotone"
              dataKey={() => 80}
              stroke="oklch(0.75 0.15 160)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Target (80%)"
            />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="oklch(0.556 0 0)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'oklch(0.556 0 0)' }}
            />
            <YAxis
              stroke="oklch(0.556 0 0)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'oklch(0.556 0 0)' }}
              domain={[0, 100]}
              label={{
                value: 'Completion Rate (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(1 0 0 / 0.95)',
                backdropFilter: 'blur(12px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                padding: '12px',
              }}
              labelStyle={{
                color: 'oklch(0.145 0 0)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
              formatter={(value: number) => [`${value}%`, 'Completion Rate']}
            />
            <Legend />
            <Bar
              dataKey="displayValue"
              fill="oklch(0.7 0.15 230)"
              radius={[8, 8, 0, 0]}
              name="Completion Rate (%)"
            />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[oklch(0.922_0_0)]">
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Best Day</p>
          <p className="text-lg font-semibold text-[oklch(0.145_0_0)]">
            {Math.max(...chartData.map((d) => d.displayValue)).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Average</p>
          <p className="text-lg font-semibold text-[oklch(0.145_0_0)]">{avgCompletionRate}%</p>
        </div>
        <div>
          <p className="text-xs text-[oklch(0.556_0_0)] mb-1">Trend</p>
          <p className="text-lg font-semibold text-[oklch(0.145_0_0)]">
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

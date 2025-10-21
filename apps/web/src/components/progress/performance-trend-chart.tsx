/**
 * PerformanceTrendChart Component
 * Story 2.2 Task 4
 *
 * Time-series visualization of performance metrics using Recharts
 */

'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, subDays } from 'date-fns'

interface PerformanceMetric {
  date: string
  retentionScore: number
  studyTimeMs: number
  reviewCount: number
  correctReviews: number
  incorrectReviews: number
}

interface Props {
  objectiveId: string
  timeRange?: '7d' | '30d' | '90d' | 'all'
  metricType?: 'retention' | 'studyTime' | 'reviewCount'
}

export function PerformanceTrendChart({
  objectiveId,
  timeRange = '30d',
  metricType = 'retention',
}: Props) {
  const [data, setData] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState(timeRange)
  const [selectedMetric, setSelectedMetric] = useState(metricType)

  useEffect(() => {
    fetchData()
  }, [objectiveId, selectedRange])

  async function fetchData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/performance/objectives/${objectiveId}`)

      if (!response.ok) throw new Error('Failed to fetch performance data')

      const result = await response.json()
      const metrics = result.data.performanceMetrics

      // Filter by time range
      const now = new Date()
      const filteredMetrics = metrics.filter((m: PerformanceMetric) => {
        const metricDate = new Date(m.date)
        switch (selectedRange) {
          case '7d':
            return metricDate >= subDays(now, 7)
          case '30d':
            return metricDate >= subDays(now, 30)
          case '90d':
            return metricDate >= subDays(now, 90)
          default:
            return true
        }
      })

      setData(filteredMetrics.reverse()) // Oldest to newest for chart
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate 7-day moving average
  function calculateMovingAverage(dataPoints: PerformanceMetric[]): number[] {
    const window = 7
    return dataPoints.map((_, index, array) => {
      const start = Math.max(0, index - window + 1)
      const subset = array.slice(start, index + 1)
      const sum = subset.reduce((acc, point) => {
        switch (selectedMetric) {
          case 'retention':
            return acc + point.retentionScore
          case 'studyTime':
            return acc + point.studyTimeMs / (1000 * 60) // Convert to minutes
          case 'reviewCount':
            return acc + point.reviewCount
          default:
            return acc
        }
      }, 0)
      return sum / subset.length
    })
  }

  // Transform data for chart
  const chartData = data.map((metric, index) => {
    const movingAvg = calculateMovingAverage(data)

    return {
      date: format(new Date(metric.date), 'MMM dd'),
      value:
        selectedMetric === 'retention'
          ? metric.retentionScore
          : selectedMetric === 'studyTime'
            ? metric.studyTimeMs / (1000 * 60) // Minutes
            : metric.reviewCount,
      movingAverage: movingAvg[index],
    }
  })

  const metricLabels = {
    retention: 'Retention Score',
    studyTime: 'Study Time (min)',
    reviewCount: 'Review Count',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border shadow-sm rounded-lg">
        <div className="text-[13px] text-muted-foreground">Loading performance data...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white border shadow-sm rounded-lg">
        <div className="text-[13px] text-muted-foreground">No performance data available yet.</div>
      </div>
    )
  }

  return (
    <div className="bg-white border shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Time Range Selector */}
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-2 uppercase tracking-wide">Time Range</label>
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  selectedRange === range
                    ? 'bg-clinical text-clinical-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {range === 'all' ? 'All Time' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Type Selector */}
        <div>
          <label className="block text-[11px] font-medium text-foreground mb-2 uppercase tracking-wide">Metric</label>
          <div className="flex gap-2">
            {(['retention', 'studyTime', 'reviewCount'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] ${
                  selectedMetric === metric
                    ? 'bg-clinical text-clinical-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {metricLabels[metric]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0 0)" />
          <XAxis dataKey="date" stroke="oklch(0.4 0 0)" style={{ fontSize: '12px' }} />
          <YAxis stroke="oklch(0.4 0 0)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(1 0 0 / 0.95)',
              backdropFilter: 'blur(12px)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="oklch(0.55 0.22 264)"
            strokeWidth={2}
            dot={{ fill: 'oklch(0.55 0.22 264)', r: 4 }}
            name={metricLabels[selectedMetric]}
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="oklch(0.7 0.15 160)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="7-Day Moving Average"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Export Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => exportToCSV()}
          className="h-9 px-4 rounded-lg text-[13px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        >
          Export CSV
        </button>
      </div>
    </div>
  )

  function exportToCSV() {
    const csv = [
      ['Date', metricLabels[selectedMetric], '7-Day Moving Average'],
      ...chartData.map((row) => [row.date, row.value, row.movingAverage]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-trend-${objectiveId}-${selectedRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
}

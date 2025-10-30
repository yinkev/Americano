/**
 * MasteryDistribution Component
 * Story 2.2 Task 5.2
 *
 * Visual breakdown of mastery levels across all objectives
 */

'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface MasterySummary {
  notStarted: number
  beginner: number
  intermediate: number
  advanced: number
  mastered: number
  totalObjectives: number
  percentages: Record<string, number>
}

export function MasteryDistribution() {
  const [summary, setSummary] = useState<MasterySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  async function fetchSummary() {
    try {
      setLoading(true)
      const response = await fetch('/api/performance/mastery-summary')

      if (!response.ok) throw new Error('Failed to fetch mastery summary')

      const result = await response.json()
      setSummary(result.data)
    } catch (error) {
      console.error('Error fetching mastery summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !summary) {
    return (
      <div className="bg-white border shadow-sm rounded-lg p-4">
        <h3 className="text-[16px] font-heading font-semibold mb-4">Mastery Distribution</h3>
        <div className="text-[13px] text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const chartData = [
    {
      name: 'Not Started',
      value: summary.notStarted,
      percentage: summary.percentages.NOT_STARTED,
      color: 'oklch(0.6 0 0)', // Gray
    },
    {
      name: 'Beginner',
      value: summary.beginner,
      percentage: summary.percentages.BEGINNER,
      color: 'oklch(0.70 0.20 30)', // Orange
    },
    {
      name: 'Intermediate',
      value: summary.intermediate,
      percentage: summary.percentages.INTERMEDIATE,
      color: 'oklch(0.75 0.15 85)', // Yellow
    },
    {
      name: 'Advanced',
      value: summary.advanced,
      percentage: summary.percentages.ADVANCED,
      color: 'oklch(0.55 0.22 264)', // Blue
    },
    {
      name: 'Mastered',
      value: summary.mastered,
      percentage: summary.percentages.MASTERED,
      color: 'oklch(0.7 0.15 160)', // Green
    },
  ]

  return (
    <div className="bg-white border shadow-sm rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
      <h3 className="text-[16px] font-heading font-semibold mb-4">Mastery Distribution</h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="text-center p-3 bg-secondary/30 rounded-lg hover:bg-secondary/40 transition-colors duration-150"
          >
            <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-[11px] text-muted-foreground mb-1">{item.name}</div>
            <div className="text-[11px] font-medium text-muted-foreground">
              {item.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="name"
            stroke="oklch(0.4 0 0)"
            style={{ fontSize: '12px' }}
            tick={{ fontSize: 11 }}
          />
          <YAxis stroke="oklch(0.4 0 0)" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(1 0 0 / 0.95)',
              backdropFilter: 'blur(12px)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value} objectives (${props.payload.percentage.toFixed(1)}%)`,
              'Count',
            ]}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-[13px] text-muted-foreground text-center">
        Total Objectives: <span className="font-semibold">{summary.totalObjectives}</span>
      </div>
    </div>
  )
}

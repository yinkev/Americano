'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { Target } from 'lucide-react'

interface MasterySummary {
  notStarted: number
  beginner: number
  intermediate: number
  advanced: number
  mastered: number
}

const COLORS = {
    'Not Started': 'oklch(0.8 0.05 230)',
    'Beginner': 'oklch(0.78 0.13 340)',
    'Intermediate': 'oklch(0.8 0.15 90)',
    'Advanced': 'oklch(0.70 0.15 150)',
    'Mastered': 'oklch(0.75 0.12 240)',
};

export function MasteryDistribution() {
  const [summary, setSummary] = useState<MasterySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for demonstration
    setSummary({
        notStarted: 25,
        beginner: 50,
        intermediate: 75,
        advanced: 30,
        mastered: 20,
    })
    setLoading(false)
  }, [])

  const chartData = summary ? [
    { name: 'Not Started', value: summary.notStarted },
    { name: 'Beginner', value: summary.beginner },
    { name: 'Intermediate', value: summary.intermediate },
    { name: 'Advanced', value: summary.advanced },
    { name: 'Mastered', value: summary.mastered },
  ] : []

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl h-full">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-card rounded-xl">
                <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-bold">Mastery Distribution</h3>
        </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={80}
            fill="#8884d8"
            dataKey="value"
            // I would add a motion.g here for a playful entrance animation
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'oklch(1 0 0 / 0.9)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '600',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-4 mt-4">
          {chartData.map(item => (
              <div key={item.name} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{backgroundColor: COLORS[item.name as keyof typeof COLORS]}} />
                  <span className="text-lg font-semibold">{item.name}</span>
                  <span className="text-lg font-bold text-muted-foreground ml-auto">{item.value}</span>
              </div>
          ))}
      </div>
    </Card>
  )
}

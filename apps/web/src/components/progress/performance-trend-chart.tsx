'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

const mockData = [
  { date: 'Oct 1', value: 65 },
  { date: 'Oct 2', value: 68 },
  { date: 'Oct 3', value: 72 },
  { date: 'Oct 4', value: 70 },
  { date: 'Oct 5', value: 75 },
  { date: 'Oct 6', value: 80 },
  { date: 'Oct 7', value: 82 },
  { date: 'Oct 8', value: 85 },
  { date: 'Oct 9', value: 88 },
  { date: 'Oct 10', value: 90 },
]

export function PerformanceTrendChart() {

  return (
    <Card className="p-6 bg-card  border-border/50 shadow-none rounded-xl">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-card rounded-xl">
                <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-bold">Performance Trend</h3>
        </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={mockData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.75 0.12 240)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="oklch(0.75 0.12 240)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="oklch(0.8 0.05 230)" style={{ fontSize: '14px', fontWeight: '600' }} />
          <YAxis stroke="oklch(0.8 0.05 230)" style={{ fontSize: '14px', fontWeight: '600' }} />
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
          <Area type="monotone" dataKey="value" stroke="oklch(0.75 0.12 240)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

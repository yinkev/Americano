'use client'

import { useState } from 'react'
import { BarChart, TrendingUp, Target, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Progress tracking components
import { MasteryDistribution } from '@/components/progress/mastery-distribution'
import { PerformanceTrendChart } from '@/components/progress/performance-trend-chart'
import { WeakAreasPanel } from '@/components/progress/weak-areas-panel'

export default function NewProgressPage() {

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <Award className="w-10 h-10 text-primary" />
            <div>
                <h1 className="text-4xl font-heading font-bold">Your Progress</h1>
                <p className="text-lg text-muted-foreground">Track your journey to mastery.</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <PerformanceTrendChart />
            <WeakAreasPanel />
        </div>
        <div className="space-y-6">
            <MasteryDistribution />
        </div>
      </div>
    </div>
  )
}

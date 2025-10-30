'use client'

import { Award, Calendar, CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

interface MissionStatsProps {
  stats: {
    totalMissions: number
    completedMissions: number
    completionRate: number
    avgObjectives: number
    avgTimeEstimate?: number
    avgTimeActual?: number
    avgSuccessScore?: number
    currentStreak?: number
  }
}

export function MissionStats({ stats }: MissionStatsProps) {
  const timeAccuracy =
    stats.avgTimeEstimate && stats.avgTimeActual
      ? 100 -
        Math.abs(((stats.avgTimeActual - stats.avgTimeEstimate) / stats.avgTimeEstimate) * 100)
      : null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Missions */}
      <StatCard
        title="Total Missions"
        value={stats.totalMissions}
        icon={Calendar}
        trend={
          stats.totalMissions > 10
            ? {
                value: (stats.completedMissions / stats.totalMissions) * 100,
                direction: 'up',
                label: 'completion rate',
              }
            : undefined
        }
        variant="primary"
      />

      {/* Completion Rate */}
      <StatCard
        title="Completion Rate"
        value={`${Math.round(stats.completionRate)}%`}
        icon={CheckCircle2}
        trend={
          stats.completionRate >= 80
            ? { value: stats.completionRate, direction: 'up', label: 'excellent' }
            : stats.completionRate >= 60
              ? { value: stats.completionRate, direction: 'up', label: 'good' }
              : { value: stats.completionRate, direction: 'down', label: 'needs improvement' }
        }
        variant={stats.completionRate >= 80 ? 'success' : 'warning'}
      />

      {/* Average Objectives */}
      <StatCard
        title="Avg Objectives"
        value={stats.avgObjectives.toFixed(1)}
        icon={Target}
        subtitle={`per mission`}
        variant="info"
      />

      {/* Success Score or Time Accuracy */}
      {stats.avgSuccessScore !== undefined && stats.avgSuccessScore > 0 ? (
        <StatCard
          title="Avg Success Score"
          value={`${Math.round(stats.avgSuccessScore * 100)}%`}
          icon={Award}
          trend={
            stats.avgSuccessScore >= 0.8
              ? { value: stats.avgSuccessScore * 100, direction: 'up', label: 'excellent' }
              : { value: stats.avgSuccessScore * 100, direction: 'neutral', label: 'good' }
          }
          variant="success"
        />
      ) : timeAccuracy !== null ? (
        <StatCard
          title="Time Accuracy"
          value={`${Math.round(timeAccuracy)}%`}
          icon={Clock}
          subtitle={`est. ${stats.avgTimeEstimate?.toFixed(0)}min vs ${stats.avgTimeActual?.toFixed(0)}min`}
          variant={timeAccuracy >= 80 ? 'success' : 'warning'}
        />
      ) : (
        <StatCard
          title="Avg Time"
          value={`${stats.avgTimeEstimate?.toFixed(0) || 0}min`}
          icon={Clock}
          subtitle="estimated"
          variant="info"
        />
      )}

      {/* Current Streak (if available) */}
      {stats.currentStreak !== undefined && stats.currentStreak > 0 && (
        <StatCard
          title="Current Streak"
          value={stats.currentStreak}
          icon={TrendingUp}
          subtitle={`${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'} in a row`}
          trend={{
            value: stats.currentStreak,
            direction: 'up',
            label: 'Keep going!',
          }}
          variant="success"
        />
      )}
    </div>
  )
}

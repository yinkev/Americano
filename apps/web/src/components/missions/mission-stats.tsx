'use client'

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
        label="Total Missions"
        value={stats.totalMissions}
        percentageChange={
          stats.totalMissions > 10
            ? (stats.completedMissions / stats.totalMissions) * 100
            : undefined
        }
        trend={stats.totalMissions > 10 ? 'up' : undefined}
        sublabel={stats.totalMissions > 10 ? 'completion rate' : undefined}
        variant="primary"
      />

      {/* Completion Rate */}
      <StatCard
        label="Completion Rate"
        value={Math.round(stats.completionRate)}
        formatValue={(v) => `${v}%`}
        percentageChange={stats.completionRate}
        trend={stats.completionRate >= 60 ? 'up' : 'down'}
        variant={stats.completionRate >= 80 ? 'success' : 'warning'}
      />

      {/* Average Objectives */}
      <StatCard
        label="Avg Objectives"
        value={stats.avgObjectives}
        formatValue={(v) => v.toFixed(1)}
        sublabel="per mission"
        variant="primary"
      />

      {/* Success Score or Time Accuracy */}
      {stats.avgSuccessScore !== undefined && stats.avgSuccessScore > 0 ? (
        <StatCard
          label="Avg Success Score"
          value={Math.round(stats.avgSuccessScore * 100)}
          formatValue={(v) => `${v}%`}
          percentageChange={stats.avgSuccessScore * 100}
          trend={stats.avgSuccessScore >= 0.8 ? 'up' : 'neutral'}
          variant="success"
        />
      ) : timeAccuracy !== null ? (
        <StatCard
          label="Time Accuracy"
          value={Math.round(timeAccuracy)}
          formatValue={(v) => `${v}%`}
          sublabel={`est. ${stats.avgTimeEstimate?.toFixed(0)}min vs ${stats.avgTimeActual?.toFixed(0)}min`}
          variant={timeAccuracy >= 80 ? 'success' : 'warning'}
        />
      ) : (
        <StatCard
          label="Avg Time"
          value={Number(stats.avgTimeEstimate?.toFixed(0) ?? 0)}
          formatValue={(v) => `${v}min`}
          sublabel="estimated"
          variant="primary"
        />
      )}

      {/* Current Streak (if available) */}
      {stats.currentStreak !== undefined && stats.currentStreak > 0 && (
        <StatCard
          label="Current Streak"
          value={stats.currentStreak}
          sublabel={`${stats.currentStreak} ${stats.currentStreak === 1 ? 'day' : 'days'} in a row`}
          percentageChange={stats.currentStreak}
          trend="up"
          variant="success"
        />
      )}
    </div>
  )
}

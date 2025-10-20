'use client'

import { Flame, Brain, TrendingUp, Award } from 'lucide-react'

const stats = [
  {
    id: 'streak',
    label: 'Day Streak',
    value: '7',
    icon: Flame,
    color: 'oklch(0.8_0.15_85)', // Amber
    bgColor: 'oklch(0.8_0.15_85)/10',
  },
  {
    id: 'cards-reviewed',
    label: 'Cards Reviewed',
    value: '142',
    icon: Brain,
    color: 'oklch(0.7_0.15_230)', // Blue
    bgColor: 'oklch(0.7_0.15_230)/10',
  },
  {
    id: 'accuracy',
    label: 'Accuracy',
    value: '87%',
    icon: TrendingUp,
    color: 'oklch(0.75_0.15_160)', // Green
    bgColor: 'oklch(0.75_0.15_160)/10',
  },
  {
    id: 'points',
    label: 'Points Earned',
    value: '1,240',
    icon: Award,
    color: 'oklch(0.7_0.15_290)', // Purple
    bgColor: 'oklch(0.7_0.15_290)/10',
  },
]

export function ProgressSummary() {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
      {/* Card Header */}
      <h2 className="text-xl font-heading font-semibold text-[oklch(0.145_0_0)] mb-6">
        Your Progress
      </h2>

      {/* Stats Grid - 2x2 on larger screens, stacked on mobile */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 p-4
                       hover:scale-[1.02] transition-transform duration-200"
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="rounded-lg p-2"
                style={{ backgroundColor: `var(--bg-${stat.id}, ${stat.bgColor})` }}
              >
                <stat.icon
                  className="size-5"
                  style={{ color: `var(--color-${stat.id}, ${stat.color})` }}
                />
              </div>

              {/* Value and Label */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-2xl font-heading font-bold leading-none"
                  style={{ color: `var(--color-${stat.id}, ${stat.color})` }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-[oklch(0.556_0_0)] mt-1 leading-tight">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

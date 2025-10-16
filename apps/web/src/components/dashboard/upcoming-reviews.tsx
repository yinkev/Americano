'use client'

import { Clock, Circle } from 'lucide-react'

const upcomingCards = [
  {
    id: 1,
    title: 'Cardiovascular System',
    course: 'Gross Anatomy',
    dueIn: 'Due now',
    priority: 'high',
    count: 8,
  },
  {
    id: 2,
    title: 'Drug Absorption Mechanisms',
    course: 'Pharmacology',
    dueIn: 'Due in 30 min',
    priority: 'medium',
    count: 12,
  },
  {
    id: 3,
    title: 'Biochemical Pathways',
    course: 'SciFOM',
    dueIn: 'Due in 2 hours',
    priority: 'low',
    count: 5,
  },
]

const priorityColors: Record<string, string> = {
  high: 'oklch(0.7_0.15_15)', // Red/Rose
  medium: 'oklch(0.8_0.15_85)', // Amber
  low: 'oklch(0.75_0.15_160)', // Green
}

export function UpcomingReviews() {
  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)] p-6">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-semibold text-[oklch(0.145_0_0)]">
          Upcoming Reviews
        </h2>
        <div className="flex items-center gap-1.5 text-sm text-[oklch(0.556_0_0)]">
          <Clock className="size-4" />
          <span>Today</span>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {upcomingCards.map((card) => (
          <button
            key={card.id}
            className="w-full text-left rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 p-4
                       hover:bg-white/80 hover:scale-[1.01] transition-all duration-200
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                       min-h-[44px]"
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Priority Indicator */}
                  <Circle
                    className="size-2 flex-shrink-0"
                    style={{
                      fill: priorityColors[card.priority],
                      color: priorityColors[card.priority],
                    }}
                    aria-label={`${card.priority} priority`}
                  />
                  <h3 className="text-sm font-medium text-[oklch(0.145_0_0)] leading-tight truncate">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-[oklch(0.556_0_0)]">
                  {card.course} • {card.count} cards
                </p>
              </div>

              {/* Due Time */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="text-xs font-medium px-2 py-1 rounded-md"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${priorityColors[card.priority]} 10%, transparent)`,
                    color: priorityColors[card.priority],
                  }}
                >
                  {card.dueIn}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-[oklch(0.922_0_0)]">
        <a
          href="/study"
          className="block text-center text-sm font-medium text-[oklch(0.7_0.15_230)]
                     hover:text-[oklch(0.65_0.15_230)] transition-colors duration-200
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.7_0.15_230)]
                     rounded px-2 py-1"
        >
          View all reviews →
        </a>
      </div>
    </div>
  )
}

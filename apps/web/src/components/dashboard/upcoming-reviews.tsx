'use client'

import { Clock, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    <Card interactive="static" className="bg-white/80 backdrop-blur-md border-white/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-heading font-semibold">Upcoming Reviews</CardTitle>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            <span>Today</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Reviews List */}
        {upcomingCards.map((card) => (
          <Button
            key={card.id}
            variant="outline"
            className="w-full h-auto text-left p-4 justify-start hover:scale-[1.01]"
            asChild
          >
            <button type="button">
              <div className="flex items-start justify-between gap-3 w-full">
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
                    <h3 className="text-sm font-medium text-foreground leading-tight truncate">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
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
          </Button>
        ))}

        {/* View All Link */}
        <div className="pt-4 border-t border-border">
          <Button asChild variant="link" className="w-full">
            <Link href="/study">View all reviews →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

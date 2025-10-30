'use client'

import { ChevronRight, Clock } from 'lucide-react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

const reviews = [
  {
    topic: 'Cardiac Conduction Pathway',
    course: 'Cardiovascular',
    courseColor: 'oklch(0.68 0.25 15)',
    cards: 12,
    time: 'Due now',
    priority: 'high',
  },
  {
    topic: 'Muscle Tissue Types',
    course: 'Histology',
    courseColor: 'oklch(0.72 0.18 190)',
    cards: 8,
    time: 'In 2 hours',
    priority: 'medium',
  },
  {
    topic: 'Nervous System Overview',
    course: 'Neuroanatomy',
    courseColor: 'oklch(0.78 0.20 70)',
    cards: 15,
    time: 'Tomorrow',
    priority: 'low',
  },
]

export function UpcomingReviews() {
  return (
    <Card className="p-4 shadow-md border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h3 className="font-semibold text-sm">Upcoming Reviews</h3>
        </div>
        <span className="text-xs text-muted-foreground">35 due</span>
      </div>

      <div className="space-y-2">
        {reviews.map((review, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 p-2 rounded-lg glass-subtle hover:scale-[1.02] transition-all cursor-pointer group"
          >
            {/* Subject-specific color indicator */}
            <div
              className="h-8 w-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: review.courseColor }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-xs truncate">{review.topic}</h4>
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0 h-4 flex-shrink-0"
                  style={{
                    borderColor:
                      review.priority === 'high'
                        ? 'var(--accent-intense)'
                        : review.priority === 'medium'
                          ? 'var(--neuro-amber)'
                          : 'var(--primary)',
                    color:
                      review.priority === 'high'
                        ? 'var(--accent-intense)'
                        : review.priority === 'medium'
                          ? 'var(--neuro-amber)'
                          : 'var(--primary)',
                  }}
                >
                  {review.time}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate">{review.course}</span>
                <span>•</span>
                <span>{review.cards} cards</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
        ))}
      </div>

      <button
        className="w-full mt-4 text-xs font-medium transition-colors"
        style={{ color: 'var(--primary)' }}
      >
        View All Reviews
      </button>

      {/* TODO: Backend Integration */}
      {/* GET /api/reviews/upcoming */}
      {/* Response: { reviews: [{ id, topic, course_id, cards_count, due_at, priority }] } */}
    </Card>
  )
}

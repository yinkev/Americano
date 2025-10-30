import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function OrchestrationEmpty() {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="mb-6">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Ready to schedule illustration"
        >
          {/* Calendar */}
          <rect
            x="50"
            y="45"
            width="60"
            height="55"
            rx="4"
            fill="oklch(0.88 0.05 340)"
            stroke="oklch(0.60 0.20 340)"
            strokeWidth="2.5"
          />
          {/* Calendar header */}
          <rect x="50" y="45" width="60" height="12" fill="oklch(0.60 0.20 340)" />
          {/* Calendar grid */}
          <g stroke="oklch(0.70 0.15 340)" strokeWidth="1">
            <line x1="50" y1="67" x2="110" y2="67" />
            <line x1="50" y1="77" x2="110" y2="77" />
            <line x1="50" y1="87" x2="110" y2="87" />
            <line x1="65" y1="57" x2="65" y2="100" />
            <line x1="80" y1="57" x2="80" y2="100" />
            <line x1="95" y1="57" x2="95" y2="100" />
          </g>

          {/* Clock overlay */}
          <circle
            cx="95"
            cy="80"
            r="18"
            fill="oklch(0.92 0.05 230)"
            stroke="oklch(0.60 0.18 230)"
            strokeWidth="2.5"
          />
          {/* Clock hands */}
          <g stroke="oklch(0.60 0.18 230)" strokeWidth="2" strokeLinecap="round">
            <line x1="95" y1="80" x2="95" y2="70" />
            <line x1="95" y1="80" x2="101" y2="86" />
          </g>
          {/* Clock center dot */}
          <circle cx="95" cy="80" r="2" fill="oklch(0.60 0.18 230)" />

          {/* Checkmark badge */}
          <circle
            cx="115"
            cy="95"
            r="10"
            fill="oklch(0.90 0.05 140)"
            stroke="oklch(0.55 0.20 140)"
            strokeWidth="2"
          />
          <path
            d="M110 95 L113 98 L120 91"
            stroke="oklch(0.55 0.20 140)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <h3 className="text-xl font-semibold mb-2">Ready to Schedule</h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        Connect your calendar to get AI-powered study session recommendations based on your
        availability, energy levels, and learning patterns.
      </p>

      <Button asChild size="lg">
        <Link href="/settings">Connect Calendar</Link>
      </Button>
    </Card>
  )
}

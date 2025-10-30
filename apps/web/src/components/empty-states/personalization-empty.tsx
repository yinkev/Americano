import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function PersonalizationEmpty() {
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
          aria-label="No personalizations yet illustration"
        >
          {/* Sliders */}
          <g>
            {/* Slider 1 */}
            <line
              x1="50"
              y1="60"
              x2="110"
              y2="60"
              stroke="oklch(0.75 0.10 230)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="70"
              cy="60"
              r="6"
              fill="oklch(0.95 0.02 230)"
              stroke="oklch(0.60 0.18 230)"
              strokeWidth="2.5"
            />

            {/* Slider 2 */}
            <line
              x1="50"
              y1="80"
              x2="110"
              y2="80"
              stroke="oklch(0.75 0.10 280)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="90"
              cy="80"
              r="6"
              fill="oklch(0.95 0.02 280)"
              stroke="oklch(0.60 0.18 280)"
              strokeWidth="2.5"
            />

            {/* Slider 3 */}
            <line
              x1="50"
              y1="100"
              x2="110"
              y2="100"
              stroke="oklch(0.75 0.10 140)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle
              cx="80"
              cy="100"
              r="6"
              fill="oklch(0.95 0.02 140)"
              stroke="oklch(0.55 0.20 140)"
              strokeWidth="2.5"
            />
          </g>

          {/* Magic wand */}
          <g transform="translate(90, 45) rotate(-30)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="20"
              stroke="oklch(0.65 0.25 60)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Star at top */}
            <path d="M0 -5 L1 -1 L5 0 L1 1 L0 5 L-1 1 L-5 0 L-1 -1 Z" fill="oklch(0.65 0.25 60)" />
          </g>

          {/* Sparkles */}
          <g fill="oklch(0.70 0.20 340)" opacity="0.7">
            <circle cx="45" cy="50" r="2" />
            <circle cx="115" cy="70" r="2.5" />
            <circle cx="55" cy="105" r="2" />
          </g>
        </svg>
      </div>

      <h3 className="text-xl font-semibold mb-2">No Personalizations Yet</h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        As you study, our AI will learn your preferences and automatically personalize your learning
        experience. Check your settings to customize manually.
      </p>

      <div className="flex gap-3">
        <Button asChild size="lg" variant="outline">
          <Link href="/settings">Customize Settings</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/study">Start Studying</Link>
        </Button>
      </div>
    </Card>
  )
}

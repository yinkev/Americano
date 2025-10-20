import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function CognitiveHealthEmpty() {
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
          aria-label="Building your cognitive profile illustration"
        >
          {/* Brain outline */}
          <path
            d="M80 40
               Q90 35 95 40 Q100 35 105 40 Q110 40 110 50
               Q115 55 115 65 Q115 75 110 80
               Q110 90 105 95 Q100 100 90 100
               Q85 105 80 105 Q75 105 70 100
               Q60 100 55 95 Q50 90 50 80
               Q45 75 45 65 Q45 55 50 50
               Q50 40 55 40 Q60 35 65 40 Q70 35 80 40 Z"
            fill="oklch(0.88 0.05 280)"
            stroke="oklch(0.60 0.20 280)"
            strokeWidth="2.5"
          />

          {/* Growth arrow */}
          <g transform="translate(95, 65)">
            <line
              x1="0"
              y1="20"
              x2="0"
              y2="-10"
              stroke="oklch(0.55 0.25 140)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M-6 -4 L0 -10 L6 -4"
              stroke="oklch(0.55 0.25 140)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* Neural connections (dots) */}
          <g fill="oklch(0.60 0.20 280)">
            <circle cx="70" cy="55" r="2.5" />
            <circle cx="80" cy="60" r="2.5" />
            <circle cx="90" cy="55" r="2.5" />
            <circle cx="75" cy="70" r="2.5" />
            <circle cx="85" cy="70" r="2.5" />
          </g>

          {/* Connecting lines */}
          <g stroke="oklch(0.60 0.20 280)" strokeWidth="1.5" opacity="0.5">
            <line x1="70" y1="55" x2="80" y2="60" />
            <line x1="80" y1="60" x2="90" y2="55" />
            <line x1="70" y1="55" x2="75" y2="70" />
            <line x1="90" y1="55" x2="85" y2="70" />
            <line x1="75" y1="70" x2="85" y2="70" />
          </g>
        </svg>
      </div>

      <h3 className="text-xl font-semibold mb-2">
        Building Your Profile...
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        Your cognitive health dashboard will appear once we've gathered enough data
        about your learning patterns, stress levels, and cognitive load.
      </p>

      <Button asChild size="lg">
        <Link href="/study">Start Learning</Link>
      </Button>
    </Card>
  );
}

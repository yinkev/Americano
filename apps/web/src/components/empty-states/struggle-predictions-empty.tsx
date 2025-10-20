import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function StrugglePredictionsEmpty() {
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
          aria-label="No struggles detected illustration"
        >
          {/* Shield icon */}
          <path
            d="M80 30 L110 45 L110 75 Q110 95 80 110 Q50 95 50 75 L50 45 Z"
            fill="oklch(0.85 0.05 140)"
            stroke="oklch(0.55 0.20 140)"
            strokeWidth="2.5"
          />

          {/* Checkmark */}
          <path
            d="M65 75 L75 85 L95 60"
            stroke="oklch(0.55 0.20 140)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Sparkles */}
          <g fill="oklch(0.65 0.25 60)">
            <circle cx="45" cy="55" r="3" />
            <circle cx="115" cy="55" r="3" />
            <circle cx="60" cy="35" r="2.5" />
            <circle cx="100" cy="35" r="2.5" />
            <circle cx="50" cy="100" r="2" />
            <circle cx="110" cy="100" r="2" />
          </g>
        </svg>
      </div>

      <h3 className="text-xl font-semibold mb-2">
        No Struggles Detected
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        Great news! Our AI hasn't identified any learning struggles yet.
        Keep studying, and we'll monitor your progress to provide early
        intervention if needed.
      </p>

      <Button asChild size="lg" variant="outline">
        <Link href="/study">Continue Learning</Link>
      </Button>
    </Card>
  );
}

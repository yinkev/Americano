import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function BehavioralInsightsEmpty() {
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
          aria-label="Collecting insights illustration"
        >
          {/* Light bulb */}
          <circle
            cx="80"
            cy="65"
            r="20"
            fill="oklch(0.90 0.05 60)"
            stroke="oklch(0.65 0.25 60)"
            strokeWidth="2.5"
          />
          <path
            d="M70 85 Q70 95 80 95 Q90 95 90 85"
            stroke="oklch(0.65 0.25 60)"
            strokeWidth="2.5"
            fill="none"
          />
          <rect
            x="75"
            y="95"
            width="10"
            height="8"
            rx="1"
            fill="oklch(0.65 0.25 60)"
          />
          <line
            x1="80"
            y1="35"
            x2="80"
            y2="42"
            stroke="oklch(0.65 0.25 60)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Sparkles around bulb */}
          <g>
            <path
              d="M58 50 L60 54 L56 56 L60 58 L58 62 L62 60 L64 64 L66 60 L70 62 L68 58 L72 56 L68 54 L70 50 L66 52 L64 48 L62 52 Z"
              fill="oklch(0.70 0.20 340)"
              opacity="0.8"
            />
            <path
              d="M94 50 L96 54 L92 56 L96 58 L94 62 L98 60 L100 64 L102 60 L106 62 L104 58 L108 56 L104 54 L106 50 L102 52 L100 48 L98 52 Z"
              fill="oklch(0.65 0.20 280)"
              opacity="0.8"
            />
            <path
              d="M68 78 L70 82 L66 84 L70 86 L68 90 L72 88 L74 92 L76 88 L80 90 L78 86 L82 84 L78 82 L80 78 L76 80 L74 76 L72 80 Z"
              fill="oklch(0.60 0.25 140)"
              opacity="0.8"
            />
          </g>
        </svg>
      </div>

      <h3 className="text-xl font-semibold mb-2">
        Collecting Insights...
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        We're gathering data about your learning patterns to provide personalized
        behavioral insights. Complete a few more study sessions to see your first recommendations.
      </p>

      <Button asChild size="lg">
        <Link href="/study">Build Your Profile</Link>
      </Button>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export function LearningPatternsEmpty() {
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
          aria-label="No study sessions illustration"
        >
          {/* Book icon */}
          <rect
            x="40"
            y="50"
            width="80"
            height="60"
            rx="4"
            fill="oklch(0.85 0.05 230)"
            stroke="oklch(0.6 0.15 230)"
            strokeWidth="2"
          />
          <line
            x1="80"
            y1="50"
            x2="80"
            y2="110"
            stroke="oklch(0.6 0.15 230)"
            strokeWidth="2"
          />
          <path
            d="M50 65 L70 65 M50 75 L70 75 M50 85 L70 85"
            stroke="oklch(0.6 0.15 230)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Chart icon overlay */}
          <circle
            cx="110"
            cy="90"
            r="25"
            fill="oklch(0.95 0.05 140)"
            stroke="oklch(0.55 0.20 140)"
            strokeWidth="2"
          />
          <path
            d="M100 100 L105 95 L110 90 L115 85 L120 95"
            stroke="oklch(0.55 0.20 140)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="100" cy="100" r="2" fill="oklch(0.55 0.20 140)" />
          <circle cx="105" cy="95" r="2" fill="oklch(0.55 0.20 140)" />
          <circle cx="110" cy="90" r="2" fill="oklch(0.55 0.20 140)" />
          <circle cx="115" cy="85" r="2" fill="oklch(0.55 0.20 140)" />
          <circle cx="120" cy="95" r="2" fill="oklch(0.55 0.20 140)" />
        </svg>
      </div>

      <h3 className="text-xl font-semibold mb-2">
        No Study Sessions Yet
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        Start your first study session to unlock personalized learning patterns
        and insights. We'll analyze your study habits to help you learn more effectively.
      </p>

      <Button asChild size="lg">
        <Link href="/study">Start Studying</Link>
      </Button>
    </Card>
  );
}

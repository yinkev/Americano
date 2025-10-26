/**
 * OverviewTab Component
 * Story 4.6 Task 2
 *
 * Overview tab for Understanding Analytics Dashboard
 * Displays 6 key metrics with sparklines and trend indicators:
 * 1. Comprehension score (Blue)
 * 2. Clinical reasoning performance (Red)
 * 3. Controlled failure effectiveness (Yellow)
 * 4. Confidence calibration accuracy (Green)
 * 5. Adaptive assessment efficiency (Purple)
 * 6. Mastery verification status (Green with percentage)
 *
 * Design: Glassmorphism cards with OKLCH colors, responsive 3-column grid
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnderstandingDashboard } from '@/hooks/use-understanding-analytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function OverviewTab() {
  const { data, isLoading, error } = useUnderstandingDashboard();

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[oklch(0.65_0.20_25)]">
          Failed to load dashboard metrics. Please try again.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      title: 'Comprehension',
      value: data.comprehension.currentScore,
      trend: data.comprehension.trend,
      sparkline: data.comprehension.sparkline || [],
      color: 'oklch(0.6 0.18 230)', // Blue
      change: data.comprehension.change || 0,
    },
    {
      title: 'Clinical Reasoning',
      value: data.reasoning.currentScore,
      trend: data.reasoning.trend,
      sparkline: data.reasoning.sparkline || [],
      color: 'oklch(0.65 0.20 25)', // Red
      change: data.reasoning.change || 0,
    },
    {
      title: 'Failure Learning',
      value: data.failure.currentScore,
      trend: data.failure.trend,
      sparkline: data.failure.sparkline || [],
      color: 'oklch(0.75 0.12 85)', // Yellow
      change: data.failure.change || 0,
    },
    {
      title: 'Calibration',
      value: data.calibration.currentScore,
      trend: data.calibration.trend,
      sparkline: data.calibration.sparkline || [],
      color: 'oklch(0.7 0.15 145)', // Green
      change: data.calibration.change || 0,
    },
    {
      title: 'Adaptive Efficiency',
      value: data.adaptive.currentScore,
      trend: data.adaptive.trend,
      sparkline: data.adaptive.sparkline || [],
      color: 'oklch(0.6 0.18 280)', // Purple
      change: data.adaptive.change || 0,
    },
    {
      title: 'Mastery Status',
      value: data.mastery.percentage,
      trend: 'up' as const, // Always positive for mastery
      sparkline: [], // No sparkline for mastery count
      color: 'oklch(0.7 0.15 145)', // Green
      suffix: '%',
      subtitle: `${data.mastery.count}/${data.mastery.total} objectives`,
      change: 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  sparkline: number[];
  color: string;
  suffix?: string;
  subtitle?: string;
  change: number;
}

function MetricCard({
  title,
  value,
  trend,
  sparkline,
  color,
  suffix,
  subtitle,
  change,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'oklch(0.7 0.15 145)' // Green for up
      : trend === 'down'
        ? 'oklch(0.65 0.20 25)' // Red for down
        : 'oklch(0.6 0.05 240)'; // Gray for stable

  return (
    <Card className="bg-card  shadow-none rounded-xl border-0 motion-safe:transition-all motion-safe:duration-150 hover:translate-y-[-2px] hover:shadow-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in- motion-safe:duration-500 motion-reduce:animate-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-[oklch(0.6_0.05_240)]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-4xl font-bold" style={{ color }}>
              {value.toFixed(1)}
              {suffix || ''}
            </p>
            {subtitle && (
              <p className="text-xs text-[oklch(0.6_0.05_240)] mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1" style={{ color: trendColor }}>
              <TrendIcon className="w-5 h-5" />
            </div>
            {change !== 0 && (
              <span className="text-xs font-medium" style={{ color: trendColor }}>
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Sparkline Chart */}
        {sparkline.length > 0 && (
          <div className="mt-4 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline.map((v) => ({ value: v }))}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card
          key={i}
          className="h-48 motion-safe:animate-pulse motion-reduce:animate-none bg-card  rounded-xl border-0 shadow-none"
        >
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-[oklch(0.9_0.05_240)] rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-20 bg-[oklch(0.9_0.05_240)] rounded mb-4" />
            <div className="h-12 w-full bg-[oklch(0.9_0.05_240)] rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

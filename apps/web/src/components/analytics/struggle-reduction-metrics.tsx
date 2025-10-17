/**
 * StruggleReductionMetrics Component
 * Story 5.2 Task 10.5
 *
 * Displays struggle reduction statistics with before/after comparison
 */

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingDown, CheckCircle2, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReductionData {
  baselineRate: number;
  currentRate: number;
  reductionPercentage: number;
  timeline: {
    week: string;
    struggleRate: number;
  }[];
  interventionCount: number;
  weeksTracked: number;
}

export function StruggleReductionMetrics() {
  const [data, setData] = useState<ReductionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReductionData();
  }, []);

  async function fetchReductionData() {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/analytics/struggle-reduction?period=all', {
      //   headers: { 'X-User-Email': 'kevy@americano.dev' },
      // });
      // const result = await response.json();

      // Mock data for MVP - showing significant improvement
      const mockData: ReductionData = {
        baselineRate: 0.42, // 42% struggle rate initially
        currentRate: 0.28, // 28% current struggle rate
        reductionPercentage: 33.3, // 33.3% reduction
        timeline: [
          { week: 'Week 1', struggleRate: 42 },
          { week: 'Week 2', struggleRate: 40 },
          { week: 'Week 3', struggleRate: 38 },
          { week: 'Week 4', struggleRate: 35 },
          { week: 'Week 5', struggleRate: 32 },
          { week: 'Week 6', struggleRate: 28 },
        ],
        interventionCount: 12,
        weeksTracked: 6,
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching reduction data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading metrics...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.weeksTracked < 2) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-64 flex flex-col items-center justify-center">
          <Calendar className="size-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Not enough data to calculate reduction metrics yet
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            We need at least 2 weeks of data to show trends
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare comparison data
  const comparisonData = [
    {
      label: 'Before',
      rate: data.baselineRate * 100,
      color: 'oklch(0.6 0.15 25)',
    },
    {
      label: 'After',
      rate: data.currentRate * 100,
      color: 'oklch(0.7 0.12 145)',
    },
  ];

  const reductionColor =
    data.reductionPercentage >= 25
      ? 'oklch(0.7 0.12 145)' // Green - Great
      : data.reductionPercentage >= 10
        ? 'oklch(0.8 0.15 85)' // Yellow - Good
        : 'oklch(0.556 0 0)'; // Gray - Modest

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="font-heading text-lg">
            Your Progress
          </CardTitle>
          <Badge
            variant="outline"
            className="shrink-0 px-3 py-1.5"
            style={{
              backgroundColor: `${reductionColor}/0.1`,
              borderColor: reductionColor,
              color: reductionColor,
            }}
          >
            {data.weeksTracked} Weeks
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Big Number - Reduction Percentage */}
        <div className="text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-[oklch(0.7_0.12_145)]/10 to-[oklch(0.7_0.15_230)]/10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <TrendingDown className="size-8 text-[oklch(0.7_0.12_145)]" />
            <p className="text-5xl font-bold text-foreground">
              {data.reductionPercentage.toFixed(0)}%
            </p>
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">
            Struggles Reduced
          </p>
          <p className="text-sm text-muted-foreground">
            Thanks to proactive interventions
          </p>
        </div>

        {/* Before/After Comparison Bar Chart */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Before vs After Comparison
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={comparisonData}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.9 0 0)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 50]}
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'oklch(0.556 0 0)' }}
                label={{
                  value: 'Struggle Rate (%)',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
                }}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="oklch(0.556 0 0)"
                style={{ fontSize: '14px', fontWeight: 600 }}
                tick={{ fill: 'oklch(0.145 0 0)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(1 0 0 / 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
                  padding: '12px',
                }}
                labelStyle={{
                  color: 'oklch(0.145 0 0)',
                  fontWeight: 600,
                }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
                {comparisonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline Progress */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Reduction Timeline
          </h4>
          <div className="space-y-2">
            {data.timeline.map((point, index) => {
              const isFirst = index === 0;
              const isLast = index === data.timeline.length - 1;
              const change = isFirst
                ? 0
                : point.struggleRate - data.timeline[index - 1].struggleRate;

              return (
                <div
                  key={point.week}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2 w-24">
                    <div
                      className={`size-2 rounded-full ${
                        isLast ? 'bg-[oklch(0.7_0.12_145)]' : 'bg-muted'
                      }`}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {point.week}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[oklch(0.7_0.12_145)] transition-all"
                        style={{
                          width: `${100 - point.struggleRate}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-20">
                    <span className="text-sm font-semibold text-foreground">
                      {point.struggleRate.toFixed(0)}%
                    </span>
                    {!isFirst && (
                      <span
                        className={`ml-2 text-xs ${
                          change < 0
                            ? 'text-[oklch(0.7_0.12_145)]'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {change < 0 ? '↓' : change > 0 ? '↑' : '→'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[oklch(0.7_0.15_230)]/10">
              <Target className="size-5 text-[oklch(0.7_0.15_230)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Interventions Applied
              </p>
              <p className="text-2xl font-bold text-foreground">
                {data.interventionCount}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[oklch(0.7_0.12_145)]/10">
              <CheckCircle2 className="size-5 text-[oklch(0.7_0.12_145)]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-foreground">
                {((1 - data.currentRate) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 rounded-xl bg-[oklch(0.7_0.15_230)]/5 border border-[oklch(0.7_0.15_230)]/20">
          <p className="text-sm font-medium text-foreground mb-1">
            Keep Providing Feedback
          </p>
          <p className="text-xs text-muted-foreground">
            Your feedback helps improve predictions and reduces struggles even further.
            Let us know when predictions are accurate or inaccurate!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

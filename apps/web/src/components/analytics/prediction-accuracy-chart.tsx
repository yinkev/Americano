/**
 * PredictionAccuracyChart Component
 * Story 5.2 Task 10.4
 *
 * Displays prediction accuracy metrics over time with Recharts
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AccuracyData {
  week: string;
  precision: number;
  recall: number;
  f1Score: number;
  platformAverage: number;
}

export function PredictionAccuracyChart() {
  const [data, setData] = useState<AccuracyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccuracyData();
  }, []);

  async function fetchAccuracyData() {
    try {
      setLoading(true);

      // TODO: Replace with actual API call
      // const response = await fetch('/api/analytics/model-performance', {
      //   headers: { 'X-User-Email': 'kevy@americano.dev' },
      // });
      // const result = await response.json();

      // Mock data for MVP - showing improvement over time
      const mockData: AccuracyData[] = [
        {
          week: 'Week 1',
          precision: 62,
          recall: 58,
          f1Score: 60,
          platformAverage: 72,
        },
        {
          week: 'Week 2',
          precision: 68,
          recall: 64,
          f1Score: 66,
          platformAverage: 72,
        },
        {
          week: 'Week 3',
          precision: 72,
          recall: 69,
          f1Score: 70.5,
          platformAverage: 73,
        },
        {
          week: 'Week 4',
          precision: 75,
          recall: 73,
          f1Score: 74,
          platformAverage: 73,
        },
        {
          week: 'Week 5',
          precision: 78,
          recall: 76,
          f1Score: 77,
          platformAverage: 74,
        },
        {
          week: 'Week 6',
          precision: 80,
          recall: 78,
          f1Score: 79,
          platformAverage: 74,
        },
      ];

      setData(mockData);
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-96 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Loading accuracy trends...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardContent className="p-6 h-96 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Not enough data to show accuracy trends yet
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Keep providing feedback on predictions!
          </p>
        </CardContent>
      </Card>
    );
  }

  const latestData = data[data.length - 1];
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  // Calculate trends
  const getTrend = (current: number, previous: number | null) => {
    if (!previous) return 'stable';
    const change = current - previous;
    if (Math.abs(change) < 2) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  };

  const f1Trend = getTrend(
    latestData.f1Score,
    previousData?.f1Score || null
  );

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return TrendingUp;
    if (trend === 'declining') return TrendingDown;
    return Minus;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'improving') return 'oklch(0.7 0.12 145)';
    if (trend === 'declining') return 'oklch(0.6 0.15 25)';
    return 'oklch(0.556 0 0)';
  };

  const TrendIcon = getTrendIcon(f1Trend);
  const trendColor = getTrendColor(f1Trend);

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-heading text-lg mb-2">
              Model Performance Over Time
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your prediction model accuracy vs platform average
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 px-3 py-1.5 flex items-center gap-2"
            style={{
              backgroundColor: `${trendColor}/0.1`,
              borderColor: trendColor,
              color: trendColor,
            }}
          >
            <TrendIcon className="size-4" />
            {f1Trend === 'improving'
              ? 'Improving'
              : f1Trend === 'declining'
                ? 'Needs Data'
                : 'Stable'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metrics Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Precision</p>
            <p className="text-2xl font-bold text-foreground">
              {latestData.precision.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Accuracy when predicting struggle
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Recall</p>
            <p className="text-2xl font-bold text-foreground">
              {latestData.recall.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Catches struggles early
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">F1 Score</p>
            <p className="text-2xl font-bold text-foreground">
              {latestData.f1Score.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Overall accuracy
            </p>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(0.9 0 0)"
              vertical={false}
            />
            <XAxis
              dataKey="week"
              stroke="oklch(0.556 0 0)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'oklch(0.556 0 0)' }}
            />
            <YAxis
              stroke="oklch(0.556 0 0)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'oklch(0.556 0 0)' }}
              domain={[0, 100]}
              label={{
                value: 'Accuracy (%)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: 'oklch(0.556 0 0)' },
              }}
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
                marginBottom: '8px',
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
              }}
            />

            {/* Precision Line */}
            <Line
              type="monotone"
              dataKey="precision"
              stroke="oklch(0.7 0.15 230)"
              strokeWidth={2.5}
              dot={{
                fill: 'oklch(0.7 0.15 230)',
                r: 4,
                strokeWidth: 2,
                stroke: 'oklch(1 0 0)',
              }}
              activeDot={{ r: 6 }}
              name="Precision"
            />

            {/* Recall Line */}
            <Line
              type="monotone"
              dataKey="recall"
              stroke="oklch(0.7 0.12 145)"
              strokeWidth={2.5}
              dot={{
                fill: 'oklch(0.7 0.12 145)',
                r: 4,
                strokeWidth: 2,
                stroke: 'oklch(1 0 0)',
              }}
              activeDot={{ r: 6 }}
              name="Recall"
            />

            {/* F1 Score Line */}
            <Line
              type="monotone"
              dataKey="f1Score"
              stroke="oklch(0.646 0.222 41.116)"
              strokeWidth={3}
              dot={{
                fill: 'oklch(0.646 0.222 41.116)',
                r: 5,
                strokeWidth: 2,
                stroke: 'oklch(1 0 0)',
              }}
              activeDot={{ r: 7 }}
              name="F1 Score (Overall)"
            />

            {/* Platform Average Line */}
            <Line
              type="monotone"
              dataKey="platformAverage"
              stroke="oklch(0.556 0 0)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Platform Average"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Comparison with Platform */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Your Model vs Platform
            </p>
            <p className="text-xs text-muted-foreground">
              {latestData.f1Score >= latestData.platformAverage
                ? 'Your model is performing above average!'
                : 'Keep providing feedback to improve your model'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">
              {latestData.f1Score >= latestData.platformAverage ? '+' : ''}
              {(latestData.f1Score - latestData.platformAverage).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs average</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

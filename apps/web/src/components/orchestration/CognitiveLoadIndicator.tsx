/**
 * CognitiveLoadIndicator Component
 * Story 5.3 Task 7.4
 *
 * Semi-circle gauge visualization (0-100) showing current cognitive load
 * with color zones, trend sparkline, and recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CognitiveLoadData {
  load: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: number[]; // Last 7 days
  recommendation: string;
}

interface Props {
  userId: string;
}

export function CognitiveLoadIndicator({ userId }: Props) {
  const [data, setData] = useState<CognitiveLoadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCognitiveLoad() {
      try {
        const res = await fetch(
          `/api/orchestration/cognitive-load?userId=${userId}&includeTrend=true`
        );

        if (!res.ok) throw new Error('Failed to fetch cognitive load');

        const loadData = await res.json();
        setData(loadData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCognitiveLoad();
  }, [userId]);

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Cognitive Load</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Cognitive Load</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-white/80 backdrop-blur-md">
            <AlertTriangle className="size-4" />
            <AlertDescription>{error || 'No cognitive load data available'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getLoadColor = (load: number) => {
    if (load < 30) return 'oklch(0.7 0.12 145)'; // Green - Low
    if (load < 70) return 'oklch(0.8 0.15 85)'; // Yellow - Medium
    return 'oklch(0.6 0.15 25)'; // Red - High
  };

  const getLoadZoneLabel = (load: number) => {
    if (load < 30) return 'Optimal';
    if (load < 70) return 'Moderate';
    return 'High';
  };

  const loadColor = getLoadColor(data.load);
  const zoneLabel = getLoadZoneLabel(data.load);

  // Calculate trend direction
  const trendDirection = getTrendDirection(data.trend);

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/30 shadow-[0_8px_32px_rgba(31,38,135,0.1)]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="size-5" style={{ color: loadColor }} />
            <CardTitle className="font-heading text-xl">Cognitive Load</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-muted rounded-md transition-colors">
                  <Info className="size-4" style={{ color: 'oklch(0.6 0.05 230)' }} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-xs"
                style={{
                  backgroundColor: 'oklch(0.95 0.01 230)',
                  color: 'oklch(0.3 0.05 230)',
                }}
              >
                <p className="text-sm">
                  Your cognitive load is calculated from recent study volume, performance trends,
                  comprehension scores, and stress indicators. Lower is better for learning.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Gauge Visualization */}
        <div className="relative flex flex-col items-center">
          <svg
            viewBox="0 0 200 120"
            className="w-full max-w-sm"
            style={{ maxHeight: '160px' }}
          >
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="oklch(0.95 0.01 230)"
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Green Zone (0-30) */}
            <path
              d="M 20 100 A 80 80 0 0 1 68 28"
              fill="none"
              stroke="oklch(0.7 0.12 145)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Yellow Zone (30-70) */}
            <path
              d="M 68 28 A 80 80 0 0 1 132 28"
              fill="none"
              stroke="oklch(0.8 0.15 85)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Red Zone (70-100) */}
            <path
              d="M 132 28 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="oklch(0.6 0.15 25)"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Active Progress Arc */}
            <path
              d={getProgressArc(data.load)}
              fill="none"
              stroke={loadColor}
              strokeWidth="20"
              strokeLinecap="round"
            />

            {/* Needle */}
            <g transform={`rotate(${-90 + (data.load / 100) * 180} 100 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="35"
                stroke="oklch(0.3 0.05 230)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="6" fill="oklch(0.3 0.05 230)" />
            </g>

            {/* Zone Labels */}
            <text
              x="30"
              y="115"
              fontSize="10"
              fill="oklch(0.6 0.05 230)"
              textAnchor="start"
            >
              0
            </text>
            <text
              x="100"
              y="20"
              fontSize="10"
              fill="oklch(0.6 0.05 230)"
              textAnchor="middle"
            >
              50
            </text>
            <text
              x="170"
              y="115"
              fontSize="10"
              fill="oklch(0.6 0.05 230)"
              textAnchor="end"
            >
              100
            </text>
          </svg>

          {/* Current Value Display */}
          <div className="absolute bottom-0 text-center">
            <div className="text-4xl font-bold" style={{ color: loadColor }}>
              {Math.round(data.load)}
            </div>
            <Badge
              variant="outline"
              className="mt-1 px-3 py-1 font-semibold"
              style={{
                backgroundColor: `${loadColor}/0.1`,
                borderColor: loadColor,
                color: loadColor,
              }}
            >
              {zoneLabel} Load
            </Badge>
          </div>
        </div>

        {/* Trend Sparkline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              7-Day Trend
            </span>
            <div className="flex items-center gap-1">
              {trendDirection === 'up' && (
                <TrendingUp className="size-4" style={{ color: 'oklch(0.6 0.15 25)' }} />
              )}
              {trendDirection === 'down' && (
                <TrendingDown className="size-4" style={{ color: 'oklch(0.7 0.12 145)' }} />
              )}
              {trendDirection === 'stable' && (
                <Minus className="size-4" style={{ color: 'oklch(0.6 0.05 230)' }} />
              )}
              <span className="text-xs font-medium" style={{ color: 'oklch(0.6 0.05 230)' }}>
                {trendDirection === 'up' && 'Increasing'}
                {trendDirection === 'down' && 'Decreasing'}
                {trendDirection === 'stable' && 'Stable'}
              </span>
            </div>
          </div>

          <div className="h-16 flex items-end gap-1">
            {data.trend.map((value, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-t transition-all hover:brightness-90"
                style={{
                  height: `${(value / 100) * 100}%`,
                  backgroundColor: getLoadColor(value),
                  opacity: idx === data.trend.length - 1 ? 1 : 0.6,
                }}
              />
            ))}
          </div>

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Recommendation */}
        <div
          className="p-4 rounded-lg space-y-2"
          style={{
            backgroundColor: `${loadColor}/0.1`,
            borderLeft: `3px solid ${loadColor}`,
          }}
        >
          <div className="flex items-start gap-2">
            {data.load >= 70 ? (
              <AlertTriangle className="size-5 shrink-0 mt-0.5" style={{ color: loadColor }} />
            ) : (
              <Info className="size-5 shrink-0 mt-0.5" style={{ color: loadColor }} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">Recommendation</p>
              <p className="text-sm text-muted-foreground">{data.recommendation}</p>
            </div>
          </div>
        </div>

        {/* Zone Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'oklch(0.7 0.12 145)' }}
            />
            <span className="text-muted-foreground">Optimal (0-30)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'oklch(0.8 0.15 85)' }}
            />
            <span className="text-muted-foreground">Moderate (30-70)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'oklch(0.6 0.15 25)' }}
            />
            <span className="text-muted-foreground">High (70-100)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Helper: Calculate SVG path for progress arc
 */
function getProgressArc(load: number): string {
  const percentage = Math.min(load, 100) / 100;
  const angle = -90 + percentage * 180;
  const radians = (angle * Math.PI) / 180;

  const x = 100 + 80 * Math.cos(radians);
  const y = 100 + 80 * Math.sin(radians);

  const largeArc = percentage > 0.5 ? 1 : 0;

  return `M 20 100 A 80 80 0 ${largeArc} 1 ${x} ${y}`;
}

/**
 * Helper: Determine trend direction from array
 */
function getTrendDirection(trend: number[]): 'up' | 'down' | 'stable' {
  if (trend.length < 2) return 'stable';

  const first = trend[0];
  const last = trend[trend.length - 1];
  const diff = last - first;

  if (Math.abs(diff) < 5) return 'stable';
  return diff > 0 ? 'up' : 'down';
}
